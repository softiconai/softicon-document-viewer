import './public-path';
import { viewers } from './viewer/viewers';
import { errorText, reasonOf } from './viewer/messages';

const SELECTOR = '.aldv_viewer';

// the viewer could not open the file: the file card with its download link stays, with the reason under it
const fail = ( el, config, error ) => {
	el.aldv?.destroy();
	el.aldv = null;
	const message = document.createElement( 'p' );
	message.className = 'aldv_message';
	message.setAttribute( 'role', 'status' );
	message.textContent = errorText( reasonOf( error, config.url, window ) );
	el.querySelector( '.aldv_file' )?.after( message );
	// eslint-disable-next-line no-console
	console.error( 'SoftIcon Document Viewer:', error );
};

const start = async ( el ) => {
	let config;
	try {
		config = JSON.parse( el.dataset.aldv || '{}' );
	} catch ( e ) {
		return;
	}
	// only the plugin's own viewers, and only web addresses: post content can hold a hand-written data-aldv
	const load = Object.prototype.hasOwnProperty.call( viewers, config.viewer ) && viewers[ config.viewer ];
	if ( ! load ) {
		return;
	}
	try {
		if ( ! [ 'http:', 'https:' ].includes( new URL( config.url, window.location.href ).protocol ) ) {
			return;
		}
	} catch ( e ) {
		return;
	}
	try {
		const { default: Viewer } = await load();
		el.aldv = new Viewer( el, config );
		await el.aldv.init();
	} catch ( error ) {
		fail( el, config, error );
	}
};

const whenNear = ( elements, callback ) => {
	if ( ! ( 'IntersectionObserver' in window ) ) {
		elements.forEach( callback );
		return;
	}
	const observer = new IntersectionObserver( ( entries ) => entries.forEach( ( entry ) => {
		if ( entry.isIntersecting ) {
			observer.unobserve( entry.target );
			callback( entry.target );
		}
	} ), { rootMargin: '300px 0px' } );
	elements.forEach( ( el ) => observer.observe( el ) );
};

// each element once, a later boot only picks up the new ones
const boot = () => {
	const all = [ ...document.querySelectorAll( SELECTOR ) ].filter( ( el ) => ! el.aldvSeen );
	all.forEach( ( el ) => {
		el.aldvSeen = true;
	} );
	whenNear( all, start );
};

if ( 'loading' === document.readyState ) {
	document.addEventListener( 'DOMContentLoaded', boot );
} else {
	boot();
}

// for documents added to the page later, e.g. in a popup
document.addEventListener( 'aldv:boot', boot );
