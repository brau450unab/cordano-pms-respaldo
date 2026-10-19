# Ecosistema CORDANO-PMS-2026: Arquitectura de Diseño, Sincronización y Benchmarking

Este documento establece la estructura integral que vincula **Google AI Studio**, **Google Stitch (MCP)**, **GitHub**, **Google Cloud Run** y **Mobbin**.

---

## 1. Identificadores y Nomenclatura del Ecosistema

| Plataforma | Nombre / Identificador Oficial | Rol / Función |
| :--- | :--- | :--- |
| **Jerarquía Mayor** | `CORDANO-PMS-2026` | Nombre maestro unificado del proyecto y versión |
| **Google Cloud Project** | `gen-lang-client-0862587160` (`349577440002`) | Infraestructura backend, Firestore y Cloud Run |
| **Cloud Run Service** | `cordano-pms` (us-west1) | Microservicio auto-gestionado de producción |
| **Dominio Público** | `https://cordanopms.ai.studio` | URL oficial de acceso para usuarios y operarios |
| **Google Cloud Run URL** | `https://cordano-pms-349577440002.us-west1.run.app` | URL técnica de balanceo en Cloud Run |
| **Imagen de Contenedor** | `gcr.io/gen-lang-client-0862587160/cordano-pms-2026:latest` | Tag de producción en Google Container Registry |
| **Google Stitch MCP** | `projects/10292600008632163693` | Proyecto oficial *ParkOps Parking ERP* |
| **GitHub Oficial** | `brau450unab/cordano-pms-oficial` | Repositorio activo sincronizado con el frontend |
| **GitHub Respaldo** | `brau450unab/cordano-pms-respaldo` | Repositorio para puntos de restauración históricos |
| **Mobbin Benchmarking** | Cuenta: `promarketing6@gmail.com` | Análisis de patrones UI/UX para parking y POS |

---

## 2. Flujo Operativo de Sincronización y Puntos de Restauración

Hemos creado el comando maestro `ecosystem-manager.mjs` para gestionar los despliegues y respaldos en una sola instrucción:

### A. Desplegar versión oficial y actualizar repositorios
```bash
node ecosystem-manager.mjs deploy
```
* **Qué hace**:
  1. Compila y sincroniza los 83 archivos del proyecto en `brau450unab/cordano-pms-oficial`.
  2. Aplica la nueva revisión en Google Cloud Run (`cordano-pms`).
  3. Mantiene en vivo `https://cordanopms.ai.studio` con la versión oficial.

### B. Crear un Punto de Restauración (Checkpoint Histórico)
```bash
node ecosystem-manager.mjs checkpoint [nombre-del-tag]
```
* **Ejemplo**:
```bash
node ecosystem-manager.mjs checkpoint v2026-10-checkpoint-caja
```
* **Qué hace**:
  1. Toma la instantánea exacta del estado del software.
  2. Sube el snapshot a `brau450unab/cordano-pms-respaldo`.
  3. Registra un **Git Tag inmutable** que permite revertir o restaurar cualquier versión en cualquier momento.

---

## 3. Vinculación con Google Stitch (`projects/10292600008632163693`)

El proyecto en Google Stitch (*ParkOps Parking ERP*) define el Design System (`macOS Pathway Redux` con tipografía **Manrope** y paleta borgoña/pizarra `#80093A`).

### Mapeo de Pantallas Stitch con el Código:
- **Hero & Login de Garita**: Pantalla `a2e4440e37074edaa659687e70048d31` ➔ `src/screens/LoginPage.tsx`
- **Matriz de Estacionamiento (30 Plazas)**: Pantalla `c655ef38d82a4288bdbf0cceef24c9db` ➔ `src/screens/LayoutTiempoReal.tsx`
- **Punto de Venta y Cobro Rápido (POS)**: Pantalla `f099ef093baa47cfbb5e5a5d92395684` ➔ `src/screens/PuntoVentaSalida.tsx`
- **Arqueo Ciego y Cierre de Turno**: Pantalla `2c8608df8070473f897b304e4f2bc4ce` ➔ `src/screens/CierreCajaCiego.tsx`
- **Dashboard Gerencial / Auditoría**: Pantalla `4a294644a00a4660893acb6fef888301` ➔ `src/screens/DashboardAdministrador.tsx`

---

## 4. Estructura de Benchmarking UI/UX con Mobbin (`promarketing6@gmail.com`)

Para iterar la interfaz con las mejores prácticas mundiales de aplicaciones móviles y web en la cuenta `promarketing6@gmail.com`:

### Colecciones Recomendadas en Mobbin para CORDANO-PMS-2026:
1. **Colección "POS & Cashier Flows"**:
   - *Referencias clave*: Square POS, Toast POS, Stripe Terminal, Lightspeed.
   - *Objetivo*: Ergonomía de pantalla táctil/teclado, desglose de denominaciones de efectivo y feedback auditivo/visual de vuelto.
2. **Colección "Parking & Mobility Matrix"**:
   - *Referencias clave*: SpotHero, ParkWhiz, EasyPark, ParkMobile.
   - *Objetivo*: Código semántico de plazas libres/ocupadas, tarjetas de tiempo transcurrido en minutos y alertas de sobrestadía.
3. **Colección "Receipt & Thermal Print Preview"**:
   - *Referencias clave*: Uber Receipts, Grab Driver Receipts, SumUp.
   - *Objetivo*: Visualización nítida de código QR y Código 128 para ticket térmico de 80mm.
