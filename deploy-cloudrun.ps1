# ==============================================================================
# CORDANO PMS — Script de Despliegue Automatizado a Google Cloud Run (PowerShell)
# ==============================================================================
# Permite a cualquier operador, desarrollador o nuevo propietario desplegar
# el sistema completo con un solo comando en su propio proyecto de Google Cloud.
# ==============================================================================

param (
    [string]$ProjectId = "gen-lang-client-0862587160",
    [string]$Region = "us-west1",
    [string]$ServiceName = "cordano-pms"
)

Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host "  CORDANO PMS — Despliegue a Google Cloud Run             " -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host "Proyecto GCP: $ProjectId" -ForegroundColor Cyan
Write-Host "Región:       $Region" -ForegroundColor Cyan
Write-Host "Servicio:     $ServiceName" -ForegroundColor Cyan
Write-Host ""

# 1. Configurar proyecto activo en gcloud
Write-Host "[1/4] Configurando proyecto activo en gcloud CLI..." -ForegroundColor Yellow
gcloud config set project $ProjectId

# 2. Habilitar APIs esenciales de Google Cloud si es un proyecto nuevo
Write-Host "[2/4] Verificando y habilitando APIs necesarias en GCP..." -ForegroundColor Yellow
gcloud services enable `
    run.googleapis.com `
    firestore.googleapis.com `
    cloudbuild.googleapis.com `
    artifactregistry.googleapis.com `
    containerregistry.googleapis.com

# 3. Compilar contenedor en la nube usando Cloud Build
Write-Host "[3/4] Enviando build multi-stage a Google Cloud Build..." -ForegroundColor Yellow
$ImageTag = "gcr.io/$ProjectId/${ServiceName}:latest"
gcloud builds submit --tag $ImageTag .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al compilar la imagen en Google Cloud Build." -ForegroundColor Red
    exit 1
}

# 4. Desplegar en Cloud Run con puerto 8080 y acceso público
Write-Host "[4/4] Desplegando contenedor en Google Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
    --image $ImageTag `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --port 8080 `
    --memory 512Mi `
    --cpu 1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "  ¡DESPLIEGUE EXITOSO EN GOOGLE CLOUD RUN!               " -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    $ServiceUrl = gcloud run services describe $ServiceName --region $Region --format="value(status.url)"
    Write-Host "URL Pública Activa: $ServiceUrl" -ForegroundColor Cyan
    Write-Host "Región:             $Region" -ForegroundColor White
    Write-Host "Puerto Contenedor:  8080" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "Ocurrió un error al desplegar en Cloud Run." -ForegroundColor Red
}
