import { TariffConfig, ParkingSlot, Ticket, AuditLog, Shift, User, Customer, Agreement } from '../types';

const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const INITIAL_AGREEMENTS: Agreement[] = [
  {
    id: 'agr-001',
    plateNumber: 'LK-84-21',
    companyName: 'Empresa Zofri Iquique Ltda.',
    rutCompany: '76.840.123-K',
    contactName: 'Patricio Almonte',
    phone: '+56987654321',
    email: 'patricio.almonte@zofri.cl',
    agreementType: 'Convenio Mensual',
    monthlyFeeClp: 45000,
    validUntil: daysFromNow(22), // al día (verde)
    status: 'al_dia',
    lastPaymentDate: daysFromNow(-8),
    lastPaymentAmount: 45000,
    lastPaymentMethod: 'Transferencia Bancaria',
    lastPaymentVoucher: 'TR-982341',
    notes: 'Mensualidad sector Serrano con acceso diario',
    createdAt: daysFromNow(-68),
  },
  {
    id: 'agr-002',
    plateNumber: 'RD-44-12',
    companyName: 'Minera Collahuasi Contratistas',
    rutCompany: '77.291.800-4',
    contactName: 'Valeria Castro',
    phone: '+56965432109',
    email: 'valeria.castro@contratas.cl',
    agreementType: 'Convenio Mensual',
    monthlyFeeClp: 60000,
    validUntil: daysFromNow(4), // por vencer (amarillo <= 7 días)
    status: 'por_vencer',
    lastPaymentDate: daysFromNow(-26),
    lastPaymentAmount: 60000,
    lastPaymentMethod: 'Transferencia Bancaria',
    lastPaymentVoucher: 'TR-771204',
    notes: 'Vehículo camioneta supervisión faena',
    createdAt: daysFromNow(-90),
  },
  {
    id: 'agr-003',
    plateNumber: 'HJ-33-91',
    companyName: 'Hotel Cordano Express',
    rutCompany: '76.110.456-9',
    contactName: 'Rodrigo Araya',
    phone: '+56976543210',
    email: 'administracion@hotelcordano.cl',
    agreementType: 'Convenio Comercial',
    monthlyFeeClp: 40000,
    validUntil: daysFromNow(-3), // vencido (rojo)
    status: 'vencido',
    lastPaymentDate: daysFromNow(-33),
    lastPaymentAmount: 40000,
    lastPaymentMethod: 'POS Tarjeta Crédito',
    lastPaymentVoucher: 'POS-448102',
    notes: 'Convenio huéspedes ejecutivos. Cuota pendiente de renovación.',
    createdAt: daysFromNow(-120),
  },
  {
    id: 'agr-004',
    plateNumber: 'BC-92-10',
    companyName: 'Distribuidora Tarapacá SpA',
    rutCompany: '76.543.210-8',
    contactName: 'Carolina Henríquez',
    phone: '+56991234567',
    email: 'carolina.henriquez@distribuidora.cl',
    agreementType: 'Convenio Comercial',
    monthlyFeeClp: 50000,
    validUntil: daysFromNow(16), // al día (verde)
    status: 'al_dia',
    lastPaymentDate: daysFromNow(-14),
    lastPaymentAmount: 50000,
    lastPaymentMethod: 'Transferencia Bancaria',
    lastPaymentVoucher: 'TR-554199',
    notes: 'Vehículo comercial de reparto local',
    createdAt: daysFromNow(-45),
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    plateNumber: 'LK-84-21',
    name: 'Patricio Almonte',
    phone: '+56987654321',
    email: 'patricio.almonte@gmail.com',
    agreementType: 'Convenio Empresa',
    isSpecialRate: true,
    notes: 'Empresa Zofri Iquique'
  },
  {
    id: 'cust-2',
    plateNumber: 'BC-92-10',
    name: 'Carolina Henríquez',
    phone: '+56991234567',
    email: 'carolina.henriquez@minera.cl',
    agreementType: 'Particular',
    isSpecialRate: false,
    notes: 'Cliente Frecuente'
  },
  {
    id: 'cust-3',
    plateNumber: 'HJ-33-91',
    name: 'Rodrigo Araya',
    phone: '+56976543210',
    email: 'rodrigo.araya@vecinos.cl',
    agreementType: 'Vecino Frecuente',
    isSpecialRate: true,
    notes: 'Residente Calle Cordano'
  },
  {
    id: 'cust-4',
    plateNumber: 'RD-44-12',
    name: 'Valeria Castro',
    phone: '+56965432109',
    email: 'valeria.castro@gmail.com',
    agreementType: 'Convenio Mensual',
    isSpecialRate: true,
    notes: 'Abono Mensual Techado'
  },
  {
    id: 'cust-5',
    plateNumber: 'XX-40-12',
    name: 'Fernando Colque',
    phone: '+56954321098',
    email: 'fernando.colque@transporte.cl',
    agreementType: 'Particular',
    isSpecialRate: false
  }
];

