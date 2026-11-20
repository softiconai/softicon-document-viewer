<?php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// the dashboard's review request; the documents under All Documents stay, like the blocks in posts
delete_option( 'aldv_review' );
