import sys
import os

# Ensure workspace root is on sys.path so tests can import the `agents_stubs` proxy package
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)
