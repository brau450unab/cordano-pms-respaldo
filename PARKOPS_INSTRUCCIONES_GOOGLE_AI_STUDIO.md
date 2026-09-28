# Instrucciones de Importación, Arquitectura y Reglas de Negocio para Google AI Studio (ParkOps PMS & ERP v4.5)

Este documento acompaña al archivo autocontenido **[`PARKOPS_FRONTEND_GOOGLE_AI_STUDIO.html`](file:///c:/Users/BraulioAM/OneDrive%20-%20UNIVERSIDAD%20ANDRES%20BELLO/PROYECTOS%20ANTIGRAVITY/NUEVO%20PMS%20CORDANO/PARKOPS_FRONTEND_GOOGLE_AI_STUDIO.html)** para que **Google AI Studio (Gemini 2.5 Pro / Flash)** o cualquier entorno de previsualización web interprete de forma exacta la arquitectura, contratos de los **13 endpoints de API**, tokens de diseño y reglas de dominio de **Cordano Inversiones Inmobiliarias Ltda. (Serrano 447, Iquique, Chile)**.

---

## 1. Propósito del Proyecto y Contexto Físico

- **Nombre del Sistema**: **ParkOps PMS & ERP — Ed. Serrano 447, Iquique (v4.5 Enterprise)**
- **Cliente / Operación**: Cordano Inversiones Inmobiliarias Ltda.
- **Instalación Física**: Calle Serrano 447, Iquique, Chile (~700 m²).
- **Capacidad de Patio**: **30 plazas físicas numeradas** (`Sector A: A-01 a A-15`, `Sector B: B-16 a B-30`) + **5 plazas de sobrecupo** (`SC-01 a SC-05`).
- **Infraestructura Cloud**: Microservicio `cordano-pms-v1` en **Google Cloud Run** (`us-west1`, Puerto `8080`, Proyecto GCP `gen-lang-client-0862587160` / `349577440002`).
- **Google Stitch Project**: `projects/12916038623650348087` (*NUEVO PMS CORDANO - ParkOps Iquique*).

---

## 2.Cómo Importar y Ejecutar en Google AI Studio

### Opción A: Previsualización Directa / Applet HTML
1. Abra **Google AI Studio** (`https://aistudio.google.com/`).
2. En un nuevo prompt o en el modo **Starter Apps / Web App Preview**, adjunte el archivo **`PARKOPS_FRONTEND_GOOGLE_AI_STUDIO.html`** junto con este documento **`PARKOPS_INSTRUCCIONES_GOOGLE_AI_STUDIO.md`**.
3. El archivo HTML es **100% autónomo (Single-File Bundle)**:
   - Incluye **React 18**, **ReactDOM 18**, **Babel Standalone**, **Tailwind CSS CDN** con la configuración exacta de tokens y las fuentes oficiales (**Plus Jakarta Sans** + **JetBrains Mono**).
   - Contiene los 4 módulos del frontend unificados (`OfficialModals`, `OfficialLandingAndMenu`, `OfficialAuxViews` y `OfficialParkOpsApp`) con datos semilla de vehículos en patio, convenios en paralelo, bitácora de auditoría (`VERDE` / `ROJO`) y fallbacks locales autónomos para los 13 endpoints.

### Opción B: System Instruction para Iterar con Gemini en Google AI Studio
Copie y pegue el siguiente bloque en el campo **System Instructions** de Google AI Studio cuando solicite modificaciones al modelo:

```markdown
Actúa como Arquitecto Principal de Sistemas y Especialista UI/UX de ParkOps PMS & ERP (Cordano Inversiones Inmobiliarias Ltda., Serrano 447, Iquique).
Mantén estrictamente:
1. Estilo visual Linear App / Vercel Dashboard (Core Funcional Puro y Wireframes limpios): PROHIBIDO agregar fotografías, imágenes externas o videos. Conserva únicamente los bloques `[ Slot Wireframe ]` con borde punteado.
2. Ergonomía de Garita (Keyboard-First & Sin Scroll): Conserva todos los atajos de teclado (`F1` Menú, `F2` Ingreso POS, `F3` Convenios, `F4` Salida POS, `F5` Ajustes, `F6` Historial, `F8` Pulso Barrera, `F9` Cierre Caja Ciega, `Enter`, `Esc`) y la vista `#view-pos` sin scroll vertical en 1080p.
3. Tipografía Numérica Tabular: Todo monto en CLP (`$4.500`), temporizador, porcentaje o patente DEBE usar `font-mono tabular-nums`. Las patentes usan la clase `.license-plate-chip`.
4. Código Semántico de Plazas (30 cupos): Libre `#10B981`, Ocupada `#64748B`, Reservada `#F59E0B`, Abonado/VIP `#3B82F6`, PMR `#06B6D4`, Carga EV `#8B5CF6`, Sobrestadía `#EF4444`.
5. Reglas de Negocio v4.5:
   - Tarifas: Auto/Sedán `$25/min`, Camioneta/SUV `$30/min`, Moto `$15/min` (0 minutos de gracia).
   - Apertura de turno con declaración obligatoria de sencillo (`$50.000 CLP`). El rol Administrador NO puede abrir caja (Regla #7).
   - Ticket térmico de 80mm con identificación dual (QR + Code 128), sufijo `-O` en contingencia offline (`TKT-AAAAMMDD-T0X-XXXXO`) y leyenda legal de multa por ticket extraviado (`$8.000 CLP`).
   - Auditoría antifraude: Descuentos exigen PIN Operador (`1234`, etiqueta Verde) y justificación >10 caracteres; Ticket extraviado exige PIN Administrador (`9999`, etiqueta Roja).
   - Cierre de Caja Ciega en 3 pasos: Declaración física directa en efectivo (sin calculadora de billetes en Paso 1) -> Dictamen del Auditor Financiero IA (`/api/ai/shift-audit`) + Sello criptográfico `SHA-256` en Paso 2 -> Corte Z Fiscal en Paso 3.
```

---

## 3. Integración Completa de los 13 Endpoints Backend en la Interfaz (v4.5)

El frontend integra de extremo a extremo los **13 endpoints** del monolito Next.js (con fallback autónomo instantáneo cuando se ejecuta en Google AI Studio sin servidor Node.js):

1. **`GET /api/slots`** y **`POST /api/checkin`** (`#pos-subtab-entry`): Registro de ingresos por patente con asignación automática/manual en las 30 plazas y emisión de ticket 80mm.
2. **`POST /api/ai/lpr-ocr`** (`#pos-subtab-entry` → botón **`[LPR IA]`**): Captura asistida por visión computacional Gemini 2.5 Flash que detecta patente y categoría vehicular sin ocupar espacio adicional en pantalla.
3. **`POST /api/ai/damage-inspection`** (`#pos-subtab-entry` → botón **`[Peritaje IA]`**): Inspección visual preventiva que redacta hallazgos de carrocería en el campo de observaciones para proteger ante reclamos (SOP-03).
4. **`POST /api/checkout`** (`#pos-subtab-exit`): Liquidación por minuto con **0 min de gracia**, cálculo de vuelto en efectivo y liberación de plaza.
5. **`GET/POST /api/audit`** (`#modal-pin-auth` & `#view-reports`): Autorización con PIN Operador (`1234`, Verde) o PIN Admin (`9999`, Rojo) y bitácora inmutable.
6. **`GET/POST /api/shifts`** y **`POST /api/ai/shift-audit`** (`#modal-close-shift`): Arqueo de Caja Ciega donde el **Paso 1** solicita únicamente el monto directo de efectivo físico contado, y el **Paso 2** presenta el **Dictamen del Auditor Financiero IA** (`nivelRiesgo: BAJO | MEDIO | ALTO`) junto al hash `SHA-256`.
7. **`POST /api/ai/assistant`** y **`POST /api/ai/tools`** (`#view-support`): **Copiloto Operativo de Garita** con consulta en lenguaje natural y 3 botones rápidos de *Function Calling* (`getParkingStatus`, `calculateParkingFee`, `triggerBarrierPulse`).
8. **`GET /api/docs`** (`#view-support`): **Visor de Documentación Canónica en Vivo** para inspeccionar `PRD_SISTEMA_DE_PARKING.md`, `MAPA_DE_SITIO_Y_ARQUITECTURA.md` y `ESPECIFICACION_DISENO_FLUJO_Y_LANDING.md`.
9. **`GET /api/export/sheets`** (`#view-reports`): Descarga directa de planilla CSV dinámica con codificación UTF-8 BOM para Excel / Google Sheets.
10. **`GET /api/cloudrun`** y **`GET /api/health`** (`#view-settings` & `#view-landing`): Panel de telemetría en vivo del contenedor `cordano-pms-v1` con medidor de latencia RTT y presets de super-resolución **Magnific AI** + **Clarity Upscaler (`philz1337x`)**.
