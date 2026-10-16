"""Unit tests for documentation module boundaries; no network or model download."""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from modules.source_discovery.core import inspect
from modules.document_ingestion.core import ingest

class SourceDiscoveryTests(unittest.TestCase):
    def test_rejects_insecure_url(self):
        result = inspect({"id": "test", "url": "http://example.com/manual", "model": "demo"})
        self.assertEqual(result["status"], "rejected")

    def test_rejects_embedded_credentials(self):
        result = inspect({"id": "test", "url": "https://user:pass@example.com/"})
        self.assertEqual(result["status"], "rejected")

    @patch("modules.source_discovery.core.allowed_by_robots", return_value=(False, "blocked"))
    def test_robots_block_is_respected(self, mocked):
        result = inspect({"id": "test", "url": "https://example.com/manual"})
        self.assertEqual(result["status"], "skipped")
        mocked.assert_called_once()

class DocumentIngestionTests(unittest.TestCase):
    def test_missing_pdf_rejected_before_docling_import(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError):
                ingest(Path(tmp) / "missing.pdf", Path(tmp) / "out.json", "Suzuki", "GSX-S1000F", 2019, "DK", "local")

    def test_invalid_extension_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            file = Path(tmp) / "manual.txt"
            file.write_text("not a PDF")
            with self.assertRaises(ValueError):
                ingest(file, Path(tmp) / "out.json", "Suzuki", "GSX-S1000F", 2019, "DK", "local")

    def test_permission_note_required(self):
        with tempfile.TemporaryDirectory() as tmp:
            file = Path(tmp) / "manual.pdf"
            file.write_bytes(b"%PDF-1.4\n")
            with self.assertRaises(ValueError):
                ingest(file, Path(tmp) / "out.json", "Suzuki", "GSX-S1000F", 2019, "DK", "")

if __name__ == "__main__":
    unittest.main()
