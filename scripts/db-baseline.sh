#!/bin/bash
set -euo pipefail

# Baseline de migraciones para bases de datos creadas con `prisma db push`.
# Marca la migración base como ya aplicada SIN ejecutar SQL (la BD ya tiene el
# esquema). Ejecutar UNA sola vez por base de datos existente.
#
# Uso:
#   DATABASE_URL="mysql://user:pass@host:3306/db" ./scripts/db-baseline.sh

BASELINE="20260918000000_init_baseline"
SCHEMA="packages/database/prisma/schema.prisma"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: define DATABASE_URL"
  exit 1
fi

if [[ ! -d "packages/database/prisma/migrations/${BASELINE}" ]]; then
  echo "ERROR: no existe la migración ${BASELINE}"
  exit 1
fi

echo ">>> Marcando ${BASELINE} como aplicada (baseline)..."
npx prisma migrate resolve --applied "${BASELINE}" --schema="${SCHEMA}"

echo ">>> Listo. Los próximos despliegues aplicarán migraciones con 'prisma migrate deploy'."
