import sys


def test_pin_using_sdk(monkeypatch):
    # create a fake nft_storage module with a store function
    class FakeSDK:
        @staticmethod
        def store(api_key, obj):
            return {"cid": "bafy_sdk_cid"}

    sys.modules["nft_storage"] = FakeSDK()

    from agents_stubs.utils.pinning import pin_json_with_retries

    cid = pin_json_with_retries({"x": 1}, api_key="FAKE", attempts=1)
    assert cid == "bafy_sdk_cid"
