// Definición canónica de las 11 tablas de la Base de Datos para CORDANO PMS
// Compatible con Google Sheets, PostgreSQL / Prisma y almacenamiento local IndexedDB / PWA

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
  | 'TICKET_PERDIDO'
  | 'FUGA_VEHICULO'
  | 'APERTURA_PASO_MANUAL'
  | 'CAMBIO_TARIFA'
  | 'DESCUADRE_CAJA';
export type AuditCriticality = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type SyncOperationType = 'CHECKIN_OFFLINE' | 'CHECKOUT_OFFLINE' | 'CIERRE_CAJA_OFFLINE';
export type SyncState = 'PENDIENTE' | 'SINCRONIZADO' | 'CONFLICTO_DETECTADO';

// 1. Tabla: Usuarios / Trabajadores (Users)
export interface DBUser {
  id_usuario: string; // USR-001 o UUID
  nombre_completo: string;
  email: string;
  telefono: string; // Formato +569XXXXXXXX
  rol: UserRole;
  pin_autorizacion: string; // Hash / PIN para autorizar
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
  requiere_pin_admin: boolean;
}

// 3. Tabla: Clientes y Cuentas Frecuentes (Customers / ClientAccounts)
export interface DBCustomer {
  id_cliente: string;
  nombre_cliente: string;
  rut_dni?: string;
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
  patente_normalizada: string; // Sin guiones ni espacios en Mayúsculas: JKLP34
  patente_formato_vista: string; // JK·LP·34 o AA-12-34
  es_patente_extranjera: boolean;
  tipo_vehiculo: VehicleCategory;
  id_cliente_dueno?: string;
  es_cliente_frecuente: boolean;
}

// 5. Tabla: Infraestructura y Slots (ParkingSlots)
export interface DBParkingSlot {
  id_slot: string;
  codigo_slot: string; // A-01, B-05, C-10
  zona: 'Zona A (Techado)' | 'Zona B (General)' | 'Zona C (Preferencial)';
  estado_slot: SlotState;
  id_vehiculo_actual?: string;
  id_ticket_activo?: string;
  motivo_bloqueo?: string;
}

// 6. Tabla: Tickets y Registro de Estadías (Tickets)
export interface DBTicket {
  // A. Identificación y Estado
  id_ticket: string; // UUID
  codigo_ticket: string; // TKT-YYYYMMDD-T0X-0001 (o con sufijo -O en offline)
  estado_ticket: TicketState;
  id_vehiculo: string;
  patente_normalizada: string;
  id_slot: string;
  id_cliente?: string;

  // B. Check-in (Entrada)
  fecha_hora_ingreso: string; // ISO / America/Santiago NTP
  fecha_hora_estimada_salida?: string;
  id_usuario_ingreso: string;
  id_turno_ingreso: string;
  id_version_tarifa_aplicada: string;
  es_operacion_offline: boolean;

  // C. Check-out (Salida) & Cálculos
  fecha_hora_salida?: string;
  id_usuario_cobro?: string;
  id_turno_salida?: string;
  duracion_total_minutos?: number;
  minutos_gracia_aplicados?: number;
  minutos_facturables?: number;
  monto_base_calculado?: number;
  monto_descuento_aplicado?: number;
  monto_multa_ticket_perdido?: number;
  monto_total_cobrado?: number;
}

// 7. Tabla: Motor de Tarifas y Versiones (TariffVersions)
export interface DBTariffVersion {
  id_version_tarifa: string;
  nombre_version: string; // 'Tarifa Estándar v3 - Iquique'
  tipo_vehiculo: VehicleCategory;
  precio_por_minuto: number; // CLP
  minutos_gracia: number; // Ej: 10 min
  cobra_desde_minuto_cero: boolean;
  monto_multa_ticket_perdido: number; // Ej: 12.000 CLP
  regla_redondeo: 'Minuto hacia arriba' | '$10' | '$50' | '$100';
  dias_aplicables: string[];
  hora_desde: string; // '00:00'
  hora_hasta: string; // '23:59'
  multiplicador_recargo: number; // 1.0 (normal), 1.2 (+20% nocturno)
  fecha_inicio_vigencia: string;
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
  // A. Apertura
  id_turno: string;
  id_usuario_operador: string;
  dispositivo_caja_id: string;
  fecha_hora_apertura: string;
  fondo_inicial_efectivo: number;
  vouchers_heredados_tarjeta: number;
  estado_turno: ShiftState;

