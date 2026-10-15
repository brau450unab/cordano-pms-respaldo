import React, { useState, useEffect, useMemo } from 'react';
import { useParking } from '../../context/ParkingContext';

interface AnalyticsViewProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToCheckout?: (plate: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onShowToast, onNavigateToCheckout }) => {
  const { slots, tickets, user, currentShift, isShiftOpen, isShiftOwner, isViewerOnly } = useParking();
  const [selectedSlotForDetail, setSelectedSlotForDetail] = useState<string | null>('A-01');
  const [now, setNow] = useState(Date.now());
  const [sectorFilter, setSectorFilter] = useState<'TODOS' | 'SECTOR_A' | 'SECTOR_B'>('TODOS');

  // Actualización periódica cada 30 segundos para reflejar minutos y cobros
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const TOTAL_SPOTS = 30;
  const activeTickets = useMemo(() => tickets.filter((t) => t.status === 'activo'), [tickets]);
  const paidTickets = useMemo(() => tickets.filter((t) => t.status === 'pagado'), [tickets]);

  // Plazas ocupadas y libres
  const occupiedSlotsCount = useMemo(() => {
    return slots ? slots.filter((s) => s.status === 'ocupado').length : activeTickets.length;
  }, [slots, activeTickets]);

  const freeSlotsCount = Math.max(0, TOTAL_SPOTS - occupiedSlotsCount);
  const occupancyRate = Math.round((occupiedSlotsCount / TOTAL_SPOTS) * 100);

  // Desglose por Sector
  const occupiedSectorA = useMemo(() => {
    return activeTickets.filter((t) => t.slotCode?.startsWith('A-')).length;
  }, [activeTickets]);

  const occupiedSectorB = useMemo(() => {
    return activeTickets.filter((t) => t.slotCode?.startsWith('B-')).length;
  }, [activeTickets]);

  // Detección de Sobreestadía (+2 horas / 120 minutos)
  const overstayVehicles = useMemo(() => {
    return activeTickets.filter((t) => {
      const dur = (now - new Date(t.entryTime).getTime()) / 60000;
      return dur >= 120;
    });
  }, [activeTickets, now]);

  // Tiempo promedio de permanencia (ALOS)
  const alosMinutes = useMemo(() => {
    if (paidTickets.length > 0) {
      const totalMinutes = paidTickets.reduce((acc, t) => {
        const exit = t.exitTime ? new Date(t.exitTime).getTime() : now;
        return acc + ((exit - new Date(t.entryTime).getTime()) / 60000);
      }, 0);
      return Math.round(totalMinutes / paidTickets.length);
    }
    return 48; // Benchmark promedio inicial
  }, [paidTickets, now]);

