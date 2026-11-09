const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const CopyPlugin = require('copy-webpack-plugin');

// drop the RTL stylesheet copies wp-scripts emits, the styles use logical properties instead
const plugins = defaultConfig.plugins.filter(p => !(Object.values(p).length === 2 && Object.values(p)?.[1]?.filename === '[name]-rtl.css'));

const pdfjs = 'node_modules/pdfjs-dist/';

// binary CMaps and fonts become base64 JSON, read back by JsonDataFactory in src/viewer/Pdf.js
const asJson = (folder, to) => ({
	from: pdfjs + folder,
	to: `pdfjs/${to}/[name][ext].json`,
	globOptions: { ignore: ['**/LICENSE*'] },
	transform: content => JSON.stringify(content.toString('base64'))
});

// license files get a .txt extension
const licenses = (folder, to, names) => names.map(name => ({
	from: `${pdfjs}${folder}/${name}`,
	to: `pdfjs/${to}/${name}.txt`
}));

// css-loader leaves url(./aldv) alone: it is a marker for the build folder (--aldv-build in style.scss), not a file
const MARKER = /^(\.\/)?aldv$/;
const rules = defaultConfig.module.rules.map(rule => (Array.isArray(rule.use) ? {
	...rule,
	use: rule.use.map(use => (use && use.options && 'importLoaders' in use.options
		? { ...use, options: { ...use.options, url: { filter: url => !MARKER.test(url) } } }
		: use))
} : rule));

module.exports = {
	...defaultConfig,
	module: { ...defaultConfig.module, rules },
	// the lazy viewer chunks get a version, so a browser never mixes a cached old chunk with a new view.js
	output: { ...defaultConfig.output, chunkFilename: '[name].js?ver=[contenthash:8]' },
	// each library gets its own chunk under its own name (readme.txt names them), loaded together with its viewer
	optimization: {
		...defaultConfig.optimization,
		splitChunks: {
			...defaultConfig.optimization.splitChunks,
			cacheGroups: {
				...defaultConfig.optimization.splitChunks.cacheGroups,
				pdfjs: { test: /[\\/]node_modules[\\/]pdfjs-dist[\\/]/, name: 'pdfjs', chunks: 'async', enforce: true },
				docx: { test: /[\\/]node_modules[\\/](docx-preview|jszip)[\\/]/, name: 'docx-preview', chunks: 'async', enforce: true },
				xlsx: { test: /[\\/]node_modules[\\/]xlsx[\\/]/, name: 'xlsx', chunks: 'async', enforce: true }
			}
		}
	},
	plugins: [
		...plugins,
		new CopyPlugin({
			patterns: [
				// .js not .mjs, many servers send .mjs with a MIME type workers refuse
				{ from: pdfjs + 'legacy/build/pdf.worker.min.mjs', to: 'pdfjs/pdf.worker.min.js' },
				asJson('cmaps', 'cmaps'),
				...licenses('cmaps', 'cmaps', ['LICENSE']),
				asJson('standard_fonts', 'standard_fonts'),
				...licenses('standard_fonts', 'standard_fonts', ['LICENSE_FOXIT', 'LICENSE_LIBERATION']),
				// JavaScript JPEG 2000 / JBIG2 decoders (the WebAssembly builds are not shipped)
				{ from: pdfjs + 'wasm/*_nowasm_fallback.js', to: 'pdfjs/decoders/[name][ext]' },
				...licenses('wasm', 'decoders', ['LICENSE_OPENJPEG', 'LICENSE_PDFJS_OPENJPEG', 'LICENSE_JBIG2', 'LICENSE_PDFJS_JBIG2']),
				{ from: pdfjs + 'LICENSE', to: 'pdfjs/LICENSE.txt' },
				{ from: 'node_modules/docx-preview/LICENSE', to: 'docx-preview-LICENSE.txt' },
				{ from: 'node_modules/jszip/LICENSE.markdown', to: 'jszip-LICENSE.txt' },
				{ from: 'node_modules/xlsx/LICENSE', to: 'xlsx-LICENSE.txt' }
			]
		})
	]
};
