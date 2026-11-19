/* global __webpack_public_path__ */
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { pageLabel } from './messages';
import Toolbar from './toolbar';
import { LIMIT, findAll, indexParts, segments } from './find';

// pages are drawn when they come this close to the screen, and freed again when they move further away
const NEAR = '150% 0px';
// sharp on retina screens, but at most 2x and 16 million pixels a page (the canvas limit on iPhones)
const MAX_DPR = 2;
const MAX_PIXELS = 16e6;
// a broken or hostile file cannot make the page build hundreds of thousands of boxes
const MAX_PAGES = 2000;

// pdf.js CMaps and standard fonts, stored as base64 JSON by webpack.config.js
class JsonDataFactory {
	constructor( urls ) {
		this.urls = urls;
	}

	async fetch( { kind, filename } ) {
		const url = this.urls[ kind ] + filename + '.json';
		const response = await fetch( url );
		if ( ! response.ok ) {
			throw new Error( 'Unable to load ' + url );
		}
		const binary = atob( await response.json() );
		const bytes = new Uint8Array( binary.length );
		for ( let i = 0; i < binary.length; i++ ) {
			bytes[ i ] = binary.charCodeAt( i );
		}
		return bytes;
	}
}

// one pdf.js worker for every PDF on the page; a document closing leaves a worker it was given running
let worker;
const sharedWorker = () => {
	if ( ! worker || worker.destroyed ) {
		worker = new pdfjs.PDFWorker( { verbosity: pdfjs.VerbosityLevel.ERRORS } );
	}
	return worker;
};

// pdf.js errors the visitor should hear about (see messages.js)
const reasonOf = ( error ) => {
	if ( 'PasswordException' === error?.name ) {
		return 'password';
	}
	if ( 'InvalidPDFException' === error?.name ) {
		return 'invalid';
	}
	return 'ResponseException' === error?.name && error.missing ? 'missing' : '';
};

// a result's boxes on one line become one box (a word can be stored in pieces, like "Bright", "fi", "eld")
const joinLines = ( boxes ) => boxes.reduce( ( lines, box ) => {
	const line = lines.find( ( l ) => Math.min( l.bottom, box.bottom ) - Math.max( l.top, box.top ) > ( box.bottom - box.top ) / 2 );
	if ( line ) {
		line.left = Math.min( line.left, box.left );
		line.right = Math.max( line.right, box.right );
		line.top = Math.min( line.top, box.top );
		line.bottom = Math.max( line.bottom, box.bottom );
	} else {
		lines.push( { ...box } );
	}
	return lines;
}, [] );

// PDF pages one below the other; only the pages near the screen are drawn
export default class Pdf {
	constructor( root, config, { editor = false } = {} ) {
		this.root = root;
		this.editor = editor;
		this.doc = root.ownerDocument;
		this.win = this.doc.defaultView || window;
		this.config = config;
		this.pages = [];
		// the canvas width each page was drawn at, 0 when it is not drawn
		this.drawn = [];
		this.near = new Set();
		this.queue = Promise.resolve();
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

		let ratio;
		try {
			ratio = await this.open();
		} catch ( error ) {
			if ( this.destroyed ) {
				return;
			}
			error.aldvReason = reasonOf( error );
			throw error;
		}
		if ( ! this.destroyed ) {
			this.build( ratio );
		}
	}

