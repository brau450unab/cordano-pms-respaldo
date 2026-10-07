import React, { useState } from 'react';
import { useParking } from '../../context/ParkingContext';

interface AnalyticsViewProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToCheckout?: (plate: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onShowToast, onNavigateToCheckout }) => {
  const { slots, tickets } = useParking();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | '15d' | '30d'>('today');
  const [dimension, setDimension] = useState<'intervals' | 'heatmap' | 'benchmark' | 'matrix'>('matrix');
  const [selectedSlotForDetail, setSelectedSlotForDetail] = useState<string | null>('A-01');

  const activeTickets = tickets.filter((t) => t.status === 'activo');
  const paidTickets = tickets.filter((t) => t.status === 'pagado');
  const totalRevenue = paidTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const occupiedSlotsCount = slots.filter((s) => s.status === 'ocupado').length;
  const revPas = Math.round((totalRevenue || 342500) / 30);

  const handlePeriodChange = (p: 'today' | 'week' | '15d' | '30d', label: string) => {
    setSelectedPeriod(p);
    onShowToast(`Filtro actualizado a: ${label}`, 'info');
  };

  return (
    <div id="view-map" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 border-b border-[#e8ecf0] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-bold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-pulse" />
            <span>AUDITORÍA ECONÓMICA · SERRANO 447 (30 PLAZAS + 5 SOBRECUPO)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Análisis de Rendimiento &amp; Ocupación Global
          </h2>
          <p className="text-[13px] text-slate-500 mt-1">
            Evaluación del establecimiento: métricas de facturación, efectividad horaria, matriz de 30 plazas y comparativas de tendencia.
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="bg-[#f4f6f9] p-1 rounded-xl flex gap-1 self-start shrink-0 border border-[#dde2e8]">
          {[
            { id: 'today' as const, label: 'Hoy' },
            { id: 'week' as const, label: 'Esta Sem' },
            { id: '15d' as const, label: '15 Días' },
            { id: '30d' as const, label: '30 Días' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => handlePeriodChange(t.id, t.label)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                selectedPeriod === t.id
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4 KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-[#e8ecf0] rounded-2xl shadow-xs hover:border-[#dde2e8] transition-all">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-400 mb-2 flex items-center justify-between">
            <span>Facturación Global</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
              +14.5%
            </span>
          </div>
          <div className="text-3xl font-black font-mono tabular-nums tracking-tight text-emerald-600">
            ${(totalRevenue || 342500).toLocaleString('es-CL')}
          </div>
          <div className="text-[12px] text-slate-500 mt-2">
            {paidTickets.length || 48} vehículos atendidos
          </div>
        </div>

        <div className="p-5 bg-white border border-[#e8ecf0] rounded-2xl shadow-xs hover:border-[#dde2e8] transition-all">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-400 mb-2 flex items-center justify-between">
            <span>RevPAS Recinto</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700 border-sky-200">
              KPI
            </span>
          </div>
          <div className="text-3xl font-black font-mono tabular-nums tracking-tight text-slate-900">
            ${revPas.toLocaleString('es-CL')}
          </div>
          <div className="text-[12px] text-slate-500 mt-2">Ingreso diario / plaza física</div>
        </div>

        <div className="p-5 bg-white border border-[#e8ecf0] rounded-2xl shadow-xs hover:border-[#dde2e8] transition-all">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-400 mb-2 flex items-center justify-between">
            <span>Rotación (Turnover)</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
              Óptimo
            </span>
          </div>
          <div className="text-3xl font-black font-mono tabular-nums tracking-tight text-slate-900">
            1.60x
          </div>
          <div className="text-[12px] text-slate-500 mt-2">Rotaciones diarias por cupo</div>
        </div>

        <div className="p-5 bg-white border border-[#e8ecf0] rounded-2xl shadow-xs hover:border-[#dde2e8] transition-all">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-400 mb-2 flex items-center justify-between">
            <span>Permanencia (ALOS)</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
              Media
            </span>
          </div>
          <div className="text-3xl font-black font-mono tabular-nums tracking-tight text-slate-900">
            51 min
          </div>
          <div className="text-[12px] text-slate-500 mt-2">Estadía media global</div>
        </div>
      </div>

      {/* ── DIMENSION TABS SELECTOR ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'matrix' as const, label: 'Plano Físico 30 Plazas (Serrano 447)' },
          { id: 'intervals' as const, label: 'Franjas Horarias & Efectividad' },
          { id: 'heatmap' as const, label: 'Matriz Semanal' },
          { id: 'benchmark' as const, label: 'Comparativa por Días' },
        ].map((d) => (
          <button
            key={d.id}
            onClick={() => setDimension(d.id)}
            className={`px-4 h-10 shrink-0 rounded-xl text-[13px] transition-all cursor-pointer ${
              dimension === d.id
                ? 'bg-slate-900 text-white shadow-xs font-bold'
                : 'bg-[#f4f6f9] text-slate-600 font-medium hover:text-slate-900 hover:bg-[#eceef2]'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* ── MAIN CHART + DETAIL GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Panel */}
        <div className="lg:col-span-8 bg-white border border-[#e8ecf0] rounded-2xl shadow-xs p-6 space-y-5">
          <div className="border-b border-[#f1f5f9] pb-4">
            <h3 className="text-[15px] font-bold tracking-tight text-slate-900">
              {dimension === 'matrix' && 'Matriz Semántica Serrano 447 (Sector A: 01–15 | Sector B: 16–30)'}
              {dimension === 'intervals' && 'Efectividad por Franjas Horarias'}
              {dimension === 'heatmap' && 'Matriz Semanal de Calor (Ocupación y Flujo)'}
              {dimension === 'benchmark' && 'Comparativa de Tendencia: Hoy vs Promedio Histórico'}
            </h3>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {dimension === 'matrix' &&
                'Código semántico oficial: Libre (#10B981), Ocupada (#64748B), Abonado/VIP (#3B82F6), PMR (#06B6D4), EV (#8B5CF6), Sobrestadía (#EF4444).'}
              {dimension === 'intervals' &&
                'Rendimiento monetario por hora activa ($/hr) y porcentaje de afluencia del recinto.'}
              {dimension === 'heatmap' &&
                'Densidad de saturación física en los 7 días de la semana por bloques horarios.'}
              {dimension === 'benchmark' &&
                'Evaluación del comportamiento de la jornada contra el promedio histórico.'}
            </p>
          </div>

          {/* 1. MATRIX 30 PLAZAS */}
          {dimension === 'matrix' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5 font-mono text-xs tabular-nums">
                {Array.from({ length: 30 }, (_, idx) => {
                  const slotNum = idx + 1;
                  const slotCode =
                    slotNum <= 15
                      ? `A-${slotNum.toString().padStart(2, '0')}`
                      : `B-${slotNum.toString().padStart(2, '0')}`;
                  const slotItem = slots.find((s) => s.code === slotCode);
                  const activeTkt = activeTickets.find((t) => t.slotCode === slotCode);
                  const isSelected = selectedSlotForDetail === slotCode;

                  const durationMin = activeTkt
                    ? Math.max(1, Math.floor((Date.now() - new Date(activeTkt.entryTime).getTime()) / 60000))
                    : 0;
                  const isOverstay = durationMin >= 120;
                  const isPMR = slotNum === 1 || slotNum === 2;
                  const isEV = slotNum === 3;
                  const isAbonado = slotNum >= 29;

                  let bgStyle = 'bg-[#10B981]/10 border-[#10B981] text-emerald-950';
                  let labelBadge = 'LIBRE';

                  if (isOverstay && activeTkt) {
                    bgStyle = 'bg-[#EF4444]/15 border-[#EF4444] text-rose-950 font-bold';
                    labelBadge = activeTkt.plateNumber;
                  } else if (activeTkt || slotItem?.status === 'ocupado') {
                    bgStyle = 'bg-[#64748B]/15 border-[#64748B] text-slate-900 font-bold';
                    labelBadge = activeTkt?.plateNumber || 'OCUPADO';
                  } else if (isAbonado) {
                    bgStyle = 'bg-[#3B82F6]/15 border-[#3B82F6] text-blue-950 font-bold';
                    labelBadge = 'ABONADO';
                  } else if (isPMR) {
                    bgStyle = 'bg-[#06B6D4]/15 border-[#06B6D4] text-cyan-950 font-bold';
                    labelBadge = 'PMR';
                  } else if (isEV) {
                    bgStyle = 'bg-[#8B5CF6]/15 border-[#8B5CF6] text-purple-950 font-bold';
                    labelBadge = 'EV';
                  }

                  return (
                    <div
                      key={slotCode}
                      onClick={() => setSelectedSlotForDetail(slotCode)}
                      className={`p-2.5 rounded-xl border-2 ${bgStyle} cursor-pointer transition-all hover:-translate-y-0.5 h-20 flex flex-col justify-between ${
                        isSelected ? 'ring-2 ring-slate-900 shadow-xs' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold opacity-75">
                        <span>{slotCode}</span>
                        {durationMin > 0 && <span>{durationMin}m</span>}
                      </div>
                      <div className="font-extrabold text-xs tracking-wider truncate">
                        {labelBadge}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. INTERVALS */}
          {dimension === 'intervals' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 tabular-nums">
              <div className="p-5 rounded-2xl border border-[#e8ecf0] bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-bold text-slate-900">Mañana (Apertura)</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">07:00 a 12:00 hrs</div>
                  </div>
                  <span className="text-lg font-black font-mono text-emerald-600">$113.000</span>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1.5">
                    <span>Aporte</span>
                    <span className="font-bold text-slate-800">33.0%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '33%' }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#f1f5f9] text-[11px] font-mono text-center">
                  <div className="bg-[#f8fafc] p-2 rounded-xl border border-[#e8ecf0]">
                    <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em] mb-1">
                      Rendimiento:
                    </span>
                    <span className="font-bold text-emerald-700">$22.600 / hr</span>
                  </div>
                  <div className="bg-[#f8fafc] p-2 rounded-xl border border-[#e8ecf0]">
                    <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em] mb-1">
                      Pico Patio:
                    </span>
                    <span className="font-bold text-slate-800">76%</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-[#e8ecf0] bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-bold text-slate-900">Mediodía &amp; Almuerzo</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">12:00 a 15:30 hrs</div>
                  </div>
                  <span className="text-lg font-black font-mono text-emerald-600">$174.000</span>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1.5">
                    <span>Aporte</span>
                    <span className="font-bold text-slate-800">50.8%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '50.8%' }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#f1f5f9] text-[11px] font-mono text-center">
                  <div className="bg-[#f8fafc] p-2 rounded-xl border border-[#e8ecf0]">
                    <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em] mb-1">
                      Rendimiento:
                    </span>
                    <span className="font-bold text-emerald-700">$49.714 / hr</span>
                  </div>
                  <div className="bg-[#f8fafc] p-2 rounded-xl border border-[#e8ecf0]">
                    <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em] mb-1">
                      Pico Patio:
                    </span>
                    <span className="font-bold text-slate-800">94%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. HEATMAP */}
          {dimension === 'heatmap' && (
            <div className="space-y-3 font-mono text-sm">
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] text-slate-400 font-bold pb-2 border-b border-[#f1f5f9] uppercase tracking-[0.06em]">
                <div>Día</div>
                <div>07-10h</div>
                <div>10-13h</div>
                <div>13-16h</div>
                <div>16-19h</div>
                <div>19-21h</div>
                <div>21-23h</div>
              </div>
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day, idx) => (
                <div key={day} className="grid grid-cols-7 gap-2 items-center text-center">
                  <div className="text-[11px] font-bold text-slate-700 text-left">{day}</div>
                  <div className="h-9 rounded-lg bg-emerald-100" />
                  <div className="h-9 rounded-lg bg-emerald-300" />
                  <div className={`h-9 rounded-lg flex items-center justify-center text-[9px] font-bold ${
                    idx === 1 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-400'
                  }`}>
                    {idx === 1 ? 'PEAK' : ''}
                  </div>
                  <div className="h-9 rounded-lg bg-emerald-200" />
                  <div className="h-9 rounded-lg bg-emerald-50" />
                  <div className="h-9 rounded-lg bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {/* 4. BENCHMARK */}
          {dimension === 'benchmark' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono tabular-nums">
              <div className="p-5 bg-[#f8fafc] rounded-2xl border border-[#e8ecf0]">
                <span className="text-[10px] text-slate-400 block uppercase tracking-[0.07em] mb-2">
                  Facturación Actual:
                </span>
                <span className="text-2xl font-black text-emerald-600">$342.500</span>
              </div>
              <div className="p-5 bg-[#f8fafc] rounded-2xl border border-[#e8ecf0]">
                <span className="text-[10px] text-slate-400 block uppercase tracking-[0.07em] mb-2">
                  Promedio Histórico:
                </span>
                <span className="text-2xl font-bold text-slate-700">$299.000</span>
              </div>
              <div className="p-5 bg-[#f8fafc] rounded-2xl border border-[#e8ecf0]">
                <span className="text-[10px] text-slate-400 block uppercase tracking-[0.07em] mb-2">
                  Variación:
                </span>
                <span className="text-2xl font-black text-emerald-600">+14.5%</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Detail & Diagnostic Column */}
        <div className="lg:col-span-4 space-y-4">
          {/* Slot Detail Panel */}
          {(() => {
            const selectedSlot = slots.find((s) => s.code === selectedSlotForDetail);
            const selectedTkt = activeTickets.find((t) => t.slotCode === selectedSlotForDetail);

            return (
              <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-xs p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono border-b border-[#f1f5f9] pb-2 flex items-center justify-between">
                  <span>Plaza #{selectedSlotForDetail || '---'}</span>
                  <span className="text-[10px] font-mono text-slate-400 font-normal">Serrano 447</span>
                </h3>

                {selectedSlot ? (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e8ecf0] space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Estado:</span>
                        <span className="font-bold uppercase text-slate-900">{selectedSlot.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Zona:</span>
                        <span className="font-bold text-slate-900">{selectedSlot.zone}</span>
                      </div>

                      {selectedTkt && (
                        <>
                          <div className="flex justify-between pt-2 border-t border-[#e8ecf0] items-center">
                            <span className="text-slate-500">Patente:</span>
                            <span className="license-plate-chip px-2.5 py-0.5 font-bold text-sm bg-white">
                              {selectedTkt.plateNumber}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Categoría:</span>
                            <span className="font-bold text-slate-900">{selectedTkt.vehicleType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Ingreso:</span>
                            <span className="font-bold text-slate-900">
                              {new Date(selectedTkt.entryTime).toLocaleTimeString('es-CL', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {selectedTkt && onNavigateToCheckout && (
                      <button
                        onClick={() => onNavigateToCheckout(selectedTkt.plateNumber)}
                        className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                      >
                        Despachar en POS →
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-mono">Seleccione una plaza en el plano.</p>
                )}
              </div>
            );
          })()}

          {/* Diagnostic Panel */}
          <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-900">
                Diagnóstico Operativo
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
                SCORE 94/100
              </span>
            </div>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e8ecf0] space-y-1.5">
                <div className="text-[12px] font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Ventana de Rentabilidad Máxima</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-4">
                  La franja <strong>12:00 a 15:30 hrs</strong> rinde <strong>$49.714 / hr</strong> en Serrano 447.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e8ecf0] space-y-1.5">
                <div className="text-[12px] font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Oportunidad Horario Valle</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-4">
                  Entre <strong>16:00 y 17:30 hrs</strong> la ocupación desciende. Ideal para convenios corporativos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BAR CHART: EVOLUCIÓN HORARIA GLOBAL (07h a 22h) ── */}
      <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-4">
          <div>
            <h3 className="text-[15px] font-bold tracking-tight text-slate-900">
              Evolución Global Horaria: Ocupación vs Recaudación
            </h3>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Comportamiento dinámico de los 30 cupos del establecimiento para optimizar turnos.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-emerald-700 font-mono text-[12px] font-bold shrink-0">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Facturación ($)
          </span>
        </div>

        <div className="h-48 flex items-end gap-2 px-2 tabular-nums">
          {[
            { h: '07h', val: '$12k', pct: 25 },
            { h: '08h', val: '$22k', pct: 45 },
            { h: '09h', val: '$31k', pct: 60 },
            { h: '10h', val: '$36k', pct: 70 },
            { h: '11h', val: '$42k', pct: 80 },
            { h: '12h', val: '$48k', pct: 88 },
            { h: '13h', val: '$58k', pct: 95, peak: true },
            { h: '14h', val: '$52k', pct: 90 },
            { h: '15h', val: '$35k', pct: 68 },
            { h: '16h', val: '$30k', pct: 58 },
            { h: '17h', val: '$38k', pct: 72 },
            { h: '18h', val: '$44k', pct: 82 },
            { h: '19h', val: '$39k', pct: 76 },
            { h: '20h', val: '$29k', pct: 60 },
            { h: '21h', val: '$24k', pct: 50 },
            { h: '22h', val: '$18k', pct: 38 },
          ].map((bar) => (
            <div key={bar.h} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
              {bar.peak && (
                <span className="absolute -top-6 text-[9px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200">
                  PEAK
                </span>
              )}
              <div className="text-[10px] font-mono text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-[#e8ecf0] rounded-lg px-1.5 py-0.5 shadow-xs absolute -top-7 whitespace-nowrap z-10 pointer-events-none">
                {bar.val}
              </div>
              <div
                className="w-full bg-emerald-500 rounded-t transition-all group-hover:bg-emerald-400"
                style={{ height: `${bar.pct}%` }}
              />
              <span className="text-[10px] font-mono text-slate-400 mt-1 shrink-0">{bar.h}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
