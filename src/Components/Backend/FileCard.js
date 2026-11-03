import { __ } from '@wordpress/i18n';

// the same file card render.php prints
const FileCard = ( { file, download } ) => <div className="aldv_file">
	<span className={ 'aldv_file_icon aldv_file_icon_' + file.ext } aria-hidden="true">{ file.ext.toUpperCase() }</span>
	<span className="aldv_file_info">
		<span className="aldv_file_name">{ file.name }</span>
		<span className="aldv_file_type">{ file.label }</span>
	</span>
	{ download && <span className="aldv_download wp-element-button" aria-hidden="true">{ __( 'Download', 'softicon-document-viewer' ) }</span> }
</div>;

export default FileCard;
