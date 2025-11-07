#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../" && pwd)"
echo "Starting integration Postgres via docker-compose..."

docker-compose -f "$ROOT_DIR/docker-compose.integration.yml" up -d

echo "Waiting for Postgres to become healthy..."
docker run --rm --network host alpine/sh -c 'sleep 1' || true

# Wait loop using pg_isready via docker exec
for i in $(seq 1 60); do
  if docker exec $(docker-compose -f "$ROOT_DIR/docker-compose.integration.yml" ps -q postgres) pg_isready -U mv_user -d mightyverse_test >/dev/null 2>&1; then
    echo "Postgres is ready"
    break
  fi
  echo "Waiting... ($i)"
  sleep 1
done

echo "Applying migrations inside container..."
CONTAINER_ID=$(docker-compose -f "$ROOT_DIR/docker-compose.integration.yml" ps -q postgres)
if [ -z "$CONTAINER_ID" ]; then
  echo "Postgres container not found"
  exit 1
fi

# Apply all .sql files in /migrations
for f in /migrations/*.sql; do
  echo "Applying $f"
  docker exec -i $CONTAINER_ID psql -U mv_user -d mightyverse_test -f "$f"
done

echo "Migrations applied. To run integration tests set DATABASE_URL=postgres://mv_user:mv_pass@localhost:5433/mightyverse_test and run 'npm run test:integration'"
