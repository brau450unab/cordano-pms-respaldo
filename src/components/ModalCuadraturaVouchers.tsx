import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Send,
  CheckCircle2,
  X,
  Receipt,
  FileCheck2,
  Hash,
  Clock,
  Car
} from 'lucide-react';
import { Ticket } from '../types';

interface ModalCuadraturaVouchersProps {
  isOpen: boolean;
  onClose: () => void;
  electronicTickets: Ticket[];
  onApplyTotals: (posSum: number, transferSum: number) => void;
}

export const ModalCuadraturaVouchers: React.FC<ModalCuadraturaVouchersProps> = ({
  isOpen,
  onClose,
  electronicTickets,
  onApplyTotals,
}) => {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const posTickets = electronicTickets.filter(
    (t) => t.paymentMethod === 'tarjeta_debito' || t.paymentMethod === 'tarjeta_credito'
  );
  const transferTickets = electronicTickets.filter(
    (t) => t.paymentMethod === 'transferencia'
  );

  const totalPosAmount = posTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const totalTransferAmount = transferTickets.reduce(
    (sum, t) => sum + (t.totalAmount || 0),
    0
  );

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleApply = () => {
    onApplyTotals(totalPosAmount, totalTransferAmount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-['Manrope',sans-serif]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white w-full max-w-3xl rounded-3xl border border-[#e2e2e4] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#e2e2e4] flex items-center justify-between bg-[#fbfbfc]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-slate-800 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base text-[#1D1D1F]">
                Cuadratura de Vouchers POS & Transferencias
              </h2>
              <p className="text-xs text-[#717785]">
                Confrontación de comprobantes físicos y electrónicos del turno
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-9 h-9 rounded-full bg-[#f3f3f5] text-[#717785] hover:text-[#1D1D1F] flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-slate-800" />
                <div>
                  <span className="text-xs font-bold text-blue-900 block">
                    Vouchers POS (Débito/Crédito)
                  </span>
                  <span className="text-[11px] text-slate-800">
                    {posTickets.length} transacciones registradas
                  </span>
                </div>
              </div>
              <span className="font-mono font-black text-base text-blue-900">
                ${totalPosAmount.toLocaleString('es-CL')} CLP
              </span>
            </div>

            <div className="p-4 bg-slate-800/70 border border-slate-300 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Send className="w-5 h-5 text-slate-800" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Transferencias Electrónicas
                  </span>
                  <span className="text-[11px] text-slate-800">
                    {transferTickets.length} transferencias validadas
                  </span>
                </div>
              </div>
              <span className="font-mono font-black text-base text-slate-800">
                ${totalTransferAmount.toLocaleString('es-CL')} CLP
              </span>
            </div>
          </div>

          {/* Vouchers Table */}
          <div className="border border-[#e2e2e4] rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-[#f9f9fb] px-4 py-3 border-b border-[#e2e2e4] flex items-center justify-between">
              <span className="font-extrabold text-xs text-[#1D1D1F] uppercase tracking-wider">
                Detalle Transacción por Transacción
              </span>
              <span className="text-xs text-[#717785]">
                {electronicTickets.length} comprobantes en total
              </span>
            </div>

            {electronicTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#717785] space-y-1">
                <Receipt className="w-8 h-8 text-[#c1c6d6] mx-auto" />
                <p className="font-bold text-[#1D1D1F]">Sin vouchers en este turno</p>
                <p>No se registraron pagos con tarjeta POS ni transferencias bancarias durante el turno actual.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f3f3f5] text-[#515154] font-bold border-b border-[#e2e2e4] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center">✓</th>
                      <th className="py-2.5 px-3">N° Voucher / Comprobante</th>
                      <th className="py-2.5 px-3 text-right">Monto ($ CLP)</th>
                      <th className="py-2.5 px-3">Fecha y Hora</th>
                      <th className="py-2.5 px-3">Canal</th>
                      <th className="py-2.5 px-3">Patente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f3f5]">
                    {electronicTickets.map((t) => {
                      const isChecked = !!checkedIds[t.id];
                      const voucherNum = t.voucherNumber || t.ticketCode;
                      const timeStr = t.exitTime
                        ? new Date(t.exitTime).toLocaleString('es-CL', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : new Date(t.entryTime).toLocaleString('es-CL', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                      return (
                        <tr
                          key={t.id}
                          onClick={() => toggleCheck(t.id)}
                          className={`hover:bg-[#fbfbfc] cursor-pointer transition ${
                            isChecked ? 'bg-slate-900/40' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCheck(t.id)}
                              className="rounded accent-emerald-600 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#1D1D1F]">
                            {voucherNum}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-right text-[#0F172A]">
                            ${(t.totalAmount || 0).toLocaleString('es-CL')}
                          </td>
                          <td className="py-2.5 px-3 text-[#515154] font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#717785]" />
                              {timeStr}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                t.paymentMethod === 'transferencia'
                                  ? 'bg-slate-800 text-slate-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {t.paymentMethod === 'transferencia'
                                ? 'Transferencia'
                                : t.paymentMethod === 'tarjeta_debito'
                                ? 'POS Débito'
                                : 'POS Crédito'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[#515154]">
                            <span className="flex items-center gap-1">
                              <Car className="w-3 h-3 text-[#717785]" />
                              {t.plateNumber}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#e2e2e4] bg-[#fbfbfc] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#717785] hover:text-[#1D1D1F] transition cursor-pointer"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-extrabold rounded-2xl shadow-xs transition flex items-center space-x-2 cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Aplicar Sumas de Vouchers al Formulario</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