  // Tasa de rotación del día (Vehículos atendidos / Plazas)
  const turnoverRate = useMemo(() => {
    const totalVehicles = activeTickets.length + paidTickets.length;
    return (totalVehicles / TOTAL_SPOTS).toFixed(1);
  }, [activeTickets.length, paidTickets.length]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 space-y-6 text-[#1E1E2F] animate-fade-in-up font-sans">
      {/* ── CABECERA TÁCTICA DEL PATIO ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5F8] border border-[#E2498A]/30 text-[#E2498A] text-xs font-bold font-mono tabular-nums mb-1">
            <span className="w-2 h-2 rounded-full bg-[#E2498A] animate-pulse" />
            <span>DISTRIBUCIÓN Y DISPONIBILIDAD EN VIVO</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1E2F] tracking-tight">
            Patio 2D &amp; Ocupación en Tiempo Real
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Monitoreo táctico de cajones físicos, permanencia vehicular y asignación rápida de garita.
          </p>
        </div>

        {/* Filtro rápido por sector */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="inline-flex p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]">
            <button
              onClick={() => setSectorFilter('TODOS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                sectorFilter === 'TODOS'
                  ? 'bg-white text-[#1E1E2F] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E1E2F]'
              }`}
            >
              Todos (30)
            </button>
            <button
              onClick={() => setSectorFilter('SECTOR_A')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                sectorFilter === 'SECTOR_A'
                  ? 'bg-white text-[#E2498A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E1E2F]'
              }`}
            >
              Sector A (01–15)
            </button>
            <button
              onClick={() => setSectorFilter('SECTOR_B')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                sectorFilter === 'SECTOR_B'
                  ? 'bg-white text-[#E2498A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E1E2F]'
              }`}
            >
              Sector B (16–30)
            </button>
          </div>

          <button
            onClick={() => onShowToast('Plano de patio actualizado con el estado en vivo de garita.', 'info')}
            className="p-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#FFF5F8] text-[#1E1E2F] text-xs font-bold shadow-xs transition cursor-pointer"
            title="Refrescar estado"
          >
            🔄
          </button>
        </div>
      </div>

      {/* ── 4 INDICADORES TÁCTICOS Y SIMPLES DE SUPERVISIÓN ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ocupación Física */}
        <div className="p-4 sm:p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#E2498A]/50 transition-all">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
            <span>Ocupación Física</span>
            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
              occupancyRate >= 90
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : occupancyRate >= 70
                ? 'bg-pink-100 text-[#C83472] border border-pink-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              {occupancyRate >= 90 ? 'SATURADO' : occupancyRate >= 70 ? 'ALTA DEMANDA' : 'DISPONIBLE'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tabular-nums tracking-tight text-[#1E1E2F]">
              {occupancyRate}%
            </span>
            <span className="text-xs font-bold text-[#64748B] font-mono tabular-nums">
              ({occupiedSlotsCount} de {TOTAL_SPOTS} cajones)
            </span>
          </div>
          <div className="w-full bg-[#E2E8F0] h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyRate >= 90 ? 'bg-[#C83472]' : occupancyRate >= 70 ? 'bg-[#E2498A]' : 'bg-emerald-500'
              }`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#64748B] mt-2 pt-2 border-t border-[#F8FAFC] font-mono">
            <span>Sector A: {occupiedSectorA}/15</span>
            <span>Sector B: {occupiedSectorB}/15</span>
          </div>
        </div>

        {/* KPI 2: Disponibilidad Inmediata */}
        <div className="p-4 sm:p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#E2498A]/50 transition-all">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
            <span>Plazas Libres</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ACCESO VEHICULAR
            </span>
          </div>
          <div className="text-3xl font-black font-mono tabular-nums tracking-tight text-emerald-600">
            {freeSlotsCount} <span className="text-base font-semibold text-[#64748B]">libres</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#64748B] mt-2 pt-2 border-t border-[#F8FAFC]">
            <span>Rotación diaria</span>
            <span className="font-mono tabular-nums font-bold text-[#1E1E2F]">{turnoverRate}x veh/plaza</span>
          </div>
        </div>

        {/* KPI 3: Vehículos Activos en Patio */}
        <div className="p-4 sm:p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#E2498A]/50 transition-all">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
            <span>Vehículos en Patio</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF5F8] text-[#E2498A] font-mono">
              EN CURSO
            </span>
          </div>
          <div className="text-3xl font-black font-mono tabular-nums tracking-tight text-[#1E1E2F]">
            {activeTickets.length} <span className="text-base font-medium text-[#64748B]">autos</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#64748B] mt-2 pt-2 border-t border-[#F8FAFC]">
            <span>Estadía media</span>
            <span className="font-mono tabular-nums font-bold text-[#1E1E2F]">{alosMinutes} min</span>
          </div>
        </div>

        {/* KPI 4: Control de Sobreestadía (+2 horas) */}
        <div className="p-4 sm:p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs relative overflow-hidden group hover:border-[#E2498A]/50 transition-all">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
            <span>Sobreestadía (+2h)</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              overstayVehicles.length > 0
                ? 'bg-rose-100 text-rose-700 animate-pulse font-mono'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {overstayVehicles.length > 0 ? '⚠️ ATENCIÓN' : 'NORMAL'}
            </span>
          </div>
          <div className={`text-3xl font-black font-mono tabular-nums tracking-tight ${
            overstayVehicles.length > 0 ? 'text-[#E2498A]' : 'text-slate-700'
          }`}>
            {overstayVehicles.length} <span className="text-base font-medium text-[#64748B]">vehículos</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#64748B] mt-2 pt-2 border-t border-[#F8FAFC]">
            <span>Límite de alerta</span>
            <span className="font-mono text-slate-700 font-semibold">&gt; 120 minutos</span>
          </div>
        </div>
      </div>

      {/* ── MATRIZ DE 30 PLAZAS E INSPECTOR LATERAL ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Grilla Principal de Plazas */}
        <div className="xl:col-span-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-5 sm:p-6 space-y-6">
          <div className="border-b border-[#F8FAFC] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold tracking-tight text-[#1E1E2F] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E2498A]" />
                <span>Distribución Física · Serrano 447 (Iquique)</span>
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Seleccione una plaza para inspeccionar vehículo, tiempo transcurrido o liquidar en garita POS.
              </p>
            </div>

            {/* Convención de Colores */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-[#64748B]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Libre
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E1E2F]" /> Ocupado
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E2498A]" /> Sobreestadía (+2h)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> PMR / Especial
              </span>
            </div>
          </div>

          {/* Grilla Táctica 30 Cajones */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 tabular-nums">
            {Array.from({ length: 30 }, (_, idx) => {
              const slotNum = idx + 1;
              const slotCode =
                slotNum <= 15
                  ? `A-${slotNum.toString().padStart(2, '0')}`
                  : `B-${slotNum.toString().padStart(2, '0')}`;

              // Filtro por sector si está activo
              if (sectorFilter === 'SECTOR_A' && slotNum > 15) return null;
              if (sectorFilter === 'SECTOR_B' && slotNum <= 15) return null;

              const activeTkt = activeTickets.find((t) => t.slotCode === slotCode);
              const isSelected = selectedSlotForDetail === slotCode;

              const durationMin = activeTkt
                ? Math.max(1, Math.floor((now - new Date(activeTkt.entryTime).getTime()) / 60000))
                : 0;
              const accruedFee = durationMin * 35; // Tarifa canónica $35/min
              const isOverstay = durationMin >= 120;
              const isPMR = slotNum === 1 || slotNum === 2;
              const isEV = slotNum === 3;
              const isMensualidad = slotNum >= 29;

              let cardBg = 'bg-emerald-50 border-emerald-500/70 text-emerald-800 hover:border-emerald-600 hover:bg-emerald-100/70 shadow-xs';
              let mainText = 'LIBRE';
              let subText = 'Disponible';

              if (isOverstay && activeTkt) {
                cardBg = 'bg-[#FFF5F8] border-[#E2498A] text-[#E2498A] shadow-xs';
                mainText = activeTkt.plateNumber;
                subText = `$${accruedFee.toLocaleString('es-CL')}`;
              } else if (activeTkt) {
                cardBg = 'bg-[#F0EBF2] border-[#1E1E2F]/30 text-[#1E1E2F] shadow-xs';
                mainText = activeTkt.plateNumber;
                subText = `$${accruedFee.toLocaleString('es-CL')}`;
              } else if (isMensualidad) {
                cardBg = 'bg-[#FFF5F8] border-[#E2498A]/40 text-[#E2498A]';
                mainText = 'ABONADO';
                subText = 'Reservado';
              } else if (isPMR) {
                cardBg = 'bg-[#E0F7FA] border-[#06B6D4]/40 text-[#006064]';
                mainText = 'PMR';
                subText = 'Movilidad Reducida';
              } else if (isEV) {
                cardBg = 'bg-[#F8FAFC] border-[#C83472]/40 text-[#C83472]';
                mainText = 'CARGA EV';
                subText = 'Eléctrico';
              }

              return (
                <div
                  key={slotCode}
                  onClick={() => setSelectedSlotForDetail(slotCode)}
                  className={`p-3 rounded-2xl border-2 ${cardBg} cursor-pointer transition-all flex flex-col justify-between min-h-[102px] relative overflow-hidden ${
                    isSelected ? 'ring-3 ring-[#E2498A] ring-offset-2 shadow-md scale-[1.02]' : 'hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-bold tabular-nums opacity-75 mb-2">
                    <span className="font-mono tracking-wider">{slotCode}</span>
                    {durationMin > 0 && (
                      <span className={`font-mono ${isOverstay ? 'text-[#E2498A] font-black' : ''}`}>
                        {durationMin}m
                      </span>
                    )}
                  </div>

                  <div className="mt-auto">
                    <div className="font-extrabold text-sm sm:text-base tracking-tight leading-none mb-1 font-mono truncate">
                      {mainText}
                    </div>
                    <div className="text-[11px] font-mono tabular-nums font-bold opacity-80 truncate">
                      {subText}
                    </div>
                  </div>

                  {/* Alerta pulsante de sobreestadía */}
                  {isOverstay && activeTkt && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#E2498A] rounded-full animate-ping" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Lateral: Inspector de Plaza Seleccionada */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1E1E2F] mb-4 flex items-center justify-between border-b border-[#F8FAFC] pb-3">
              <span>Inspector de Plaza</span>
              <span className="text-xs font-mono font-black text-[#E2498A] bg-[#FFF5F8] px-2.5 py-1 rounded-lg border border-[#E2498A]/30">
                {selectedSlotForDetail || '---'}
              </span>
            </h3>

            {(() => {
              const selectedSlot = slots.find((s) => s.code === selectedSlotForDetail);
              const selectedTkt = activeTickets.find((t) => t.slotCode === selectedSlotForDetail);

              if (!selectedSlot && !selectedTkt) {
                return (
                  <div className="p-6 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    Haga clic en cualquiera de las 30 plazas para inspeccionar su ocupación.
                  </div>
                );
              }

              const durMin = selectedTkt
                ? Math.max(1, Math.floor((now - new Date(selectedTkt.entryTime).getTime()) / 60000))
                : 0;
              const accrued = durMin * 35;
              const isOverstay = durMin >= 120;

              return (
                <div className="space-y-4">
                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#64748B]">Estado de la Plaza</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] font-mono ${
                        selectedTkt ? 'bg-[#1E1E2F] text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedTkt ? 'Ocupada' : 'Disponible'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#64748B]">Zona Asignada</span>
                      <span className="font-bold text-[#1E1E2F] font-mono">
                        {selectedSlotForDetail?.startsWith('A-') ? 'Sector A (Frontal Serrano)' : 'Sector B (Patio Central)'}
                      </span>
                    </div>

                    {selectedTkt ? (
                      <div className="pt-3 border-t border-[#E2E8F0] space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[#64748B]">Patente</span>
                          <span className="px-2.5 py-1 bg-white border border-[#1E1E2F] rounded text-xs font-mono font-black text-[#1E1E2F] shadow-2xs">
                            {selectedTkt.plateNumber}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-[#64748B]">Cliente Registrado</span>
                          <span className="font-bold text-[#1E1E2F] truncate max-w-[150px]">
                            {selectedTkt.customerName ? `👤 ${selectedTkt.customerName}` : 'Particular'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-[#64748B]">Tipo de Vehículo</span>
                          <span className="font-bold text-[#1E1E2F]">{selectedTkt.vehicleType}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-[#64748B]">Hora Ingreso</span>
                          <span className="font-bold text-[#1E1E2F] font-mono">
                            {new Date(selectedTkt.entryTime).toLocaleTimeString('es-CL', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-[#64748B]">Permanencia</span>
                          <span className={`font-mono font-bold ${isOverstay ? 'text-[#E2498A]' : 'text-[#1E1E2F]'}`}>
                            {durMin} minutos {isOverstay && '(+2h)'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[#E2498A] pt-2 border-t border-[#E2E8F0]">
                          <span className="font-bold">Monto al Momento</span>
                          <span className="font-black font-mono tabular-nums text-lg">
                            $ {accrued.toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded-lg border border-[#E2E8F0] text-center text-xs text-emerald-700 font-semibold">
                        ✓ Cajón listo para recibir vehículo desde Garita POS
                      </div>
                    )}
                  </div>

                  {selectedTkt && onNavigateToCheckout && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!isShiftOpen) {
                          onShowToast('El turno está cerrado. Debe aperturar un turno en Garita para cobrar.', 'error');
                          return;
                        }
                        onNavigateToCheckout(selectedTkt.plateNumber);
                      }}
                      className={`w-full h-11 rounded-xl font-extrabold text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 ${
                        !isShiftOpen
                          ? 'bg-slate-400 text-white cursor-not-allowed'
                          : isViewerOnly
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-[#E2498A] hover:bg-[#C83472] text-white'
                      }`}
                    >
                      <span>{isViewerOnly ? '👁️' : '💳'}</span>
                      <span>
                        {!isShiftOpen
                          ? `Turno Cerrado (${selectedTkt.plateNumber})`
                          : isViewerOnly
                          ? `Ver en Garita POS (${selectedTkt.plateNumber}) [Solo Lectura] →`
                          : `Cobrar en Garita POS (${selectedTkt.plateNumber}) →`}
                      </span>
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
