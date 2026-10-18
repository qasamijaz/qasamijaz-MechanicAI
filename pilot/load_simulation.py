"""Deterministic load simulation for the pilot concurrency gate.

No network or model is used. This estimates queue/rejection behavior of
the current single-model-slot design, not real hardware throughput.
"""
import argparse
import json
import statistics
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier, BoundedSemaphore, Lock
from time import perf_counter, sleep

def simulate(clients=10,service_seconds=0.05,slots=1):
    if not 1<=clients<=1000 or not 0<=service_seconds<=10 or not 1<=slots<=100:
        raise ValueError("Invalid simulation settings")
    gate=Barrier(clients)
    semaphore=BoundedSemaphore(slots)
    lock=Lock()
    rows=[]
    def worker(index):
        gate.wait(timeout=20)
        started=perf_counter()
        accepted=semaphore.acquire(blocking=False)
        if accepted:
            try:
                sleep(service_seconds)
            finally:
                semaphore.release()
        with lock:
            rows.append({"client":index,"accepted":accepted,
                         "elapsed_ms":round((perf_counter()-started)*1000,2)})
    with ThreadPoolExecutor(max_workers=clients) as pool:
        list(pool.map(worker,range(clients)))
    accepted=[row["elapsed_ms"] for row in rows if row["accepted"]]
    return {"clients":clients,"model_slots":slots,
            "accepted":len(accepted),"rejected_busy":clients-len(accepted),
            "acceptance_pct":round(100*len(accepted)/clients,1),
            "mean_accepted_ms":round(statistics.mean(accepted),2) if accepted else None,
            "results":sorted(rows,key=lambda row:row["client"]),
            "warning":"Synthetic contention only. No inference, CPU, RAM, network, or actual end-to-end latency measured."}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--clients",type=int,default=10)
    p.add_argument("--seconds",type=float,default=0.05)
    p.add_argument("--slots",type=int,default=1)
    args=p.parse_args()
    print(json.dumps(simulate(args.clients,args.seconds,args.slots),ensure_ascii=False,indent=2))
if __name__=="__main__":main()
