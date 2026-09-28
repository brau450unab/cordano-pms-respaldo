# 🚗 ParkOps PMS & ERP — Cordano Inversiones Inmobiliarias Ltda.
**Instalación Operativa: Serrano 447, Iquique, Región de Tarapacá, Chile**

[![Open in Project IDX](https://img.shields.io/badge/Open_in-Project_IDX-blue?logo=google&logoColor=white&style=for-the-badge)](https://idx.google.com/import?url=https%3A%2F%2Fgithub.com%2Fbrau450unab%2Fcordano-pms-v1)
[![Google AI Studio](https://img.shields.io/badge/Google_AI_Studio-Gemini_2.0_Ready-8E75FF?logo=google&logoColor=white&style=for-the-badge)](https://aistudio.google.com/)
[![Google Stitch](https://img.shields.io/badge/Google_Stitch-Project_12916038623650348087-00C853?style=for-the-badge)](https://stitch.withgoogle.com/projects/12916038623650348087)
[![Google Cloud Run](https://img.shields.io/badge/Google_Cloud_Run-cordano--pms--v1-4285F4?logo=googlecloud&logoColor=white&style=for-the-badge)](https://cordano-pms-v1-349577440002.us-west1.run.app)

---

## 🌐 Ecosistema de Plataformas Conectadas

```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │                   ParkOps Cordano - Ecosistema Unificado               │
  └────────────────────────────────────────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
 ┌───────────────┐           ┌───────────────┐           ┌───────────────┐
 │ Google Cloud  │           │   Google AI   │           │ Google Stitch │
 │   Cloud Run   │           │    Studio     │           │ Design Tokens │
 │ cordano-pms-v1│           │ Gemini 2.0/2.5│           │ Project 1291..│
 └───────┬───────┘           └───────┬───────┘           └───────┬───────┘
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     ▼
                     ┌───────────────────────────────┐
                     │    GitHub: brau450unab/       │
                     │       cordano-pms-v1          │
                     └───────────────┬───────────────┘
                                     ▼
                     ┌───────────────────────────────┐
                     │  Garita Serrano 447 (Iquique) │
                     │  Offline-First & 30 Plazas    │
                     └───────────────────────────────┘
```

---

## ⚡ Importación en 1-Click: Google Project IDX & Google AI Studio

Este repositorio está especialmente estructurado con los estándares de Google (`.idx/dev.nix` y `google-ai-studio/`) para ser importado automáticamente:

### Opción A: Abrir directamente en Google Project IDX
1. Haz clic en el botón **[Open in Project IDX](https://idx.google.com/import?url=https%3A%2F%2Fgithub.com%2Fbrau450unab%2Fcordano-pms-v1)**.
2. O ingresa a [idx.google.com](https://idx.google.com/) e importa la URL: `https://github.com/brau450unab/cordano-pms-v1`.
3. El entorno en la nube se configurará solo (Node.js 20, extensiones Gemini, preview web en puerto 3000).

### Opción B: Importar Prompts en Google AI Studio (`aistudio.google.com`)
Consulta la **[Guía Oficial de Integración con Google AI Studio](GOOGLE_AI_STUDIO_IMPORT_GUIDE.md)** para importar los prompts estructurados de:
- **LPR / OCR de Patentes Chilenas**: [`google-ai-studio/prompts/lpr_plate_recognition_v2.json`](google-ai-studio/prompts/lpr_plate_recognition_v2.json)
- **Inspección Previa de Daños**: [`google-ai-studio/prompts/damage_inspection_multimodal.json`](google-ai-studio/prompts/damage_inspection_multimodal.json)
- **Auditoría Financiera de Arqueo Ciego**: [`google-ai-studio/prompts/cashier_shift_audit.json`](google-ai-studio/prompts/cashier_shift_audit.json)
- **Copiloto de Garita con Function Calling**: [`google-ai-studio/prompts/garita_copilot_assistant.json`](google-ai-studio/prompts/garita_copilot_assistant.json)
- **Esquema de Tools & Function Calling**: [`google-ai-studio/tools_schema.json`](google-ai-studio/tools_schema.json)

---

## 🏢 Características de ParkOps PMS & ERP

- **30 Plazas Físicas**: Sector A (01 al 15) y Sector B (16 al 30) en Serrano 447, Iquique.
- **Ergonomía de Garita (Keyboard-First)**: Atajos directos `F1` a `F9`, `Enter` y `Esc`. Flujo operativo 100% sin scroll.
- **Arquitectura Desacoplada & Core Funcional Puro**: Wireframe estructural de alto contraste, contratos de datos explícitos y tipografía monoespaciada con números tabulares (`tabular-nums`).
- **Offline-First Resilience**: Persistencia local en IndexedDB con emisión de tickets canónicos `TKT-AAAAMMDD-T0X-XXXXO`.
- **Auditoría Antifraude y Caja Ciega**: Arqueo sin montos a la vista, validación de PIN para descuentos (>10 caracteres) y supervisión obligatoria para tickets extraviados.
- **Servicios Paralelos**: Gestión independiente de Pernocta ($8.000/noche) y Abonados VIP ($75.000/mes) sin distorsionar la rotación por minuto.

---

## 🛠️ Ejecución Local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno (.env.local)
cp .env.example .env.local  # Agrega tu GEMINI_API_KEY de Google AI Studio

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Acceder al sistema centralizado:
# http://localhost:3000/
```

---

## 🚀 Despliegue a Google Cloud Run

```bash
# Despliegue automatizado
deploy-cloudrun.bat
```
O con `gcloud`:
```bash
gcloud run deploy cordano-pms-v1 \
  --project=gen-lang-client-0862587160 \
  --region=us-west1 \
  --source=. \
  --port=8080 \
  --allow-unauthenticated
```
- **Microservicio Cloud Run**: `https://cordano-pms-v1-349577440002.us-west1.run.app`