	// opens the file, gives the width / height of the first page
	async open() {
		// eslint-disable-next-line camelcase -- webpack's own name, set in public-path.js
		const base = __webpack_public_path__ + 'pdfjs/';
		pdfjs.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.js?ver=' + pdfjs.version;

		this.task = pdfjs.getDocument( {
			url: this.config.url,
			worker: sharedWorker(),
			cMapUrl: base + 'cmaps/',
			cMapPacked: true,
			standardFontDataUrl: base + 'standard_fonts/',
			BinaryDataFactory: JsonDataFactory,
			// JavaScript image decoders instead of WebAssembly
			useWasm: false,
			wasmUrl: base + 'decoders/',
			// the PDF fonts go into the document that holds the canvases (the editor canvas is an iframe)
			ownerDocument: this.doc,
			// only the parts of the file the shown pages need are fetched (range requests);
			// a server without range support still sends the whole file
			disableAutoFetch: true,
			disableStream: true,
			// pdf.js warnings (missing system fonts, JS fallbacks) are not useful to site visitors
			verbosity: pdfjs.VerbosityLevel.ERRORS,
		} );
		this.pdf = await this.task.promise;
		const first = ( await this.pdf.getPage( 1 ) ).getViewport( { scale: 1 } );
		return first.width / first.height;
	}

	// an empty box for every page, sized like the first page until the page itself is read
	build( ratio ) {
		const count = Math.min( this.pdf.numPages, MAX_PAGES );
		const list = this.doc.createElement( 'div' );
		list.className = 'aldv_pages';
		for ( let i = 0; i < count; i++ ) {
			const box = this.doc.createElement( 'div' );
			box.className = 'aldv_page';
			box.dataset.index = i;
			box.style.aspectRatio = ratio;
			box.setAttribute( 'role', 'img' );
			box.setAttribute( 'aria-label', pageLabel( i + 1, count ) );
			this.pages.push( box );
			list.append( box );
		}
		this.list = list;
		this.stage.replaceChildren( list );
		this.root.classList.add( 'aldv_ready' );

		// zoom changes the width of the pages; the ResizeObserver below draws them again
		this.toolbar = new Toolbar( this, {
			zoom: ( level ) => list.style.setProperty( '--aldv-zoom', level ),
			pages: count,
			search: { find: ( query ) => this.find( query ), clear: () => this.clearMarks( true ) },
		} );
		this.observe();

		// the block can change width without a window resize (editor sidebar, columns, phone rotation)
		if ( this.win.ResizeObserver ) {
			let width = list.clientWidth;
			let timer;
			this.resizer = new this.win.ResizeObserver( () => {
				if ( list.clientWidth === width ) {
					return;
				}
				width = list.clientWidth;
				clearTimeout( timer );
				timer = setTimeout( () => this.near.forEach( ( index ) => this.draw( index ) ), 150 );
			} );
			this.resizer.observe( list );
		}
	}

	// what scrolls the pages: the stage when the block has a fixed height or is fullscreen, else the window
	// (of the document that holds the block, so the editor iframe's own scrolling counts)
	scrollBox() {
		return this.config.fixed || this.full ? this.stage : null;
	}

	// pages near the scroll box are drawn, the others freed; the page counter follows the scrolling
	observe() {
		this.observer?.disconnect();
		this.offScroll?.();
		const box = this.scrollBox();
		this.observer = new this.win.IntersectionObserver( ( entries ) => entries.forEach( ( entry ) => {
			const index = Number( entry.target.dataset.index );
			if ( entry.isIntersecting ) {
				this.near.add( index );
				this.draw( index );
			} else {
				this.near.delete( index );
				this.free( index );
			}
		} ), { root: box, rootMargin: NEAR } );
		this.pages.forEach( ( page ) => this.observer.observe( page ) );

		const target = box || this.win;
		const onScroll = () => {
			if ( ! this.ticking ) {
				this.ticking = true;
				this.win.requestAnimationFrame( () => {
					this.ticking = false;
					this.trackPage();
				} );
			}
		};
		target.addEventListener( 'scroll', onScroll, { passive: true } );
		this.offScroll = () => target.removeEventListener( 'scroll', onScroll );
		this.trackPage();
	}

