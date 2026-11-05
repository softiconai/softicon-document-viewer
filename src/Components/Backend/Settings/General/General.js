import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { HelpCards, Panel, ToggleRow } from '../../../../vendor/softicon-tools/components/Panels';
import { helpCards } from '../../../../utils/options';

const General = ( { attributes, setAttributes, file, sheets = [] } ) => {
	const { showDownload, headerRow, firstSheet } = attributes;
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

		{ 'sheet' === file?.viewer && <Panel id="sheet" title={ __( 'Spreadsheet', 'softicon-document-viewer' ) }>
			<ToggleRow label={ __( 'First row is a header', 'softicon-document-viewer' ) } tip={ __( 'The first row stays at the top while visitors scroll. Off: the columns are named A, B, C.', 'softicon-document-viewer' ) } checked={ headerRow } onChange={ set( 'headerRow' ) } />

			{ /* the names come from the preview; a saved sheet that is gone from the file is still listed, so it can be changed */ }
			{ ( sheets.length > 1 || firstSheet ) && <SelectControl
				label={ __( 'Sheet shown first', 'softicon-document-viewer' ) }
				value={ firstSheet }
				options={ [
					{ value: '', label: __( 'The first sheet', 'softicon-document-viewer' ) },
					...sheets.map( ( name ) => ( { value: name, label: name } ) ),
					...( firstSheet && ! sheets.includes( firstSheet ) ? [ { value: firstSheet, label: firstSheet } ] : [] ),
				] }
				onChange={ set( 'firstSheet' ) }
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/> }
		</Panel> }
	</>;
};

export default General;
