// Definición canónica de las 11 tablas de la Base de Datos para CORDANO PMS
// Conforme a Ley N° 20.967, Recinto Físico Serrano 447 (Iquique, 30 plazas: Sector A 01-15, Sector B 16-30),
// Flujo de Aprobaciones Express Diferidas, Cierre Ciego con SHA-256 y Almacenamiento Híbrido Firestore / PWA Offline / Google Sheets

export type UserRole = 'ADMINISTRADOR' | 'OPERADOR_VENDEDOR' | 'SUPERVISOR';
export type VehicleCategory = 'AUTO' | 'MOTO' | 'SUV' | 'CAMIONETA' | 'OTRO';
export type SlotState = 'Disponible' | 'Ocupado' | 'Reservado' | 'Bloqueado_Mantencion';
export type TicketState = 'Creado' | 'In-Parking' | 'Pagado' | 'Concluido' | 'Perdido' | 'Anulado' | 'Fuga';
export type PaymentMode = 'EFECTIVO' | 'TARJETA_TRANSBANK' | 'TRANSFERENCIA' | 'CUENTA_CLIENTE';
export type ShiftState = 'Abierto' | 'Cierre_Iniciado' | 'Cerrado' | 'Auditado';
export type CuadraturaState = 'CUADRADA_VERDE' | 'DESCUADRE_MENOR_AMARILLO' | 'DESCUADRE_CRITICO_ROJO';
export type AuditEventType =
  | 'ANULACION_TICKET'
  | 'DESCUENTO_MANUAL'
  | 'COBRO_PARCIAL'
  | 'TICKET_PERDIDO_LEY20967'
  | 'FUGA_VEHICULO'
  | 'APERTURA_PASO_MANUAL'
  | 'CAMBIO_TARIFA'
  | 'DESCUADRE_CAJA'
  | 'APROBACION_EXPRESS_DIFERIDA'
  | 'CIERRE_CAJA_CIEGO'
  | 'APERTURA_TURNO'
  | 'MOVIMIENTO_CAJA_INGRESO'
  | 'MOVIMIENTO_CAJA_RETIRO';
export type AuditCriticality = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type SyncOperationType = 'CHECKIN_OFFLINE' | 'CHECKOUT_OFFLINE' | 'CIERRE_CAJA_OFFLINE' | 'MOVIMIENTO_CAJA_OFFLINE';
export type SyncState = 'PENDIENTE' | 'SINCRONIZADO' | 'CONFLICTO_DETECTADO';

// Desglose de efectivo en moneda nacional chilena (CLP)
export interface DBChileanCashBreakdown {
  monedas_10?: number;
  monedas_50: number;
  monedas_100: number;
  monedas_500: number;
  billetes_1000: number;
  billetes_2000: number;
  billetes_5000: number;
  billetes_10000: number;
  billetes_20000: number;
}

// 1. Tabla: Usuarios / Trabajadores (Users)
export interface DBUser {
  id_usuario: string; // USR-001 o UUID
  nombre_completo: string;
  email: string;
  telefono: string; // Formato +569XXXXXXXX
  rol: UserRole;
  pin_autorizacion: string; // Hash / PIN de 4 dígitos para autorizaciones
  estado_activo: boolean;
  fecha_creacion: string; // ISO 8601
  ultimo_acceso_timestamp: string;
  location_id: string; // 'Serrano 447 - Iquique'
}

// 2. Tabla: Matriz de Permisos y Roles (Roles_Permissions)
export interface DBRolePermission {
  id_permiso: string;
  rol: 'ADMIN' | 'OPERATOR' | 'AUDITOR';
  modulo_acceso: 'POS' | 'LAYOUT' | 'TURNO_CAJA' | 'CLIENTES' | 'REPORTES' | 'AUDITORIA' | 'CONFIGURACION';
  nivel_acceso: 'Solo Lectura' | 'Operación POS' | 'Control Total';
  requiere_pin_supervisor: boolean;
}

