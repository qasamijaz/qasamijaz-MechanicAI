#!/usr/bin/env python3
"""Compatibility CLI; implementation lives in modules/source_discovery/core.py."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from modules.source_discovery.core import main

if __name__ == "__main__":
    main()
