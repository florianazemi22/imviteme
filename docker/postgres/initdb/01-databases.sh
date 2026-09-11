#!/usr/bin/env bash
# Runs once, on first initialisation of an empty data directory.
#
# Creates the test database and installs the extensions and ICU collations into
# BOTH databases. Doing this as .sql would only ever reach the default one,
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

	-- ICU collations for guest-name sorting. The database default collation
	-- mis-sorts Albanian (Ç, Ë), Turkish (İ, Ş, Ğ) and Czech (Ch).
	-- See docs/architecture/03-i18n-and-typography.md §3.5.
	CREATE COLLATION IF NOT EXISTS sq_icu (provider = icu, locale = 'sq');
	CREATE COLLATION IF NOT EXISTS tr_icu (provider = icu, locale = 'tr');
	CREATE COLLATION IF NOT EXISTS de_icu (provider = icu, locale = 'de');
	CREATE COLLATION IF NOT EXISTS el_icu (provider = icu, locale = 'el');
	CREATE COLLATION IF NOT EXISTS ar_icu (provider = icu, locale = 'ar');
	CREATE COLLATION IF NOT EXISTS sr_icu (provider = icu, locale = 'sr');
	SQL
done

echo "  databases ready: ${APP_DB}, ${TEST_DB}"
