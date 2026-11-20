import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import Header from './Header';
import VideoPopup from './VideoPopup';
import useRoute from './useRoute';

const keys = ( config ) => config.tabs.map( ( tab ) => tab.key );

// a short review request (includes/class-dashboard.php review()); any answer hides it, "later" for 30 days
const Review = ( { review } ) => {
	const [ open, setOpen ] = useState( true );
	if ( ! open ) {
		return null;
	}
	const answer = ( value ) => {
		setOpen( false );
		apiFetch( { path: '/softicon-document-viewer/v1/dashboard/review', method: 'POST', data: { answer: value } } ).catch( () => {} );
	};
	return <div className="notice inline aldv-notice aldv-review notice-info" role="status">
		<p><strong>{ __( 'Enjoying Document Viewer?', 'softicon-document-viewer' ) }</strong> { __( 'A quick review on WordPress.org helps other people find it, and it means a lot to our small team.', 'softicon-document-viewer' ) }</p>
		<p className="aldv-review-actions">
			<a className="button button-primary" href={ review.url } target="_blank" rel="noopener noreferrer" onClick={ () => answer( 'done' ) }>{ __( 'Leave a review', 'softicon-document-viewer' ) }</a>
			<button type="button" className="button" onClick={ () => answer( 'later' ) }>{ __( 'Maybe later', 'softicon-document-viewer' ) }</button>
			<button type="button" className="button-link" onClick={ () => answer( 'done' ) }>{ __( 'I already did', 'softicon-document-viewer' ) }</button>
		</p>
	</div>;
};

const App = ( { config, tabs } ) => {
	const [ allKeys ] = useState( () => keys( config ) );
	const route = useRoute( allKeys );
	const [ video, setVideo ] = useState( null );

	// '#/videos' is the video list on the Welcome tab
	const key = 'videos' === route ? 'welcome' : route;
	const tab = allKeys.includes( key ) && tabs[ key ] ? key : allKeys[ 0 ];
	const Content = tabs[ tab ];

	useEffect( () => {
		if ( 'videos' === route ) {
			document.getElementById( 'aldv-videos' )?.scrollIntoView( { behavior: 'smooth' } );
		}
	}, [ route ] );

	return <>
		<Header config={ config } active={ tab } />
		<div className="aldv-dash-body">
			{ config.review && <Review review={ config.review } /> }
			<Content config={ config } play={ setVideo } />
		</div>
		<VideoPopup video={ video } onClose={ () => setVideo( null ) } />
	</>;
};

export default App;
