# Local browser dependencies

Only used on document or spreadsheet import pages. No CDN request is needed at runtime.

- Mammoth 1.12.2: `mammoth.browser.min.js`, BSD-2-Clause, `mammoth.LICENSE`. From the locally installed Mammoth package in the reference project. Upstream: https://github.com/mwilliamson/mammoth.js
- JSZip 3.10.2: `jszip.min.js`, MIT or GPL-3.0 (used under MIT), `jszip.LICENSE`. From the locally installed JSZip package in the reference project. Upstream: https://github.com/Stuk/jszip
- SheetJS CE 0.20.3: `xlsx.full.min.js`, Apache-2.0, `sheetjs.LICENSE`. Source: https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js

Converted document markup must pass through `DocumentImport.sanitize` before previewing or applying. Import errors must preserve existing editor content. Product files and source documents stay in the local browser and are not sent to third-party services.
