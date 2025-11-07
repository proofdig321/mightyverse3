"""Proxy module to load the real FastAPI app from the agents-stubs directory.

This file dynamically loads the module at ../agents-stubs/service/app.py and
exposes it as `agents_stubs.service.app`.
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

# Expose submodule
app = module.app

__all__ = ["app"]


