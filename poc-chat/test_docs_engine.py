import unittest
from docs_engine import identify, discover

class DocumentationTests(unittest.TestCase):
    def msgs(self, text): return [{"role": "user", "content": text}]
    def test_exact_2021_is_not_2019(self):
        events = []
        result = discover(self.msgs("Suzuki GSX-S1000F 2021 bundprop"), events.append)
        self.assertEqual(result["status"], "no_exact_match")
        self.assertFalse(result["procedure_verified"])
        self.assertFalse(result["sources"])
        self.assertEqual(events[-1]["details"]["reason"], "no_exact_year_source")
    def test_gsx_r_does_not_match(self):
        events=[]
        result=discover(self.msgs("Suzuki GSX-R1000 2019"),events.append)
        self.assertEqual(result["status"],"needs_identity")
    def test_ambiguous_year(self):
        result=identify(self.msgs("Suzuki GSX-S1000F 2019 registreret 2021"))
        self.assertFalse(result["confirmed"])
    def test_unknown_product_is_not_implicitly_verified(self):
        events=[]
        result=discover(self.msgs("Jeg vil bygge havehegn"),events.append)
        self.assertEqual(result["status"],"unsupported")
    def test_matching_does_not_claim_manual_verified(self):
        events=[]
        result=discover(self.msgs("Suzuki GSX-S1000F 2019"),events.append)
        self.assertFalse(result["manual_verified"])
        self.assertFalse(result["procedure_verified"])
if __name__=="__main__": unittest.main()
