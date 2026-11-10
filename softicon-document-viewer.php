<?php
/**
 * Plugin Name: SoftIcon Document Viewer – Embed PDF, Word & Excel Files
 * Description: A block that shows PDF, Word, Excel and CSV files right on the page. The files open in the visitor's browser, no Google or Microsoft viewer needed.
 * Version: 1.0.2
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * Author: softiconai
 * Author URI: https://profiles.wordpress.org/softiconai/
 * License: GPLv3 or later
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain: softicon-document-viewer
 * Domain Path: /languages
 *
 * @package SoftIcon_Document_Viewer
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ALDV_PLUGIN_VERSION', '1.0.2' );
define( 'ALDV_PLUGIN_PATH', plugin_dir_path( __FILE__ ) );

require_once ALDV_PLUGIN_PATH . 'includes/class-block.php';
new ALDV_Document_Viewer\Block();

// add-ons hook in here
do_action( 'aldv_loaded' );
