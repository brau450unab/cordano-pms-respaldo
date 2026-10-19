# Especificaciones Técnicas y Contratos de Sistema — CORDANO PMS V2
## Sistema de Gestión de Estacionamiento & ERP (ParkOps Iquique)
**Cliente**: Cordano Inversiones Inmobiliarias Ltda.  
**Ubicación**: Serrano 447, Iquique, Chile (Junto al Consulado Italiano)  
**Capacidad**: ~700 m² | 30 Plazas (Sector A: 01–15, Sector B: 16–30)  
**Versión**: 2.0 (Consolidada con Requerimientos de Operación Diaria)  

---

## 1. Arquitectura y Entorno de Despliegue en Google Cloud Platform (GCP)

El sistema opera bajo una arquitectura de **Monolito Modular con soporte PWA/Offline-First**, desplegado como microservicio independiente en **Google Cloud Run**:

| Parámetro GCP | Valor Configurado |
| :--- | :--- |
| **Proyecto GCP ID** | `gen-lang-client-0862587160` |
| **Número de Proyecto** | `349577440002` |
| **Región de Despliegue** | `us-west1` |
| **Servicio Cloud Run** | `cordano-pms-v1` |
| **URL del Servicio** | `https://cordano-pms-v1-349577440002.us-west1.run.app` |
| **Contenedor Docker** | Multi-etapa Node.js 20 Alpine en puerto 8080 (`server.js` standalone) |
| **Sincronización Local** | `IndexedDB` en navegador Chrome con cola de sincronización asíncrona |
| **Proyecto Google Stitch** | `projects/12916038623650348087` (*NUEVO PMS CORDANO - ParkOps Iquique*) |

---

## 2. Definición Canónica de Datos y Formatos

### 2.1 Identificador de Vehículo y Ficha de Ingreso
- **Patente Chilena Nueva**: 4 consonantes + 2 dígitos (`ABCD-12`), validación automática con máscara.
- **Patente Chilena Antigua**: 2 letras + 4 dígitos (`AB-1234`).
- **Patente Extranjera / Libre**: Botón de un clic para ingreso libre de vehículos de Perú, Bolivia o placas diplomáticas.
- **Nombre del Conductor**: Texto obligatorio (`driverName`).
- **Teléfono Móvil**: Prefijo fijo `+569` + 8 dígitos (`driverPhone`).
- **Observaciones de Daños Preexistentes (Opcional)**: Campo de texto libre para blindaje legal (`vehicleDamageNotes`, ej: *"Rayón en puerta copiloto"*).

### 2.2 Estructura del ID de Ticket e Identificación Dual
- **ID Estándar Online**: `TKT-AAAAMMDD-T0X-XXXX`
  - Ejemplo: `TKT-20260924-T01-0014` (Fecha: 24-09-2026, Turno: 01, Correlativo: 0014).
- **ID Contingencia Offline**: Se añade el sufijo **`O`**:
  - Ejemplo: `TKT-20260924-T01-0015O`.
- **Identificación Dual en Ticket Impreso (80mm)**:
  1. **Código QR**: Payload JSON firmado o URL de validación rápida para escaneo con lectores 2D o cámaras móviles.
  2. **Código Lineal (Code 128)**: Código de barras estándar lineal para pistolas láser USB con texto alfanumérico visible debajo.

### 2.3 Máquina de Estados del Ticket
```
[CREADO] ──(Ingreso)──► [EN_RECINTO (In-Parking)]
                               │
                       (Salida solicitada)
                               │
                               ▼
                        [EN_COBRO (POS)]
                               │
             ┌──────────────────┴──────────────────┐
             ▼                                     ▼
    [PAGADO (Liberado)]               [INCIDENCIA / EXCEPCIÓN]
                                      ├─► [DESCUENTO_MENOR (PIN Operador + Motivo)]
                                      ├─► [TICKET_EXTRAVIADO (PIN Admin + Multa)]
                                      └─► [ANULACION_TICKET (PIN Admin + Log)]
```

---

## 3. Especificaciones de Endpoints y Contratos de API (Next.js / Cloud Run)

### 3.1 Apertura de Turno (`POST /api/shifts/open`)
Exige el registro del fondo inicial de sencillo para dar vuelto.
```typescript
// Request Body
{
  operatorId: "OP-7421",
  operatorName: "Braulio Abarca",
  stationId: "GARITA-01",
  initialCashFloat: 30000 // Monto en CLP para dar vuelto
}

// Response (200 OK)
{
  shiftId: "SHF-20260924-01",
  status: "OPEN",
  openedAt: "2026-09-24T08:00:00Z",
  initialCashFloat: 30000
}
```

