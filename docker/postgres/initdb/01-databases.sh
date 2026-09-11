#!/usr/bin/env bash
# Runs once, on first initialisation of an empty data directory.
#
# Creates the test database and installs the extensions into BOTH databases.
# Doing this as .sql would only ever reach the default one,
# and the test suite would then fail on a missing citext in a way that looks
# like a code bug.
#
# Schema itself comes from Doctrine migrations. docs/architecture/schema.sql is
# a design sketch and is deliberately NOT loaded here — it would drift from the
# migrations within a week.
set -euo pipefail

APP_DB="${POSTGRES_DB:-imvite}"
TEST_DB="${APP_DB}_test"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-SQL
	CREATE DATABASE ${TEST_DB} OWNER ${POSTGRES_USER};
SQL

for db in "$APP_DB" "$TEST_DB"; do
  echo "  provisioning ${db}"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db" <<-'SQL'
	CREATE EXTENSION IF NOT EXISTS citext;   -- case-insensitive email and slug
	CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- fuzzy duplicate detection on guest import
	SQL
done

echo "  databases ready: ${APP_DB}, ${TEST_DB}"
