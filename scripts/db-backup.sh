#!/bin/bash
set -euo pipefail

# Backup de MySQL -> .sql.gz, con subida opcional a Cloudflare R2.
#
# Uso:
#   DATABASE_URL="mysql://user:pass@host:3306/db" ./scripts/db-backup.sh
#
# Requisitos: mysqldump (cliente MySQL/MariaDB).
# Opcional (para subir a R2): aws cli + R2_ACCOUNT_ID, R2_BUCKET_NAME,
#   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.
#
# Programar en Cloud Scheduler / cron (ej. diario 03:00):
#   0 3 * * * DATABASE_URL="..." /ruta/scripts/db-backup.sh >> /var/log/db-backup.log 2>&1

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: define DATABASE_URL"
  exit 1
fi

if ! command -v mysqldump >/dev/null; then
  echo "ERROR: mysqldump no encontrado (instala el cliente MySQL)"
  exit 1
fi

rest="${DATABASE_URL#*://}"
creds="${rest%@*}"
hostpart="${rest#*@}"
hostpart="${hostpart%%\?*}"
user="${creds%%:*}"
pass="${creds#*:}"
host="${hostpart%%:*}"
portanddb="${hostpart#*:}"
if [[ "$portanddb" == "$hostpart" ]]; then
  port=3306
  dbname="${hostpart#*/}"
else
  port="${portanddb%%/*}"
  dbname="${portanddb#*/}"
fi
dbname="${dbname%%\?*}"

if [[ -z "$user" || -z "$host" || -z "$dbname" ]]; then
  echo "ERROR: no se pudo parsear DATABASE_URL"
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
ts="$(date +%Y%m%d-%H%M%S)"
file="${BACKUP_DIR}/${dbname}-${ts}.sql.gz"

echo ">>> Backup de '${dbname}' en ${host}:${port} ..."
MYSQL_PWD="$pass" mysqldump \
  --host="$host" --port="$port" --user="$user" \
  --single-transaction --quick --routines --triggers \
  "$dbname" | gzip -9 > "$file"

echo ">>> Backup creado: $file ($(du -h "$file" | cut -f1))"

if [[ -n "${R2_BUCKET_NAME:-}" && -n "${R2_ACCESS_KEY_ID:-}" && -n "${R2_SECRET_ACCESS_KEY:-}" ]] && command -v aws >/dev/null; then
  endpoint="${R2_ENDPOINT:-https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com}"
  AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
    aws --endpoint-url "$endpoint" s3 cp "$file" "s3://${R2_BUCKET_NAME}/backups/$(basename "$file")"
  echo ">>> Subido a R2: s3://${R2_BUCKET_NAME}/backups/$(basename "$file")"
fi

# Retención local: elimina backups de más de 14 días
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +14 -delete 2>/dev/null || true

echo ">>> OK"
