import React, { useState, useEffect } from 'react';
import { useParking } from '../../context/ParkingContext';

interface PersistentShiftWidgetProps {
  onNavigateToPos: () => void;
  onInitiateCashClose: () => void;
}

export const PersistentShiftWidget: React.FC<PersistentShiftWidgetProps> = ({
  onNavigateToPos,
  onInitiateCashClose,
}) => {
  const { currentShift, user, tickets } = useParking();
  const [shiftTimer, setShiftTimer] = useState('00:00:00');

  useEffect(() => {
    const updateTimer = () => {
      if (!currentShift.startTime) return;
      const start = new Date(currentShift.startTime).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - start) / 1000));
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(diff % 60).toString().padStart(2, '0');
      setShiftTimer(`${h}:${m}:${s}`);
    };
    if (currentShift.status === 'abierto') {
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setShiftTimer('00:00:00');
    }
  }, [currentShift.startTime, currentShift.status]);

  if (currentShift.status !== 'abierto' || !user) return null;

  const shiftRevenue = tickets
    .filter(t => t.status === 'pagado')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  return (
    <div id="persistent-shift-widget" className="fixed bottom-5 left-5 z-40 group select-none">
      <div 
        onClick={onNavigateToPos}
        className="h-10 px-4 rounded-full bg-[#0f172a] text-white border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.2)] flex items-center gap-2.5 cursor-pointer hover:bg-[#1e293b] transition-all tabular-nums"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 live-pulse" />
        <span className="text-[13px] font-mono font-bold" id="widget-shift-timer">
          {shiftTimer}
        </span>
        <span className="text-white/20">|</span>
        <span className="text-[13px] font-semibold truncate max-w-[120px]">{user.name}</span>
      </div>

      {/* Hover Popover Details */}
      <div className="hidden group-hover:block absolute bottom-12 left-0 w-72 bg-[#0f172a] border border-white/10 rounded-2xl p-5 shadow-[0_16px_48px_rgba(0,0,0,0.3)] text-white text-xs space-y-4 animate-fade-in-up tabular-nums">
        <div className="flex justify-between border-b border-white/10 pb-3">
          <span className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.08em]">
            Turno Garita 01
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-900 font-bold">
            ACTIVO
          </span>
        </div>
        <div className="space-y-2 font-mono text-[12px]">
          <div className="flex justify-between text-slate-400">
            <span>Fondo Inicial:</span>
            <span className="text-white font-semibold">
              ${(currentShift.initialCash || 50000).toLocaleString('es-CL')}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Recaudado Turno:</span>
            <span className="text-emerald-400 font-bold">
              ${shiftRevenue.toLocaleString('es-CL')}
            </span>
          </div>
        </div>
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={onInitiateCashClose}
            className="w-full h-9 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-900/40 text-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Arqueo Ciego &amp; Fin de Turno</span>
          </button>
        </div>
      </div>
    </div>
  );
};
