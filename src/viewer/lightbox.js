import { lightboxText } from './messages';
import { ICONS } from './icons';

// Lightbox: the page keeps only the file card, with a button that opens the viewer in a <dialog> over the page.
// The dialog sits inside the block (the top layer shows it above a clipped or transformed parent, and the block's
// colors still reach it); the viewer opens on the first click and stays open for the next one.
// Returns false when the browser has no <dialog>: the block then shows the viewer on the page.
export default function lightbox( el, config, load, mount ) {
	const doc = el.ownerDocument;
	const card = el.querySelector( '.aldv_file' );
	const actions = card?.querySelector( '.aldv_actions' );
	if ( ! actions || 'function' !== typeof doc.createElement( 'dialog' ).showModal ) {
		return false;
	}
	const text = lightboxText();

	// the dialog's header is a copy of the card: name, the viewer's buttons, Download, and Close
	const head = card.cloneNode( true );
	const close = doc.createElement( 'button' );
	close.type = 'button';
	close.className = 'aldv_btn aldv_close';
	close.setAttribute( 'aria-label', text.close );
	close.title = text.close;
	close.innerHTML = ICONS.close;
	close.autofocus = true;
	head.querySelector( '.aldv_actions' ).append( close );

	const stage = doc.createElement( 'div' );
	stage.className = 'aldv_stage';
	stage.hidden = true;

	const root = doc.createElement( 'div' );
	root.className = 'aldv_viewer aldv_' + config.viewer;
	// a later boot (aldv:boot) leaves it alone
	root.aldvSeen = true;
	root.append( head, stage );

	const dialog = doc.createElement( 'dialog' );
	dialog.className = 'aldv_box';
	dialog.setAttribute( 'aria-label', String( config.name || '' ) );
	dialog.append( root );
	close.addEventListener( 'click', () => dialog.close() );
	// a click on the dark backdrop closes it too; Esc is the browser's own
	dialog.addEventListener( 'click', ( event ) => event.target === dialog && dialog.close() );

	const button = doc.createElement( 'button' );
	button.type = 'button';
	button.className = 'aldv_view wp-element-button';
	button.setAttribute( 'aria-haspopup', 'dialog' );
	button.textContent = ( 'string' === typeof config.button && config.button.slice( 0, 60 ).trim() ) || text.open;
	actions.insertBefore( button, actions.querySelector( '.aldv_download' ) );
	// back to the button on close (Safari leaves the focus on the page)
	dialog.addEventListener( 'close', () => button.focus( { preventScroll: true } ) );

	// the viewer's code starts loading when the visitor points at or tabs to the button
	const preload = () => load().catch( () => {} );
	button.addEventListener( 'pointerenter', preload, { once: true } );
	button.addEventListener( 'focus', preload, { once: true } );

	let opened = false;
	button.addEventListener( 'click', () => {
		if ( ! dialog.isConnected ) {
			el.append( dialog );
		}
		dialog.showModal();
		if ( opened ) {
			return;
		}
		opened = true;
		stage.innerHTML = '<div class="aldv_loading"><span class="aldv_spinner"></span></div>';
		stage.hidden = false;
		// the stage scrolls inside the dialog, like a fixed height; the dialog is already as big as the screen
		mount( root, { ...config, fixed: true, fullscreen: false }, load );
	} );

	return true;
}
