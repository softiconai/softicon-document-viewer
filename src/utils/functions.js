import { decodeEntities } from '@wordpress/html-entities';
import { fileTypes } from './options';

// lower-case extension of a url, without a query string or hash
export const extOf = ( url ) => {
	const path = ( url || '' ).split( /[?#]/ )[ 0 ];
	const dot = path.lastIndexOf( '.' );
	return dot > path.lastIndexOf( '/' ) ? path.slice( dot + 1 ).toLowerCase() : '';
};

const baseName = ( url ) => {
	const name = ( url || '' ).split( /[?#]/ )[ 0 ].split( '/' ).pop();
	try {
		return decodeURIComponent( name );
	} catch {
		return name;
	}
};

// the file the block shows, the way render.php works it out; null for a missing or unsupported file
export const fileInfo = ( { fileUrl, fileName } ) => {
	const ext = extOf( fileUrl );
	const type = fileTypes[ ext ];
	if ( ! fileUrl || ! type ) {
		return null;
	}
	return { url: fileUrl, ext, viewer: type.viewer, label: type.label, name: fileName || baseName( fileUrl ) };
};

// a media library item or a fresh upload
export const fromMedia = ( media ) => ( {
	fileId: media.id || 0,
	fileUrl: media.url || media.source_url || '',
	fileName: media.title?.raw || media.title || '',
	// a sheet name from the previous file means nothing in this one
	firstSheet: '',
} );

// a pasted link, its name comes from the address
export const fromUrl = ( url ) => ( { fileId: 0, fileUrl: url, fileName: '', firstSheet: '' } );

// what the viewer gets, the way Block::config() builds it for the page
// a fixed height for the viewer, checked like Block::height() does; '' is Auto
export const heightOf = ( value ) => {
	const height = 'string' === typeof value ? value.trim() : '';
	return /^\d{1,4}(\.\d{1,2})?(px|vh|em|rem)$/.test( height ) && parseFloat( height ) > 0 ? height : '';
};

export const toConfig = ( file, { showDownload, showFullscreen, showZoom, maxHeight, headerRow, firstSheet } ) => ( {
	viewer: file.viewer,
	ext: file.ext,
	url: file.url,
	name: file.name,
	download: showDownload,
	fullscreen: showFullscreen,
	zoom: showZoom,
	fixed: '' !== heightOf( maxHeight ),
	// a saved & comes back as &amp; for users without unfiltered_html
	...( 'sheet' === file.viewer ? { header: headerRow, sheet: decodeEntities( firstSheet || '' ) } : {} ),
} );

// hex, rgb(a), hsl(a) or a preset var(), checked like Block::color(); anything else (a url() would load
// something from another site in the editor) is dropped
export const colorOf = ( value ) => {
	const color = 'string' === typeof value ? value.trim() : '';
	return /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([0-9.,%\s/]+\)|var\(--[a-z0-9-]+\))$/i.test( color ) ? color : undefined;
};

export const cssVars = ( { bgColor, borderColor, toolbarBg, toolbarColor, headBg, headColor, maxHeight } ) => ( {
	'--aldv-bg': colorOf( bgColor ),
	'--aldv-border': colorOf( borderColor ),
	'--aldv-toolbar-bg': colorOf( toolbarBg ),
	'--aldv-toolbar-color': colorOf( toolbarColor ),
	'--aldv-head-bg': colorOf( headBg ),
	'--aldv-head-color': colorOf( headColor ),
	'--aldv-height': heightOf( maxHeight ) || undefined,
} );
