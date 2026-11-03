<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ALDV_Document_Viewer {

	public static $instance;

	private function __construct() {
		$this->load_classes();
	}

	public static function get_instance() {
		if ( self::$instance ) {
			return self::$instance;
		}

		self::$instance = new self();
		return self::$instance;
	}

	public function load_classes() {

		require_once ALDV_PLUGIN_PATH . 'includes/class-block.php';

		new ALDV_Document_Viewer\Block();

		// add-ons hook in here
		do_action( 'aldv_loaded' );
	}
}
