import json
import tempfile
import threading
import unittest
import urllib.request
import urllib.error
from http.server import HTTPServer
from pathlib import Path
from unittest.mock import patch
import web_server

class WebServerTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        web_server.ORIGIN="https://pilot.example"
        web_server.configure(Path(self.tmp.name),[web_server.Sessions.__module__ and __import__("auth_store").digest("invite-test")],per_user=1,global_limit=1)
        self.http=HTTPServer(("127.0.0.1",0),web_server.Handler)
        self.thread=threading.Thread(target=self.http.serve_forever,daemon=True)
        self.thread.start()
        self.url="http://127.0.0.1:%s"%self.http.server_port
    def tearDown(self):
        self.http.shutdown();self.http.server_close();self.thread.join();self.tmp.cleanup()
    def post(self,path,body,headers=None):
        h={"Origin":"https://pilot.example","Content-Type":"application/json"}
        h.update(headers or {})
        req=urllib.request.Request(self.url+path,json.dumps(body).encode(),headers=h)
        try:
            with urllib.request.urlopen(req,timeout=3) as r:
                return r.status,json.load(r),r.headers
        except urllib.error.HTTPError as e:
            return e.code,json.load(e),e.headers
    @patch.object(web_server,"inference",return_value="Hej")
    def test_login_chat_quota_logout(self,model):
        self.assertEqual(self.post("/v1/login",{"invite":"wrong"})[0],401)
        status,body,headers=self.post("/v1/login",{"invite":"invite-test"})
        self.assertEqual(status,200)
        cookie=headers["Set-Cookie"].split(";",1)[0]
        h={"Cookie":cookie,"X-CSRF-Token":body["csrf"]}
        self.assertEqual(self.post("/v1/chat",{"messages":[{"role":"user","content":"Hej"}]},h)[0],200)
        self.assertEqual(self.post("/v1/chat",{"messages":[{"role":"user","content":"Hej"}]},h)[0],429)
        self.assertEqual(model.call_count,1)
        self.assertEqual(self.post("/v1/logout",{},h)[0],200)
        self.assertEqual(self.post("/v1/chat",{"messages":[{"role":"user","content":"Hej"}]},h)[0],401)
    @patch.object(web_server,"inference")
    def test_origin_and_csrf_fail_closed(self,model):
        self.assertEqual(self.post("/v1/login",{"invite":"invite-test"},{"Origin":"https://evil.example"})[0],403)
        _,body,headers=self.post("/v1/login",{"invite":"invite-test"})
        h={"Cookie":headers["Set-Cookie"].split(";",1)[0],"X-CSRF-Token":"wrong"}
        self.assertEqual(self.post("/v1/chat",{"messages":[{"role":"user","content":"Hej"}]},h)[0],401)
        model.assert_not_called()

if __name__=="__main__":unittest.main()
