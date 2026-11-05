// Reading a spreadsheet and getting one sheet ready to draw. No DOM here: this runs in sheetWorker.js,
// or in the page when a worker cannot start. What it returns is plain data, so it can be posted from the worker.

// SheetJS CE from the cdn.sheetjs.com tarball, not npm's old xlsx 0.18.5 (see PROJECT-NOTES.md §5)
import { CFB, read, utils } from 'xlsx';
import { zipTooBig } from './zipCheck';

// a crafted or simply huge file must not freeze the visitor's tab
export const MAX_ROWS = 20000;
const MAX_COLS = 1000;
const MAX_CELLS = 500000;
const MAX_SHEETS = 255;
// cells a merge may hide, all merges together; a file can claim one merge over the whole grid
const MAX_COVERED = 200000;
const MAX_TITLES = 3;
// a link may cover at most this many cells; SheetJS makes a cell object for every cell a link range covers
const MAX_LINK_CELLS = 10000;

// a CSV saved by Excel on Windows is often not UTF-8
const decode = ( buffer ) => {
	try {
		return new TextDecoder( 'utf-8', { fatal: true } ).decode( buffer );
	} catch ( e ) {
		return new TextDecoder( 'windows-1252' ).decode( buffer );
	}
};

const invalid = ( message ) => Object.assign( new Error( message ), { aldvReason: 'invalid' } );

// an .xlsx is a zip (PK), an .xls an OLE file (also what a password turns an .xlsx into); without this
// check SheetJS reads any other file as plain text and shows its lines as a table
const SIGNATURES = [ [ 0x50, 0x4b, 0x03, 0x04 ], [ 0xd0, 0xcf, 0x11, 0xe0 ] ];
const looksRight = ( ext, buffer ) => {
	const bytes = new Uint8Array( buffer, 0, Math.min( 8, buffer.byteLength ) );
	if ( SIGNATURES.some( ( sig ) => sig.every( ( b, i ) => bytes[ i ] === b ) ) ) {
		return true;
	}
	// Excel also opens XML and HTML tables saved as .xls
	return 'xls' === ext && 0x3c === bytes[ 0xef === bytes[ 0 ] ? 3 : 0 ];
};