	// the page a third of the way down the scroll box, found by halving (pages are in order)
	trackPage() {
		if ( ! this.toolbar || ! this.pages.length ) {
			return;
		}
		const box = this.scrollBox();
		const line = box ? box.getBoundingClientRect().top + ( box.clientHeight / 3 ) : this.win.innerHeight / 3;
		let low = 0;
		let high = this.pages.length - 1;
		while ( low < high ) {
			const mid = Math.floor( ( low + high ) / 2 );
			if ( this.pages[ mid ].getBoundingClientRect().bottom < line ) {
				low = mid + 1;
			} else {
				high = mid;
			}
		}
		this.toolbar.page( low + 1 );
	}

	// called by the toolbar
	fullscreen( on ) {
		this.full = on;
		this.observe();
	}

	targetWidth( index ) {
		return Math.ceil( this.pages[ index ].clientWidth * Math.min( this.win.devicePixelRatio || 1, MAX_DPR ) );
	}

	// queues a page; a drawn page is drawn again only when it grew a lot, a smaller one is scaled by CSS
	draw( index ) {
		const width = this.targetWidth( index );
		if ( ! width || ( this.drawn[ index ] && this.drawn[ index ] >= width * 0.8 ) ) {
			return;
		}
		this.drawn[ index ] = width;
		this.queue = this.queue.then( () => this.render( index, width ) ).catch( () => {
			this.drawn[ index ] = 0;
		} );
	}

	async render( index, width ) {
		// skip a page that moved away or was queued again while it waited
		if ( this.destroyed || ! this.near.has( index ) || this.drawn[ index ] !== width ) {
			return;
		}
		const page = await this.pdf.getPage( index + 1 );
		const size = page.getViewport( { scale: 1 } );
		this.pages[ index ].style.aspectRatio = size.width / size.height;

		const scale = Math.min( width / size.width, Math.sqrt( MAX_PIXELS / ( size.width * size.height ) ) );
		const viewport = page.getViewport( { scale } );
		const canvas = this.doc.createElement( 'canvas' );
		canvas.width = Math.floor( viewport.width );
		canvas.height = Math.floor( viewport.height );

		this.rendering = page.render( { canvas, viewport } );
		try {
			await this.rendering.promise;
		} finally {
			this.rendering = null;
			page.cleanup();
		}

		if ( ! this.destroyed && this.near.has( index ) && this.drawn[ index ] === width ) {
			// the search marks stay on top of the new drawing
			this.pages[ index ].querySelector( 'canvas' )?.remove();
			this.pages[ index ].prepend( canvas );
		} else {
			canvas.width = canvas.height = 0;
		}
	}

	// the text of every page, read once when the visitor first searches: [ { items, viewport, text, map } ]
	readText() {
		if ( ! this.textRead ) {
			this.textRead = ( async () => {
				const texts = [];
				for ( let i = 0; i < this.pages.length && ! this.destroyed; i++ ) {
					const page = await this.pdf.getPage( i + 1 );
					const content = await page.getTextContent();
					const items = content.items.filter( ( item ) => 'string' === typeof item.str );
					const viewport = page.getViewport( { scale: 1 } );
					// the marks are placed in this page's own size
					this.pages[ i ].style.aspectRatio = viewport.width / viewport.height;
					texts.push( { items, viewport, styles: content.styles, ...indexParts( items.map( ( item ) => item.str ), items.map( ( item ) => item.hasEOL ) ) } );
				}
				return texts;
			} )();
			// a page that could not be read: the next search tries again
			this.textRead.catch( () => {
				this.textRead = null;
			} );
		}
		return this.textRead;
	}

	// marks every result over the pages; null when a newer search started meanwhile
	async find( query ) {
		const token = this.findToken = ( this.findToken || 0 ) + 1;
		const texts = await this.readText();
		if ( this.destroyed || token !== this.findToken ) {
			return null;
		}
		this.clearMarks();
		const marks = [];
		texts.forEach( ( page, index ) => {
			let layer;
			findAll( page.text, query, LIMIT - marks.length ).forEach( ( start ) => {
				if ( ! layer ) {
					layer = this.doc.createElement( 'div' );
					layer.className = 'aldv_marks';
					this.pages[ index ].append( layer );
				}
				const boxes = segments( page.map, start, start + query.length ).map( ( part ) => this.box( page, part ) );
				marks.push( joinLines( boxes ).map( ( box ) => this.mark( layer, page.viewport, box ) ) );
			} );
		} );
		return marks;
	}

