#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required."
  exit 1
fi

OUT_DIR="${BACKUP_OUTPUT_DIR:-backup-output}"
mkdir -p "$OUT_DIR"

TIMESTAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
CADENCE="${BACKUP_CADENCE:-manual}"
BASE_NAME="kinderos-db-${CADENCE}-${TIMESTAMP}"
SQL_PATH="${OUT_DIR}/${BASE_NAME}.sql"
GZ_PATH="${SQL_PATH}.gz"
HASH_PATH="${GZ_PATH}.sha256"

echo "Creating SQL dump..."
pg_dump \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  "$DATABASE_URL" > "$SQL_PATH"

echo "Compressing dump..."
gzip -9 "$SQL_PATH"

echo "Generating checksum..."
sha256sum "$GZ_PATH" > "$HASH_PATH"

if [[ -n "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ]]; then
  ENC_PATH="${GZ_PATH}.enc"
  echo "Encrypting backup..."
  openssl enc -aes-256-cbc -salt -pbkdf2 \
    -in "$GZ_PATH" \
    -out "$ENC_PATH" \
    -pass env:BACKUP_ENCRYPTION_PASSPHRASE
  sha256sum "$ENC_PATH" > "${ENC_PATH}.sha256"
  rm -f "$GZ_PATH" "$HASH_PATH"
  echo "Encrypted backup created: $ENC_PATH"
else
  echo "Backup created: $GZ_PATH"
fi

echo "Backup job completed."
