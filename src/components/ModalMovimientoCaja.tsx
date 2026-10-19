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
  { id: 'sup-1', name: 'Braulio Cordano (Administrador)', pin: 'admin123' },
];

export const ModalMovimientoCaja: React.FC<ModalMovimientoCajaProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentCashInDrawer,
  activeOperatorName = 'Braulio Cordano',
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

    // Validate TOTP / PIN: Accepts default PIN 1234, 2026 or supervisor PINs
    const cleanPin = totpCode.trim();
    const isValidPin =
      cleanPin === '1234' ||
      cleanPin === '2026' ||
      cleanPin === 'admin123' ||
      cleanPin === simulatedTotp;

    if (!isValidPin) {
      setErrorMessage('PIN de autorización incorrecto. El PIN de supervisor por defecto es 1234.');
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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-['Manrope',sans-serif]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="bg-white w-full max-w-2xl rounded-3xl border border-[#e2e2e4] shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#e2e2e4] flex items-center justify-between bg-[#fbfbfc]">
          <div className="flex items-center space-x-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0 ${
                type === 'RETIRO_SANGRIA' || type === 'GASTO_MENOR'
                  ? 'bg-rose-600'
                  : 'bg-emerald-600'
              }`}
            >
              {type === 'RETIRO_SANGRIA' || type === 'GASTO_MENOR' ? (
                <ArrowUpRight className="w-6 h-6" />
              ) : (
                <ArrowDownLeft className="w-6 h-6" />
              )}
            </div>
            <div>
              <span
                className={`text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full inline-block ${
                  type === 'RETIRO_SANGRIA' || type === 'GASTO_MENOR'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                MOVIMIENTO MANUAL DE CAJA
              </span>
              <h3 className="text-base font-extrabold text-[#1D1D1F]">
                {type === 'RETIRO_SANGRIA' || type === 'GASTO_MENOR'
                  ? 'Egreso Manual de Efectivo'
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Movement Type Selector: Simplificado a solo Ingreso o Egreso */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#f3f3f5] rounded-2xl border border-[#e2e2e4]">
            <button
              type="button"
              onClick={() => setType('INGRESO_MANUAL')}
              className={`py-3 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
                type === 'INGRESO_MANUAL'
                  ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200'
                  : 'text-[#717785] hover:text-[#1D1D1F]'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Ingreso</span>
            </button>

            <button
              type="button"
              onClick={() => setType('RETIRO_SANGRIA')}
              className={`py-3 px-4 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
                type === 'RETIRO_SANGRIA' || type === 'GASTO_MENOR'
                  ? 'bg-white text-rose-700 shadow-sm border border-rose-200'
                  : 'text-[#717785] hover:text-[#1D1D1F]'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Egreso</span>
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
                <span className="tabular-nums text-[11px] text-[#515154] flex items-center justify-end gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-[#717785]" />
                  {currentTimestamp}
                </span>
              </div>
            </div>

            {/* Monto en Moneda Chilena */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#1D1D1F]">
                  Monto del Movimiento (Moneda Nacional CLP)
                </label>
                <span className="text-[11px] tabular-nums text-[#717785] font-mono">
                  Efectivo en gaveta: ${currentCashInDrawer.toLocaleString('es-CL')} CLP
                </span>
              </div>

              {/* Botones de montos rápidos en billetes chilenos */}
              <div className="grid grid-cols-5 gap-1.5 font-mono">
                {[
                  { label: '+$2.000', add: 2000 },
                  { label: '+$5.000', add: 5000 },
                  { label: '+$10.000', add: 10000 },
                  { label: '+$20.000', add: 20000 },
                  { label: '+$50.000', add: 50000 },
                ].map((chip, cIdx) => (
                  <button
                    key={cIdx}
                    type="button"
                    onClick={() => {
                      const cur = parseInt(amount, 10) || 0;
                      setAmount((cur + chip.add).toString());
                    }}
                    className="py-1.5 px-1 bg-white border border-slate-200 hover:border-[#E2498A] hover:bg-pink-50/30 rounded-xl text-[11px] font-bold text-slate-700 transition cursor-pointer text-center"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 tabular-nums font-bold text-base text-[#717785]">$</span>
                <input
                  type="text"
                  value={amount ? parseInt(amount, 10).toLocaleString('es-CL') : ''}
                  onChange={(e) => {
                    const rawDigits = e.target.value.replace(/\D/g, '');
                    setAmount(rawDigits ? parseInt(rawDigits, 10).toString() : '');
                  }}
                  placeholder="Ej: 50.000"
                  required
                  className="w-full pl-8 pr-20 py-2.5 rounded-xl border border-[#c1c6d6] tabular-nums font-mono font-bold text-base text-[#1D1D1F] outline-none focus:border-[#E2498A] bg-white transition shadow-inner"
                />
                {amount && (
                  <button
                    type="button"
                    onClick={() => setAmount('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded cursor-pointer"
                  >
                    Borrar
                  </button>
                )}
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

          {/* Autorización: En paralelo (Columna izquierda: Autorizador, Columna derecha: Código temporal / PIN) */}
          <div className="p-4 bg-[#fbfbfc] border border-[#e2e2e4] rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Columna Izquierda: Quién Autoriza */}
              <div className="space-y-1.5 flex flex-col justify-between">
                <div>
                  <label className="font-bold text-[#1D1D1F] flex items-center justify-between">
                    <span>Quién Autoriza el Movimiento:</span>
                    <span className="text-[10px] text-[#0F172A] font-bold">SUPERVISOR</span>
                  </label>
                  <p className="text-[11px] text-[#717785] mt-0.5">Seleccione la jefatura a cargo de validar el arqueo.</p>
                </div>
                <select
                  value={selectedSupervisor}
                  onChange={(e) => setSelectedSupervisor(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#c1c6d6] text-xs font-semibold text-[#1D1D1F] outline-none focus:border-[#0F172A] bg-white cursor-pointer shadow-xs"
                >
                  {SUPERVISORS.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Columna Derecha: Código Temporal / TOTP / PIN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#1D1D1F] flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#0F172A]" />
                    <span>PIN de Supervisor:</span>
                  </label>
                  <span className="text-[10px] tabular-nums text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md font-bold font-mono">
                    PIN por defecto: 1234
                  </span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="1234"
                  required
                  className="w-full px-3 py-2.5 text-center tracking-widest rounded-xl border border-[#c1c6d6] tabular-nums font-mono font-black text-sm text-[#1D1D1F] outline-none focus:border-[#E2498A] bg-white transition shadow-xs"
                />
                <div className="flex items-center justify-between text-[10px] text-[#717785]">
                  <span>PIN de Jefatura (1234 o 2026)</span>
                  <button
                    type="button"
                    onClick={() => setTotpCode('1234')}
                    className="text-[#E2498A] font-bold hover:underline cursor-pointer"
                  >
                    Usar PIN 1234
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 bg-[#FFF5F8] border border-rose-200 rounded-xl text-rose-700 font-bold flex items-center space-x-2">
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
                  ? 'bg-[#C83472] hover:bg-rose-700'
                  : 'bg-[#1E1E2F] hover:bg-[#1E1E2F]'
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
