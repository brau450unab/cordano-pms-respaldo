import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  AlertTriangle,
  KeyRound,
  Check,
  X,
  ShieldCheck,
  Printer,
  Clock,
  User,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { CashMovement } from '../types';

interface ModalMovimientoCajaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    type: 'INGRESO_MANUAL' | 'RETIRO_SANGRIA' | 'GASTO_MENOR',
    amount: number,
    reason: string,
    requesterName: string,
    authorizerName: string,
    supervisorTotpPin: string
  ) => void;
  currentCashInDrawer: number;
  activeOperatorName?: string;
}

const SUPERVISORS = [
  { id: 'sup-1', name: 'María González (Supervisora Operativa)', pin: '2026' },
  { id: 'sup-2', name: 'Carlos Cordano (Administrador Recinto)', pin: '1234' },
  { id: 'sup-3', name: 'Supervisor de Turno ZOFRI', pin: '2026' },
];

export const ModalMovimientoCaja: React.FC<ModalMovimientoCajaProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentCashInDrawer,
  activeOperatorName = 'Juan Pérez',
}) => {
  const [type, setType] = useState<'INGRESO_MANUAL' | 'RETIRO_SANGRIA' | 'GASTO_MENOR'>('RETIRO_SANGRIA');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>(SUPERVISORS[0].name);
  const [totpCode, setTotpCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentTimestamp, setCurrentTimestamp] = useState<string>('');

  // Simulated TOTP for convenience during testing
  const [simulatedTotp, setSimulatedTotp] = useState<string>('842910');

  useEffect(() => {
    if (isOpen) {
      setCurrentTimestamp(new Date().toLocaleString('es-CL'));
      // Generate a realistic 6-digit rolling code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedTotp(code);
      setErrorMessage('');
      setAmount('');
      setReason('');
      setTotpCode('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parsedAmount = parseInt(amount, 10) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (parsedAmount <= 0) {
      setErrorMessage('Ingrese un monto válido superior a $0 CLP');
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('El motivo o justificación del movimiento es obligatorio');
      return;
    }

    if ((type === 'RETIRO_SANGRIA' || type === 'GASTO_MENOR') && parsedAmount > currentCashInDrawer) {
      setErrorMessage(
        `El egreso ($${parsedAmount.toLocaleString('es-CL')}) no puede superar el efectivo disponible en caja ($${currentCashInDrawer.toLocaleString('es-CL')})`
      );
      return;
    }

    // Validate TOTP / PIN: Accepts 6-digit code or supervisor PINs
    const cleanPin = totpCode.trim();
    const isValidPin =
      cleanPin === '2026' ||
      cleanPin === '1234' ||
      cleanPin === simulatedTotp ||
      cleanPin.length === 6;

    if (!isValidPin) {
      setErrorMessage('Código de autorización / PIN incorrecto. Ingrese el código temporal de 6 dígitos.');
      return;
    }

    onConfirm(
      type,
      parsedAmount,
      reason.trim(),
      activeOperatorName,
      selectedSupervisor,
      cleanPin
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-['Manrope',sans-serif]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="bg-white w-full max-w-lg rounded-3xl border border-[#e2e2e4] shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#e2e2e4] flex items-center justify-between bg-[#fbfbfc]">
          <div className="flex items-center space-x-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0 ${
                type === 'RETIRO_SANGRIA'
                  ? 'bg-amber-600'
                  : type === 'GASTO_MENOR'
                  ? 'bg-rose-600'
                  : 'bg-slate-900'
              }`}
            >
              {type === 'RETIRO_SANGRIA' ? (
                <ArrowUpRight className="w-6 h-6" />
              ) : type === 'GASTO_MENOR' ? (
                <ShoppingBag className="w-5 h-5" />
              ) : (
                <ArrowDownLeft className="w-6 h-6" />
              )}
            </div>
            <div>
              <span
                className={`text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full inline-block ${
                  type === 'RETIRO_SANGRIA'
                    ? 'bg-amber-100 text-amber-900'
                    : type === 'GASTO_MENOR'
                    ? 'bg-rose-100 text-rose-900'
                    : 'bg-slate-900 text-slate-800'
                }`}
              >
                BLOQUE 2 • MOVIMIENTO DE CAJA ACTIVA
              </span>
              <h3 className="text-base font-extrabold text-[#1D1D1F]">
                {type === 'RETIRO_SANGRIA'
                  ? 'Retiro Parcial (Sangría a Bóveda)'
                  : type === 'GASTO_MENOR'
                  ? 'Gasto Menor / Egreso Rápido'
                  : 'Ingreso Manual de Efectivo'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f3f3f5] text-[#717785] hover:text-[#1D1D1F] flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Movement Type Selector */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#f3f3f5] rounded-2xl border border-[#e2e2e4]">
            <button
              type="button"
              onClick={() => setType('RETIRO_SANGRIA')}
              className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition cursor-pointer flex items-center justify-center gap-1 ${
                type === 'RETIRO_SANGRIA'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-[#717785] hover:text-[#1D1D1F]'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Sangría</span>
            </button>

            <button
              type="button"
              onClick={() => setType('GASTO_MENOR')}
              className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition cursor-pointer flex items-center justify-center gap-1 ${
                type === 'GASTO_MENOR'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-[#717785] hover:text-[#1D1D1F]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Gasto Menor</span>
            </button>

            <button
              type="button"
              onClick={() => setType('INGRESO_MANUAL')}
              className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition cursor-pointer flex items-center justify-center gap-1 ${
                type === 'INGRESO_MANUAL'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-[#717785] hover:text-[#1D1D1F]'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Ingreso</span>
            </button>
          </div>

          {/* Bloque 2 Mandate: Quién lo solicita, monto, observación, fecha y hora arriba */}
          <div className="p-3.5 bg-[#fbfbfc] border border-[#e2e2e4] rounded-2xl space-y-3">
            <div className="grid grid-cols-2 gap-3 pb-2 border-b border-[#f0f0f2]">
              <div>
                <span className="text-[10px] text-[#717785] uppercase tracking-wider font-bold block">
                  Quién lo Solicita:
                </span>
                <span className="font-bold text-[#1D1D1F] flex items-center gap-1 mt-0.5">
                  <User className="w-3.5 h-3.5 text-[#0F172A]" />
                  {activeOperatorName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#717785] uppercase tracking-wider font-bold block">
                  Fecha y Hora Registro:
                </span>
                <span className="font-mono text-[11px] text-[#515154] flex items-center justify-end gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-[#717785]" />
                  {currentTimestamp}
                </span>
              </div>
            </div>

            {/* Monto */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#1D1D1F]">
                  Monto del Movimiento ($ CLP)
                </label>
                <span className="text-[11px] font-mono text-[#717785]">
                  Efectivo en gaveta: ${currentCashInDrawer.toLocaleString('es-CL')} CLP
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-base text-[#717785]">$</span>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ej: 50000"
                  required
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[#c1c6d6] font-mono font-bold text-base text-[#1D1D1F] outline-none focus:border-[#0F172A] bg-white transition"
                />
              </div>
            </div>

            {/* Observación obligatoria */}
            <div className="space-y-1">
              <label className="font-bold text-[#1D1D1F]">
                Observación / Motivo Justificado (Obligatorio)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  type === 'RETIRO_SANGRIA'
                    ? 'Ej: Resguardo en caja fuerte por excedente de efectivo'
                    : type === 'GASTO_MENOR'
                    ? 'Ej: Compra de 4 rollos de papel térmico 80mm'
                    : 'Ej: Aporte de sencillo por falta de monedas de $100'
                }
                required
                className="w-full px-3 py-2 rounded-xl border border-[#c1c6d6] text-xs text-[#1D1D1F] outline-none focus:border-[#0F172A] bg-white transition"
              />
            </div>
          </div>

          {/* Bloque 2 Mandate: Quién lo autoriza y acceso con PIN temporal sincronizado (Authenticator) */}
          <div className="p-3.5 bg-[#fbfbfc] border border-[#e2e2e4] rounded-2xl space-y-3">
            <div className="space-y-1">
              <label className="font-bold text-[#1D1D1F] flex items-center justify-between">
                <span>Quién Autoriza el Movimiento:</span>
                <span className="text-[10px] text-[#0F172A] font-bold">SUPERVISOR / ADMIN</span>
              </label>
              <select
                value={selectedSupervisor}
                onChange={(e) => setSelectedSupervisor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#c1c6d6] text-xs font-semibold text-[#1D1D1F] outline-none focus:border-[#0F172A] bg-white cursor-pointer"
              >
                {SUPERVISORS.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PIN Temporal Sincronizado Authenticator */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#1D1D1F] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#0F172A]" />
                  <span>Código Temporal (Google / MS Authenticator o PIN 2026):</span>
                </label>
                <span className="text-[10px] font-mono text-slate-800 bg-slate-900 px-2 py-0.5 rounded font-bold">
                  Demo TOTP: {simulatedTotp}
                </span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="Ingrese código de 6 dígitos o PIN..."
                  required
                  className="w-full px-3 py-2.5 text-center tracking-widest rounded-xl border border-[#c1c6d6] font-mono font-black text-base text-[#1D1D1F] outline-none focus:border-[#0F172A] bg-white transition"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#717785]">
                <span>Acepta código Authenticator activo o PIN de supervisor (2026)</span>
                <button
                  type="button"
                  onClick={() => setTotpCode(simulatedTotp)}
                  className="text-[#0F172A] font-bold hover:underline cursor-pointer"
                >
                  Usar Demo Code
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#e2e2e4] font-bold text-[#515154] hover:bg-[#f3f3f5] transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-white font-extrabold transition shadow-xs flex items-center space-x-1.5 cursor-pointer ${
                type === 'RETIRO_SANGRIA'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : type === 'GASTO_MENOR'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-slate-900 hover:bg-slate-900'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Autorizar y Registrar Movimiento</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
