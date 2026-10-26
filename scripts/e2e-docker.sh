#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
if [[ -f .env ]]; then
  set -a
  . ./.env
  set +a
fi
if [[ "${SPRING_PROFILES_ACTIVE:-dev}" == "prod" ]]; then
  echo "The Docker E2E seed is forbidden in the production profile." >&2
  exit 1
fi
docker compose up -d --build --wait
trap 'docker compose down' EXIT

docker compose exec -T mysql sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot pawsaathi_pune' \
  < backend/src/test/resources/phase0-e2e-seed.sql

cd frontend
npm run test:e2e
