=== SoftIcon Document Viewer ===
Contributors: softiconai
Tags: document viewer, docx viewer, excel viewer, embed document, office viewer
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html

Show PDF, Word, Excel and CSV files on your pages with a block. The files open in the visitor's browser, no Google or Microsoft viewer needed.

== Description ==

**SoftIcon Document Viewer** adds a **Document Viewer** block to the block editor. Pick a PDF, Word (DOCX), Excel (XLSX, XLS) or CSV file from the Media Library, upload one, or paste a link.

* **PDF in the page** – the pages show one below the other, sharp on phones and retina screens. Only the pages near the screen are drawn, and only the parts of the file they need are downloaded, so long PDFs open fast.
* **Word as real text** – a DOCX file becomes real HTML with its headings, lists, tables, images, headers and footers, so visitors can search it and screen readers can read it. On a computer it looks like Word's pages; on a phone the text flows to the screen width so it stays readable.
* **Live preview** – the block editor shows the real file, not a placeholder.
* **No outside viewer** – nothing is sent to Google or Microsoft, so it works on intranets, local sites and members-only sites.
* **No cookies, no tracking** – the plugin sends nothing anywhere.
* **Download button** – visitors can save the file, or you turn the button off.

= Third-party libraries =

* PDF.js 6.5.438 (npm package pdfjs-dist) by Mozilla – [github.com/mozilla/pdf.js](https://github.com/mozilla/pdf.js) – Apache License 2.0. Bundled as build/pdfjs.js and build/pdfjs/pdf.worker.min.js (minified upstream build); license in build/pdfjs/LICENSE.txt.
  Also from the pdfjs-dist package: the JavaScript builds of the OpenJPEG (BSD-2) and JBIG2 (BSD-3) image decoders in build/pdfjs/decoders, the Foxit (BSD-3) and Liberation (GPLv2 with font exception) standard fonts in build/pdfjs/standard_fonts, and the Adobe CMaps (BSD-3) in build/pdfjs/cmaps, each with its license file. The fonts and CMaps are binary data files; the build stores each one unchanged as a base64 string in a .json file, which the plugin decodes back to the original bytes for pdf.js.

* docx-preview 0.4.1 (npm package docx-preview) by Volodymyr Baydalka – [github.com/VolodymyrBaydalka/docxjs](https://github.com/VolodymyrBaydalka/docxjs) – Apache License 2.0. Bundled in build/docx-preview.js; license in build/docx-preview-LICENSE.txt.
* JSZip 3.10.2 (npm package jszip) by Stuart Knightley – [github.com/Stuk/jszip](https://github.com/Stuk/jszip) – MIT License or GPLv3 (used here under the MIT License). Bundled in build/docx-preview.js, it opens the DOCX file (a zip archive); license in build/jszip-LICENSE.txt.

The unminified source of this plugin is in the src folder, with package.json and webpack.config.js. Build it with `npm install` and `npm run build`; the build copies the pdf.js files from node_modules/pdfjs-dist.

== Installation ==

1. Install the plugin from Plugins → Add New, or upload the zip.
2. Activate it.
3. In the block editor, add the **Document Viewer** block and pick a file.

== Frequently Asked Questions ==

= Which files can it show? =

PDF, Word (DOCX), Excel (XLSX and XLS) and CSV. The older Word format (DOC) is not supported; save the file as DOCX.

= Does it send my files anywhere? =

No. The plugin does not use Google Docs Viewer, Microsoft Office Online or any other outside service. Files from your Media Library are read from your own site. A file you link from another website is loaded from that website by the visitor's browser, the same way an image from another site would be.

= A file from another website does not open =

The visitor's browser reads the file itself, so the other website has to allow that (a CORS header). Most do not. Upload the file to your Media Library instead; the block then shows a message and the Download button for such a file.

= Does a Word file look exactly like in Word? =

Text, headings, lists, tables, images, headers and footers come through well. Complex layouts (text boxes, SmartArt, charts, columns) may look different, and pages break only where the file says so. When the look matters, a PDF is the safer choice; the Download button gives visitors the original file either way.

= A PDF with a password does not open =

The block cannot show a PDF that needs a password. Save it without one, or leave the Download button on so visitors can open it on their device.

== Changelog ==

= 1.0.0 =
* First release.
