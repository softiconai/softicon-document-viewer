import { __ } from '@wordpress/i18n';
import { icons as shared } from '../vendor/softicon-tools/components/icons';

// the files the block shows: extension => viewer, MIME type and name (the same list is in includes/class-block.php)
export const fileTypes = {
	pdf: { viewer: 'pdf', mime: 'application/pdf', label: __( 'PDF document', 'softicon-document-viewer' ) },
	docx: { viewer: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: __( 'Word document', 'softicon-document-viewer' ) },
	xlsx: { viewer: 'sheet', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: __( 'Excel spreadsheet', 'softicon-document-viewer' ) },
	xls: { viewer: 'sheet', mime: 'application/vnd.ms-excel', label: __( 'Excel spreadsheet', 'softicon-document-viewer' ) },
	csv: { viewer: 'sheet', mime: 'text/csv', label: __( 'CSV file', 'softicon-document-viewer' ) },
};

// for the media library and the upload button
export const mimeTypes = Object.values( fileTypes ).map( ( type ) => type.mime );
export const accept = Object.keys( fileTypes ).map( ( ext ) => '.' + ext ).join( ',' );

export const tabs = [
	{ name: 'general', title: __( 'General', 'softicon-document-viewer' ), className: 'general' },
	{ name: 'style', title: __( 'Style', 'softicon-document-viewer' ), className: 'style' },
];

// a short video for each feature, linked from its panel and from the readme
export const videos = {
	cells: { href: 'https://www.youtube.com/watch?v=mIB4ggRL6XE', time: '0:47' },
	lightbox: { href: 'https://www.youtube.com/watch?v=HveN2ydERG0', time: '0:46' },
	search: { href: 'https://www.youtube.com/watch?v=8ZLpnEgAgtE', time: '0:42' },
	shortcode: { href: 'https://www.youtube.com/watch?v=xHkl9MWn5ZU', time: '0:53' },
};

// the cards in the Help panel
export const helpCards = [
	{ href: 'https://www.youtube.com/watch?v=kznWWJ8LBRU', label: __( 'Video tutorial', 'softicon-document-viewer' ), icon: shared.video },
	{ href: 'https://wordpress.org/support/plugin/softicon-document-viewer/', label: __( 'Get support', 'softicon-document-viewer' ), icon: shared.support },
	{ href: 'https://wordpress.org/support/plugin/softicon-document-viewer/reviews/#new-post', label: __( 'Rate Document Viewer', 'softicon-document-viewer' ), icon: shared.star },
	{ href: 'https://wordpress.org/plugins/author/softiconai/', label: __( 'More plugins', 'softicon-document-viewer' ), icon: shared.plugins },
];
