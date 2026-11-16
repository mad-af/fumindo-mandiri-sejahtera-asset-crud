#!/usr/bin/env bash
# =====================================================================
#  setup.sh - Membuat role + database asset_fumindo lalu menerapkan skema.
#
#  Perintah:
#    ./db/setup.sh              # setup database utama (asset_fumindo)
#    ./db/setup.sh --with-test  # sekalian buat database test (asset_fumindo_test)
# =====================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# --- Konfigurasi (bisa di-override lewat environment) -----------------
PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5432}"

# --- Deteksi user superuser ------------------------------------------
# Homebrew PostgreSQL: user OS = superuser, role "postgres" biasa tidak
# punya CREATEROLE. Coba user OS dulu, lalu jatuh ke "postgres".
detect_superuser() {
  if [[ -n "${PG_SUPERUSER:-}" ]]; then
    echo "${PG_SUPERUSER}"
    return
  fi
  if psql -U "$(whoami)" -d postgres -c "SELECT 1" >/dev/null 2>&1; then
    echo "$(whoami)"
  else
    echo "postgres"
  fi
}
PG_SUPERUSER="$(detect_superuser)"

APP_DB_NAME="${APP_DB_NAME:-asset_fumindo}"
APP_DB_USER="${APP_DB_USER:-fumindo}"
APP_DB_PASSWORD="${APP_DB_PASSWORD:-fumindo123}"
TEST_DB_NAME="${TEST_DB_NAME:-asset_fumindo_test}"

export PGHOST PGPORT

echo "==> Menghubungkan ke PostgreSQL di ${PGHOST}:${PGPORT} sebagai ${PG_SUPERUSER}"
psql -U "${PG_SUPERUSER}" -d postgres -v ON_ERROR_STOP=1 -c "SELECT 1" >/dev/null

# --- 1. Role aplikasi -------------------------------------------------
echo "==> Membuat role '${APP_DB_USER}' (jika belum ada)"
psql -U "${PG_SUPERUSER}" -d postgres -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${APP_DB_USER}') THEN
    CREATE ROLE ${APP_DB_USER} LOGIN PASSWORD '${APP_DB_PASSWORD}';
  ELSE
    ALTER ROLE ${APP_DB_USER} LOGIN PASSWORD '${APP_DB_PASSWORD}';
  END IF;
END
\$\$;
SQL

# --- 2. Database utama ------------------------------------------------
echo "==> Membuat database '${APP_DB_NAME}' (jika belum ada)"
psql -U "${PG_SUPERUSER}" -d postgres -v ON_ERROR_STOP=1 -tAc \
  "SELECT 1 FROM pg_database WHERE datname='${APP_DB_NAME}'" | grep -q 1 || \
  psql -U "${PG_SUPERUSER}" -d postgres -v ON_ERROR_STOP=1 \
    -c "CREATE DATABASE ${APP_DB_NAME} OWNER ${APP_DB_USER}"

# --- 3. Database test (opsional) --------------------------------------
if [[ "${1:-}" == "--with-test" ]]; then
  echo "==> Membuat database '${TEST_DB_NAME}' (jika belum ada)"
  psql -U "${PG_SUPERUSER}" -d postgres -v ON_ERROR_STOP=1 -tAc \
    "SELECT 1 FROM pg_database WHERE datname='${TEST_DB_NAME}'" | grep -q 1 || \
    psql -U "${PG_SUPERUSER}" -d postgres -v ON_ERROR_STOP=1 \
      -c "CREATE DATABASE ${TEST_DB_NAME} OWNER ${APP_DB_USER}"
fi

# --- 4. Terapkan skema -----------------------------------------------
echo "==> Menerapkan skema ke '${APP_DB_NAME}'"
psql -U "${APP_DB_USER}" -d "${APP_DB_NAME}" -v ON_ERROR_STOP=1 -f "${ROOT_DIR}/db/schema.sql"

if [[ "${1:-}" == "--with-test" ]]; then
  echo "==> Menerapkan skema ke '${TEST_DB_NAME}'"
  psql -U "${APP_DB_USER}" -d "${TEST_DB_NAME}" -v ON_ERROR_STOP=1 -f "${ROOT_DIR}/db/schema.sql"
fi

echo ""
echo "==> Selesai. Ringkasan:"
psql -U "${PG_SUPERUSER}" -d postgres -c \
  "SELECT datname AS database, pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname LIKE '${APP_DB_NAME}%' OR datname = '${TEST_DB_NAME}';"
