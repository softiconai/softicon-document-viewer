// A DOCX or XLSX is a zip. Its central directory lists how big every file in it is once unpacked, so a zip bomb
// (a small download that unpacks to gigabytes) is caught before JSZip or SheetJS unpack anything.
const MAX_UNPACKED = 500 * 1024 * 1024;
const MAX_ENTRIES = 20000;

// true when the zip unpacks to more than MAX_UNPACKED, or its directory cannot be read safely
export const zipTooBig = ( buffer ) => {
	const view = new DataView( buffer );
	const size = buffer.byteLength;
	// the end-of-central-directory record: within the last 22 + 65,535 bytes (its comment)
	let end = -1;
	for ( let i = size - 22; i >= Math.max( 0, size - 22 - 65535 ); i-- ) {
		if ( 0x06054b50 === view.getUint32( i, true ) ) {
			end = i;
			break;
		}
	}
	if ( end < 0 ) {
		// not a zip at all; the reader says so
		return false;
	}
	const entries = view.getUint16( end + 10, true );
	let offset = view.getUint32( end + 16, true );
	// 0xffff / 0xffffffff mean a ZIP64 file, far bigger than any document a page should show
	if ( 0xffff === entries || 0xffffffff === offset || entries > MAX_ENTRIES ) {
		return true;
	}
	let total = 0;
	for ( let n = 0; n < entries; n++ ) {
		if ( offset + 46 > size || 0x02014b50 !== view.getUint32( offset, true ) ) {
			return true;
		}
		const unpacked = view.getUint32( offset + 24, true );
		if ( 0xffffffff === unpacked ) {
			return true;
		}
		total += unpacked;
		if ( total > MAX_UNPACKED ) {
			return true;
		}
		offset += 46 + view.getUint16( offset + 28, true ) + view.getUint16( offset + 30, true ) + view.getUint16( offset + 32, true );
	}
	return false;
};
