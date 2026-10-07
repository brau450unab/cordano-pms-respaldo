import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, PaymentMethod } from '../types';
import { useParking } from '../context/ParkingContext';
import {
  Car,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Moon,
  CreditCard,
  Banknote,
  Send,
  X,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

interface ModalRevisionVehiculosCierreProps {
  isOpen: boolean;
  onClose: () => void;
  activeTickets: Ticket[];
  onComplete: (summary: { transferredCount: number; forcedExitCount: number }) => void;
}

export const ModalRevisionVehiculosCierre: React.FC<ModalRevisionVehiculosCierreProps> = ({
  isOpen,
  onClose,
  activeTickets,
  onComplete,
}) => {
  const { calculateFee, processPayment } = useParking();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [decisions, setDecisions] = useState<
    Record<string, { action: 'traspasar' | 'cobrar'; paymentMethod?: PaymentMethod; notes?: string }>
  >({});
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('efectivo');

  if (!isOpen || activeTickets.length === 0) return null;

  const currentTicket = activeTickets[currentIndex];
  const totalVehicles = activeTickets.length;
  const isLast = currentIndex === totalVehicles - 1;

  // Real-time fee calculation for current ticket
  const feeEstimate = currentTicket ? calculateFee(currentTicket, new Date()) : { totalAmount: 0, durationMinutes: 0 };
  const currentDecision = currentTicket ? decisions[currentTicket.id] : undefined;

  // Check if current hour is evening / night (after 20:00 or before 07:00)
  const currentHour = new Date().getHours();
  const isNightHour = currentHour >= 20 || currentHour < 7;

  const handleSelectAction = (action: 'traspasar' | 'cobrar') => {
    if (!currentTicket) return;

    if (action === 'cobrar') {
      // Process immediate checkout & payment
      try {
        processPayment({
          ticketId: currentTicket.id,
          paymentMethod: selectedPaymentMethod,
          paidAmount: feeEstimate.totalAmount,
        });
      } catch (e) {
        console.error('Error cobrando vehículo en cierre:', e);
      }
    }

    setDecisions((prev) => ({
      ...prev,
      [currentTicket.id]: {
        action,
        paymentMethod: action === 'cobrar' ? selectedPaymentMethod : undefined,
      },
    }));

    // Auto advance if not last
    if (!isLast) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleFinish = () => {
    // Count decisions
    let transferred = 0;
    let forcedExit = 0;

    activeTickets.forEach((t) => {
      const dec = decisions[t.id];
      if (dec?.action === 'cobrar') {
        forcedExit++;
      } else {
        transferred++; // Default to transferred if not explicitly charged
      }
    });

    onComplete({ transferredCount: transferred, forcedExitCount: forcedExit });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-['Manrope',sans-serif]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white w-full max-w-xl rounded-3xl border border-[#e2e2e4] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#e2e2e4] flex items-center justify-between bg-[#fbfbfc]">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-xs">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold tracking-wider text-[#0F172A] uppercase bg-[#F1F5F9]/50 px-2 py-0.5 rounded-full inline-block">
                  BLOQUE 3 • REVISIÓN 1 A 1 DE RECINTO
                </span>
                <span className="text-[11px] font-mono font-bold text-[#515154] bg-[#f3f3f5] px-2 py-0.5 rounded-full">
                  Vehículo {currentIndex + 1} de {totalVehicles}
                </span>
              </div>
              <h3 className="text-lg font-black text-[#1D1D1F] tracking-tight mt-0.5">
                Vehículos Aún Dentro del Recinto
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

        {/* Progress Bar */}
        <div className="w-full bg-[#f3f3f5] h-1.5">
          <div
            className="bg-[#0F172A] h-1.5 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalVehicles) * 100}%` }}
          />
        </div>

        {/* Vehicle Card Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Main Vehicle Info */}
          <div className="p-4 bg-[#f9f9fb] border border-[#e2e2e4] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#717785] uppercase tracking-wider block">
                  Patente Vehículo
                </span>
                <span className="text-2xl font-mono font-black text-[#1D1D1F] tracking-wider">
                  {currentTicket.plateNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#717785] uppercase tracking-wider block">
                  Slot Asignado
                </span>
                <span className="text-base font-black text-[#0F172A] bg-white px-3 py-1 rounded-xl border border-[#e2e2e4] inline-block font-mono">
                  {currentTicket.slotCode}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#e2e2e4]">
              <div>
                <span className="text-[10px] text-[#717785] block">Tipo de Vehículo:</span>
                <strong className="text-[#1D1D1F] text-xs">{currentTicket.vehicleType}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#717785] block">Hora de Ingreso:</span>
                <strong className="text-[#1D1D1F] text-xs">
                  {new Date(currentTicket.entryTime).toLocaleTimeString('es-CL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] text-[#717785] block">Tiempo Acumulado:</span>
                <strong className="text-[#1D1D1F] text-xs">{feeEstimate.durationMinutes} min</strong>
              </div>
            </div>
          </div>

          {/* Special Conditions: Night or Convenio */}
          {isNightHour ? (
            <div className="p-3 bg-slate-800/70 border border-slate-300/80 rounded-2xl flex items-start gap-2.5 text-slate-800">
              <Moon className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Horario Nocturno Activo</span>
                <span>
                  Si se cobra la salida ahora, aplica tarifa nocturna especial. Si se traspasa, la estadía nocturna queda registrada para el siguiente turno.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900">
              <AlertCircle className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Acción Obligatoria por Vehículo</span>
                <span>
                  Determine si traspasa la custodia de este vehículo al siguiente operador o procesa su cobro de salida de inmediato.
                </span>
              </div>
            </div>
          )}

          {/* Current Fee Highlight */}
          <div className="p-4 bg-white border-2 border-dashed border-[#c1c6d6] rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#717785] font-bold block">
                Monto Calculado a este Minuto:
              </span>
              <span className="text-xl font-mono font-black text-[#1D1D1F]">
                ${feeEstimate.totalAmount.toLocaleString('es-CL')} CLP
              </span>
            </div>
            {currentDecision && (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-slate-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {currentDecision.action === 'traspasar' ? 'Traspasado a Siguiente Turno' : 'Cobrado y Egresado'}
                </span>
              </span>
            )}
          </div>

          {/* Choice Section */}
          <div className="space-y-3">
            <span className="font-bold text-[#1D1D1F] block text-xs">
              Seleccione la acción a tomar con este vehículo:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Traspasar */}
              <button
                type="button"
                onClick={() => handleSelectAction('traspasar')}
                className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  currentDecision?.action === 'traspasar'
                    ? 'border-[#0F172A] bg-[#F1F5F9]/20'
                    : 'border-[#e2e2e4] hover:border-[#0F172A]/50 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[#1D1D1F]">
                      1. Traspasar al Siguiente Turno
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#0F172A]" />
                  </div>
                  <p className="text-[11px] text-[#515154] leading-relaxed">
                    El vehículo permanece estacionado en su slot. El reloj sigue corriendo y el nuevo turno asume el cobro al salir.
                  </p>
                </div>
                <div className="mt-3">
                  <span className="inline-block text-[10px] font-bold text-[#0F172A] bg-white px-2 py-0.5 rounded-lg border border-[#e2e2e4]">
                    Recomendado si cliente no ha llegado
                  </span>
                </div>
              </button>

              {/* Option B: Forzar Salida / Cobrar Ahora */}
              <div
                className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                  currentDecision?.action === 'cobrar'
                    ? 'border-slate-400 bg-slate-900/50'
                    : 'border-[#e2e2e4] bg-white'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[#1D1D1F]">
                      2. Forzar Salida y Cobrar
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-800" />
                  </div>
                  <p className="text-[11px] text-[#515154] leading-relaxed">
                    Si el conductor está presente saliendo en este instante, procese el pago y libere el slot.
                  </p>

                  {/* Payment Method Selector */}
                  <div className="pt-1">
                    <label className="text-[10px] font-bold text-[#717785] block mb-1">
                      Medio de Pago:
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod('efectivo')}
                        className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                          selectedPaymentMethod === 'efectivo'
                            ? 'bg-slate-900 text-white border-slate-400'
                            : 'bg-[#f3f3f5] text-[#515154] border-[#e2e2e4]'
                        }`}
                      >
                        <Banknote className="w-3 h-3" />
                        <span>Efectivo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod('tarjeta_debito')}
                        className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                          selectedPaymentMethod === 'tarjeta_debito'
                            ? 'bg-slate-900 text-white border-blue-600'
                            : 'bg-[#f3f3f5] text-[#515154] border-[#e2e2e4]'
                        }`}
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Tarjeta</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod('transferencia')}
                        className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                          selectedPaymentMethod === 'transferencia'
                            ? 'bg-slate-800 text-white border-slate-300'
                            : 'bg-[#f3f3f5] text-[#515154] border-[#e2e2e4]'
                        }`}
                      >
                        <Send className="w-3 h-3" />
                        <span>Transf.</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => handleSelectAction('cobrar')}
                    className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Cobrar ${feeEstimate.totalAmount.toLocaleString('es-CL')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-5 border-t border-[#e2e2e4] bg-[#fbfbfc] flex items-center justify-between">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className={`px-3.5 py-2 rounded-xl border border-[#e2e2e4] font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed bg-[#f3f3f5] text-[#717785]'
                : 'text-[#1D1D1F] hover:bg-[#f3f3f5]'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-2">
            {!isLast ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(totalVehicles - 1, prev + 1))}
                className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Siguiente Vehículo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                id="btn-finish-vehicle-handover"
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-900 text-white font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/25"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalizar Revisión ({totalVehicles} Vehículos)</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
