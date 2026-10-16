#!/usr/bin/env python3
"""Compatibility CLI; implementation lives in modules/document_ingestion/core.py."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from modules.document_ingestion.core import main

if __name__ == "__main__":
    main()
