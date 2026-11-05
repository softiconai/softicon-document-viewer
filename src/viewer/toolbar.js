import { toolbarText } from './messages';

// simple line icons, drawn for this plugin
const icon = ( path ) => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="${ path }" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICONS = {
	zoomOut: icon( 'M5 12h14' ),
	zoomIn: icon( 'M12 5v14M5 12h14' ),
	fullscreen: icon( 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5' ),
	exitFullscreen: icon( 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5' ),
};

export const ZOOMS = [ 0.5, 0.75, 1, 1.25, 1.5, 2, 3 ];

// The buttons in the file card's .aldv_tools: zoom, a page counter and fullscreen.
// A viewer passes what it supports: { zoom( level ), pages: count }; the toolbar calls back and the viewer
// reports the page it shows with toolbar.page( n ).
export default class Toolbar {
	constructor( viewer, { zoom = null, pages = 0 } = {} ) {
		this.viewer = viewer;
		this.root = viewer.root;
		this.doc = viewer.doc;
		this.win = viewer.win;
		this.box = this.root.querySelector( '.aldv_tools' );
		this.level = 1;
		this.offs = [];
		if ( ! this.box ) {
			return;
		}
		const text = toolbarText();
		const config = viewer.config;

		if ( zoom && false !== config.zoom ) {
			this.onZoom = zoom;
			this.out = this.button( 'zoomOut', text.zoomOut, () => this.zoom( -1 ) );
			this.levelButton = this.button( '', text.zoomReset( '100%' ), () => this.zoom( 0 ) );
			this.levelButton.classList.add( 'aldv_zoom_level' );
			this.in = this.button( 'zoomIn', text.zoomIn, () => this.zoom( 1 ) );
			this.box.append( this.out, this.levelButton, this.in );
			this.showLevel();
		}
		if ( pages > 1 ) {
			this.pages = pages;
			this.counter = this.doc.createElement( 'span' );
			this.counter.className = 'aldv_pages_count';
			this.box.append( this.counter );
			this.page( 1 );
		}
		// not in the editor: its canvas is an iframe without fullscreen rights
		if ( false !== config.fullscreen && ! viewer.editor ) {
			this.full = this.button( 'fullscreen', text.fullscreen, () => this.toggleFullscreen() );
			this.box.append( this.full );
			this.listen( this.doc, 'fullscreenchange', () => this.fullscreenChanged() );
			this.listen( this.doc, 'webkitfullscreenchange', () => this.fullscreenChanged() );
		}
	}

	listen( target, type, handler ) {
		target.addEventListener( type, handler );
		this.offs.push( () => target.removeEventListener( type, handler ) );
	}

	button( name, label, onClick ) {
		const button = this.doc.createElement( 'button' );
		button.type = 'button';
		button.className = 'aldv_btn' + ( name ? ' aldv_btn_' + name : '' );
		button.setAttribute( 'aria-label', label );
		button.title = label;
		if ( name ) {
			button.innerHTML = ICONS[ name ];
		}
		button.addEventListener( 'click', onClick );
		return button;
	}

	// one step in or out, 0 back to 100%
	zoom( step ) {
		const index = ZOOMS.indexOf( this.level );
		this.level = 0 === step ? 1 : ZOOMS[ Math.min( ZOOMS.length - 1, Math.max( 0, index + step ) ) ];
		this.onZoom( this.level );
		this.showLevel();
	}

	showLevel() {
		const level = Math.round( this.level * 100 ) + '%';
		this.levelButton.textContent = level;
		this.levelButton.setAttribute( 'aria-label', toolbarText().zoomReset( level ) );
		this.levelButton.title = this.levelButton.getAttribute( 'aria-label' );
		this.out.disabled = this.level === ZOOMS[ 0 ];
		this.in.disabled = this.level === ZOOMS[ ZOOMS.length - 1 ];
	}

	page( n ) {
		if ( ! this.counter || n === this.current ) {
			return;
		}
		this.current = n;
		this.counter.textContent = n + ' / ' + this.pages;
		this.counter.setAttribute( 'aria-label', toolbarText().page( n, this.pages ) );
	}

	isFull() {
		return this.doc.fullscreenElement === this.root || this.doc.webkitFullscreenElement === this.root || this.root.classList.contains( 'aldv_full' );
	}

	// the Fullscreen API where there is one; iPhones have none for elements, so the block then fills the window
	toggleFullscreen() {
		if ( this.isFull() ) {
			if ( this.root.classList.contains( 'aldv_full' ) ) {
				this.cssFullscreen( false );
			} else {
				( this.doc.exitFullscreen || this.doc.webkitExitFullscreen ).call( this.doc );
			}
			return;
		}
		const request = this.root.requestFullscreen || this.root.webkitRequestFullscreen;
		if ( request ) {
			Promise.resolve( request.call( this.root ) ).catch( () => this.cssFullscreen( true ) );
		} else {
			this.cssFullscreen( true );
		}
	}

	cssFullscreen( on ) {
		this.root.classList.toggle( 'aldv_full', on );
		this.doc.documentElement.classList.toggle( 'aldv_locked', on );
		if ( on ) {
			this.escape = ( event ) => 'Escape' === event.key && this.cssFullscreen( false );
			this.doc.addEventListener( 'keydown', this.escape );
			// a popup or page transition can remove the block without destroy(): the page gets its scrolling back
			this.gone = new this.win.MutationObserver( () => ! this.root.isConnected && this.cssFullscreen( false ) );
			this.gone.observe( this.doc.body, { childList: true, subtree: true } );
		} else {
			if ( this.escape ) {
				this.doc.removeEventListener( 'keydown', this.escape );
				this.escape = null;
			}
			this.gone?.disconnect();
			this.gone = null;
		}
		this.fullscreenChanged();
	}

	fullscreenChanged() {
		const on = this.isFull();
		this.root.classList.toggle( 'aldv_is_full', on );
		const label = on ? toolbarText().exitFullscreen : toolbarText().fullscreen;
		this.full.innerHTML = ICONS[ on ? 'exitFullscreen' : 'fullscreen' ];
		this.full.setAttribute( 'aria-label', label );
		this.full.title = label;
		this.viewer.fullscreen?.( on );
	}

	destroy() {
		if ( this.root.classList.contains( 'aldv_full' ) ) {
			this.cssFullscreen( false );
		}
		this.offs.forEach( ( off ) => off() );
		this.box?.replaceChildren();
		this.root.classList.remove( 'aldv_is_full' );
	}
}
