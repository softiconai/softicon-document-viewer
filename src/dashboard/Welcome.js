import { __ } from '@wordpress/i18n';
import VideoLink from './VideoLink';
import GettingStarted from './GettingStarted';

// the editor opened for the way picked; the block then says what to do next (src/utils/guide.js)
const withStart = ( href, mode ) => {
	const url = new URL( href, window.location.href );
	url.searchParams.set( 'aldv_start', mode );
	return url.toString();
};

// the first question: a block inside a page, or a document with a shortcode for the Classic Editor and page builders.
// The one that fits the editor this site uses is marked
const Choice = ( { config } ) => {
	const { start, urls } = config;
	const shortcodeSite = start.classic || start.elementor;
	const options = [
		{
			key: 'block',
			icon: 'block-default',
			title: __( 'Block', 'softicon-document-viewer' ),
			text: __( 'Add the file right inside a page or post, in the block editor.', 'softicon-document-viewer' ),
			action: __( 'Open a new page', 'softicon-document-viewer' ),
			href: withStart( urls.newPage, 'block' ),
			fits: ! shortcodeSite,
		},
		{
			key: 'shortcode',
			icon: 'shortcode',
			title: __( 'Shortcode', 'softicon-document-viewer' ),
			text: __( 'Set up the document once, then paste its shortcode in the Classic Editor, Elementor or any page builder.', 'softicon-document-viewer' ),
			action: __( 'Add a document', 'softicon-document-viewer' ),
			href: withStart( urls.newDocument, 'shortcode' ),
			fits: shortcodeSite,
		},
	];
	return <div className="aldv-choice">
		<h3>{ __( 'How do you want to add your file?', 'softicon-document-viewer' ) }</h3>
		<div className="aldv-choice-cards">
			{ options.map( ( option ) => <a key={ option.key } className={ 'aldv-choice-card' + ( option.fits ? ' is-fit' : '' ) } href={ option.href }>
				<span className={ 'aldv-choice-icon dashicons dashicons-' + option.icon } aria-hidden="true" />
				<strong>{ option.title }{ option.fits && <span className="aldv-choice-fit">{ __( 'Fits this site', 'softicon-document-viewer' ) }</span> }</strong>
				<span className="aldv-choice-text">{ option.text }</span>
				<span className="aldv-choice-go">{ option.action } &rarr;</span>
			</a> ) }
		</div>
		<p className="aldv-choice-more">
			<a href="#/documents">{ __( 'See your documents', 'softicon-document-viewer' ) }</a>
		</p>
	</div>;
};

const Welcome = ( { config, play } ) => <>
	<section className="aldv-hero">
		<div>
			<h2>{ __( 'PDF, Word and Excel files, right on your pages', 'softicon-document-viewer' ) }</h2>
			<p>{ __( 'Visitors read the file on the page, search it and download it. It opens in their browser, straight from your site: no Google or Microsoft viewer, no account, nothing sent anywhere.', 'softicon-document-viewer' ) }</p>
			<Choice config={ config } />
		</div>
		{ config.videos[ 0 ] && <VideoLink className="aldv-hero-video" url={ config.videos[ 0 ].url } title={ config.videos[ 0 ].title } play={ play }>
			<span className="dashicons dashicons-controls-play" aria-hidden="true" />
			{ config.videos[ 0 ].title }
		</VideoLink> }
	</section>

	<GettingStarted config={ config } play={ play } />

	<h2 className="aldv-title" id="aldv-videos">{ __( 'Videos', 'softicon-document-viewer' ) }</h2>
	<div className="aldv-grid aldv-videos">
		{ config.videos.map( ( video ) => <VideoLink key={ video.url } className="aldv-card aldv-video" url={ video.url } title={ video.title } play={ play }>
			<span className="dashicons dashicons-video-alt3" aria-hidden="true" />{ video.title }
		</VideoLink> ) }
	</div>
</>;

export default Welcome;
