#!/usr/bin/env python3
"""MechanicAI read-only, robots-aware source discovery. Python standard library only."""
import argparse
import json
import re
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

USER_AGENT = "MechanicAI-DocumentationResearch/0.1 (+manual source discovery)"
MAX_HTML_BYTES = 2_000_000

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self._title = False
        self.links = []
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "title":
            self._title = True
        if tag == "a" and d.get("href"):
            self.links.append({"href": d["href"], "label": ""})
    def handle_endtag(self, tag):
        if tag == "title":
            self._title = False
    def handle_data(self, data):
        if self._title:
            self.title += data

def allowed_by_robots(url):
    parsed = urllib.parse.urlsplit(url)
    robots_url = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, "/robots.txt", "", ""))
    request = urllib.request.Request(robots_url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            body = response.read(500_000).decode("utf-8", "replace")
        parser = urllib.robotparser.RobotFileParser()
        parser.parse(body.splitlines())
        return parser.can_fetch(USER_AGENT, url), "robots.txt checked"
    except urllib.error.HTTPError as exc:
        if exc.code in (401, 403):
            return False, "robots.txt access restricted"
        return False, "robots.txt unavailable; fail closed"
    except Exception:
        return False, "robots.txt unavailable; fail closed"

def inspect(source):
    url = source["url"]
    parsed = urllib.parse.urlsplit(url)
    record = {"id": source["id"], "url": url, "model": source.get("model"), "year": source.get("year"),
              "publisher": source.get("publisher"), "status": "not_checked", "document_links": []}
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        record.update(status="rejected", reason="HTTPS public URL required")
        return record
    permitted, reason = allowed_by_robots(url)
    if not permitted:
        record.update(status="skipped", reason=reason)
        return record
    try:
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/pdf"})
        with urllib.request.urlopen(request, timeout=20) as response:
            final_url = response.geturl()
            if urllib.parse.urlsplit(final_url).hostname != parsed.hostname:
                record.update(status="skipped", reason="Cross-host redirect requires separate approval")
                return record
            content_type = response.headers.get("Content-Type", "").split(";")[0].lower()
            record["content_type"] = content_type
            record["final_url"] = final_url
            if content_type == "application/pdf":
                record.update(status="pdf_discovered", reason="PDF not downloaded or republished")
                return record
            if content_type != "text/html":
                record.update(status="skipped", reason="Unsupported content type")
                return record
            body = response.read(MAX_HTML_BYTES + 1)
            if len(body) > MAX_HTML_BYTES:
                record.update(status="skipped", reason="HTML exceeds size limit")
                return record
            parser = Links()
            parser.feed(body.decode("utf-8", "replace"))
            record["title"] = parser.title.strip()[:300]
            seen = set()
            for item in parser.links:
                link = urllib.parse.urljoin(final_url, item["href"])
                target = urllib.parse.urlsplit(link)
                if target.scheme != "https" or target.hostname != parsed.hostname:
                    continue
                if not re.search(r"\\.pdf(?:$|\\?)|manual|diagram|parts|service|handleiding", link, re.I):
                    continue
                clean = urllib.parse.urldefrag(link)[0]
                if clean not in seen:
                    seen.add(clean)
                    record["document_links"].append(clean)
                if len(record["document_links"]) >= 50:
                    break
            record.update(status="indexed", reason="Link metadata only; no document content retained")
    except Exception as exc:
        record.update(status="error", reason=f"{type(exc).__name__}: {str(exc)[:180]}")
    return record

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sources", default="documentation/sources.json")
    ap.add_argument("--output", default="documentation/discovery-results.json")
    ap.add_argument("--execute", action="store_true", help="Explicitly enable outbound requests")
    args = ap.parse_args()
    sources = json.loads(Path(args.sources).read_text(encoding="utf-8"))
    if not args.execute:
        print(json.dumps({"dry_run": True, "sources": len(sources), "message": "No network requests. Pass --execute to inspect robots-permitted pages."}, indent=2))
        return
    records = [inspect(source) for source in sources]
    out = {"generated_at": datetime.now(timezone.utc).isoformat(), "records": records,
           "warning": "Unverified source discovery only. Not repair instructions or VIN compatibility."}
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output).write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": args.output, "status_counts": {s: sum(r["status"] == s for r in records) for s in sorted(set(r["status"] for r in records))}}, indent=2))

if __name__ == "__main__":
    main()
