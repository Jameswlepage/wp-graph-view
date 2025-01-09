<?php

/**
 * Plugin Name:       My Graph View
 * Description:       Visualize your WordPress content in a React-based Cytoscape.js graph.
 * Version:           2.0.0
 * Author:            Your Name
 * License:           GPL-2.0-or-later
 */

if (!defined('ABSPATH')) {
    exit;
}

define('MYGRAPHVIEW_VERSION', '2.0.0');
define('MYGRAPHVIEW_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MYGRAPHVIEW_PLUGIN_DIR', plugin_dir_path(__FILE__));

// Include core classes
require_once MYGRAPHVIEW_PLUGIN_DIR . 'includes/class-mygraphview-databuilder.php';
require_once MYGRAPHVIEW_PLUGIN_DIR . 'includes/class-mygraphview-rest.php';
require_once MYGRAPHVIEW_PLUGIN_DIR . 'includes/class-mygraphview-adminpage.php';

// Set default options on activation
register_activation_hook(__FILE__, 'mygraphview_set_default_options');
function mygraphview_set_default_options()
{
    if (!get_option('mygraphview_auto_insert')) {
        update_option('mygraphview_auto_insert', 'yes');
    }
}

/**
 * Initialize the plugin
 */
function mygraphview_init_plugin()
{
    // Register REST routes
    add_action('rest_api_init', array('MyGraphView_REST', 'register_routes'));

    // Enqueue our built React scripts in admin
    add_action('admin_enqueue_scripts', 'mygraphview_enqueue_admin_scripts');

    // Enqueue our built React scripts on the front end
    add_action('wp_enqueue_scripts', 'mygraphview_enqueue_frontend_scripts');

    // Add admin menu
    add_action('admin_menu', 'mygraphview_register_admin_page');
}
add_action('plugins_loaded', 'mygraphview_init_plugin');

/**
 * Enqueue the admin bundle
 */
function mygraphview_enqueue_admin_scripts()
{
    $screen = get_current_screen();
    if (!isset($screen->id)) {
        return;
    }

    // Only load on our plugin's admin page
    if ($screen->id === 'toplevel_page_graphview') {
        // Enqueue the compiled React admin script
        wp_enqueue_script(
            'mygraphview-admin-bundle',
            MYGRAPHVIEW_PLUGIN_URL . 'build/admin.js',
            array('wp-element'), // or empty array if not using WP's React
            MYGRAPHVIEW_VERSION,
            true
        );

        // Provide REST URL, nonce, settings, etc. to the script
        wp_localize_script('mygraphview-admin-bundle', 'myGraphViewAdminData', array(
            'restUrl'        => esc_url_raw(rest_url('mygraphview/v1')),
            'nonce'          => wp_create_nonce('wp_rest'),
            'themeColors'    => mygraphview_get_theme_colors(),
        ));
    }
}

/**
 * Enqueue the frontend bundle
 */
function mygraphview_enqueue_frontend_scripts()
{
    $auto_insert = get_option('mygraphview_auto_insert', 'yes');
    if (($auto_insert === 'yes') && (is_single() || is_page())) {
        // Enqueue the compiled React front-end script
        wp_enqueue_script(
            'mygraphview-frontend-bundle',
            MYGRAPHVIEW_PLUGIN_URL . 'build/frontend.js',
            array(),
            MYGRAPHVIEW_VERSION,
            true
        );

        // Pass data
        wp_localize_script('mygraphview-frontend-bundle', 'myGraphViewData', array(
            'restUrl'       => esc_url_raw(rest_url('mygraphview/v1')),
            'currentPostId' => get_the_ID() ? get_the_ID() : 0,
            'themeColors'   => mygraphview_get_theme_colors(),
        ));
    }
}

/**
 * Basic function to pull theme colors
 */
function mygraphview_get_theme_colors()
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
function mygraphview_register_admin_page()
{
    add_menu_page(
        __('Graph View', 'my-graph-view'),
        __('Graph View', 'my-graph-view'),
        'manage_options',
        'graphview',
        array('MyGraphView_AdminPage', 'render_graph'),
        'dashicons-networking',
        90
    );

    add_submenu_page(
        'graphview',
        __('Graph Settings', 'my-graph-view'),
        __('Settings', 'my-graph-view'),
        'manage_options',
        'graphview-settings',
        array('MyGraphView_AdminPage', 'render_settings')
    );
}
