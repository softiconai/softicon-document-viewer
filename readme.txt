=== SoftIcon Document Viewer – Embed PDF, Word & Excel Files ===
Contributors: softiconai
Tags: document viewer, docx viewer, excel viewer, embed document, block
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.3.1
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html

Show PDF, Word, Excel and CSV files on your pages with a block. The files open in the visitor's browser, no Google or Microsoft viewer needed.

== Description ==

**SoftIcon Document Viewer** adds a **Document Viewer** block to the block editor. Pick a PDF, Word (DOCX), Excel (XLSX, XLS) or CSV file from the Media Library, upload one, or paste a link.

https://www.youtube.com/watch?v=d8Giuz5k7ig

* **PDF in the page** – the pages show one below the other, sharp on phones and retina screens. Only the pages near the screen are drawn, and only the parts of the file they need are downloaded, so long PDFs open fast.
* **Word as real text** – a DOCX file becomes real HTML with its headings, lists, tables, images, headers and footers, so visitors can search it and screen readers can read it. On a computer it looks like Word's pages; on a phone the text flows to the screen width so it stays readable.
* **Excel that looks like Excel** – XLSX and XLS files show with their sheet tabs, number, currency, percent and date formats, merged cells and links. Only the used cells are shown, and the header row and row numbers stay in view while visitors scroll. Choose which sheet opens first, or show only part of it, like A1:F20 ([video](https://www.youtube.com/watch?v=mIB4ggRL6XE)).
* **CSV as a table** – the first row is the header (or turn that off), and values stay exactly as written, so codes like 00123 keep their zeros.
* **Search inside the file** – visitors find words in a PDF or Word file: every result is marked, and Enter jumps to the next one. Ctrl+F (Cmd+F on a Mac) in the viewer opens it too, even for a PDF, which the browser's own search cannot read ([video](https://www.youtube.com/watch?v=8ZLpnEgAgtE)).
* **Toolbar** – zoom and search for PDF and Word, the page number for PDF, fullscreen for every file, and the Download button. Every button works with the keyboard and screen readers; turn the ones you do not need off.
* **Lightbox** – the page shows only the file card with a View button (write your own text), and the document opens over the page when a visitor clicks it. Good for a page with many files. Esc, the close button or a click outside closes it ([video](https://www.youtube.com/watch?v=HveN2ydERG0)).
* **Your size, your colors** – the whole document grows with the page, or it scrolls inside a box of the height you set. Wide and full width are supported. Pick the background, border, toolbar and table header colors.
* **Live preview** – the block editor shows the real file, not a placeholder.
* **No outside viewer** – nothing is sent to Google or Microsoft, so it works on intranets, local sites and members-only sites.
* **No cookies, no tracking** – the plugin sends nothing anywhere.
* **Loads only where it is used** – the viewer's code loads only on pages with the block, and only the part for that kind of file, when the block comes near the screen (in a lightbox, when the visitor points at the button).

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

= Can I show only part of a spreadsheet? =

Yes. Under Spreadsheet in the block's settings, write the cells in **Cells to show**, the way Excel does: A1:F20, whole columns (A:F) or whole rows (5:40). Only those cells of the sheet shown first appear, with their own row numbers, and without the other sheets' tabs. Leave it empty for the whole sheet.

Watch it: [Show only part of an Excel sheet](https://www.youtube.com/watch?v=mIB4ggRL6XE) (0:47).

= Can visitors search inside a document? =

Yes, in PDF and Word files. The magnifier in the toolbar opens a search box; every result is marked, Enter goes to the next one and Shift+Enter back. Ctrl+F (Cmd+F on a Mac) after clicking in the viewer opens it too. A scanned PDF (pictures of pages, no text) has nothing to find. Turn the button off under Toolbar → Search button.

Watch it: [Search inside PDF and Word files](https://www.youtube.com/watch?v=8ZLpnEgAgtE) (0:42).

= Can the document open in a popup? =

Yes. Turn on **Open in a lightbox** under Lightbox in the block's settings. The page then shows only the file card with a button, and the document opens over the page when a visitor clicks it. Change the button's text under **Button text**; empty, it says View.

Watch it: [Open files in a lightbox](https://www.youtube.com/watch?v=HveN2ydERG0) (0:46).

= Is there a video tutorial? =

Yes, short ones:

* [Every setting, explained](https://www.youtube.com/watch?v=kznWWJ8LBRU) (1:32), also linked from the Help panel in the block's settings.
* [Show only part of an Excel sheet](https://www.youtube.com/watch?v=mIB4ggRL6XE) (0:47)
* [Open files in a lightbox](https://www.youtube.com/watch?v=HveN2ydERG0) (0:46)
* [Search inside PDF and Word files](https://www.youtube.com/watch?v=8ZLpnEgAgtE) (0:42)

The Spreadsheet, Lightbox and Toolbar panels in the block's settings link to their own video.

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

= 1.3.1 =
* Short videos: the Spreadsheet, Lightbox and Toolbar panels in the block's settings link to a video of their feature (Cells to show, Lightbox, Search), and so does the readme.

= 1.3.0 =
* New: Search inside PDF and Word files. Every result is marked, Enter jumps to the next one, and Ctrl+F (Cmd+F) in the viewer opens it. Turn it off under Toolbar → Search button.

= 1.2.0 =
* New: Lightbox. The page shows only the file card with a button, and the document opens over the page when a visitor clicks it. The button's text is yours to choose.

= 1.1.0 =
* New: Cells to show, for Excel and CSV files. Show only part of a sheet, such as A1:F20, whole columns (A:F) or whole rows (5:40).

= 1.0.3 =
* The block is easier to find in the inserter: it also answers to viewer, embed, file and reader.

= 1.0.2 =
* A video tutorial: the Help panel in the block's settings and the readme link to "Every setting, explained".

= 1.0.1 =
* The plugin's full name: SoftIcon Document Viewer – Embed PDF, Word & Excel Files.

= 1.0.0 =
* First release: PDF, Word (DOCX), Excel (XLSX, XLS) and CSV viewer block with live preview, toolbar (zoom, page number, fullscreen, download), fixed or automatic height and colors.
