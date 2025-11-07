"""Proxy to expose the pinning helper located in the dashed folder.

This module loads the implementation from `agents-stubs/utils/pinning.py` and
re-exports `pin_json_with_retries` for tests and runtime.
"""
import importlib.util
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "agents-stubs"))
SRC = os.path.join(ROOT, "utils", "pinning.py")

spec = importlib.util.spec_from_file_location("agents_stubs.utils.pinning", SRC)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

pin_json_with_retries = getattr(mod, "pin_json_with_retries")
pin_file_with_retries = getattr(mod, "pin_file_with_retries", None)

__all__ = ["pin_json_with_retries", "pin_file_with_retries"]
