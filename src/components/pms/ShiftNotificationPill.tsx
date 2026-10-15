import React, { useState, useEffect } from 'react';
import { Lock, X, Minus, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { Shift, AppScreen } from '../../types';

interface ShiftNotificationPillProps {
  currentShift?: Shift;
  currentScreen: AppScreen;
  onOpenAperturaModal: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

/**
 * ShiftNotificationPill - Notificación discreta y ergonómica de turno cerrado.
 * 
 * Reemplaza el pop-up central invasivo por una cápsula flotante compacta en la
 * esquina inferior derecha, con soporte para minimizar a micro-chip no invasivo.
 */
export const ShiftNotificationPill: React.FC<ShiftNotificationPillProps> = ({
  currentShift,
  currentScreen,
  onOpenAperturaModal,
  onShowToast,
}) => {
  // Solo se muestra si el turno no está abierto
  const isShiftOpen = currentShift?.status === 'abierto';

  // En pantallas administrativas secundarias (settings, reports, support, clients), 
  // iniciamos minimizado por defecto para no invadir al usuario mientras configura o audita
  const isSecondaryScreen = ['settings', 'reports', 'support', 'clients', 'map'].includes(currentScreen);

  // Estado de minimizado
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('cordano_shift_pill_minimized');
      if (stored === 'true') return true;
    } catch {
      // Ignorar fallback
    }
    return isSecondaryScreen;
  });

  // Estado de snooze temporal
  const [snoozeUntil, setSnoozeUntil] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('cordano_shift_reminder_snooze_until');
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val > Date.now()) return val;
      }
    } catch {
      // Ignorar fallback
    }
    return 0;
  });

  // Actualizar si cambia a pantalla secundaria
  useEffect(() => {
    if (isSecondaryScreen) {
      setIsMinimized(true);
    }
  }, [currentScreen, isSecondaryScreen]);

  // Si el turno está abierto o está en período de snooze activo, no renderizar
  if (isShiftOpen || Date.now() < snoozeUntil) {
    return null;
  }

  // Manejador para posponer 15 minutos
  const handleSnooze = (minutes = 15) => {
    const nextSnooze = Date.now() + minutes * 60 * 1000;
    setSnoozeUntil(nextSnooze);
    try {
      localStorage.setItem('cordano_shift_reminder_snooze_until', nextSnooze.toString());
    } catch {
      // Ignorar
    }
    onShowToast(`Aviso de turno pospuesto por ${minutes} minutos.`, 'info');
  };

  // Manejador para toggle de minimizado
  const handleToggleMinimize = (minimized: boolean) => {
    setIsMinimized(minimized);
    try {
      localStorage.setItem('cordano_shift_pill_minimized', minimized ? 'true' : 'false');
    } catch {
      // Ignorar
    }
  };

  // 1. MODO MINI CHIP (No invasivo, discreto en la esquina inferior izquierda)
  if (isMinimized) {
    return (
      <aside 
        aria-label="Aviso de caja cerrada"
        className="fixed bottom-20 md:bottom-4 left-4 z-40 animate-fade-in print:hidden select-none"
      >
        <button
          type="button"
          onClick={() => handleToggleMinimize(false)}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E1E2F]/95 hover:bg-[#2D2D44] text-white border border-amber-500/40 hover:border-[#E2498A]/60 shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-md transition-all duration-200 cursor-pointer text-xs font-semibold"
          title="Turno no iniciado · Clic para ver opciones"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
          <span className="text-slate-300 group-hover:text-white transition-colors">
            Caja cerrada
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-[#E2498A]/20 text-[#E2498A] text-[10px] font-bold">
            Iniciar
          </span>
        </button>
      </aside>
    );
  }

  // 2. MODO CÁPSULA SLIM COMPACTA (Horizontal de bajo perfil)
  return (
    <aside 
      aria-label="Notificación de turno no iniciado"
      className="fixed bottom-20 md:bottom-4 left-4 z-40 max-w-[92vw] sm:max-w-md animate-fade-in-up print:hidden select-none"
    >
      <div className="bg-[#1E1E2F]/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-2xl border border-slate-700/80 shadow-[0_12px_36px_rgba(0,0,0,0.3)] flex items-center gap-3">
        {/* Micro-icono indicador */}
        <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
          <Lock className="w-3.5 h-3.5" />
        </div>

        {/* Textos Concisos */}
        <div className="min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-xs text-white leading-tight">
              Turno no iniciado
            </h4>
            <span className="text-[10px] font-mono font-semibold text-amber-400/90 hidden sm:inline">
              · POS en espera
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight truncate">
            Inicia turno con fondo ($50.000)
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Botón Principal Iniciar */}
          <button
            type="button"
            onClick={onOpenAperturaModal}
            className="px-3 py-1.5 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-black text-xs transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
          >
            <span>Iniciar</span>
            <ChevronRight className="w-3 h-3" />
          </button>

          {/* Minimizar a Chip */}
          <button
            type="button"
            onClick={() => handleToggleMinimize(true)}
            className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Minimizar a botón discreto"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Posponer / Cerrar */}
          <button
            type="button"
            onClick={() => handleSnooze(15)}
            className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Posponer por 15 minutos"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
