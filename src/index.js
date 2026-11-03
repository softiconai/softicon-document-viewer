// the lazy viewer chunks of the editor preview load from the plugin's build folder
import './public-path';
import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import './style.scss';
import './editor.scss';
import Edit from './Components/Backend/Edit';
import { blockIcon } from './utils/icons';

registerBlockType( metadata, {
	icon: blockIcon,
	edit: Edit,
	// Dynamic block, the markup comes from render.php.
	save: () => null,
} );
