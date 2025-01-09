<?php

/**
 * Plugin Name:       My Graph View
 * Description:       Visualize your WordPress content in an Obsidian-like graph using Cytoscape.js.
 * Version:           1.1.0
 * Author:            Your Name
 * License:           GPL-2.0-or-later
 */

if (! defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// Require plugin classes
require_once plugin_dir_path(__FILE__) . 'includes/class-mygraphview-databuilder.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-mygraphview-rest.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-mygraphview-adminpage.php';

define('MYGRAPHVIEW_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MYGRAPHVIEW_VERSION', '1.1.0');

// Default setting for auto-inserting the mini graph
register_activation_hook(__FILE__, 'mygraphview_set_default_options');
function mygraphview_set_default_options()
{
    if (! get_option('mygraphview_auto_insert')) {
        // 'yes' or 'no'
        update_option('mygraphview_auto_insert', 'yes');
    }
}

/**
 * Initialize plugin
 */
function mygraphview_init_plugin()
{
    // Register REST routes on rest_api_init
    add_action('rest_api_init', array('MyGraphView_REST', 'register_routes'));

    // Enqueue scripts for front-end
    add_action('wp_enqueue_scripts', 'mygraphview_enqueue_front_end_scripts');

    // Enqueue scripts for admin
    add_action('admin_enqueue_scripts', 'mygraphview_enqueue_admin_scripts');

    // Add admin page
    add_action('admin_menu', 'mygraphview_register_admin_page');
}
add_action('plugins_loaded', 'mygraphview_init_plugin');

/**
 * Enqueue front-end scripts
 */
function mygraphview_enqueue_front_end_scripts()
{
    // Only load if "auto-insert" setting is enabled and we’re on single post/page
    $auto_insert = get_option('mygraphview_auto_insert', 'yes');
    if (($auto_insert === 'yes') && (is_single() || is_page())) {
        wp_enqueue_script(
            'cytoscape',
            'https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.30.4/cytoscape.min.js',
            array(),
            '3.30.4',
            false  // Load in header
        );
        wp_enqueue_script(
            'dagre',
            'https://cdnjs.cloudflare.com/ajax/libs/dagre/0.8.5/dagre.min.js',
            array(),
            '0.8.5',
            false  // Load in header
        );
        wp_enqueue_script(
            'cytoscape-dagre',
            'https://cdn.jsdelivr.net/npm/cytoscape-dagre@2.5.0/cytoscape-dagre.min.js',
            array('cytoscape', 'dagre'),
            '2.5.0',
            false  // Load in header
        );
        wp_enqueue_script(
            'layout-base',
            'https://cdn.jsdelivr.net/npm/layout-base@2.0.1/layout-base.min.js',
            array(),
            '2.0.1',
            false  // Load in header
        );
        wp_enqueue_script(
            'cytoscape-cose-bilkent',
            'https://cdn.jsdelivr.net/npm/cytoscape-cose-bilkent@4.1.0/cytoscape-cose-bilkent.min.js',
            array('cytoscape', 'layout-base'),
            '4.1.0',
            false  // Load in header
        );
        wp_enqueue_script(
            'mygraphview-frontend',
            plugins_url('public/graph-view.js', __FILE__),
            array('cytoscape', 'cytoscape-cose-bilkent', 'cytoscape-dagre', 'jquery'),
            MYGRAPHVIEW_VERSION,
            true   // Load in footer
        );

        // Pass the post ID and REST URL to the script
        wp_localize_script('mygraphview-frontend', 'myGraphViewData', array(
            'restUrl'        => esc_url_raw(rest_url('mygraphview/v1')),
            'currentPostId'  => get_the_ID() ? get_the_ID() : 0,
            'themeColors'    => mygraphview_get_theme_colors()
        ));
    }
}

/**
 * Get theme colors with fallbacks
 */
function mygraphview_get_theme_colors()
{
    $colors = array(
        'primary' => '#9370DB',     // Default purple
        'secondary' => '#444444',   // Default dark grey
        'tertiary' => '#cccccc',    // Default light grey
    );

    // Try to get theme.json colors
    $global_settings = wp_get_global_settings();
    $color_palette = $global_settings['color']['palette'] ?? [];

    if (!empty($color_palette)) {
        // Look for specific colors by slug patterns
        foreach ($color_palette as $color) {
            // Skip if color doesn't have required keys
            if (!isset($color['slug']) || !isset($color['color'])) {
                continue;
            }

            $slug = $color['slug'];
            // Primary color (for hover and highlights)
            if (strpos($slug, 'primary') !== false || strpos($slug, 'main') !== false) {
                $colors['primary'] = $color['color'];
            }
            // Secondary color (for nodes)
            elseif (strpos($slug, 'secondary') !== false || strpos($slug, 'contrast') !== false) {
                $colors['secondary'] = $color['color'];
            }
            // Tertiary color (for edges)
            elseif (strpos($slug, 'tertiary') !== false || strpos($slug, 'muted') !== false) {
                $colors['tertiary'] = $color['color'];
            }
        }

        // If we didn't find specific matches, use the first few colors
        if ($colors['primary'] === '#9370DB' && !empty($color_palette[0])) {
            $colors['primary'] = $color_palette[0]['color'];
        }
        if ($colors['secondary'] === '#444444' && !empty($color_palette[1])) {
            $colors['secondary'] = $color_palette[1]['color'];
        }
        if ($colors['tertiary'] === '#cccccc' && !empty($color_palette[2])) {
            $colors['tertiary'] = $color_palette[2]['color'];
        }
    }

    return $colors;
}

/**
 * Enqueue admin scripts
 */
function mygraphview_enqueue_admin_scripts()
{
    $screen = get_current_screen();
    if (isset($screen->id) && $screen->id === 'toplevel_page_mygraphview-admin') {
        // Cytoscape
        wp_enqueue_script(
            'cytoscape',
            'https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.30.4/cytoscape.min.js',
            array(),
            '3.30.4',
            false
        );
        wp_enqueue_script(
            'dagre',
            'https://cdnjs.cloudflare.com/ajax/libs/dagre/0.8.5/dagre.min.js',
            array(),
            '0.8.5',
            false
        );
        wp_enqueue_script(
            'cytoscape-dagre',
            'https://cdn.jsdelivr.net/npm/cytoscape-dagre@2.5.0/cytoscape-dagre.min.js',
            array('cytoscape', 'dagre'),
            '2.5.0',
            false
        );
        wp_enqueue_script(
            'layout-base',
            'https://cdn.jsdelivr.net/npm/layout-base@2.0.1/layout-base.min.js',
            array(),
            '2.0.1',
            false
        );
        wp_enqueue_script(
            'cytoscape-cose-bilkent',
            'https://cdn.jsdelivr.net/npm/cytoscape-cose-bilkent@4.1.0/cytoscape-cose-bilkent.min.js',
            array('cytoscape', 'layout-base'),
            '4.1.0',
            false
        );

        // Admin script
        wp_enqueue_script(
            'mygraphview-admin',
            plugins_url('admin/admin.js', __FILE__),
            array('jquery', 'cytoscape', 'cytoscape-cose-bilkent', 'cytoscape-dagre'),
            MYGRAPHVIEW_VERSION,
            true
        );

        // Pass data
        wp_localize_script('mygraphview-admin', 'myGraphViewAdminData', array(
            'restUrl' => esc_url_raw(rest_url('mygraphview/v1')),
            'nonce'   => wp_create_nonce('wp_rest'),
            'themeColors' => mygraphview_get_theme_colors()
        ));
    }
}

/**
 * Register Admin Page
 */
function mygraphview_register_admin_page()
{
    add_menu_page(
        __('My Graph View', 'my-graph-view'),
        __('My Graph View', 'my-graph-view'),
        'manage_options',
        'mygraphview-admin',
        array('MyGraphView_AdminPage', 'render'),
        'dashicons-networking',
        90
    );
}
