#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL must be set" >&2
  exit 1
fi

BACKUP_DIR=${1:-backups}
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
FILENAME="bonded-${TIMESTAMP}.sql.gz"
OUTPUT_PATH="${BACKUP_DIR%/}/$FILENAME"

echo "Creating backup at $OUTPUT_PATH"
pg_dump --no-owner --no-privileges "$DATABASE_URL" | gzip > "$OUTPUT_PATH"

echo "Backup completed successfully"
