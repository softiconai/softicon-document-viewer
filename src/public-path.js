// The lazy viewer chunks load from the plugin's build folder. webpack finds it from the running script
// (publicPath 'auto'), but a JS combine plugin can move this script. Then the folder comes from what WordPress
// prints for the block, in this order:
// 1. the block's own script tag (known id);
// 2. --aldv-build on :root from style.scss: WordPress makes its url(./) absolute when it prints the CSS inline,
//    and CSS combine plugins do the same; a relative value (a plain stylesheet file) is skipped;
// 3. the block's own stylesheet link (known id).
// Only real script and link tags and the root's own style count: post content can hold an element with such an
// id or an inline style, but no script, link or style tag, and nothing that styles :root.
const folderOf = ( url ) => {
	try {
		const folder = new URL( url, window.location.href ).href.split( /[?#]/ )[ 0 ].replace( /[^/]*$/, '' );
		return /^https?:\/\/.+\/build\/$/.test( folder ) ? folder : '';
	} catch ( e ) {
		return '';
	}
};

const ownTag = ( tag, id, attr ) => {
	const el = document.getElementById( id );
	return el && tag === el.tagName ? folderOf( el.getAttribute( attr ) || '' ) : '';
};

const fromRoot = () => {
	const value = window.getComputedStyle( document.documentElement ).getPropertyValue( '--aldv-build' );
	const url = ( /url\(\s*['"]?([^'")\s]+)/.exec( value ) || [] )[ 1 ] || '';
	return /^(\/|https?:)/.test( url ) ? folderOf( url ) : '';
};

const folder = ownTag( 'SCRIPT', 'softicon-document-viewer-view-script-js', 'src' ) ||
	ownTag( 'SCRIPT', 'softicon-document-viewer-editor-script-js', 'src' ) ||
	fromRoot() ||
	ownTag( 'LINK', 'softicon-document-viewer-style-css', 'href' );

if ( folder ) {
	// eslint-disable-next-line no-undef, camelcase -- webpack's own name
	__webpack_public_path__ = folder;
}