  // B. Declaración Ciega
  fecha_hora_cierre?: string;
  declarado_efectivo_fisico?: number;
  declarado_tarjetas_vouchers?: number;
  declarado_transferencias?: number;
  declarado_cuenta_cliente?: number;

  // C. Totales Sistema & Cuadratura
  esperado_efectivo_sistema?: number;
  esperado_tarjetas_sistema?: number;
  esperado_transferencias_sistema?: number;
  esperado_total_sistema?: number;
  diferencia_efectivo?: number;
  diferencia_total_caja?: number;
  estado_cuadratura?: CuadraturaState;
  justificacion_operador?: string;
}

// 10. Tabla: Bitácora de Auditoría e Incidencias (AuditTrail / Events)
export interface DBAuditTrail {
  id_evento_auditoria: string;
  timestamp: string; // Servidor NTP
  tipo_evento: AuditEventType;
  nivel_criticidad: AuditCriticality;
  id_usuario_solicitante: string;
  id_admin_aprobador?: string;
  motivo_justificacion: string;
  entidad_afectada: 'TICKET' | 'SLOT' | 'CAJA' | 'TARIFA' | 'USUARIO';
  id_entidad_afectada: string;
  valor_anterior_json?: string;
  valor_nuevo_json?: string;
  origen_conexion: 'EN_LINEA' | 'OPERACION_LOCAL_OFFLINE';
  estado_revision: 'PENDIENTE' | 'REVISADO' | 'RESUELTO';
}

