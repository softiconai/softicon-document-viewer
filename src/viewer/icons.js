// simple line icons, drawn for this plugin (the toolbar, the search bar and the lightbox)
const icon = ( path ) => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="${ path }" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const ICONS = {
	zoomOut: icon( 'M5 12h14' ),
	zoomIn: icon( 'M12 5v14M5 12h14' ),
	fullscreen: icon( 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5' ),
	exitFullscreen: icon( 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5' ),
	search: icon( 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20' ),
	prev: icon( 'M6 15l6-6 6 6' ),
	next: icon( 'M6 9l6 6 6-6' ),
	close: icon( 'M6 6l12 12M18 6L6 18' ),
};
