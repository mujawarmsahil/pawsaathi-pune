#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/pawsaathi-setup-db-test.XXXXXX")"
trap 'rm -rf "$TEST_DIR"' EXIT

mkdir -p "$TEST_DIR/bin" "$TEST_DIR/scripts"
cp "$ROOT_DIR/scripts/setup-local-db.sh" "$TEST_DIR/scripts/"

cat > "$TEST_DIR/bin/mysql" <<'MYSQL'
#!/usr/bin/env bash
printf 'ARGS: %s\n' "$*" >> "$MYSQL_LOG"
if [[ "$*" == *"--protocol=TCP"* ]]; then exit 1; fi
if [[ "$*" != *"-e"* ]]; then cat >> "$MYSQL_LOG"; fi
exit 0
MYSQL
chmod +x "$TEST_DIR/bin/mysql"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

check_case() {
  local password="$1"
  local expected="$2"
  local env_password="${password//\\/\\\\}"
  printf 'DB_URL=jdbc:mysql://127.0.0.1:3306/pawsaathi_test?serverTimezone=UTC\nDB_USERNAME=root\nDB_PASSWORD="%s"\n' "$env_password" > "$TEST_DIR/.env"
  : > "$TEST_DIR/mysql.log"
  local rc=0
  PATH="$TEST_DIR/bin:$PATH" MYSQL_LOG="$TEST_DIR/mysql.log" bash "$TEST_DIR/scripts/setup-local-db.sh" > "$TEST_DIR/output.log" 2>&1 || rc=$?
  [[ $rc -ne 0 ]] || fail "expected setup to exit nonzero for password: $password"
  grep -Fq "IDENTIFIED BY '$expected';" "$TEST_DIR/mysql.log" || fail "unexpected SQL escaping for password: $password"
  if grep -Fq "ALTER USER" "$TEST_DIR/mysql.log"; then
    fail "ALTER USER emitted for password: $password"
  fi
}

check_case 'back\slash' 'back\\slash'
check_case "quote'pass" "quote''pass"
check_case "both\\quote'pass" "both\\\\quote''pass"

echo "setup-local-db escaping tests passed"
