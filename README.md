# SoftIcon Document Viewer

A WordPress block that shows PDF, Word (DOCX), Excel (XLSX, XLS) and CSV files on the page. The files open in the visitor's browser, with no Google or Microsoft viewer.

## Development

```bash
npm install
npm run start   # watch
npm run build   # production build
npm run lint
npm run zip     # build + translations + release zip
```

Shared editor helpers come from the `softicon-tools` folder next to this plugin. `npm run tools` copies them into `src/vendor/softicon-tools/` before each build.

## License

GPLv3 or later.
