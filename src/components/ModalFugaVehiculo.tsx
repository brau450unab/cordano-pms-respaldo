import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket } from '../types';
import { ShieldAlert, AlertTriangle, X, KeyRound, Car, ArrowRight, ShieldCheck } from 'lucide-react';

interface ModalFugaVehiculoProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  onConfirmFuga: (ticketId: string, notes: string, supervisorPin: string) => void;
}

export const ModalFugaVehiculo: React.FC<ModalFugaVehiculoProps> = ({
  isOpen,
  onClose,
  ticket,
  onConfirmFuga,
}) => {
  const [supervisorPin, setSupervisorPin] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !ticket) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!supervisorPin.trim()) {
      setErrorMsg('Debe ingresar el PIN de Supervisor para autorizar.');
      return;
    }

    if (supervisorPin !== '1234' && supervisorPin !== '2026' && supervisorPin !== 'admin123') {
      setErrorMsg('PIN de Supervisor inválido (Prueba: 1234 o 2026).');
      return;
    }

    onConfirmFuga(
      ticket.id,
      notes.trim() || 'Vehículo forzó salida sin registrar pago en caja (Fuga registrada)',
      supervisorPin
    );
    setSupervisorPin('');
    setNotes('');
    setErrorMsg('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 font-['Manrope',sans-serif]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white w-full max-w-md rounded-3xl border border-rose-200 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 bg-rose-600 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-200 bg-black/20 px-2 py-0.5 rounded-full inline-block">
                  FASE 5 • CASO EXCEPCIONAL
                </span>
                <h3 className="text-base font-black text-white">
                  Reportar Fuga de Vehículo
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleConfirm} className="p-5 space-y-4">
            {/* Vehicle Info Box */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white text-rose-700 flex items-center justify-center border border-rose-200 font-bold">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <span className="tabular-nums text-sm font-black text-rose-950 block">
                    {ticket.plateNumber}
                  </span>
                  <span className="text-[10px] font-bold text-rose-700">
                    Slot: {ticket.slotCode} • Ticket: {ticket.ticketCode}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#717785] block">Ingreso:</span>
                <span className="tabular-nums text-xs font-bold text-[#1D1D1F]">
                  {new Date(ticket.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="text-xs text-[#515154] leading-relaxed">
              <p className="font-semibold text-rose-900">
                Esta acción liberará de inmediato el slot <strong className="tabular-nums">{ticket.slotCode}</strong> y registrará una <strong>Alerta Crítica</strong> en la Bitácora de Auditoría (AuditTrail) para persecución y cobro retroactivo.
              </p>
            </div>

            {/* Motivo / Observaciones */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[#1D1D1F] uppercase tracking-wider block">
                Detalle del Incidente / Testigo:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Conductor derribó barrera auxiliar / salió pegado a vehículo anterior sin pagar..."
                className="w-full px-3 py-2 bg-[#f9f9fb] border border-[#c1c6d6] rounded-xl text-xs text-[#1D1D1F] outline-none focus:border-rose-600 focus:bg-white resize-none"
              />
            </div>

            {/* Supervisor PIN input */}
            <div className="space-y-1.5 p-3.5 bg-[#f9f9fb] rounded-2xl border border-[#e2e2e4]">
              <label className="text-[11px] font-black text-[#1D1D1F] uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-rose-600" />
                  <span>PIN Autorización Supervisor:</span>
                </span>
                <span className="text-[10px] tabular-nums text-[#717785]">Requerido</span>
              </label>
              <input
                type="password"
                value={supervisorPin}
                onChange={(e) => setSupervisorPin(e.target.value)}
                placeholder="Ingrese PIN (Ej: 1234 / 2026)"
                className="w-full px-3 py-2.5 bg-white border border-[#c1c6d6] focus:border-rose-600 rounded-xl text-center tabular-nums font-black text-base outline-none tracking-widest"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-xl text-rose-900 text-xs font-bold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[#c1c6d6] text-xs font-bold text-[#515154] hover:bg-[#f3f3f5] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Registrar Fuga</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
