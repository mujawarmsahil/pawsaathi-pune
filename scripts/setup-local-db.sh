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

: "${DB_URL:?DB_URL is required in .env}"
: "${DB_USERNAME:?DB_USERNAME is required in .env}"
: "${DB_PASSWORD:?DB_PASSWORD is required in .env}"

DB_NAME="${DB_URL##*/}"
DB_NAME="${DB_NAME%%\?*}"
if [[ ! "$DB_NAME" =~ ^[A-Za-z0-9_]+$ ]]; then
  echo "Could not determine a safe database name from DB_URL." >&2
  exit 1
fi

if [[ ! "$DB_USERNAME" =~ ^[A-Za-z0-9_.-]+$ ]]; then
  echo "DB_USERNAME may only contain letters, numbers, underscore, dot, and hyphen." >&2
  exit 1
fi

if MYSQL_PWD="$DB_PASSWORD" mysql --protocol=TCP -h 127.0.0.1 \
    -u "$DB_USERNAME" "$DB_NAME" -e 'SELECT 1' >/dev/null 2>&1; then
  echo "Database '$DB_NAME' and user '$DB_USERNAME' already work."
  exit 0
fi

if mysql -u root -e 'SELECT 1' >/dev/null 2>&1; then
  MYSQL_ADMIN=(mysql -u root)
elif sudo -n mysql -e 'SELECT 1' >/dev/null 2>&1; then
  MYSQL_ADMIN=(sudo mysql)
else
  MYSQL_ADMIN=(mysql -u root -p)
fi

ESCAPED_PASSWORD="${DB_PASSWORD//\\/\\\\}"
ESCAPED_PASSWORD="${ESCAPED_PASSWORD//\'/''}"

echo "Creating database '$DB_NAME' and user '$DB_USERNAME'..."
"${MYSQL_ADMIN[@]}" <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS '$DB_USERNAME'@'localhost' IDENTIFIED BY '$ESCAPED_PASSWORD';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USERNAME'@'localhost';
FLUSH PRIVILEGES;
SQL

if MYSQL_PWD="$DB_PASSWORD" mysql --protocol=TCP -h 127.0.0.1 \
    -u "$DB_USERNAME" "$DB_NAME" -e 'SELECT 1' >/dev/null 2>&1; then
  echo "Database setup complete. Start the API with ./scripts/run-backend.sh"
else
  echo "Setup ran, but '$DB_USERNAME' still cannot connect. Check DB_URL and DB_PASSWORD." >&2
  echo "If '$DB_USERNAME' already existed with a different password, update it manually; this script never changes an existing password." >&2
  exit 1
fi
