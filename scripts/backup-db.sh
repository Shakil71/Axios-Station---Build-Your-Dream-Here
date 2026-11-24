#!/usr/bin/env bash
# Compressed MySQL backup with rotation.
# Cron example (daily 02:30):  30 2 * * * /var/www/axios-station/scripts/backup-db.sh >> /var/log/axios-station/backup.log 2>&1
# Credentials come from ~/.my.cnf ([mysqldump] user=… password=…) — never put passwords on the command line.
set -euo pipefail

DB_NAME="${DB_NAME:-axios_station}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/axios-station/db}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
OUT="$BACKUP_DIR/${DB_NAME}-${STAMP}.sql.gz"

mysqldump --single-transaction --quick --routines --triggers --set-gtid-purged=OFF "$DB_NAME" | gzip -9 > "$OUT"
chmod 600 "$OUT"
gzip -t "$OUT"
echo "[$(date -Is)] backup ok: $OUT ($(du -h "$OUT" | cut -f1))"

find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -type f -mtime +"$KEEP_DAYS" -delete

# Optional off-site copy (uncomment & configure):
# aws s3 cp "$OUT" "s3://your-backup-bucket/axios-station/db/" --storage-class STANDARD_IA
