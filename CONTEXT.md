# Documento de Contexto Técnico Canónico — PROYECTO CORDANO ENTREGABLE

## 1. Visión General del Negocio y Sistema
**Parking Ops — Cordano Parking Management System (PMS)** es la plataforma oficial de gestión, control de accesos y punto de venta desarrollada específicamente para el estacionamiento ubicado en **Serrano 447, Iquique, Chile** (Capacidad: 30 plazas oficiales distribuidas en Sector A [01–15, techado] y Sector B [16–30, general]).

El sistema opera bajo los más altos estándares de ergonomía de garita, alta velocidad de atención, cumplimiento estricto de la **Ley N° 20.967 de Estacionamientos en Chile** (fraccionamiento por minuto efectivo sin redondeos en perjuicio del usuario, gracia de 15 minutos, recargo por ticket perdido de $8.000 con validación diferida) y protocolos de control de efectivo mediante **Arqueo Ciego de Caja** sellado con hash criptográfico SHA-256.

---

## 2. Mapa de Entornos y Fuente Única de la Verdad
1. **Producción Publicada Online (Cloud Run)**:
   - URL Primaria: [`https://cordanopms.ai.studio`](https://cordanopms.ai.studio)
   - URL Directa Google Cloud: [`https://cordano-pms-349577440002.us-west1.run.app`](https://cordano-pms-349577440002.us-west1.run.app)
   - Revisión Activa: `cordano-pms-00011-z8v` (100% del tráfico).
2. **Repositorio GitHub Oficial**:
   - URL: [`https://github.com/brau450unab/cordano-pms-oficial`](https://github.com/brau450unab/cordano-pms-oficial)
   - Ramas: `main` y `punto-fijado-cordanopms-ai-studio`.
3. **Repositorio GitHub de Respaldo (Intocable)**:
   - URL: [`https://github.com/brau450unab/cordano-pms-respaldo`](https://github.com/brau450unab/cordano-pms-respaldo)
   - Rama: `checkpoint-restauracion-cordanopms-ai-studio`.
4. **Prototipado Visual en Google AI Studio**:
   - App ID: `e1c08131-a20e-48b9-8ee7-ee1d6aede812`
5. **Localhost de Desarrollo**:
   - `http://localhost:3000` ejecutado directamente desde la raíz del entregable `PROYECTO CORDANO ENTREGABLE`.

---

## 3. Estructura de Carpetas Post-Purga y Consolidación

```
PROYECTO CORDANO ENTREGABLE/     # [RAÍZ ÚNICA CANÓNICA] Núcleo unificado v2.0.0
├── src/                         # Código fuente React 18 + TypeScript + Tailwind CSS
├── public/                      # Service Worker v2.0.0 PWA, favicon, logo, serve.json
├── dist/                        # Build de producción optimizado para Cloud Run
├── tests/                       # Suite de pruebas automatizadas E2E
├── documentacion_historica/     # PRDs, bitácoras de conversaciones y especificaciones
├── Dockerfile                   # Contenedor multi-stage para Cloud Run
├── serve.json                   # Cabeceras anti-obsolescencia y enrutamiento SPA
├── package.json                 # Dependencias y scripts de construcción
├── AGENTS.md / GEMINI.md        # Directivas canónicas y reglas operativas
├── README.md                    # Guía ejecutiva del entregable y puesta en marcha
├── CONTEXT.md                   # Contexto técnico y de negocio Serrano 447
└── HANDOFF.md                   # Bitácora de continuidad post-purga
```

---

## 4. Estado Post-Purga de Versiones
- **`PROYECTO CORDANO ENTREGABLE`**: Es la **ÚNICA** carpeta viva y mantenible del proyecto. Toda la lógica del POS, Matriz 2D con Drag & Drop, emisión de tickets térmicos 80mm, cobro con vuelto y desglose tributario, stepper de arqueo ciego y control de turnos se encuentra compilada, probada y sincronizada directamente en esta raíz.
- Las carpetas legadas `cordano-pms-version-publicada` y `NUEVO PMS CORDANO` han sido purgadas y eliminadas de forma definitiva del equipo local. Sus especificaciones clave y diagramas continúan respaldados en `documentacion_historica/`.
