import { __, sprintf } from '@wordpress/i18n';

// Every text a viewer shows lives here. WordPress loads translations only for view.js and index.js,
// not for the lazy chunks, so both import this file and webpack leaves it out of the chunks.

export const pageLabel = ( page, total ) => sprintf(
	/* translators: 1: page number, 2: number of pages */
	__( 'Page %1$d of %2$d', 'softicon-document-viewer' ),
	page,
	total
);

// why a file could not be shown: a viewer sets error.aldvReason when it knows,
// otherwise a file on another site most likely has no CORS header
export const reasonOf = ( error, url, win ) => {
	if ( error?.aldvReason ) {
		return error.aldvReason;
	}
	try {
		if ( 'ChunkLoadError' !== error?.name && new URL( url, win.location.href ).origin !== win.location.origin ) {
			return 'cors';
		}
	} catch ( e ) {
		// not a url, fall through
	}
	return 'failed';
};

// the message for visitors, or for the editor with what to do about it
export const errorText = ( reason, editor = false ) => {
	switch ( reason ) {
		case 'missing':
			return editor
				? __( 'The file was not found. Check the link, or pick the file again.', 'softicon-document-viewer' )
				: __( 'The file was not found.', 'softicon-document-viewer' );
		case 'password':
			return editor
				? __( 'This PDF has a password, so it cannot be shown here. Save it without a password, or leave the Download button on so visitors can open it.', 'softicon-document-viewer' )
				: __( 'This PDF has a password, so it cannot be shown here.', 'softicon-document-viewer' );
		case 'invalid':
			return editor
				? __( 'This file looks damaged, so it cannot be shown here. Open it on your computer and save it again.', 'softicon-document-viewer' )
				: __( 'This file looks damaged, so it cannot be shown here.', 'softicon-document-viewer' );
		case 'cors':
			return editor
				? __( 'This file is on another website that does not allow it to be shown here. Upload the file to your Media Library instead.', 'softicon-document-viewer' )
				: __( 'This file is on another website that does not allow it to be shown here.', 'softicon-document-viewer' );
		default:
			return editor
				? __( 'This file could not be shown. Try picking it again.', 'softicon-document-viewer' )
				: __( 'This file could not be shown here.', 'softicon-document-viewer' );
	}
};
