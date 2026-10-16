# MechanicAI documentation modules

Two isolated Python backend modules are now available:

| Module | Public API | Purpose |
|---|---|---|
| `modules.source_discovery` | `inspect(source)`, `allowed_by_robots(url)` | Source discovery only |
| `modules.document_ingestion` | `ingest(pdf, output, manufacturer, model, year, market, license_note)` | Licensed local PDF metadata extraction |

Existing CLIs remain:
- `python scripts/discover_manuals.py` (dry-run)
- `python scripts/discover_manuals.py --execute` (explicit network inspection)
- `python scripts/ingest_pdf.py --help` (Docling optional)

Unit tests (no network or Docling required):
```bash
python -m unittest discover -s tests -p 'test_document_modules.py' -v
```

This is an incremental extraction. No frontend integration, deployment, or production verification is implied. The source discovery implementation is not safe for arbitrary untrusted URLs in a hosted service until DNS/IP restrictions, redirect handling and approved-host controls are implemented. No service manuals are downloaded automatically.

Follow `docs/ARCHITECTURE_RULES.md` for subsequent modules.
