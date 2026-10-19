import { TariffConfig, TariffVersion, ParkingSlot, Ticket, AuditLog, Shift, User, UserRole, UserPermissions, Customer, Agreement } from '../types';

const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const INITIAL_AGREEMENTS: Agreement[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  operador: {
    canOperatePos: true,
    canOpenCloseShift: true,
    canViewReports: false,
    canViewAudit: false,
    canConfigureSystem: false,
    canManageClients: false,
    isLiveSupervisorMode: false,
  },
  supervisor: {
    canOperatePos: false,
    canOpenCloseShift: false,
    canViewReports: true,
    canViewAudit: true,
    canConfigureSystem: false,
    canManageClients: true,
    isLiveSupervisorMode: true,
  },
  administrador: {
    canOperatePos: true,
    canOpenCloseShift: true,
    canViewReports: true,
    canViewAudit: true,
    canConfigureSystem: true,
    canManageClients: true,
    isLiveSupervisorMode: true,
  },
};

export const INITIAL_ADMIN: User = {
  id: 'usr-admin-braulio',
  name: 'Braulio Cordano',
  username: 'braulio',
  rut: '15.221.890-4',
  role: 'administrador',
  shiftId: '',
  email: 'braulio@automatizable.cl',
  permissions: ROLE_PERMISSIONS.administrador,
};

export const INITIAL_OPERATOR: User = {
  id: 'usr-op-cajero',
  name: 'Cajero Garita',
  username: 'cajero',
  rut: '19.824.312-5',
  role: 'operador',
  shiftId: '',
  email: 'cajero@cordano.cl',
  permissions: ROLE_PERMISSIONS.operador,
};

export const INITIAL_SUPERVISOR: User = INITIAL_ADMIN;

export const INITIAL_TARIFF_VERSIONS: TariffVersion[] = [
  {
    id: 'tar-v1-init',
    versionNumber: 1,
    effectiveFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    billingModel: 'PER_MINUTE',
    taxDocumentType: 39,
    gracePeriodMinutes: 15,
    nightSurchargePercent: 20,
    weekendSurchargePercent: 15,
    vehicleRates: {
      'Automóvil': { minuteRate: 40, hourlyRate: 2400, maxDailyRate: 18000 },
      'Camioneta': { minuteRate: 50, hourlyRate: 3000, maxDailyRate: 22000 },
      'Motocicleta': { minuteRate: 25, hourlyRate: 1500, maxDailyRate: 10000 },
      'Furgón / SUV': { minuteRate: 50, hourlyRate: 3000, maxDailyRate: 22000 },
    },
    subsequentTrancheRates: {
      'Automóvil': 400,
      'Camioneta': 500,
      'Motocicleta': 250,
      'Furgón / SUV': 500,
    },
    createdBy: 'Administración Cordano PMS',
    reason: 'Tarifa oficial publicada conforme a Ley N° 20.967'
  }
];

export const INITIAL_TARIFF_CONFIG: TariffConfig = {
  billingModel: 'PER_MINUTE',
  taxDocumentType: 39, // Boleta Electrónica Afecta (19% IVA)
  gracePeriodMinutes: 15,
  nightSurchargePercent: 20,
  weekendSurchargePercent: 15,
  vehicleRates: {
    'Automóvil': { minuteRate: 40, hourlyRate: 2400, maxDailyRate: 18000 },
    'Camioneta': { minuteRate: 50, hourlyRate: 3000, maxDailyRate: 22000 },
    'Motocicleta': { minuteRate: 25, hourlyRate: 1500, maxDailyRate: 10000 },
    'Furgón / SUV': { minuteRate: 50, hourlyRate: 3000, maxDailyRate: 22000 },
  },
  subsequentTrancheRates: {
    'Automóvil': 400, // Cada 10 minutos adicionales
    'Camioneta': 500,
    'Motocicleta': 250,
    'Furgón / SUV': 500,
  },
  subscriptionPlans: [
    { id: 'mensual', title: 'Mensual', price: '$50.000', desc: 'Por mes' },
    { id: 'semanal', title: 'Semanal', price: '$15.000', desc: 'Por semana' },
    { id: 'diurno', title: 'Diurno', price: '$5.000', desc: 'Por día' },
    { id: 'flota', title: 'Flota Corp.', price: 'A conv.', desc: 'Multivehículo' }
  ],
  activeVersionId: 'tar-v1-init',
};

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();

export const INITIAL_SLOTS: ParkingSlot[] = [
  // Sector A (Plazas 01 a 15)
  { id: 'slot-a01', code: 'A-01', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a02', code: 'A-02', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a03', code: 'A-03', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a04', code: 'A-04', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a05', code: 'A-05', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a06', code: 'A-06', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a07', code: 'A-07', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a08', code: 'A-08', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a09', code: 'A-09', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a10', code: 'A-10', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a11', code: 'A-11', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a12', code: 'A-12', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a13', code: 'A-13', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a14', code: 'A-14', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a15', code: 'A-15', zone: 'Zona A (Techado)', status: 'disponible' },

  // Sector B (Plazas 16 a 30)
  { id: 'slot-b16', code: 'B-16', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b17', code: 'B-17', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b18', code: 'B-18', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b19', code: 'B-19', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b20', code: 'B-20', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b21', code: 'B-21', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b22', code: 'B-22', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b23', code: 'B-23', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b24', code: 'B-24', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b25', code: 'B-25', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b26', code: 'B-26', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b27', code: 'B-27', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b28', code: 'B-28', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b29', code: 'B-29', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b30', code: 'B-30', zone: 'Zona B (General)', status: 'disponible' },
];

export const INITIAL_TICKETS: Ticket[] = [];

export const INITIAL_SHIFT: Shift = {
  id: 'SHIFT-INICIAL',
  operatorId: 'usr-admin-braulio',
  operatorName: 'Braulio Cordano',
  startTime: new Date().toISOString(),
  endTime: new Date().toISOString(),
  initialCash: 50000,
  status: 'cerrado',
  totalTicketsProcessed: 0,
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
