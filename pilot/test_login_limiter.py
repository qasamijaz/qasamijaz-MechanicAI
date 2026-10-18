import tempfile
import unittest
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from login_limiter import LoginLimiter

class LoginLimiterTests(unittest.TestCase):
    def test_persists_and_resets_per_window(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/"login.sqlite"
            limiter=LoginLimiter(path,max_attempts=2,window_seconds=60)
            self.assertTrue(limiter.reserve(now=120))
            self.assertTrue(LoginLimiter(path,2,60).reserve(now=120))
            self.assertFalse(limiter.reserve(now=120))
            self.assertTrue(limiter.reserve(now=180))
    def test_concurrent_cap(self):
        with tempfile.TemporaryDirectory() as folder:
            limiter=LoginLimiter(Path(folder)/"login.sqlite",max_attempts=5)
            with ThreadPoolExecutor(max_workers=10) as pool:
                allowed=list(pool.map(lambda _:limiter.reserve(now=10000),range(30)))
            self.assertEqual(sum(allowed),5)

if __name__=="__main__":
    unittest.main()
