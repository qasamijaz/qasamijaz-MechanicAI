import unittest
from benchmark_local import benchmark,evaluate

class BenchmarkTests(unittest.TestCase):
    def test_heuristics(self):
        case={"must_include_any":["manual"],"unsafe":["30 nm"]}
        self.assertEqual(evaluate("Kontrollér manualen, ikke 30 Nm.",case),
                         {"has_expected_term":True,"has_flagged_phrase":True})
    def test_benchmark_without_model(self):
        def fake(model,prompt):
            return "Tjek manualen.",0.25,{"eval_count":10}
        result=benchmark("fake",[{"domain":"test","prompt":"Hej","must_include_any":["manual"],"unsafe":[]}],fake)
        self.assertEqual(result["successful"],1)
        self.assertEqual(result["median_seconds"],0.25)
        self.assertTrue(result["results"][0]["checks"]["has_expected_term"])
    def test_errors_are_recorded(self):
        def fail(model,prompt):
            raise OSError("not running")
        result=benchmark("fake",[{"domain":"test","prompt":"Hej","must_include_any":[],"unsafe":[]}],fail)
        self.assertEqual(result["successful"],0)
        self.assertEqual(result["results"][0]["error"],"OSError")
if __name__=="__main__":unittest.main()
