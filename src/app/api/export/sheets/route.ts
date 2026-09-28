import { NextResponse } from 'next/server';
import { pmsStore } from '@/lib/pmsStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const periodo = searchParams.get('periodo') || 'hoy';

  const tickets = pmsStore.getTickets();
  const activeShift = pmsStore.getCurrentShift();
  const operatorName = activeShift?.nombre_operador || 'Juan Pérez';

  const header = 'ID_Ticket,Patente,Plaza,Fecha_Hora_Ingreso,Tipo_Vehiculo,Modalidad,Metodo_Pago,Monto_CLP,Operador,Estado';

  const rows = tickets.map((t) => {
    const monto =
      t.monto_total_cobrado ??
      (t.duracion_total_minutos
        ? t.duracion_total_minutos * (t.vehiculo_tipo === 'camioneta' ? 30 : t.vehiculo_tipo === 'moto' ? 15 : 25)
        : 1500);
    return [
      t.id_ticket,
      t.patente,
      t.slot_codigo || `A-${String(t.slot_numero).padStart(2, '0')}`,
      t.fecha_hora_ingreso,
      (t.vehiculo_tipo || 'auto').toUpperCase(),
      t.service_type || 'TRANSITORIO',
      t.metodo_pago || 'PENDIENTE_EN_PATIO',
      monto,
      operatorName,
      t.estado_ticket,
    ].join(',');
  });

  const csvContent = [header, ...rows].join('\n');

  return new NextResponse('\uFEFF' + csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="parkops_serrano447_${periodo}.csv"`,
      'Access-Control-Allow-Origin': '*',
    },
  });
}
