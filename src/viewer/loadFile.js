// a bigger download would freeze the visitor's tab (a zip bomb is caught by zipCheck.js)
export const MAX_BYTES = 50 * 1024 * 1024;

const failure = ( message, reason ) => {
	const error = new Error( message );
	error.aldvReason = reason;
	return error;
};

// the file as a Blob; a missing file is told apart from a network or CORS failure (fetch throws a TypeError),
// a file over MAX_BYTES is refused before it downloads when the server says its size
export const loadFile = async ( url, signal ) => {
	const response = await fetch( url, { signal } );
	if ( ! response.ok ) {
		throw failure( 'HTTP ' + response.status, 404 === response.status || 410 === response.status ? 'missing' : 'failed' );
	}
	if ( Number( response.headers.get( 'content-length' ) ) > MAX_BYTES ) {
		response.body?.cancel();
		throw failure( 'File too large', 'large' );
	}
	const blob = await response.blob();
	if ( blob.size > MAX_BYTES ) {
		throw failure( 'File too large', 'large' );
	}
	return blob;
};
