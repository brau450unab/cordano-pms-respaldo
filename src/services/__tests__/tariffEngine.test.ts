import { describe, it, expect } from 'vitest';
import { calculateStayFeeLey20967 } from '../tariffEngine';
import { Ticket, TariffConfig } from '../../types';

describe('Motor Tarifario Cordano PMS (Ley N° 20.967)', () => {
  const baseConfig: TariffConfig = {
    billingModel: 'TRANCHE_30_10',
    taxDocumentType: 39,
    gracePeriodMinutes: 15,
    nightSurchargePercent: 0,
    weekendSurchargePercent: 0,
    vehicleRates: {
      'Automóvil': { minuteRate: 35, hourlyRate: 2100, maxDailyRate: 25000 },
      'Camioneta': { minuteRate: 40, hourlyRate: 2400, maxDailyRate: 30000 },
      'Motocicleta': { minuteRate: 20, hourlyRate: 1200, maxDailyRate: 15000 },
      'Furgón / SUV': { minuteRate: 40, hourlyRate: 2400, maxDailyRate: 30000 },
    },
    subsequentTrancheRates: {
      'Automóvil': 350,
      'Camioneta': 400,
      'Motocicleta': 200,
      'Furgón / SUV': 400,
    },
  };

  const createTicket = (entryTime: string, overrides: Partial<Ticket> = {}): Ticket => ({
    id: 'tkt-test-1',
    ticketCode: 'CPMS-0001',
    plateNumber: 'ABCD12',
    entryTime,
    slotCode: 'A-01',
    vehicleType: 'Automóvil',
    status: 'activo',
    operatorEntryName: 'Juan Pérez',
    ...overrides,
  });

  it('debe aplicar gracia legal de 15 minutos con costo $0 CLP', () => {
    const entry = new Date('2026-10-13T10:00:00Z');
    const exit = new Date('2026-10-13T10:14:00Z'); // 14 min de estadía
    const ticket = createTicket(entry.toISOString());

    const result = calculateStayFeeLey20967(ticket, baseConfig, exit);

    expect(result.durationMinutes).toBe(14);
    expect(result.isGracePeriod).toBe(true);
    expect(result.totalAmount).toBe(0);
    expect(result.breakdownDescription).toContain('Período de gracia');
  });

  it('debe cobrar solo el tramo inicial de 30 min para estadías de 16 a 30 minutos', () => {
    const entry = new Date('2026-10-13T10:00:00Z');
    const exit = new Date('2026-10-13T10:28:00Z'); // 28 min de estadía
    const ticket = createTicket(entry.toISOString());

    const result = calculateStayFeeLey20967(ticket, baseConfig, exit);

    expect(result.durationMinutes).toBe(28);
    expect(result.isGracePeriod).toBe(false);
    // Base 30 min a $35/min = $1.050 CLP
    expect(result.baseAmount).toBe(1050);
    expect(result.subsequentAmount).toBe(0);
    expect(result.totalAmount).toBe(1050);
  });

  it('debe truncar tramos subsiguientes a favor del cliente con Math.floor (Ley 20.967)', () => {
    const entry = new Date('2026-10-13T10:00:00Z');
    // 30 min iniciales + 18 min adicionales = 48 min total.
    // Solo se debe cobrar 1 tramo adicional de 10 min, NO dos (prohibido redondeo Math.ceil)
    const exit = new Date('2026-10-13T10:48:00Z');
    const ticket = createTicket(entry.toISOString());

    const result = calculateStayFeeLey20967(ticket, baseConfig, exit);

    expect(result.durationMinutes).toBe(48);
    expect(result.baseAmount).toBe(1050);
    // 1 tramo de 10 min = $350
    expect(result.subsequentAmount).toBe(350);
    expect(result.totalAmount).toBe(1400);
  });

  it('debe respetar la tarifa congelada (frozenRate) si la tarifa global cambia', () => {
    const entry = new Date('2026-10-13T10:00:00Z');
    const exit = new Date('2026-10-13T10:30:00Z');
    const ticket = createTicket(entry.toISOString(), {
      frozenRate: { minuteRate: 25, hourlyRate: 1500, maxDailyRate: 20000 },
    });

    const result = calculateStayFeeLey20967(ticket, baseConfig, exit);

    expect(result.isFrozenRateApplied).toBe(true);
    // 30 min x $25 = $750 CLP (no los $1.050 de la tarifa global)
    expect(result.totalAmount).toBe(750);
  });

  it('debe eximir totalmente de cobro a vehículos con convenio o abonados mensuales', () => {
    const entry = new Date('2026-10-13T08:00:00Z');
    const exit = new Date('2026-10-13T18:00:00Z'); // 10 horas
    const ticket = createTicket(entry.toISOString(), {
      tariffType: 'convenio',
      notes: 'CONVENIO BANCO DE CHILE',
    });

    const result = calculateStayFeeLey20967(ticket, baseConfig, exit);

    expect(result.totalAmount).toBe(0);
    expect(result.billableMinutes).toBe(0);
    expect(result.breakdownDescription).toContain('Exento por Convenio Comercial');
  });
});
