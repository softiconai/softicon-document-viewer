<?php
namespace ALDV_Document_Viewer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Block {

	const NAME = 'softicon/document-viewer';

	// the files the block shows: extension => viewer and the MIME types WordPress gives such a file
	// (the same list is in src/utils/options.js)
	const TYPES = array(
		'pdf'  => array(
			'viewer' => 'pdf',
			'mimes'  => array( 'application/pdf' ),
		),
		'docx' => array(
			'viewer' => 'docx',
			'mimes'  => array( 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ),
		),
		'xlsx' => array(
			'viewer' => 'sheet',
			'mimes'  => array( 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ),
		),
		'xls'  => array(
			'viewer' => 'sheet',
			'mimes'  => array( 'application/vnd.ms-excel' ),
		),
		'csv'  => array(
			'viewer' => 'sheet',
			'mimes'  => array( 'text/csv' ),
		),
	);

	public function __construct() {
		add_action( 'init', array( $this, 'register' ) );
		add_filter( 'block_editor_settings_all', array( $this, 'no_inspector_tabs' ) );
	}

	public function register() {
		register_block_type( ALDV_PLUGIN_PATH . 'build' );

		// the real build url for the lazy viewer chunks, JS combine plugins move view.js elsewhere
		$build_url = 'window.aldvBuildUrl = ' . wp_json_encode( ALDV_PLUGIN_URL . 'build/' ) . ';';
		wp_add_inline_script( generate_block_asset_handle( self::NAME, 'viewScript' ), $build_url, 'before' );
		wp_add_inline_script( generate_block_asset_handle( self::NAME, 'editorScript' ), $build_url, 'before' );
	}

	// the block has its own General and Style tabs; without this WordPress adds its Settings/Styles tabs above them
	public function no_inspector_tabs( $settings ) {
		$tabs                           = isset( $settings['blockInspectorTabs'] ) && is_array( $settings['blockInspectorTabs'] ) ? $settings['blockInspectorTabs'] : array();
		$tabs[ self::NAME ]             = false;
		$settings['blockInspectorTabs'] = $tabs;
		return $settings;
	}

	// a media id from the block is turned into its file only when that file is not attached, sits on a public post,
	// or this post's author may edit it; otherwise a contributor could step through ids to find files of private drafts
	public static function may_use( $id ) {
		$parent = (int) wp_get_post_parent_id( $id );
		if ( ! $parent || is_post_publicly_viewable( $parent ) ) {
			return true;
		}
		$post   = (int) get_the_ID();
		$author = $post ? (int) get_post_field( 'post_author', $post ) : 0;
		return $author && user_can( $author, 'edit_post', $id );
	}

	// lower-case extension of a url or path, without a query string
	public static function extension( $url ) {
		$path = wp_parse_url( (string) $url, PHP_URL_PATH );
		return strtolower( pathinfo( is_string( $path ) ? $path : '', PATHINFO_EXTENSION ) );
	}

	// the file to show: url, name, extension and viewer, or null for a missing or unsupported file;
	// a media library file wins over the saved url, so a changed site url still works
	public static function file( $attributes ) {
		$id   = isset( $attributes['fileId'] ) ? absint( $attributes['fileId'] ) : 0;
		$name = isset( $attributes['fileName'] ) ? trim( wp_strip_all_tags( (string) $attributes['fileName'] ) ) : '';
		$url  = '';

		if ( $id && self::may_use( $id ) ) {
			$attached = wp_get_attachment_url( $id );
			$ext      = $attached ? self::extension( $attached ) : '';
			if ( isset( self::TYPES[ $ext ] ) && in_array( get_post_mime_type( $id ), self::TYPES[ $ext ]['mimes'], true ) ) {
				$url = $attached;
			}
		}

		if ( '' === $url && ! empty( $attributes['fileUrl'] ) ) {
			$url = esc_url_raw( (string) $attributes['fileUrl'] );
		}

		$ext = self::extension( $url );
		if ( '' === $url || ! isset( self::TYPES[ $ext ] ) ) {
			return null;
		}

		return array(
			'url'    => $url,
			'name'   => '' !== $name ? $name : rawurldecode( wp_basename( (string) wp_parse_url( $url, PHP_URL_PATH ) ) ),
			'ext'    => $ext,
			'viewer' => self::TYPES[ $ext ]['viewer'],
		);
	}

