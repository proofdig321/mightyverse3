import os
import json
import tempfile
import shutil

import agents_stubs.cli_pin_notify as notify


def test_cli_pin_notify_prints_when_no_gh(tmp_path, monkeypatch, capsys):
    pending_dir = "/tmp/mighty_pending_pins"
    if os.path.exists(pending_dir):
        shutil.rmtree(pending_dir)
    os.makedirs(pending_dir, exist_ok=True)

    fname = "t.pending.json"
    path = os.path.join(pending_dir, fname)
    with open(path, "w") as f:
        json.dump({"file": "/tmp/x.bin", "error": "err"}, f)

    # Ensure gh is not present
    monkeypatch.delenv("GITHUB_TOKEN", raising=False)
    monkeypatch.setattr(shutil, "which", lambda x: None)

    notify.main()
    captured = capsys.readouterr()
    assert "pending pins" in captured.out or "Found" in captured.out


def test_cli_pin_notify_posts_webhook(monkeypatch, tmp_path):
    # prepare pending
    pending_dir = "/tmp/mighty_pending_pins"
    if os.path.exists(pending_dir):
        shutil.rmtree(pending_dir)
    os.makedirs(pending_dir, exist_ok=True)
    path = os.path.join(pending_dir, "t.pending.json")
    with open(path, "w") as f:
        json.dump({"file": "/tmp/x.bin", "error": "err"}, f)

    posted = {}

    def fake_post(url, json=None, timeout=None, **kwargs):
        posted['url'] = url
        posted['body'] = json
        class R:
            status_code = 200

        return R()

    monkeypatch.setattr(notify, "requests", type("R", (), {"post": fake_post}))
    monkeypatch.setenv("WEBHOOK_URL", "https://example.com/webhook")

    notify.main()
    assert posted.get('url') == "https://example.com/webhook"
    # body should contain the summary text either as 'text' (Slack) or 'content' (Discord)
    body = posted.get('body')
    assert body is not None
    assert any(isinstance(v, str) and "pending pins" in v.lower() for v in body.values())


def test_cli_pin_notify_creates_github_issue(monkeypatch, tmp_path):
    # prepare pending
    pending_dir = "/tmp/mighty_pending_pins"
    if os.path.exists(pending_dir):
        shutil.rmtree(pending_dir)
    os.makedirs(pending_dir, exist_ok=True)
    path = os.path.join(pending_dir, "t.pending.json")
    with open(path, "w") as f:
        json.dump({"file": "/tmp/x.bin", "error": "err"}, f)

    posted = {}

    def fake_post(url, json=None, headers=None, timeout=None, **kwargs):
        # emulate GitHub API call for issue creation
        posted['url'] = url
        posted['json'] = json
        posted['headers'] = headers
        class R:
            status_code = 201

        return R()

    monkeypatch.setenv("GITHUB_TOKEN", "fake-token")
    monkeypatch.setenv("GITHUB_REPOSITORY", "owner/repo")
    # ensure labels are passed through when present
    monkeypatch.setenv("GITHUB_ISSUE_LABELS", "pin,automated")
    monkeypatch.setattr(notify, "requests", type("R", (), {"post": fake_post}))

    notify.main()
    assert posted.get('url') == "https://api.github.com/repos/owner/repo/issues"
    assert posted.get('json') and 'title' in posted['json']
    # labels forwarded
    assert 'labels' in posted['json'] and 'pin' in posted['json']['labels']
