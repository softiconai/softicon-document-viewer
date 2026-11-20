import { __ } from '@wordpress/i18n';

// while a tab loads its data, or when it could not
const Status = ( { error } ) => <div className="aldv-card aldv-status" role={ error ? 'alert' : 'status' }>
	{ error ? <><span className="dashicons dashicons-warning" aria-hidden="true" />{ error }</> : <><span className="spinner is-active" />{ __( 'Loading…', 'softicon-document-viewer' ) }</> }
</div>;

export default Status;
