# Cordano PMS — Data Architecture & Schema Specification

This document defines the structured data schema for **Cordano PMS**, optimized for integration between Google Cloud Run (Backend), internal application logic, and Google Sheets (Reporting & Audit).

## 1. Database Architecture Overview
The system follows a hybrid relational model:
- **Operational Database (Internal):** High-frequency transactional data (active stays, real-time layout).
- **Google Sheets (Sync Layer):** Historical records, financial logs, and audit trails for human-readable analysis and supervisor oversight.

---

## 2. Core Data Tables (Schema)

### Table A: `vehiculos_transacciones` (Flow & Revenue)
*The primary table for recording daily vehicle movement and billing.*

| Column Name | Data Type | Description | Sheet Formatting |
| :--- | :--- | :--- | :--- |
| `transaction_id` | UUID | Unique identifier for the stay. | Hidden |
| `patente` | String | Vehicle plate (e.g., AB·CD·12). | Uppercase, Bold |
| `tipo_vehiculo` | Enum | Auto, SUV, Camioneta, Moto. | Dropdown |
| `slot_id` | Integer | Assigned parking space (1-30). | Center Align |
| `hora_entrada` | Timestamp | Check-in date and time. | `DD/MM/YYYY HH:MM` |
| `hora_salida` | Timestamp | Check-out date and time. | `DD/MM/YYYY HH:MM` |
| `duracion_minutos` | Integer | Total stay duration. | Calculated Field |
| `tarifa_aplicada` | Currency | Rate per minute at time of stay. | CLP ($) |
| `monto_total` | Currency | Final amount to be paid. | CLP ($), Bold |
| `estado_pago` | Enum | Pendiente, Pagado, Anulado. | Color Scale (Red/Green) |
| `medio_pago` | Enum | Efectivo, Tarjeta, Transferencia. | Dropdown |
| `operador_id` | String | ID of the person who registered. | - |
| `turno_id` | String | Link to the specific work shift. | - |

### Table B: `turnos_caja` (Financial Control)
*Records the start/end of operator shifts and financial reconciliation.*

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `turno_id` | UUID | Unique shift identifier. |
| `operador_nombre` | String | Name of the person on duty. |
| `hora_apertura` | Timestamp | Shift start. |
| `hora_cierre` | Timestamp | Shift end. |
| `fondo_inicial` | Currency | Initial cash in drawer. |
| `declaracion_efectivo` | Currency | Amount declared (Blind Closure). |
| `esperado_sistema` | Currency | Amount calculated by PMS. |
| `diferencia` | Currency | Variance (Declaration - Expected). |
| `estado` | Enum | Cuadrado, Descuadre, Pendiente. |

### Table C: `clientes_abonados` (Recurrent Users)
*Database of frequent customers and subscriptions.*

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `cliente_id` | UUID | Unique customer ID. |
| `nombre` | String | Full name or Company. |
| `rut` | String | Chilean Tax ID. |
| `patentes_asociadas` | Array | List of plates under this client. |
| `telefono_whatsapp` | String | For digital ticket delivery. |
| `tipo_cliente` | Enum | Frecuente, Mensual, Convenio. |
| `saldo_prepago` | Currency | Available balance (if applicable). |

---

## 3. Google Sheets Integration Logic

### 3.1 Real-Time Sync (App Script / Webhooks)
- **Insert on Check-in:** A new row is created in `vehiculos_transacciones` with `estado_pago = Pendiente`.
- **Update on Check-out:** The system searches for the `transaction_id` and fills in `hora_salida`, `monto_total`, and `estado_pago`.

### 3.2 Supervisor View (Visualization)
- **Conditional Formatting:**
    - High-stay vehicles (>4 hours) highlighted in Amber.
    - Cash discrepancies in `turnos_caja` highlighted in Red.
- **Pivot Tables (Recommended):**
    - Revenue by Day/Week.
    - Occupancy Heatmap (Stay frequency by Hour).
    - Performance by Operator.

---

## 4. Security & Audit
- **Audit Trail:** All manual modifications to the Google Sheet (outside of the App sync) should be flagged via a hidden `last_modified` column to maintain data integrity.
- **Access Control:** Operators have "Write-only" access via the app; Supervisors have "Read-only" access to the Google Sheets to prevent accidental data deletion.
