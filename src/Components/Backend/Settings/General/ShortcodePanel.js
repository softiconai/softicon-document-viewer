import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useCopyToClipboard } from '@wordpress/compose';
import { Button } from '@wordpress/components';
import { Panel } from '../../../../vendor/softicon-tools/components/Panels';

// the post type of Document Viewer → All Documents (includes/class-shortcode.php)
export const DOC_TYPE = 'aldv_document';

// a document made under All Documents: its shortcode for the Classic Editor and page builders
const ShortcodePanel = () => {
	const { id, published } = useSelect( ( select ) => {
		const editor = select( 'core/editor' );
		return { id: editor?.getCurrentPostId?.(), published: 'publish' === editor?.getEditedPostAttribute?.( 'status' ) };
	}, [] );
	const code = `[softicon_document id="${ id }"]`;
	const [ copied, setCopied ] = useState( false );
	const ref = useCopyToClipboard( code, () => {
		setCopied( true );
		setTimeout( () => setCopied( false ), 1600 );
	} );

	return <Panel id="shortcode" title={ __( 'Shortcode', 'softicon-document-viewer' ) }>
		<div className="aldvStack">
			<code className="aldvCode">{ code }</code>
			<Button ref={ ref } variant="secondary" size="small">{ copied ? __( 'Copied', 'softicon-document-viewer' ) : __( 'Copy', 'softicon-document-viewer' ) }</Button>
			{ ! published && <p className="aldvHelp aldvWarn">{ __( 'Publish the document first, the shortcode shows only published documents.', 'softicon-document-viewer' ) }</p> }
			<p className="aldvHelp">{ __( 'Paste it in the Classic Editor, a widget, or a page builder: the Shortcode widget in Elementor, a Code module in Divi, an HTML module in Beaver Builder, a Text Block in WPBakery, or the Shortcode element in Bricks and Oxygen.', 'softicon-document-viewer' ) }</p>
		</div>
	</Panel>;
};

export default ShortcodePanel;
