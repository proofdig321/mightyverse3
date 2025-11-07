PY=python
PIP=pip

.PHONY: install test run docker-build

install:
	$(PY) -m pip install --upgrade pip
	$(PIP) install -r requirements.txt

test:
	$(PY) -m pytest -q tests

run:
	uvicorn agents-stubs.service.app:app --reload --port 8000

docker-build:
	docker build -t themightyverse/agents-stubs -f Dockerfile .
PYTHON=.venv/bin/python
PIP=.venv/bin/pip

venv:
	python -m venv .venv
	. .venv/bin/activate && $(PIP) install -U pip

install: venv
	. .venv/bin/activate && $(PIP) install -r agents-stubs/requirements.txt

install-ml: venv
	. .venv/bin/activate && $(PIP) install -r agents-stubs/requirements-ml.txt

test:
	. .venv/bin/activate && pytest -q agents-stubs/tests

run-service:
	. .venv/bin/activate && uvicorn agents-stubs.service.app:app --reload --port 8000

pin-list:
	python agents-stubs/cli_pin_retry.py --list

pin-retry:
	python agents-stubs/cli_pin_retry.py --retry

notify:
	python agents-stubs/cli_pin_notify.py

.PHONY: venv install install-ml test run-service pin-list pin-retry notify
