// The Cells to show setting: "A1:F20", whole columns "A:F" or whole rows "5:40", the way Excel writes them
// ($ and spaces are fine, 3 to 30 characters, the same check as Block::config()). Gives { s: { r, c }, e: { r, c } },
// counted from 0, Infinity for an open end; null for anything else. No SheetJS here: the editor uses it too.
const column = ( letters ) => [ ...letters ].reduce( ( n, ch ) => ( n * 26 ) + ch.charCodeAt( 0 ) - 64, 0 ) - 1;

export const parseRange = ( value ) => {
	const raw = String( value || '' );
	if ( ! /^[A-Za-z0-9$: ]{3,30}$/.test( raw ) ) {
		return null;
	}
	const text = raw.replace( /[ $]/g, '' ).toUpperCase();
	const match = /^([A-Z]{1,3})?([1-9]\d{0,6})?:([A-Z]{1,3})?([1-9]\d{0,6})?$/.exec( text );
	if ( ! match ) {
		return null;
	}
	const [ , c1, r1, c2, r2 ] = match;
	// both ends of the same kind
	if ( !! c1 !== !! c2 || !! r1 !== !! r2 || ( ! c1 && ! r1 ) ) {
		return null;
	}
	const cols = c1 ? [ column( c1 ), column( c2 ) ] : [ 0, Infinity ];
	const rows = r1 ? [ r1 - 1, r2 - 1 ] : [ 0, Infinity ];
	return {
		s: { r: Math.min( ...rows ), c: Math.min( ...cols ) },
		e: { r: Math.max( ...rows ), c: Math.max( ...cols ) },
	};
};
