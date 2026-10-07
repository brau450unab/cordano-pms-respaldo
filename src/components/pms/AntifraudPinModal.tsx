import React, { useState } from 'react';

export type PinModalType = 'DISCOUNT' | 'LOST_TICKET' | null;

interface AntifraudPinModalProps {
  type: PinModalType;
  baseAmount: number;
  onClose: () => void;
  onConfirm: (payload: { type: 'DISCOUNT' | 'LOST_TICKET'; pin: string; reason: string; discountAmount?: number }) => void;
}

export const AntifraudPinModal: React.FC<AntifraudPinModalProps> = ({
  type,
  baseAmount,
  onClose,
  onConfirm,
}) => {
  if (!type) return null;

  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('');
  const [discountAmount, setDiscountAmount] = useState('500');
  const [error, setError] = useState<string | null>(null);

  const isDiscount = type === 'DISCOUNT';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin.trim().length < 4) {
      setError('El PIN debe contener 4 dígitos.');
      return;
    }

    if (reason.trim().length <= 10) {
      setError('La justificación debe tener más de 10 caracteres obligatorios (Regla Antifraude).');
      return;
    }

    const disc = parseInt(discountAmount) || 0;
    if (isDiscount && (disc <= 0 || disc > baseAmount)) {
      setError(`El descuento debe ser mayor a 0 y no exceder el total ($${baseAmount.toLocaleString('es-CL')}).`);
      return;
    }

    onConfirm({
      type,
      pin: pin.trim(),
      reason: reason.trim(),
      discountAmount: isDiscount ? disc : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white rounded-2xl border border-[#e8ecf0] shadow-floating w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isDiscount ? 'bg-emerald-500' : 'bg-rose-600'
              }`}
            />
            <span className="text-[13px] font-bold uppercase tracking-[0.07em] font-mono text-slate-700 truncate">
              {isDiscount ? 'Autorización Descuento Comercial' : 'Recargo por Ticket Extraviado'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors text-base font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Context box with chromatic border */}
          <div
            className={`pl-4 pr-3 py-3 rounded-xl border text-[12px] leading-relaxed ${
              isDiscount
                ? 'border-l-4 border-l-emerald-500 border border-emerald-100 bg-emerald-50 text-emerald-900'
                : 'border-l-4 border-l-rose-600 border border-rose-100 bg-rose-50 text-rose-900'
            }`}
          >
            {isDiscount
              ? 'Regla Antifraude (Verde): Exige PIN individual de Operador (ej. 1234) y justificación escrita mayor a 10 caracteres.'
              : 'Regla Antifraude (Rojo): Exige PIN de Administrador (ej. 9988). Aplica multa reglamentaria de $8.000 CLP por ticket extraviado previa acreditación de padrón.'}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Discount amount input (only for discount) */}
          {isDiscount && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">
                Monto de Descuento (CLP) *
              </label>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder="Ej. 500"
                className="w-full h-10 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] font-mono font-bold text-slate-900 focus:border-slate-900 focus:outline-none tabular-nums"
              />
            </div>
          )}

          {/* PIN Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">
              {isDiscount ? 'PIN de Operador (4 dígitos) *' : 'PIN de Administrador (4 dígitos) *'}
            </label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              autoFocus
              className={`w-full h-13 px-3 rounded-[10px] border-[1.5px] bg-[#f8fafc] font-mono text-slate-900 focus:outline-none text-2xl tracking-[0.3em] text-center transition-colors ${
                isDiscount
                  ? 'border-emerald-300 focus:border-emerald-600'
                  : 'border-rose-300 focus:border-rose-600'
              }`}
            />
          </div>

          {/* Justification input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">
              Justificación Obligatoria (&gt;10 caracteres) *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isDiscount
                  ? 'Ej. Convenio comercial autorizado por gerencia...'
                  : 'Ej. Ticket extraviado, acreditado con padrón y RUT...'
              }
              className="w-full h-10 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] font-mono text-slate-900 text-xs focus:border-slate-900 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-[#dde2e8] text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex-1 h-11 rounded-xl text-white text-xs font-bold shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer ${
                isDiscount ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {isDiscount ? 'Aplicar Descuento' : 'Aplicar Multa $8.000'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
