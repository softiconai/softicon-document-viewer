<?php
/**
 * Plugin Name: SoftIcon Document Viewer – Embed PDF, Word & Excel Files
 * Description: A block that shows PDF, Word, Excel and CSV files right on the page. The files open in the visitor's browser, no Google or Microsoft viewer needed.
 * Version: 1.4.1
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

define( 'ALDV_PLUGIN_VERSION', '1.4.1' );
define( 'ALDV_PLUGIN_PATH', plugin_dir_path( __FILE__ ) );
define( 'ALDV_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once ALDV_PLUGIN_PATH . 'includes/class-block.php';
require_once ALDV_PLUGIN_PATH . 'includes/class-shortcode.php';
require_once ALDV_PLUGIN_PATH . 'includes/class-dashboard.php';

new ALDV_Document_Viewer\Block();
// the shortcode for the Classic Editor and page builders, and the Document Viewer menu
new ALDV_Document_Viewer\Shortcode();
add_action( 'rest_api_init', array( 'ALDV_Document_Viewer\Dashboard', 'routes' ) );
if ( is_admin() ) {
	new ALDV_Document_Viewer\Dashboard();
}

// add-ons hook in here
do_action( 'aldv_loaded' );
