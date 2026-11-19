import { findText } from './messages';

// at most this many results are marked; the count then says 1000+
export const LIMIT = 1000;

// Text for searching: lower case, every run of spaces one space, and for each character the part it came
// from and where in it (map.parts, map.offsets; -1 for an added space) so a result can be marked there.
// gapAfter[ p ] puts a space after part p (the end of a line or paragraph), so words on two lines do not run
// together. Plain number arrays, as a long PDF has millions of characters.
export const indexParts = ( parts, gapAfter = [] ) => {
	let text = '';
	const from = [];
	const at = [];
	let space = true;
	const gap = ( p, i ) => {
		if ( ! space ) {
			text += ' ';
			from.push( p );
			at.push( i );
			space = true;
		}
	};
	parts.forEach( ( part, p ) => {
		for ( let i = 0; i < part.length; i++ ) {
			const char = part[ i ];
			if ( /\s/.test( char ) ) {
				gap( p, i );
				continue;
			}
			const low = char.toLowerCase();
			for ( let k = 0; k < low.length; k++ ) {
				text += low[ k ];
				from.push( p );
				at.push( i );
			}
			space = false;
		}
		if ( gapAfter[ p ] ) {
			gap( -1, -1 );
		}
	} );
	return { text, map: { parts: Int32Array.from( from ), offsets: Int32Array.from( at ) } };
};

// the search words, made the same way as the text
export const normalize = ( query ) => indexParts( [ query || '' ] ).text.trim();

// where each result starts
export const findAll = ( text, query, limit ) => {
	const starts = [];
	for ( let at = text.indexOf( query ); -1 !== at && starts.length < limit; at = text.indexOf( query, at + query.length ) ) {
		starts.push( at );
	}
	return starts;
};

// a result as pieces of its parts: [ { part, from, to } ]
export const segments = ( map, start, end ) => {
	const out = [];
	for ( let i = start; i < end; i++ ) {
		const part = map.parts[ i ];
		const offset = map.offsets[ i ];
		if ( part < 0 ) {
			continue;
		}
		const last = out[ out.length - 1 ];
		if ( last && last.part === part ) {
			last.to = offset + 1;
		} else {
			out.push( { part, from: offset, to: offset + 1 } );
		}
	}
	return out;
};

// The search button and the search bar in the file card. The viewer gives
// search: { find( query ) → the marks of each result ( [ [ element, … ], … ] ) or null when a newer search
// started, clear() }; the bar steps through the results and scrolls to them.
export default class FindBar {
	constructor( toolbar, search ) {
		this.search = search;
		this.root = toolbar.root;
		this.doc = toolbar.doc;
		this.win = toolbar.win;
		this.marks = [];
		this.current = -1;
		this.query = '';
		this.offs = [];
		const text = findText();
		this.text = text;

		this.button = toolbar.button( 'search', text.search, () => ( this.bar.hidden ? this.open() : this.close() ) );
		this.button.setAttribute( 'aria-expanded', 'false' );

		this.bar = this.doc.createElement( 'div' );
		this.bar.className = 'aldv_find';
		this.bar.setAttribute( 'role', 'search' );
		this.bar.hidden = true;
		this.input = this.doc.createElement( 'input' );
		this.input.type = 'search';
		this.input.className = 'aldv_find_input';
		this.input.placeholder = text.search;
		this.input.setAttribute( 'aria-label', text.label );
		this.input.enterKeyHint = 'search';
		this.count = this.doc.createElement( 'span' );
		this.count.className = 'aldv_find_count';
		this.count.setAttribute( 'aria-live', 'polite' );
		this.prev = toolbar.button( 'prev', text.prev, () => this.step( -1 ) );
		this.next = toolbar.button( 'next', text.next, () => this.step( 1 ) );
		const close = toolbar.button( 'close', text.close, () => this.close() );
		this.bar.append( this.input, this.count, this.prev, this.next, close );
		this.toolbar = toolbar;
		toolbar.box.closest( '.aldv_file' )?.append( this.bar );
		this.showCount();

		this.on( this.input, 'input', () => {
			clearTimeout( this.timer );
			this.timer = setTimeout( () => this.run(), 250 );
		} );
		this.on( this.input, 'keydown', ( event ) => {
			if ( 'Enter' === event.key ) {
				event.preventDefault();
				if ( normalize( this.input.value ) !== this.query ) {
					this.run();
				} else {
					this.step( event.shiftKey ? -1 : 1 );
				}
			} else if ( 'Escape' === event.key ) {
				// only the search closes, not a lightbox or fullscreen around it
				event.preventDefault();
				event.stopPropagation();
				this.close();
			}
		} );
		// Ctrl+F / Cmd+F in the viewer last clicked, or with the focus in it: a PDF is drawn, so the browser's
		// own search cannot find its words (a click on a page does not move the focus, so the click counts)
		this.on( this.doc, 'pointerdown', ( event ) => {
			this.inside = this.root.contains( event.target );
		} );
		this.on( this.doc, 'keydown', ( event ) => {
			const here = this.inside || this.root.contains( this.doc.activeElement );
			if ( here && ( event.ctrlKey || event.metaKey ) && ! event.altKey && 'f' === event.key.toLowerCase() ) {
				event.preventDefault();
				this.open();
			}
		} );
	}

