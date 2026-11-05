// eslint-disable-next-line import/no-unresolved -- the package has only an "exports" map, which webpack reads and this resolver does not
import { defaultOptions, renderAsync } from 'docx-preview';
import { loadFile } from './loadFile';
import { zipTooBig } from './zipCheck';
import Toolbar from './toolbar';
import { safeHref } from './safeUrl';

// how the pages sit inside the shadow root; the theme's CSS cannot reach in, the file's selectors cannot reach out
// (its layout is held in by contain: paint on .aldv_docx .aldv_stage)
const SHEET = `
:host { display: block; }
.docx-wrapper { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 0; background: transparent; }
.docx-wrapper > section.docx { flex: none; margin: 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); }
img { max-width: none; }
.aldv_reflow { align-items: stretch; }
.aldv_reflow > section.docx { width: auto !important; min-height: 0 !important; padding: 24px 20px !important; overflow-x: auto; }
.aldv_reflow img { max-width: 100%; height: auto; }
.aldv_reflow > section.docx > header { margin: 0 0 16px !important; }
.aldv_reflow > section.docx > footer { margin: 16px 0 0 !important; }
`;

// below this a zoomed page is too small to read (a Letter page on a phone is about 0.36), the text flows instead
const MIN_ZOOM = 0.6;

const UNSAFE = 'script, iframe, frame, frameset, object, embed, base, form, meta, link, portal';

