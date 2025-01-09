<?php
if (! defined('ABSPATH')) {
    exit;
}

class MyGraphView_DataBuilder
{

    /**
     * Build a global, full-site graph of all content (pages, posts, CPTs).
     * Creates edges for:
     *  - Parent/child
     *  - Internal links
     *  - Shared taxonomy (i.e., 2 posts share a common term)
     */
    public static function build_full_graph_data()
    {
        $nodes = array();
        $edges = array();

        // 1. Gather any "context" post types. Add yours if needed.
        //    Example includes: 'post', 'page', 'your_custom_post_type'
        $args = array(
            'post_type'      => array('post', 'page'),
            'posts_per_page' => -1
        );
        $all_posts = get_posts($args);

        // 2. Create a node for each post
        foreach ($all_posts as $p) {
            $nodes[] = array(
                'data' => array(
                    'id'    => (string) $p->ID,
                    'label' => $p->post_title,
                    'type'  => $p->post_type // e.g. post, page, etc.
                )
            );
        }

        // 3. We’ll create an adjacency list in memory to handle “shared taxonomy” more easily
        //    For each post, store term IDs so we can see if they match other posts.
        $post_terms_map = array(); // $post_terms_map[ <postID> ] = [termID, termID, ...]
        foreach ($all_posts as $p) {
            $post_terms_map[$p->ID] = array();
            $taxonomies = get_object_taxonomies($p->post_type);
            foreach ($taxonomies as $taxonomy) {
                $terms = wp_get_post_terms($p->ID, $taxonomy);
                foreach ($terms as $term) {
                    $post_terms_map[$p->ID][] = $term->term_id;
                }
            }
        }

        // 4. Build edges for each post
        foreach ($all_posts as $p) {
            $pid = (int) $p->ID;
            // A) Parent-child (for hierarchical post types like 'page')
            if ($p->post_parent && $p->post_parent != 0) {
                $edges[] = array(
                    'data' => array(
                        'id'           => 'parent-' . $pid . '-' . $p->post_parent,
                        'source'       => (string) $pid,
                        'target'       => (string) $p->post_parent,
                        'relationship' => 'parent'
                    )
                );
            }

            // If it has children
            $children = get_posts(array(
                'post_parent' => $pid,
                'post_type'   => $p->post_type,
                'numberposts' => -1,
            ));
            foreach ($children as $child) {
                $edges[] = array(
                    'data' => array(
                        'id'           => 'child-' . $pid . '-' . $child->ID,
                        'source'       => (string) $pid,
                        'target'       => (string) $child->ID,
                        'relationship' => 'child'
                    )
                );
            }

            // B) Internal links
            $content = $p->post_content;
            if (preg_match_all('/<a[^>]+href=[\'"]([^\'"]+)[\'"][^>]*>/i', $content, $matches)) {
                foreach ($matches[1] as $link) {
                    $linked_post_id = url_to_postid($link);
                    if ($linked_post_id && $linked_post_id !== $pid) {
                        $edges[] = array(
                            'data' => array(
                                'id'           => 'link-' . $pid . '-' . $linked_post_id . '-' . wp_rand(),
                                'source'       => (string) $pid,
                                'target'       => (string) $linked_post_id,
                                'relationship' => 'internal_link'
                            )
                        );
                    }
                }
            }
        }

        // 5. Shared taxonomy edges: for any two posts that share a term
        //    We do a naive approach: compare all pairs. For large sites, you’d want a more efficient approach.
        $countPosts = count($all_posts);
        for ($i = 0; $i < $countPosts; $i++) {
            for ($j = $i + 1; $j < $countPosts; $j++) {
                $p1 = $all_posts[$i];
                $p2 = $all_posts[$j];
                $pid1 = (int) $p1->ID;
                $pid2 = (int) $p2->ID;

                // If they share at least one term
                $shared = array_intersect($post_terms_map[$pid1], $post_terms_map[$pid2]);
                if (! empty($shared)) {
                    // We’ll just create one edge for “shared taxonomy”
                    $edges[] = array(
                        'data' => array(
                            'id'           => 'shared-tax-' . $pid1 . '-' . $pid2,
                            'source'       => (string) $pid1,
                            'target'       => (string) $pid2,
                            'relationship' => 'shared_taxonomy'
                        )
                    );
                }
            }
        }

        return array(
            'nodes' => $nodes,
            'edges' => $edges
        );
    }

