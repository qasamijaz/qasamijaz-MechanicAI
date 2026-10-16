# Phase 2 — Licensed PDF extraction (Docling)

This stage is **separate from web discovery**. It accepts a local, legitimately obtained PDF and creates a bounded metadata index. No full manual text is published or embedded into the web app.

Install the optional worker dependency in a Python environment:

```bash
pip install docling
python scripts/ingest_pdf.py /path/to/authorized-manual.pdf \
  --manufacturer Suzuki --model GSX-S1000F --year 2019 \
  --market "unverified" --license-note "Owner-provided document; local processing only"
```

Outputs `documentation/local-index.json` containing source SHA-256, headings, candidate part numbers, vehicle metadata, and explicit verification flags. No original PDF, images, full manual or page excerpts are committed. The optional dependency may download model weights on first run.

**Not yet built:** full diagram extraction, page-anchored citations, variant/VIN validation, Qdrant indexing, backend scheduling, user upload, automatic approved-source download, or repair-guidance generation. The extracted part numbers are candidates only. Do not treat OCR or model output as verified maintenance instructions.

Security limitations: process only trusted local PDFs in a restricted environment; Docling's parser/model dependencies have not been security-audited here. Do not run arbitrary PDFs on the public web server.