// SheetJS has no limit on a hyperlink's range: <hyperlink ref="A1:XFD1048576"> would make 17 billion cells and
// crash the tab. Such a range is cut to its first cell in the sheet's XML before SheetJS reads the file.
const LINK_REF = /(<hyperlink\b[^>]*?\bref=")([A-Z]{1,3})(\d{1,7}):([A-Z]{1,3})(\d{1,7})"/g;
const linkCells = ( a, r1, b, r2 ) => ( Math.abs( utils.decode_col( b ) - utils.decode_col( a ) ) + 1 ) * ( Math.abs( r2 - r1 ) + 1 );
const tameLinks = ( buffer ) => {
	const zip = CFB.read( new Uint8Array( buffer ), { type: 'buffer' } );
	let changed = false;
	zip.FullPaths.forEach( ( path, i ) => {
		const entry = zip.FileIndex[ i ];
		if ( ! /worksheets\/[^/]+\.xml$/i.test( path ) || ! entry?.content?.length ) {
			return;
		}
		const xml = new TextDecoder().decode( entry.content );
		if ( ! xml.includes( '<hyperlink' ) ) {
			return;
		}
		const fixed = xml.replace( LINK_REF, ( match, start, a, r1, b, r2 ) => (
			linkCells( a, +r1, b, +r2 ) > MAX_LINK_CELLS ? start + a + r1 + '"' : match
		) );
		if ( fixed !== xml ) {
			entry.content = new TextEncoder().encode( fixed );
			entry.size = entry.content.length;
			changed = true;
		}
	} );
	return changed ? CFB.write( zip, { fileType: 'zip', type: 'array' } ) : buffer;
};

// the reason a viewer error carries (see messages.js)
export const reasonFor = ( error ) => {
	if ( error?.aldvReason ) {
		return error.aldvReason;
	}
	return /password|encrypt/i.test( String( error?.message ) ) ? 'password' : 'invalid';
};

export const readBook = ( buffer, ext ) => {
	// values only, no formulas or macros; cellStyles for hidden columns; sheetRows stops a long sheet early
	const options = { dense: true, sheetRows: MAX_ROWS, cellFormula: false, cellHTML: false, cellStyles: true, bookVBA: false };
	if ( 'csv' === ext ) {
		const text = decode( buffer );
		// SheetJS would read a "CSV" that starts with "<" as an HTML or XML spreadsheet
		if ( /^\s*</.test( text ) ) {
			throw invalid( 'Not a CSV file' );
		}
		// raw: a CSV value stays the text it is ("00123" keeps its zeros, "1/2" is not made a date)
		return read( text, { ...options, type: 'string', raw: true } );
	}
	if ( ! looksRight( ext, buffer ) ) {
		throw invalid( 'Not a spreadsheet' );
	}
	const bytes = new Uint8Array( buffer, 0, 2 );
	if ( 0x50 === bytes[ 0 ] && 0x4b === bytes[ 1 ] ) {
		if ( zipTooBig( buffer ) ) {
			throw Object.assign( new Error( 'Unpacks too large' ), { aldvReason: 'large' } );
		}
		return read( tameLinks( buffer ), { ...options, type: 'array' } );
	}
	return read( buffer, { ...options, type: 'array' } );
};

// the sheets a visitor sees: hidden sheets are left out
export const sheetNames = ( book ) => {
	const meta = book.Workbook?.Sheets || [];
	const visible = book.SheetNames.filter( ( name, i ) => ! meta[ i ]?.Hidden );
	return ( visible.length ? visible : book.SheetNames ).slice( 0, MAX_SHEETS );
};

const hasValue = ( cell ) => cell && null !== cell.v && undefined !== cell.v && '' !== cell.v;
const textOf = ( cell ) => ( undefined !== cell.w ? String( cell.w ) : String( cell.v ?? '' ) );

// One sheet ready to draw:
// { empty } or { titles, header, letters, body: [ { n, cells } ], cutRows, cutCols }
// A cell is null when a merge covers it, 0 when it is empty, else { t: text, k: 'n' (number, date) | 'm'
// (true/false, error), l: link, r: rows, c: columns }.
export const prepareSheet = ( book, name, header ) => {
	const sheet = book.Sheets[ name ];
	const data = sheet?.[ '!data' ] || [];

	// the part with something in it; a row is only looked at up to MAX_COLS cells
	let top = Infinity;
	let bottom = -1;
	let left = Infinity;
	let right = -1;
	// how wide the sheet really is (a CSV has no !fullref)
	let widest = 0;
	data.forEach( ( row, r ) => {
		widest = Math.max( widest, row?.length || 0 );
		const n = Math.min( row?.length || 0, MAX_COLS );
		for ( let c = 0; c < n; c++ ) {
			if ( hasValue( row[ c ] ) ) {
				top = Math.min( top, r );
				bottom = Math.max( bottom, r );
				left = Math.min( left, c );
				right = Math.max( right, c );
			}
		}
	} );
	if ( bottom < 0 ) {
		return { empty: true };
	}

	// hidden rows and columns are left out
	const cols = [];
	for ( let c = left; c <= right; c++ ) {
		if ( ! sheet[ '!cols' ]?.[ c ]?.hidden ) {
			cols.push( c );
		}
	}
	let rows = [];
	for ( let r = top; r <= bottom; r++ ) {
		if ( ! sheet[ '!rows' ]?.[ r ]?.hidden ) {
			rows.push( r );
		}
	}
	// a wide sheet gets fewer rows, so the table stays under MAX_CELLS
	rows = rows.slice( 0, Math.max( 2, Math.floor( MAX_CELLS / Math.max( 1, cols.length ) ) ) );

	// the real size: rows read stop at MAX_ROWS, !fullref still has all of them
	const full = sheet[ '!fullref' ] ? utils.decode_range( sheet[ '!fullref' ] ) : null;
	const lastShown = rows[ rows.length - 1 ] + 1;
	const allRows = Math.max( full ? full.e.r + 1 : 0, bottom + 1 );
	const allCols = Math.max( full ? full.e.c + 1 : 0, right + 1, widest );

	const filled = ( r ) => ( data[ r ] || [] ).slice( 0, MAX_COLS ).filter( hasValue );
	// a report often starts with a title in one cell (merged across) above the real column names:
	// such rows become the caption, so the column names are the header that stays in view
	let titles = 0;
	if ( header ) {
		while ( titles < MAX_TITLES && titles < rows.length - 1 && 1 === filled( rows[ titles ] ).length && filled( rows[ titles + 1 ] ).length > 1 ) {
			titles++;
		}
	}
	const headerRow = header ? rows[ titles ] : -1;

	// merges that start inside the shown cells, cut to them; one in the header row stays in the header row
	const spans = new Map();
	const covered = new Set();
	const bottomShown = rows[ rows.length - 1 ];
	const rightShown = cols[ cols.length - 1 ];
	let budget = MAX_COVERED;
	for ( const { s, e } of sheet[ '!merges' ] || [] ) {
		if ( s.r < top || s.r > bottomShown || s.c < left || s.c > rightShown ) {
			continue;
		}
		const last = Math.min( s.r === headerRow ? s.r : e.r, bottomShown );
		const end = Math.min( e.c, rightShown );
		const area = ( ( last - s.r + 1 ) * ( end - s.c + 1 ) ) - 1;
		if ( area < 1 || area > budget ) {
			continue;
		}
		budget -= area;
		spans.set( s.r + ':' + s.c, { r: last - s.r + 1, c: end - s.c + 1 } );
		for ( let r = s.r; r <= last; r++ ) {
			for ( let c = s.c; c <= end; c++ ) {
				if ( r !== s.r || c !== s.c ) {
					covered.add( r + ':' + c );
				}
			}
		}
	}

	const cell = ( r, c ) => {
		const key = r + ':' + c;
		if ( covered.has( key ) ) {
			return null;
		}
		const value = data[ r ]?.[ c ];
		const span = spans.get( key );
		if ( ! hasValue( value ) && ! span ) {
			return 0;
		}
		const out = {};
		if ( hasValue( value ) ) {
			out.t = textOf( value );
			if ( 'n' === value.t || 'd' === value.t ) {
				out.k = 'n';
			} else if ( 'b' === value.t || 'e' === value.t ) {
				out.k = 'm';
			}
			// links to a place in the workbook (#Sheet2!A1) are left out; others are checked in the page
			if ( value.l?.Target && ! String( value.l.Target ).startsWith( '#' ) ) {
				out.l = String( value.l.Target );
			}
		}
		if ( span ) {
			out.r = span.r;
			out.c = span.c;
		}
		return out;
	};

	const bodyStart = header ? titles + 1 : 0;
	return {
		titles: rows.slice( 0, titles ).map( ( r ) => {
			const first = filled( r )[ 0 ];
			return first ? textOf( first ) : '';
		} ),
		header: header ? cols.map( ( c ) => cell( headerRow, c ) ) : null,
		letters: header ? null : cols.map( ( c ) => utils.encode_col( c ) ),
		body: rows.slice( bodyStart ).map( ( r ) => ( { n: r + 1, cells: cols.map( ( c ) => cell( r, c ) ) } ) ),
		cutRows: allRows > lastShown ? { shown: lastShown, total: allRows } : null,
		cutCols: allCols > right + 1 && right + 1 >= MAX_COLS ? { shown: MAX_COLS, total: allCols } : null,
	};
};
