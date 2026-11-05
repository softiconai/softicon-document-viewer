// web, email, phone and in-document links only; a Word or Excel file can hold javascript: or file: links
export const safeHref = ( href, win ) => {
	if ( href.startsWith( '#' ) ) {
		return href;
	}
	try {
		const url = new URL( href, win.location.href );
		return [ 'http:', 'https:', 'mailto:', 'tel:' ].includes( url.protocol ) ? url.href : null;
	} catch ( e ) {
		return null;
	}
};

// a link out of the document opens in a new tab, without access back to this page
export const linkOut = ( a, href ) => {
	a.href = href;
	if ( /^https?:/.test( href ) ) {
		a.target = '_blank';
		a.rel = 'noopener noreferrer';
	}
};
