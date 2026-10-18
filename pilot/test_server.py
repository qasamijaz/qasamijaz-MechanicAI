import unittest
from unittest.mock import patch
from io import BytesIO
from http.server import HTTPServer
import threading
import json
import urllib.request
import urllib.error
import server

class GatewayTests(unittest.TestCase):
    def setUp(self):
        server.KEY = "a" * 32
        server.ORIGIN = "https://pilot.example"
        server.BUDGET = server.Budget(server.Limits(requests_per_session=2))
        self.http = HTTPServer(("127.0.0.1", 0), server.Handler)
        self.thread = threading.Thread(target=self.http.serve_forever, daemon=True)
        self.thread.start()
        self.url = "http://127.0.0.1:%s/v1/chat" % self.http.server_port

    def tearDown(self):
        self.http.shutdown()
        self.http.server_close()
        self.thread.join()

    def post(self, origin="https://pilot.example", key="a"*32, session="session-123"):
        req = urllib.request.Request(self.url, data=json.dumps({"messages":[{"role":"user","content":"hej"}]}).encode(),
            headers={"Origin":origin,"X-Pilot-Key":key,"X-Pilot-Session":session,"Content-Type":"application/json"})
        try:
            with urllib.request.urlopen(req, timeout=3) as r:
                return r.status, json.load(r)
        except urllib.error.HTTPError as e:
            return e.code, json.load(e)

    @patch.object(server, "infer", return_value="Hej!")
    def test_authenticated_local_inference(self, mocked):
        self.assertEqual(self.post()[0], 200)
        self.assertEqual(self.post()[0], 200)
        self.assertEqual(self.post()[0], 429)
        self.assertEqual(mocked.call_count, 2)

    @patch.object(server, "infer")
    def test_denied_requests_never_call_model(self, mocked):
        self.assertEqual(self.post(origin="https://evil.example")[0], 403)
        self.assertEqual(self.post(key="wrong")[0], 401)
        mocked.assert_not_called()

if __name__=="__main__":
    unittest.main()
