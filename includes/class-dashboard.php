<?php
namespace ALDV_Document_Viewer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// The Document Viewer admin page: src/dashboard (React) draws it from config(), each tab a #/route; PHP only adds the menu.
class Dashboard {

	const PAGE = 'softicon-document-viewer';
	const NS   = 'softicon-document-viewer/v1';
	// the review request: when a published document was first seen, and the person's answer
	const REVIEW = 'aldv_review';
	// the Documents tab lists at most this many posts, newest first
	const LIMIT = 200;

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'menu' ), 9 ); // before WordPress adds All Documents under it
		add_action( 'admin_menu', array( $this, 'add_new_menu' ), 11 ); // after All Documents
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( ALDV_PLUGIN_PATH . 'softicon-document-viewer.php' ), array( $this, 'action_links' ) );
		add_filter( 'plugin_row_meta', array( $this, 'row_meta' ), 10, 2 );
	}

	// the videos, newest feature last; a click plays one in a popup on the dashboard
	public static function videos() {
		return array(
			'https://www.youtube.com/watch?v=d8Giuz5k7ig' => __( 'Document Viewer in 30 seconds', 'softicon-document-viewer' ),
			'https://www.youtube.com/watch?v=kznWWJ8LBRU' => __( 'Every setting, explained', 'softicon-document-viewer' ),
			'https://www.youtube.com/watch?v=mIB4ggRL6XE' => __( 'Show only part of an Excel sheet', 'softicon-document-viewer' ),
			'https://www.youtube.com/watch?v=HveN2ydERG0' => __( 'Open files in a lightbox', 'softicon-document-viewer' ),
			'https://www.youtube.com/watch?v=8ZLpnEgAgtE' => __( 'Search inside PDF and Word files', 'softicon-document-viewer' ),
		);
	}

	// the dashboard is one page; each tab is a #/route in it
	public static function url( $tab = '' ) {
		return admin_url( 'admin.php?page=' . self::PAGE ) . ( $tab ? '#/' . $tab : '' );
	}

	public function menu() {
		add_menu_page(
			__( 'SoftIcon Document Viewer', 'softicon-document-viewer' ),
			__( 'Document Viewer', 'softicon-document-viewer' ),
			'manage_options',
			self::PAGE,
			array( $this, 'render' ),
			'dashicons-media-document',
			58
		);
		// with All Documents under it (includes/class-shortcode.php) the menu needs its own first item
		add_submenu_page( self::PAGE, __( 'SoftIcon Document Viewer', 'softicon-document-viewer' ), __( 'Dashboard', 'softicon-document-viewer' ), 'manage_options', self::PAGE, array( $this, 'render' ) );
	}

	// a post type shown under another menu gets no Add New item of its own
	public function add_new_menu() {
		$type = get_post_type_object( Shortcode::TYPE );
		if ( $type ) {
			add_submenu_page( self::PAGE, $type->labels->add_new_item, $type->labels->add_new_item, $type->cap->create_posts, 'post-new.php?post_type=' . Shortcode::TYPE );
		}
	}

	public function action_links( $links ) {
		array_unshift( $links, '<a href="' . esc_url( self::url() ) . '">' . esc_html__( 'Dashboard', 'softicon-document-viewer' ) . '</a>' );
		return $links;
	}

	public function row_meta( $links, $file ) {
		if ( plugin_basename( ALDV_PLUGIN_PATH . 'softicon-document-viewer.php' ) === $file ) {
			$links[] = '<a href="' . esc_url( self::url( 'help' ) ) . '">' . esc_html__( 'Help', 'softicon-document-viewer' ) . '</a>';
		}
		return $links;
	}

	// a new file gets a new URL, so a browser never keeps an old copy after an update
	public static function version( $file ) {
		$time = file_exists( ALDV_PLUGIN_PATH . $file ) ? filemtime( ALDV_PLUGIN_PATH . $file ) : false;
		return $time ? ALDV_PLUGIN_VERSION . '.' . $time : ALDV_PLUGIN_VERSION;
	}

	public function enqueue_assets( $hook ) {
		if ( 'toplevel_page_' . self::PAGE !== $hook ) {
			return;
		}
		wp_enqueue_style( 'aldv-dashboard', ALDV_PLUGIN_URL . 'assets/css/dashboard.css', array(), self::version( 'assets/css/dashboard.css' ) );
		$script = file_exists( ALDV_PLUGIN_PATH . 'build/dashboard.asset.php' ) ? require ALDV_PLUGIN_PATH . 'build/dashboard.asset.php' : array(
			'dependencies' => array(),
			'version'      => ALDV_PLUGIN_VERSION,
		);
		wp_enqueue_script( 'aldv-dashboard', ALDV_PLUGIN_URL . 'build/dashboard.js', $script['dependencies'], $script['version'], true );
		wp_set_script_translations( 'aldv-dashboard', 'softicon-document-viewer', ALDV_PLUGIN_PATH . 'languages' );
		wp_add_inline_script( 'aldv-dashboard', 'window.aldvDashboard = ' . wp_json_encode( self::config() ) . ';', 'before' );
	}

	// the tab names; their content is React (src/dashboard), an add-on adds its own through the aldv.dashboard.tabs JS filter
	public static function tabs() {
		return apply_filters(
			'aldv_dashboard_tabs',
			array(
				'welcome'   => __( 'Welcome', 'softicon-document-viewer' ),
				'documents' => __( 'Documents', 'softicon-document-viewer' ),
				'help'      => __( 'Help', 'softicon-document-viewer' ),
			)
		);
	}

	private static function config() {
		$tabs = array();
		foreach ( self::tabs() as $key => $label ) {
			$tabs[] = array(
				'key'   => $key,
				'label' => $label,
			);
		}
		$videos = array();
		foreach ( self::videos() as $url => $title ) {
			$videos[] = array(
				'url'   => $url,
				'title' => $title,
			);
		}
		$config = array(
			'tabs'    => $tabs,
			'version' => ALDV_PLUGIN_VERSION,
			'icon'    => ALDV_PLUGIN_URL . 'assets/images/icon-128x128.png',
			'videos'  => $videos,
			'review'  => self::review(),
			'urls'    => array(
				'newPage'     => admin_url( 'post-new.php?post_type=page' ),
				'newDocument' => admin_url( 'post-new.php?post_type=' . Shortcode::TYPE ),
				'allDocs'     => admin_url( 'edit.php?post_type=' . Shortcode::TYPE ),
				'media'       => admin_url( 'upload.php' ),
			),
			'start'   => self::start(),
			// the Help tab's "Your site details", copied into a support topic (only copied, never sent)
			'site'    => array(
				'wp'    => get_bloginfo( 'version' ),
				'php'   => PHP_VERSION,
				'theme' => wp_get_theme()->get( 'Name' ),
			),
		);
		return apply_filters( 'aldv_dashboard_config', $config );
	}

	// plain text for React, which escapes it: get_the_title() turns & into &#038;
	private static function plain( $html ) {
		return trim( html_entity_decode( wp_strip_all_tags( (string) $html ), ENT_QUOTES, 'UTF-8' ) );
	}

	// Getting started (src/dashboard/GettingStarted.js): the editors on this site, and the newest documents with their shortcodes
	private static function start() {
		$docs = array();
		foreach ( get_posts(
			array(
				'post_type'        => Shortcode::TYPE,
				'post_status'      => 'publish',
				'numberposts'      => 5,
				'orderby'          => 'modified',
				'suppress_filters' => false,
			)
		) as $doc ) {
			$title  = self::plain( get_the_title( $doc ) );
			$docs[] = array(
				'id'    => (int) $doc->ID,
				'title' => '' !== $title ? $title : __( '(no title)', 'softicon-document-viewer' ),
				'edit'  => (string) get_edit_post_link( $doc->ID, 'raw' ),
			);
		}
		$count = wp_count_posts( Shortcode::TYPE );
		return array(
			'docs'       => $docs,
			'total'      => isset( $count->publish ) ? (int) $count->publish : 0,
			'elementor'  => did_action( 'elementor/loaded' ) > 0,
			'classic'    => class_exists( 'Classic_Editor' ),
			'blockTheme' => function_exists( 'wp_is_block_theme' ) && wp_is_block_theme(),
			'siteEditor' => admin_url( 'site-editor.php' ),
		);
	}

	// registered on every request (REST calls are not admin pages), see softicon-document-viewer.php
	public static function routes() {
		$admin = function () {
			return current_user_can( 'manage_options' );
		};
		register_rest_route(
			self::NS,
			'/dashboard/documents',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'documents' ),
				'permission_callback' => $admin,
			)
		);
		register_rest_route(
			self::NS,
			'/dashboard/review',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'review_answer' ),
				'permission_callback' => $admin,
				'args'                => array(
					'answer' => array(
						'type'     => 'string',
						'required' => true,
						'enum'     => array( 'later', 'done' ),
					),
				),
			)
		);
	}

	// the Document Viewer blocks in a list of parsed blocks, also inside groups and columns
	private static function viewers( $blocks ) {
		$found = array();
		foreach ( $blocks as $block ) {
			if ( Block::NAME === $block['blockName'] ) {
				$found[] = $block['attrs'];
			}
			if ( ! empty( $block['innerBlocks'] ) ) {
				$found = array_merge( $found, self::viewers( $block['innerBlocks'] ) );
			}
		}
		return $found;
	}

	// The Documents tab: every post, page, document or pattern with the block, newest first, with the files it shows
	public static function documents() {
		global $wpdb;
		$types = array_values( get_post_types( array( 'show_ui' => true ) ) );
		$ids   = $wpdb->get_col( $wpdb->prepare( "SELECT ID FROM {$wpdb->posts} WHERE post_content LIKE %s AND post_type IN (" . implode( ',', array_fill( 0, count( $types ), '%s' ) ) . ") AND post_status NOT IN ('trash','auto-draft','inherit') ORDER BY post_modified DESC LIMIT %d", array_merge( array( '%' . $wpdb->esc_like( '<!-- wp:' . Block::NAME ) . '%' ), $types, array( self::LIMIT + 1 ) ) ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare -- read on the dashboard only; the IN list is placeholders
		$ids   = array_map( 'intval', (array) $ids );
		$more  = count( $ids ) > self::LIMIT;
		$ids   = array_slice( $ids, 0, self::LIMIT );
		_prime_post_caches( $ids, false, false );

		$rows = array();
		foreach ( $ids as $id ) {
			$post = get_post( $id );
			if ( ! $post ) {
				continue;
			}
			$files = array();
			foreach ( self::viewers( parse_blocks( $post->post_content ) ) as $attrs ) {
				$url     = isset( $attrs['fileUrl'] ) ? (string) $attrs['fileUrl'] : '';
				$name    = isset( $attrs['fileName'] ) ? self::plain( $attrs['fileName'] ) : '';
				$files[] = array(
					'name'     => '' !== $name ? $name : rawurldecode( wp_basename( (string) wp_parse_url( $url, PHP_URL_PATH ) ) ),
					'ext'      => Block::extension( $url ),
					'lightbox' => ! empty( $attrs['lightbox'] ),
				);
			}
			$type   = get_post_type_object( $post->post_type );
			$status = get_post_status_object( $post->post_status );
			$title  = self::plain( get_the_title( $post ) );
			$rows[] = array(
				'id'        => $id,
				'title'     => '' !== $title ? $title : __( '(no title)', 'softicon-document-viewer' ),
				'type'      => $type ? $type->labels->singular_name : $post->post_type,
				'status'    => 'publish' !== $post->post_status && $status ? $status->label : '',
				'edit'      => (string) get_edit_post_link( $id, 'raw' ),
				'view'      => is_post_publicly_viewable( $post ) ? (string) get_permalink( $post ) : '',
				'files'     => $files,
				// a document made under All Documents has a shortcode, a block in a page or post does not
				'shortcode' => Shortcode::TYPE === $post->post_type ? Shortcode::code( $id ) : '',
			);
		}

		return rest_ensure_response(
			array(
				'rows'  => $rows,
				'more'  => $more,
				'limit' => self::LIMIT,
			)
		);
	}

	// when a published document was first seen, when it was last looked for, "later" until when, and "done"
	private static function review_state() {
		return wp_parse_args(
			get_option( self::REVIEW, array() ),
			array(
				'since'   => 0,
				'checked' => 0,
				'later'   => 0,
				'done'    => false,
			)
		);
	}

	// a short review request on this dashboard only: 3 days after a published page with the block is first seen,
	// until the person reviews, says they did, or asks again later (30 days)
	public static function review() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return null;
		}
		$review = self::review_state();
		if ( $review['done'] || $review['later'] > time() ) {
			return null;
		}
		// a published page, post or document with the block, looked for at most once a day until one is found
		if ( ! $review['since'] && $review['checked'] < time() - DAY_IN_SECONDS ) {
			$found             = new \WP_Query(
				array(
					'post_type'      => array_merge( array_values( get_post_types( array( 'exclude_from_search' => false ) ) ), array( Shortcode::TYPE ) ),
					'post_status'    => 'publish',
					's'              => 'wp:' . Block::NAME,
					'sentence'       => true,
					'posts_per_page' => 1,
					'fields'         => 'ids',
					'no_found_rows'  => true,
				)
			);
			$review['checked'] = time();
			$review['since']   = $found->posts ? time() : 0;
			update_option( self::REVIEW, $review, false );
		}
		if ( ! $review['since'] || $review['since'] > time() - 3 * DAY_IN_SECONDS ) {
			return null;
		}
		return array( 'url' => 'https://wordpress.org/support/plugin/softicon-document-viewer/reviews/#new-post' );
	}

	public static function review_answer( \WP_REST_Request $request ) {
		$review = self::review_state();
		if ( 'done' === $request->get_param( 'answer' ) ) {
			$review['done'] = true;
		} else {
			$review['later'] = time() + 30 * DAY_IN_SECONDS;
		}
		update_option( self::REVIEW, $review, false );
		return rest_ensure_response( array( 'ok' => true ) );
	}

	// React draws the whole page into #aldv-dashboard
	public function render() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap aldv-dash-notices">
			<h1 class="screen-reader-text"><?php esc_html_e( 'SoftIcon Document Viewer', 'softicon-document-viewer' ); ?></h1>
			<hr class="wp-header-end">
		</div>
		<div id="aldv-dashboard" class="aldv-dash">
			<noscript><p><?php esc_html_e( 'The Document Viewer dashboard needs JavaScript.', 'softicon-document-viewer' ); ?></p></noscript>
		</div>
		<?php
	}
}
