// the Help tab: the ways to get help, quick answers (from readme.txt's FAQ) and the site details a support topic needs
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import VideoLink from './VideoLink';
import { copyText } from './Copy';

const external = { target: '_blank', rel: 'noopener noreferrer' };
const FORUM = 'https://wordpress.org/support/plugin/softicon-document-viewer/';
const EMAIL = 'softiconai@gmail.com';

const answers = () => [
	{
		q: __( 'Which files can it show?', 'softicon-document-viewer' ),
		a: __( 'PDF, Word (DOCX), Excel (XLSX and XLS) and CSV. The older Word format (DOC) is not supported; save the file as DOCX.', 'softicon-document-viewer' ),
	},
	{
		q: __( 'Does it work with the Classic Editor or page builders?', 'softicon-document-viewer' ),
		a: __( 'Yes. Go to Document Viewer → Add a document, pick the file, choose the settings and publish. The All Documents list shows its shortcode, such as [softicon_document id="123"]; paste it in the Classic Editor, a widget, Elementor\'s Shortcode widget, a Code module in Divi, an HTML module in Beaver Builder, a Text Block in WPBakery or the Shortcode element in Bricks and Oxygen.', 'softicon-document-viewer' ),
	},
	{
		q: __( 'Does it send my files anywhere?', 'softicon-document-viewer' ),
		a: __( 'No. The plugin does not use Google Docs Viewer, Microsoft Office Online or any other outside service. Files from your Media Library are read from your own site by the visitor\'s browser.', 'softicon-document-viewer' ),
	},
	{
		q: __( 'Can I show only part of a spreadsheet?', 'softicon-document-viewer' ),
		a: __( 'Yes. Under Spreadsheet in the block\'s settings, write the cells in Cells to show, the way Excel does: A1:F20, whole columns (A:F) or whole rows (5:40). Leave it empty for the whole sheet.', 'softicon-document-viewer' ),
	},
	{
		q: __( 'Can visitors search inside a document?', 'softicon-document-viewer' ),
		a: __( 'Yes, in PDF and Word files. The magnifier in the toolbar opens a search box; Enter goes to the next result and Shift+Enter back. Ctrl+F (Cmd+F on a Mac) after clicking in the viewer opens it too. A scanned PDF (pictures of pages, no text) has nothing to find.', 'softicon-document-viewer' ),
	},
	{
		q: __( 'Can the document open in a popup?', 'softicon-document-viewer' ),
		a: __( 'Yes. Turn on Open in a lightbox under Lightbox in the block\'s settings. The page then shows only the file card with a button, and the document opens over the page when a visitor clicks it.', 'softicon-document-viewer' ),
	},
	{
		q: __( 'A file from another website does not open', 'softicon-document-viewer' ),
		a: __( 'The visitor\'s browser reads the file itself, so the other website has to allow that (a CORS header). Most do not. Upload the file to your Media Library instead; the block then shows a message and the Download button for such a file.', 'softicon-document-viewer' ),
	},
	{
		q: __( 'Does a Word file look exactly like in Word?', 'softicon-document-viewer' ),
		a: __( 'Text, headings, lists, tables, images, headers and footers come through well. Complex layouts (text boxes, SmartArt, charts, columns) may look different. When the look matters, a PDF is the safer choice; the Download button gives visitors the original file either way.', 'softicon-document-viewer' ),
	},
	{
		q: __( 'How big can a spreadsheet be?', 'softicon-document-viewer' ),
		a: __( 'Files up to 50 MB open. A sheet shows up to 20,000 rows and 1,000 columns, and more rows appear as visitors scroll; the Download button gives them the whole file.', 'softicon-document-viewer' ),
	},
	{
		q: __( 'A file with a password does not open', 'softicon-document-viewer' ),
		a: __( 'The block cannot show a PDF, Word or Excel file that needs a password. Save it without one, or leave the Download button on so visitors can open it on their device.', 'softicon-document-viewer' ),
	},
	{
		q: __( 'Does the plugin collect any data?', 'softicon-document-viewer' ),
		a: __( 'No. It stores no data about visitors, sets no cookies and contacts no outside service. The videos on this dashboard load from YouTube only when you click one.', 'softicon-document-viewer' ),
	},
];

