# MechanicAI Documentation Ingestion — phase 1

This is a **read-only source discovery prototype**, not a complete manual scraper or RAG engine.

## Run
```bash
python3 scripts/discover_manuals.py
python3 scripts/discover_manuals.py --execute
```

Dry-run is the default. The explicit execute flag checks robots.txt before each page, refuses inaccessible robots rules, reads at most 2 MB HTML, restricts discovered links to the same hostname, and writes source metadata to `documentation/discovery-results.json`. PDF URLs are **discovered but not downloaded**. No login, paywall, anti-bot bypass, or mass crawling.

## Next gates
1. Obtain permission/licensing for PDF and diagram reuse.
2. Add an approved-domain registry, stronger DNS/IP and redirect safeguards before operating this against untrusted URLs or as a server.
3. Use Docling in a separate worker for licensed/user-supplied PDFs, retaining page numbers and diagram references.
4. Add document versioning, model/year/market/VIN compatibility review, human signoff, and citations.
5. Connect only approved content to Qdrant and the guide UI.

**Safety:** This importer does not verify bolt locations, torque, fluid specifications, service procedures or parts fitment. 2019 sources must not be assumed valid for a different model year.
