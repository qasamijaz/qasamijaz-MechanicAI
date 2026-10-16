import unittest
from unittest.mock import patch
from cloud.server import discover_manual

class FakeResponse:
    status = 200
    headers = {"Content-Type":"text/html; charset=utf-8"}
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def read(self, size): return b"<html><body>Gebruikershandleiding GSX-S1000(F) 2019</body></html>"

class DiscoveryTests(unittest.TestCase):
    @patch("cloud.server.urllib.request.urlopen",return_value=FakeResponse())
    def test_catalogue_match(self, fetch):
        result=discover_manual("Suzuki GSX-S1000F 2019 olieskift")
        self.assertEqual(result["status"],"catalogue_match")
        self.assertFalse(result["verified_procedure"])
        fetch.assert_called_once()
    @patch("cloud.server.urllib.request.urlopen")
    def test_wrong_model_fails_closed(self, fetch):
        self.assertEqual(discover_manual("Suzuki GSX-R1000 2019")["status"],"model_unconfirmed")
        fetch.assert_not_called()
    @patch("cloud.server.urllib.request.urlopen",side_effect=OSError("network"))
    def test_network_error_fails_closed(self, fetch):
        self.assertEqual(discover_manual("Suzuki GSX-S1000F 2019")["status"],"source_unavailable")

if __name__=="__main__":
    unittest.main()
