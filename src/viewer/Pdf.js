/* global __webpack_public_path__ */
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { pageLabel } from './messages';

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

// PDF pages one below the other; only the pages near the screen are drawn
export default class Pdf {
	constructor( root, config ) {
		this.root = root;
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
		this.stage.replaceChildren( list );
		this.root.classList.add( 'aldv_ready' );

		// the window of the document that holds the block, so the editor iframe's own scrolling counts
		this.observer = new this.win.IntersectionObserver( ( entries ) => entries.forEach( ( entry ) => {
			const index = Number( entry.target.dataset.index );
			if ( entry.isIntersecting ) {
				this.near.add( index );
				this.draw( index );
			} else {
				this.near.delete( index );
				this.free( index );
			}
		} ), { rootMargin: NEAR } );
		this.pages.forEach( ( box ) => this.observer.observe( box ) );

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
			this.pages[ index ].replaceChildren( canvas );
		} else {
			canvas.width = canvas.height = 0;
		}
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
