import { loadFile } from './loadFile';
import { linkOut, safeHref } from './safeUrl';
import { colsCutText, emptySheetText, moreRowsLabel, rowsCutText, sheetsLabel } from './messages';
import Toolbar from './toolbar';

// cells added to the table at a time (500 rows of 50 columns)
const STEP_CELLS = 25000;
// a cell longer than this gets its whole text as a tooltip, the column stays narrow
const LONG = 40;
// a file the worker has not read by then is treated as too large; the worker is stopped
const TIME_LIMIT = 20000;

const failure = ( message, reason ) => Object.assign( new Error( message ), { aldvReason: reason } );

// Reads the file in sheetWorker.js. Where a worker cannot start (the build folder on another domain,
// a Content Security Policy), the same code (sheetData.js) runs in the page instead.
class Reader {
	constructor() {
		this.calls = new Map();
		this.next = 0;
		try {
			this.worker = new Worker( /* webpackChunkName: "sheet-worker" */ new URL( './sheetWorker.js', import.meta.url ) );
			this.worker.onmessage = ( { data } ) => {
				// the worker started: from now on an error means it broke on the file, not that it could not load
				if ( data.ready ) {
					this.ready = true;
					return;
				}
				const call = this.calls.get( data.id );
				this.calls.delete( data.id );
				if ( call ) {
					clearTimeout( call.timer );
					if ( data.error ) {
						call.reject( failure( data.error.message, data.error.reason ) );
					} else {
						call.resolve( data.result );
					}
				}
			};
			// the worker script did not load: the waiting calls run in the page; a worker that broke on the
			// file (out of memory) does not get a second try in the page, where nothing can stop it
			this.worker.onerror = ( event ) => {
				event.preventDefault?.();
				this.stop();
				const waiting = [ ...this.calls.values() ];
				this.calls.clear();
				waiting.forEach( ( call ) => {
					clearTimeout( call.timer );
					if ( this.ready ) {
						call.reject( failure( 'Worker stopped', 'large' ) );
					} else {
						this.local( call.message ).then( call.resolve, call.reject );
					}
				} );
			};
		} catch ( e ) {
			this.worker = null;
		}
	}

	run( message ) {
		if ( ! this.worker ) {
			return this.local( message );
		}
		return new Promise( ( resolve, reject ) => {
			const id = ++this.next;
			const timer = setTimeout( () => {
				this.calls.delete( id );
				this.stop();
				reject( failure( 'Took too long', 'large' ) );
			}, TIME_LIMIT );
			this.calls.set( id, { resolve, reject, timer, message } );
			this.worker.postMessage( { ...message, id } );
		} );
	}

	async local( message ) {
		const data = await import( /* webpackChunkName: "sheet-data" */ './sheetData' );
		try {
			if ( 'open' === message.type ) {
				this.book = data.readBook( message.buffer, message.ext );
				return data.sheetNames( this.book );
			}
			return data.prepareSheet( this.book, message.name, message.header );
		} catch ( error ) {
			throw failure( error.message, data.reasonFor( error ) );
		}
	}

	stop() {
		this.worker?.terminate();
		this.worker = null;
	}
}

// Excel and CSV as a table: sheet tabs, only the used cells, a header row and row numbers that stay in view
export default class Sheet {
	constructor( root, config, { onSheets, editor = false } = {} ) {
		this.root = root;
		this.editor = editor;
		this.doc = root.ownerDocument;
		this.win = this.doc.defaultView || window;
		this.config = config;
		this.onSheets = onSheets;
		this.destroyed = false;
	}

	el( tag, className, text ) {
		const el = this.doc.createElement( tag );
		if ( className ) {
			el.className = className;
		}
		if ( undefined !== text ) {
			el.textContent = text;
		}
		return el;
	}

	spinner() {
		const loading = this.el( 'div', 'aldv_loading' );
		loading.append( this.el( 'span', 'aldv_spinner' ) );
		return loading;
	}

