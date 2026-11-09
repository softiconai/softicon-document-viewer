=== SoftIcon Document Viewer – Embed PDF, Word & Excel Files ===
Contributors: softiconai
Tags: document viewer, docx viewer, excel viewer, embed document, block
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.1
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html

Show PDF, Word, Excel and CSV files on your pages with a block. The files open in the visitor's browser, no Google or Microsoft viewer needed.

== Description ==

**SoftIcon Document Viewer** adds a **Document Viewer** block to the block editor. Pick a PDF, Word (DOCX), Excel (XLSX, XLS) or CSV file from the Media Library, upload one, or paste a link.

* **PDF in the page** – the pages show one below the other, sharp on phones and retina screens. Only the pages near the screen are drawn, and only the parts of the file they need are downloaded, so long PDFs open fast.
* **Word as real text** – a DOCX file becomes real HTML with its headings, lists, tables, images, headers and footers, so visitors can search it and screen readers can read it. On a computer it looks like Word's pages; on a phone the text flows to the screen width so it stays readable.
* **Excel that looks like Excel** – XLSX and XLS files show with their sheet tabs, number, currency, percent and date formats, merged cells and links. Only the used cells are shown, and the header row and row numbers stay in view while visitors scroll. Choose which sheet opens first.
* **CSV as a table** – the first row is the header (or turn that off), and values stay exactly as written, so codes like 00123 keep their zeros.
* **Toolbar** – zoom for PDF and Word, the page number for PDF, fullscreen for every file, and the Download button. Every button works with the keyboard and screen readers; turn the ones you do not need off.
* **Your size, your colors** – the whole document grows with the page, or it scrolls inside a box of the height you set. Wide and full width are supported. Pick the background, border, toolbar and table header colors.
* **Live preview** – the block editor shows the real file, not a placeholder.
* **No outside viewer** – nothing is sent to Google or Microsoft, so it works on intranets, local sites and members-only sites.
* **No cookies, no tracking** – the plugin sends nothing anywhere.
* **Loads only where it is used** – the viewer's code loads only on pages with the block, and only the part for that kind of file, when the block comes near the screen.

= Privacy =

The plugin stores no data, sets no cookies and contacts no outside service. Your files are read by the visitor's browser straight from your site. If you link a file on another website, the visitor's browser loads it from there.

= Third-party libraries =

* PDF.js 6.5.438 (npm package pdfjs-dist) by Mozilla – [github.com/mozilla/pdf.js](https://github.com/mozilla/pdf.js) – Apache License 2.0. Bundled as build/pdfjs.js and build/pdfjs/pdf.worker.min.js (minified upstream build); license in build/pdfjs/LICENSE.txt.
  Also from the pdfjs-dist package: the JavaScript builds of the OpenJPEG (BSD-2) and JBIG2 (BSD-3) image decoders in build/pdfjs/decoders, the Foxit (BSD-3) and Liberation (GPLv2 with font exception) standard fonts in build/pdfjs/standard_fonts, and the Adobe CMaps (BSD-3) in build/pdfjs/cmaps, each with its license file. The fonts and CMaps are binary data files; the build stores each one unchanged as a base64 string in a .json file, which the plugin decodes back to the original bytes for pdf.js.

* docx-preview 0.4.1 (npm package docx-preview) by Volodymyr Baydalka – [github.com/VolodymyrBaydalka/docxjs](https://github.com/VolodymyrBaydalka/docxjs) – Apache License 2.0. Bundled in build/docx-preview.js; license in build/docx-preview-LICENSE.txt.
* JSZip 3.10.2 (npm package jszip) by Stuart Knightley – [github.com/Stuk/jszip](https://github.com/Stuk/jszip) – MIT License or GPLv3 (used here under the MIT License). Bundled in build/docx-preview.js, it opens the DOCX file (a zip archive); license in build/jszip-LICENSE.txt.

* SheetJS Community Edition 0.20.3 (package xlsx) by SheetJS LLC – [sheetjs.com](https://sheetjs.com/) / [git.sheetjs.com/sheetjs/sheetjs](https://git.sheetjs.com/sheetjs/sheetjs) – Apache License 2.0. Bundled in build/xlsx.js; license in build/xlsx-LICENSE.txt. Installed from the official SheetJS tarball (cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz, as SheetJS recommends), not from the older npm release.

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

= How big can a spreadsheet be? =

Files up to 50 MB open. A sheet shows up to 20,000 rows and 1,000 columns, and more rows appear as visitors scroll; the Download button gives them the whole file. A note under the table says when a sheet is bigger than that.

= Does it work with my theme and page builder? =

It is a block, so it works wherever the block editor does: block themes, classic themes and the Site Editor. There is no shortcode or page builder widget.

= A file with a password does not open =

The block cannot show a PDF, Word or Excel file that needs a password. Save it without one, or leave the Download button on so visitors can open it on their device.

== Screenshots ==

1. A PDF on the page. The toolbar with zoom, the page number, fullscreen and Download stays in view while you scroll.
2. A Word file as real, searchable text, with its headings, lists, tables, images, headers and footers.
3. An Excel file with sheet tabs, Excel's number and date formats, and a header row and row numbers that stay in view.
4. On phones: PDF pages fit the screen, Word text flows to the screen width, and tables scroll sideways.
5. Fullscreen, here with the PDF zoomed in.
6. The live preview in the block editor, with the spreadsheet settings.
7. A fixed height: the document scrolls inside the block.

== Changelog ==

= 1.0.1 =
* The plugin's full name: SoftIcon Document Viewer – Embed PDF, Word & Excel Files.

= 1.0.0 =
* First release: PDF, Word (DOCX), Excel (XLSX, XLS) and CSV viewer block with live preview, toolbar (zoom, page number, fullscreen, download), fixed or automatic height and colors.