// the details a support topic asks for, copied to paste into it; nothing is sent anywhere
const siteDetails = ( config ) => [
	[ __( 'Plugin', 'softicon-document-viewer' ), 'SoftIcon Document Viewer ' + config.version ],
	[ 'WordPress', config.site?.wp || '' ],
	[ 'PHP', config.site?.php || '' ],
	[ __( 'Theme', 'softicon-document-viewer' ), config.site?.theme || '' ],
	[ __( 'Browser', 'softicon-document-viewer' ), window.navigator.userAgent.replace( /^Mozilla\/5\.0 /, '' ) ],
];

const Help = ( { config, play } ) => {
	const [ query, setQuery ] = useState( '' );
	const [ open, setOpen ] = useState( 0 );
	const [ copied, setCopied ] = useState( false );
	const details = siteDetails( config );
	const video = config.videos[ 0 ];

	const words = query.trim().toLowerCase();
	const found = answers().filter( ( item ) => ! words || ( item.q + ' ' + item.a ).toLowerCase().includes( words ) );

	const copy = () => copyText( details.map( ( [ name, value ] ) => name + ': ' + value ).join( '\n' ) ).then( () => {
		setCopied( true );
		setTimeout( () => setCopied( false ), 1800 );
	} ).catch( () => {} );

	const ways = [
		{
			icon: 'groups', title: __( 'Support forum', 'softicon-document-viewer' ), href: FORUM, main: true,
			text: __( 'Ask on WordPress.org; the people who build the plugin answer, and you can search past answers.', 'softicon-document-viewer' ),
			cta: __( 'Visit the forum', 'softicon-document-viewer' ),
		},
		{ icon: 'editor-help', title: __( 'Questions and answers', 'softicon-document-viewer' ), href: 'https://wordpress.org/plugins/softicon-document-viewer/#faq', text: __( 'Every question from the plugin page, in one list.', 'softicon-document-viewer' ), cta: __( 'Read the FAQ', 'softicon-document-viewer' ) },
		video && { icon: 'video-alt3', title: __( 'Video', 'softicon-document-viewer' ), video, text: __( 'The plugin in half a minute, and a short video for each feature.', 'softicon-document-viewer' ), cta: __( 'Watch here', 'softicon-document-viewer' ) },
		{ icon: 'email-alt', title: __( 'Email', 'softicon-document-viewer' ), href: 'mailto:' + EMAIL, mail: true, text: EMAIL, cta: __( 'Write to us', 'softicon-document-viewer' ) },
	].filter( Boolean );

	const card = ( way ) => <>
		<span className={ 'aldv-hp-icon dashicons dashicons-' + way.icon } aria-hidden="true" />
		<strong>{ way.title }</strong>
		<small>{ way.text }</small>
		<b>{ way.cta } { ! way.video && ! way.mail && <span aria-hidden="true">↗</span> }</b>
	</>;

	return <div className="aldv-hp">
		<header className="aldv-hp-hero">
			<div>
				<span className="aldv-hp-eyebrow">{ __( 'Support', 'softicon-document-viewer' ) }</span>
				<h2>{ __( 'How can we help?', 'softicon-document-viewer' ) }</h2>
				<p>{ __( 'A real person reads every message: the developers who build SoftIcon Document Viewer.', 'softicon-document-viewer' ) }</p>
			</div>
			<div className="aldv-hp-search">
				<span className="dashicons dashicons-search" aria-hidden="true" />
				<input type="search" value={ query } onChange={ ( event ) => {
					setQuery( event.target.value );
					setOpen( 0 );
				} } placeholder={ __( 'Search the answers', 'softicon-document-viewer' ) } aria-label={ __( 'Search the answers', 'softicon-document-viewer' ) } />
			</div>
		</header>

		<div className="aldv-hp-ways">
			{ ways.map( ( way ) => way.video
				? <VideoLink key={ way.title } className="aldv-hp-way" url={ way.video.url } title={ way.video.title } play={ play }>{ card( way ) }</VideoLink>
				: <a key={ way.title } className={ 'aldv-hp-way' + ( way.main ? ' is-main' : '' ) } href={ way.href } { ...( way.mail ? {} : external ) }>{ card( way ) }</a> ) }
		</div>

		<div className="aldv-hp-body">
			<section className="aldv-hp-panel">
				<header>
					<h3>{ __( 'Quick answers', 'softicon-document-viewer' ) }</h3>
					<span>{ words ? sprintf(
						/* translators: %d: the number of answers that match the search */
						__( '%d found', 'softicon-document-viewer' ), found.length ) : __( 'The questions people ask most', 'softicon-document-viewer' ) }</span>
				</header>
				{ found.map( ( item, index ) => <div className={ 'aldv-hp-qa' + ( open === index ? ' is-open' : '' ) } key={ item.q }>
					<button type="button" aria-expanded={ open === index } onClick={ () => setOpen( open === index ? -1 : index ) }>
						<span>{ item.q }</span><span className="aldv-hp-chev dashicons dashicons-arrow-down-alt2" aria-hidden="true" />
					</button>
					{ open === index && <div className="aldv-hp-answer">
						<p>{ item.a }</p>
					</div> }
				</div> ) }
				{ ! found.length && <p className="aldv-hp-none">{ __( 'No quick answer for that.', 'softicon-document-viewer' ) } <a href={ FORUM } { ...external }>{ __( 'Ask in the forum', 'softicon-document-viewer' ) } ↗</a></p> }
				<p className="aldv-hp-more"><a href="https://wordpress.org/plugins/softicon-document-viewer/#faq" { ...external }>{ __( 'All questions and answers', 'softicon-document-viewer' ) } ↗</a></p>
			</section>

			<aside className="aldv-hp-side">
				<section className="aldv-hp-panel">
					<header>
						<h3>{ __( 'Your site details', 'softicon-document-viewer' ) }</h3>
						<button type="button" className={ 'aldv-hp-copy' + ( copied ? ' is-done' : '' ) } onClick={ copy }>
							<span className={ 'dashicons dashicons-' + ( copied ? 'yes' : 'clipboard' ) } aria-hidden="true" />{ copied ? __( 'Copied', 'softicon-document-viewer' ) : __( 'Copy', 'softicon-document-viewer' ) }
						</button>
					</header>
					<dl className="aldv-hp-details">
						{ details.map( ( [ name, value ] ) => <div key={ name }><dt>{ name }</dt><dd title={ value }>{ value }</dd></div> ) }
					</dl>
					<p className="aldv-hp-note">{ __( 'Paste these into your forum topic or email, with the address of the page and what you see. They are only copied, never sent.', 'softicon-document-viewer' ) }</p>
				</section>
			</aside>
		</div>

		<div className="aldv-hp-love">
			<span className="aldv-hp-stars" aria-hidden="true">★★★★★</span>
			<div>
				<strong>{ __( 'Enjoying Document Viewer?', 'softicon-document-viewer' ) }</strong>
				<small>{ __( 'A review helps other people find it and keeps it free.', 'softicon-document-viewer' ) }</small>
			</div>
			<a className="aldv-hp-btn" href="https://wordpress.org/support/plugin/softicon-document-viewer/reviews/#new-post" { ...external }>{ __( 'Leave a review', 'softicon-document-viewer' ) }</a>
			<a href="https://wordpress.org/plugins/author/softiconai/" { ...external }>{ __( 'More plugins', 'softicon-document-viewer' ) }</a>
			<a href="https://github.com/softiconai/softicon-document-viewer" { ...external }>{ __( 'Source on GitHub', 'softicon-document-viewer' ) }</a>
		</div>
	</div>;
};

export default Help;