export const INITIAL_OPERATOR: User = {
  id: 'usr-101',
  name: 'Juan Pérez (Operador)',
  role: 'operador',
  shiftId: 'SHIFT-1042',
  email: 'operador@pmsmatic.cl',
};

export const INITIAL_ADMIN: User = {
  id: 'usr-100',
  name: 'María González (Administradora)',
  role: 'administrador',
  shiftId: 'SHIFT-1042',
  email: 'admin@pmsmatic.cl',
};

export const INITIAL_TARIFF_CONFIG: TariffConfig = {
  gracePeriodMinutes: 10,
  lostTicketFee: 12000,
  nightSurchargePercent: 20,
  weekendSurchargePercent: 15,
  vehicleRates: {
    'Automóvil': { minuteRate: 40, hourlyRate: 2400, maxDailyRate: 18000 },
    'Camioneta': { minuteRate: 50, hourlyRate: 3000, maxDailyRate: 22000 },
    'Motocicleta': { minuteRate: 25, hourlyRate: 1500, maxDailyRate: 10000 },
    'Furgón / SUV': { minuteRate: 50, hourlyRate: 3000, maxDailyRate: 22000 },
  },
};

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();

export const INITIAL_SLOTS: ParkingSlot[] = [
  // Zone A (Techado - 10 slots)
  { id: 'slot-a01', code: 'A-01', zone: 'Zona A (Techado)', status: 'ocupado', currentTicketId: 't-101', occupiedSince: minutesAgo(45), plateNumber: 'LK-84-21' },
  { id: 'slot-a02', code: 'A-02', zone: 'Zona A (Techado)', status: 'ocupado', currentTicketId: 't-102', occupiedSince: hoursAgo(2.5), plateNumber: 'BC-92-10' },
  { id: 'slot-a03', code: 'A-03', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a04', code: 'A-04', zone: 'Zona A (Techado)', status: 'ocupado', currentTicketId: 't-103', occupiedSince: minutesAgo(12), plateNumber: 'HJ-33-91' },
  { id: 'slot-a05', code: 'A-05', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a06', code: 'A-06', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a07', code: 'A-07', zone: 'Zona A (Techado)', status: 'ocupado', currentTicketId: 't-104', occupiedSince: hoursAgo(1.5), plateNumber: 'RD-44-12' },
  { id: 'slot-a08', code: 'A-08', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a09', code: 'A-09', zone: 'Zona A (Techado)', status: 'disponible' },
  { id: 'slot-a10', code: 'A-10', zone: 'Zona A (Techado)', status: 'disponible' },

  // Zone B (General - 10 slots)
  { id: 'slot-b01', code: 'B-01', zone: 'Zona B (General)', status: 'ocupado', currentTicketId: 't-105', occupiedSince: hoursAgo(4), plateNumber: 'XX-40-12' },
  { id: 'slot-b02', code: 'B-02', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b03', code: 'B-03', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b04', code: 'B-04', zone: 'Zona B (General)', status: 'ocupado', currentTicketId: 't-106', occupiedSince: minutesAgo(8), plateNumber: 'MT-11-04' },
  { id: 'slot-b05', code: 'B-05', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b06', code: 'B-06', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b07', code: 'B-07', zone: 'Zona B (General)', status: 'ocupado', currentTicketId: 't-107', occupiedSince: hoursAgo(1.2), plateNumber: 'GH-88-72' },
  { id: 'slot-b08', code: 'B-08', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b09', code: 'B-09', zone: 'Zona B (General)', status: 'disponible' },
  { id: 'slot-b10', code: 'B-10', zone: 'Zona B (General)', status: 'disponible' },

  // Zone C (Preferencial - 10 slots)
  { id: 'slot-c01', code: 'C-01', zone: 'Zona C (Preferencial)', status: 'disponible' },
  { id: 'slot-c02', code: 'C-02', zone: 'Zona C (Preferencial)', status: 'ocupado', currentTicketId: 't-108', occupiedSince: minutesAgo(35), plateNumber: 'KW-19-44' },
  { id: 'slot-c03', code: 'C-03', zone: 'Zona C (Preferencial)', status: 'disponible' },
  { id: 'slot-c04', code: 'C-04', zone: 'Zona C (Preferencial)', status: 'disponible' },
  { id: 'slot-c05', code: 'C-05', zone: 'Zona C (Preferencial)', status: 'disponible' },
  { id: 'slot-c06', code: 'C-06', zone: 'Zona C (Preferencial)', status: 'disponible' },
  { id: 'slot-c07', code: 'C-07', zone: 'Zona C (Preferencial)', status: 'disponible' },
  { id: 'slot-c08', code: 'C-08', zone: 'Zona C (Preferencial)', status: 'disponible' },
  { id: 'slot-c09', code: 'C-09', zone: 'Zona C (Preferencial)', status: 'disponible' },
  { id: 'slot-c10', code: 'C-10', zone: 'Zona C (Preferencial)', status: 'disponible' },
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 't-101',
    ticketCode: 'T-84920',
    plateNumber: 'LK-84-21',
    vehicleType: 'Automóvil',
    entryTime: minutesAgo(45),
    slotCode: 'A-01',
    status: 'activo',
    operatorEntryName: 'Juan Pérez',
  },
  {
    id: 't-102',
    ticketCode: 'T-84921',
    plateNumber: 'BC-92-10',
    vehicleType: 'Camioneta',
    entryTime: hoursAgo(2.5),
    slotCode: 'A-02',
    status: 'activo',
    operatorEntryName: 'Juan Pérez',
  },
  {
    id: 't-103',
    ticketCode: 'T-84922',
    plateNumber: 'HJ-33-91',
    vehicleType: 'Motocicleta',
    entryTime: minutesAgo(12),
    slotCode: 'A-04',
    status: 'activo',
    operatorEntryName: 'Juan Pérez',
  },
  {
    id: 't-104',
    ticketCode: 'T-84923',
    plateNumber: 'XX-40-12',
    vehicleType: 'Furgón / SUV',
    entryTime: hoursAgo(4),
    slotCode: 'B-01',
    status: 'activo',
    operatorEntryName: 'Juan Pérez',
  },
  {
    id: 't-105',
    ticketCode: 'T-84924',
    plateNumber: 'MT-11-04',
    vehicleType: 'Automóvil',
    entryTime: minutesAgo(8),
    slotCode: 'B-04',
    status: 'activo',
    operatorEntryName: 'Juan Pérez',
  },
  {
    id: 't-106',
    ticketCode: 'T-84925',
    plateNumber: 'GH-88-72',
    vehicleType: 'Automóvil',
    entryTime: hoursAgo(1.2),
    slotCode: 'B-07',
    status: 'activo',
    operatorEntryName: 'Juan Pérez',
  },
  {
    id: 't-107',
    ticketCode: 'T-84926',
    plateNumber: 'KW-19-44',
    vehicleType: 'Camioneta',
    entryTime: minutesAgo(35),
    slotCode: 'C-02',
    status: 'activo',
    operatorEntryName: 'Juan Pérez',
  },

  // Completed / Paid tickets in current shift
  {
    id: 't-090',
    ticketCode: 'T-84910',
    plateNumber: 'ZZ-99-88',
    vehicleType: 'Automóvil',
    entryTime: hoursAgo(3),
    exitTime: hoursAgo(1),
    slotCode: 'A-03',
    durationMinutes: 120,
    subtotalAmount: 3600,
    discountAmount: 0,
    totalAmount: 3600,
    paidAmount: 5000,
    changeAmount: 1400,
    paymentMethod: 'efectivo',
    status: 'pagado',
    operatorEntryName: 'Juan Pérez',
    operatorExitName: 'Juan Pérez',
  },
  {
    id: 't-091',
    ticketCode: 'T-84911',
    plateNumber: 'AA-12-34',
    vehicleType: 'Camioneta',
    entryTime: hoursAgo(2),
    exitTime: hoursAgo(0.5),
    slotCode: 'B-03',
    durationMinutes: 90,
    subtotalAmount: 3150,
    discountAmount: 0,
    totalAmount: 3150,
    paidAmount: 3150,
    changeAmount: 0,
    paymentMethod: 'tarjeta_debito',
    status: 'pagado',
    operatorEntryName: 'Juan Pérez',
    operatorExitName: 'Juan Pérez',
  },
  {
    id: 't-092',
    ticketCode: 'T-84912',
    plateNumber: 'BB-56-78',
    vehicleType: 'Motocicleta',
    entryTime: hoursAgo(1.5),
    exitTime: minutesAgo(10),
    slotCode: 'A-05',
    durationMinutes: 80,
    subtotalAmount: 1200,
    discountAmount: 0,
    totalAmount: 1200,
    paidAmount: 1200,
    changeAmount: 0,
    paymentMethod: 'transferencia',
    status: 'pagado',
    operatorEntryName: 'Juan Pérez',
    operatorExitName: 'Juan Pérez',
  },
];

export const INITIAL_SHIFT: Shift = {
  id: 'SHIFT-1042',
  operatorId: 'usr-101',
  operatorName: 'Juan Pérez',
  startTime: hoursAgo(5),
  initialCash: 30000, // 30,000 CLP fondo inicial de caja
  status: 'abierto',
  totalTicketsProcessed: 3,
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: hoursAgo(4.8),
    userId: 'usr-101',
    userName: 'Juan Pérez',
    action: 'APERTURA_PASO',
    details: 'Apertura de turno SHIFT-1042 con fondo inicial de $30.000 CLP',
    severity: 'info',
  },
  {
    id: 'log-2',
    timestamp: hoursAgo(2.1),
    userId: 'usr-100',
    userName: 'María González',
    action: 'DESCUENTO_MANUAL',
    details: 'Autorizó descuento del 100% por convenio cliente Z-Mart en Ticket T-84905',
    severity: 'warning',
    authorizedBy: 'María González',
  },
  {
    id: 'log-3',
    timestamp: hoursAgo(1.5),
    userId: 'usr-100',
    userName: 'María González',
    action: 'CAMBIO_TARIFA',
    details: 'Ajuste de tarifa de hora Camioneta de $2.000 a $2.100 CLP',
    severity: 'info',
  },
  {
    id: 'log-4',
    timestamp: hoursAgo(0.8),
    userId: 'usr-101',
    userName: 'Juan Pérez',
    action: 'SOBREESCRITURA_SALIDA',
    details: 'Cobro de Ticket Perdido en patente XX-99-00 autorizado por Administrador',
    severity: 'warning',
    authorizedBy: 'María González',
  },
];
