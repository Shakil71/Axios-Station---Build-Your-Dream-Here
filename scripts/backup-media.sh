#!/usr/bin/env bash
# Archive locally stored uploads (not needed when STORAGE_DRIVER=s3 with bucket versioning).
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/axios-station}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/axios-station/media}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/uploads-${STAMP}.tar.gz" -C "$APP_DIR/public" uploads
echo "[$(date -Is)] media backup ok"
find "$BACKUP_DIR" -name "uploads-*.tar.gz" -type f -mtime +"$KEEP_DAYS" -delete
