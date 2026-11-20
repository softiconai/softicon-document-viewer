import { __ } from '@wordpress/i18n';

const Header = ( { config, active } ) => <header className="aldv-dash-head">
	<a className="aldv-dash-brand" href="#/welcome">
		<img src={ config.icon } alt="" width="36" height="36" />
		<strong>{ __( 'Document Viewer', 'softicon-document-viewer' ) }</strong>
		<span className="aldv-version">v{ config.version }</span>
	</a>
	<nav className="aldv-dash-tabs" aria-label={ __( 'Document Viewer dashboard', 'softicon-document-viewer' ) }>
		{ config.tabs.map( ( tab ) => <a key={ tab.key } href={ '#/' + tab.key } className={ tab.key === active ? 'is-active' : undefined } aria-current={ tab.key === active ? 'page' : undefined }>
			{ tab.label }
		</a> ) }
	</nav>
	<div className="aldv-dash-end">
		<a className="aldv-dash-more" href="https://wordpress.org/plugins/author/softiconai/" target="_blank" rel="noopener noreferrer">{ __( 'Our plugins', 'softicon-document-viewer' ) }</a>
		<a className="aldv-btn aldv-btn-brand aldv-add" href={ config.urls.newDocument }><span className="dashicons dashicons-plus-alt2" aria-hidden="true" />{ __( 'Add a document', 'softicon-document-viewer' ) }</a>
	</div>
</header>;

export default Header;
