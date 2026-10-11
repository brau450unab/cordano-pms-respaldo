import { Ticket, TariffConfig, TariffVersion, VehicleType, VehicleRate, BillingModel } from '../types';

export interface TariffCalculationResult {
  durationMinutes: number;
  billableMinutes: number;
  isGracePeriod: boolean;
  baseAmount: number;
  subsequentAmount: number;
  subtotalAmount: number;
  nightSurcharge: number;
  weekendSurcharge: number;
  totalAmount: number;
  appliedBillingModel: BillingModel;
  tariffVersionId?: string;
  isFrozenRateApplied: boolean;
  breakdownDescription: string;
}

/**
 * Motor Tarifario Oficial de Cordano PMS conforme a la Ley N° 20.967
 * (Regula el cobro de servicios de estacionamiento y parquímetros en Chile)
 *
 * Principios legales obligatorios:
 * 1. Prohibido redondeo al alza (Math.ceil). Siempre truncamiento a favor del cliente (Math.floor).
 * 2. En modalidad tramos: Tramo 1 >= 30 min; Tramos subsiguientes <= 10 min.
 * 3. Inmutabilidad tarifaria: Si el ticket tiene tarifa congelada (frozenRate), se respeta la de su ingreso.
 * 4. Período de gracia: Si estadía <= gracePeriodMinutes, el cobro es $0 CLP.
 */
