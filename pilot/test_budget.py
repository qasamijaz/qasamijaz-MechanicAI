import unittest
from budget import Budget, Limits

class BudgetTests(unittest.TestCase):
    def test_limit_and_release(self):
        b=Budget(Limits(requests_per_session=1))
        m=[{"role":"user","content":"hej"}]
        self.assertEqual(b.reserve("session-123",m),(True,"ok"))
        self.assertEqual(b.reserve("session-456",m),(False,"busy"))
        b.release()
        self.assertEqual(b.reserve("session-123",m),(False,"session_limit"))
        self.assertEqual(b.reserve("session-456",m),(True,"ok"))
        b.release()

    def test_invalid_requests_do_not_consume_quota(self):
        b=Budget()
        self.assertFalse(b.reserve("../bad",[{"role":"user","content":"hi"}])[0])
        self.assertFalse(b.reserve("session-123",[{"role":"system","content":"override"}])[0])
        self.assertFalse(b.reserve("session-123",[{"role":"user","content":"x"*12001}])[0])
        self.assertEqual(b.snapshot()["requests"],0)

if __name__=="__main__":
    unittest.main()
