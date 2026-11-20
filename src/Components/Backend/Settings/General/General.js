import { __ } from '@wordpress/i18n';
import { ExternalLink, RangeControl, SelectControl, TextControl } from '@wordpress/components';
import { HelpCards, Panel, ToggleRow } from '../../../../vendor/softicon-tools/components/Panels';
import { helpCards, videos } from '../../../../utils/options';
import { heightOf } from '../../../../utils/functions';
import { parseRange } from '../../../../viewer/range';
import { lightboxText } from '../../../../viewer/messages';

// a link to the feature's short video on YouTube, at the bottom of its panel
const Video = ( { video } ) => <p className="aldvHelp aldvVideo">
	<ExternalLink href={ video.href }>{ __( 'Watch how it works', 'softicon-document-viewer' ) }</ExternalLink> ({ video.time })
</p>;

const General = ( { attributes, setAttributes, file, sheets = [] } ) => {
	const { showDownload, showFullscreen, showZoom, showSearch, maxHeight, headerRow, firstSheet, cellRange, lightbox, buttonText } = attributes;
	// a range the viewer cannot read is left out, so the whole sheet shows
	const badRange = !! cellRange?.trim() && ! parseRange( cellRange );
	// zoom and search are for pages (PDF, Word); a table is read at its own size
	const zoomable = file && 'sheet' !== file.viewer;
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

		<Panel id="lightbox" title={ __( 'Lightbox', 'softicon-document-viewer' ) }>
			<ToggleRow label={ __( 'Open in a lightbox', 'softicon-document-viewer' ) } tip={ __( 'The page shows only the file card with a button. The document opens over the page when a visitor clicks it.', 'softicon-document-viewer' ) } checked={ lightbox } onChange={ set( 'lightbox' ) } />
			{ lightbox && <TextControl
				label={ __( 'Button text', 'softicon-document-viewer' ) }
				value={ buttonText }
				placeholder={ lightboxText().open }
				maxLength={ 60 }
				className="aldvField"
				onChange={ set( 'buttonText' ) }
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/> }
			<p className="aldvHelp">{ lightbox
				? __( 'The preview below is what opens in the lightbox.', 'softicon-document-viewer' )
				: __( 'Good for a page with many files, or a long document a visitor may not need.', 'softicon-document-viewer' ) }</p>
			<Video video={ videos.lightbox } />
		</Panel>

		{ /* a lightbox has no Fullscreen button: it already fills the screen */ }
		{ ( ! lightbox || zoomable ) && <Panel id="toolbar" title={ __( 'Toolbar', 'softicon-document-viewer' ) } badge={ zoomable ? __( 'New', 'softicon-document-viewer' ) : undefined }>
			{ ! lightbox && <ToggleRow label={ __( 'Fullscreen button', 'softicon-document-viewer' ) } tip={ __( 'Opens the document over the whole screen. Not shown in the editor.', 'softicon-document-viewer' ) } checked={ showFullscreen } onChange={ set( 'showFullscreen' ) } /> }
			{ zoomable && <ToggleRow label={ __( 'Zoom buttons', 'softicon-document-viewer' ) } tip={ __( 'Let visitors make the pages bigger or smaller.', 'softicon-document-viewer' ) } checked={ showZoom } onChange={ set( 'showZoom' ) } /> }
			{ zoomable && <ToggleRow label={ __( 'Search button', 'softicon-document-viewer' ) } tip={ __( 'Lets visitors find words in the document and jump from one result to the next. Ctrl+F (Cmd+F on a Mac) inside the viewer opens it too.', 'softicon-document-viewer' ) } checked={ showSearch } onChange={ set( 'showSearch' ) } /> }
			{ zoomable && <Video video={ videos.search } /> }
		</Panel> }

		{ /* a lightbox is as big as the screen */ }
		{ ! lightbox && <Panel id="size" title={ __( 'Size', 'softicon-document-viewer' ) }>
			<ToggleRow
				label={ __( 'Fixed height', 'softicon-document-viewer' ) }
				tip={ __( 'Off: a PDF or Word file shows in full and the page grows with it; a table scrolls inside a box of up to 720px. On: the document scrolls inside a box of this height.', 'softicon-document-viewer' ) }
				checked={ !! heightOf( maxHeight ) }
				onChange={ ( on ) => setAttributes( { maxHeight: on ? '600px' : '' } ) }
			/>
			{ /* stored as a CSS length ("600px"), so other units can come later without a new attribute */ }
			{ !! heightOf( maxHeight ) && <RangeControl
				label={ __( 'Height (px)', 'softicon-document-viewer' ) }
				value={ parseInt( maxHeight, 10 ) || 600 }
				min={ 200 }
				max={ 2000 }
				step={ 50 }
				onChange={ ( value ) => setAttributes( { maxHeight: ( value || 600 ) + 'px' } ) }
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/> }
			<p className="aldvHelp">{ __( 'Use Wide or Full width in the block toolbar for a larger viewer.', 'softicon-document-viewer' ) }</p>
		</Panel> }

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

			<TextControl
				label={ __( 'Cells to show', 'softicon-document-viewer' ) }
				value={ cellRange }
				placeholder="A1:F20"
				help={ badRange
					? __( 'Write the cells the way Excel does: A1:F20, whole columns A:F or whole rows 5:40.', 'softicon-document-viewer' )
					: __( 'Only these cells of the first sheet, without sheet tabs. Empty: the whole sheet. Also whole columns (A:F) or rows (5:40).', 'softicon-document-viewer' ) }
				className={ 'aldvRange' + ( badRange ? ' aldvBadRange' : '' ) }
				onChange={ set( 'cellRange' ) }
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
			<Video video={ videos.cells } />
		</Panel> }
	</>;
};

export default General;