export function calculateStayFeeLey20967(
  ticket: Ticket,
  config: TariffConfig,
  customExitTime?: Date,
  activeTariffVersion?: TariffVersion
): TariffCalculationResult {
  const entryDate = new Date(ticket.entryTime);
  const exitDate = customExitTime || (ticket.exitTime ? new Date(ticket.exitTime) : new Date());
  const diffMs = Math.max(0, exitDate.getTime() - entryDate.getTime());
  
  // Duración efectiva real truncada a minutos
  const durationMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));

  // Exención total por Convenio Comercial o Abonado Mensual
  const isAgreementOrSubscriber =
    ticket.notes?.includes('CONVENIO') ||
    ticket.tariffType === 'convenio' ||
    ticket.tariffType === 'mensual';

  if (isAgreementOrSubscriber) {
    return {
      durationMinutes,
      billableMinutes: 0,
      isGracePeriod: false,
      baseAmount: 0,
      subsequentAmount: 0,
      subtotalAmount: 0,
      nightSurcharge: 0,
      weekendSurcharge: 0,
      totalAmount: 0,
      appliedBillingModel: config.billingModel,
      tariffVersionId: ticket.tariffVersionId,
      isFrozenRateApplied: Boolean(ticket.frozenRate),
      breakdownDescription: 'Exento por Convenio Comercial / Abonado Registrado',
    };
  }

  // 1. Determinar tarifa base a aplicar (Priorizar tarifa congelada del ticket para inmutabilidad)
  const isFrozen = Boolean(ticket.frozenRate);
  let rate: VehicleRate = ticket.frozenRate ||
    config.vehicleRates[ticket.vehicleType] ||
    config.vehicleRates['Automóvil'];

  const billingModel: BillingModel = ticket.frozenBillingModel || config.billingModel;

  // Si tiene descuento especial de cliente frecuente/convenio transitorio
  if (ticket.tariffType === 'especial') {
    rate = {
      minuteRate: Math.floor(rate.minuteRate * 0.8), // 20% descuento
      hourlyRate: Math.floor(rate.hourlyRate * 0.8),
      maxDailyRate: Math.floor(rate.maxDailyRate * 0.8),
    };
  }

  // 2. Comprobar período de gracia legal
  const graceMinutes = config.gracePeriodMinutes || 15;
  if (durationMinutes <= graceMinutes) {
    return {
      durationMinutes,
      billableMinutes: 0,
      isGracePeriod: true,
      baseAmount: 0,
      subsequentAmount: 0,
      subtotalAmount: 0,
      nightSurcharge: 0,
      weekendSurcharge: 0,
      totalAmount: 0,
      appliedBillingModel: billingModel,
      tariffVersionId: ticket.tariffVersionId || activeTariffVersion?.id,
      isFrozenRateApplied: isFrozen,
      breakdownDescription: `Período de gracia (${durationMinutes}m de ${graceMinutes}m libres)`,
    };
  }

  let baseAmount = 0;
  let subsequentAmount = 0;
  let rawSubtotal = 0;
  let breakdownDesc = '';

  // 3. Cálculo según modelo legal
  if (billingModel === 'TRANCHE_30_10') {
    // Tramos: Primer tramo inicial de 30 minutos
    const initialTrancheRate = rate.minuteRate * 30; // Equivalente a 30 min base
    const subsequentTrancheRate =
      (config.subsequentTrancheRates && config.subsequentTrancheRates[ticket.vehicleType]) ||
      Math.floor(rate.minuteRate * 10);

    baseAmount = initialTrancheRate;

    if (durationMinutes <= 30) {
      rawSubtotal = baseAmount;
      breakdownDesc = `Primer tramo 30 min: $${initialTrancheRate.toLocaleString('es-CL')} CLP`;
    } else {
      const extraMinutes = durationMinutes - 30;
      // TRUNCAMIENTO ESTRICTO PRO-CONSUMIDOR (Ley 20.967):
      // No se usa Math.ceil. Se truncan los bloques de 10 min a favor del cliente con Math.floor.
      const extraTranches = Math.floor(extraMinutes / 10);
      subsequentAmount = extraTranches * subsequentTrancheRate;
      rawSubtotal = baseAmount + subsequentAmount;
      breakdownDesc = `Base 30 min ($${initialTrancheRate.toLocaleString('es-CL')}) + ${extraTranches} tramos de 10 min ($${subsequentAmount.toLocaleString('es-CL')})`;
    }
  } else {
    // Cobro por minuto efectivo lineal
    baseAmount = durationMinutes * rate.minuteRate;
    rawSubtotal = baseAmount;
    breakdownDesc = `${durationMinutes} minutos × $${rate.minuteRate} CLP/min`;
  }

  // 4. Aplicar tope diario máximo (Max Daily Rate) si corresponde
  const days = Math.floor(durationMinutes / (24 * 60));
  const remainingMinutes = durationMinutes % (24 * 60);
  const dailyCappedAmount =
    days * rate.maxDailyRate +
    Math.min(remainingMinutes * rate.minuteRate, rate.maxDailyRate);

  if (rawSubtotal > dailyCappedAmount) {
    rawSubtotal = dailyCappedAmount;
    breakdownDesc += ` (Ajustado al tope diario máximo: $${dailyCappedAmount.toLocaleString('es-CL')} CLP)`;
  }

  // 5. Recargos: Nocturno (22:00 a 06:00) y Fin de semana (Sábado/Domingo)
  const exitHour = exitDate.getHours();
  const isNight = exitHour >= 22 || exitHour < 6;
  const nightSurchargePercent = config.nightSurchargePercent || 0;
  const nightSurcharge = isNight
    ? Math.floor(rawSubtotal * (nightSurchargePercent / 100))
    : 0;

  const isWeekend = exitDate.getDay() === 0 || exitDate.getDay() === 6;
  const weekendSurchargePercent = config.weekendSurchargePercent || 0;
  const weekendSurcharge = isWeekend
    ? Math.floor(rawSubtotal * (weekendSurchargePercent / 100))
    : 0;

  // 6. Totalización final con truncamiento a la decena inferior (Math.floor)
  const rawTotal = rawSubtotal + nightSurcharge + weekendSurcharge;
  const totalAmount = Math.floor(rawTotal / 10) * 10;

  return {
    durationMinutes,
    billableMinutes: durationMinutes,
    isGracePeriod: false,
    baseAmount: Math.floor(baseAmount),
    subsequentAmount: Math.floor(subsequentAmount),
    subtotalAmount: Math.floor(rawSubtotal),
    nightSurcharge,
    weekendSurcharge,
    totalAmount,
    appliedBillingModel: billingModel,
    tariffVersionId: ticket.tariffVersionId || activeTariffVersion?.id,
    isFrozenRateApplied: isFrozen,
    breakdownDescription: breakdownDesc,
  };
}
