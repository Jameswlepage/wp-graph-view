<?php
if (! defined('ABSPATH')) {
    exit;
}

class MyGraphView_REST
{

    public static function register_routes()
    {
        // Start output buffering as early as possible
        if (ob_get_level() == 0) ob_start();

        register_rest_route(
            'mygraphview/v1',
            '/full-graph',
            array(
                'methods'  => 'GET',
                'callback' => array(__CLASS__, 'handle_full_graph'),
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                }
            )
        );

        register_rest_route(
            'mygraphview/v1',
            '/local-graph/(?P<post_id>\d+)',
            array(
                'methods'  => 'GET',
                'callback' => array(__CLASS__, 'handle_local_graph'),
                'permission_callback' => '__return_true'
            )
        );
    }

    public static function handle_full_graph($request)
    {
        // Suppress all errors and warnings
        $previous_error_reporting = error_reporting(0);
        ini_set('display_errors', 0);

        // Clear all previous output
        while (ob_get_level() > 0) {
            ob_end_clean();
        }
        ob_start();

        try {
            $data = MyGraphView_DataBuilder::build_full_graph_data();
            ob_end_clean();

            // Restore error reporting
            error_reporting($previous_error_reporting);

            // Ensure proper JSON response
            header('Content-Type: application/json');
            return rest_ensure_response($data);
        } catch (Exception $e) {
            ob_end_clean();
            error_reporting($previous_error_reporting);
            return new WP_Error('graph_error', $e->getMessage(), array('status' => 500));
        }
    }

    public static function handle_local_graph($request)
    {
        // Suppress all errors and warnings
        $previous_error_reporting = error_reporting(0);
        ini_set('display_errors', 0);

        // Clear all previous output
        while (ob_get_level() > 0) {
            ob_end_clean();
        }
        ob_start();

        try {
            $post_id   = intval($request->get_param('post_id'));
            $max_edges = intval($request->get_param('max_edges')) ?: 20;
            $data      = MyGraphView_DataBuilder::build_local_graph_data($post_id, $max_edges);
            ob_end_clean();

            // Restore error reporting
            error_reporting($previous_error_reporting);

            // Ensure proper JSON response
            header('Content-Type: application/json');
            return rest_ensure_response($data);
        } catch (Exception $e) {
            ob_end_clean();
            error_reporting($previous_error_reporting);
            return new WP_Error('graph_error', $e->getMessage(), array('status' => 500));
        }
    }
}
