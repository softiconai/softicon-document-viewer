// One lazy chunk per viewer, loaded only when a file of that kind is shown (front end and editor preview).
export const viewers = {
	pdf: () => import( /* webpackChunkName: "viewer-pdf" */ './Pdf' ),
	docx: () => import( /* webpackChunkName: "viewer-docx" */ './Docx' ),
	sheet: () => import( /* webpackChunkName: "viewer-sheet" */ './Sheet' ),
};
