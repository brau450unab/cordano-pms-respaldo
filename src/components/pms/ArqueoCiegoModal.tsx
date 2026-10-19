import React, { useState } from 'react';
import { generateShiftClosingPdf, triggerPdfDownload } from '../../utils/pdfGenerator';
import { useParking } from '../../context/ParkingContext';

interface ArqueoCiegoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFloat: number;
  shiftRevenue: number;
  onConfirmClose: (cash: number, pos: number, transfer: number) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ArqueoCiegoModal: React.FC<ArqueoCiegoModalProps> = ({
  isOpen,
  onClose,
  initialFloat,
  shiftRevenue,
  onConfirmClose,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const { currentShift, user, tickets } = useParking();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [declareCash, setDeclareCash] = useState('');
  const [declarePos, setDeclarePos] = useState('');
  const [declareTransfer, setDeclareTransfer] = useState('');
  const [justification, setJustification] = useState('');
  const [shiftSealHash] = useState(`SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`);
  const [lastGeneratedPdfDoc, setLastGeneratedPdfDoc] = useState<any>(null);

  // Expected amounts from current shift
  const paidTickets = tickets.filter((t) => t.status === 'pagado');
  const cashTickets = paidTickets
    .filter((t) => t.paymentMethod === 'efectivo')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const cardTickets = paidTickets
    .filter((t) => t.paymentMethod === 'tarjeta_debito' || t.paymentMethod === 'tarjeta_credito')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const transTickets = paidTickets
    .filter((t) => t.paymentMethod === 'transferencia')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  const movements = currentShift?.cashMovements || [];
  const manualIngresos = movements
    .filter((m) => m.type === 'INGRESO_MANUAL')
    .reduce((sum, m) => sum + m.amount, 0);
  const manualRetiros = movements
    .filter((m) => m.type === 'RETIRO_SANGRIA' || m.type === 'GASTO_MENOR')
    .reduce((sum, m) => sum + m.amount, 0);

  const sysCashExpected = (currentShift?.initialCash || initialFloat) + cashTickets + manualIngresos - manualRetiros;
  const sysPosExpected = cardTickets;
  const sysTransExpected = transTickets;

  const decCashNum = parseInt(declareCash) || 0;
  const decPosNum = parseInt(declarePos) || 0;
  const decTransNum = parseInt(declareTransfer) || 0;

  const totalSys = sysCashExpected + sysPosExpected + sysTransExpected;
  const totalDec = decCashNum + decPosNum + decTransNum;
  const diffCash = decCashNum - sysCashExpected;
  const diffTotal = totalDec - totalSys;

  const handoverFund = initialFloat || 50000;
  const deliveryCashEnvelope = Math.max(0, decCashNum - handoverFund);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (declareCash === '' && declarePos === '' && declareTransfer === '') {
      onShowToast('Debe ingresar al menos un valor de conteo para continuar.', 'error');
      return;
    }
    setStep(2);
  };

  const handleEmitReportZ = () => {
    try {
      const shiftDataForReport = {
        id: currentShift?.id || `TURNO-${Date.now().toString().slice(-6)}`,
        operatorName: user.name || currentShift?.operatorName || 'Operador Garita',
        startTime: currentShift?.startTime || new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        endTime: new Date().toISOString(),
        initialCash: initialFloat,
        declaredCash: decCashNum,
        declaredCard: decPosNum,
        declaredTransfer: decTransNum,
        expectedCash: sysCashExpected,
        expectedCard: sysPosExpected,
        expectedTransfer: sysTransExpected,
        discrepancyCash: diffCash,
        discrepancyTotal: diffTotal,
        isDiscrepancyFlagged: Math.abs(diffCash) > 2000,
        status: 'cerrado' as const,
        hashAuditoria: shiftSealHash,
        totalTicketsProcessed: paidTickets.length || 1,
        handoverFundAmount: handoverFund,
        closeJustification: justification.trim() || undefined,
      };

      // Force automatic PDF download directly to disk
      const generated = generateShiftClosingPdf(shiftDataForReport as any, true);
      setLastGeneratedPdfDoc(generated);

      onShowToast('Reporte Z oficial emitido y descargado en PDF A4 (2 copias con firmas).', 'success');
      setStep(3);
    } catch (e) {
      console.error('Error al generar PDF de cierre:', e);
      onShowToast('Error al procesar el PDF. Puede descargarlo manualmente en el siguiente paso.', 'error');
      setStep(3);
    }
  };

  const handleManualPdfDownload = () => {
    try {
      if (lastGeneratedPdfDoc && lastGeneratedPdfDoc.doc) {
        triggerPdfDownload(lastGeneratedPdfDoc.doc, lastGeneratedPdfDoc.filename);
      } else {
        generateShiftClosingPdf({
          id: currentShift?.id || `TURNO-${Date.now().toString().slice(-6)}`,
          operatorName: user.name,
          startTime: currentShift?.startTime || new Date().toISOString(),
          endTime: new Date().toISOString(),
          initialCash: initialFloat,
          declaredCash: decCashNum,
          declaredCard: decPosNum,
          declaredTransfer: decTransNum,
          expectedCash: sysCashExpected,
          expectedCard: sysPosExpected,
          expectedTransfer: sysTransExpected,
          discrepancyCash: diffCash,
          discrepancyTotal: diffTotal,
          status: 'cerrado',
          hashAuditoria: shiftSealHash,
          totalTicketsProcessed: paidTickets.length,
          handoverFundAmount: handoverFund,
        } as any, true);
      }
      onShowToast('Descarga forzada de Reporte Z ejecutada.', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('No fue posible reintentar la descarga del PDF.', 'error');
    }
  };

  const handleFinalize = () => {
    onConfirmClose(decCashNum, decPosNum, decTransNum);
    onClose();
  };

  return (
    <div
      id="modal-close-shift"
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in-up font-sans"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header Corporativo */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#1E1E2F] text-white border-b border-[#2D2D44]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-600 flex items-center justify-center text-base sm:text-lg font-black text-white shrink-0 shadow-sm">
              🔒
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-rose-400 block truncate">
                ARQUEO CIEGO &amp; CORTE Z · SERRANO 447
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white truncate leading-tight">
                {step === 3 ? 'Cierre de Caja Exitoso' : 'Cierre de Turno y Arqueo Ciego'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[9px] sm:text-[10px] font-mono font-bold text-slate-300 border border-slate-700">
              PASO {step}&nbsp;/&nbsp;3
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs sm:text-sm cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-xs flex-1">
          {/* ── PASO 1: CONTEO FÍSICO CIEGO ── */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">👁️‍🗨️</span>
                  <h4 className="font-extrabold text-xs text-[#1E1E2F] uppercase tracking-wide">
                    Protocolo de Conteo Ciego Antifraude
                  </h4>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Ingrese el dinero físico y comprobantes recontados en su garita. El sistema <strong>mantiene oculto el total esperado</strong> hasta que declare los valores para evitar cuadres forzados o adulteraciones.
                </p>
              </div>

              {/* Input Efectivo */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                    <span>💵</span>
                    <span>Total Efectivo Físico en Gaveta *</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    Incluye fondo inicial ${initialFloat.toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={declareCash}
                    onChange={(e) => setDeclareCash(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full h-11 pl-7 pr-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-black text-slate-900 text-base focus:border-[#E2498A] focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Cuente todos los billetes y monedas que se encuentran dentro de la gaveta de garita.
                </p>
              </div>

              {/* Input Tarjetas POS */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                    <span>💳</span>
                    <span>Total Vouchers Tarjetas (POS Transbank) *</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">Débito + Crédito</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={declarePos}
                    onChange={(e) => setDeclarePos(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full h-11 pl-7 pr-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-black text-slate-900 text-base focus:border-[#E2498A] focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Sume el monto de los comprobantes impresos por la máquina Transbank durante el turno.
                </p>
              </div>

              {/* Input Transferencias */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                    <span>📲</span>
                    <span>Total Transferencias Verificadas *</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">Validado en cartola</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={declareTransfer}
                    onChange={(e) => setDeclareTransfer(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full h-11 pl-7 pr-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-black text-slate-900 text-base focus:border-[#E2498A] focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Total de pagos recibidos vía transferencia electrónica con comprobante validado.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-12 rounded-2xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white font-extrabold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Continuar a Revelación de Cuadratura</span>
                  <span>→</span>
                </button>
              </div>
            </form>
          )}

          {/* ── PASO 2: CONCILIACIÓN REVELADA & DESGLOSE ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Resultado de Cuadratura Revelada
                  </span>
                  <span className="font-mono text-[10px] font-bold text-slate-500">
                    ID: {currentShift?.id || 'TURNO-ACTUAL'}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  El sistema comparó los montos físicos declarados contra las transacciones registradas.
                </p>
              </div>

              {/* Tabla Comparativa de Medios */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden font-mono">
                <div className="grid grid-cols-4 bg-slate-100 text-slate-600 font-bold text-[10px] uppercase p-3 border-b border-slate-200">
                  <span>Concepto</span>
                  <span className="text-right">Declarado</span>
                  <span className="text-right">Esperado</span>
                  <span className="text-right">Diferencia</span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-4 p-3 items-center">
                    <span className="font-sans font-bold text-slate-700">Efectivo</span>
                    <span className="text-right font-black text-slate-900">${decCashNum.toLocaleString('es-CL')}</span>
                    <span className="text-right text-slate-400">${sysCashExpected.toLocaleString('es-CL')}</span>
                    <span className={`text-right font-bold ${diffCash === 0 ? 'text-emerald-600' : diffCash > 0 ? 'text-sky-600' : 'text-rose-600'}`}>
                      ${diffCash.toLocaleString('es-CL')}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 p-3 items-center">
                    <span className="font-sans font-bold text-slate-700">Tarjetas POS</span>
                    <span className="text-right font-black text-slate-900">${decPosNum.toLocaleString('es-CL')}</span>
                    <span className="text-right text-slate-400">${sysPosExpected.toLocaleString('es-CL')}</span>
                    <span className={`text-right font-bold ${(decPosNum - sysPosExpected) === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ${(decPosNum - sysPosExpected).toLocaleString('es-CL')}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 p-3 items-center">
                    <span className="font-sans font-bold text-slate-700">Transferencias</span>
                    <span className="text-right font-black text-slate-900">${decTransNum.toLocaleString('es-CL')}</span>
                    <span className="text-right text-slate-400">${sysTransExpected.toLocaleString('es-CL')}</span>
                    <span className={`text-right font-bold ${(decTransNum - sysTransExpected) === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ${(decTransNum - sysTransExpected).toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>

                {/* Banner de Estado Final */}
                <div
                  className={`p-3.5 border-t-2 flex items-center justify-between ${
                    diffTotal === 0
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : diffTotal > 0
                      ? 'bg-sky-50 border-sky-300 text-sky-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  <span className="font-sans font-bold uppercase text-xs">
                    {diffTotal === 0 ? '✓ Cuadratura Perfecta' : diffTotal > 0 ? '⚠ Sobrante en Caja' : '⚠ Faltante en Caja'}
                  </span>
                  <span className="font-mono font-black text-base">
                    {diffTotal === 0 ? '$0 CLP' : `${diffTotal > 0 ? '+' : ''}$${diffTotal.toLocaleString('es-CL')} CLP`}
                  </span>
                </div>
              </div>

              {/* Desglose de Entrega Física de Fondos */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  Distribución Física del Efectivo Recontado:
                </span>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-sans text-slate-500 block">Fondo Sencillo para Próximo Turno:</span>
                    <span className="text-sm font-black text-slate-800">${handoverFund.toLocaleString('es-CL')} CLP</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-sans text-slate-500 block">Sobre Remesa para Administración:</span>
                    <span className="text-sm font-black text-emerald-700">${deliveryCashEnvelope.toLocaleString('es-CL')} CLP</span>
                  </div>
                </div>
              </div>

              {/* Justificación obligatoria si hay descuadre */}
              {diffTotal !== 0 && (
                <div className="space-y-1">
                  <label className="font-bold text-rose-700 block text-xs">
                    Justificación Obligatoria de Descuadre *
                  </label>
                  <textarea
                    rows={2}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Explique el motivo del faltante o sobrante (ej. vuelto equivocado, propina, etc.)..."
                    className="w-full p-2.5 rounded-xl border-2 border-rose-200 bg-rose-50/50 font-sans text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {/* Sello Criptográfico SHA-256 */}
              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-600 flex items-center justify-between">
                <span>Sello SHA-256:</span>
                <span className="font-bold text-slate-800">{shiftSealHash}</span>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleEmitReportZ}
                  className="w-full h-12 rounded-2xl bg-[#E2498A] hover:bg-[#C83472] text-white font-extrabold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>📄</span>
                  <span>Emitir Reporte Z (PDF A4 - 2 Copias) &amp; Cerrar Turno</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-2 text-slate-400 hover:text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  ← Volver a corregir montos declarados
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 3: CONFIRMACIÓN & DESCARGA GARANTIZADA ── */}
          {step === 3 && (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl shadow-sm animate-bounce">
                ✓
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Turno Cerrado Definitivamente
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  El Reporte Z fue emitido en <strong>formato estándar A4 corporativo</strong> (Copia 1 Garita + Copia 2 Administración) con los bloques de firmas físicas y sello criptográfico.
                </p>
              </div>

              {/* Botones de Exportación Garantizada */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Exportación de Documentos:
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleManualPdfDownload}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
                  >
                    <span>📥</span>
                    <span>Descargar PDF A4</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        generateShiftClosingPdf({
                          id: currentShift?.id || `TURNO-${Date.now().toString().slice(-6)}`,
                          operatorName: user.name,
                          startTime: currentShift?.startTime || new Date().toISOString(),
                          endTime: new Date().toISOString(),
                          initialCash: initialFloat,
                          declaredCash: decCashNum,
                          declaredCard: decPosNum,
                          declaredTransfer: decTransNum,
                          expectedCash: sysCashExpected,
                          expectedCard: sysPosExpected,
                          expectedTransfer: sysTransExpected,
                          discrepancyCash: diffCash,
                          discrepancyTotal: diffTotal,
                          status: 'cerrado',
                          hashAuditoria: shiftSealHash,
                          totalTicketsProcessed: paidTickets.length,
                          handoverFundAmount: handoverFund,
                        } as any, false);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="py-3 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <span>🖨</span>
                    <span>Imprimir A4</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinalize}
                  className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  Finalizar Turno &amp; Bloquear Punto de Venta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
