import tempfile
import unittest
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from quota_store import QuotaStore

class QuotaTests(unittest.TestCase):
    def test_user_and_global_limits_persist(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/"quota.sqlite"
            store=QuotaStore(path,per_user_daily=2,global_daily=3)
            self.assertEqual(store.reserve("a", "2026-10-18"),(True,"ok"))
            self.assertEqual(store.reserve("a", "2026-10-18"),(True,"ok"))
            self.assertEqual(store.reserve("a", "2026-10-18"),(False,"quota_exceeded"))
            again=QuotaStore(path,per_user_daily=2,global_daily=3)
            self.assertEqual(again.reserve("b","2026-10-18"),(True,"ok"))
            self.assertEqual(again.reserve("c","2026-10-18"),(False,"quota_exceeded"))
            self.assertEqual(again.reserve("a","2026-10-19"),(True,"ok"))

    def test_concurrent_reservations_do_not_exceed_ceiling(self):
        with tempfile.TemporaryDirectory() as d:
            store=QuotaStore(Path(d)/"quota.sqlite",per_user_daily=100,global_daily=7)
            with ThreadPoolExecutor(max_workers=12) as pool:
                results=list(pool.map(lambda i:store.reserve("user-"+str(i),"2026-10-18"),range(40)))
            self.assertEqual(sum(ok for ok,_ in results),7)
            self.assertEqual(store.usage("2026-10-18"),7)

if __name__=="__main__":
    unittest.main()
