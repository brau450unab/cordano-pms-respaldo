# Documento Maestro Canónico V5.0: Centralización, Reestructuración & Pipeline Idea-OS

**Plataforma**: ParkOps PMS & ERP  
**Organización**: Cordano Inversiones Inmobiliarias Ltda.  
**Ubicación Física**: Calle Serrano 447, Iquique, Región de Tarapacá, Chile (~700 m², 30 plazas + 5 sobrecupo)  
**Fecha de Emisión**: Octubre 2026 | **Versión**: 5.0 (Definición Oficial Aprobada por el Usuario)  
**Metodología**: Framework `/idea-os` (Triage `T3 · S3`) & Consolidación Canónica de Documentación  

---

## 1. Alineación Estratégica & Directrices del Usuario (Idea-OS Fases 1 & 2)

Tras la investigación y entrevista interactiva de requerimientos, se establecen los 4 pilares fundamentales que rigen la nueva arquitectura del sistema:

1. **Interfaz Limpia, Sobria y Sin Distracciones Operativas**:
   - Se eliminan por completo adornos cosméticos excesivos, degradados pesados y pantallas decorativas que ralentizan el trabajo de garita.
   - La interfaz adopta un enfoque **funcional puro y de alta densidad de información**, donde cada botón, tabla y formulario responde a una tarea operacional directa.
2. **Motor de Persistencia: Firebase Firestore con Soporte Offline Nativo**:
   - Base de datos NoSQL en la nube con escucha en tiempo real (`onSnapshot`) y persistencia local automática (`persistentLocalCache` / IndexedDB).
   - Si se corta el internet en Iquique, el operador sigue registrando ingresos, salidas y cobros en local; al regresar la red, Firestore sincroniza automáticamente sin pérdida de datos.
3. **Flujo Operacional y Control Riguroso del Turno**:
   - Flujo lineal, rápido y sin ambigüedades: **Apertura de Turno → Control Vehicular (Ingreso, Patio Activo, Salida/Cobro) → Arqueo Ciego Estricto con Sello SHA-256 → Reporte de Turno Detallado**.
   - Reportería exhaustiva de ingresos, sesiones activas, tickets liquidados, medios de pago y desglose contable (Neto + IVA 19% DTE).
4. **Comprobantes Internos y Tributación DTE / SII**:
   - El ticket térmico de 80mm (impreso con código QR y Code 128) es **exclusivamente de control funcional interno de estadía**.
   - El cobro formal se asocia a la emisión de comprobante tributario: boleta electrónica emitida por el terminal POS bancario (Transbank/Redelcom) o boleta/DTE de servicio ante el SII, registrando el desglose impositivo en el libro de ventas del sistema.

---

## 2. Mapa y Consolidación de Documentación Existente en `docs/`

Se consolidaron más de 25 documentos dispersos en la carpeta `docs/`, absorbiendo sus especificaciones y eliminando contradicciones históricas:

