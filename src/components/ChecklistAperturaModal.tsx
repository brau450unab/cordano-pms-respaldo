import React from 'react';
import { motion } from 'motion/react';
import { useParking } from '../context/ParkingContext';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Car,
  Video,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  X
} from 'lucide-react';

interface ChecklistAperturaModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const ChecklistAperturaModal: React.FC<ChecklistAperturaModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    checklistTasks,
    toggleChecklistTask,
    completeChecklist,
    snoozeChecklist,
    slots,
    currentShift,
    user
  } = useParking();

  if (!isOpen) return null;

  const allCompleted = checklistTasks.every((t) => t.completed);
  const completedCount = checklistTasks.filter((t) => t.completed).length;
  const occupiedSlotsCount = slots.filter((s) => s.status === 'ocupado').length;

  const getItemIcon = (id: string) => {
    switch (id) {
      case 'chk-1':
        return <ShieldCheck className="w-4 h-4 text-[#0F172A]" />;
      case 'chk-2':
        return <Car className="w-4 h-4 text-[#0F172A]" />;
      case 'chk-3':
        return <ClipboardCheck className="w-4 h-4 text-[#0F172A]" />;
      case 'chk-4':
        return <Video className="w-4 h-4 text-[#0F172A]" />;
      case 'chk-5':
        return <Sparkles className="w-4 h-4 text-[#0F172A]" />;
      default:
        return <ClipboardCheck className="w-4 h-4 text-[#0F172A]" />;
    }
  };

  return (
    <div
      id="checklist-apertura-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans text-[#F8FAFC]"
    >
      <motion.div
        id="checklist-apertura-modal-container"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#0B0F19] w-full max-w-lg rounded-3xl border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-[#111827] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-xs border border-white/15">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] tabular-nums font-bold tracking-wider text-pink-300 uppercase bg-[#0F172A]/30 border border-[#0F172A]/50 px-2 py-0.5 rounded-full inline-block">
                  PROTOCOLO DE APERTURA
                </span>
                <span className="text-[10px] tabular-nums font-bold text-slate-400">
                  Turno: {currentShift.id}
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                Inspección de Apertura de Recinto
              </h3>
            </div>
          </div>
          {onClose && (
            <button
              id="btn-close-checklist-x"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Arrastre Context Banner */}
          <div className="p-3.5 bg-[#111827] border border-white/10 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Car className="w-3.5 h-3.5 text-pink-400" />
                <span>Vehículos en Arrastre Físico:</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {occupiedSlotsCount} de 30 slots actualmente ocupados en sistema.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs tabular-nums font-black text-pink-300 bg-[#0F172A]/30 border border-[#0F172A]/50 px-2.5 py-1 rounded-xl">
                {occupiedSlotsCount} Vehículos
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Progreso del Chequeo:</span>
              <span className="tabular-nums font-bold text-pink-400">
                {completedCount} / {checklistTasks.length} completados
              </span>
            </div>
            <div className="w-full h-2 bg-[#06080E] rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#0F172A] to-[#1E293B] transition-all duration-300 rounded-full"
                style={{ width: `${(completedCount / checklistTasks.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Checklist Task Items */}
          <div className="space-y-2">
            {checklistTasks.map((task) => (
              <button
                key={task.id}
                id={`task-item-${task.id}`}
                type="button"
                onClick={() => toggleChecklistTask(task.id)}
                className={`w-full p-3 rounded-2xl border text-left flex items-start space-x-3 transition cursor-pointer ${
                  task.completed
                    ? 'bg-[#1E1E2F]/40 border-slate-400/50 text-[#2D2D44]'
                    : 'bg-[#111827] border-white/10 hover:border-white/25 text-white'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {task.completed ? (
                    <div className="w-5 h-5 rounded-lg bg-[#1E1E2F] text-black flex items-center justify-center font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-lg border-2 border-white/20 hover:border-pink-400 flex items-center justify-center bg-[#06080E]" />
                  )}
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center space-x-1.5 font-bold mb-0.5">
                    {getItemIcon(task.id)}
                    <span className={task.completed ? 'line-through text-[#2D2D44]' : 'text-white'}>
                      {task.label}
                    </span>
                  </div>
                  {task.id === 'chk-2' && (
                    <p className="text-[11px] text-slate-400">
                      Confirma que las patentes en el patio coincidan con los slots ocupados del sistema.
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Warning note on omit */}
          <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-center space-x-2 text-[11px] text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Si seleccionas <strong>"Omitir por ahora"</strong>, el sistema activará un recordatorio automático recurrente cada 15 minutos hasta que completes la inspección.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#111827] flex items-center justify-between gap-3">
          <button
            id="btn-snooze-checklist"
            type="button"
            onClick={snoozeChecklist}
            className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer flex items-center space-x-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Omitir por ahora (15 min)</span>
          </button>

          <button
            id="btn-complete-checklist"
            type="button"
            onClick={completeChecklist}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0F172A] to-[#1E293B] hover:from-[#1E293B] hover:to-[#334155] text-white text-xs font-black transition shadow-xs flex items-center space-x-1.5 cursor-pointer border border-pink-400/30"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Completar Chequeo</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
