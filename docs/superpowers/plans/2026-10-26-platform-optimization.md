# Platform optimization implementation plan

**Goal:** Apply the four requested improvements from `/Users/qijianxin/Downloads/出海大平台优化文档.docx` to the existing local frontend.

**Architecture:** Keep classic scripts, bilingual UI and browser persistence. Document conversion happens locally; imported content is sanitized before preview and persistence. Customer edits use supplier-scoped records and never delete inquiry history. Product files are parsed, mapped, validated and explicitly confirmed before storage.

**Tech stack:** Existing HTML/CSS/JS; vendored Mammoth for DOCX and SheetJS for Excel.

**Constraints:** No backend, no push, no source document or private spreadsheets added to public assets. Existing English article title/body requirements remain. Import never publishes automatically. Preserve existing inquiries and user input on errors.

## Tasks

- [x] Article import: add file selection, format-preserving conversion, sanitized preview, explicit replace/append action; keep heading/paragraph/list/table/image structure. Add regression tests for DOCX, text, malicious HTML, cancellation and publication persistence.
- [x] Customer CRUD: add supplier-owned manual customer records, editable inquiry-derived profiles, search, details and delete confirmation. Deleting a profile keeps original inquiry records. Add isolation and persistence failure tests.
- [x] Product bulk import: add Excel/CSV file handling, workbook sheet selection, automatic header matching with manual mapping, preview, row-level errors and explicit import. Keep existing product shape and validation; ensure stale previews cannot be committed. Add round-trip and failure tests.
- [x] Store links: add bilingual links to `storefront.html?supplier_id=…` beside existing product links on home featured suppliers and supplier directory.
- [x] Integrate and verify: unit tests, isolated Playwright flows and desktop/mobile screenshots; update cache versions and record verification outcomes.

## Review focus

- Imported markup must not execute scripts or retain unsafe links, attributes or active embedded content.
- Selecting another file or changing mapping must invalidate previous import results, including failed reads.
- Customer changes must isolate suppliers and preserve inquiry history.
- Import and storage errors must retain entered data and avoid false success states.
- Mobile layouts must keep actions reachable without horizontal page overflow.