	// what the file card calls the file
	public static function type_label( $ext ) {
		$labels = array(
			'pdf'  => __( 'PDF document', 'softicon-document-viewer' ),
			'docx' => __( 'Word document', 'softicon-document-viewer' ),
			'xlsx' => __( 'Excel spreadsheet', 'softicon-document-viewer' ),
			'xls'  => __( 'Excel spreadsheet', 'softicon-document-viewer' ),
			'csv'  => __( 'CSV file', 'softicon-document-viewer' ),
		);
		return isset( $labels[ $ext ] ) ? $labels[ $ext ] : '';
	}

	// hex, rgb(a), hsl(a) or a preset var(), anything else is dropped
	public static function color( $value ) {
		$value = is_string( $value ) ? trim( $value ) : '';
		if ( preg_match( '/^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([0-9.,%\s\/]+\)|var\(--[a-z0-9-]+\))$/i', $value ) ) {
			return $value;
		}
		return '';
	}

	// a fixed height for the viewer: a number with px, vh, em or rem; anything else means Auto ('')
	public static function height( $attributes ) {
		$value = isset( $attributes['maxHeight'] ) && is_string( $attributes['maxHeight'] ) ? trim( $attributes['maxHeight'] ) : '';
		return preg_match( '/^\d{1,4}(\.\d{1,2})?(px|vh|em|rem)$/', $value ) && (float) $value > 0 ? $value : '';
	}

	// colors and the height become css variables so the stylesheet keeps the fallbacks
	public static function style( $attributes ) {
		$style = '';
		foreach ( array(
			'bgColor'      => '--aldv-bg',
			'borderColor'  => '--aldv-border',
			'toolbarBg'    => '--aldv-toolbar-bg',
			'toolbarColor' => '--aldv-toolbar-color',
			'headBg'       => '--aldv-head-bg',
			'headColor'    => '--aldv-head-color',
		) as $attr => $var ) {
			$color = self::color( isset( $attributes[ $attr ] ) ? $attributes[ $attr ] : '' );
			if ( $color ) {
				$style .= $var . ':' . $color . ';';
			}
		}
		$height = self::height( $attributes );
		if ( $height ) {
			$style .= '--aldv-height:' . $height . ';';
		}
		return $style;
	}

	// settings read by view.js
	public static function config( $attributes, $file ) {
		$config = array(
			'viewer'     => $file['viewer'],
			'ext'        => $file['ext'],
			'url'        => $file['url'],
			'name'       => $file['name'],
			'download'   => ! isset( $attributes['showDownload'] ) || (bool) $attributes['showDownload'],
			'fullscreen' => ! isset( $attributes['showFullscreen'] ) || (bool) $attributes['showFullscreen'],
			'zoom'       => ! isset( $attributes['showZoom'] ) || (bool) $attributes['showZoom'],
			// the viewer scrolls inside the block
			'fixed'      => '' !== self::height( $attributes ),
		);
		// spreadsheets: the first row as the header, and the sheet that opens first ('' = the first one)
		if ( 'sheet' === $file['viewer'] ) {
			$config['header'] = ! isset( $attributes['headerRow'] ) || (bool) $attributes['headerRow'];
			// only compared with the sheet names, never printed as HTML (the JSON is hex-escaped); sanitize_text_field()
			// would change names with % or <, and kses stores & as &amp; for users without unfiltered_html
			$sheet           = isset( $attributes['firstSheet'] ) ? wp_check_invalid_utf8( (string) $attributes['firstSheet'] ) : '';
			$config['sheet'] = mb_substr( wp_specialchars_decode( $sheet, ENT_QUOTES ), 0, 31 );
		}
		return apply_filters( 'aldv_config', $config, $attributes );
	}
}
