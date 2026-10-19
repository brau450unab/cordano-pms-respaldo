#!/usr/bin/env bash
# ==============================================================================
# CORDANO PMS — Script de Despliegue Automatizado a Google Cloud Run (Bash)
# ==============================================================================
# Diseñado para ejecutarse en Cloud Shell, Linux o macOS.
# ==============================================================================

set -euo pipefail

PROJECT_ID="${1:-gen-lang-client-0862587160}"
REGION="${2:-us-west1}"
SERVICE_NAME="${3:-cordano-pms}"

echo -e "\033[1;35m==========================================================\033[0m"
echo -e "\033[1;35m  CORDANO PMS — Despliegue a Google Cloud Run             \033[0m"
echo -e "\033[1;35m==========================================================\033[0m"
echo -e "\033[1;36mProyecto GCP: ${PROJECT_ID}\033[0m"
echo -e "\033[1;36mRegión:       ${REGION}\033[0m"
echo -e "\033[1;36mServicio:     ${SERVICE_NAME}\033[0m"
echo ""

# 1. Configurar proyecto en gcloud
echo -e "\033[1;33m[1/4] Configurando proyecto en gcloud CLI...\033[0m"
gcloud config set project "${PROJECT_ID}"

# 2. Habilitar APIs necesarias en GCP
echo -e "\033[1;33m[2/4] Habilitando APIs requeridas en Google Cloud...\033[0m"
gcloud services enable \
    run.googleapis.com \
    firestore.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    containerregistry.googleapis.com

# 3. Compilar imagen de contenedor
echo -e "\033[1;33m[3/4] Compilando imagen en Google Cloud Build...\033[0m"
IMAGE_TAG="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"
gcloud builds submit --tag "${IMAGE_TAG}" .

# 4. Desplegar en Cloud Run
echo -e "\033[1;33m[4/4] Desplegando servicio en Cloud Run...\033[0m"
gcloud run deploy "${SERVICE_NAME}" \
    --image "${IMAGE_TAG}" \
    --region "${REGION}" \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format="value(status.url)")

echo ""
echo -e "\033[1;32m==========================================================\033[0m"
echo -e "\033[1;32m  ¡DESPLIEGUE EXITOSO EN GOOGLE CLOUD RUN!               \033[0m"
echo -e "\033[1;32m==========================================================\033[0m"
echo -e "\033[1;36mURL Pública Activa: ${SERVICE_URL}\033[0m"
echo -e "\033[1;37mRegión:             ${REGION}\033[0m"
echo -e "\033[1;37mPuerto Contenedor:  8080\033[0m"
echo ""
