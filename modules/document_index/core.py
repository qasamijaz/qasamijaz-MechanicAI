"""Evidence-only search over local MechanicAI document metadata indexes.

No AI-generated procedures. No unverified part fitment. Standard library only.
"""
import json
import re
from pathlib import Path

MAX_INDEX_BYTES = 2_000_000
TOKEN_RE = re.compile(r"[\w-]+", re.UNICODE)

def _tokens(value):
    return {word.casefold() for word in TOKEN_RE.findall(str(value)) if len(word) > 1}

def load_index(path):
    path = Path(path)
    if not path.is_file() or path.stat().st_size > MAX_INDEX_BYTES:
        raise ValueError("Index missing or too large")
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("schema_version") != 1:
        raise ValueError("Unsupported index schema")
    if not isinstance(data.get("vehicle"), dict) or not isinstance(data.get("extraction"), dict):
        raise ValueError("Malformed index")
    if not isinstance(data["extraction"].get("headings"), list) or not isinstance(data["extraction"].get("candidate_part_numbers"), list):
        raise ValueError("Malformed extraction")
    return data

def search(indexes, query, *, manufacturer, model, year, market=None, limit=10):
    """Return source-labelled candidate matches, never approved repair instructions.

    Vehicle matching is strict. Unspecified market remains unverified.
    """
    terms = _tokens(query)
    if not terms or not manufacturer or not model or not isinstance(year, int):
        return []
    matches = []
    for index in indexes:
        vehicle = index.get("vehicle", {})
        if str(vehicle.get("manufacturer", "")).casefold() != manufacturer.casefold():
            continue
        if str(vehicle.get("model", "")).casefold() != model.casefold():
            continue
        if vehicle.get("year") != year:
            continue
        if market and str(vehicle.get("market", "")).casefold() != market.casefold():
            continue
        extraction = index.get("extraction", {})
        document = index.get("document", {})
        for kind, values in (("heading", extraction.get("headings", [])),
                             ("candidate_part_number", extraction.get("candidate_part_numbers", []))):
            for value in values:
                if not isinstance(value, str):
                    continue
                score = len(terms & _tokens(value))
                if not score and query.casefold().strip() not in value.casefold():
                    continue
                matches.append({
                    "type": kind, "value": value[:240], "score": max(score, 1),
                    "source_filename": document.get("filename", "unknown"),
                    "source_sha256": document.get("sha256"),
                    "model": vehicle.get("model"), "year": vehicle.get("year"),
                    "market": vehicle.get("market"),
                    "page": None, "page_verified": False,
                    "fitment_verified": False, "procedure_verified": False,
                    "review_required": True,
                    "notice": "Candidate metadata only; no page citation or repair verification."
                })
    return sorted(matches, key=lambda x: (-x["score"], x["source_filename"], x["value"]))[:max(0, min(limit, 50))]
