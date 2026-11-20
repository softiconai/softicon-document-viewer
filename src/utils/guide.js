// the dashboard's "Block" or "Shortcode" choice opens the editor with ?aldv_start=block|shortcode: once a file is picked,
// the block says what to do next (Edit.js). Read once on load, before src/index.js takes it out of the address
const mode = new URLSearchParams( window.location.search ).get( 'aldv_start' );

export default [ 'block', 'shortcode' ].includes( mode ) ? mode : null;
