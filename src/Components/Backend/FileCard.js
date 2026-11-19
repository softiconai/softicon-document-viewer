import { __ } from '@wordpress/i18n';

// the same file card render.php prints; view is the lightbox button's text, which view.js adds on the page
const FileCard = ( { file, download, view } ) => <div className="aldv_file">
	<span className={ 'aldv_file_icon aldv_file_icon_' + file.ext } aria-hidden="true">{ file.ext.toUpperCase() }</span>
	<span className="aldv_file_info">
		<span className="aldv_file_name">{ file.name }</span>
		<span className="aldv_file_type">{ file.label }</span>
	</span>
	<span className="aldv_actions">
		{ /* the viewer's buttons go here, React leaves its content alone */ }
		<span className="aldv_tools" />
		{ view && <span className="aldv_view wp-element-button" aria-hidden="true">{ view }</span> }
		{ download && <span className="aldv_download wp-element-button" aria-hidden="true">{ __( 'Download', 'softicon-document-viewer' ) }</span> }
	</span>
</div>;

export default FileCard;
