import { __ } from '@wordpress/i18n';
import { HelpCards, Panel, ToggleRow } from '../../../../vendor/softicon-tools/components/Panels';
import { helpCards } from '../../../../utils/options';

const General = ( { attributes, setAttributes, file } ) => {
	const { showDownload } = attributes;
	const set = ( key ) => ( val ) => setAttributes( { [ key ]: val } );

	return <>
		<Panel id="help" title={ __( 'Help', 'softicon-document-viewer' ) }>
			<HelpCards cards={ helpCards } />
			<p className="aldvHelp">{ __( 'Email:', 'softicon-document-viewer' ) } <a href="mailto:softiconai@gmail.com">softiconai@gmail.com</a></p>
		</Panel>

		<Panel id="file" title={ __( 'File', 'softicon-document-viewer' ) }>
			{ file && <p className="aldvFile">
				<strong>{ file.name }</strong>
				<span className="aldvHelp">{ file.label }</span>
			</p> }
			<p className="aldvHelp">{ __( 'Change the file with Replace in the block toolbar.', 'softicon-document-viewer' ) }</p>

			<ToggleRow label={ __( 'Download button', 'softicon-document-viewer' ) } tip={ __( 'Lets visitors save the file.', 'softicon-document-viewer' ) } checked={ showDownload } onChange={ set( 'showDownload' ) } />
		</Panel>
	</>;
};

export default General;
