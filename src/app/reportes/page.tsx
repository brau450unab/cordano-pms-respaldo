'use client';

import React, { useState } from 'react';
import { MacOSNavigationShell } from '@/components/MacOSNavigationShell';
import { ThermalTicketPDFTemplate } from '@/components/ThermalTicketPDFTemplate';
import { Download, ShieldCheck, Hash } from 'lucide-react';

const HOURLY_STATS = [
  { hour: '08:00', occ: 42, clp: 18500 },
  { hour: '09:00', occ: 65, clp: 29400 },
  { hour: '10:00', occ: 80, clp: 41200 },
  { hour: '11:00', occ: 92, clp: 52800 },
  { hour: '12:00', occ: 96, clp: 61500 },
  { hour: '13:00', occ: 88, clp: 48900 },
  { hour: '14:00', occ: 94, clp: 56200 },
  { hour: '15:00', occ: 78, clp: 39400 },
  { hour: '16:00', occ: 72, clp: 34800 },
  { hour: '17:00', occ: 84, clp: 44100 },
  { hour: '18:00', occ: 68, clp: 31000 },
  { hour: '19:00', occ: 50, clp: 22500 },
];

const Z_REPORTS = [
  {
    folioZ: 'Z-20260419-001',
    fecha: '19/04/2026 16:00',
    operador: 'Ana R. (OP-01)',
    ticketsEmitidos: 64,
    efectivoSistema: 142500,
    efectivoRecontado: 142500,
    diferencia: 0,
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    folioZ: 'Z-20260418-002',
    fecha: '18/04/2026 23:55',
    operador: 'Carlos M. (OP-02)',
    ticketsEmitidos: 71,
    efectivoSistema: 168000,
    efectivoRecontado: 166500,
    diferencia: -1500,
    sha256: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
  },
];

export default function ReportesPage() {
  const [simulateOffline, setSimulateOffline] = useState(false);

  const handleExportCSV = () => {
    const headers = 'Folio_Z,Fecha,Operador,Tickets,Efectivo_Sistema,Efectivo_Recontado,Diferencia,SHA256\n';
    const rows = Z_REPORTS.map(
      (r) =>
        `"${r.folioZ}","${r.fecha}","${r.operador}",${r.ticketsEmitidos},${r.efectivoSistema},${r.efectivoRecontado},${r.diferencia},"${r.sha256}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reportes_z_sha256_cordano.csv';
    a.click();
  };

  return (
    <MacOSNavigationShell
      title="Reportes y Estadísticas (Reporte Z)"
      subtitle="Curva de aforo horario, historial de cierres Z y firma criptográfica SHA-256"
      roleLabel="Auditoría Financiera"
      rightActions={
        <button
          type="button"
          onClick={handleExportCSV}
          className="px-3 py-1.5 rounded bg-[#80093A] hover:bg-[#68072f] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar CSV</span>
        </button>
      }
    >
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Gráfico Horario y Ticket 80mm */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h2 className="text-xs font-bold uppercase text-slate-800">Ocupación Horaria (08:00 a 19:00)</h2>
              <span className="font-mono text-xs text-slate-500">Peak: 12:00 (96%)</span>
            </div>

            <div className="h-48 pt-4 pb-2 px-2 bg-slate-50 rounded border border-slate-200 flex items-end justify-between gap-1.5">
              {HOURLY_STATS.map((item) => (
                <div key={item.hour} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[10px] font-mono font-bold text-slate-600">{item.occ}%</span>
                  <div className="w-full bg-slate-200 rounded-t h-28 flex items-end">
                    <div
                      className="w-full bg-[#80093A] rounded-t"
                      style={{ height: `${item.occ}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{item.hour.slice(0, 2)}h</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">Total Rotativo</span>
                <strong>$480.300 CLP</strong>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">Tickets Emitidos</span>
                <strong>194</strong>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-sans block">Estadía Promedio</span>
                <strong>48 min</strong>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 p-5 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h2 className="text-xs font-bold uppercase text-slate-800">Contrato de Ticket 80mm</h2>
              <button
                type="button"
                onClick={() => setSimulateOffline(!simulateOffline)}
                className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-300"
              >
                {simulateOffline ? 'Modo Offline (-O)' : 'Modo Online'}
              </button>
            </div>

            <ThermalTicketPDFTemplate
              folio="TKT-20260419-T01-0842"
              patente="ABCD-12"
              fecha="19/04/2026"
              horaIngreso="09:30 AM"
              sectorPlaza="Plaza A-12"
              tarifaTexto="$30 / min"
              isOffline={simulateOffline}
              showActions={true}
            />
          </div>
        </div>

        {/* Tabla de Cierres Z con SHA-256 */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h2 className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#80093A]" />
              <span>Historial Inmutable de Cierres Z</span>
            </h2>
            <span className="text-xs font-mono text-emerald-700 font-bold">Firma SHA-256 Verificada</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono tabular-nums">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                  <th className="py-2.5 px-3">Folio Z</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Operador</th>
                  <th className="py-2.5 px-3 text-right">Efectivo Sistema</th>
                  <th className="py-2.5 px-3 text-right">Efectivo Recontado</th>
                  <th className="py-2.5 px-3 text-right">Diferencia</th>
                  <th className="py-2.5 px-3">SHA-256</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Z_REPORTS.map((z) => (
                  <tr key={z.folioZ}>
                    <td className="py-2.5 px-3 font-bold">{z.folioZ}</td>
                    <td className="py-2.5 px-3 text-slate-600">{z.fecha}</td>
                    <td className="py-2.5 px-3 font-sans">{z.operador}</td>
                    <td className="py-2.5 px-3 text-right font-bold">${z.efectivoSistema.toLocaleString('es-CL')}</td>
                    <td className="py-2.5 px-3 text-right font-bold">${z.efectivoRecontado.toLocaleString('es-CL')}</td>
                    <td className="py-2.5 px-3 text-right">
                      {z.diferencia === 0 ? (
                        <span className="text-emerald-700 font-bold">$0 (Cuadre)</span>
                      ) : (
                        <span className="text-rose-700 font-bold">-${Math.abs(z.diferencia).toLocaleString('es-CL')}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[10px]">{z.sha256.slice(0, 16)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MacOSNavigationShell>
  );
}
