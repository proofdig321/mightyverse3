#!/usr/bin/env python3
"""Notify (create a GitHub issue) if there are pending pin files.

This script is optional and intended for admins. It looks under
/tmp/mighty_pending_pins for .pending.json files and creates a GitHub issue
with a summary if `GH_TOKEN` or `GITHUB_TOKEN` is present and `gh` CLI is
available. If not available, it prints a summary to stdout.
"""
import os
import json
import shutil
import subprocess
import requests
from typing import Optional
import os
import base64

PENDING_DIR = "/tmp/mighty_pending_pins"


def gather_pending():
    items = []
    if not os.path.exists(PENDING_DIR):
        return items
    for fn in os.listdir(PENDING_DIR):
        if not fn.endswith(".pending.json"):
            continue
        path = os.path.join(PENDING_DIR, fn)
        try:
            with open(path, "r") as f:
                data = json.load(f)
            items.append({"file": data.get("file"), "error": data.get("error")})
        except Exception:
            continue
    return items


def create_issue(title: str, body: str) -> bool:
    # Prefer GitHub token API if available
    gh_token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    repo = os.environ.get("GITHUB_REPOSITORY")
    if gh_token and repo:
        try:
            owner_repo = repo
            url = f"https://api.github.com/repos/{owner_repo}/issues"
            # allow optional labels and assignees from env
            labels = os.environ.get("GITHUB_ISSUE_LABELS")
            assignees = os.environ.get("GITHUB_ISSUE_ASSIGNEES")
            payload = {"title": title, "body": body}
            if labels:
                payload["labels"] = [l.strip() for l in labels.split(",") if l.strip()]
            if assignees:
                payload["assignees"] = [a.strip() for a in assignees.split(",") if a.strip()]

            headers = {
                # GitHub accepts 'token' or 'Bearer'; use token for compatibility
                "Authorization": f"token {gh_token}",
                "Accept": "application/vnd.github+json",
            }
            resp = requests.post(url, json=payload, headers=headers, timeout=10)
            return 200 <= resp.status_code < 300
        except Exception:
            return False

    # fallback to gh CLI if present
    if shutil.which("gh"):
        try:
            subprocess.run(["gh", "issue", "create", "--title", title, "--body", body], check=True)
            return True
        except Exception:
            return False

    # otherwise, instruct the user to create manually
    return False


def post_webhook(url: str, text: str) -> bool:
    """Post a simple JSON payload to a webhook (Slack/Discord/incoming).

    Returns True on 2xx response, False otherwise.
    """
    try:
        platform = os.environ.get("WEBHOOK_PLATFORM", "slack").lower()
        if platform == "discord":
            payload = {"content": text}
        elif platform == "slack":
            payload = {"text": text}
        else:
            # generic
            payload = {"text": text}
        resp = requests.post(url, json=payload, timeout=10)
        return 200 <= resp.status_code < 300
    except Exception:
        return False


def main():
    items = gather_pending()
    if not items:
        print("No pending pins found")
        return
    summary = "Found {} pending pins:\n\n".format(len(items))
    for it in items:
        summary += f"- {it['file']}: {it.get('error')}\n"

    title = f"[mighty] {len(items)} pending pin(s) need attention"
    created = create_issue(title, summary)
    webhook = os.environ.get("WEBHOOK_URL")
    if created:
        print("Created issue for pending pins")
        if webhook:
            post_webhook(webhook, title + "\n\n" + summary)
    else:
        # try webhook next
        if webhook and post_webhook(webhook, title + "\n\n" + summary):
            print("Posted pending pins summary to webhook")
            return
        print("Could not create issue automatically. Summary:\n")
        print(summary)


if __name__ == "__main__":
    main()
