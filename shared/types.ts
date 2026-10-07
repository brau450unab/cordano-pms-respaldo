// ==========================================
// TIPOS ENUM CANÓNICOS
// ==========================================
export type EstadoTicket = 'In-Parking' | 'Pagado' | 'Anulado' | 'Perdido' | 'Fuga';
export type RolUsuario = 'SUPERVISOR' | 'OPERATOR';
export type EstadoTarea = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type PrioridadTarea = 'BAJA' | 'MEDIA' | 'ALTA';
export type EstadoTurno = 'ABIERTO' | 'CERRADO' | 'DISCREPANCIA';
export type MetodoPago = 'EFECTIVO' | 'DEBITO_POS' | 'CREDITO_POS' | 'TRANSFERENCIA' | 'CONVENIO';

// ==========================================
// 1. COLECCIÓN: Tickets
// ==========================================
export interface TicketFirestore {
  id_ticket: string;               // TKT-AAAAMMDD-T0X-XXXX o TKT-AAAAMMDD-T0X-XXXX-O
  patente_normalizada: string;     // Formato chileno/extranjero en mayúsculas
  driver_phone: string;            // Formato chileno estricto (+569XXXXXXXX) o '-'
  fecha_hora_ingreso: string;      // YYYY-MM-DD HH:mm:ss
  fecha_hora_salida: string;       // YYYY-MM-DD HH:mm:ss o '-'
  duracion_total_minutos: number;  // Minutos transcurridos
  monto_total_cobrado: number;     // Entero en CLP
  estado_ticket: EstadoTicket;
  id_version_tarifa: string;       // Tarifa congelada al ingreso
  id_slot: string;                 // '1' a '30' o 'AUTO'
  id_usuario_ingreso: string;      // Operador emisor
  id_usuario_salida?: string;      // Operador recaudador
  metodo_pago?: MetodoPago;
  es_offline: boolean;             // True si se originó en IndexedDB
  sincronizado_cloud: boolean;
}

// ==========================================
// 2. COLECCIÓN: Users
// ==========================================
export interface PermisosUsuario {
  ver_dashboard_financiero: boolean;
  ver_monitoreo_vivo: boolean;
  gestionar_tareas_kanban: boolean;
  autorizar_anulaciones: boolean;
  operar_pos: boolean;
}

export interface UserFirestore {
  id_usuario: string;              // USR-ADM-01, USR-OP-01
  nombre_completo: string;
  email: string;
  rol: RolUsuario;
  pin_autorizacion?: string;       // Requerido para SUPERVISOR
  activo: boolean;
  permisos: PermisosUsuario;
  ultimo_acceso?: string;
}

// ==========================================
// 3. COLECCIÓN: Tasks (Tablero Kanban)
// ==========================================
export interface TaskFirestore {
  id_tarea: string;                // TSK-XXXX
  titulo: string;
  descripcion: string;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  creado_por: string;
  asignado_a: string;
  fecha_creacion: string;
  fecha_completada?: string;
}

// ==========================================
// 4. COLECCIÓN: Shifts (Cierre Ciego)
// ==========================================
export interface ShiftFirestore {
  id_turno: string;                     // SHIFT-AAAAMMDD-T0X
  id_usuario: string;                   // Operador responsable
  fecha_apertura: string;
  fecha_cierre?: string;
  monto_inicial_caja: number;
  monto_declarado_efectivo: number;
  monto_declarado_vouchers: number;
  monto_declarado_transferencias: number;
  monto_esperado_sistema: number;
  diferencia_descuadre: number;
  justificacion_descuadre?: string;
  estado_turno: EstadoTurno;
  tickets_emitidos: number;
  tickets_cobrados: number;
}
