// One lazy chunk per viewer, loaded only when a file of that kind is shown (front end and editor preview).
// docx: () => import( './Docx' ) and sheet: () => import( './Sheet' ) come next, see PROJECT-NOTES.md §11.
export const viewers = {
	pdf: () => import( /* webpackChunkName: "viewer-pdf" */ './Pdf' ),
};