    /**
     * Build local graph data for a single post ID.
     *  - Limit to a certain number of edges
     *  - Only show context items as nodes (no standalone taxonomy nodes).
     *  - Edges from parent-child, internal links referencing this post,
     *    and also posts that share any taxonomy with this one (still limited).
     */
    public static function build_local_graph_data($post_id, $max_edges = 20)
    {
        $current_post = get_post($post_id);
        if (!$current_post) {
            throw new Exception('Post not found');
        }

        $nodes = [];
        $edges = [];

        // Add current post as central node with special styling
        $nodes[] = [
            'data' => [
                'id' => (string)$post_id,
                'label' => $current_post->post_title,
                'type' => 'post',
                'isCurrent' => true // Special flag for styling
            ]
        ];

        // Get connected posts (both incoming and outgoing links)
        $connected_posts = self::get_connected_posts($post_id, $max_edges);

        foreach ($connected_posts as $connected) {
            // Add connected post node
            $nodes[] = [
                'data' => [
                    'id' => (string)$connected['post']->ID,
                    'label' => $connected['post']->post_title,
                    'type' => 'post',
                    'isCurrent' => false
                ]
            ];

            // Add edge showing relationship
            $edges[] = [
                'data' => [
                    'id' => "e{$post_id}-{$connected['post']->ID}",
                    'source' => $connected['direction'] === 'outgoing' ? (string)$post_id : (string)$connected['post']->ID,
                    'target' => $connected['direction'] === 'outgoing' ? (string)$connected['post']->ID : (string)$post_id,
                    'relationship' => $connected['type']
                ]
            ];
        }

        return [
            'nodes' => $nodes,
            'edges' => $edges
        ];
    }

    private static function get_connected_posts($post_id, $max_edges)
    {
        $connected = [];
        $current_post = get_post($post_id);

        // 1. Parent relationship
        if ($current_post->post_parent && $current_post->post_parent != 0) {
            $parent = get_post($current_post->post_parent);
            if ($parent) {
                $connected[] = [
                    'post' => $parent,
                    'type' => 'parent',
                    'direction' => 'outgoing'
                ];
            }
        }

        // 2. Child relationships
        $children = get_posts([
            'post_parent' => $post_id,
            'post_type' => $current_post->post_type,
            'numberposts' => -1,
        ]);
        foreach ($children as $child) {
            $connected[] = [
                'post' => $child,
                'type' => 'child',
                'direction' => 'outgoing'
            ];
        }

        // 3. Internal links in content (outgoing)
        if (preg_match_all('/<a[^>]+href=[\'"]([^\'"]+)[\'"][^>]*>/i', $current_post->post_content, $matches)) {
            foreach ($matches[1] as $link) {
                $linked_post_id = url_to_postid($link);
                if ($linked_post_id && $linked_post_id !== $post_id) {
                    $linked_post = get_post($linked_post_id);
                    if ($linked_post) {
                        $connected[] = [
                            'post' => $linked_post,
                            'type' => 'internal_link',
                            'direction' => 'outgoing'
                        ];
                    }
                }
            }
        }

        // 4. Posts linking to this post (incoming)
        $linking_posts = get_posts([
            'post_type' => 'any',
            'posts_per_page' => 10,
            'post__not_in' => [$post_id],
            's' => get_permalink($post_id), // Search for posts containing this URL
            'suppress_filters' => false
        ]);
        foreach ($linking_posts as $linking_post) {
            if (strpos($linking_post->post_content, get_permalink($post_id)) !== false) {
                $connected[] = [
                    'post' => $linking_post,
                    'type' => 'internal_link',
                    'direction' => 'incoming'
                ];
            }
        }

        // 5. Shared taxonomy relationships
        $taxonomies = get_object_taxonomies($current_post->post_type);
        $current_post_terms = [];
        foreach ($taxonomies as $tax) {
            $terms = wp_get_post_terms($post_id, $tax);
            foreach ($terms as $term) {
                $current_post_terms[] = $term->term_id;
            }
        }

        if (!empty($current_post_terms)) {
            $related_posts = get_posts([
                'post_type' => $current_post->post_type,
                'posts_per_page' => 10,
                'post__not_in' => [$post_id],
                'tax_query' => [
                    [
                        'taxonomy' => $taxonomies,
                        'field' => 'term_id',
                        'terms' => $current_post_terms,
                        'operator' => 'IN'
                    ]
                ]
            ]);

            foreach ($related_posts as $related) {
                $connected[] = [
                    'post' => $related,
                    'type' => 'shared_taxonomy',
                    'direction' => 'outgoing'
                ];
            }
        }

        // Limit the number of connections if needed
        if (count($connected) > $max_edges) {
            $connected = array_slice($connected, 0, $max_edges);
        }

        return $connected;
    }
}
