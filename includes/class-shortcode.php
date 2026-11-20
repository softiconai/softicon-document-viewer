<?php
namespace ALDV_Document_Viewer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Documents for the Classic Editor and page builders: Document Viewer → All Documents holds one Document Viewer block
// per document (set up in the block editor), and [softicon_document id="123"] shows it anywhere a shortcode works.
class Shortcode {

	const TYPE = 'aldv_document';
	const TAG  = 'softicon_document';

	public function __construct() {
		add_action( 'init', array( $this, 'post_type' ) );
		add_shortcode( self::TAG, array( $this, 'render' ) );
		add_filter( 'manage_' . self::TYPE . '_posts_columns', array( $this, 'columns' ) );
		add_action( 'manage_' . self::TYPE . '_posts_custom_column', array( $this, 'column' ), 10, 2 );
		add_action( 'admin_enqueue_scripts', array( $this, 'copy_script' ) );
		// Elementor's editor preview: the viewer's script and styles from the start, so a Shortcode widget shows the document at once
		add_action( 'elementor/preview/enqueue_styles', array( $this, 'builder_preview' ) );
		// a document is set up in its block, so it always opens in the block editor, even where the Classic Editor
		// plugin (priority 100) switches every other post type to the classic one
		add_filter( 'use_block_editor_for_post_type', array( $this, 'block_editor' ), 200, 2 );
		add_filter( 'rest_pre_dispatch', array( $this, 'rest_private' ), 10, 3 );
	}

	// the block editor needs the REST route, but only people who can edit documents may read it: published ones
	// would otherwise be open to anyone at /wp/v2/aldv_document, with their file addresses
	public function rest_private( $result, $server, $request ) {
		$type = get_post_type_object( self::TYPE );
		if ( $type && 0 === strpos( $request->get_route(), '/wp/v2/' . self::TYPE ) && ! current_user_can( $type->cap->edit_posts ) ) {
			return new \WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to do that.', 'softicon-document-viewer' ), array( 'status' => rest_authorization_required_code() ) );
		}
		return $result;
	}

	// not a page of its own on the site: a document shows only where its shortcode is
	public function post_type() {
		register_post_type(
			self::TYPE,
			array(
				'labels'          => array(
					'name'               => __( 'Documents', 'softicon-document-viewer' ),
					'singular_name'      => __( 'Document', 'softicon-document-viewer' ),
					'menu_name'          => __( 'Documents', 'softicon-document-viewer' ),
					'add_new'            => __( 'Add a document', 'softicon-document-viewer' ),
					'add_new_item'       => __( 'Add a document', 'softicon-document-viewer' ),
					'edit_item'          => __( 'Edit document', 'softicon-document-viewer' ),
					'all_items'          => __( 'All Documents', 'softicon-document-viewer' ),
					'not_found'          => __( 'No documents yet.', 'softicon-document-viewer' ),
					'not_found_in_trash' => __( 'No documents in the trash.', 'softicon-document-viewer' ),
					'search_items'       => __( 'Search documents', 'softicon-document-viewer' ),
				),
				'public'          => false,
				'show_ui'         => true,
				// Document Viewer → All Documents, under the dashboard's menu (includes/class-dashboard.php)
				'show_in_menu'    => Dashboard::PAGE,
				'show_in_rest'    => true,
				'capability_type' => 'page',
				'map_meta_cap'    => true,
				'supports'        => array( 'title', 'editor' ),
				'template'        => array( array( Block::NAME ) ),
				'template_lock'   => 'all',
			)
		);
	}

	public function block_editor( $use_block_editor, $type ) {
		return self::TYPE === $type ? true : $use_block_editor;
	}

	public function builder_preview() {
		wp_enqueue_script( generate_block_asset_handle( Block::NAME, 'viewScript' ) );
		wp_enqueue_style( generate_block_asset_handle( Block::NAME, 'style' ) );
	}

	public function render( $atts ) {
		$id  = is_array( $atts ) && isset( $atts['id'] ) ? absint( $atts['id'] ) : 0;
		$doc = $id ? get_post( $id ) : null;
		// only a published document without a password, never another post or a draft
		if ( ! $doc || self::TYPE !== $doc->post_type || 'publish' !== $doc->post_status || '' !== $doc->post_password ) {
			return '';
		}

		// the block is drawn as part of the document's own post, so Block::may_use() checks that post's author
		global $post;
		$page = $post;
		$post = $doc; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- put back below
		$html = '';
		foreach ( parse_blocks( $doc->post_content ) as $block ) {
			if ( Block::NAME === $block['blockName'] ) {
				$html .= render_block( $block );
			}
		}
		$post = $page; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- the page's own post again
		return $html;
	}

	public static function code( $id ) {
		return '[' . self::TAG . ' id="' . absint( $id ) . '"]';
	}

	// the All Documents list shows each document's shortcode; a click copies it
	public function columns( $columns ) {
		$date = isset( $columns['date'] ) ? array( 'date' => $columns['date'] ) : array();
		unset( $columns['date'] );
		return $columns + array( 'aldv_shortcode' => __( 'Shortcode', 'softicon-document-viewer' ) ) + $date;
	}

	public function column( $column, $id ) {
		if ( 'aldv_shortcode' === $column ) {
			printf( '<input type="text" class="aldv-shortcode" readonly value="%s" aria-label="%s" title="%s">', esc_attr( self::code( $id ) ), esc_attr__( 'Shortcode', 'softicon-document-viewer' ), esc_attr__( 'Click to copy', 'softicon-document-viewer' ) );
		}
	}

	public function copy_script( $hook ) {
		$screen = get_current_screen();
		if ( 'edit.php' !== $hook || ! $screen || self::TYPE !== $screen->post_type ) {
			return;
		}
		wp_add_inline_style( 'common', '.column-aldv_shortcode input{width:100%;max-width:260px;font-family:Menlo,Consolas,monospace;font-size:12px;cursor:copy}' );
		wp_add_inline_script( 'common', 'document.addEventListener("click",function(e){var i=e.target.closest&&e.target.closest(".aldv-shortcode");if(!i){return;}i.select();var done=function(){i.title=' . wp_json_encode( __( 'Copied', 'softicon-document-viewer' ) ) . ';};if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(i.value).then(done);}else if(document.execCommand("copy")){done();}});' );
	}
}
