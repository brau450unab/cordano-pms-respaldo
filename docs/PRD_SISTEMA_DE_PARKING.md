# PRD Canónico v4.5: Sistema de Gestión de Estacionamiento y ERP (ParkOps PMS — Cordano Inversiones Inmobiliarias Ltda.)

> **Estado del Documento**: Aprobado e Implementado en Producción Local & Google AI Studio (v4.5 Enterprise)  
> **Instalación Física**: Serrano 447, Iquique, Chile (~700 m², 30 Plazas Físicas: Sector A `01–15`, Sector B `16–30` + 5 Plazas Sobrecupo `SC-01..05`)  
> **Infraestructura Cloud**: Google Cloud Run `cordano-pms-v1` | Proyecto GCP `gen-lang-client-0862587160` (`349577440002`) | Región `us-west1`  
> **Arquitectura UI**: Core Funcional Puro & Wireframe Estructural (Estilo Linear App / Vercel Dashboard) con Integración Integral de 13 Endpoints API y Gemini 2.5 Flash.

---

## 1. Resumen Ejecutivo y Propósito del Producto (`/product-manager` & `/idea-os`)

**ParkOps PMS & ERP v4.5** es la plataforma integral de control de acceso vehicular, recaudación presencial en garita, auditoría antifraude por PIN y conciliación ciega de caja desarrollada para **Cordano Inversiones Inmobiliarias Ltda.** en su recinto de **Serrano 447, Iquique**.

### 1.1 Problemas Operativos Resueltos (Framework PAS)
1. **Fugas de Caja y Arqueos Subjetivos**: Se elimina la visualización previa del efectivo esperado durante el cierre de turno mediante un **Arqueo de Caja Ciega en 3 Pasos**, auditado automáticamente por IA (`POST /api/ai/shift-audit`) y sellado criptográficamente con hash `SHA-256`.
2. **Cuellos de Botella en Hora Punta (12:00 a 15:30 hrs)**: Flujo *Keyboard-First* (`F1–F9`, `Enter`, `Esc`) sin scroll en monitores 1080p/4K, asistido por reconocimiento óptico LPR (`POST /api/ai/lpr-ocr`) y peritaje visual de daños (`POST /api/ai/damage-inspection`), logrando tiempos de ingreso `< 4 segundos`.
3. **Contaminación Contable entre Clientes Rotativos y Mensuales**: Segregación estricta mediante el **Submódulo en Paralelo (`[F3]`)** para Convenios Corporativos (`$75.000/mes`) y Pernocta Noche (`$8.000`), bloqueando plazas en la matriz sin alterar el flujo de caja por minuto.
4. **Vulnerabilidad ante Cortes de Internet**: Arquitectura *Offline-First* con persistencia en `IndexedDB` y emisión de tickets de contingencia con sufijo obligatorio **`-O`** (`TKT-AAAAMMDD-T0X-XXXXO`).

---

## 2. Reglas Oficiales de Dominio y Tarifario Unificado (v4.5)

