"""Robust pinning helpers for nft.storage with retries.

This module uses a small retry/backoff loop to tolerate transient network errors.
"""
from typing import Dict, Any, Optional
import time
import requests


def pin_json_with_retries(obj: Dict[str, Any], api_key: str, attempts: int = 3, backoff: float = 0.5) -> Optional[str]:
    """Pin JSON to nft.storage with simple retries. Returns CID string or raises.

    Note: this intentionally uses requests to avoid adding heavy SDK dependencies.
    """
    url = "https://api.nft.storage/store"
    headers = {"Authorization": f"Bearer {api_key}"}
    last_exc = None
    # Prefer SDK if available
    try:
        import nft_storage as _nft_sdk  # optional third-party SDK

        # convention: SDK exposes `store` or `upload` that accepts (api_key, obj)
        if hasattr(_nft_sdk, "store"):
            val = _nft_sdk.store(api_key, obj)
        elif hasattr(_nft_sdk, "upload"):
            val = _nft_sdk.upload(api_key, obj)
        else:
            val = None
        # if SDK returned a string or dict with cid, normalize
        if isinstance(val, str):
            return val
        if isinstance(val, dict):
            return val.get("cid") or val.get("value")
    except Exception:
        # SDK not available or failed; fall back to HTTP approach
        pass

    for i in range(attempts):
        start = time.time()
        try:
            resp = requests.post(url, json=obj, headers=headers, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            value = data.get("value", {})
            cid_field = value.get("cid")
            cid = None
            if isinstance(cid_field, dict):
                cid = cid_field.get("/") or cid_field.get("value")
            elif isinstance(cid_field, str):
                cid = cid_field
            if not cid:
                cid = value.get("/") or data.get("cid")
            duration = time.time() - start
            try:
                import logging

                logging.getLogger("mighty.pinning").info("pin_json successful cid=%s duration=%.3f", cid, duration)
            except Exception:
                pass
            return cid
        except Exception as e:
            last_exc = e
            # exponential backoff
            time.sleep(backoff * (2 ** i))
    # if we reach here, all attempts failed
    raise last_exc


def pin_file_with_retries(file_path: str, api_key: str, attempts: int = 3, backoff: float = 0.5) -> Optional[str]:
    """Pin a local file to nft.storage using multipart upload with retries.

    Returns the CID string on success or raises the last exception on failure.
    """
    url = "https://api.nft.storage/upload"
    headers = {"Authorization": f"Bearer {api_key}"}
    last_exc = None

    # Prefer SDK if available
    try:
        import nft_storage as _nft_sdk

        if hasattr(_nft_sdk, "upload"):
            # SDK upload(file_path) or upload(api_key, file)
            try:
                val = _nft_sdk.upload(file_path)
            except TypeError:
                val = _nft_sdk.upload(api_key, file_path)
            if isinstance(val, str):
                return val
            if isinstance(val, dict):
                return val.get("cid") or val.get("value")
    except Exception:
        pass

    for i in range(attempts):
        start = time.time()
        try:
            with open(file_path, "rb") as fh:
                files = {"file": fh}
                resp = requests.post(url, files=files, headers=headers, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            value = data.get("value", {})
            cid_field = value.get("cid")
            cid = None
            if isinstance(cid_field, dict):
                cid = cid_field.get("/") or cid_field.get("value")
            elif isinstance(cid_field, str):
                cid = cid_field
            if not cid:
                cid = value.get("/") or data.get("cid")
            duration = time.time() - start
            try:
                import logging

                logging.getLogger("mighty.pinning").info("pin_file successful cid=%s file=%s duration=%.3f", cid, file_path, duration)
            except Exception:
                pass
            return cid
        except Exception as e:
            last_exc = e
            # write a pending manifest entry on final failure
            if i == attempts - 1:
                try:
                    import json
                    pm = {
                        "file": file_path,
                        "error": str(e),
                        "attempts": attempts,
                    }
                    pending_dir = "/tmp/mighty_pending_pins"
                    import os

                    os.makedirs(pending_dir, exist_ok=True)
                    fname = os.path.join(pending_dir, os.path.basename(file_path) + ".pending.json")
                    with open(fname, "w") as wf:
                        json.dump(pm, wf)
                except Exception:
                    pass
            time.sleep(backoff * (2 ** i))

    raise last_exc
