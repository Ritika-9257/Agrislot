#!/bin/bash
set -e

# Default credentials (matches user MySQL configuration)
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASSWORD:-6125}"
DB_NAME="${DB_NAME:-agrislot}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================================="
echo "  AgriSlot APMC Mandi Database Setup & Migration"
echo "  Target: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo "======================================================="

echo "[1/4] Creating tables and constraints from schema.sql..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" < "$DIR/schema.sql"

echo "[2/4] Inserting 25+ seed records per table from seed_data.sql..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$DIR/seed_data.sql"

echo "[3/4] Creating stored procedures, cursors, and triggers..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$DIR/procedures_triggers.sql"

echo "[4/4] Creating views, benchmarks, and composite indexes..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$DIR/analytics_views_indexes.sql"

echo "======================================================="
echo "  ✓ AgriSlot Database Initialized Successfully!"
echo "======================================================="
