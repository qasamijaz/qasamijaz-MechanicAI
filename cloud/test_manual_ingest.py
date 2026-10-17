"""Regression checks for manual evidence extraction. Run: python -m unittest cloud.test_manual_ingest"""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from cloud.manual_ingest import ingest_pdf


class ManualIngestSafetyTests(unittest.TestCase):
    def test_missing_file_rejected(self):
        with self.assertRaises(ValueError):
            ingest_pdf("/no/such/manual.pdf")

    def test_wrong_extension_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "manual.txt"
            path.write_text("not a PDF")
            with self.assertRaises(ValueError):
                ingest_pdf(path)

    def test_empty_pdf_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "manual.pdf"
            path.touch()
            with self.assertRaises(ValueError):
                ingest_pdf(path)

    def test_oversized_pdf_rejected_before_parsing(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "manual.pdf"
            with path.open("wb") as stream:
                stream.truncate(25 * 1024 * 1024 + 1)
            with self.assertRaises(ValueError):
                ingest_pdf(path)

    def test_paged_pdf_retains_provenance_without_verification(self):
        try:
            from pypdf import PdfWriter
        except ImportError:
            self.skipTest("pypdf not installed")
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "manual.pdf"
            writer = PdfWriter()
            writer.add_blank_page(width=300, height=400)
            with path.open("wb") as stream:
                writer.write(stream)
            result = ingest_pdf(path)
            self.assertEqual(result["page_count"], 1)
            self.assertFalse(result["manual_identity_verified"])
            self.assertFalse(result["procedure_verified"])
            self.assertFalse(result["pages"][0]["text_available"])
            self.assertIn("#page=1", result["pages"][0]["citation"])


if __name__ == "__main__":
    unittest.main()
