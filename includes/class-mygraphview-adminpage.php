<?php
if (! defined('ABSPATH')) {
    exit;
}

class MyGraphView_AdminPage
{

    /**
     * Render the admin page for the global graph,
     * plus a simple settings form for auto-insertion toggle.
     */
    public static function render()
    {
        // Handle form submission
        if (
            isset($_POST['mygraphview_settings_submitted']) &&
            check_admin_referer('mygraphview_settings_form') &&
            current_user_can('manage_options')
        ) {
            // Update auto-insert setting
            $auto_insert = (isset($_POST['mygraphview_auto_insert']) && $_POST['mygraphview_auto_insert'] === 'yes')
                ? 'yes'
                : 'no';
            update_option('mygraphview_auto_insert', $auto_insert);

            echo '<div class="updated"><p>' . esc_html__('Settings saved.', 'my-graph-view') . '</p></div>';
        }

        $current_setting = get_option('mygraphview_auto_insert', 'yes');
?>
        <div class="wrap">
            <h1><?php esc_html_e('Site Graph View', 'my-graph-view'); ?></h1>

            <p>
                <?php esc_html_e('Below is an interactive graph of your site content, powered by Cytoscape.js.', 'my-graph-view'); ?>
            </p>

            <div id="mygraphview-admin-graph" style="width:100%; height: 800px; border:1px solid #ccc; margin-bottom: 2em;"></div>

            <!-- Settings Form -->
            <h2><?php esc_html_e('Graph Settings', 'my-graph-view'); ?></h2>
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
