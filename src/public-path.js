// Lazy viewer chunks load from the plugin, even when a JS combine plugin moved this script.
// a string only: an element with id="aldvBuildUrl" in post content would also be on window
if ( 'string' === typeof window.aldvBuildUrl ) {
	// eslint-disable-next-line no-undef, camelcase -- webpack's own name
	__webpack_public_path__ = window.aldvBuildUrl;
}
