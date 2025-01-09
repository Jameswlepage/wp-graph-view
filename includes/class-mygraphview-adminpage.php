<?php
if (!defined('ABSPATH')) {
    exit;
}

class MyGraphView_AdminPage
{
    /**
     * Renders the main React container for the admin graph
     */
    public static function render_graph()
    {
?>
        <div class="wrap">
            <h1><?php esc_html_e('Site Graph View', 'my-graph-view'); ?></h1>
            <div id="mygraphview-admin-root"></div>
        </div>
    <?php
    }

    /**
     * Renders a simple settings page for “auto-insert” option
     */
    public static function render_settings()
    {
        // Handle form submission
        if (
            isset($_POST['mygraphview_settings_submitted']) &&
            check_admin_referer('mygraphview_settings_form') &&
            current_user_can('manage_options')
        ) {
            $auto_insert = (isset($_POST['mygraphview_auto_insert']) && $_POST['mygraphview_auto_insert'] === 'yes')
                ? 'yes'
                : 'no';
            update_option('mygraphview_auto_insert', $auto_insert);

            echo '<div class="updated"><p>' . esc_html__('Settings saved.', 'my-graph-view') . '</p></div>';
        }

        $current_setting = get_option('mygraphview_auto_insert', 'yes');
    ?>
        <div class="wrap">
            <h1><?php esc_html_e('Graph Settings', 'my-graph-view'); ?></h1>
            <form method="post">
                <?php wp_nonce_field('mygraphview_settings_form'); ?>
                <input type="hidden" name="mygraphview_settings_submitted" value="1" />

                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">
                            <label for="mygraphview_auto_insert">
                                <?php esc_html_e('Automatically insert mini-graph on single posts/pages:', 'my-graph-view'); ?>
                            </label>
                        </th>
                        <td>
                            <input type="checkbox"
                                name="mygraphview_auto_insert"
                                id="mygraphview_auto_insert"
                                value="yes"
                                <?php checked($current_setting, 'yes'); ?> />
                        </td>
                    </tr>
                </table>

                <?php submit_button(__('Save Settings', 'my-graph-view')); ?>
            </form>
        </div>
<?php
    }
}