	async init() {
		this.stage = this.root.querySelector( '.aldv_stage' );
		this.stage.replaceChildren( this.spinner() );
		this.stage.hidden = false;
		this.root.classList.add( 'aldv_open' );

		let names;
		try {
			this.abort = new this.win.AbortController();
			const buffer = await ( await loadFile( this.config.url, this.abort.signal ) ).arrayBuffer();
			this.reader = new Reader();
			names = await this.reader.run( { type: 'open', buffer, ext: this.config.ext } );
		} catch ( error ) {
			if ( this.destroyed ) {
				return;
			}
			if ( ! error.aldvReason && 'AbortError' !== error.name && 'TypeError' !== error.name ) {
				error.aldvReason = 'invalid';
			}
			throw error;
		}
		if ( ! this.destroyed ) {
			await this.build( names );
		}
	}

	async build( names ) {
		this.onSheets?.( names );
		const first = names.includes( this.config.sheet ) ? this.config.sheet : names[ 0 ];

		this.box = this.el( 'div', 'aldv_sheet' );
		if ( names.length > 1 ) {
			this.box.append( this.tabs( names, first ) );
		}
		this.scroller = this.el( 'div', 'aldv_sheet_scroll' );
		// the table scrolls by keyboard too
		this.scroller.tabIndex = 0;
		this.scroller.setAttribute( 'role', names.length > 1 ? 'tabpanel' : 'region' );
		this.scroller.addEventListener( 'scroll', () => this.nearEnd() && this.more() );
		this.foot = this.el( 'div', 'aldv_sheet_foot' );
		this.box.append( this.scroller, this.foot );

		await this.show( first );
		if ( ! this.destroyed ) {
			this.stage.replaceChildren( this.box );
			this.root.classList.add( 'aldv_ready' );
			// fullscreen only: a table is read at its own size
			this.toolbar = new Toolbar( this );
		}
	}

	// buttons for the sheets, arrow keys move between them (the WAI-ARIA tabs pattern)
	tabs( names, first ) {
		const list = this.el( 'div', 'aldv_tabs' );
		list.setAttribute( 'role', 'tablist' );
		list.setAttribute( 'aria-label', sheetsLabel() );
		this.tabButtons = names.map( ( name ) => {
			const tab = this.el( 'button', 'aldv_tab', name );
			tab.type = 'button';
			tab.setAttribute( 'role', 'tab' );
			tab.addEventListener( 'click', () => this.show( name ).catch( ( error ) => this.lost( error ) ) );
			list.append( tab );
			return tab;
		} );
		list.addEventListener( 'keydown', ( event ) => {
			const index = this.tabButtons.indexOf( event.target );
			const moves = { ArrowRight: 1, ArrowLeft: -1, Home: -index, End: this.tabButtons.length - 1 - index };
			if ( index < 0 || ! ( event.key in moves ) ) {
				return;
			}
			event.preventDefault();
			const next = this.tabButtons[ ( index + moves[ event.key ] + this.tabButtons.length ) % this.tabButtons.length ];
			next.focus();
			next.click();
		} );
		this.selectTab( first );
		return list;
	}

	selectTab( name ) {
		this.tabButtons?.forEach( ( tab ) => {
			const on = tab.textContent === name;
			tab.setAttribute( 'aria-selected', on ? 'true' : 'false' );
			tab.tabIndex = on ? 0 : -1;
		} );
	}

	// a sheet that could not be read after the file opened (the worker ran out of time): the tab says so
	lost( error ) {
		if ( ! this.destroyed ) {
			this.scroller.replaceChildren( this.el( 'p', 'aldv_sheet_empty', emptySheetText() ) );
			// eslint-disable-next-line no-console
			console.error( 'SoftIcon Document Viewer:', error );
		}
	}

