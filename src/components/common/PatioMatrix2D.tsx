import React, { useState, useMemo } from 'react';
import { PatioVehicle } from '../pms/PosView';

export interface PatioMatrix2DProps {
  activeVehicles: PatioVehicle[];
  onSelectSlot?: (slotCode: string, vehicle?: PatioVehicle) => void;
  selectedSlotCode?: string | null;
  mode?: 'mobile' | 'desktop' | 'responsive';
}

export const PatioMatrix2D: React.FC<PatioMatrix2DProps> = ({
  activeVehicles,
  onSelectSlot,
  selectedSlotCode,
  mode = 'responsive',
}) => {
  const [filter, setFilter] = useState<'TODOS' | 'OCUPADOS' | 'LIBRES' | 'SOBREESTADIA'>('TODOS');
  const [searchPlate, setSearchPlate] = useState('');

  const totalSlotsCount = 30;
  const occupiedCount = activeVehicles.length;
  const freeSlotsCount = Math.max(0, totalSlotsCount - occupiedCount);
  const overstayVehicles = useMemo(() => {
    return activeVehicles.filter((v) => (v.durationMin || 0) >= 120);
  }, [activeVehicles]);

  const formatStayDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const allSlots = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const slotIndex = i + 1;
      const slotCode = slotIndex <= 15 ? `A-${String(slotIndex).padStart(2, '0')}` : `B-${String(slotIndex).padStart(2, '0')}`;
      const vehicle = activeVehicles.find((v) => v.slot === slotIndex || v.slotCode === slotCode);
      const isOccupied = !!vehicle;
      const isOverstay = vehicle ? (vehicle.durationMin || 0) >= 120 : false;
      const isPMR = slotIndex === 1 || slotIndex === 2;
      const isEV = slotIndex === 3;
      const isAbonado = slotIndex >= 29;

      return {
        slotIndex,
        slotCode,
        isOccupied,
        isOverstay,
        isPMR,
        isEV,
        isAbonado,
        vehicle,
      };
    });
  }, [activeVehicles]);

  const filteredSlots = useMemo(() => {
    let list = allSlots;

    if (filter === 'OCUPADOS') {
      list = list.filter((s) => s.isOccupied);
    } else if (filter === 'LIBRES') {
      list = list.filter((s) => !s.isOccupied);
    } else if (filter === 'SOBREESTADIA') {
      list = list.filter((s) => s.isOverstay);
    }

    if (searchPlate.trim()) {
      const q = searchPlate.trim().toUpperCase();
      list = list.filter(
        (s) =>
          s.slotCode.includes(q) ||
          (s.vehicle && s.vehicle.plate.toUpperCase().includes(q))
      );
    }

    return list;
  }, [allSlots, filter, searchPlate]);

  const gridClasses =
    mode === 'mobile'
      ? 'grid grid-cols-2 sm:grid-cols-3 gap-2.5'
      : mode === 'desktop'
      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'
      : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3';

  return (
    <div className="space-y-3 font-sans">
      {/* ── BARRA DE FILTROS TÁCTILES (TOUCH TARGETS >= 44PX) ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'TODOS', label: `Todos (${totalSlotsCount})` },
            { id: 'OCUPADOS', label: `Ocupados (${occupiedCount})` },
            { id: 'LIBRES', label: `Libres (${freeSlotsCount})` },
            { id: 'SOBREESTADIA', label: `> 2h (${overstayVehicles.length})` },
          ].map((f) => {
            const isSelected = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id as any)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                  isSelected
                    ? 'bg-[#E2498A] text-white shadow-sm ring-2 ring-[#E2498A]/30'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Buscador Rápido de Patente o Cupo */}
        <div className="relative min-w-[160px] sm:max-w-xs">
          <input
            type="text"
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
            placeholder="Filtrar patente o cupo..."
            className="w-full min-h-[44px] px-3 pl-8 rounded-xl border border-slate-200 bg-white font-mono text-xs uppercase focus:outline-none focus:border-[#E2498A]"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* ── CUADRÍCULA 2D DE 30 CUPOS (SERRANO 447) ── */}
      <div className={gridClasses}>
        {filteredSlots.map((slot) => {
          const { slotIndex, slotCode, isOccupied, isOverstay, isPMR, isEV, isAbonado, vehicle } = slot;
          const isSelected = selectedSlotCode === slotCode;

          return (
            <div
              key={slotIndex}
              onClick={() => onSelectSlot && onSelectSlot(slotCode, vehicle)}
              className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[120px] shadow-xs active:scale-[0.98] ${
                isSelected ? 'ring-2 ring-offset-2 ring-[#E2498A] scale-[1.02]' : ''
              } ${
                isOccupied
                  ? isOverstay
                    ? 'bg-[#1E1E2F] border-rose-500/80 shadow-rose-500/10'
                    : 'bg-[#1E1E2F] border-slate-700 hover:border-slate-500'
                  : 'bg-emerald-950/30 border-emerald-500/60 hover:bg-emerald-900/40'
              }`}
            >
              {/* Header del Cupo */}
              <div className="flex items-center justify-between w-full">
                <span className={`text-[11px] font-mono font-bold ${isOccupied ? 'text-slate-300' : 'text-emerald-400'}`}>
                  {slotCode}
                </span>
                {isOccupied ? (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isOverstay
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {vehicle?.cat || 'Auto'}
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    {isPMR && (
                      <span className="text-[9px] font-black px-1 rounded bg-cyan-900 text-cyan-300">PMR</span>
                    )}
                    {isEV && (
                      <span className="text-[9px] font-black px-1 rounded bg-purple-900 text-purple-300">EV</span>
                    )}
                    {isAbonado && (
                      <span className="text-[9px] font-black px-1 rounded bg-pink-900 text-pink-300">ABON</span>
                    )}
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Contenido Central */}
              {isOccupied && vehicle ? (
                <div className="my-1.5">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[#E2498A] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-5h14v5z" />
                    </svg>
                    <span className="text-base font-black text-white tracking-wider tabular-nums font-mono">
                      {vehicle.plate}
                    </span>
                  </div>

                  {/* Indicador de Permanencia en Tiempo Real */}
                  <div className="mt-1 flex items-center gap-1">
                    <span
                      className={`text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                        isOverstay
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-[#E2498A]/20 text-[#E2498A] border border-[#E2498A]/30'
                      }`}
                    >
                      <span>⏱️</span>
                      <span>{formatStayDuration(vehicle.durationMin)}</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="my-auto text-center py-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/40">
                    LIBRE
                  </span>
                  <div className="text-[10px] text-emerald-400/80 mt-1">Disponible</div>
                </div>
              )}

              {/* Footer del Cupo */}
              <div className="text-[9px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-700/50">
                {isOccupied && vehicle ? (
                  <>
                    <span className="font-mono">In: {vehicle.entry}</span>
                    <span className="text-[#E2498A] font-bold">Ver ficha →</span>
                  </>
                ) : (
                  <span className="text-emerald-500/80">Serrano 447</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
