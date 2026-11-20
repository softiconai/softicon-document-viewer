// Getting started on the Welcome tab: how to add a file in the block editor, the Classic Editor, Elementor and
// other page builders, or a theme. It opens on the editor this site uses, and lists the site's own documents with their shortcodes.
import { createInterpolateElement, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import VideoLink from './VideoLink';
import { Code, shortcode } from './Copy';

const KEY = 'aldv_start_tab';

// the site's newest documents under Document Viewer → All Documents, each with its shortcode to copy
const Docs = ( { start } ) => <div className="aldv-start-docs">
	<h4>{ __( 'Your documents', 'softicon-document-viewer' ) }</h4>
	{ start.docs.length ? <>
		<ul>
			{ start.docs.map( ( doc ) => <li key={ doc.id }>
				<a className="aldv-start-doc" href={ doc.edit }>{ doc.title }</a>
				<Code text={ shortcode( doc.id ) } label={ sprintf(
					/* translators: %s: document title */
					__( 'Copy the shortcode of %s', 'softicon-document-viewer' ),
					doc.title
				) } />
			</li> ) }
		</ul>
		<p className="aldv-start-more">
			<a href={ start.allDocs }>{ sprintf(
				/* translators: %d: number of documents */
				_n( 'See all %d document', 'See all %d documents', start.total, 'softicon-document-viewer' ),
				start.total
			) }</a>
			<a href={ start.newDocument }>{ __( 'Add a document', 'softicon-document-viewer' ) }</a>
		</p>
	</> : <div className="aldv-start-empty">
		<p>{ __( 'No documents yet. Add one and its shortcode shows up here, ready to copy.', 'softicon-document-viewer' ) }</p>
		<a className="aldv-btn aldv-btn-brand" href={ start.newDocument }>{ __( 'Add a document', 'softicon-document-viewer' ) }</a>
	</div> }
</div>;

const Video = ( { video, play } ) => <VideoLink className="aldv-start-video" url={ video.url } title={ video.title } play={ play }>
	<span className="dashicons dashicons-controls-play" aria-hidden="true" />
	<span>{ video.title }</span>
</VideoLink>;

const Step = ( { n, title, children, action } ) => <li className="aldv-start-step">
	<span className="aldv-step">{ n }</span>
	<div>
		<h3>{ title }</h3>
		{ children }
		{ action }
	</div>
</li>;

// the same two first steps for the Classic Editor, page builders and themes
const makeSteps = ( start ) => <>
	<Step n={ 1 } title={ __( 'Set up the document', 'softicon-document-viewer' ) }
		action={ <a className="aldv-start-link" href={ start.newDocument }>{ __( 'Add a document', 'softicon-document-viewer' ) } &rarr;</a> }>
		<p>{ __( 'Go to Document Viewer → Add a document. It opens with the Document Viewer block: pick the file, choose the settings, then publish.', 'softicon-document-viewer' ) }</p>
	</Step>
	<Step n={ 2 } title={ __( 'Copy its shortcode', 'softicon-document-viewer' ) }>
		<p>{ __( 'Every document has a shortcode in the All Documents list and in the block\'s Shortcode panel. Your documents are listed here too.', 'softicon-document-viewer' ) }</p>
	</Step>
</>;

const tabs = ( start ) => {
	const example = shortcode( start.docs[ 0 ]?.id || 123 );
	return [
		{
			key: 'block',
			icon: 'block-default',
			label: __( 'Block editor', 'softicon-document-viewer' ),
			on: ! start.classic,
			steps: <>
				<Step n={ 1 } title={ __( 'Add the Document Viewer block', 'softicon-document-viewer' ) }
					action={ <a className="aldv-start-link" href={ start.newPage }>{ __( 'Create a page', 'softicon-document-viewer' ) } &rarr;</a> }>
					<p>{ createInterpolateElement( __( 'In any page or post, click <b>+</b> and search for <b>Document Viewer</b>, or type <code>/document</code> in an empty line.', 'softicon-document-viewer' ), { b: <strong />, code: <code /> } ) }</p>
				</Step>
				<Step n={ 2 } title={ __( 'Pick the file', 'softicon-document-viewer' ) }>
					<p>{ __( 'Upload a PDF, Word (DOCX), Excel (XLSX, XLS) or CSV file, pick one from the Media Library, or paste a link. The block shows the real file right away.', 'softicon-document-viewer' ) }</p>
				</Step>
				<Step n={ 3 } title={ __( 'Choose the settings, and publish', 'softicon-document-viewer' ) }>
					<p>{ __( 'The toolbar, the height, the lightbox, the cells to show and the colors are in the block\'s sidebar. Visitors see the file as soon as the page is published.', 'softicon-document-viewer' ) }</p>
				</Step>
			</>,
		},
		{
			key: 'classic',
			icon: 'editor-paste-text',
			label: __( 'Classic editor', 'softicon-document-viewer' ),
			on: start.classic,
			docs: true,
			steps: <>
				{ makeSteps( start ) }
				<Step n={ 3 } title={ __( 'Paste it in the Classic Editor', 'softicon-document-viewer' ) }>
					<p>{ __( 'Paste the shortcode where the file goes, in the Visual or the Text tab, then update the page. It works in text and Shortcode widgets too.', 'softicon-document-viewer' ) }</p>
					<Code text={ example } label={ __( 'Copy the shortcode', 'softicon-document-viewer' ) } />
				</Step>
			</>,
		},
		{
			key: 'builders',
			icon: 'layout',
			label: __( 'Elementor & builders', 'softicon-document-viewer' ),
			on: start.elementor,
			docs: true,
			steps: <>
				{ makeSteps( start ) }
				<Step n={ 3 } title={ __( 'Add a Shortcode widget', 'softicon-document-viewer' ) }>
					<p>{ createInterpolateElement( __( 'In <b>Elementor</b>, drag the <b>Shortcode</b> widget onto the page and paste the shortcode; the file shows in Elementor\'s preview too. Other builders work the same way:', 'softicon-document-viewer' ), { b: <strong /> } ) }</p>
					<ul className="aldv-start-builders">
						<li><strong>Divi</strong> – { __( 'Code module', 'softicon-document-viewer' ) }</li>
						<li><strong>Beaver Builder</strong> – { __( 'HTML module', 'softicon-document-viewer' ) }</li>
						<li><strong>WPBakery</strong> – { __( 'Text Block', 'softicon-document-viewer' ) }</li>
						<li><strong>Bricks, Oxygen</strong> – { __( 'Shortcode element', 'softicon-document-viewer' ) }</li>
					</ul>
				</Step>
			</>,
		},
		{
			key: 'theme',
			icon: 'editor-code',
			label: __( 'Theme / PHP', 'softicon-document-viewer' ),
			on: false,
			docs: true,
			steps: <>
				{ start.blockTheme && <Step n={ 1 } title={ __( 'Block theme: add the block to a template', 'softicon-document-viewer' ) }
					action={ <a className="aldv-start-link" href={ start.siteEditor }>{ __( 'Open the Site Editor', 'softicon-document-viewer' ) } &rarr;</a> }>
					<p>{ __( 'Your theme is a block theme. In Appearance → Editor, open a template or a template part, such as the footer, and add the Document Viewer block like on any page.', 'softicon-document-viewer' ) }</p>
				</Step> }
				<Step n={ start.blockTheme ? 2 : 1 } title={ __( 'Any theme: print the shortcode', 'softicon-document-viewer' ) }>
					<p>{ createInterpolateElement( __( 'Add the document under Document Viewer → All Documents, then show it from a template file, such as <code>single.php</code>, with:', 'softicon-document-viewer' ), { code: <code /> } ) }</p>
					<Code text={ `<?php echo do_shortcode( '${ example }' ); ?>` } label={ __( 'Copy the PHP code', 'softicon-document-viewer' ) } />
				</Step>
			</>,
		},
	];
};

const remembered = () => {
	try {
		return window.localStorage.getItem( KEY );
	} catch ( e ) {
		return null;
	}
};

const GettingStarted = ( { config, play } ) => {
	const start = { ...config.start, ...config.urls };
	const list = tabs( start );
	const video = config.videos[ 0 ];
	// the tab picked last time, else the editor this site uses (Classic Editor, then Elementor), else the block editor
	const [ tab, setTab ] = useState( () => {
		const saved = remembered();
		if ( list.some( ( item ) => item.key === saved ) ) {
			return saved;
		}
		if ( start.classic ) {
			return 'classic';
		}
		return start.elementor ? 'builders' : 'block';
	} );
	const pick = ( key ) => {
		setTab( key );
		try {
			window.localStorage.setItem( KEY, key );
		} catch ( e ) {
			// private mode: the tab is not remembered
		}
	};
	const current = list.find( ( item ) => item.key === tab ) || list[ 0 ];

	// arrow keys move between the tabs, as in any tab list
	const onKey = ( event ) => {
		const at = list.findIndex( ( item ) => item.key === tab );
		const next = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: list.length - 1 }[ event.key ];
		if ( undefined === next ) {
			return;
		}
		event.preventDefault();
		const key = list[ ( next + list.length ) % list.length ].key;
		pick( key );
		event.currentTarget.parentNode.querySelector( `[data-tab="${ key }"]` )?.focus();
	};

	return <section className="aldv-start">
		<header className="aldv-start-head">
			<div>
				<h2>{ __( 'Getting started', 'softicon-document-viewer' ) }</h2>
				<p>{ __( 'Pick where you build your pages; the steps follow.', 'softicon-document-viewer' ) }</p>
			</div>
		</header>

		<div className="aldv-start-tabs" role="tablist" aria-label={ __( 'Where you build your pages', 'softicon-document-viewer' ) }>
			{ list.map( ( item ) => <button key={ item.key } type="button" role="tab" id={ 'aldv-start-tab-' + item.key } data-tab={ item.key }
				aria-selected={ item.key === tab } aria-controls="aldv-start-panel" tabIndex={ item.key === tab ? 0 : -1 }
				className={ item.key === tab ? 'is-active' : '' } onClick={ () => pick( item.key ) } onKeyDown={ onKey }>
				<span className={ 'dashicons dashicons-' + item.icon } aria-hidden="true" />
				<span>{ item.label }</span>
				{ item.on && 'block' !== item.key && <span className="aldv-start-on">{ __( 'On this site', 'softicon-document-viewer' ) }</span> }
			</button> ) }
		</div>

		<div className="aldv-start-body" role="tabpanel" id="aldv-start-panel" aria-labelledby={ 'aldv-start-tab-' + current.key }>
			<ol className="aldv-start-steps">{ current.steps }</ol>
			<aside className="aldv-start-side">
				{ current.docs ? <Docs start={ start } /> : <div className="aldv-start-docs">
					<h4>{ __( 'Fastest start', 'softicon-document-viewer' ) }</h4>
					<p>{ createInterpolateElement( __( 'Open a new page, type <code>/document</code> and press Enter: the block is ready for your file.', 'softicon-document-viewer' ), { code: <code /> } ) }</p>
					<a className="aldv-btn aldv-btn-brand" href={ start.newPage }>{ __( 'Create a page', 'softicon-document-viewer' ) }</a>
				</div> }
				{ video && <Video video={ video } play={ play } /> }
			</aside>
		</div>
	</section>;
};

export default GettingStarted;
