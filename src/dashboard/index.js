// the Document Viewer dashboard: one React page, each tab a #/route (includes/class-dashboard.php prints only the box and the config)
import { createRoot } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import App from './App';
import Welcome from './Welcome';
import Documents from './Documents';
import Help from './Help';

const start = () => {
	const root = document.getElementById( 'aldv-dashboard' );
	const config = window.aldvDashboard;
	if ( ! root || ! config ) {
		return;
	}
	// an add-on puts its own tabs here
	const tabs = applyFilters( 'aldv.dashboard.tabs', { welcome: Welcome, documents: Documents, help: Help }, config );
	createRoot( root ).render( <App config={ config } tabs={ tabs } /> );
};

// after every script on the page has run, so add-ons have added their tabs
if ( 'loading' === document.readyState ) {
	document.addEventListener( 'DOMContentLoaded', start );
} else {
	start();
}
