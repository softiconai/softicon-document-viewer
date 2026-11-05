import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { BlockControls, BlockIcon, MediaPlaceholder, MediaReplaceFlow, useBlockProps } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
// copied from the shared softicon-tools folder by `npm run tools` (prebuild), edit it there
import useIframeAssets from '../../vendor/softicon-tools/hooks/useIframeAssets';
import Settings from './Settings/Settings';
import FileCard from './FileCard';
import { blockIcon } from '../../utils/icons';
import { accept, mimeTypes } from '../../utils/options';
import { cssVars, extOf, fileInfo, fromMedia, fromUrl, toConfig } from '../../utils/functions';
import { viewers } from '../../viewer/viewers';
import { errorText, reasonOf } from '../../viewer/messages';

// the live preview: the same viewer the page uses, opened in the block's .aldv_stage; it opens again when
// the file or a setting the viewer reads changes. Gives the reason the file could not be shown ('' while it can)
// and a spreadsheet's sheet names for the First sheet setting.
const usePreview = ( stage, configKey ) => {
	const [ failed, setFailed ] = useState( '' );
	const [ sheets, setSheets ] = useState( [] );

	useEffect( () => {
		const el = stage.current;
		const config = configKey ? JSON.parse( configKey ) : null;
		const load = config && viewers[ config.viewer ];
		setFailed( '' );
		if ( ! el || ! load ) {
			return;
		}
		let viewer;
		let closed = false;
		load()
			.then( ( { default: Viewer } ) => {
				if ( ! closed ) {
					viewer = new Viewer( el.parentElement, config, { onSheets: setSheets } );
					return viewer.init();
				}
			} )
			.catch( ( error ) => {
				if ( closed ) {
					return;
				}
				viewer?.destroy();
				setFailed( reasonOf( error, config.url, el.ownerDocument.defaultView ) );
				// eslint-disable-next-line no-console
				console.error( 'SoftIcon Document Viewer:', error );
			} );
		return () => {
			closed = true;
			viewer?.destroy();
		};
	}, [ stage, configKey ] );

	return { failed, sheets };
};

const Edit = ( { attributes, setAttributes } ) => {
	const { fileId, fileUrl, showDownload } = attributes;
	const [ error, setError ] = useState( '' );
	// a block installed from the inserter's search gets these only in the top window
	const assetsRef = useIframeAssets( [ 'softicon-document-viewer-style-css', 'softicon-document-viewer-editor-style-css' ] );
	const file = fileInfo( attributes );
	const stage = useRef();
	// the Download button is in the file card, not the viewer: turning it on or off does not reopen the file
	const preview = file ? { ...toConfig( file, attributes ), download: true } : null;
	const { failed, sheets } = usePreview( stage, preview ? JSON.stringify( preview ) : '' );

	const pick = ( patch ) => {
		setError( '' );
		setAttributes( patch );
	};

	const blockProps = useBlockProps( {
		ref: assetsRef,
		className: file ? 'aldv_viewer aldv_' + file.viewer : undefined,
		style: file ? cssVars( attributes ) : undefined,
	} );

	const errorNotice = error && <Notice status="error" onRemove={ () => setError( '' ) }>{ error }</Notice>;

	if ( ! fileUrl ) {
		return <div { ...blockProps }>
			<MediaPlaceholder
				icon={ <BlockIcon icon={ blockIcon } /> }
				labels={ {
					title: __( 'Document Viewer', 'softicon-document-viewer' ),
					instructions: __( 'Upload or pick a PDF, Word (DOCX), Excel (XLSX, XLS) or CSV file, or paste a link to one.', 'softicon-document-viewer' ),
				} }
				allowedTypes={ mimeTypes }
				accept={ accept }
				onSelect={ ( media ) => pick( fromMedia( media ) ) }
				onSelectURL={ ( url ) => pick( fromUrl( url ) ) }
				onError={ setError }
				notices={ errorNotice || undefined }
			/>
		</div>;
	}

	return <>
		<Settings { ...{ attributes, setAttributes, file, sheets } } />

		<BlockControls group="other">
			<MediaReplaceFlow
				mediaId={ fileId || undefined }
				mediaURL={ fileUrl }
				allowedTypes={ mimeTypes }
				accept={ accept }
				onSelect={ ( media ) => pick( fromMedia( media ) ) }
				onSelectURL={ ( url ) => pick( fromUrl( url ) ) }
				onError={ setError }
				name={ __( 'Replace', 'softicon-document-viewer' ) }
			/>
		</BlockControls>

		<div { ...blockProps }>
			{ errorNotice }
			{ file
				? <>
					<FileCard file={ file } download={ showDownload } />
					{ failed && <Notice status="warning" isDismissible={ false }>{ errorText( failed, true ) }</Notice> }
					{ /* the viewer fills this, React leaves its content alone */ }
					<div className="aldv_stage" ref={ stage } />
				</>
				: <Notice status="warning" isDismissible={ false }>{ 'doc' === extOf( fileUrl )
					? __( 'Old Word files (.doc) cannot be shown. Open the file in Word, save it as .docx and pick that file instead.', 'softicon-document-viewer' )
					: __( 'This file cannot be shown, so the page leaves the block out. Pick a PDF, DOCX, XLSX, XLS or CSV file.', 'softicon-document-viewer' ) }</Notice> }
		</div>
	</>;
};

export default Edit;
