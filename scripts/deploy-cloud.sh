#!/bin/bash
set -euo pipefail

# === CONFIGURACIÓN ===
PROJECT_ID="${GCLOUD_PROJECT_ID:-tu-project-id}"
REGION="${GCLOUD_REGION:-us-central1}"
SERVICE="plataforma-api"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE}"

# === PASO 0: Verificar gcloud ===
if ! command -v gcloud &>/dev/null; then
  echo "❌ Instala gcloud CLI: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

echo "✅ gcloud encontrado: $(gcloud --version | head -1)"

# === PASO 1: Login (solo la primera vez) ===
# gcloud auth login
# gcloud auth configure-docker

# === PASO 2: Crear proyecto (solo la primera vez) ===
# gcloud projects create ${PROJECT_ID} --name="Plataforma"
# gcloud config set project ${PROJECT_ID}
# gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# === PASO 3: Crear secrets en Secret Manager ===
# Reemplaza los valores con tus secrets reales
create_secret() {
  local name=$1
  local value=$2
  echo ">>> Creating secret: ${name}"
  echo -n "$value" | gcloud secrets create "$name" --data-file=- --project="${PROJECT_ID}" 2>/dev/null || \
  echo -n "$value" | gcloud secrets versions add "$name" --data-file=- --project="${PROJECT_ID}"
}

# Solo ejecutar la primera vez:
# create_secret "DATABASE_URL" "mysql://u560058480_plataforma:PASSWORD@srv1067.hstgr.io:3306/u560058480_plataforma"
# create_secret "JWT_SECRET" "tu-jwt-secret-aqui"
# create_secret "CSRF_SECRET" "tu-csrf-secret-aqui"
# create_secret "R2_ACCOUNT_ID" "3e464d500f677ee6ef8ae0bfca51f48a"
# create_secret "R2_ACCESS_KEY_ID" "3ffe51a48209074dc4338c7536044c2e"
# create_secret "R2_SECRET_ACCESS_KEY" "14b879634d6e54ff0b2cd726ca2cb01053d32c5d848d5266c93f88d5c8a144cf"
# create_secret "R2_BUCKET_NAME" "plataforma"
# create_secret "R2_PUBLIC_URL" "https://pub-448097f708f142c4b44913cfc7d82c4f.r2.dev"

# === PASO 4: Build + Deploy ===
echo ""
echo ">>> Building & deploying to Cloud Run..."
gcloud run deploy "${SERVICE}" \
  --source . \
  --docker-file docker/Dockerfile.api \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 60 \
  --set-env-vars "NODE_ENV=production,PORT=8080" \
  --update-secrets "\
DATABASE_URL=DATABASE_URL:latest,\
JWT_SECRET=JWT_SECRET:latest,\
CSRF_SECRET=CSRF_SECRET:latest,\
R2_ACCOUNT_ID=R2_ACCOUNT_ID:latest,\
R2_ACCESS_KEY_ID=R2_ACCESS_KEY_ID:latest,\
R2_SECRET_ACCESS_KEY=R2_SECRET_ACCESS_KEY:latest,\
R2_BUCKET_NAME=R2_BUCKET_NAME:latest,\
R2_PUBLIC_URL=R2_PUBLIC_URL:latest"

# === PASO 5: Obtener URL ===
URL=$(gcloud run services describe "${SERVICE}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --format="value(status.url)")

echo ""
echo "=== DESPLEGADO ==="
echo "API URL: ${URL}"
echo ""
echo "Siguientes pasos:"
echo "1. Configurar CORS_ORIGIN=https://build.icebergup.com en Vercel"
echo "2. Actualizar NEXT_PUBLIC_API_URL en Vercel a ${URL}/api/v1"
