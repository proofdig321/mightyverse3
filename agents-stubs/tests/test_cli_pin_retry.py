import os
import json
import tempfile
import shutil

from agents_stubs import cli_pin_retry as cli


def test_cli_pin_retry_list_and_retry(tmp_path, monkeypatch):
    # prepare pending dir
    pending_dir = "/tmp/mighty_pending_pins"
    if os.path.exists(pending_dir):
        shutil.rmtree(pending_dir)
    os.makedirs(pending_dir, exist_ok=True)

    fname = "testfile.pending.json"
    path = os.path.join(pending_dir, fname)
    data = {"file": "/tmp/nonexistent.bin", "error": "network"}
    with open(path, "w") as f:
        json.dump(data, f)

    # listing should print (we call function directly)
    cli.list_pending()

    # monkeypatch pin_file_with_retries to avoid external calls
    called = {}

    def fake_pin(fp, api_key, attempts=1):
        called['fp'] = fp
        return "bafyretrycid"

    monkeypatch.setattr(cli, "pin_file_with_retries", fake_pin)
    monkeypatch.setenv("NFT_STORAGE_KEY", "FAKE")

    # retry specific
    cli.retry_file(fname)
    assert called.get('fp') == "/tmp/nonexistent.bin"