### 3.2 Registro de Ingreso Transitorio (`POST /api/checkin`)
```typescript
// Request Body
{
  licensePlate: "ABCD-12",
  vehicleType: "AUTO" | "CAMIONETA" | "MOTO",
  driverName: "Juan Pérez",
  driverPhone: "+56987654321",
  vehicleDamageNotes?: "Rayón puerta derecha",
  tariffId: "TAR-MINUTO-AUTO-2026",
  slotId?: "A-07",
  isOffline?: boolean
}

// Response (201 Created)
{
  ticketId: "TKT-20260924-T01-0042",
  enteredAt: "2026-09-24T14:15:32Z",
  qrCodeData: "https://cordano-pms-v1-349577440002.us-west1.run.app/t/TKT-20260924-T01-0042",
  barcodeData: "TKT-20260924-T01-0042",
  assignedSlot: "A-07",
  baseRatePerMinute: 25,
  gracePeriodMinutes: 10
}
```

### 3.3 Submódulo de Servicios Especiales (`POST /api/special-services`)
Maneja vehículos que pernoctan por Noche o empresas bajo Convenio mensual, bloqueando plaza sin entrar a la lista transitoria diaria.
```typescript
// Request Body
{
  serviceType: "NIGHT" | "CONVENIO",
  licensePlate: "KJ-9872",
  driverName: "Transportes Iquique S.A.",
  assignedSlot: "B-22",
  contractId?: "CONV-2026-004",
  fixedAmountCLP: 15000,
  validUntil: "2026-09-25T08:00:00Z"
}

// Response (201 Created)
{
  specialTicketId: "ESP-20260924-B22-01",
  slotStatus: "OCCUPIED_SPECIAL",
  segregatedCategory: "CONVENIO"
}
```

### 3.4 Salida y Cobro (`POST /api/checkout`)
Búsqueda por escaneo de QR, escaneo de código lineal o patente.
```typescript
// Request Body
{
  identifier: "TKT-20260924-T01-0042" | "ABCD-12",
  paymentMethod: "CASH" | "POS_CARD" | "TRANSFER",
  cashTendered?: 10000, // Dinero entregado para calcular vuelto
  discountAmount?: 500,
  operatorPin?: "4421",
  discountReason?: "Convenio verbal gerencia",
  adminPin?: "9988", // Obligatorio si es ticket perdido o anulación
  isLostTicket?: boolean
}

// Response (200 OK)
{
  ticketId: "TKT-20260924-T01-0042",
  exitedAt: "2026-09-24T15:57:32Z",
  totalMinutes: 102,
  graceMinutesDeducted: 10,
  billableMinutes: 92,
  subtotalCLP: 2300,
  discountCLP: 500,
  totalPaidCLP: 1800,
  cashChangeCLP: 8200, // Vuelto exacto
  slotReleased: "A-07",
  receiptUrl: "/api/receipts/TKT-20260924-T01-0042.pdf"
}
```

### 3.5 Cierre de Turno Ciego y Auditoría (`POST /api/shifts/close`)
El cajero declara denominaciones físicas sin ver el saldo esperado del sistema.
```typescript
// Request Body
{
  shiftId: "SHF-20260924-01",
  operatorId: "OP-7421",
  cashDenominations: {
    b20000: 4,  // $80.000
    b10000: 6,  // $60.000
    b5000: 6,   // $30.000
    b2000: 4,   // $8.000
    b1000: 4,   // $4.000
    coins: 500   // $500
  },
  posCardVouchersTotalCLP: 45000,
  transfersTotalCLP: 12000
}

// Response (200 OK)
{
  shiftId: "SHF-20260924-01",
  initialCashFloat: 30000,
  physicalCashCounted: 182500,
  netCashRevenueCalculated: 152500, // Recaudación descontando fondo
  systemExpectedCash: 152500,
  discrepancyCLP: 0,
  discrepancyStatus: "PERFECT_MATCH", // O "SURPLUS" / "DEFICIT"
  closedAt: "2026-09-24T16:00:00Z",
  reportZUrl: "/api/reports/Z-SHF-20260924-01.pdf"
}
```

---

## 4. Reglas de Negocio y Separación de Roles

1. **Incompatibilidad de Caja del Administrador**:
   - La API bloquea llamadas a `/api/shifts/open` si el token JWT pertenece a un usuario con rol exclusivo de `ADMIN`. Para operar garita, se requiere un usuario con rol `OPERATOR`.
2. **Autorización de Excepciones**:
   - `Descuento Menor (< $3.000 CLP o < 20%)`: Exige `operatorPin` y campo obligatorio `discountReason` (>10 caracteres).
   - `Ticket Perdido` o `Anulación de Cobro`: Exige `adminPin`. Si no se provee, retorna `403 Forbidden`.
3. **Persistencia y Resiliencia**:
   - Las transacciones con `isOffline: true` se almacenan en la tabla `offline_queue` de IndexedDB y se despachan en ráfaga con reintentos exponenciales hacia Cloud Run al detectar el evento `window.addEventListener('online')`.
