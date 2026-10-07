import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChileanCashBreakdown } from '../types';
import {
  Calculator,
  ShieldCheck,
  X,
  AlertCircle
} from 'lucide-react';

interface ModalAperturaTurnoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (totalCash: number, breakdown: ChileanCashBreakdown) => void;
  operatorName: string;
  suggestedInitialCash?: number;
}

export const ModalAperturaTurno: React.FC<ModalAperturaTurnoProps> = ({
  isOpen,
  onClose,
  onConfirm,
  operatorName,
  suggestedInitialCash,
}) => {
  // Single input field starting by default at suggestedInitialCash or '0'
  const [initialCash, setInitialCash] = useState<string>('0');
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  // Reset to initial amount when modal opens
  useEffect(() => {
    if (isOpen) {
      if (suggestedInitialCash && suggestedInitialCash > 0) {
        setInitialCash(suggestedInitialCash.toString());
      } else {
        setInitialCash('0');
      }
      setIsConfirmed(false);
    }
  }, [isOpen, suggestedInitialCash]);

  if (!isOpen) return null;

  const parsedAmount = parseInt(initialCash, 10);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const canAdvance = isValidAmount && isConfirmed;

  const handleConfirm = () => {
    if (!canAdvance) return;
    const total = parsedAmount;

    // Helper breakdown for compatibility with backend types
    const breakdown: ChileanCashBreakdown = {
      coins50: 0,
      coins100: 0,
      coins500: 0,
      bills1000: Math.floor((total * 0.4) / 1000),
      bills2000: Math.floor((total * 0.6) / 2000),
      bills5000: 0,
      bills10000: 0,
      bills20000: 0,
    };

    onConfirm(total, breakdown);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-sans text-[#F8FAFC]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="bg-[#0B0F19] w-full max-w-lg rounded-3xl border border-white/15 shadow-2xl overflow-hidden flex flex-col text-white"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#111827]">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-xs border border-white/15 shrink-0">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider text-pink-300 uppercase bg-[#0F172A]/30 border border-[#0F172A]/50 px-2.5 py-0.5 rounded-full inline-block">
                  BLOQUE 1 • CONTROL DE CAJA
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-300 bg-white/10 border border-white/10 px-2 py-0.5 rounded-full">
                  Fondo Inicial
                </span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight mt-0.5">
                Apertura de Turno & Caja Inicial
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 text-sm">
          {/* Operator Banner */}
          <div className="p-3.5 bg-[#111827] border border-white/10 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Operador de Turno:</span>
              <strong className="text-white text-sm">{operatorName}</strong>
            </div>
            <div className="text-right text-slate-400 text-[11px] font-mono">
              <span>Garita 01 • Serrano 447</span>
            </div>
          </div>

          {/* Single Cash Input */}
          <div className="space-y-3 bg-[#111827] p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <label htmlFor="initial-cash-input" className="font-extrabold text-sm text-white">
                Monto de Caja Inicial (Efectivo)
              </label>
              <span className="text-xs font-mono font-bold text-pink-300">
                Fondo Físico en Gaveta
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-2xl text-slate-400">$</span>
              <input
                id="initial-cash-input"
                type="number"
                min="0"
                step="1000"
                value={initialCash}
                onChange={(e) => {
                  setInitialCash(e.target.value);
                  setIsConfirmed(false);
                }}
                onFocus={() => {
                  if (initialCash === '0') {
                    setInitialCash('');
                  }
                }}
                className="w-full pl-10 pr-14 py-3.5 rounded-2xl border-2 border-white/15 text-2xl font-mono font-black text-white outline-none focus:border-[#0F172A] bg-[#06080E] transition"
                placeholder="0"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">CLP</span>
            </div>

            {/* Quick Helper presets for speed */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Sugeridos:</span>
              {[20000, 30000, 40000, 50000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setInitialCash(preset.toString());
                    setIsConfirmed(true);
                  }}
                  className="px-2.5 py-1 bg-white/5 border border-white/10 hover:border-pink-500 text-white font-mono text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  ${(preset / 1000)}k
                </button>
              ))}
            </div>

            {/* Instruction Warning */}
            {(!isValidAmount || initialCash === '0' || initialCash === '') && (
              <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl flex items-center gap-2.5 text-xs text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  El fondo inicial no puede ser cero. Escriba el monto en efectivo con el que recibe la caja para habilitar el inicio de turno.
                </span>
              </div>
            )}

            {/* Verification Checkbox */}
            {isValidAmount && (
              <div className="p-3.5 bg-[#06080E] border border-white/10 rounded-xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk-direct-confirm"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#0F172A] focus:ring-[#0F172A] cursor-pointer"
                />
                <label htmlFor="chk-direct-confirm" className="text-xs text-white cursor-pointer select-none">
                  <strong className="block text-xs font-bold">
                    Confirmo haber contado y recibido físicamente ${(parsedAmount || 0).toLocaleString('es-CL')} CLP en la caja.
                  </strong>
                  <span className="text-slate-400 text-[11px]">
                    Este monto servirá de base para el balance y arqueo ciego al final del turno.
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#111827] flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            <span>Monto inicial: </span>
            <strong className="text-pink-300 font-mono text-sm">
              ${(parsedAmount || 0).toLocaleString('es-CL')} CLP
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={!canAdvance}
              onClick={handleConfirm}
              id="btn-confirm-apertura-turno"
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition shadow-xs flex items-center justify-center gap-2 cursor-pointer border border-pink-400/30 ${
                canAdvance
                  ? 'bg-gradient-to-r from-[#0F172A] to-[#1E293B] hover:from-[#1E293B] hover:to-[#334155] text-white'
                  : 'bg-white/5 text-slate-600 cursor-not-allowed shadow-none border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Confirmar e Iniciar Turno</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
