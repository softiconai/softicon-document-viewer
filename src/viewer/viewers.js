// One lazy chunk per viewer, loaded only when a file of that kind is shown (front end and editor preview).
// sheet: () => import( './Sheet' ) comes next, see PROJECT-NOTES.md §11.
export const viewers = {
	pdf: () => import( /* webpackChunkName: "viewer-pdf" */ './Pdf' ),
	docx: () => import( /* webpackChunkName: "viewer-docx" */ './Docx' ),
};