// 3. Tabla: Clientes y Cuentas Frecuentes (Customers / ClientAccounts)
export interface DBCustomer {
  id_cliente: string;
  nombre_cliente: string;
  rut_dni?: string; // Formato chileno XX.XXX.XXX-X
  telefono_contacto: string; // +569XXXXXXXX
  email_contacto?: string;
  consentimiento_whatsapp: boolean;
  tipo_cliente: 'Ocasional' | 'Frecuente' | 'Convenio_Mensual';
  patentes_asociadas: string[]; // ['JKLP34', 'ABCD12']
  acumulado_visitas: number;
  saldo_cuenta: number; // Balance en CLP
  ultima_visita_timestamp?: string;
}

// 4. Tabla: Vehículos (Vehicles)
export interface DBVehicle {
  id_vehiculo: string;
  patente_normalizada: string; // Formato chileno en mayúsculas sin guiones ni espacios: JKLP34 o AA1234
  patente_formato_vista: string; // JK·LP·34 o AA-12-34
  es_patente_extranjera: boolean;
  tipo_vehiculo: VehicleCategory;
  id_cliente_dueno?: string;
  es_cliente_frecuente: boolean;
}

// 5. Tabla: Infraestructura y Slots (ParkingSlots)
// Recinto Serrano 447, Iquique: 30 plazas exactas
export interface DBParkingSlot {
  id_slot: string;
  codigo_slot: string; // A-01 a A-15 (Sector A) o B-16 a B-30 (Sector B)
  zona: 'Sector A (Plazas 01-15 - Techado / Frontal)' | 'Sector B (Plazas 16-30 - General / Convenios)';
  estado_slot: SlotState;
  id_vehiculo_actual?: string;
  id_ticket_activo?: string;
  motivo_bloqueo?: string;
}

// 6. Tabla: Tickets y Registro de Estadías (Tickets)
// Conforme a Ley N° 20.967: Prohibición de multas punitivas y cobro de tramos pro-consumidor
export interface DBTicket {
  // A. Identificación y Estado
  id_ticket: string; // UUID
  codigo_ticket: string; // TKT-YYYYMMDD-T0X-0001 (o sufijo -O en offline)
  estado_ticket: TicketState;
  id_vehiculo: string;
  patente_normalizada: string;
  id_slot: string; // A-01 a A-15 o B-16 a B-30
  id_cliente?: string;

  // B. Check-in (Entrada)
  fecha_hora_ingreso: string; // ISO / America/Santiago NTP
  fecha_hora_estimada_salida?: string;
  id_usuario_ingreso: string;
  id_turno_ingreso: string;
  id_version_tarifa_aplicada: string;
  es_operacion_offline: boolean;

  // C. Check-out (Salida) & Cálculos Conformes a Ley N° 20.967
  fecha_hora_salida?: string;
  id_usuario_cobro?: string;
  id_turno_salida?: string;
  duracion_total_minutos?: number;
  minutos_gracia_aplicados?: number; // 15 minutos legales obligatorios
  minutos_facturables?: number;
  modelo_cobro_aplicado?: 'POR_MINUTO' | 'TRAMOS_30_10';
  regla_redondeo_aplicada?: 'Truncamiento legal pro-consumidor (Art. 15 A)' | 'Por minuto efectivo sin redondeo al alza';
  monto_base_calculado?: number;
  monto_descuento_aplicado?: number;
  
  // Tratamiento de Ticket Extraviado según Art. 15 A Ley 20.967
  es_ticket_extraviado?: boolean;
  es_ticket_extraviado_resuelto_por_patente?: boolean; // Liquidado determinando hora fehaciente por búsqueda de patente
  recargo_administrativo_extravio_clp?: number; // Regulado $ 8.000 CLP (registro antifraude y validación diferida al cierre)
  
  monto_total_cobrado?: number; // Formato CLP
  folio_boleta_sii?: string; // Folio DTE Boleta Electrónica
  tipo_dte_sii?: 39 | 41; // 39: Afecta IVA, 41: Exenta
}

