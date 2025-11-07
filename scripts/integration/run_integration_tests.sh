#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../" && pwd)"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL not set. If you used docker-compose.integration.yml, set:"
  echo "  export DATABASE_URL=postgres://mv_user:mv_pass@localhost:5433/mightyverse_test"
  exit 2
fi

echo "Running integration tests against $DATABASE_URL"

# run only integration tests
npm run test:integration
