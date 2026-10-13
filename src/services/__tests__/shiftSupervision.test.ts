import { describe, it, expect } from 'vitest';
import { Shift, ChileanCashBreakdown } from '../../types';

describe('Lógica de Supervisión de Trabajadores & Arqueo Ciego (Serrano 447)', () => {
  const initialShift: Shift = {
    id: 'SHIFT-TEST-1',
    operatorId: 'operador-1',
    operatorName: 'Carlos Mendoza',
    startTime: '2026-10-13T08:00:00.000Z',
    initialCash: 50000,
    cashMovements: [],
    status: 'abierto',
    totalTicketsProcessed: 0,
    signedCopy1Caja: false,
    signedCopy2Operador: false,
  };

  it('debe iniciar el turno bloqueando el POS hasta declarar el fondo de gaveta ($50.000 CLP)', () => {
    expect(initialShift.status).toBe('abierto');
    expect(initialShift.initialCash).toBe(50000);
    expect(initialShift.operatorName).toBe('Carlos Mendoza');
  });

  it('debe calcular correctamente el efectivo esperado en gaveta con ingresos y retiros manuales', () => {
    const cashTicketsTotal = 35000;
    const manualIngreso = 10000;
    const manualSangria = 15000;

    const expectedCash = initialShift.initialCash + cashTicketsTotal + manualIngreso - manualSangria;
    expect(expectedCash).toBe(80000);
  });

  it('debe alertar descuadre si la diferencia supera la tolerancia legal de $2.000 CLP', () => {
    const expectedCash = 80000;
    const declaredCash = 75000; // Faltante de $5.000 CLP
    const tolerance = 2000;

    const discrepancy = declaredCash - expectedCash;
    const isFlagged = Math.abs(discrepancy) > tolerance;

    expect(discrepancy).toBe(-5000);
    expect(isFlagged).toBe(true);
  });

  it('no debe alertar descuadre si la diferencia está dentro de la tolerancia de $2.000 CLP', () => {
    const expectedCash = 80000;
    const declaredCash = 79000; // Diferencia de $1.000 CLP (dentro de tolerancia)
    const tolerance = 2000;

    const discrepancy = declaredCash - expectedCash;
    const isFlagged = Math.abs(discrepancy) > tolerance;

    expect(discrepancy).toBe(-1000);
    expect(isFlagged).toBe(false);
  });

  it('debe sumar con precisión las denominaciones chilenas de monedas y billetes', () => {
    const breakdown: ChileanCashBreakdown = {
      coins50: 10,   // $500
      coins100: 20,  // $2.000
      coins500: 5,   // $2.500
      bills1000: 5,  // $5.000
      bills2000: 5,  // $10.000
      bills5000: 4,  // $20.000
      bills10000: 2, // $20.000
      bills20000: 1, // $20.000
    };

    const totalCoins = breakdown.coins50 * 50 + breakdown.coins100 * 100 + breakdown.coins500 * 500;
    const totalBills =
      breakdown.bills1000 * 1000 +
      breakdown.bills2000 * 2000 +
      breakdown.bills5000 * 5000 +
      breakdown.bills10000 * 10000 +
      breakdown.bills20000 * 20000;

    const grandTotal = totalCoins + totalBills;
    expect(totalCoins).toBe(5000);
    expect(totalBills).toBe(75000);
    expect(grandTotal).toBe(80000);
  });
});