// 7. Tabla: Motor de Tarifas y Versiones Inmutables (TariffVersions)
export interface DBTariffVersion {
  id_version_tarifa: string; // UUID inmutable e.g. TARIFF-v2026-001
  nombre_version: string; // 'Tarifa Regulada Ley 20.967 - Serrano 447'
  tipo_vehiculo: VehicleCategory;
  modelo_cobro: 'POR_MINUTO' | 'TRAMOS_30_10'; // Primer tramo 30 min + tramos posteriores de 10 min
  precio_por_minuto: number; // CLP (ej. $ 40 CLP/min auto)
  precio_primer_tramo_30min?: number; // CLP (ej. $ 1.200 CLP)
  precio_tramo_subsiguiente_10min?: number; // CLP (ej. $ 400 CLP)
  minutos_gracia: number; // 15 minutos legales de tolerancia libre
  cobra_desde_minuto_cero: boolean;
  recargo_administrativo_extravio_clp: number; // $ 8.000 CLP fijado antifraude
  regla_redondeo: 'Truncamiento legal pro-consumidor (Art. 15 A)' | 'Por minuto efectivo sin redondeo al alza';
  dias_aplicables: string[];
  hora_desde: string; // '00:00'
  hora_hasta: string; // '23:59'
  multiplicador_recargo: number; // 1.0 (normal), 1.2 (+20% nocturno)
  fecha_inicio_vigencia: string; // ISO 8601
  es_activa: boolean;
  id_admin_creador: string;
}

// 8. Tabla: Transacciones de Pago (Payments)
export interface DBPayment {
  id_pago: string;
  id_ticket: string;
  id_turno: string;
  id_usuario_cajero: string;
  medio_pago: PaymentMode;
  monto_total_pagado: number; // CLP
  monto_efectivo_recibido?: number;
  monto_vuelto_entregado?: number;
  numero_voucher_transbank?: string;
  ultimos_4_digitos_tarjeta?: string;
  folio_boleta_sii?: string;
  timestamp_pago: string;
}

// 9. Tabla: Control de Turnos y Caja Ciega (Shifts / CashDeclarations)
export interface DBShift {
  // A. Apertura Obligatoria ($ 50.000 CLP)
  id_turno: string;
  id_usuario_operador: string;
  nombre_operador: string;
  dispositivo_caja_id: string;
  fecha_hora_apertura: string;
  fondo_inicial_efectivo: number; // Exactamente $ 50.000 CLP declarados al inicio
  desglose_efectivo_inicial?: DBChileanCashBreakdown;
  vouchers_heredados_tarjeta: number;
  estado_turno: ShiftState;

  // B. Declaración Ciega al Cierre (Arqueo Ciego en 3 pasos)
  fecha_hora_cierre?: string;
  fondo_dejado_en_gaveta?: number; // $ 50.000 CLP que quedan en gaveta para el siguiente turno
  sobre_entregado_deposito?: number; // Recaudación en sobre entregado a administración
  declarado_efectivo_fisico?: number;
  declarado_tarjetas_vouchers?: number;
  declarado_transferencias?: number;
  declarado_cuenta_cliente?: number;
  desglose_efectivo_cierre?: DBChileanCashBreakdown;

  // C. Totales Sistema, Cuadratura & Tolerancia de $ 2.000 CLP
  esperado_efectivo_sistema?: number;
  esperado_tarjetas_sistema?: number;
  esperado_transferencias_sistema?: number;
  esperado_total_sistema?: number;
  diferencia_efectivo?: number;
  diferencia_total_caja?: number;
  tolerancia_maxima_descuadre_clp: number; // $ 2.000 CLP
  es_descuadre_critico?: boolean;
  estado_cuadratura?: CuadraturaState;
  justificacion_operador?: string;

  // D. Validación en Lote de Aprobaciones Express Diferidas y Sellado SHA-256
  aprobaciones_expres_validadas?: {
    id_aprobacion: string;
    tipo: 'DESCUENTO' | 'TICKET_PERDIDO' | 'ANULACION' | 'OTRO';
    descripcion: string;
    monto: number;
    patente?: string;
    id_ticket?: string;
    estado: 'pendiente' | 'aprobada' | 'rechazada';
    fecha_solicitud: string;
  }[];
  supervisor_validador_pin?: string;
  supervisor_nombre?: string;
  hash_sha256_cierre?: string; // Sello criptográfico definitivo inalterable

  // E. Emisión Física A4 y Firmas
  firmado_copia_garita?: boolean;
  firmado_copia_administracion?: boolean;
}

