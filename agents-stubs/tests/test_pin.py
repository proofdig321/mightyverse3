import json
from unittest.mock import patch

from agents.metadata_gen import pin_json_to_nft_storage


def fake_response_ok():
    class R:
        status_code = 200

        def raise_for_status(self):
            return None

        def json(self):
            return {"value": {"cid": "bafyfakecid"}}

    return R()


@patch("agents.metadata_gen.requests.post")
def test_pin_json_success(mock_post):
    mock_post.return_value = fake_response_ok()
    cid = pin_json_to_nft_storage({"x": 1}, api_key="FAKE")
    assert cid == "bafyfakecid"