	on( target, type, handler ) {
		target.addEventListener( type, handler );
		this.offs.push( () => target.removeEventListener( type, handler ) );
	}

	open() {
		this.bar.hidden = false;
		this.button.setAttribute( 'aria-expanded', 'true' );
		this.root.classList.add( 'aldv_finding' );
		this.input.focus();
		this.input.select();
	}

	close() {
		clearTimeout( this.timer );
		this.bar.hidden = true;
		this.button.setAttribute( 'aria-expanded', 'false' );
		this.root.classList.remove( 'aldv_finding' );
		this.reset();
		this.button.focus();
	}

	reset() {
		this.token = ( this.token || 0 ) + 1;
		this.search.clear();
		this.marks = [];
		this.current = -1;
		this.query = '';
		this.showCount();
	}

	async run() {
		clearTimeout( this.timer );
		const query = normalize( this.input.value );
		this.reset();
		if ( ! query ) {
			return;
		}
		const token = this.token;
		this.query = query;
		this.count.textContent = this.text.searching;
		let marks;
		try {
			marks = await this.search.find( query );
		} catch ( error ) {
			marks = [];
		}
		if ( token !== this.token || ! marks ) {
			return;
		}
		this.marks = marks;
		if ( marks.length ) {
			this.show( 0 );
		} else {
			this.showCount();
		}
	}

	step( by ) {
		if ( this.marks.length ) {
			this.show( ( this.current + by + this.marks.length ) % this.marks.length );
		}
	}

	show( index ) {
		this.marks[ this.current ]?.forEach( ( mark ) => mark.classList.remove( 'aldv_mark_now' ) );
		this.current = index;
		const marks = this.marks[ index ];
		marks.forEach( ( mark ) => mark.classList.add( 'aldv_mark_now' ) );
		const still = this.win.matchMedia?.( '(prefers-reduced-motion: reduce)' ).matches;
		marks[ 0 ]?.scrollIntoView( { block: 'center', inline: 'nearest', behavior: still ? 'auto' : 'smooth' } );
		this.showCount();
	}

	showCount() {
		const total = this.marks.length;
		this.prev.disabled = this.next.disabled = total < 2;
		if ( total ) {
			this.count.textContent = this.text.count( this.current + 1, total.toLocaleString() + ( total >= LIMIT ? '+' : '' ) );
		} else {
			this.count.textContent = this.query ? this.text.none : '';
		}
	}

	destroy() {
		clearTimeout( this.timer );
		this.offs.forEach( ( off ) => off() );
		this.bar.remove();
		this.root.classList.remove( 'aldv_finding' );
	}
}
