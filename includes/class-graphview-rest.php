<?php
if (!defined('ABSPATH')) {
    exit;
}

class graphview_REST
{
    public static function register_routes()
    {
        register_rest_route(
            'graphview/v1',
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
            'graphview/v1',
            '/local-graph/(?P<post_id>\d+)',
            array(
                'methods'  => 'GET',
                'callback' => array(__CLASS__, 'handle_local_graph'),
                'permission_callback' => '__return_true',
            )
        );
    }

    public static function handle_full_graph($request)
    {
        try {
            $data = graphview_DataBuilder::build_full_graph_data();
            return rest_ensure_response($data);
        } catch (Exception $e) {
            return new WP_Error('graph_error', $e->getMessage(), array('status' => 500));
        }
    }

    public static function handle_local_graph($request)
    {
        $post_id   = intval($request->get_param('post_id'));
        $max_edges = intval($request->get_param('max_edges')) ?: 20;

        try {
            $data = graphview_DataBuilder::build_local_graph_data($post_id, $max_edges);
            return rest_ensure_response($data);
        } catch (Exception $e) {
            return new WP_Error('graph_error', $e->getMessage(), array('status' => 500));
        }
    }
}
