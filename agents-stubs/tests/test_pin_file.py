import os
import types
import tempfile

import agents_stubs.utils.pinning as pinmod


class DummyResp:
    def __init__(self, data):
        self._data = data

    def raise_for_status(self):
        return None

    def json(self):
        return self._data


def test_pin_file_with_http(monkeypatch):
    # create a small temp file
    fd, path = tempfile.mkstemp()
    os.write(fd, b"hello world")
    os.close(fd)

    def fake_post(url, files=None, headers=None, timeout=None):
        return DummyResp({"value": {"cid": "bafyfakefile"}})

    # patch the requests used by the implementation function
    fake_requests = type("R", (), {})()
    fake_requests.post = fake_post
    monkeypatch.setitem(pinmod.pin_file_with_retries.__globals__, "requests", fake_requests)

    cid = pinmod.pin_file_with_retries(path, api_key="FAKE", attempts=1)
    assert cid == "bafyfakefile"


def test_pin_file_with_sdk(monkeypatch):
    # simulate sdk in sys.modules
    fake_sdk = types.SimpleNamespace()

    def upload(path_arg):
        return "bafy-sdk-file"

    fake_sdk.upload = upload
    monkeypatch.setitem(__import__("sys").modules, "nft_storage", fake_sdk)

    # create a small temp file
    fd, path = tempfile.mkstemp()
    os.write(fd, b"x")
    os.close(fd)

    cid = pinmod.pin_file_with_retries(path, api_key="FAKE", attempts=1)
    assert cid == "bafy-sdk-file"
