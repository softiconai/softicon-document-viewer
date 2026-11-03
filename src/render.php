<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

$aldv_file = ALDV_Document_Viewer\Block::file( $attributes );

// nothing picked yet, or a file the block cannot show
if ( ! $aldv_file ) {
	return;
}

$aldv_config = ALDV_Document_Viewer\Block::config( $attributes, $aldv_file );

$aldv_wrapper = get_block_wrapper_attributes(
	array(
		'class'     => 'aldv_viewer aldv_' . $aldv_file['viewer'],
		'style'     => ALDV_Document_Viewer\Block::style( $attributes ),
		// hex flags keep quotes and ampersands from breaking the attribute or JSON.parse
		'data-aldv' => wp_json_encode( $aldv_config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ),
	)
);
?>
<div <?php echo $aldv_wrapper; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() escapes ?>>
	<?php // the file card: what visitors see before the viewer opens, without JavaScript, or when the file cannot be read ?>
	<div class="aldv_file">
		<span class="aldv_file_icon aldv_file_icon_<?php echo esc_attr( $aldv_file['ext'] ); ?>" aria-hidden="true"><?php echo esc_html( strtoupper( $aldv_file['ext'] ) ); ?></span>
		<span class="aldv_file_info">
			<span class="aldv_file_name"><?php echo esc_html( $aldv_file['name'] ); ?></span>
			<span class="aldv_file_type"><?php echo esc_html( ALDV_Document_Viewer\Block::type_label( $aldv_file['ext'] ) ); ?></span>
		</span>
		<?php if ( $aldv_config['download'] ) : ?>
			<a class="aldv_download wp-element-button" href="<?php echo esc_url( $aldv_file['url'] ); ?>" download><?php esc_html_e( 'Download', 'softicon-document-viewer' ); ?></a>
		<?php endif; ?>
	</div>
	<div class="aldv_stage" hidden></div>
</div>
