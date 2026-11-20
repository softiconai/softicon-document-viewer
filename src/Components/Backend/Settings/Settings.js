import { InspectorControls } from '@wordpress/block-editor';
import { TabPanel } from '@wordpress/components';
import { applyFilters } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';
import General from './General/General';
import Style from './Style/Style';
import ShortcodePanel, { DOC_TYPE } from './General/ShortcodePanel';
import { PanelGroup } from '../../../vendor/softicon-tools/components/Panels';
import { tabs } from '../../../utils/options';

const Settings = ( { attributes, setAttributes, file, sheets } ) => {
	// a document under Document Viewer → All Documents opens on its shortcode
	const isDocPost = useSelect( ( select ) => DOC_TYPE === select( 'core/editor' )?.getCurrentPostType?.(), [] );
	const firstPanel = isDocPost ? 'shortcode' : 'file';

	return <InspectorControls>
		<TabPanel className="siSettings" tabs={ tabs }>
			{ ( tab ) => <PanelGroup key={ tab.name } initial={ 'style' === tab.name ? 'colors' : firstPanel }>
				{ 'general' === tab.name && isDocPost && <ShortcodePanel /> }

				{ 'general' === tab.name && <General { ...{ attributes, setAttributes, file, sheets } } /> }

				{ 'style' === tab.name && <Style { ...{ attributes, setAttributes, file } } /> }

				{ /* Add-ons append their own panels to either tab. */ }
				{ applyFilters( 'aldv.block.inspector', null, { tab: tab.name, attributes, setAttributes, file } ) }
			</PanelGroup> }
		</TabPanel>
	</InspectorControls>;
};

export default Settings;
