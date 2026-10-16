#!/usr/bin/env python3
"""Opt-in local PDF ingestion for user-owned or licensed technical documents.

Requires: pip install docling
No network crawler is invoked. Do not process copyrighted documents without permission.
"""
import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

MAX_SIZE = 80 * 1024 * 1024

def ingest(pdf, output, manufacturer, model, year, market, license_note):
    if not pdf.is_file() or pdf.suffix.lower() != ".pdf":
        raise ValueError("Input must be an existing PDF file")
    if pdf.stat().st_size > MAX_SIZE:
        raise ValueError("PDF exceeds 80 MB safety limit")
    if not license_note.strip():
        raise ValueError("A license/permission note is required")
    try:
        from docling.document_converter import DocumentConverter
    except ImportError as exc:
        raise SystemExit("Install optional dependency: pip install docling") from exc
    digest = hashlib.sha256(pdf.read_bytes()).hexdigest()
    converter = DocumentConverter()
    result = converter.convert(str(pdf))
    markdown = result.document.export_to_markdown()
    # Prevent accidental mass publication of original manual content:
    # Save a local document index with bounded excerpts only, not full-text exports.
    lines = [re.sub(r"\\s+", " ", line).strip() for line in markdown.splitlines()]
    headings = [line[:240] for line in lines if line.startswith("#")][:150]
    part_numbers = sorted(set(re.findall(r"\\b(?:[0-9]{5}-[0-9A-Z]{5}|[0-9]{5}-[0-9A-Z]{3,6})\\b", markdown)))[:250]
    record = {
        "schema_version": 1,
        "ingested_at": datetime.now(timezone.utc).isoformat(),
        "document": {"filename": pdf.name, "sha256": digest, "size_bytes": pdf.stat().st_size,
                     "license_note": license_note, "stored_full_text": False},
        "vehicle": {"manufacturer": manufacturer, "model": model, "year": year, "market": market,
                    "fitment_verified": False},
        "extraction": {"engine": "docling", "headings": headings, "candidate_part_numbers": part_numbers,
                       "manual_review_required": True, "repair_procedures_verified": False},
        "notice": "Candidate numbers are unverified OCR/text matches. Do not use for repairs or ordering without original page and variant verification."
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return record

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--output", type=Path, default=Path("documentation/local-index.json"))
    parser.add_argument("--manufacturer", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--market", default="unverified")
    parser.add_argument("--license-note", required=True, help="Document ownership or explicit reuse permission")
    args = parser.parse_args()
    result = ingest(args.pdf, args.output, args.manufacturer, args.model, args.year, args.market, args.license_note)
    print(json.dumps({"output": str(args.output), "headings": len(result["extraction"]["headings"]),
                      "candidate_part_numbers": len(result["extraction"]["candidate_part_numbers"]),
                      "fitment_verified": False}, indent=2))

if __name__ == "__main__":
    main()
