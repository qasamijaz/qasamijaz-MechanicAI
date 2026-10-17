"""Offline, read-only PDF evidence extraction for user-supplied manuals.

Install: pip install pypdf
Run: python manual_ingest.py /path/to/authorized-manual.pdf
Never automatically download manufacturer PDFs. Extracted text is untrusted evidence.
"""
import hashlib
import json
import sys
from pathlib import Path

MAX_BYTES = 25 * 1024 * 1024
MAX_PAGES = 500
MAX_PAGE_CHARS = 30000


def ingest_pdf(path):
    source = Path(path)
    if not source.is_file() or source.suffix.lower() != ".pdf":
        raise ValueError("A local PDF file is required")
    size = source.stat().st_size
    if size == 0 or size > MAX_BYTES:
        raise ValueError("PDF must be between 1 byte and 25 MB")
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise RuntimeError("Install pypdf before extracting PDF text") from exc
    digest = hashlib.sha256()
    with source.open("rb") as stream:
        for block in iter(lambda: stream.read(65536), b""):
            digest.update(block)
    reader = PdfReader(str(source), strict=True)
    if reader.is_encrypted:
        raise ValueError("Encrypted PDFs are not supported")
    count = len(reader.pages)
    if not 1 <= count <= MAX_PAGES:
        raise ValueError("PDF page count exceeds the safety limit")
    pages = []
    for index, page in enumerate(reader.pages, 1):
        extracted = page.extract_text() or ""
        if len(extracted) > MAX_PAGE_CHARS:
            extracted = extracted[:MAX_PAGE_CHARS]
        pages.append({
            "page": index,
            "text": extracted,
            "text_available": bool(extracted.strip()),
            "citation": f"sha256:{digest.hexdigest()}#page={index}",
        })
    return {
        "schema_version": 1,
        "sha256": digest.hexdigest(),
        "file_name": source.name,
        "page_count": count,
        "extraction_method": "pypdf_text_only",
        "manual_identity_verified": False,
        "procedure_verified": False,
        "pages": pages,
        "warning": "Text extraction is not factual verification. Scanned pages, diagrams, and layout may be missing.",
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python manual_ingest.py authorized-manual.pdf")
    print(json.dumps(ingest_pdf(sys.argv[1]), ensure_ascii=False, indent=2))
