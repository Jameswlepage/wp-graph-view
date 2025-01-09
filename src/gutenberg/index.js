import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import GraphPanel from './GraphPanel';

registerPlugin('mygraphview-sidebar', {
    render: () => (
        <PluginDocumentSettingPanel
            name="mygraphview-panel"
            title={__('Graph View', 'my-graph-view')}
            initialOpen={true}
        >
            <GraphPanel />
        </PluginDocumentSettingPanel>
    ),
}); 