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
    <div className="fixed inset-0 bg-[#2C1338]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white rounded-3xl border border-[#EDE4E2] shadow-[0_20px_50px_rgba(44,19,56,0.2)] w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#EDE4E2]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isDiscount ? 'bg-[#2B9E78]' : 'bg-[#E2498A]'
              }`}
            />
            <span className="text-[13px] font-bold uppercase tracking-[0.07em] tabular-nums text-[#2C1338] truncate">
              {isDiscount ? 'Autorización Descuento Comercial' : 'Recargo por Ticket Extraviado'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#FDF1EC] text-[#8C7C92] hover:text-[#2C1338] flex items-center justify-center transition-colors text-base font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Context box with chromatic border */}
          <div
            className={`pl-4 pr-3 py-3 rounded-2xl border text-[12px] leading-relaxed ${
              isDiscount
                ? 'border-l-4 border-l-[#2B9E78] border border-[#2B9E78]/30 bg-[#2B9E78]/10 text-[#2C1338]'
                : 'border-l-4 border-l-[#E2498A] border border-[#E2498A]/30 bg-[#E2498A]/10 text-[#2C1338]'
            }`}
          >
            {isDiscount
              ? 'Regla Antifraude (Verde): Exige PIN individual de Operador (ej. 1234) y justificación escrita mayor a 10 caracteres.'
              : 'Regla Antifraude (Rojo): Exige PIN de Administrador (ej. 9988). Aplica multa reglamentaria de $8.000 CLP por ticket extraviado previa acreditación de padrón.'}
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-[#E2498A]/10 border border-[#E2498A]/30 text-[#E2498A] text-xs font-medium">
              {error}
            </div>
          )}

          {/* Discount amount input (only for discount) */}
          {isDiscount && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#65546C] mb-1.5">
                Monto de Descuento (CLP) *
              </label>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder="Ej. 500"
                className="w-full h-10 px-3 rounded-xl border border-[#EDE4E2] bg-[#FEF9F5] tabular-nums font-bold text-[#2C1338] focus:border-[#2B9E78] focus:outline-none tabular-nums"
              />
            </div>
          )}

          {/* PIN Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#65546C] mb-1.5">
              {isDiscount ? 'PIN de Operador (4 dígitos) *' : 'PIN de Administrador (4 dígitos) *'}
            </label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              autoFocus
              className={`w-full h-13 px-3 rounded-2xl border-[1.5px] bg-[#FEF9F5] tabular-nums text-[#2C1338] focus:outline-none text-2xl tracking-[0.3em] text-center transition-colors ${
                isDiscount
                  ? 'border-[#2B9E78]/40 focus:border-[#2B9E78]'
                  : 'border-[#E2498A]/40 focus:border-[#E2498A]'
              }`}
            />
          </div>

          {/* Justification input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#65546C] mb-1.5">
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
              className="w-full h-10 px-3 rounded-xl border border-[#EDE4E2] bg-[#FEF9F5] tabular-nums text-[#2C1338] text-xs focus:border-[#2C1338] focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-full border border-[#EDE4E2] text-[#65546C] text-xs font-bold hover:bg-[#FDF1EC] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex-1 h-11 rounded-full text-white text-xs font-bold shadow-md transition-all hover:-translate-y-0.5 cursor-pointer ${
                isDiscount ? 'bg-[#2B9E78] hover:bg-[#238262]' : 'bg-[#E2498A] hover:bg-[#E57CD8]'
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
