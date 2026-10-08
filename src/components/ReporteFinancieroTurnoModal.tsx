import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shift, ChileanCashBreakdown } from '../types';
import { useParking } from '../context/ParkingContext';
import {
  FileText,
  Printer,
  Share2,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Car,
  Coins,
  ShieldCheck,
  Check,
  X,
  Send,
  Eye,
  FileSignature,
  Building2,
  Calendar,
  Clock,
  User,
  Hash,
  Download,
  Sparkles
} from 'lucide-react';
import { printViaSystemDialog, generateShiftClosingPdf } from '../utils/pdfGenerator';

interface ReporteFinancieroTurnoModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift;
  onOpenNewShift?: () => void;
}

type ReportTab = 'resumen' | 'conteo' | 'movimientos' | 'vehiculos' | 'firmas';

export const ReporteFinancieroTurnoModal: React.FC<ReporteFinancieroTurnoModalProps> = ({
  isOpen,
  onClose,
  shift,
  onOpenNewShift,
}) => {
  const { signShiftCopy, cashToleranceClp } = useParking();

  const [activeTab, setActiveTab] = useState<ReportTab>('resumen');
  const [selectedSignatureCopy, setSelectedSignatureCopy] = useState<'copia1_caja' | 'copia2_operador'>('copia1_caja');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const totalDeclared =
    (shift.declaredCash || 0) + (shift.declaredCard || 0) + (shift.declaredTransfer || 0);
  const totalExpected =
    (shift.expectedCash || 0) + (shift.expectedCard || 0) + (shift.expectedTransfer || 0);
  const discrepancyTotal = shift.discrepancyTotal ?? (totalDeclared - totalExpected);
  const discrepancyCash = shift.discrepancyCash ?? ((shift.declaredCash || 0) - (shift.expectedCash || 0));

  const isFlagged = shift.isDiscrepancyFlagged || Math.abs(discrepancyCash) > cashToleranceClp;
  const isPerfect = discrepancyTotal === 0;

  // Handle WhatsApp share link
  const handleWhatsAppSend = () => {
    const adminPhone = '56987654321'; // Default admin contact
    const text = encodeURIComponent(
      `*CORDANO PMS — REPORTE DE CIERRE DE TURNO*\n` +
      `📅 Fecha: ${new Date(shift.endTime || shift.startTime).toLocaleDateString('es-CL')}\n` +
      `🆔 Turno: ${shift.id}\n` +
      `👤 Operador: ${shift.operatorName}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 Fondo Inicial: $${(shift.initialCash || 0).toLocaleString('es-CL')} CLP\n` +
      `💵 Efectivo Declarado: $${(shift.declaredCash || 0).toLocaleString('es-CL')} CLP\n` +
      `💳 POS Tarjetas: $${(shift.declaredCard || 0).toLocaleString('es-CL')} CLP\n` +
      `📲 Transferencias: $${(shift.declaredTransfer || 0).toLocaleString('es-CL')} CLP\n` +
      `✨ TOTAL DECLARADO: $${totalDeclared.toLocaleString('es-CL')} CLP\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 Total Sistema Esperado: $${totalExpected.toLocaleString('es-CL')} CLP\n` +
      `⚖️ Diferencia Total: ${discrepancyTotal >= 0 ? '+' : ''}$${discrepancyTotal.toLocaleString('es-CL')} CLP\n` +
      `🏷️ ESTADO: ${isFlagged ? '⚠️ [DESCUADRADO > $2.000 CLP]' : isPerfect ? '✅ [CUADRADO PERFECTO]' : '🟡 [DENTRO DE TOLERANCIA]'}\n` +
      `${shift.closeJustification ? `📝 Justificación: ${shift.closeJustification}\n` : ''}` +
      `${shift.hashAuditoria ? `🔒 Hash Auditoría: ${shift.hashAuditoria}\n` : ''}` +
      `🚗 Vehículos Traspasados: ${shift.transferredVehiclesCount || 0}`
    );

    window.open(`https://wa.me/${adminPhone}?text=${text}`, '_blank');
  };

  // Handle Email send
  const handleEmailSend = () => {
    const subject = encodeURIComponent(`Reporte Cierre Turno ${shift.id} - ${shift.operatorName} - CORDANO PMS`);
    const body = encodeURIComponent(
      `Estimada Administración:\n\n` +
      `Adjunto el resumen del cierre de caja del turno ${shift.id}:\n\n` +
      `- Operador: ${shift.operatorName}\n` +
      `- Fondo Inicial: $${(shift.initialCash || 0).toLocaleString('es-CL')} CLP\n` +
      `- Total Declarado: $${totalDeclared.toLocaleString('es-CL')} CLP\n` +
      `- Total Esperado: $${totalExpected.toLocaleString('es-CL')} CLP\n` +
      `- Diferencia Neta: $${discrepancyTotal.toLocaleString('es-CL')} CLP\n` +
      `- Estado: ${isFlagged ? 'DESCUADRADO' : 'CUADRADO'}\n\n` +
      `Atentamente,\nControl de Operaciones CORDANO PMS`
    );
    window.location.href = `mailto:administracion@cordano.cl?subject=${subject}&body=${body}`;
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleSystemPrint = () => {
    printViaSystemDialog('printable-shift-report', `Reporte_Z_Turno_${shift.id}`);
  };

  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    try {
      generateShiftClosingPdf(shift, true);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setTimeout(() => setDownloadingPdf(false), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 font-['Manrope',sans-serif]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white w-full max-w-4xl rounded-3xl border border-[#e2e2e4] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e2e2e4] flex items-center justify-between bg-[#fbfbfc] shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-xs shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold tracking-wider text-[#0F172A] uppercase bg-[#F1F5F9]/60 px-2.5 py-0.5 rounded-full inline-block">
                  BLOQUE 4 • REPORTE FINANCIERO Z
                </span>
                <span
                  className={`text-[10px] tabular-nums font-extrabold px-2.5 py-0.5 rounded-full ${
                    isFlagged
                      ? 'bg-rose-100 text-rose-800'
                      : isPerfect
                      ? 'bg-slate-900 text-slate-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isFlagged ? '⚠️ REPORTE 1: [DESCUADRADO]' : isPerfect ? '✓ CUADRADO' : 'TOLERANCIA OK'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#1D1D1F] tracking-tight mt-0.5">
                Reporte de Cierre de Turno & Arqueo
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSystemPrint}
              className="px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Imprimir con Diálogo del Sistema"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-3 py-1.5 rounded-xl bg-[#1a1c1d] hover:bg-[#2d3034] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Descargar en formato PDF"
            >
              {downloadingPdf ? (
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-800" />
              )}
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#f3f3f5] text-[#717785] hover:text-[#1D1D1F] flex items-center justify-center cursor-pointer transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Sub-páginas / Pestañas de Reporte) */}
        <div className="flex border-b border-[#e2e2e4] bg-[#f9f9fb] px-4 overflow-x-auto text-xs font-extrabold text-[#717785]">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`py-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'resumen'
                ? 'border-[#0F172A] text-[#0F172A] bg-white'
                : 'border-transparent hover:text-[#1D1D1F]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Resumen General</span>
          </button>

          <button
            onClick={() => setActiveTab('conteo')}
            className={`py-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'conteo'
                ? 'border-[#0F172A] text-[#0F172A] bg-white'
                : 'border-transparent hover:text-[#1D1D1F]'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>2. Conteo Físico</span>
          </button>

          <button
            onClick={() => setActiveTab('movimientos')}
            className={`py-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'movimientos'
                ? 'border-[#0F172A] text-[#0F172A] bg-white'
                : 'border-transparent hover:text-[#1D1D1F]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. Movimientos ({shift.cashMovements?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('vehiculos')}
            className={`py-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'vehiculos'
                ? 'border-[#0F172A] text-[#0F172A] bg-white'
                : 'border-transparent hover:text-[#1D1D1F]'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>4. Vehículos Traspasados</span>
          </button>

          <button
            onClick={() => setActiveTab('firmas')}
            className={`py-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'firmas'
                ? 'border-[#0F172A] text-[#0F172A] bg-white'
                : 'border-transparent hover:text-[#1D1D1F]'
            }`}
          >
            <FileSignature className="w-3.5 h-3.5" />
            <span>5. Firmas en 2 Copias</span>
          </button>
        </div>

        {/* Content Area */}
        <div id="printable-shift-report" className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* TAB 1: RESUMEN GENERAL */}
          {activeTab === 'resumen' && (
            <div className="space-y-5">
              {/* Metadata Recinto Banner */}
              <div className="p-4 bg-[#f9f9fb] border border-[#e2e2e4] rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#0F172A]" />
                    <span className="font-bold text-[#1D1D1F] text-sm">CORDANO PMS — Recinto Iquique</span>
                  </div>
                  <span className="text-[#717785] block tabular-nums text-[11px]">
                    Turno: <strong>{shift.id}</strong> | Operador: <strong>{shift.operatorName}</strong>
                  </span>
                </div>
                <div className="text-right space-y-0.5 text-[11px] text-[#515154]">
                  <div>
                    Apertura: {new Date(shift.startTime).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                  <div>
                    Cierre: {shift.endTime ? new Date(shift.endTime).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : 'Reciente'}
                  </div>
                </div>
              </div>

              {/* Status Alert Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isFlagged
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : isPerfect
                    ? 'bg-slate-900 border-slate-400 text-slate-800'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isFlagged ? (
                    <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-slate-800 shrink-0" />
                  )}
                  <div>
                    <span className="font-extrabold text-sm block">
                      {isFlagged
                        ? 'ALERTA REPORTE 1: TURNO DESCUADRADO'
                        : isPerfect
                        ? 'TURNO CUADRADO EXACTAMENTE'
                        : `Diferencia Aceptada dentro del Umbral ($${cashToleranceClp.toLocaleString('es-CL')} CLP)`}
                    </span>
                    <span className="text-xs opacity-90">
                      Diferencia Neta en Caja: {discrepancyCash >= 0 ? '+' : ''}
                      ${discrepancyCash.toLocaleString('es-CL')} CLP
                      {isFlagged && ' (Supera los $2.000 CLP permitidos)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="border border-[#e2e2e4] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f9f9fb] border-b border-[#e2e2e4] text-[10px] font-black uppercase text-[#717785]">
                    <tr>
                      <th className="py-2.5 px-4">Concepto / Canal</th>
                      <th className="py-2.5 px-3 text-right">Declarado Físico</th>
                      <th className="py-2.5 px-3 text-right">Esperado Sistema</th>
                      <th className="py-2.5 px-4 text-right">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f3f5] tabular-nums">
                    <tr>
                      <td className="py-2.5 px-4 font-sans font-bold text-[#1D1D1F]">
                        Fondo Inicial de Caja
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#515154]">
                        ${(shift.initialCash || 0).toLocaleString('es-CL')}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#515154]">
                        ${(shift.initialCash || 0).toLocaleString('es-CL')}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-800 font-bold">$0</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-sans font-bold text-[#1D1D1F]">
                        Efectivo Recaudado en Turno
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#1D1D1F]">
                        ${(shift.declaredCash || 0).toLocaleString('es-CL')}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#515154]">
                        ${(shift.expectedCash || 0).toLocaleString('es-CL')}
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right font-bold ${
                          discrepancyCash === 0 ? 'text-slate-800' : 'text-rose-600'
                        }`}
                      >
                        {discrepancyCash >= 0 ? '+' : ''}${discrepancyCash.toLocaleString('es-CL')}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-sans font-bold text-[#1D1D1F]">
                        POS Vouchers (Débito/Crédito)
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#1D1D1F]">
                        ${(shift.declaredCard || 0).toLocaleString('es-CL')}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#515154]">
                        ${(shift.expectedCard || 0).toLocaleString('es-CL')}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-800">$0</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-sans font-bold text-[#1D1D1F]">
                        Transferencias Bancarias Validadas
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#1D1D1F]">
                        ${(shift.declaredTransfer || 0).toLocaleString('es-CL')}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#515154]">
                        ${(shift.expectedTransfer || 0).toLocaleString('es-CL')}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-800">$0</td>
                    </tr>
                    <tr className="bg-[#f9f9fb] font-extrabold text-sm">
                      <td className="py-3 px-4 font-sans text-[#1D1D1F]">TOTAL RECAUDACIÓN TURNO</td>
                      <td className="py-3 px-3 text-right text-[#0F172A]">
                        ${totalDeclared.toLocaleString('es-CL')}
                      </td>
                      <td className="py-3 px-3 text-right text-[#1D1D1F]">
                        ${totalExpected.toLocaleString('es-CL')}
                      </td>
                      <td
                        className={`py-3 px-4 text-right ${
                          discrepancyTotal === 0 ? 'text-slate-800' : 'text-rose-600'
                        }`}
                      >
                        {discrepancyTotal >= 0 ? '+' : ''}${discrepancyTotal.toLocaleString('es-CL')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Justification & Hash */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#fbfbfc] border border-[#e2e2e4] rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-[#717785] uppercase tracking-wider block">
                    Observación / Justificación del Operador:
                  </span>
                  <p className="text-[#1D1D1F] font-medium leading-relaxed">
                    {shift.closeJustification || 'Sin observaciones especiales registradas.'}
                  </p>
                </div>

                <div className="p-3.5 bg-[#fbfbfc] border border-[#e2e2e4] rounded-2xl space-y-1 tabular-nums">
                  <span className="text-[10px] font-bold text-[#717785] uppercase tracking-wider block font-sans">
                    Hash de Inmutabilidad & SSoT:
                  </span>
                  <p className="text-[#0F172A] font-bold text-xs truncate">
                    {shift.hashAuditoria || 'CPMS-AUTH-VERIFIED-HASH'}
                  </p>
                  <span className="text-[10px] text-[#717785] font-sans block">
                    Sincronización: {shift.offlineSyncStatus === 'pending_sync' ? 'Pendiente Offline' : 'Sincronizado con Google Sheets'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTEO FÍSICO */}
          {activeTab === 'conteo' && (
            <div className="space-y-4">
              <h4 className="font-extrabold text-sm text-[#1D1D1F]">
                Desglose Físico de Billetes y Monedas Contados
              </h4>
              {shift.declaredCashBreakdown ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: '$50 Moneda', count: shift.declaredCashBreakdown.coins50, val: 50 },
                    { label: '$100 Moneda', count: shift.declaredCashBreakdown.coins100, val: 100 },
                    { label: '$500 Moneda', count: shift.declaredCashBreakdown.coins500, val: 500 },
                    { label: '$1.000 Billete', count: shift.declaredCashBreakdown.bills1000, val: 1000 },
                    { label: '$2.000 Billete', count: shift.declaredCashBreakdown.bills2000, val: 2000 },
                    { label: '$5.000 Billete', count: shift.declaredCashBreakdown.bills5000, val: 5000 },
                    { label: '$10.000 Billete', count: shift.declaredCashBreakdown.bills10000, val: 10000 },
                    { label: '$20.000 Billete', count: shift.declaredCashBreakdown.bills20000, val: 20000 },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#f9f9fb] border border-[#e2e2e4] rounded-2xl space-y-1">
                      <span className="text-[10px] text-[#717785] block font-bold">{item.label}</span>
                      <div className="flex items-baseline justify-between">
                        <span className="tabular-nums font-bold text-sm text-[#1D1D1F]">
                          {item.count || 0} un.
                        </span>
                        <span className="tabular-nums font-bold text-xs text-[#0F172A]">
                          ${((item.count || 0) * item.val).toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-[#f9f9fb] rounded-2xl border border-[#e2e2e4] text-center text-[#717785]">
                  Declarado mediante ingreso de Total Directo: ${(shift.declaredCash || 0).toLocaleString('es-CL')} CLP.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MOVIMIENTOS */}
          {activeTab === 'movimientos' && (
            <div className="space-y-4">
              <h4 className="font-extrabold text-sm text-[#1D1D1F]">
                Bitácora de Movimientos de Caja durante el Turno
              </h4>
              {shift.cashMovements && shift.cashMovements.length > 0 ? (
                <div className="divide-y divide-[#e2e2e4] border border-[#e2e2e4] rounded-2xl overflow-hidden">
                  {shift.cashMovements.map((m) => (
                    <div key={m.id} className="p-3.5 bg-white flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              m.type === 'INGRESO_MANUAL'
                                ? 'bg-slate-900 text-slate-800'
                                : m.type === 'GASTO_MENOR'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {m.type === 'INGRESO_MANUAL'
                              ? 'INGRESO MANUAL'
                              : m.type === 'GASTO_MENOR'
                              ? 'GASTO MENOR'
                              : 'SANGRÍA BÓVEDA'}
                          </span>
                          <span className="tabular-nums text-[11px] text-[#717785]">
                            {new Date(m.timestamp).toLocaleTimeString('es-CL')}
                          </span>
                        </div>
                        <p className="text-xs text-[#1D1D1F] font-medium">{m.reason}</p>
                        <span className="text-[10px] text-[#717785] block">
                          Solicitó: {m.requesterName || m.operatorName} | Autorizó: {m.authorizerName || m.authorizedBySupervisor || 'Supervisor'}
                        </span>
                      </div>
                      <div className="text-right tabular-nums font-bold text-sm text-[#1D1D1F]">
                        {m.type === 'INGRESO_MANUAL' ? '+' : '-'}${m.amount.toLocaleString('es-CL')} CLP
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-[#f9f9fb] rounded-2xl border border-[#e2e2e4] text-center text-[#717785]">
                  No se registraron movimientos manuales durante este turno.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VEHICULOS TRASPASADOS */}
          {activeTab === 'vehiculos' && (
            <div className="space-y-4">
              <h4 className="font-extrabold text-sm text-[#1D1D1F]">
                Custodia de Vehículos en Recinto
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-[#f9f9fb] border border-[#e2e2e4] rounded-2xl space-y-1">
                  <span className="text-[#717785] text-xs block font-medium">Vehículos Traspasados al Siguiente Turno:</span>
                  <span className="text-2xl tabular-nums font-black text-[#0F172A]">
                    {shift.transferredVehiclesCount || 0}
                  </span>
                  <span className="text-[11px] text-[#515154] block mt-1">
                    Permanecen activos en sus respectivos slots con tiempo corriendo.
                  </span>
                </div>

                <div className="p-4 bg-[#f9f9fb] border border-[#e2e2e4] rounded-2xl space-y-1">
                  <span className="text-[#717785] text-xs block font-medium">Salidas Forzadas / Cobradas en Cierre:</span>
                  <span className="text-2xl tabular-nums font-black text-slate-800">
                    {shift.forcedExitVehiclesCount || 0}
                  </span>
                  <span className="text-[11px] text-[#515154] block mt-1">
                    Fueron liquidadas y liberaron slot antes del cambio de turno.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FIRMAS EN DOS COPIAS (MANDATO REGLA 2) */}
          {activeTab === 'firmas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-[#1D1D1F]">
                    Acta de Entrega de Turno: Modalidad Doble Copia
                  </h4>
                  <p className="text-xs text-[#717785]">
                    Copia 1 para gaveta de caja; Copia 2 exclusiva de protección al operador.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedSignatureCopy('copia1_caja')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedSignatureCopy === 'copia1_caja'
                        ? 'bg-[#0F172A] text-white shadow-xs'
                        : 'bg-[#f3f3f5] text-[#515154]'
                    }`}
                  >
                    Copia 1: Caja
                  </button>

                  <button
                    onClick={() => setSelectedSignatureCopy('copia2_operador')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedSignatureCopy === 'copia2_operador'
                        ? 'bg-[#0F172A] text-white shadow-xs'
                        : 'bg-[#f3f3f5] text-[#515154]'
                    }`}
                  >
                    Copia 2: Operador
                  </button>
                </div>
              </div>

              {/* Card Copia 1 vs Copia 2 */}
              {selectedSignatureCopy === 'copia1_caja' ? (
                <div className="p-5 bg-[#fbfbfc] border-2 border-[#e2e2e4] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-extrabold text-xs text-[#0F172A] uppercase tracking-wider">
                      COPIA 1 — PARA LA CAJA DEL RECINTO (AUDITORÍA COMPLETA)
                    </span>
                    <span className="text-[11px] tabular-nums text-slate-800 font-bold">
                      {shift.signedCopy1Caja ? '✓ Firmada y Sellada' : 'Pendiente de Firma'}
                    </span>
                  </div>
                  <p className="text-xs text-[#515154]">
                    Contiene el desglose íntegro del sistema, fondos recaudados, diferencias de arqueo y notas para la administración.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#717785] block">Total Declarado:</span>
                      <strong className="tabular-nums text-sm">${totalDeclared.toLocaleString('es-CL')} CLP</strong>
                    </div>
                    <div>
                      <span className="text-[#717785] block">Total Esperado Sistema:</span>
                      <strong className="tabular-nums text-sm">${totalExpected.toLocaleString('es-CL')} CLP</strong>
                    </div>
                  </div>
                  <div className="pt-3 border-t flex justify-end">
                    <button
                      onClick={() => signShiftCopy('caja')}
                      className="px-4 py-2 rounded-xl bg-[#0F172A] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-[#1E293B] transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{shift.signedCopy1Caja ? 'Volver a Firmar Copia 1' : 'Firmar y Timbrar Copia 1'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-blue-50/40 border-2 border-blue-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                    <span className="font-extrabold text-xs text-blue-900 uppercase tracking-wider">
                      COPIA 2 — RESPALDO LEGAL PARA EL OPERADOR (PROTECCIÓN LABORAL)
                    </span>
                    <span className="text-[11px] tabular-nums text-slate-800 font-bold">
                      {shift.signedCopy2Operador ? '✓ Firmada por Operador' : 'Pendiente de Firma'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs text-blue-950 leading-relaxed font-medium">
                    🛡️ <strong>Cláusula de Protección:</strong> En esta copia <strong>solo aparecen los montos que el operador ingresó físicamente</strong>, protegiéndolo de que no le agreguen cobros indebidos o modificaciones posteriores en el sistema central.
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[#717785] block">Efectivo Físico Entregado:</span>
                      <strong className="tabular-nums text-sm text-[#1D1D1F]">
                        ${(shift.declaredCash || 0).toLocaleString('es-CL')} CLP
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#717785] block">Vouchers POS Entregados:</span>
                      <strong className="tabular-nums text-sm text-[#1D1D1F]">
                        ${(shift.declaredCard || 0).toLocaleString('es-CL')} CLP
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#717785] block">Transferencias Reportadas:</span>
                      <strong className="tabular-nums text-sm text-[#1D1D1F]">
                        ${(shift.declaredTransfer || 0).toLocaleString('es-CL')} CLP
                      </strong>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-blue-200 flex justify-end">
                    <button
                      onClick={() => signShiftCopy('operador')}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-slate-900 transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{shift.signedCopy2Operador ? 'Copia 2 Ya Firmada' : 'Firmar Copia 2 (Respaldo Operador)'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions (Sticky bottom on all viewports) */}
        <div className="sticky bottom-0 z-20 shrink-0 p-3.5 sm:p-5 border-t border-[#e2e2e4] bg-[#fbfbfc] flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Print Button */}
            <button
              type="button"
              id="btn-print-report-modal"
              onClick={handleSystemPrint}
              className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Imprimir Reporte Z</span>
            </button>

            {/* Direct Vector PDF Download */}
            <button
              type="button"
              id="btn-download-report-pdf"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-3.5 py-2.5 rounded-xl bg-[#1a1c1d] hover:bg-[#2d3034] text-white font-bold text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
            >
              {downloadingPdf ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-800" />
                  <span>Descargar PDF</span>
                </>
              )}
            </button>

            {/* WhatsApp wa.me Link Button */}
            <button
              type="button"
              onClick={handleWhatsAppSend}
              id="btn-send-whatsapp-report"
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-900 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Email Button */}
            <button
              type="button"
              onClick={handleEmailSend}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#c1c6d6] hover:bg-[#f3f3f5] text-[#1D1D1F] font-bold text-xs transition flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <Mail className="w-4 h-4 text-slate-800" />
              <span className="hidden sm:inline">Correo</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenNewShift && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewShift();
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-900 text-white font-extrabold text-xs transition flex items-center gap-2 shadow-md cursor-pointer"
              >
                <span>Aperturar Siguiente Turno</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#f3f3f5] hover:bg-[#e2e2e4] text-[#414753] font-bold text-xs transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
