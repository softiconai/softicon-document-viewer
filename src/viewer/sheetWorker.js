// SheetJS in a worker: a file made to blow it up (a huge link range, a zip bomb) can only take this worker down,
// which Sheet.js stops after a time limit, and the page stays responsive while a big file is read.
import { prepareSheet, readBook, reasonFor, sheetNames } from './sheetData';

let book = null;

self.onmessage = ( { data } ) => {
	const { id, type } = data;
	try {
		let result;
		if ( 'open' === type ) {
			book = readBook( data.buffer, data.ext );
			result = sheetNames( book );
		} else if ( 'sheet' === type ) {
			result = prepareSheet( book, data.name, data.header );
		}
		self.postMessage( { id, result } );
	} catch ( error ) {
		self.postMessage( { id, error: { message: String( error?.message || error ), reason: reasonFor( error ) } } );
	}
};
