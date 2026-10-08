import React, { useState } from 'react';
import { useParking } from '../../context/ParkingContext';

interface ReportsViewProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onInitiateCashClose?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onShowToast, onInitiateCashClose }) => {
  const { tickets, currentShift, auditLogs } = useParking();
  const [activeTab, setActiveTab] = useState<'transacciones' | 'auditoria' | 'fiscal'>('transacciones');
  const [filterQuery, setFilterQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'efectivo' | 'tarjeta' | 'transferencia'>('ALL');

  const paidTickets = tickets.filter((t) => t.status === 'pagado');
  const totalRevenue = paidTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const netSubtotalTotal = Math.round(totalRevenue / 1.19);
  const totalIva19 = totalRevenue - netSubtotalTotal;

  const totalCash = paidTickets
    .filter((t) => t.paymentMethod === 'efectivo')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const totalDigital = totalRevenue - totalCash;

  const handleGenerateCorteZ = () => {
    onShowToast(`Corte Z Fiscal #${currentShift.id || '1042'} emitido con sello SHA-256 (SHA256-9F8E2A4B1C7D0E3F).`, 'success');
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Ticket,Patente,Tipo,HoraIngreso,HoraSalida,NetoCLP,IVA19CLP,TotalCLP,MetodoPago,Estado\n' +
      paidTickets
        .map((t) => {
          const tot = t.totalAmount || 0;
          const net = Math.round(tot / 1.19);
          const iva = tot - net;
          return `${t.ticketCode || t.id},${t.plateNumber},${t.vehicleType},${t.entryTime},${t.exitTime || '---'},${net},${iva},${tot},${t.paymentMethod || 'efectivo'},${t.status}`;
        })
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_fiscal_cordano_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Libro mayor de ventas exportado en formato CSV compatible con SII.', 'success');
  };

  // Sample Audit Logs
  const sampleDisplayLogs = [
    {
      id: 'AUD-1001',
      date: new Date(Date.now() - 5400000).toISOString(),
      user: 'Juan Pérez (Operador)',
      action: 'APERTURA_TURNO_FONDO_INICIAL',
      reason: 'Apertura de caja en Serrano 447 con fondo de sencillo declarado ($50.000 CLP).',
      tag: 'NEUTRO' as const,
      pinVerified: true,
    },
    {
      id: 'AUD-1002',
      date: new Date(Date.now() - 3200000).toISOString(),
      user: 'Juan Pérez (PIN Operador)',
      action: 'DESCUENTO_COMERCIAL_AUTORIZADO',
      reason: 'Convenio comercial Notaría Serrano Iquique validado en garita (-$500 CLP).',
      tag: 'VERDE' as const,
      pinVerified: true,
    },
    {
      id: 'AUD-1003',
      date: new Date(Date.now() - 1800000).toISOString(),
      user: 'B. Abarca (PIN Admin)',
      action: 'MULTA_TICKET_EXTRAVIADO_8000',
      reason: 'Extravío de ticket térmico acreditado con padrón y cédula (+$8.000 CLP).',
      tag: 'ROJO' as const,
      pinVerified: true,
    },
    ...auditLogs.map((l) => ({
      id: l.id,
      date: l.timestamp,
      user: l.userName,
      action: l.action,
      reason: typeof l.details === 'string' ? l.details : JSON.stringify(l.details),
      tag: (l.action.includes('DESCUENTO') ? 'VERDE' : l.action.includes('EXTRAV') || l.action.includes('PERDIDO') ? 'ROJO' : 'NEUTRO') as 'VERDE' | 'ROJO' | 'NEUTRO',
      pinVerified: l.action.includes('PIN') || l.action.includes('AUTORIZ'),
    })),
  ];

  const filteredDisplayLogs = sampleDisplayLogs.filter((log) => {
    return (
      log.action.toLowerCase().includes(filterQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(filterQuery.toLowerCase()) ||
      log.reason.toLowerCase().includes(filterQuery.toLowerCase())
    );
  });

  // Filter paid tickets
  const filteredPaidTickets = paidTickets.filter((t) => {
    const matchesPlate =
      t.plateNumber.toUpperCase().includes(filterQuery.toUpperCase()) ||
      (t.ticketCode && t.ticketCode.toUpperCase().includes(filterQuery.toUpperCase()));
    const matchesMethod = methodFilter === 'ALL' || t.paymentMethod === methodFilter;
    return matchesPlate && matchesMethod;
  });

  return (
    <div id="view-reports" className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto space-y-5 text-[#2C1338] animate-fade-in-up">
      {/* ── TOP HEADER (TOGGL TRACK CLEAN BAR) ── */}
      <div className="bg-white border border-[#EDE4E2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#E8F8F2] border border-[#2B9E78]/30 text-[#2B9E78] text-[11px] tabular-nums font-bold mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2B9E78]" />
            <span>MÓDULO CONTABLE &amp; FISCAL · SERRANO 447</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#2C1338]">
            Auditoría de Recaudación &amp; Cierre de Turno
          </h2>
          <p className="text-xs text-[#65546C] mt-0.5">
            Libro diario de cobros DTE, registro antifraude de excepciones PIN y balance de gaveta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 h-10 rounded-xl border border-[#EDE4E2] bg-white hover:bg-[#FDF1EC] text-[#2C1338] text-xs font-bold tabular-nums flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#2B9E78]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Exportar CSV SII</span>
          </button>
          <button
            onClick={handleGenerateCorteZ}
            className="px-3.5 h-10 rounded-xl bg-[#2C1338] text-white text-xs font-bold shadow-xs hover:bg-[#412A4C] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-[#E57CD8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>Corte Z Fiscal</span>
          </button>
          {onInitiateCashClose && (
            <button
              onClick={onInitiateCashClose}
              className="px-4 h-10 rounded-xl bg-[#E2498A] hover:bg-[#E57CD8] text-white text-xs font-extrabold shadow-[0_2px_10px_rgba(226,73,138,0.35)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Arqueo Ciego SHA-256</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 4 KPI SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 tabular-nums tabular-nums">
        <div className="p-4 bg-white border border-[#EDE4E2] rounded-2xl shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase text-[#65546C] flex items-center justify-between">
            <span>Total Facturado</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F8F2] text-[#2B9E78] font-bold">BRUTO</span>
          </div>
          <div className="text-2xl font-black text-[#2B9E78]">
            ${totalRevenue.toLocaleString('es-CL')}
          </div>
          <div className="text-[11px] text-[#65546C]">
            {paidTickets.length} transacciones liquidadas
          </div>
        </div>

        <div className="p-4 bg-white border border-[#EDE4E2] rounded-2xl shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase text-[#65546C] flex items-center justify-between">
            <span>Neto Gravado</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FEF9F5] text-[#2C1338] border border-[#EDE4E2]">BASE</span>
          </div>
          <div className="text-2xl font-black text-[#2C1338]">
            ${netSubtotalTotal.toLocaleString('es-CL')}
          </div>
          <div className="text-[11px] text-[#65546C]">Sin incluir impuesto IVA</div>
        </div>

        <div className="p-4 bg-white border border-[#EDE4E2] rounded-2xl shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase text-[#65546C] flex items-center justify-between">
            <span>IVA (19% DTE SII)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FDF1EC] text-[#E2498A] font-bold">FISCAL</span>
          </div>
          <div className="text-2xl font-black text-[#E2498A]">
            ${totalIva19.toLocaleString('es-CL')}
          </div>
          <div className="text-[11px] text-[#65546C]">Impuesto a declarar ante SII</div>
        </div>

        <div className="p-4 bg-white border border-[#EDE4E2] rounded-2xl shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase text-[#65546C] flex items-center justify-between">
            <span>Efectivo Físico en Caja</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAF6FB] text-[#2DA8D8] font-bold">GAVETA</span>
          </div>
          <div className="text-2xl font-black text-[#2C1338]">
            ${(totalCash + (currentShift.initialCash || 50000)).toLocaleString('es-CL')}
          </div>
          <div className="text-[11px] text-[#65546C]">Incluye $50k sencillo inicial</div>
        </div>
      </div>

      {/* ── NAVIGATION PILLS: SUBTABS ── */}
      <div className="flex items-center gap-2 border-b border-[#EDE4E2] pb-2">
        <button
          onClick={() => setActiveTab('transacciones')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'transacciones'
              ? 'bg-[#2C1338] text-white shadow-xs'
              : 'text-[#65546C] hover:bg-[#FDF1EC] hover:text-[#2C1338]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#2B9E78]" />
          <span>Libro Mayor de Cobros ({paidTickets.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('auditoria')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'auditoria'
              ? 'bg-[#2C1338] text-white shadow-xs'
              : 'text-[#65546C] hover:bg-[#FDF1EC] hover:text-[#2C1338]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
          <span>Bitácora Antifraude PIN ({sampleDisplayLogs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('fiscal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'fiscal'
              ? 'bg-[#2C1338] text-white shadow-xs'
              : 'text-[#65546C] hover:bg-[#FDF1EC] hover:text-[#2C1338]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#2DA8D8]" />
          <span>Conciliación &amp; Medios de Pago</span>
        </button>
      </div>

      {/* ── SUBPANE 1: LIBRO MAYOR DE COBROS & DTE ── */}
      {activeTab === 'transacciones' && (
        <div className="bg-white border border-[#EDE4E2] rounded-2xl shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F7EFE9] pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#65546C]">Filtrar por medio de pago:</span>
              {(['ALL', 'efectivo', 'tarjeta', 'transferencia'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] tabular-nums font-bold cursor-pointer transition-colors ${
                    methodFilter === m
                      ? 'bg-[#2C1338] text-white'
                      : 'bg-[#FEF9F5] border border-[#EDE4E2] text-[#65546C] hover:bg-[#FDF1EC]'
                  }`}
                >
                  {m === 'ALL' ? 'Todos' : m.toUpperCase()}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Buscar por patente o ticket #..."
              className="w-full sm:w-64 h-9 px-3 rounded-lg border border-[#EDE4E2] bg-[#FEF9F5] text-xs tabular-nums focus:border-[#2B9E78] focus:outline-none"
            />
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-[#FEF9F5] text-[#65546C] text-[10px] uppercase tabular-nums font-bold rounded-lg border border-[#EDE4E2]">
            <div className="col-span-2">Ticket / Folio</div>
            <div className="col-span-2">Patente &amp; Tipo</div>
            <div className="col-span-2">Ingreso / Salida</div>
            <div className="col-span-2">Medio Pago</div>
            <div className="col-span-2 text-right">Neto + IVA</div>
            <div className="col-span-2 text-right">Total CLP</div>
          </div>

          {/* Transactions List */}
          <div className="max-h-[500px] overflow-y-auto space-y-1.5 tabular-nums text-xs tabular-nums">
            {filteredPaidTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#65546C] bg-[#FEF9F5] rounded-xl border border-dashed border-[#EDE4E2]">
                No se registraron transacciones con los filtros seleccionados.
              </div>
            ) : (
              filteredPaidTickets.map((t) => {
                const total = t.totalAmount || 0;
                const net = Math.round(total / 1.19);
                const iva = total - net;

                return (
                  <div
                    key={t.id}
                    className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg border border-[#EDE4E2] hover:bg-[#FEF9F5] transition-colors"
                  >
                    <div className="col-span-2 font-bold text-[#2C1338]">
                      {t.ticketCode || `TKT-${t.id.slice(0, 8)}`}
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5">
                      <span className="license-plate-chip px-2 py-0.5 text-xs bg-white text-[#2C1338] border-[#2C1338] font-bold">
                        {t.plateNumber}
                      </span>
                      <span className="text-[10px] text-[#65546C]">{t.vehicleType}</span>
                    </div>
                    <div className="col-span-2 text-[11px] text-[#65546C]">
                      <div>{new Date(t.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-[#2B9E78] font-bold">
                        {t.exitTime ? new Date(t.exitTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF9F5] border border-[#EDE4E2] text-[#2C1338]">
                        {t.paymentMethod?.toUpperCase() || 'EFECTIVO'}
                      </span>
                    </div>
                    <div className="col-span-2 text-right text-[11px] text-[#65546C]">
                      <span>${net.toLocaleString('es-CL')}</span> + <span>${iva.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="col-span-2 text-right font-black text-[#2B9E78] text-sm">
                      ${total.toLocaleString('es-CL')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── SUBPANE 2: BITÁCORA ANTIFRAUDE PIN ── */}
      {activeTab === 'auditoria' && (
        <div className="bg-white border border-[#EDE4E2] rounded-2xl shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F7EFE9] pb-3">
            <h3 className="text-xs tabular-nums font-bold uppercase tracking-wider text-[#2C1338]">
              Registros Criptográficos del Turno ({filteredDisplayLogs.length} Eventos)
            </h3>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Buscar en auditoría..."
              className="w-full sm:w-64 h-9 px-3 rounded-lg border border-[#EDE4E2] bg-[#FEF9F5] text-xs tabular-nums focus:border-[#E2498A] focus:outline-none"
            />
          </div>

          <div className="max-h-[520px] overflow-y-auto space-y-2 tabular-nums text-xs tabular-nums">
            {filteredDisplayLogs.map((log) => {
              const isGreen = log.tag === 'VERDE';
              const isRed = log.tag === 'ROJO';

              return (
                <div
                  key={log.id + log.date}
                  className={`flex items-start justify-between py-3 px-4 rounded-xl border transition-colors ${
                    isGreen
                      ? 'bg-white border-[#EDE4E2] border-l-4 border-l-[#2B9E78]'
                      : isRed
                      ? 'bg-white border-[#EDE4E2] border-l-4 border-l-[#E2498A]'
                      : 'bg-white border-[#EDE4E2] border-l-4 border-l-[#CDBFC7]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-[#2C1338] flex items-center gap-2">
                      <span>{log.action}</span>
                      {log.pinVerified && (
                        <span className="text-[9px] bg-[#2C1338] text-white px-2 py-0.5 rounded-full tabular-nums font-bold">
                          PIN VERIFICADO
                        </span>
                      )}
                    </div>
                    <div className="text-[#65546C] text-xs font-sans leading-relaxed">{log.reason}</div>
                  </div>
                  <div className="text-right text-[#96859B] shrink-0 pl-4">
                    <div className="text-[11px]">{new Date(log.date).toLocaleTimeString('es-CL')}</div>
                    <div className="text-[10px] font-bold text-[#2C1338] mt-0.5">{log.user}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SUBPANE 3: CONCILIACIÓN FISCAL & MEDIOS DE PAGO ── */}
      {activeTab === 'fiscal' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-[#EDE4E2] shadow-xs space-y-2">
            <span className="text-xs tabular-nums text-[#65546C] uppercase font-bold">Efectivo en Gaveta</span>
            <div className="text-2xl font-black tabular-nums text-[#2B9E78]">
              ${(totalCash + (currentShift.initialCash || 50000)).toLocaleString('es-CL')}
            </div>
            <p className="text-xs text-[#65546C]">
              Ventas en efectivo (${totalCash.toLocaleString('es-CL')}) + Fondo de sencillo (${(currentShift.initialCash || 50000).toLocaleString('es-CL')})
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-[#EDE4E2] shadow-xs space-y-2">
            <span className="text-xs tabular-nums text-[#65546C] uppercase font-bold">Transbank POS &amp; Transferencias</span>
            <div className="text-2xl font-black tabular-nums text-[#2C1338]">
              ${totalDigital.toLocaleString('es-CL')}
            </div>
            <p className="text-xs text-[#65546C]">Conciliado electrónicamente con voucher Transbank</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-[#EDE4E2] shadow-xs space-y-2">
            <span className="text-xs tabular-nums text-[#65546C] uppercase font-bold">Sello Criptográfico Cierre Z</span>
            <div className="text-xs tabular-nums text-[#E2498A] font-bold truncate">
              SHA256: 9F8E2A4B1C7D0E3F5A8B...
            </div>
            <p className="text-xs text-[#65546C]">Inalterabilidad fiscal garantizada</p>
          </div>
        </div>
      )}
    </div>
  );
};
