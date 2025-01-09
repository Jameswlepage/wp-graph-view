import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import GraphPanel from './GraphPanel';

registerPlugin('graphview-sidebar', {
    render: () => (
        <PluginDocumentSettingPanel
            name="graphview-panel"
            title={__('Graph View', 'my-graph-view')}
            initialOpen={true}
        >
            <GraphPanel />
        </PluginDocumentSettingPanel>
    ),
}); 