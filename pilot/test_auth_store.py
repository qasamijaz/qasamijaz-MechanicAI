import tempfile
import unittest
from pathlib import Path
from auth_store import Sessions, digest

class SessionTests(unittest.TestCase):
    def test_invite_session_csrf_revoke(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/"pilot.sqlite"
            store=Sessions(path,[digest("test-invite")])
            self.assertIsNone(store.login("wrong"))
            session=store.login("test-invite")
            self.assertIsNotNone(session)
            user=store.verify(session["token"],session["csrf"])
            self.assertEqual(user,digest("test-invite"))
            self.assertIsNone(store.verify(session["token"],"incorrect"))
            self.assertIsNone(store.verify("invalid",session["csrf"]))
            reopened=Sessions(path,[digest("test-invite")])
            self.assertEqual(reopened.verify(session["token"],session["csrf"]),user)
            reopened.revoke(session["token"])
            self.assertIsNone(store.verify(session["token"],session["csrf"]))

    def test_expired_session(self):
        with tempfile.TemporaryDirectory() as directory:
            store=Sessions(Path(directory)/"pilot.sqlite",[digest("code")],ttl_hours=-1)
            session=store.login("code")
            self.assertIsNone(store.verify(session["token"],session["csrf"]))

if __name__=="__main__":
    unittest.main()
