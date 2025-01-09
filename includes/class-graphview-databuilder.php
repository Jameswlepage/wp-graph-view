<?php
if (!defined('ABSPATH')) {
    exit;
}

class graphview_DataBuilder
{
    /**
     * Build a global, full-site graph of all content.
     * Creates edges for:
     *  - Parent/child
     *  - Internal links
     *  - Shared taxonomy
     */
    public static function build_full_graph_data()
    {
        $nodes = array();
        $edges = array();

        // Example post types: 'post', 'page'
        $args = array(
            'post_type'      => array('post', 'page'),
            'posts_per_page' => -1
        );
        $all_posts = get_posts($args);

        // Create a node for each post
        foreach ($all_posts as $p) {
            $nodes[] = array(
                'data' => array(
                    'id'        => (string)$p->ID,
                    'label'     => $p->post_title,
                    'type'      => $p->post_type,
                    'excerpt'   => wp_trim_words(get_the_excerpt($p), 20),
                    'taxonomies' => self::get_post_taxonomies($p->ID)
                )
            );
        }

        // Build adjacency list for shared taxonomy
        $post_terms_map = array();
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

        // Build edges for parent-child, children, and internal links
        foreach ($all_posts as $p) {
            $pid = (int) $p->ID;

            // Parent edge
            if ($p->post_parent && $p->post_parent != 0) {
                $edges[] = array(
                    'data' => array(
                        'id'           => 'parent-' . $pid . '-' . $p->post_parent,
                        'source'       => (string) $pid,
                        'target'       => (string) $p->post_parent,
                        'relationship' => 'parent',
                        'source_title' => get_the_title($pid),
                        'target_title' => get_the_title($p->post_parent)
                    )
                );
            }

            // Child edges
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
                        'relationship' => 'child',
                        'source_title' => get_the_title($pid),
                        'target_title' => get_the_title($child->ID)
                    )
                );
            }

            // Internal links
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
                                'relationship' => 'internal_link',
                                'source_title' => get_the_title($pid),
                                'target_title' => get_the_title($linked_post_id)
                            )
                        );
                    }
                }
            }
        }

        // Build edges for shared taxonomy
        $countPosts = count($all_posts);
        for ($i = 0; $i < $countPosts; $i++) {
            for ($j = $i + 1; $j < $countPosts; $j++) {
                $p1 = $all_posts[$i];
                $p2 = $all_posts[$j];
                $pid1 = (int) $p1->ID;
                $pid2 = (int) $p2->ID;

                $shared = array_intersect($post_terms_map[$pid1], $post_terms_map[$pid2]);
                if (!empty($shared)) {
                    // Get the shared taxonomy terms
                    $shared_terms = array();
                    $taxonomies = get_object_taxonomies($p1->post_type);
                    foreach ($taxonomies as $taxonomy) {
                        $terms1 = wp_get_post_terms($pid1, $taxonomy, array('fields' => 'names'));
                        $terms2 = wp_get_post_terms($pid2, $taxonomy, array('fields' => 'names'));
                        $shared_term_names = array_intersect($terms1, $terms2);
                        if (!empty($shared_term_names)) {
                            $shared_terms = array(
                                'taxonomy' => get_taxonomy($taxonomy)->labels->singular_name,
                                'terms' => array_values($shared_term_names)
                            );
                            break; // Use the first shared taxonomy found
                        }
                    }

                    $edges[] = array(
                        'data' => array(
                            'id'           => 'shared-tax-' . $pid1 . '-' . $pid2,
                            'source'       => (string) $pid1,
                            'target'       => (string) $pid2,
                            'relationship' => 'shared_taxonomy',
                            'source_title' => get_the_title($pid1),
                            'target_title' => get_the_title($pid2),
                            'shared_terms' => $shared_terms
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
     * Build local graph data for a single post ID
     */
    public static function build_local_graph_data($post_id, $max_edges = 20)
    {
        $current_post = get_post($post_id);
        if (!$current_post) {
            throw new Exception('Post not found');
        }

        $nodes = [];
        $edges = [];

        // Add current post
        $nodes[] = [
            'data' => [
                'id'        => (string)$post_id,
                'label'     => $current_post->post_title,
                'type'      => $current_post->post_type,
                'isCurrent' => true
            ]
        ];

        // Collect connected posts
        $connected_posts = self::get_connected_posts($post_id, $max_edges);

        foreach ($connected_posts as $connected) {
            $nodes[] = [
                'data' => [
                    'id'    => (string)$connected['post']->ID,
                    'label' => $connected['post']->post_title,
                    'type'  => $connected['post']->post_type,
                ]
            ];

            $edges[] = [
                'data' => [
                    'id'           => "e{$post_id}-{$connected['post']->ID}",
                    'source'       => $connected['direction'] === 'outgoing' ? (string)$post_id : (string)$connected['post']->ID,
                    'target'       => $connected['direction'] === 'outgoing' ? (string)$connected['post']->ID : (string)$post_id,
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

        // Parent
        if ($current_post->post_parent && $current_post->post_parent != 0) {
            $parent = get_post($current_post->post_parent);
            if ($parent) {
                $connected[] = [
                    'post'      => $parent,
                    'type'      => 'parent',
                    'direction' => 'outgoing'
                ];
            }
        }

        // Children
        $children = get_posts([
            'post_parent' => $post_id,
            'post_type'   => $current_post->post_type,
            'numberposts' => -1,
        ]);
        foreach ($children as $child) {
            $connected[] = [
                'post'      => $child,
                'type'      => 'child',
                'direction' => 'outgoing'
            ];
        }

        // Outgoing internal links
        if (preg_match_all('/<a[^>]+href=[\'"]([^\'"]+)[\'"][^>]*>/i', $current_post->post_content, $matches)) {
            foreach ($matches[1] as $link) {
                $linked_post_id = url_to_postid($link);
                if ($linked_post_id && $linked_post_id !== $post_id) {
                    $linked_post = get_post($linked_post_id);
                    if ($linked_post) {
                        $connected[] = [
                            'post'      => $linked_post,
                            'type'      => 'internal_link',
                            'direction' => 'outgoing'
                        ];
                    }
                }
            }
        }

        // Incoming links
        $linking_posts = get_posts([
            'post_type'      => 'any',
            'posts_per_page' => 10,
            'post__not_in'   => [$post_id],
            's'              => get_permalink($post_id),
            'suppress_filters' => false
        ]);
        foreach ($linking_posts as $linking_post) {
            if (strpos($linking_post->post_content, get_permalink($post_id)) !== false) {
                $connected[] = [
                    'post'      => $linking_post,
                    'type'      => 'internal_link',
                    'direction' => 'incoming'
                ];
            }
        }

        // Shared taxonomy
        $taxonomies = get_object_taxonomies($current_post->post_type);
        $current_post_terms = [];
        $tax_queries = [];

        foreach ($taxonomies as $tax) {
            $terms = wp_get_post_terms($post_id, $tax);
            if (!empty($terms)) {
                $term_ids = wp_list_pluck($terms, 'term_id');
                if (!empty($term_ids)) {
                    $tax_queries[] = [
                        'taxonomy' => $tax,
                        'field'    => 'term_id',
                        'terms'    => $term_ids,
                    ];
                }
            }
        }

        if (!empty($tax_queries)) {
            $related_posts = get_posts([
                'post_type'      => $current_post->post_type,
                'posts_per_page' => 10,
                'post__not_in'   => [$post_id],
                'tax_query' => [
                    'relation' => 'OR',
                    ...$tax_queries
                ]
            ]);

            foreach ($related_posts as $related) {
                // Find which taxonomy terms are shared
                $shared_tax_info = null;
                foreach ($taxonomies as $tax) {
                    $current_terms = wp_get_post_terms($post_id, $tax, ['fields' => 'names']);
                    $related_terms = wp_get_post_terms($related->ID, $tax, ['fields' => 'names']);
                    $shared_terms = array_intersect($current_terms, $related_terms);
                    if (!empty($shared_terms)) {
                        $shared_tax_info = [
                            'taxonomy' => get_taxonomy($tax)->labels->singular_name,
                            'terms' => array_values($shared_terms)
                        ];
                        break;
                    }
                }

                $connected[] = [
                    'post'      => $related,
                    'type'      => 'shared_taxonomy',
                    'direction' => 'outgoing',
                    'shared_terms' => $shared_tax_info
                ];
            }
        }

        // Limit
        if (count($connected) > $max_edges) {
            $connected = array_slice($connected, 0, $max_edges);
        }

        return $connected;
    }

    /**
     * Gather taxonomy data for each post
     */
    private static function get_post_taxonomies($post_id)
    {
        $taxonomies = get_object_taxonomies(get_post_type($post_id));
        $tax_data = array();

        foreach ($taxonomies as $taxonomy) {
            $terms = get_the_terms($post_id, $taxonomy);
            if ($terms && !is_wp_error($terms)) {
                $tax_data[] = array(
                    'taxonomy' => get_taxonomy($taxonomy)->labels->singular_name,
                    'terms'    => wp_list_pluck($terms, 'name')
                );
            }
        }
        return $tax_data;
    }
}