| Parámetro de Dominio | Valor Oficial Canónico v4.5 | Regla de Negocio / Validación |
| :--- | :--- | :--- |
| **Capacidad del Recinto** | `30 Plazas` (`A-01..A-15`, `B-16..B-30`) + `5 Sobrecupo` | Asignación automática por orden de llegada o selección manual |
| **Tarifa Auto / Sedán** | `$25 CLP / minuto` | Cobro mínimo base de 30 minutos (`$750 CLP`) |
| **Tarifa Camioneta / SUV** | `$30 CLP / minuto` | Cobro mínimo base de 30 minutos (`$900 CLP`) |
| **Tarifa Motocicleta** | `$15 CLP / minuto` | Cobro mínimo base de 30 minutos (`$450 CLP`) |
| **Tiempo de Gracia** | **`0 minutos`** | Todo ingreso genera cobro efectivo (sin ventana gratuita) |
| **Recargo Ticket Extraviado** | **`$8.000 CLP`** | Leyenda legal obligatoria en ticket 80mm; exige **PIN Administrador** (`9999`) |
| **Fondo Inicial de Sencillo** | **`$50.000 CLP`** | Declaración obligatoria en apertura de turno para dar vuelto |
| **Descuento Comercial** | `15%` o monto autorizado | Exige **PIN Operador** (`1234`) + justificación escrita `> 10 caracteres` |
| **Segregación RBAC (Regla #7)** | `OPERADOR` vs `ADMIN` | El Administrador audita y configura, pero **no puede abrir turnos de caja** |

---

## 3. Código Semántico de Colores para la Matriz de 30 Plazas

| Estado / Tipo de Plaza | Color Semántico | Código Hexadecimal | Uso en Interfaz (`#view-map` & POS) |
| :--- | :--- | :--- | :--- |
| **Disponible (Libre)** | Verde Esmeralda | `#10B981` | Cupo habilitado para asignación inmediata |
| **Ocupada (Rotativo)** | Gris Pizarra | `#64748B` | Vehículo transitorio activo en patio |
| **Reservada** | Ámbar | `#F59E0B` | Reserva temporal o bloqueo operativo |
| **Abonado / VIP / Convenio** | Azul | `#3B82F6` | Plaza bloqueada por convenio mensual en paralelo (`B-29`, `B-30`, etc.) |
| **PMR (Movilidad Reducida)** | Cian | `#06B6D4` | Plazas preferenciales `A-01` y `A-02` |
| **Punto de Carga EV** | Violeta | `#8B5CF6` | Plaza electromovilidad `A-03` |
| **Sobrestadía / Alerta** | Rojo | `#EF4444` | Estadía prolongada (`>= 120 min`) o alerta de seguridad |

---

## 4. Especificación del Ticket Térmico de 80mm e Identificación Dual

1. **Correlativo Estándar Online**: `TKT-AAAAMMDD-T0X-XXXX` (ej. `TKT-20260928-T01-0142`).
2. **Correlativo Contingencia Offline**: Añade sufijo **`O`** (`TKT-AAAAMMDD-T0X-XXXXO`).
3. **Identificación Dual Impresa**:
   - **Código QR (2D)**: Validación rápida con cámara o lector óptico 2D.
   - **Código de Barras Lineal (Code 128)**: Escaneo láser de alta velocidad en garita + correlativo en tipografía monoespaciada (`JetBrains Mono`).
4. **Leyenda Legal Obligatoria**: Advertencia impresa al pie del comprobante informando el recargo reglamentario de **`$8.000 CLP`** por extravío de ticket.

---

## 5. Ecosistema de 13 Endpoints Backend Conectados al Frontend

| # | Endpoint | Método | Módulo Frontend Conectado | Función Operativa |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `/api/slots` | `GET` | `#view-pos`, `#view-map` | Estado en tiempo real de las 30 plazas + 5 sobrecupos |
| 2 | `/api/checkin` | `POST` | `#pos-subtab-entry` | Registro de ingreso, validación anti-passback y emisión de ticket |
| 3 | `/api/checkout` | `POST` | `#pos-subtab-exit` | Liquidación por minuto, descuentos/multas con PIN y liberación de plaza |
| 4 | `/api/shifts` | `GET/POST` | `#view-landing`, `#modal-close-shift` | Apertura con `$50.000` sencillo y cierre de caja ciega con hash `SHA-256` |
| 5 | `/api/audit` | `GET/POST` | `#view-reports`, `#modal-pin-auth` | Bitácora inmutable antifraude (etiquetas `VERDE` y `ROJO`) |
| 6 | `/api/ai/lpr-ocr` | `POST` | `#pos-subtab-entry` (`[LPR IA]`) | Reconocimiento de patente chilena/Mercosur y categoría con Gemini Vision |
| 7 | `/api/ai/damage-inspection` | `POST` | `#pos-subtab-entry` (`[Peritaje IA]`) | Detección preventiva de abolladuras/rayones preexistentes al ingreso |
| 8 | `/api/ai/shift-audit` | `POST` | `#modal-close-shift` (Paso 2) | Dictamen del Auditor Financiero IA sobre cuadratura de caja ciega |
| 9 | `/api/ai/assistant` | `POST` | `#view-support` | Copiloto Operativo IA para consultas de protocolos SOP en garita |
| 10 | `/api/ai/tools` | `POST` | `#view-support` | Function Calling (`getParkingStatus`, `calculateParkingFee`, `triggerBarrierPulse`) |
| 11 | `/api/cloudrun` | `GET` | `#view-settings` | Telemetría del contenedor `cordano-pms-v1` en GCP `us-west1` |
| 12 | `/api/health` | `GET` | `#view-landing`, `#view-settings` | Healthcheck de disponibilidad y latencia RTT |
| 13 | `/api/docs` & `/api/export/sheets` | `GET` | `#view-support`, `#view-reports` | Visor de PRDs canónicos en vivo y exportación CSV dinámica |

---

## 6. Métricas SaaS / PMS y Criterios de Éxito (`/product-manager`)

- **RevPAS (Revenue Per Available Space)**: Meta `>= $11.000 CLP / plaza / día` en Serrano 447.
- **Turnover Rate (Rotación Diaria)**: Meta `>= 1.60x` vehículos por plaza al día.
- **ALOS (Average Length of Stay)**: Estadía media monitoreada (`~51 min` en horario comercial).
- **Tiempo de Check-In en Garita**: `< 4 segundos` mediante atajos `F1–F9` o botón `[LPR IA]`.
- **Exactitud de Cuadratura Ciega**: Discrepancia `0 CLP` validada con sello `SHA-256` y dictamen IA.
