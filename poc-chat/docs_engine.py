"""Source-first document discovery for the MechanicAI POC.

Never claim that catalogue entries verify procedures, diagrams or torque specs.
No arbitrary URL requests: registry contains explicit permitted manufacturer hosts.
"""
import datetime
import html
import re
import urllib.error
import urllib.request
from html.parser import HTMLParser

REGISTRY = (
    {"id": "suzuki-nl-owners", "make": "suzuki", "model": "gsx-s1000f", "year": 2019,
     "title": "Suzuki Nederland – ejermanualoversigt (2019)",
     "url": "https://www.suzuki.nl/motoren/service/gebruikershandleidingen-motoren/",
     "host": "www.suzuki.nl", "match": r"GSX[-\s]*S1000\s*\(F\)\s*2019"},
)
MAX_PAGE_BYTES = 350000

class Text(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = []; self.suppressed = 0
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript"): self.suppressed += 1
    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript"): self.suppressed = max(0, self.suppressed - 1)
    def handle_data(self, text):
        if not self.suppressed: self.parts.append(text)

def event(kind, label, **details):
    return {"type": "documentation", "at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "kind": kind, "label": label, "details": details}

def identify(messages):
    # Assemble user messages only. A single "yes" should not erase earlier model.
    text = " ".join(m["content"] for m in messages if m["role"] == "user").lower()
    if not re.search(r"\b(?:suzuki|gsx[-\s])", text):
        return None
    match = re.search(r"gsx[-\s]*([sr])[-\s]*1000[-\s]*f?\b", text)
    if not match:
        return {"make": "Suzuki", "model": None, "year": None, "confirmed": False}
    model = "GSX-R1000" if match.group(1) == "r" else "GSX-S1000F" if re.search(r"gsx[-\s]*s[-\s]*1000[-\s]*f\b", text) else "GSX-S1000"
    years = re.findall(r"\b20(?:1[6-9]|2[0-9])\b", text)
    # A user may say model year and registration year; do not silently select one.
    return {"make": "Suzuki", "model": model, "year": int(years[-1]) if len(set(years)) == 1 else None,
            "confirmed": len(set(years)) == 1 and model == "GSX-S1000F",
            "ambiguous_years": len(set(years)) > 1}

def discover(messages, emit):
    """Returns only source registry metadata. Does not ingest or verify manuals."""
    vehicle = identify(messages)
    if not vehicle:
        emit(event("scope", "Ingen understøttet producent identificeret; verificerbar søgning afventer.", reason="unsupported_domain"))
        return {"status": "unsupported", "vehicle": None, "sources": [], "manual_verified": False, "procedure_verified": False}
    emit(event("vehicle", "Modeloplysninger udledt af samtalen – endnu ikke verificeret.", vehicle=vehicle))
    if not vehicle["confirmed"]:
        emit(event("blocked", "Præcis model og entydig årgang skal bekræftes før manualmatch.", reason="ambiguous_identity"))
        return {"status": "needs_identity", "vehicle": vehicle, "sources": [], "manual_verified": False, "procedure_verified": False}
    candidates = [r for r in REGISTRY if vehicle["model"].lower() == r["model"] and vehicle["year"] == r["year"]]
    emit(event("matching", "Kilder filtreret på præcis model og årgang.", year=vehicle["year"], model=vehicle["model"],
               registered_candidates=len(candidates), policy="exact_year_only"))
    if not candidates:
        emit(event("blocked", "Ingen forhåndsgodkendt officiel kilde til denne årgang. Bruger ikke manual fra et andet år.", reason="no_exact_year_source"))
        return {"status": "no_exact_match", "vehicle": vehicle, "sources": [], "manual_verified": False, "procedure_verified": False}
    sources = []
    for item in candidates:
        emit(event("request", "Kontrollerer officiel producentoversigt.", source_id=item["id"], url=item["url"]))
        try:
            request = urllib.request.Request(item["url"], headers={"User-Agent": "MechanicAI-POC/0.2 (source verification)"})
            # Redirects are not accepted as evidence. A visited host must be reviewed before enablement.
            opener = urllib.request.build_opener(NoRedirect)
            with opener.open(request, timeout=6) as response:
                content_type = response.headers.get("Content-Type", "")
                raw = response.read(MAX_PAGE_BYTES + 1)
                status = response.status
            if status != 200 or "text/html" not in content_type or len(raw) > MAX_PAGE_BYTES:
                raise ValueError("unexpected_response")
            page = Text(); page.feed(raw.decode("utf-8", "replace"))
            plain = html.unescape(" ".join(page.parts))
            found = bool(re.search(item["match"], plain, re.I))
            if found:
                sources.append({"id": item["id"], "title": item["title"], "url": item["url"],
                                "evidence_level": "catalogue_listing_only", "model_year_listing_found": True,
                                "manual_content_verified": False, "procedure_verified": False})
            emit(event("result", "Producentkatalog kontrolleret – " + ("relevant post fundet" if found else "intet præcist match"),
                       source_id=item["id"], http_status=status, match=found, manual_content_verified=False))
        except (urllib.error.URLError, TimeoutError, ValueError, OSError) as exc:
            emit(event("unavailable", "Producentkilden kunne ikke kontrolleres.", source_id=item["id"],
                       reason=type(exc).__name__))
    status = "catalogue_only" if sources else "no_verified_listing"
    emit(event("verdict", "Søgning afsluttet. Ingen værkstedsprocedure eller reservedelstegning verificeret.",
               status=status, source_count=len(sources), manual_verified=False, procedure_verified=False))
    return {"status": status, "vehicle": vehicle, "sources": sources,
            "manual_verified": False, "procedure_verified": False}

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None