// The file's text reaches docx-preview's CSS unescaped, so the CSS is cleaned after the browser parsed it
// (the CSSOM has turned u\72l( into url( by then): only the file's own data: images and fonts may load.
const LOCAL_URL = /url\(\s*["']?data:[^)]*\)/gi;
const LOADS = /url\(|image-set\(|image\(|cross-fade\(|element\(|src\(/i;
const scrub = ( decl ) => {
	for ( let i = decl.length - 1; i >= 0; i-- ) {
		const prop = decl[ i ];
		const value = decl.getPropertyValue( prop );
		// custom properties keep their raw text, escapes included
		if ( LOADS.test( value.replace( LOCAL_URL, '' ) ) || ( prop.startsWith( '--' ) && value.includes( '\\' ) ) ) {
			decl.removeProperty( prop );
		}
	}
};
// docx-preview writes only style rules and @font-face; @import, @property, @keyframes, @media and the like go
const scrubRules = ( owner ) => {
	for ( let i = owner.cssRules.length - 1; i >= 0; i-- ) {
		const rule = owner.cssRules[ i ];
		if ( ! rule.style ) {
			owner.deleteRule( i );
			continue;
		}
		scrub( rule.style );
		if ( rule.cssRules?.length ) {
			scrubRules( rule );
		}
	}
};

// a missing or linked picture comes back as null, and img.src = null would load "<page>/null"
const h = ( spec ) => {
	const el = defaultOptions.h( spec );
	if ( 'IMG' === el.nodeName ) {
		Object.defineProperty( el, 'src', {
			get: () => el.getAttribute( 'src' ) || '',
			set: ( url ) => url && el.setAttribute( 'src', url ),
		} );
	}
	return el;
};

// Word's bullets and symbols are Symbol / Wingdings characters (U+F0xx) that only show on Windows;
// the common ones become their Unicode look-alikes, any other one a plain bullet
const SYMBOLS = { f0b7: '•', f0a7: '▪', f0a8: '◻', f06e: '■', f071: '❑', f076: '❖', f0d8: '➢', f0e0: '➢', f0fc: '✓', f0fe: '☑', f06f: '□', f0a1: '○', f09f: '•', f02d: '-' };
const PRIVATE = /[\uf020-\uf0ff]/g;
const unSymbol = ( text ) => text.replace( PRIVATE, ( char ) => SYMBOLS[ char.charCodeAt( 0 ).toString( 16 ) ] || '•' );

// Word (docx) as real HTML: searchable and read by screen readers, page by page, scaled down to fit on phones
export default class Docx {
	constructor( root, config, { editor = false } = {} ) {
		this.root = root;
		this.editor = editor;
		this.doc = root.ownerDocument;
		this.win = this.doc.defaultView || window;
		this.config = config;
		this.destroyed = false;
	}

	async init() {
		this.stage = this.root.querySelector( '.aldv_stage' );
		const loading = this.doc.createElement( 'div' );
		loading.className = 'aldv_loading';
		loading.innerHTML = '<span class="aldv_spinner"></span>';
		this.stage.replaceChildren( loading );
		this.stage.hidden = false;
		this.root.classList.add( 'aldv_open' );

		let body;
		let styles;
		try {
			this.abort = new this.win.AbortController();
			const blob = await loadFile( this.config.url, this.abort.signal );
			// a zip bomb is refused before JSZip unpacks it
			if ( zipTooBig( await blob.arrayBuffer() ) ) {
				throw Object.assign( new Error( 'Unpacks too large' ), { aldvReason: 'large' } );
			}
			// rendered away from the page and cleaned before anything of it is shown
			body = this.doc.createElement( 'div' );
			styles = this.doc.createElement( 'div' );
			await renderAsync( blob, body, styles, {
				className: 'docx',
				// an altChunk is HTML from the file, shown in an iframe: never
				renderAltChunks: false,
				renderComments: false,
				renderChanges: false,
				// data: urls have no origin of their own: an "image" the file types as HTML or SVG
				// cannot run as this site when opened in a new tab (a blob: url would)
				useBase64URL: true,
				h,
			} );
		} catch ( error ) {
			if ( this.destroyed ) {
				return;
			}
			error.aldvReason = error.aldvReason || ( 'AbortError' === error.name || 'TypeError' === error.name ? '' : 'invalid' );
			throw error;
		}
		if ( this.destroyed ) {
			return;
		}
		this.clean( body, styles );
		this.show( body, styles );
	}

	clean( body, styles ) {
		body.querySelectorAll( UNSAFE ).forEach( ( el ) => el.remove() );
		styles.querySelectorAll( UNSAFE ).forEach( ( el ) => el.remove() );
		styles.querySelectorAll( 'style' ).forEach( ( style ) => {
			const sheet = new this.win.CSSStyleSheet();
			sheet.replaceSync( unSymbol( style.textContent ) );
			scrubRules( sheet );
			style.textContent = [ ...sheet.cssRules ].map( ( rule ) => rule.cssText ).join( '\n' );
		} );

		// symbols typed in the text (Insert → Symbol)
		const walker = this.doc.createTreeWalker( body, 4 );
		for ( let node = walker.nextNode(); node; node = walker.nextNode() ) {
			if ( PRIVATE.test( node.data ) ) {
				node.data = unSymbol( node.data );
			}
			PRIVATE.lastIndex = 0;
		}

		body.querySelectorAll( '*' ).forEach( ( el ) => {
			for ( const { name } of [ ...el.attributes ] ) {
				const lower = name.toLowerCase();
				if ( lower.startsWith( 'on' ) || 'srcdoc' === lower || 'formaction' === lower ) {
					el.removeAttribute( name );
				}
			}
			if ( el.style?.length ) {
				scrub( el.style );
			}
			// VML colours are names or #hex; a url() would point at another document
			[ 'fill', 'stroke' ].forEach( ( attr ) => /[(\\]/.test( el.getAttribute( attr ) || '' ) && el.removeAttribute( attr ) );
			// images come out of the file as data: urls, anything else is dropped
			if ( el.hasAttribute( 'src' ) && ! /^data:image\//i.test( el.getAttribute( 'src' ) ) ) {
				el.removeAttribute( 'src' );
			}
			[ 'href', 'xlink:href' ].forEach( ( attr ) => {
				if ( ! el.hasAttribute( attr ) ) {
					return;
				}
				// the picture of a VML shape (an SVG <image>)
				if ( 'image' === el.localName && /^data:image\//i.test( el.getAttribute( attr ) ) ) {
					return;
				}
				const href = safeHref( el.getAttribute( attr ), this.win );
				if ( null === href ) {
					el.removeAttribute( attr );
				} else if ( 'a' === el.localName && ! href.startsWith( '#' ) ) {
					el.setAttribute( attr, href );
					el.target = '_blank';
					el.rel = 'noopener noreferrer';
				}
			} );
		} );
	}

	show( body, styles ) {
		this.host = this.doc.createElement( 'div' );
		this.host.className = 'aldv_docx_host';
		const shadow = this.host.attachShadow( { mode: 'open' } );
		const own = this.doc.createElement( 'style' );
		own.textContent = SHEET;
		shadow.append( ...styles.childNodes, own, ...body.childNodes );
		this.shadow = shadow;
		this.pages = shadow.querySelector( '.docx-wrapper' );
		this.stage.replaceChildren( this.host );
		this.root.classList.add( 'aldv_ready' );
		this.userZoom = 1;
		this.toolbar = new Toolbar( this, {
			zoom: ( level ) => {
				this.userZoom = level;
				this.fit();
			},
		} );

		// links inside the document (table of contents, bookmarks) scroll to their target in the shadow root
		shadow.addEventListener( 'click', ( event ) => {
			const link = event.target.closest?.( 'a[href^="#"]' );
			if ( ! link ) {
				return;
			}
			event.preventDefault();
			let id = link.getAttribute( 'href' ).slice( 1 );
			try {
				id = decodeURIComponent( id );
			} catch ( e ) {
				// not encoded, use it as it is
			}
			const target = id && shadow.getElementById( id );
			target?.scrollIntoView( { behavior: 'smooth', block: 'start' } );
		} );

		this.fit();
		if ( this.win.ResizeObserver ) {
			let timer;
			this.resizer = new this.win.ResizeObserver( () => {
				clearTimeout( timer );
				timer = setTimeout( () => this.fit(), 100 );
			} );
			this.resizer.observe( this.host );
		}
	}

	// a page a bit wider than the block is zoomed down as a whole, so it keeps its look;
	// on a phone the pages keep their paper look, but the text flows to the screen width
	// the visitor's zoom from the toolbar comes on top; in the flowing (phone) layout it makes the text bigger
	fit() {
		if ( ! this.pages ) {
			return;
		}
		const user = this.userZoom || 1;
		this.pages.style.zoom = '';
		this.pages.classList.remove( 'aldv_reflow' );
		const widest = Math.max( 0, ...[ ...this.pages.children ].map( ( page ) => page.offsetWidth ) );
		const room = this.host.clientWidth;
		let zoom = user;
		if ( room && widest > room ) {
			if ( room / widest >= MIN_ZOOM ) {
				zoom = ( room / widest ) * user;
			} else {
				this.pages.classList.add( 'aldv_reflow' );
			}
		}
		this.pages.style.zoom = 1 === zoom ? '' : String( zoom );
	}

	// called by the toolbar; the pages fit the new size
	fullscreen() {
		this.fit();
	}

	destroy() {
		this.destroyed = true;
		this.toolbar?.destroy();
		this.abort?.abort();
		this.resizer?.disconnect();
		if ( this.stage ) {
			this.stage.replaceChildren();
			this.stage.hidden = true;
		}
		this.root.classList.remove( 'aldv_open', 'aldv_ready' );
	}
}
