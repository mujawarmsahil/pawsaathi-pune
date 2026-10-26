#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ ! -f "$ROOT_DIR/.env" ]]; then
  echo "Missing .env. Copy .env.example to .env and configure it first." >&2
  exit 1
fi

set -a
. "$ROOT_DIR/.env"
set +a

if [[ -z "${JWT_SECRET:-}" || "${#JWT_SECRET}" -lt 32 ]]; then
  echo "JWT_SECRET in .env must be at least 32 characters." >&2
  exit 1
fi

export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 21 2>/dev/null || true)}"
if [[ -z "${JAVA_HOME:-}" ]]; then
  echo "Java 21 is required. Install it or set JAVA_HOME." >&2
  exit 1
fi

cd "$ROOT_DIR/backend"
exec mvn spring-boot:run