	// the box around part of a text item, in page units; turned text gets the box around its turned outline.
	// Where the part starts and ends is measured in the PDF's font family (a near match of the real font:
	// pdf.js moves the real font's letters to private code points, so it cannot be measured), then stretched
	// to the item's real width.
	box( { items, viewport, styles }, { part, from, to } ) {
		const item = items[ part ];
		const t = pdfjs.Util.transform( viewport.transform, item.transform );
		const angle = Math.atan2( t[ 1 ], t[ 0 ] );
		const cos = Math.cos( angle );
		const sin = Math.sin( angle );
		const size = Math.hypot( t[ 2 ], t[ 3 ] );
		const measure = this.measurer( styles[ item.fontName ]?.fontFamily );
		const whole = measure( item.str ) || 1;
		const xs = [];
		const ys = [];
		[ from, to ].forEach( ( at ) => [ -0.25, 0.95 ].forEach( ( up ) => {
			const along = ( item.width * measure( item.str.slice( 0, at ) ) ) / whole;
			xs.push( t[ 4 ] + ( cos * along ) + ( sin * up * size ) );
			ys.push( t[ 5 ] + ( sin * along ) - ( cos * up * size ) );
		} ) );
		return { left: Math.min( ...xs ), top: Math.min( ...ys ), right: Math.max( ...xs ), bottom: Math.max( ...ys ) };
	}

	// text width in a font family, from a canvas that is never shown
	measurer( family ) {
		this.ruler = this.ruler || this.doc.createElement( 'canvas' ).getContext( '2d' );
		const ruler = this.ruler;
		if ( ! ruler ) {
			return ( text ) => text.length;
		}
		return ( text ) => {
			// pdf.js gives a generic family (sans-serif, serif, monospace); anything else is not used
			ruler.font = '100px ' + ( /^[\w -]+$/.test( family || '' ) ? family : 'sans-serif' );
			return ruler.measureText( text ).width;
		};
	}

	// a box in % of the page, so it follows zoom and resizing
	mark( layer, viewport, { left, top, right, bottom } ) {
		const mark = this.doc.createElement( 'span' );
		mark.className = 'aldv_mark';
		mark.style.left = ( ( left / viewport.width ) * 100 ) + '%';
		mark.style.top = ( ( top / viewport.height ) * 100 ) + '%';
		mark.style.width = ( ( ( right - left ) / viewport.width ) * 100 ) + '%';
		mark.style.height = ( ( ( bottom - top ) / viewport.height ) * 100 ) + '%';
		layer.append( mark );
		return mark;
	}

	// cancel: a search still reading the text marks nothing when it is done
	clearMarks( cancel = false ) {
		if ( cancel ) {
			this.findToken = ( this.findToken || 0 ) + 1;
		}
		this.list?.querySelectorAll( '.aldv_marks' ).forEach( ( layer ) => layer.remove() );
	}

	// gives a far away page's canvas memory back, the empty box keeps its size
	free( index ) {
		this.drawn[ index ] = 0;
		const canvas = this.pages[ index ]?.querySelector( 'canvas' );
		if ( canvas ) {
			canvas.width = canvas.height = 0;
			canvas.remove();
		}
	}

	destroy() {
		this.destroyed = true;
		this.toolbar?.destroy();
		this.offScroll?.();
		this.observer?.disconnect();
		this.resizer?.disconnect();
		this.rendering?.cancel();
		this.pages.forEach( ( box, index ) => this.free( index ) );
		this.task?.destroy();
		if ( this.stage ) {
			this.stage.replaceChildren();
			this.stage.hidden = true;
		}
		this.root.classList.remove( 'aldv_open', 'aldv_ready' );
	}
}
