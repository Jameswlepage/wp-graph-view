<?php
if (!defined('ABSPATH')) {
    exit;
}

class graphview_AdminPage
{
    /**
     * Renders the main React container for the admin graph
     */
    public static function render_graph()
    {
?>
        <div class="wrap">
            <div id="graphview-admin-root" style="min-height: 400px; position: relative;">
                <div style="text-align: center; padding-top: 100px;">
                    Loading Graph View...
                </div>
            </div>
        </div>
    <?php
    }

    /**
     * Renders a simple settings page for "auto-insert" option
     */
    public static function render_settings()
    {
        // Handle form submission
        if (
            isset($_POST['graphview_settings_submitted']) &&
            check_admin_referer('graphview_settings_form') &&
            current_user_can('manage_options')
        ) {
            $auto_insert = (isset($_POST['graphview_auto_insert']) && $_POST['graphview_auto_insert'] === 'yes')
                ? 'yes'
                : 'no';
            update_option('graphview_auto_insert', $auto_insert);

            $position = isset($_POST['graphview_position']) ? sanitize_text_field($_POST['graphview_position']) : 'below';
            update_option('graphview_position', $position);

            echo '<div class="updated"><p>' . esc_html__('Settings saved.', 'my-graph-view') . '</p></div>';
        }

        $current_setting = get_option('graphview_auto_insert', 'yes');
        $current_position = get_option('graphview_position', 'below');
    ?>
        <div class="wrap">
            <h1><?php esc_html_e('Graph Settings', 'my-graph-view'); ?></h1>
            <form method="post">
                <?php wp_nonce_field('graphview_settings_form'); ?>
                <input type="hidden" name="graphview_settings_submitted" value="1" />

                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">
                            <label for="graphview_auto_insert">
                                <?php esc_html_e('Automatically insert mini-graph on single posts/pages:', 'my-graph-view'); ?>
                            </label>
                        </th>
                        <td>
                            <input type="checkbox"
                                name="graphview_auto_insert"
                                id="graphview_auto_insert"
                                value="yes"
                                <?php checked($current_setting, 'yes'); ?> />
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">
                            <label for="graphview_position">
                                <?php esc_html_e('Graph Position:', 'my-graph-view'); ?>
                            </label>
                        </th>
                        <td>
                            <select name="graphview_position" id="graphview_position">
                                <option value="above" <?php selected($current_position, 'above'); ?>>
                                    <?php esc_html_e('Above Content', 'my-graph-view'); ?>
                                </option>
                                <option value="below" <?php selected($current_position, 'below'); ?>>
                                    <?php esc_html_e('Below Content', 'my-graph-view'); ?>
                                </option>
                            </select>
                        </td>
                    </tr>
                </table>

                <?php submit_button(__('Save Settings', 'my-graph-view')); ?>
            </form>
        </div>
<?php
    }
}
