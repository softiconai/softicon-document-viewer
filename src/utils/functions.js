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
export const toConfig = ( file, { showDownload, headerRow, firstSheet } ) => ( {
	viewer: file.viewer,
	ext: file.ext,
	url: file.url,
	name: file.name,
	download: showDownload,
	// a saved & comes back as &amp; for users without unfiltered_html
	...( 'sheet' === file.viewer ? { header: headerRow, sheet: decodeEntities( firstSheet || '' ) } : {} ),
} );

export const cssVars = ( { bgColor, borderColor } ) => ( {
	'--aldv-bg': bgColor || undefined,
	'--aldv-border': borderColor || undefined,
} );
