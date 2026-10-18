import unittest
from load_simulation import simulate

class LoadSimulationTests(unittest.TestCase):
    def test_single_slot_rejects_concurrent_requests(self):
        result=simulate(clients=12,service_seconds=0.15,slots=1)
        self.assertEqual(result["accepted"],1)
        self.assertEqual(result["rejected_busy"],11)
    def test_multiple_slots(self):
        result=simulate(clients=12,service_seconds=0.15,slots=3)
        self.assertEqual(result["accepted"],3)
        self.assertEqual(result["rejected_busy"],9)
    def test_invalid_inputs(self):
        with self.assertRaises(ValueError):
            simulate(clients=0)
        with self.assertRaises(ValueError):
            simulate(slots=0)
if __name__=="__main__":unittest.main()