| Documento Fuente en `docs/` | Estado en la Nueva Estructura | Contenido Extraído y Consolidado |
| :--- | :--- | :--- |
| `PRD_SISTEMA_DE_PARKING.md` | **Consolidado en V5.0** | Capacidad (30 plazas + 5 sobrecupo), tarifario oficial ($25 sedán, $30 SUV, $15 moto), 0 min de gracia, multa extravío $8.000, 13 endpoints API. |
| `product_charter.md` | **Consolidado en V5.0** | Misión, JTBD de garita y administración, prevención de fugas de caja, control de tiempos de espera en hora punta. |
| `cordano_operations_erp_official_prd.md` | **Consolidado en V5.0** | Personas (Patricia: supervisión contable; Carlos: operador garita), reglas anti-passback, control de turnos. |
| `esquema_de_base_de_datos_cordano_pms.md` | **Migrado a Firestore** | Transacciones de vehículos, turnos de caja y clientes convenios migrados a colecciones NoSQL tipadas. |
| `cordano-database.architecture.json` | **Migrado a Firestore** | Estructura de entidades relacionales convertida a modelo documental con subcolecciones y referencias atómicas. |
| `user_flow.md` y `esquema_operativo_parkops...` | **Consolidado en V5.0** | Fases operativas de Check-In, Estadía, Check-Out, Arqueo Ciego y resolución de excepciones de garita. |
| `FLUJO_OPERATIVO_OPERADOR_PARKOPS.md` | **Consolidado en V5.0** | Checklist de apertura de turno, atajos de teclado F1-F9, cuadratura física de sencillo. |
| `FLUJO_FUNCIONES_ADMINISTRADOR_PARKOPS.md` | **Consolidado en V5.0** | Incompatibilidad de caja para el Administrador (Regla #7), auditoría Z, reportes y convenios. |
| `[ARCHIVADO]_*.md` (8 archivos) | **Archivados permanentemente** | Borradores de Notion, notas de minutas y versiones previas superadas por la V5.0. |

---

## 3. Arquitectura de la Plataforma Reestructurada

```mermaid
flowchart TD
    subgraph CLIENT_TIER["1. Frontend Operativo Garita & Admin (Next.js 16 / TypeScript)"]
        UI_AUTH["Apertura de Turno & Auth\n• Declaración Fondo $50.000\n• PIN Operador / PIN Admin"]
        UI_POS["Cockpit Operativo Garita\n• [F2] Ingreso Rápido <3s\n• Patio Activo (30 Plazas)\n• [F4] Salida, Cobro y Vuelto"]
        UI_MAP["Plano 30 Bahías Serrano 447\n• Estado Semántico en Vivo\n• Alertas de Sobreestadía"]
        UI_CONV["Submódulo en Paralelo\n• Convenios Mensuales ($75k)\n• Pernocta Noche ($8k)"]
        UI_CLOSE["Arqueo Ciego en 3 Pasos\n• Conteo Físico sin Vista Previa\n• Sello Criptográfico SHA-256"]
        UI_REPORTS["Centro de Reportes Detallados\n• Reporte de Turno / Corte Z\n• Desglose DTE / IVA 19%\n• Exportación CSV / Auditoría"]
    end

    subgraph FIRESTORE_TIER["2. Persistencia en Tiempo Real (Firebase Firestore + Cache Local)"]
        SDK["Firebase Web SDK v11\n(persistentLocalCache / IndexedDB)"]
        COL_SHIFTS["Colección: shifts\nTurnos, arqueos, diferencias y hash SHA-256"]
        COL_TICKETS["Colección: transactions\nTickets activos, cobrados, tarifas y patentes"]
        COL_SLOTS["Colección: slots\n30 plazas físicas + 5 sobrecupo en tiempo real"]
        COL_CLIENTS["Colección: clients_agreements\nConvenios mensuales y pernocta en paralelo"]
        COL_AUDIT["Colección: audit_trail\nBitácora inmutable antifraude con PIN y severidad"]
    end

    subgraph HARDWARE_TIER["3. Integración de Hardware & Dispositivos de Garita"]
        PRINTER["Impresora Térmica 80mm\n(Ticket Funcional con QR 2D + Code 128)"]
        DRAWER["Gaveta Metálica RJ11\n(Apertura automática por pulso de cobro)"]
        SCANNER["Lector Óptico 2D/1D\n(Lectura instantánea de ticket en salida)"]
        POS_TBK["Terminal POS Bancario\n(Boleta electrónica con IVA para tarjetas)"]
    end

    UI_POS <--> SDK
    UI_MAP <--> SDK
    UI_CLOSE <--> SDK
    UI_CONV <--> SDK
    UI_REPORTS <--> SDK
    UI_AUTH <--> SDK

    SDK <--> COL_SHIFTS
    SDK <--> COL_TICKETS
    SDK <--> COL_SLOTS
    SDK <--> COL_CLIENTS
    SDK <--> COL_AUDIT

    UI_POS --> PRINTER
    UI_POS --> DRAWER
    UI_POS <-- SCANNER
    UI_POS <--> POS_TBK
```

---

## 4. Esquema de Base de Datos: Firebase Firestore (Colecciones NoSQL)

Para garantizar consistencia, consultas en tiempo real y funcionamiento offline automático en garita, el modelo de datos se estructura en 5 colecciones principales:

### Colección 1: `shifts` (Control y Auditoría de Turnos)
```typescript
interface ShiftDocument {
  id: string;                      // ID único (ej. "shift_20261008_01")
  shiftNumber: number;             // Correlativo numérico secuencial
  operatorId: string;              // ID del operador de turno
  operatorName: string;            // Nombre legible (ej. "Juan Pérez")
  openedAt: Timestamp;             // Fecha/hora de apertura
  closedAt?: Timestamp;            // Fecha/hora de cierre
  initialCash: number;             // Fondo inicial obligatorio (ej. 50000 CLP)
  status: 'OPEN' | 'CLOSED';       // Estado del turno
  // Cierre Ciego:
  declaredCash?: number;           // Efectivo físico declarado por el operador
  declaredCards?: number;          // Vouchers Transbank declarados
  declaredTransfers?: number;      // Transferencias verificadas declaradas
  systemCash?: number;             // Efectivo calculado por tickets cobrados
  systemCards?: number;            // Monto de tarjetas calculado por sistema
  systemTransfers?: number;        // Monto transferencias calculado
  totalRevenue?: number;           // Recaudación neta total del turno
  varianceCash?: number;           // Diferencia (Declarado - Sistema)
  varianceStatus?: 'CUADRADO' | 'SOBRANTE' | 'FALTANTE';
  sha256Seal?: string;             // Firma criptográfica SHA-256 del cierre
  supervisorNotes?: string;        // Justificación de descuadre si existe
}
```

### Colección 2: `transactions` (Tickets Vehiculares y Cobros)
```typescript
interface TransactionDocument {
  id: string;                      // ID o ticketCode (ej. "TKT-20261008-T01-0142")
  ticketCode: string;              // Código legible impreso en 80mm
  plateNumber: string;             // Patente normalizada (ej. "BBCL10")
  vehicleCategory: 'SEDAN' | 'SUV' | 'MOTO'; // Tipo de vehículo
  slotId: number;                  // Número de plaza (1..30 o sobrecupo)
  slotCode: string;                // Código de plaza (ej. "A-04")
  shiftId: string;                 // Referencia al turno activo
  operatorId: string;              // Operador que emitió el ticket
  checkInTime: Timestamp;          // Fecha y hora exacta de entrada
  checkOutTime?: Timestamp;         // Fecha y hora exacta de salida
  durationMinutes?: number;        // Duración calculada en minutos (0 min gracia)
  ratePerMinute: number;           // Tarifa aplicada ($25, $30 o $15)
  baseAmount?: number;             // Monto base calculado (mínimo 30 min)
  discountAmount?: number;         // Descuento autorizado (PIN Operador)
  discountReason?: string;         // Justificación del descuento (>10 car.)
  penaltyAmount?: number;          // Multa por ticket extraviado ($8.000, PIN Admin)
  totalAmount?: number;            // Total final cobrado al cliente (CLP)
  // Desglose Fiscal / DTE:
  netAmount?: number;              // Monto neto sin IVA (Monto / 1.19)
  ivaAmount?: number;              // Impuesto al Valor Agregado 19%
  paymentMethod?: 'EFECTIVO' | 'TARJETA_POS' | 'TRANSFERENCIA' | 'CONVENIO';
  cashReceived?: number;           // Dinero entregado por el cliente
  cashChange?: number;             // Vuelto exacto devuelto en garita
  status: 'ACTIVO' | 'PAGADO' | 'ANULADO';
  isOffline: boolean;              // True si fue emitido con sufijo "O"
  createdAt: Timestamp;
}
```

### Colección 3: `slots` (Matriz de 30 Bahías + 5 Sobrecupo en Tiempo Real)
```typescript
interface SlotDocument {
  id: number;                      // 1 a 30 (y 31-35 para sobrecupos SC-01..05)
  code: string;                    // "A-01".."A-15", "B-16".."B-30", "SC-01".."SC-05"
  sector: 'A' | 'B' | 'SOBRECUPO';
  type: 'REGULAR' | 'PMR' | 'EV' | 'RESERVADO_CONVENIO';
  status: 'DISPONIBLE' | 'OCUPADO' | 'RESERVADO' | 'BLOQUEADO';
  currentPlate?: string;           // Matrícula del vehículo actualmente ocupando la plaza
  currentTicketId?: string;        // ID de la transacción activa
  entryTime?: Timestamp;           // Momento en que ocupó la plaza
  isLongStay?: boolean;            // Alerta visual de sobreestadía (>= 120 min)
}
```

### Colección 4: `clients_agreements` (Convenios Mensuales y Pernocta en Paralelo)
```typescript
interface ClientAgreementDocument {
  id: string;                      // UUID o código de convenio
  rut: string;                     // RUT chileno (ej. "76.842.190-4")
  clientName: string;              // Empresa o titular (ej. "Notaría Serrano Iquique")
  phoneWhatsapp: string;           // Teléfono de contacto
  plateNumber: string;             // Patente titular asociada
  agreementType: 'MENSUAL_24_7' | 'NOCHE_PERNOCTA';
  assignedSlotId: number;          // Plaza bloqueada fija (ej. 29 para B-29)
  monthlyFee: number;              // Tarifa mensual ($75.000) o noche ($8.000)
  status: 'AL_DIA' | 'VENCIDO' | 'BLOQUEADO';
  startDate: Timestamp;
  endDate: Timestamp;
  notes?: string;
}
```

### Colección 5: `audit_trail` (Bitácora Inmutable Antifraude)
```typescript
interface AuditTrailDocument {
  id: string;                      // ID autogenerado
  timestamp: Timestamp;            // Sello de tiempo exacto
  shiftId: string;                 // Turno en curso
  userId: string;                  // Usuario responsable
  userName: string;
  actionType: 'DESCUENTO_AUTORIZADO' | 'TICKET_EXTRAVIADO_MULTA' | 'TICKET_ANULADO' | 'APERTURA_MANUAL_BARRERA' | 'CIERRE_TURNO_DESCUADRE';
  severity: 'VERDE' | 'ROJO' | 'AMBAR';
  justification: string;           // Justificación escrita obligatoria (>10 caracteres)
  authorizedByPin: string;         // 'OPERADOR' o 'ADMIN'
  metadata: Record<string, any>;   // Datos asociados (patente, montos, ticketCode)
}
```

---

## 5. Reestructuración de Vistas del Frontend (Arquitectura Limpia)

Para cumplir con la solicitud del usuario de **eliminar elementos decorativos que distraen**, la aplicación se consolida en 5 módulos operativos limpios y directos:

1. **Módulo 1: Control de Turno y Garita POS (`/pos`) [CORE]**:
   - Cabecera sobria de turno con tiempo transcurrido, fondo inicial y recaudación acumulada.
   - Pestaña 1: **Ingreso Vehicular**: Campo de patente en autofoco, selector rápido de categoría (`Sedán`, `SUV`, `Moto`), asignación automática de bahía y emisión de ticket en `< 3 segundos`.
   - Pestaña 2: **Patio Activo**: Listado y matriz de vehículos actualmente estacionados, con tiempo transcurrido en minutos y valor acumulado en CLP.
   - Pestaña 3: **Salida y Cobro**: Búsqueda instantánea por ticket o patente, cálculo de tiempo y valor, calculadora de vuelto destacada y selección de medio de pago.
2. **Módulo 2: Plano Físico de 30 Plazas (`/plano`)**:
   - Representación esquemática clara de las 30 bahías de Serrano 447 (Sectores A y B) con código semántico de colores (Verde: Libre, Gris: Ocupado, Azul: Convenio, Rojo: Sobrestadía).
3. **Módulo 3: Submódulo de Convenios y Pernocta en Paralelo (`/convenios`)**:
   - Registro y administración de empresas abonadas y vehículos de noche, bloqueando cupos en la matriz sin contaminar la contabilidad del turno diario.
4. **Módulo 4: Arqueo Ciego y Fin de Turno (`/arqueo`)**:
   - Formulario ciego en 3 pasos: declaración de efectivo físico, cálculo de diferencia, firma criptográfica SHA-256 y emisión del Corte Z fiscal.
5. **Módulo 5: Reportes Detallados y Auditoría (`/reportes`)**:
   - **Historial de Turnos y Cortes Z**: Listado completo de cierres con sus diferencias y firmas.
   - **Reporte Detallado de Transacciones**: Entradas, salidas, duraciones, métodos de pago y desglose tributario (Neto + IVA 19%).
   - **Bitácora Antifraude**: Registro cronológico de excepciones con filtro por severidad (Verde / Rojo).
   - **Exportación CSV**: Descarga inmediata de planillas para auditoría contable.

---

## 6. Procedimientos Operativos Estándar (SOPs) de Garita Serrano 447

- **SOP-01 (Apertura de Turno)**:
  - El operador ingresa su PIN personal (4 dígitos).
  - Declara el fondo inicial obligatorio de **`$50.000 CLP`** para sencillo de vuelto.
  - Verifica que la impresora térmica tenga papel de 80mm y que la gaveta RJ11 responda.
- **SOP-02 (Extravío de Ticket)**:
  - Si el cliente pierde el ticket, no puede retirarse sin autorización.
  - El operador solicita padrón vehicular y carnet de identidad.
  - El Administrador digita su PIN de autorización (`9999`) y se aplica la multa reglamentaria de **`$8.000 CLP`**, quedando registrado en la bitácora antifraude con etiqueta roja.
- **SOP-03 (Descuentos Comerciales)**:
  - Descuentos por convenios comerciales de paso exigen PIN de Operador (`1234`) y justificación escrita obligatoria de más de 10 caracteres (etiqueta verde).
- **SOP-04 (Contingencia por Corte de Internet)**:
  - Si se interrumpe la conexión en Iquique, el software opera con el almacenamiento local persistente de Firebase/IndexedDB.
  - Se continúan emitiendo tickets y cobrando normalmente. Al regresar la conexión, las transacciones pendientes se sincronizan automáticamente.
