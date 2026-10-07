import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParking } from '../context/ParkingContext';
import {
  Clock,
  Wifi,
  WifiOff,
  Car,
  ClipboardCheck,
  AlertTriangle,
  Lock,
  ArrowRight
} from 'lucide-react';

interface ShiftPersistentWidgetProps {
  onNavigateToClose?: () => void;
}

export const ShiftPersistentWidget: React.FC<ShiftPersistentWidgetProps> = ({
  onNavigateToClose
}) => {
  const {
    currentShift,
    slots,
    tickets,
    isOffline,
    syncQueueCount,
    checklistTasks,
    setIsChecklistModalOpen,
    checklistSnoozeRemainingSeconds,
    user
  } = useParking();

  const [isExpanded, setIsExpanded] = useState(false);
  const [elapsedString, setElapsedString] = useState<string>('00h 00m');

  // Compute live elapsed time since shift start
  useEffect(() => {
    const updateTimer = () => {
      if (!currentShift.startTime) return;
      const start = new Date(currentShift.startTime).getTime();
      const now = Date.now();
      const diffMs = Math.max(0, now - start);

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const hStr = String(hours).padStart(2, '0');
      const mStr = String(minutes).padStart(2, '0');
      const sStr = String(seconds).padStart(2, '0');

      setElapsedString(`${hStr}h ${mStr}m ${sStr}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentShift.startTime]);

  // Format shift start time
  const startTimeFormatted = currentShift.startTime
    ? new Date(currentShift.startTime).toLocaleTimeString('es-CL', {
        timeZone: 'America/Santiago',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '--:--';

  const occupiedSlots = slots.filter((s) => s.status === 'ocupado').length;
  const isChecklistPending = !currentShift.checklistCompleted;

  // Compute paid tickets in this shift
  const paidTickets = tickets.filter((t) => t.status === 'pagado');
  const totalRevenue = paidTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  // If shift is closed, show subtle titanium pill
  if (currentShift.status !== 'abierto') {
    return (
      <div
        id="shift-widget-closed"
        className="fixed bottom-4 left-4 z-40 bg-[#0B0F19]/80 backdrop-blur-xl px-4 py-2.5 rounded-full border border-white/10 shadow-glass flex items-center space-x-2 text-xs font-sans select-none"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
        <span className="font-bold text-[#94A3B8]">Sin Turno Activo</span>
      </div>
    );
  }

  return (
    <div
      id="shift-persistent-widget-container"
      className="fixed bottom-4 left-4 z-40 font-sans"
    >
      {/* Expanded Popover */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="shift-widget-expanded-drawer"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="mb-3 w-80 bg-[#0B0F19]/95 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-glass p-4 space-y-3.5 text-xs text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-900" />
                </span>
                <span className="font-extrabold text-white tracking-wide">
                  Turno Activo (#{currentShift.id})
                </span>
              </div>
              <span className="text-[10px] font-mono text-pink-300 bg-[#0F172A]/30 border border-[#0F172A]/50 px-2 py-0.5 rounded-full font-extrabold">
                {currentShift.operatorName}
              </span>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-2xl bg-[#111726]/80 border border-white/10">
                <span className="text-[10px] font-bold text-[#94A3B8] block uppercase">
                  Fondo Inicial
                </span>
                <span className="text-sm font-mono font-extrabold text-white">
                  ${(currentShift.initialCash || 0).toLocaleString('es-CL')}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#111726]/80 border border-white/10">
                <span className="text-[10px] font-bold text-[#94A3B8] block uppercase">
                  Recaudación Turno
                </span>
                <span className="text-sm font-mono font-extrabold text-slate-800">
                  ${totalRevenue.toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            {/* Arrastre & Ocupación */}
            <div className="p-2.5 rounded-2xl bg-[#111726]/80 border border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Car className="w-4 h-4 text-pink-400" />
                <div>
                  <span className="text-[11px] font-bold text-white block">
                    Ocupación del Patio
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">
                    {30 - occupiedSlots} de 30 cupos libres
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-extrabold text-pink-300 bg-[#0F172A]/20 px-2 py-1 rounded-xl border border-[#0F172A]/30">
                {occupiedSlots} / 30 Slots
              </span>
            </div>

            {/* Checklist Action if pending */}
            {isChecklistPending ? (
              <button
                id="btn-open-checklist-widget"
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setIsChecklistModalOpen(true);
                }}
                className="w-full p-2.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 font-bold text-xs flex items-center justify-between hover:bg-amber-900/40 transition cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Chequeo Apertura Pendiente</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            ) : (
              <div className="p-2.5 rounded-2xl bg-slate-900/30 border border-slate-400/30 text-slate-800 text-[11px] font-bold flex items-center space-x-2">
                <ClipboardCheck className="w-4 h-4 text-slate-800" />
                <span>Inspección de Apertura Auditada</span>
              </div>
            )}

            {/* Cloud Firestore Status Badge */}
            <div className="p-2.5 rounded-2xl bg-slate-900/40 border border-slate-400/30 flex items-center justify-between text-xs">
              <span className="text-slate-800 font-bold flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
                Cloud Firestore Sync
              </span>
              <span className="text-slate-800 font-mono text-[10px]">GCP #349577440002</span>
            </div>

            {/* Bottom Actions */}
            {onNavigateToClose && (
              <button
                id="btn-widget-cierre-caja"
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  onNavigateToClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0F172A] to-[#1E293B] hover:opacity-95 text-white font-extrabold text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Arqueo y Cierre Ciego de Turno</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Collapsed Pill Bar */}
      <div
        id="shift-widget-pill"
        className="bg-[#0B0F19]/85 backdrop-blur-xl rounded-full border border-white/15 shadow-glass px-3.5 py-2 flex items-center space-x-3 text-xs select-none text-white"
      >
        {/* Pulsing Status Dot & Turno Badge */}
        <button
          id="btn-toggle-shift-widget"
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 hover:opacity-80 transition cursor-pointer"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-900" />
          </span>
          <span className="font-extrabold text-white hidden sm:inline">
            Turno Activo
          </span>
        </button>

        <span className="h-3.5 w-px bg-white/10" />

        {/* Start Time & Elapsed Timer */}
        <div className="flex items-center space-x-1.5 text-[#94A3B8]">
          <Clock className="w-3.5 h-3.5 text-pink-400" />
          <span className="font-mono font-bold text-white text-[11px] sm:text-xs">
            {elapsedString}
          </span>
          <span className="text-[10px] text-[#94A3B8] hidden md:inline">
            (desde {startTimeFormatted})
          </span>
        </div>

        <span className="h-3.5 w-px bg-white/10" />

        {/* Occupancy Indicator */}
        <div className="flex items-center space-x-1 text-[#94A3B8]">
          <Car className="w-3.5 h-3.5 text-pink-400" />
          <span className="font-mono font-bold text-white text-[11px]">
            {occupiedSlots}/30
          </span>
        </div>

        <span className="h-3.5 w-px bg-white/10 hidden sm:block" />

        {/* Online / Sync Status */}
        <div className="hidden sm:flex items-center space-x-1">
          {isOffline ? (
            <span className="flex items-center space-x-1 text-amber-400 font-bold text-[10px]">
              <WifiOff className="w-3 h-3" />
              <span>Offline ({syncQueueCount})</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-slate-800 font-bold text-[10px]">
              <Wifi className="w-3 h-3 text-slate-800" />
              <span className="hidden lg:inline">Firestore Sync OK</span>
            </span>
          )}
        </div>

        {/* Checklist Warning Trigger if pending */}
        {isChecklistPending && (
          <>
            <span className="h-3.5 w-px bg-white/10" />
            <button
              id="btn-shift-widget-checklist-alert"
              type="button"
              onClick={() => setIsChecklistModalOpen(true)}
              className="flex items-center space-x-1 text-amber-400 hover:text-amber-300 font-bold text-[10px] cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3 animate-bounce" />
              <span className="hidden md:inline">
                {checklistSnoozeRemainingSeconds > 0
                  ? `Snooze (${Math.ceil(checklistSnoozeRemainingSeconds / 60)}m)`
                  : 'Checklist'}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
