"""Proxy CLI module that forwards to agents-stubs/cli.py.

This ensures running `python -m agents.cli` works in CI/local tests.
"""
import os
import sys

# Compute path to agents-stubs directory (one level up from this file)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "agents-stubs"))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# Now import the real cli module from agents-stubs
from cli import main as _real_main


def main():
    return _real_main()


if __name__ == "__main__":
    main()