	async show( name ) {
		const ticket = ( this.ticket = ( this.ticket || 0 ) + 1 );
		this.selectTab( name );
		this.scroller.setAttribute( 'aria-label', name );
		this.foot.replaceChildren();
		this.moreButton = null;
		if ( this.box.isConnected ) {
			this.scroller.replaceChildren( this.spinner() );
		}

		const data = await this.reader.run( { type: 'sheet', name, header: !! this.config.header } );
		// another tab was picked while this one was read
		if ( this.destroyed || ticket !== this.ticket ) {
			return;
		}
		this.scroller.scrollTop = 0;
		this.scroller.scrollLeft = 0;
		if ( data.empty ) {
			this.data = null;
			this.scroller.replaceChildren( this.el( 'p', 'aldv_sheet_empty', emptySheetText() ) );
			return;
		}
		this.data = data;

		const table = this.el( 'table', 'aldv_table' );
		if ( data.titles.length ) {
			const caption = table.createCaption();
			caption.className = 'aldv_sheet_title';
			data.titles.forEach( ( text ) => caption.append( this.el( 'div', '', text ) ) );
		}
		const head = this.el( 'thead' );
		const headRow = this.el( 'tr' );
		headRow.append( this.el( 'th', 'aldv_corner' ) );
		if ( data.header ) {
			data.header.forEach( ( cell ) => this.cell( headRow, 'th', cell ) );
		} else {
			data.letters.forEach( ( letter ) => headRow.append( this.el( 'th', 'aldv_col', letter ) ) );
		}
		head.append( headRow );
		this.tbody = this.el( 'tbody' );
		table.append( head, this.tbody );
		this.scroller.replaceChildren( table );

		this.shown = 0;
		this.more();
		if ( data.cutRows ) {
			this.foot.append( this.el( 'p', 'aldv_sheet_note', rowsCutText( data.cutRows.shown, data.cutRows.total ) ) );
		}
		if ( data.cutCols ) {
			this.foot.append( this.el( 'p', 'aldv_sheet_note', colsCutText( data.cutCols.shown, data.cutCols.total ) ) );
		}
	}

	// one cell (see prepareSheet() in sheetData.js); the header row uses th, body rows td
	cell( tr, tag, cell ) {
		if ( null === cell ) {
			return;
		}
		const td = this.el( tag );
		if ( 'th' === tag ) {
			td.scope = 'col';
		}
		if ( cell ) {
			if ( cell.r > 1 ) {
				td.rowSpan = cell.r;
			}
			if ( cell.c > 1 ) {
				td.colSpan = cell.c;
			}
			if ( cell.k ) {
				td.className = 'n' === cell.k ? 'aldv_num' : 'aldv_mid';
			}
			const text = cell.t || '';
			const href = cell.l ? safeHref( cell.l, this.win ) : null;
			if ( href && ! href.startsWith( '#' ) ) {
				const a = this.el( 'a', '', text );
				linkOut( a, href );
				td.append( a );
			} else {
				td.textContent = text;
			}
			if ( text.length > LONG ) {
				td.title = text;
			}
		}
		tr.append( td );
	}

	// the next rows of the sheet, fewer at a time when it is wide
	more() {
		if ( ! this.data ) {
			return;
		}
		const { body } = this.data;
		const columns = Math.max( 1, body[ 0 ]?.cells.length || 1 );
		const end = Math.min( body.length, this.shown + Math.max( 20, Math.floor( STEP_CELLS / columns ) ) );
		const part = this.doc.createDocumentFragment();
		for ( let i = this.shown; i < end; i++ ) {
			const tr = this.el( 'tr' );
			const number = this.el( 'th', 'aldv_row', String( body[ i ].n ) );
			number.scope = 'row';
			tr.append( number );
			body[ i ].cells.forEach( ( cell ) => this.cell( tr, 'td', cell ) );
			part.append( tr );
		}
		this.tbody.append( part );
		this.shown = end;

		this.moreButton?.remove();
		this.moreButton = null;
		if ( end < body.length ) {
			this.moreButton = this.el( 'button', 'aldv_more wp-element-button', moreRowsLabel( end, body.length ) );
			this.moreButton.type = 'button';
			this.moreButton.addEventListener( 'click', () => this.more() );
			this.foot.prepend( this.moreButton );
		}
	}

	nearEnd() {
		const s = this.scroller;
		return s.scrollTop + s.clientHeight > s.scrollHeight - 300;
	}

	destroy() {
		this.destroyed = true;
		this.toolbar?.destroy();
		this.abort?.abort();
		this.reader?.stop();
		this.data = null;
		if ( this.stage ) {
			this.stage.replaceChildren();
			this.stage.hidden = true;
		}
		this.root.classList.remove( 'aldv_open', 'aldv_ready' );
	}
}
