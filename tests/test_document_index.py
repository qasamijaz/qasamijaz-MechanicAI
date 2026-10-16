import unittest
from modules.document_index import search

SAMPLE = {
    "schema_version": 1,
    "document": {"filename": "authorized.pdf", "sha256": "abc"},
    "vehicle": {"manufacturer": "Suzuki", "model": "GSX-S1000F", "year": 2019, "market": "DK", "fitment_verified": False},
    "extraction": {"headings": ["# Oil pan and oil pump", "# Electrical system"],
                   "candidate_part_numbers": ["09247-14036"], "manual_review_required": True}
}

class IndexSearchTests(unittest.TestCase):
    def test_matches_heading(self):
        results = search([SAMPLE], "oil pump", manufacturer="Suzuki", model="GSX-S1000F", year=2019)
        self.assertEqual(results[0]["type"], "heading")
        self.assertFalse(results[0]["procedure_verified"])
        self.assertIsNone(results[0]["page"])
    def test_matches_part_number_as_candidate(self):
        results = search([SAMPLE], "09247-14036", manufacturer="Suzuki", model="GSX-S1000F", year=2019)
        self.assertEqual(results[0]["type"], "candidate_part_number")
        self.assertFalse(results[0]["fitment_verified"])
    def test_blocks_wrong_year(self):
        self.assertEqual(search([SAMPLE], "oil", manufacturer="Suzuki", model="GSX-S1000F", year=2021), [])
    def test_blocks_wrong_model(self):
        self.assertEqual(search([SAMPLE], "oil", manufacturer="Suzuki", model="GSX-S1000", year=2019), [])
    def test_blocks_wrong_market(self):
        self.assertEqual(search([SAMPLE], "oil", manufacturer="Suzuki", model="GSX-S1000F", year=2019, market="US"), [])
    def test_empty_query(self):
        self.assertEqual(search([SAMPLE], "", manufacturer="Suzuki", model="GSX-S1000F", year=2019), [])

if __name__ == "__main__":
    unittest.main()
