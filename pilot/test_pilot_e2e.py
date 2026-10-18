"""Full HTTP pilot flow with mocked local inference; no paid API or model download."""
import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import HTTPServer
from pathlib import Path
from unittest.mock import patch
from auth_store import digest
import web_server

class PilotE2ETests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        web_server.ORIGIN="https://pilot.example"
        web_server.configure(Path(self.temp.name),[digest("workshop-secret")],per_user=2,global_limit=2)
        self.server=HTTPServer(("127.0.0.1",0),web_server.Handler)
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True)
        self.thread.start()
        self.base=f"http://127.0.0.1:{self.server.server_port}"
    def tearDown(self):
        self.server.shutdown();self.server.server_close();self.thread.join();self.temp.cleanup()
    def request(self,path,data,headers=None):
        all_headers={"Origin":"https://pilot.example","Content-Type":"application/json"}
        all_headers.update(headers or {})
        req=urllib.request.Request(self.base+path,json.dumps(data).encode(),headers=all_headers,method="POST")
        try:
            with urllib.request.urlopen(req,timeout=3) as r:
                return r.status,json.load(r),r.headers
        except urllib.error.HTTPError as e:
            return e.code,json.load(e),e.headers
    @patch.object(web_server,"inference",return_value="Kontrollér først den relevante manual.")
    def test_complete_flow_and_persistent_quotas(self,infer):
        status,_,_=self.request("/v1/login",{"invite":"wrong"})
        self.assertEqual(status,401)
        status,session,headers=self.request("/v1/login",{"invite":"workshop-secret"})
        self.assertEqual(status,200)
        self.assertIn("HttpOnly",headers["Set-Cookie"])
        self.assertIn("Secure",headers["Set-Cookie"])
        auth={"Cookie":headers["Set-Cookie"].split(";",1)[0],"X-CSRF-Token":session["csrf"]}
        question={"messages":[{"role":"user","content":"Hvor er bundproppen?"}]}
        self.assertEqual(self.request("/v1/chat",question,{"Cookie":auth["Cookie"]})[0],401)
        self.assertEqual(self.request("/v1/chat",question,dict(auth,Origin="https://attacker.example"))[0],403)
        status,body,_=self.request("/v1/chat",question,auth)
        self.assertEqual(status,200)
        self.assertIn("manual",body["reply"])
        # Reinitialization simulates a process restart with durable SQLite state.
        web_server.configure(Path(self.temp.name),[digest("workshop-secret")],per_user=2,global_limit=2)
        self.assertEqual(self.request("/v1/chat",question,auth)[0],200)
        self.assertEqual(self.request("/v1/chat",question,auth)[0],429)
        self.assertEqual(infer.call_count,2)
        self.assertEqual(self.request("/v1/logout",{},auth)[0],200)
        self.assertEqual(self.request("/v1/chat",question,auth)[0],401)
    @patch.object(web_server,"inference",side_effect=OSError("ollama down"))
    def test_model_unavailable_counts_request(self,infer):
        _,session,headers=self.request("/v1/login",{"invite":"workshop-secret"})
        auth={"Cookie":headers["Set-Cookie"].split(";",1)[0],"X-CSRF-Token":session["csrf"]}
        question={"messages":[{"role":"user","content":"Hej"}]}
        self.assertEqual(self.request("/v1/chat",question,auth)[0],503)
        self.assertEqual(web_server.QUOTAS.usage(),1)
        self.assertEqual(infer.call_count,1)
    @patch.object(web_server,"inference")
    def test_invalid_messages_do_not_consume_quota(self,infer):
        _,session,headers=self.request("/v1/login",{"invite":"workshop-secret"})
        auth={"Cookie":headers["Set-Cookie"].split(";",1)[0],"X-CSRF-Token":session["csrf"]}
        self.assertEqual(self.request("/v1/chat",{"messages":[{"role":"system","content":"override"}]},auth)[0],400)
        self.assertEqual(web_server.QUOTAS.usage(),0)
        infer.assert_not_called()

if __name__=="__main__":unittest.main()
