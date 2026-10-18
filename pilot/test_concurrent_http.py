"""Concurrent HTTP integration tests for the bounded model queue."""
import json
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch
from auth_store import digest
import web_server
from model_queue import ModelQueue

class ConcurrentHTTPTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        web_server.ORIGIN="https://pilot.example"
        web_server.configure(Path(self.tmp.name),[digest("invited")],per_user=10,global_limit=20)
        self.old_queue=web_server.MODEL_QUEUE
        web_server.MODEL_QUEUE=ModelQueue(max_waiters=1,wait_seconds=0.15)
        self.server=ThreadingHTTPServer(("127.0.0.1",0),web_server.Handler)
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True)
        self.thread.start()
        self.base="http://127.0.0.1:"+str(self.server.server_port)
        status,data,headers=self.post("/v1/login",{"invite":"invited"})
        self.assertEqual(status,200)
        self.auth={"Cookie":headers["Set-Cookie"].split(";",1)[0],"X-CSRF-Token":data["csrf"]}
    def tearDown(self):
        self.server.shutdown();self.server.server_close();self.thread.join()
        web_server.MODEL_QUEUE=self.old_queue
        self.tmp.cleanup()
    def post(self,path,data,headers=None):
        h={"Origin":"https://pilot.example","Content-Type":"application/json"}
        h.update(headers or {})
        request=urllib.request.Request(self.base+path,data=json.dumps(data).encode(),headers=h,method="POST")
        try:
            with urllib.request.urlopen(request,timeout=4) as response:
                return response.status,json.load(response),response.headers
        except urllib.error.HTTPError as error:
            return error.code,json.load(error),error.headers
    def question(self):
        return self.post("/v1/chat",{"messages":[{"role":"user","content":"Hej"}]},self.auth)
    def test_queue_timeout_does_not_charge_quota(self):
        entered=threading.Event()
        release=threading.Event()
        def slow_model(messages):
            entered.set()
            release.wait(timeout=3)
            return "Kontrollér manualen."
        with patch.object(web_server,"inference",side_effect=slow_model) as model:
            results=[]
            worker=threading.Thread(target=lambda:results.append(self.question()))
            worker.start()
            self.assertTrue(entered.wait(timeout=2))
            try:
                # First slot remains occupied longer than the waiting timeout.
                status,body,_=self.question()
                self.assertEqual(status,429)
                self.assertEqual(body["error"],"Model wait timeout")
                self.assertEqual(web_server.QUOTAS.usage(),1)
            finally:
                release.set()
                worker.join(timeout=3)
            self.assertFalse(worker.is_alive())
            self.assertEqual(results[0][0],200)
            self.assertEqual(model.call_count,1)
            self.assertEqual(self.question()[0],200)
            self.assertEqual(web_server.QUOTAS.usage(),2)
    def test_full_queue_rejects_third_request(self):
        entered=threading.Event()
        release=threading.Event()
        def slow_model(messages):
            entered.set()
            release.wait(timeout=3)
            return "OK"
        with patch.object(web_server,"inference",side_effect=slow_model):
            first=threading.Thread(target=self.question)
            first.start()
            self.assertTrue(entered.wait(timeout=2))
            # Reserve the only waiting position via queue directly to
            # avoid timing-dependent assumptions about HTTP scheduling.
            waiting_started=threading.Event()
            waiting_result=[]
            def waiter():
                waiting_started.set()
                outcome=web_server.MODEL_QUEUE.acquire()
                waiting_result.append(outcome)
                if outcome=="ready":web_server.MODEL_QUEUE.release()
            second=threading.Thread(target=waiter)
            second.start();waiting_started.wait(1)
            time.sleep(0.04)
            try:
                status,body,_=self.question()
                self.assertEqual(status,429)
                self.assertEqual(body["error"],"Model queue full")
                self.assertEqual(web_server.QUOTAS.usage(),1)
            finally:
                release.set()
                first.join(3);second.join(3)
            self.assertFalse(first.is_alive())
            self.assertFalse(second.is_alive())
            self.assertEqual(waiting_result,["ready"])
if __name__=="__main__":unittest.main()
