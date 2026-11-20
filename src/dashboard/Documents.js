// the Documents tab: every page, post, pattern or document with the block, the files it shows and the shortcode
// of a document under All Documents (includes/class-dashboard.php documents())
import { useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useApi } from './api';
import Status from './Status';
import { Code } from './Copy';

const Empty = ( { config } ) => <div className="aldv-card aldv-docs-empty">
	<span className="dashicons dashicons-media-document" aria-hidden="true" />
	<h3>{ __( 'No documents yet', 'softicon-document-viewer' ) }</h3>
	<p>{ __( 'Add the Document Viewer block to any page or post, or make a document under Document Viewer → All Documents and use its shortcode. Every one shows up here once it is saved.', 'softicon-document-viewer' ) }</p>
	<p className="aldv-actions">
		<a className="aldv-btn aldv-btn-brand" href={ config.urls.newDocument }>{ __( 'Add a document', 'softicon-document-viewer' ) }</a>
		<a className="aldv-btn aldv-btn-line" href={ config.urls.newPage }>{ __( 'Create a page', 'softicon-document-viewer' ) }</a>
	</p>
</div>;

const File = ( { file } ) => <li>
	<span className={ 'aldv-ext aldv-ext-' + ( file.ext || 'none' ) }>{ file.ext ? file.ext.toUpperCase() : '?' }</span>
	<span className="aldv-docs-name">{ file.name || <em>{ __( '(no file yet)', 'softicon-document-viewer' ) }</em> }</span>
	{ file.lightbox && <span className="aldv-tag">{ __( 'Lightbox', 'softicon-document-viewer' ) }</span> }
</li>;

const Row = ( { row } ) => <tr>
	<td className="aldv-docs-files">
		<ul>{ row.files.map( ( file, index ) => <File key={ index } file={ file } /> ) }</ul>
	</td>
	<td className="aldv-docs-post">
		{ row.edit ? <a href={ row.edit }>{ row.title }</a> : row.title }
		<small>
			{ row.type }
			{ row.status && <> · <span className="aldv-docs-status">{ row.status }</span></> }
			{ row.view && <> · <a href={ row.view } target="_blank" rel="noopener noreferrer">{ __( 'View', 'softicon-document-viewer' ) }</a></> }
		</small>
	</td>
	<td className="aldv-docs-code">
		{ row.shortcode ? <Code text={ row.shortcode } label={ sprintf(
			/* translators: %s: the document's title */
			__( 'Copy the shortcode of %s', 'softicon-document-viewer' ),
			row.title
		) } /> : <span className="aldv-muted" title={ __( 'Only documents made under Document Viewer → All Documents have a shortcode.', 'softicon-document-viewer' ) }>—</span> }
	</td>
</tr>;

const Documents = ( { config } ) => {
	const { data, error, loading } = useApi( '/softicon-document-viewer/v1/dashboard/documents' );
	const [ query, setQuery ] = useState( '' );

	if ( loading || error ) {
		return <Status error={ error } />;
	}
	if ( ! data.rows.length ) {
		return <Empty config={ config } />;
	}

	const words = query.trim().toLowerCase();
	const found = data.rows.filter( ( row ) => ! words || ( row.title + ' ' + row.files.map( ( file ) => file.name ).join( ' ' ) ).toLowerCase().includes( words ) );

	return <section className="aldv-docs">
		<header>
			<div>
				<h2>{ __( 'Your documents', 'softicon-document-viewer' ) }</h2>
				<p>{ data.more ? sprintf(
					/* translators: %d: the number of pages and posts shown */
					__( 'The newest %d pages and posts with the block.', 'softicon-document-viewer' ),
					data.limit
				) : sprintf(
					/* translators: %d: the number of pages, posts, patterns and documents */
					_n( '%d place with the block on this site: pages, posts, patterns, templates and All Documents.', '%d places with the block on this site: pages, posts, patterns, templates and All Documents.', data.rows.length, 'softicon-document-viewer' ),
					data.rows.length
				) }</p>
			</div>
			<div className="aldv-filter">
				<span className="dashicons dashicons-search" aria-hidden="true" />
				<input type="search" value={ query } onChange={ ( event ) => setQuery( event.target.value ) } placeholder={ __( 'Search files and pages', 'softicon-document-viewer' ) } aria-label={ __( 'Search files and pages', 'softicon-document-viewer' ) } />
			</div>
			<a className="aldv-btn aldv-btn-brand" href={ config.urls.newDocument }>{ __( 'Add a document', 'softicon-document-viewer' ) }</a>
		</header>
		<div className="aldv-docs-scroll">
			<table className="aldv-docs-table">
				<thead>
					<tr>
						<th scope="col">{ __( 'Files', 'softicon-document-viewer' ) }</th>
						<th scope="col">{ __( 'Where', 'softicon-document-viewer' ) }</th>
						<th scope="col">{ __( 'Shortcode', 'softicon-document-viewer' ) }</th>
					</tr>
				</thead>
				<tbody>
					{ found.map( ( row ) => <Row key={ row.id } row={ row } /> ) }
					{ ! found.length && <tr className="aldv-docs-none"><td colSpan="3">{ __( 'Nothing matches your search.', 'softicon-document-viewer' ) }</td></tr> }
				</tbody>
			</table>
		</div>
	</section>;
};

export default Documents;