// 11. Tabla: Sincronización PWA Offline (SyncQueue)
export interface DBSyncQueue {
  id_local_sync: string;
  idempotency_key: string;
  tipo_operacion: SyncOperationType;
  payload_json: string;
  timestamp_creacion_local: string;
  estado_sincronizacion: SyncState;
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
    description: 'Personal con acceso al sistema y PIN de autorización',
    columns: ['id_usuario', 'nombre_completo', 'email', 'telefono', 'rol', 'pin_autorizacion', 'estado_activo', 'fecha_creacion', 'ultimo_acceso_timestamp', 'location_id'],
  },
  RolesPermissions: {
    sheetName: '2_ROLES_PERMISOS',
    title: 'Matriz de Roles y Permisos',
    description: 'Niveles de acceso y flags de PIN administrativo por módulo',
    columns: ['id_permiso', 'rol', 'modulo_acceso', 'nivel_acceso', 'requiere_pin_admin'],
  },
  Customers: {
    sheetName: '3_CLIENTES',
    title: 'Clientes y Cuentas Frecuentes',
    description: 'Directorio de abonados, convenios y saldos',
    columns: ['id_cliente', 'nombre_cliente', 'rut_dni', 'telefono_contacto', 'email_contacto', 'consentimiento_whatsapp', 'tipo_cliente', 'patentes_asociadas', 'acumulado_visitas', 'saldo_cuenta', 'ultima_visita_timestamp'],
  },
  Vehicles: {
    sheetName: '4_VEHICULOS',
    title: 'Registro de Vehículos',
    description: 'Catálogo de patentes normalizadas en mayúsculas y tipos',
    columns: ['id_vehiculo', 'patente_normalizada', 'patente_formato_vista', 'es_patente_extranjera', 'tipo_vehiculo', 'id_cliente_dueno', 'es_cliente_frecuente'],
  },
  ParkingSlots: {
    sheetName: '5_SLOTS',
    title: 'Infraestructura de 30 Slots',
    description: 'Mapa físico de espacios del recinto de Iquique',
    columns: ['id_slot', 'codigo_slot', 'zona', 'estado_slot', 'id_vehiculo_actual', 'id_ticket_activo', 'motivo_bloqueo'],
  },
  Tickets: {
    sheetName: '6_TICKETS',
    title: 'Tickets y Estadías Transaccionales',
    description: 'Ciclo de vida completo del ticket con tarifas congeladas y minutos',
    columns: ['id_ticket', 'codigo_ticket', 'estado_ticket', 'id_vehiculo', 'patente_normalizada', 'id_slot', 'id_cliente', 'fecha_hora_ingreso', 'fecha_hora_estimada_salida', 'id_usuario_ingreso', 'id_turno_ingreso', 'id_version_tarifa_aplicada', 'es_operacion_offline', 'fecha_hora_salida', 'id_usuario_cobro', 'id_turno_salida', 'duracion_total_minutos', 'minutos_gracia_aplicados', 'minutos_facturables', 'monto_base_calculado', 'monto_descuento_aplicado', 'monto_multa_ticket_perdido', 'monto_total_cobrado'],
  },
  TariffVersions: {
    sheetName: '7_TARIFAS',
    title: 'Motor de Tarifas Versionadas',
    description: 'Reglas de precios por minuto, tolerancia de gracia y multas',
    columns: ['id_version_tarifa', 'nombre_version', 'tipo_vehiculo', 'precio_por_minuto', 'minutos_gracia', 'cobra_desde_minuto_cero', 'monto_multa_ticket_perdido', 'regla_redondeo', 'dias_aplicables', 'hora_desde', 'hora_hasta', 'multiplicador_recargo', 'fecha_inicio_vigencia', 'es_activa', 'id_admin_creador'],
  },
  Payments: {
    sheetName: '8_PAGOS',
    title: 'Transacciones de Pago (POS)',
    description: 'Flujos monetarios, váucheres Transbank y boletas',
    columns: ['id_pago', 'id_ticket', 'id_turno', 'id_usuario_cajero', 'medio_pago', 'monto_total_pagado', 'monto_efectivo_recibido', 'monto_vuelto_entregado', 'numero_voucher_transbank', 'ultimos_4_digitos_tarjeta', 'folio_boleta_sii', 'timestamp_pago'],
  },
  Shifts: {
    sheetName: '9_TURNOS_CAJA',
    title: 'Control de Turnos y Caja Ciega',
    description: 'Aperturas, declaraciones ciegas y cuadraturas automáticas',
    columns: ['id_turno', 'id_usuario_operador', 'dispositivo_caja_id', 'fecha_hora_apertura', 'fondo_inicial_efectivo', 'vouchers_heredados_tarjeta', 'estado_turno', 'fecha_hora_cierre', 'declarado_efectivo_fisico', 'declarado_tarjetas_vouchers', 'declarado_transferencias', 'declarado_cuenta_cliente', 'esperado_efectivo_sistema', 'esperado_tarjetas_sistema', 'esperado_transferencias_sistema', 'esperado_total_sistema', 'diferencia_efectivo', 'diferencia_total_caja', 'estado_cuadratura', 'justificacion_operador'],
  },
  AuditTrail: {
    sheetName: '10_AUDITORIA',
    title: 'Bitácora de Auditoría Inalterable',
    description: 'Registro append-only de eventos críticos autorizados por PIN',
    columns: ['id_evento_auditoria', 'timestamp', 'tipo_evento', 'nivel_criticidad', 'id_usuario_solicitante', 'id_admin_aprobador', 'motivo_justificacion', 'entidad_afectada', 'id_entidad_afectada', 'valor_anterior_json', 'valor_nuevo_json', 'origen_conexion', 'estado_revision'],
  },
  SyncQueue: {
    sheetName: '11_SYNC_OFFLINE',
    title: 'Cola de Sincronización PWA Offline',
    description: 'Transacciones locales pendientes de sincronizar con idempotencia',
    columns: ['id_local_sync', 'idempotency_key', 'tipo_operacion', 'payload_json', 'timestamp_creacion_local', 'estado_sincronizacion', 'mensaje_error_conflicto'],
  },
};
