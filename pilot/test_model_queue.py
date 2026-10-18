import threading
import time
import unittest
from model_queue import ModelQueue

class QueueTests(unittest.TestCase):
    def test_immediate_acquire_release(self):
        q=ModelQueue(1,0.1)
        self.assertEqual(q.acquire(),"ready")
        q.release()
        self.assertEqual(q.acquire(),"ready")
        q.release()
    def test_waiting_request_succeeds(self):
        q=ModelQueue(1,1)
        self.assertEqual(q.acquire(),"ready")
        result=[]
        started=threading.Event()
        def waiter():
            started.set()
            outcome=q.acquire()
            result.append(outcome)
            if outcome=="ready":q.release()
        t=threading.Thread(target=waiter)
        t.start();started.wait(1);time.sleep(0.08)
        q.release();t.join(2)
        self.assertEqual(result,["ready"])
    def test_queue_full_and_timeout(self):
        q=ModelQueue(1,0.2)
        self.assertEqual(q.acquire(),"ready")
        first=[]
        t=threading.Thread(target=lambda:first.append(q.acquire()))
        t.start();time.sleep(0.08)
        self.assertEqual(q.acquire(),"full")
        t.join(2)
        self.assertEqual(first,["timeout"])
        q.release()
        self.assertEqual(q.acquire(),"ready")
        q.release()
    def test_no_waiting_capacity(self):
        q=ModelQueue(0,0)
        self.assertEqual(q.acquire(),"ready")
        self.assertEqual(q.acquire(),"full")
        q.release()
if __name__=="__main__":unittest.main()
