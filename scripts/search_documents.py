#!/usr/bin/env python3
"""Search an authorized local metadata index without making network requests."""
import argparse
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from modules.document_index import load_index, search

def main():
    p = argparse.ArgumentParser()
    p.add_argument("index", type=Path)
    p.add_argument("query")
    p.add_argument("--manufacturer", required=True)
    p.add_argument("--model", required=True)
    p.add_argument("--year", required=True, type=int)
    p.add_argument("--market")
    a = p.parse_args()
    result = search([load_index(a.index)], a.query, manufacturer=a.manufacturer, model=a.model, year=a.year, market=a.market)
    print(json.dumps({"matches": result, "repair_instructions_available": False}, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
