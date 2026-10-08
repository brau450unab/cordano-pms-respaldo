export type AppScreen =
  | 'landing'
  | 'menu'
  | 'pos'
  | 'map'
  | 'reports'
  | 'clients'
  | 'settings'
  | 'support'
  | 'login'
  | 'inicio'
  // Operación (Operadores & Administradores)
  | 'operacion_ingreso'
  | 'operacion_salida'
  | 'operacion_layout'
  | 'operacion_cierre'
  | 'operacion_convenios'
  // Reportes (Administradores)
  | 'reportes_dashboard'
  | 'reportes_auditoria'
  | 'reportes_database'
  // Configuración (Limitados por permisos)
  | 'config_tarifas'
  | 'config_sistema';

export type VehicleType = 'Automóvil' | 'Camioneta' | 'Motocicleta' | 'Furgón / SUV';

export type SlotStatus = 'disponible' | 'ocupado' | 'reservado' | 'mantenimiento';

export type TicketStatus = 'activo' | 'pagado' | 'anulado';

export type PaymentMethod = 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'transferencia' | 'convenio';

export type UserRole = 'operador' | 'administrador';

export type TariffType = 'estandar' | 'convenio' | 'mensual' | 'tarifa_plana' | 'especial';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  shiftId: string;
  email?: string;
}

export interface ParkingSlot {
  id: string;
  code: string; // e.g. "A-01", "B-05"
  zone: 'Zona A (Techado)' | 'Zona B (General)' | 'Zona C (Preferencial)';
  status: SlotStatus;
  currentTicketId?: string;
  occupiedSince?: string; // ISO date string
  plateNumber?: string;
}

export type AgreementType = 'Convenio Mensual' | 'Convenio Comercial';
export type AgreementStatus = 'al_dia' | 'por_vencer' | 'vencido';

export interface Customer {
  id: string;
  plateNumber: string;
  name: string;
  phone: string;
  rut?: string;
  email?: string;
  agreementType?: 'Particular' | 'Convenio Empresa' | 'Vecino Frecuente' | 'Convenio Mensual' | TariffType | AgreementType;
  isSpecialRate?: boolean;
  notes?: string;
}

export interface Agreement {
  id: string;
  plateNumber: string; // Patente única del vehículo registrada
  companyName: string; // Empresa o razón social que agrupa el convenio
  rutCompany?: string; // RUT de la empresa
  contactName: string; // Conductor habitual o contacto
  phone: string;
  email?: string;
  agreementType: AgreementType;
  monthlyFeeClp: number; // Valor cuota mensual en CLP (ej: $45.000 CLP)
  validUntil: string; // Fecha límite de vigencia (ISO string)
  status: AgreementStatus; // al_dia (verde), por_vencer (amarillo <= 7 días), vencido (rojo)
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  lastPaymentMethod?: string;
  lastPaymentVoucher?: string;
  notes?: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface Ticket {
  id: string;
  ticketCode: string; // e.g. "T-84920"
  plateNumber: string; // Chilean format e.g. "ABCD12"
  vehicleType: VehicleType;
  entryTime: string; // ISO date string
  exitTime?: string; // ISO date string
  slotCode: string; // e.g. "A-01" or "SIN_ASIGNAR"
  tariffType?: 'estandar' | 'especial';
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  voucherNumber?: string;
  invoiceFolio?: string;
  durationMinutes?: number;
  subtotalAmount?: number;
  discountAmount?: number;
  discountReason?: string;
  isLostTicket?: boolean;
  totalAmount?: number;
  paidAmount?: number;
  changeAmount?: number;
  paymentMethod?: PaymentMethod;
  status: TicketStatus;
  notes?: string;
  operatorEntryName: string;
  operatorExitName?: string;
}

export interface VehicleRate {
  minuteRate: number; // Chilean Pesos per minute e.g. 25 CLP
  hourlyRate: number; // CLP e.g. 1500 CLP
  maxDailyRate: number; // CLP e.g. 15000 CLP
}

export interface TariffConfig {
  gracePeriodMinutes: number; // e.g. 10 minutes free
  lostTicketFee: number; // e.g. 10000 CLP
  nightSurchargePercent: number; // e.g. 20%
  weekendSurchargePercent: number; // e.g. 15%
  vehicleRates: Record<VehicleType, VehicleRate>;
}

export interface ChileanCashBreakdown {
  coins10?: number;
  coins50: number;
  coins100: number;
  coins500: number;
  bills1000: number;
  bills2000: number;
  bills5000: number;
  bills10000: number;
  bills20000: number;
}

export interface CashMovement {
  id: string;
  shiftId: string;
  timestamp: string;
  type: 'INGRESO_MANUAL' | 'RETIRO_SANGRIA' | 'GASTO_MENOR';
  amount: number;
  reason: string;
  operatorId: string;
  operatorName: string;
  requesterName?: string;
  authorizerName?: string;
  authorizedBySupervisor?: string;
  supervisorTotpPin?: string;
  voucherFolio?: string;
}

export interface Shift {
  id: string;
  operatorId: string;
  operatorName: string;
  startTime: string; // ISO string
  endTime?: string;
  initialCash: number; // Fondo inicial
  initialCashBreakdown?: ChileanCashBreakdown;
  declaredCash?: number;
  declaredCard?: number;
  declaredTransfer?: number;
  declaredCashBreakdown?: ChileanCashBreakdown;
  cashMovements?: CashMovement[];
  expectedCash?: number;
  expectedCard?: number;
  expectedTransfer?: number;
  status: 'abierto' | 'cerrado';
  totalTicketsProcessed?: number;
  discrepancyCash?: number;
  discrepancyTotal?: number;
  isDiscrepancyFlagged?: boolean; // true si excede el umbral de tolerancia de $2.000 CLP
  closeJustification?: string;
  authorizedBySupervisorPin?: string;
  supervisorName?: string;
  transferredVehiclesCount?: number;
  forcedExitVehiclesCount?: number;
  signedCopy1Caja?: boolean;
  signedCopy2Operador?: boolean;
  offlineSyncStatus?: 'synced' | 'pending_sync';
  hashAuditoria?: string;
  checklistCompleted?: boolean;
  checklistCompletedAt?: string;
  lastChecklistSnoozeAt?: string;
  checklistSnoozeMinutes?: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action:
    | 'ANULACION_TICKET'
    | 'DESCUENTO_MANUAL'
    | 'APERTURA_PASO'
    | 'CAMBIO_TARIFA'
    | 'CIERRE_CAJA_CIEGO'
    | 'SOBREESCRITURA_SALIDA'
    | 'APERTURA_TURNO'
    | 'MOVIMIENTO_CAJA_INGRESO'
    | 'MOVIMIENTO_CAJA_RETIRO'
    | 'CHECKLIST_APERTURA'
    | 'CLIENTE_REGISTRADO'
    | 'ASIGNACION_SLOT';
  details: string;
  severity: 'info' | 'warning' | 'critical';
  authorizedBy?: string;
}
