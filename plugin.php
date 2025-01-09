<?php

/**
 * Plugin Name:       Graph View
 * Description:       Visualize your WordPress content in a Graph View, similar to Obsidian. Support for Admin, Gutenberg, and Frontend.
 * Version:           2.0.0
 * Author:            James LePage
 * Author URI:        https://www.j.cv
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 */

if (!defined('ABSPATH')) {
    exit;
}

define('graphview_VERSION', '2.0.0');
define('graphview_PLUGIN_URL', plugin_dir_url(__FILE__));
define('graphview_PLUGIN_DIR', plugin_dir_path(__FILE__));

// Include core classes
require_once graphview_PLUGIN_DIR . 'includes/class-graphview-databuilder.php';
require_once graphview_PLUGIN_DIR . 'includes/class-graphview-rest.php';
require_once graphview_PLUGIN_DIR . 'includes/class-graphview-adminpage.php';

// Set default options on activation
register_activation_hook(__FILE__, 'graphview_set_default_options');
function graphview_set_default_options()
{
    if (!get_option('graphview_auto_insert')) {
        update_option('graphview_auto_insert', 'yes');
    }
    if (!get_option('graphview_position')) {
        update_option('graphview_position', 'below');
    }
}

/**
 * Initialize the plugin
 */
function graphview_init_plugin()
{
    // Register REST routes
    add_action('rest_api_init', array('graphview_REST', 'register_routes'));

    // Enqueue our built React scripts in admin
    add_action('admin_enqueue_scripts', 'graphview_enqueue_admin_scripts');

    // Enqueue our built React scripts on the front end
    add_action('wp_enqueue_scripts', 'graphview_enqueue_frontend_scripts');

    // Enqueue Gutenberg sidebar script
    add_action('enqueue_block_editor_assets', 'graphview_enqueue_gutenberg_scripts');

    // Add admin menu
    add_action('admin_menu', 'graphview_register_admin_page');

    // Handle content insertion based on position setting
    $auto_insert = get_option('graphview_auto_insert', 'yes');
    if ($auto_insert === 'yes') {
        $position = get_option('graphview_position', 'below');
        if ($position === 'above') {
            add_filter('the_content', 'graphview_prepend_to_content', 5);
        } else {
            add_filter('the_content', 'graphview_append_to_content', 20);
        }
    }
}
add_action('plugins_loaded', 'graphview_init_plugin');

/**
 * Add graph above content
 */
function graphview_prepend_to_content($content)
{
    if (!is_single() && !is_page()) {
        return $content;
    }

    $graph_container = '<div id="graphview-frontend-root"></div>';
    return $graph_container . $content;
}

/**
 * Add graph below content
 */
function graphview_append_to_content($content)
{
    if (!is_single() && !is_page()) {
        return $content;
    }

    $graph_container = '<div id="graphview-frontend-root"></div>';
    return $content . $graph_container;
}

/**
 * Enqueue the admin bundle
 */
function graphview_enqueue_admin_scripts()
{
    $screen = get_current_screen();
    if (!isset($screen->id)) {
        return;
    }

    // Only load on our plugin's admin page
    if ($screen->id === 'toplevel_page_graphview') {
        // Enqueue the compiled React admin script
        wp_enqueue_script(
            'graphview-admin-bundle',
            graphview_PLUGIN_URL . 'build/admin.js',
            array('wp-element', 'wp-components'),
            graphview_VERSION,
            true
        );

        // Provide REST URL, nonce, settings, etc. to the script
        wp_localize_script('graphview-admin-bundle', 'graphviewAdminData', array(
            'restUrl'        => esc_url_raw(rest_url('graphview/v1')),
            'nonce'          => wp_create_nonce('wp_rest'),
            'themeColors'    => graphview_get_theme_colors(),
        ));
    }
}

/**
 * Enqueue the frontend bundle
 */
function graphview_enqueue_frontend_scripts()
{
    $auto_insert = get_option('graphview_auto_insert', 'yes');
    if (($auto_insert === 'yes') && (is_single() || is_page())) {
        // Register React and ReactDOM
        wp_register_script('react', 'https://unpkg.com/react@18/umd/react.production.min.js', array(), '18.0.0', true);
        wp_register_script('react-dom', 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', array('react'), '18.0.0', true);

        // Enqueue the compiled React front-end script
        wp_enqueue_script(
            'graphview-frontend-bundle',
            graphview_PLUGIN_URL . 'build/frontend.js',
            array('react', 'react-dom', 'wp-components', 'wp-element'),
            graphview_VERSION,
            true
        );

        // Get current post URL for comparison
        $current_post_id = get_the_ID();
        $current_post_url = get_permalink($current_post_id);

        // Pass data
        wp_localize_script('graphview-frontend-bundle', 'graphviewData', array(
            'restUrl'       => esc_url_raw(rest_url('graphview/v1')),
            'currentPostId' => $current_post_id ? $current_post_id : 0,
            'currentPostUrl' => $current_post_url,
            'themeColors'   => graphview_get_theme_colors(),
        ));
    }
}

/**
 * Basic function to pull theme colors
 */
function graphview_get_theme_colors()
{
    // Fallback color set; adjust as desired
    $colors = array(
        'primary'   => '#9370DB',
        'secondary' => '#444444',
        'tertiary'  => '#cccccc',
    );

    // If you want to read from theme.json or global settings, do so here...
    // For brevity, we just return the fallback array

    return $colors;
}

/**
 * Register the Admin Menu
 */
function graphview_register_admin_page()
{
    add_menu_page(
        __('Graph View', 'my-graph-view'),
        __('Graph View', 'my-graph-view'),
        'manage_options',
        'graphview',
        array('graphview_AdminPage', 'render_graph'),
        'dashicons-networking',
        90
    );

    add_submenu_page(
        'graphview',
        __('Graph Settings', 'my-graph-view'),
        __('Settings', 'my-graph-view'),
        'manage_options',
        'graphview-settings',
        array('graphview_AdminPage', 'render_settings')
    );
}

/**
 * Enqueue the Gutenberg sidebar script
 */
function graphview_enqueue_gutenberg_scripts()
{
    wp_enqueue_script(
        'graphview-gutenberg',
        graphview_PLUGIN_URL . 'build/gutenberg.js',
        array(
            'wp-plugins',
            'wp-edit-post',
            'wp-components',
            'wp-i18n',
            'wp-data',
            'wp-element',
            'react',
            'react-dom'
        ),
        graphview_VERSION,
        true
    );

    // Pass data to the script
    wp_localize_script('graphview-gutenberg', 'graphviewData', array(
        'restUrl'     => esc_url_raw(rest_url('graphview/v1')),
        'nonce'       => wp_create_nonce('wp_rest'),
        'themeColors' => graphview_get_theme_colors(),
    ));
}
