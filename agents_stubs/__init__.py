"""Compatibility package to expose agents-stubs content as `agents_stubs`.

This package proxies to the `agents-stubs/` directory so tests can import
`agents_stubs.service.app` even though the directory name contains a dash.
"""
from importlib import util
import sys
import os

# Expose cli_pin_retry and other top-level helpers by loading them lazily
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "agents-stubs"))
# Allow normal package-style imports to find modules in the `agents-stubs` dir.
# This makes `import agents_stubs.vibe` work by adding the real source dir to
# the package `__path__` used by the import machinery.
__path__ = [ROOT]


def _load(name, relpath):
	path = os.path.join(ROOT, relpath)
	spec = util.spec_from_file_location(f"agents_stubs.{name}", path)
	mod = util.module_from_spec(spec)
	spec.loader.exec_module(mod)
	# register so `import agents_stubs.<name>` works
	sys.modules[f"agents_stubs.{name}"] = mod
	return mod


__all__ = ["service", "utils", "cli_pin_retry", "cli_pin_notify"]

# lazy loader attributes
cli_pin_retry = _load("cli_pin_retry", "cli_pin_retry.py")
cli_pin_notify = _load("cli_pin_notify", "cli_pin_notify.py")


def __getattr__(name: str):
	"""Lazy-load modules from the `agents-stubs` directory on first access.

	This allows `import agents_stubs.vibe` to work even though the real
	code lives in a directory named `agents-stubs` (with a dash).
	"""
	# already loaded
	if name in sys.modules:
		return sys.modules[name]

	# try loading a single-file module: <ROOT>/<name>.py
	candidate = os.path.join(ROOT, f"{name}.py")
	if os.path.exists(candidate):
		return _load(name, f"{name}.py")

	# try loading a package directory: <ROOT>/<name>/__init__.py
	pkg_dir = os.path.join(ROOT, name)
	init_py = os.path.join(pkg_dir, "__init__.py")
	if os.path.isdir(pkg_dir) and os.path.exists(init_py):
		spec = util.spec_from_file_location(f"agents_stubs.{name}", init_py)
		mod = util.module_from_spec(spec)
		spec.loader.exec_module(mod)
		sys.modules[f"agents_stubs.{name}"] = mod
		return mod

	raise AttributeError(f"module agents_stubs has no attribute {name!r}")


def __dir__():
	# help tooling discover available modules (files under agents-stubs)
	entries = []
	try:
		for fn in os.listdir(ROOT):
			if fn.endswith('.py'):
				entries.append(fn[:-3])
			elif os.path.isdir(os.path.join(ROOT, fn)):
				entries.append(fn)
	except Exception:
		pass
	return sorted(set(list(globals().keys()) + entries))

