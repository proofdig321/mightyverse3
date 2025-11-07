"""Proxy module file exposing the FastAPI app by loading the original app.py
from the `agents-stubs/service` folder.
"""
import importlib.util
import os
import sys

HERE = os.path.dirname(__file__)
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "agents-stubs"))
APP_PATH = os.path.join(ROOT, "service", "app.py")

spec = importlib.util.spec_from_file_location("agents_stubs.service.app", APP_PATH)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

# ensure it is available under the expected sys.modules key
sys.modules["agents_stubs.service.app"] = module

app = module.app

__all__ = ["app"]