// 10. Tabla: Bitácora de Auditoría e Incidencias (AuditTrail / Events)
export interface DBAuditTrail {
  id_evento_auditoria: string;
  timestamp: string; // Servidor NTP
  tipo_evento: AuditEventType;
  nivel_criticidad: AuditCriticality;
  id_usuario_solicitante: string;
  nombre_usuario_solicitante: string;
  motivo_justificacion: string;
  entidad_afectada: 'TICKET' | 'SLOT' | 'CAJA' | 'TARIFA' | 'USUARIO';
  id_entidad_afectada: string;
  valor_anterior_json?: string;
  valor_nuevo_json?: string;
  origen_conexion: 'EN_LINEA' | 'OPERACION_LOCAL_OFFLINE';
  
  // Flujo de Aprobación Express Diferida
  es_aprobacion_express_diferida?: boolean;
  aprobada_en_cierre_por_supervisor?: boolean;
  supervisor_aprobador_nombre?: string;
  supervisor_pin_hash?: string;
  hash_integridad?: string;
}

// 11. Tabla: Sincronización PWA Offline (SyncQueue)
export interface DBSyncQueue {
  id_local_sync: string;
  idempotency_key: string;
  tipo_operacion: SyncOperationType;
  coleccion_destino: string;
  documento_id: string;
  payload_json: string;
  timestamp_creacion_local: string;
  estado_sincronizacion: SyncState;
  reintentos: number;
  mensaje_error_conflicto?: string;
}

// Metadata de las 11 hojas para exportación o vinculación con Google Sheets
export interface SheetMetadata {
  sheetName: string;
  title: string;
  description: string;
  columns: string[];
}

