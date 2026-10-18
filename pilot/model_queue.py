"""Bounded in-process FIFO-free model admission.

Limits concurrent inference and waiting requests. Intended for one
pilot process, not a distributed deployment. No background tasks.
"""
import threading

class ModelQueue:
    def __init__(self,max_waiters=3,wait_seconds=8):
        if not 0<=max_waiters<=100 or not 0<=wait_seconds<=120:
            raise ValueError("Invalid queue settings")
        self.max_waiters=max_waiters
        self.wait_seconds=wait_seconds
        self.model=threading.Lock()
        self.waiting=threading.BoundedSemaphore(max_waiters) if max_waiters else None

    def acquire(self):
        if self.model.acquire(blocking=False):
            return "ready"
        if self.waiting is None or not self.waiting.acquire(blocking=False):
            return "full"
        try:
            if self.model.acquire(timeout=self.wait_seconds):
                return "ready"
            return "timeout"
        finally:
            self.waiting.release()

    def release(self):
        self.model.release()
