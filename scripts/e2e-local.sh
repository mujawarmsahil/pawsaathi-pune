#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  echo "Create .env from .env.example and configure the local MySQL connection first." >&2
  exit 1
fi

set -a
. ./.env
set +a

if [[ "${SPRING_PROFILES_ACTIVE:-dev}" == "prod" ]]; then
  echo "The local E2E seed is forbidden in the production profile." >&2
  exit 1
fi
if [[ "${DB_URL:-}" != *"/pawsaathi_pune_phase0"* ]]; then
  echo "The local E2E seed is restricted to the pawsaathi_pune_phase0 scratch database." >&2
  exit 1
fi

ready=0
for _ in $(seq 1 30); do
  if curl -fsS --max-time 2 http://127.0.0.1:8080/actuator/health/readiness >/dev/null; then
    ready=1
    break
  fi
  sleep 2
done
if [[ "$ready" != 1 ]]; then
  echo "Backend readiness failed. Start it with Java 21 and mvn spring-boot:run." >&2
  exit 1
fi

MYSQL_PWD="${DB_PASSWORD:?Set DB_PASSWORD in .env}" mysql --protocol=tcp \
  -h 127.0.0.1 -u "${DB_USERNAME:?Set DB_USERNAME in .env}" pawsaathi_pune_phase0 \
  < backend/src/test/resources/phase0-e2e-seed.sql

cd frontend
npm run test:e2e
