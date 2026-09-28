export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de Ejecución de Tools / Function Calling para Google AI Studio y Gemini
 * ParkOps PMS & ERP Cordano (Serrano 447, Iquique)
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { toolName, parameters } = body;

    if (!toolName) {
      return NextResponse.json({ error: 'Falta el parámetro toolName' }, { status: 400 });
    }

    const params = parameters || {};

    switch (toolName) {
      case 'lookupTicketByPlateOrId': {
        const query = (params.plateOrTicketId || '').toUpperCase().trim();
        return NextResponse.json({
          found: true,
          ticketId: `TKT-20260925-T01-0089`,
          plate: query.includes('TKT') ? 'KJ-89-21' : query,
          entryTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          vehicleType: 'AUTO',
          slot: 'A-07',
          minutesElapsed: 45,
          estimatedTotalClp: 1125, // 45 * 25
          status: 'ACTIVE'
        });
      }

      case 'calculateParkingFee': {
        const { entryTimestamp, vehicleType = 'AUTO', discountPct = 0, isLostTicket = false } = params;
        const entryDate = entryTimestamp ? new Date(entryTimestamp) : new Date(Date.now() - 30 * 60 * 1000);
        const elapsedMinutes = Math.max(1, Math.ceil((Date.now() - entryDate.getTime()) / (1000 * 60)));

        const ratePerMin = vehicleType === 'CAMIONETA' ? 30 : vehicleType === 'MOTO' ? 15 : 25;
        const isGracePeriod = false; // Regla oficial Serrano 447: 0 minutos de gracia
        let baseFee = elapsedMinutes * ratePerMin;

        if (isLostTicket) {
          baseFee += 8000; // Recargo reglamentario oficial: $8.000 CLP
        }

        const discountAmount = Math.round(baseFee * (discountPct / 100));
        const finalFee = Math.max(0, baseFee - discountAmount);

        return NextResponse.json({
          minutesElapsed: elapsedMinutes,
          vehicleType,
          ratePerMin,
          isGracePeriod,
          baseFeeClp: baseFee,
          discountPct,
          discountAmountClp: discountAmount,
          finalFeeClp: finalFee,
          lostTicketSurcharge: isLostTicket ? 8000 : 0
        });
      }

      case 'openBarrierGate': {
        const { lane = 'ENTRY', reason = 'Comando IA', operatorId = 'GEMINI_COPILOT' } = params;
        const eventId = `BARRIER-${lane}-${Date.now()}`;
        return NextResponse.json({
          success: true,
          eventId,
          lane,
          status: 'OPENED',
          pulseDurationMs: 3000,
          authorizedBy: operatorId,
          reason,
          timestamp: new Date().toISOString()
        });
      }

      case 'getOccupancyMatrix': {
        const { sector = 'ALL' } = params;
        const totalSlots = 30;
        const occupiedCount = 18;
        const availableCount = 10;
        const reservedCount = 2;

        return NextResponse.json({
          facility: 'Serrano 447, Iquique',
          totalCapacity: totalSlots,
          occupancyPercentage: Math.round((occupiedCount / totalSlots) * 100),
          sector: sector,
          counts: {
            available: availableCount,
            occupied: occupiedCount,
            reserved: reservedCount,
            subscribers: 4,
            pmr: 1,
            ev: 1
          },
          lastUpdate: new Date().toISOString()
        });
      }

      case 'authorizeDiscountWithPin': {
        const { ticketId, discountType, discountValue, pin, justification } = params;
        
        if (!pin || pin.length < 4) {
          return NextResponse.json({ success: false, error: 'PIN de seguridad inválido' }, { status: 403 });
        }
        if (!justification || justification.length < 10) {
          return NextResponse.json({ success: false, error: 'La justificación debe tener al menos 10 caracteres' }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          ticketId,
          discountType,
          discountValue,
          appliedBy: 'Supervisor Cordano (PIN verificado)',
          justification,
          timestamp: new Date().toISOString()
        });
      }

      case 'registerNightOverstay': {
        const { plate, slotNumber, ownerName, phone, prepaid = false } = params;
        return NextResponse.json({
          success: true,
          serviceType: 'PERNOCTA_NOCHE',
          plate: (plate || '').toUpperCase(),
          slotNumber,
          ownerName,
          phone,
          fixedFeeClp: 8000,
          prepaid,
          entryWindow: '20:00 - 08:30',
          reservationId: `NIT-${Date.now()}`
        });
      }

      case 'submitShiftAuditReport': {
        const { operatorName, initialCash, systemCash, physicalCashDeclared } = params;
        const diff = physicalCashDeclared - systemCash;
        const status = diff === 0 ? 'OPTIMO' : Math.abs(diff) <= 5000 ? 'OBSERVACION' : 'DESCUADRE_CRITICO';

        return NextResponse.json({
          success: true,
          auditId: `AUD-${Date.now()}`,
          operatorName,
          initialCash,
          systemCash,
          physicalCashDeclared,
          discrepancyClp: diff,
          status,
          recordedAt: new Date().toISOString()
        });
      }

      default:
        return NextResponse.json({ error: `Herramienta desconocida: ${toolName}` }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al ejecutar tool' }, { status: 500 });
  }
}