export const CORDANO_11_TABLES_SCHEMA: Record<string, SheetMetadata> = {
  Users: {
    sheetName: '1_USUARIOS',
    title: 'Usuarios y Trabajadores',
    description: 'Personal con acceso al sistema, roles RBAC y PIN de autorización (Serrano 447)',
    columns: ['id_usuario', 'nombre_completo', 'email', 'telefono', 'rol', 'pin_autorizacion', 'estado_activo', 'fecha_creacion', 'ultimo_acceso_timestamp', 'location_id'],
  },
  RolesPermissions: {
    sheetName: '2_ROLES_PERMISOS',
    title: 'Matriz de Roles y Permisos',
    description: 'Niveles de acceso y validación requerida de Supervisor por módulo',
    columns: ['id_permiso', 'rol', 'modulo_acceso', 'nivel_acceso', 'requiere_pin_supervisor'],
  },
  Customers: {
    sheetName: '3_CLIENTES',
    title: 'Clientes y Cuentas Frecuentes',
    description: 'Directorio de convenios comerciales, abonados mensuales y saldos prepago',
    columns: ['id_cliente', 'nombre_cliente', 'rut_dni', 'telefono_contacto', 'email_contacto', 'consentimiento_whatsapp', 'tipo_cliente', 'patentes_asociadas', 'acumulado_visitas', 'saldo_cuenta', 'ultima_visita_timestamp'],
  },
  Vehicles: {
    sheetName: '4_VEHICULOS',
    title: 'Registro de Vehículos',
    description: 'Catálogo de patentes normalizadas en mayúsculas y categorías de cobro',
    columns: ['id_vehiculo', 'patente_normalizada', 'patente_formato_vista', 'es_patente_extranjera', 'tipo_vehiculo', 'id_cliente_dueno', 'es_cliente_frecuente'],
  },
  ParkingSlots: {
    sheetName: '5_SLOTS',
    title: 'Infraestructura de 30 Slots',
    description: 'Mapa físico Serrano 447 (Sector A 01-15 techado frontal, Sector B 16-30 general)',
    columns: ['id_slot', 'codigo_slot', 'zona', 'estado_slot', 'id_vehiculo_actual', 'id_ticket_activo', 'motivo_bloqueo'],
  },
  Tickets: {
    sheetName: '6_TICKETS',
    title: 'Tickets y Estadías Transaccionales',
    description: 'Estadías vehiculares reguladas por Ley 20.967: 15 min de gracia, sin multas punitivas',
    columns: ['id_ticket', 'codigo_ticket', 'estado_ticket', 'id_vehiculo', 'patente_normalizada', 'id_slot', 'id_cliente', 'fecha_hora_ingreso', 'fecha_hora_estimada_salida', 'id_usuario_ingreso', 'id_turno_ingreso', 'id_version_tarifa_aplicada', 'es_operacion_offline', 'fecha_hora_salida', 'id_usuario_cobro', 'id_turno_salida', 'duracion_total_minutos', 'minutos_gracia_aplicados', 'minutos_facturables', 'monto_base_calculado', 'monto_descuento_aplicado', 'es_ticket_extraviado_resuelto_por_patente', 'recargo_administrativo_extravio_clp', 'monto_total_cobrado', 'folio_boleta_sii'],
  },
  TariffVersions: {
    sheetName: '7_TARIFAS',
    title: 'Motor de Tarifas Versionadas',
    description: 'Tarifas inmutables por minuto y tramos 30/10, recargo administrativo $ 8.000 CLP y gracia de 15 min',
    columns: ['id_version_tarifa', 'nombre_version', 'tipo_vehiculo', 'modelo_cobro', 'precio_por_minuto', 'minutos_gracia', 'cobra_desde_minuto_cero', 'recargo_administrativo_extravio_clp', 'regla_redondeo', 'dias_aplicables', 'hora_desde', 'hora_hasta', 'multiplicador_recargo', 'fecha_inicio_vigencia', 'es_activa', 'id_admin_creador'],
  },
  Payments: {
    sheetName: '8_PAGOS',
    title: 'Transacciones de Pago (POS)',
    description: 'Flujos monetarios en caja garita, váucheres Transbank y boletas electrónicas SII',
    columns: ['id_pago', 'id_ticket', 'id_turno', 'id_usuario_cajero', 'medio_pago', 'monto_total_pagado', 'monto_efectivo_recibido', 'monto_vuelto_entregado', 'numero_voucher_transbank', 'ultimos_4_digitos_tarjeta', 'folio_boleta_sii', 'timestamp_pago'],
  },
  Shifts: {
    sheetName: '9_TURNOS_CAJA',
    title: 'Control de Turnos y Arqueo Ciego',
    description: 'Aperturas obligatorias ($ 50.000 CLP), cierres ciegos, tolerancia $ 2.000 CLP y sellado SHA-256',
    columns: ['id_turno', 'id_usuario_operador', 'dispositivo_caja_id', 'fecha_hora_apertura', 'fondo_inicial_efectivo', 'vouchers_heredados_tarjeta', 'estado_turno', 'fecha_hora_cierre', 'fondo_dejado_en_gaveta', 'sobre_entregado_deposito', 'declarado_efectivo_fisico', 'declarado_tarjetas_vouchers', 'declarado_transferencias', 'esperado_efectivo_sistema', 'esperado_total_sistema', 'diferencia_efectivo', 'diferencia_total_caja', 'estado_cuadratura', 'hash_sha256_cierre', 'supervisor_nombre'],
  },
  AuditTrail: {
    sheetName: '10_AUDITORIA',
    title: 'Bitácora de Auditoría Inalterable',
    description: 'Registro append-only inmutable de incidencias y aprobaciones express diferidas',
    columns: ['id_evento_auditoria', 'timestamp', 'tipo_evento', 'nivel_criticidad', 'id_usuario_solicitante', 'motivo_justificacion', 'entidad_afectada', 'id_entidad_afectada', 'es_aprobacion_express_diferida', 'aprobada_en_cierre_por_supervisor', 'supervisor_aprobador_nombre', 'hash_integridad'],
  },
  SyncQueue: {
    sheetName: '11_SYNC_OFFLINE',
    title: 'Cola de Sincronización PWA Offline',
    description: 'Transacciones locales pendientes de sincronizar con Firestore con clave de idempotencia',
    columns: ['id_local_sync', 'idempotency_key', 'tipo_operacion', 'coleccion_destino', 'documento_id', 'timestamp_creacion_local', 'estado_sincronizacion', 'reintentos', 'mensaje_error_conflicto'],
  },
};
