'use client';

import React from 'react';

export interface ActiveVehicle {
  slot: number;
  slotCode: string;
  ticketId: string;
  plate: string;
  cat: string;
  rate: number;
  entry: string;
  durationMin: number;
  client: string;
  phone?: string;
  obs?: string;
  isOffline?: boolean;
  discount?: number;
  surcharge?: number;
}

interface OfficialModalsProps {
  ticketModalOpen: boolean;
  closeTicketModal: () => void;
  ticketPreviewData: any;
  confirmVehicleEntry: () => void;
  printPhysicalTicket: () => void;
  sendTicketViaWhatsApp: () => void;

  closeShiftModalOpen: boolean;
  closeShiftStep: number;
  closeShiftModal: () => void;
  declareCash: string;
  setDeclareCash: (v: string) => void;
  declarePos: string;
  setDeclarePos: (v: string) => void;
  declareTransfer: string;
  setDeclareTransfer: (v: string) => void;
  sysCashExpected: number;
  sysPosExpected: number;
  sysTransExpected: number;
  shiftSealHash: string;
  goToCashCloseStep2: () => void;
  backToCashCloseStep1: () => void;
  emitReportZ: () => void;
  confirmShiftClose: () => void;

  manualTxModalOpen: boolean;
  closeManualTransactionModal: () => void;
  manualTxType: 'INGRESO' | 'EGRESO';
  setManualTxType: (v: 'INGRESO' | 'EGRESO') => void;
  manualTxAmount: string;
  setManualTxAmount: (v: string) => void;
  manualTxDesc: string;
  setManualTxDesc: (v: string) => void;
  manualTxAuth: string;
  setManualTxAuth: (v: string) => void;
  manualTxPin: string;
  setManualTxPin: (v: string) => void;
  confirmManualTransaction: () => void;

  pinModalType: 'DISCOUNT' | 'LOST_TICKET' | null;
  closePinModal: () => void;
  pinValue: string;
  setPinValue: (v: string) => void;
  pinReason: string;
  setPinReason: (v: string) => void;
  discountAmountInput: string;
  setDiscountAmountInput: (v: string) => void;
  confirmPinException: () => void;
}

export function OfficialModals({
  ticketModalOpen,
  closeTicketModal,
  ticketPreviewData,
  confirmVehicleEntry,
  printPhysicalTicket,
  sendTicketViaWhatsApp,
  closeShiftModalOpen,
  closeShiftStep,
  closeShiftModal,
  declareCash,
  setDeclareCash,
  declarePos,
  setDeclarePos,
  declareTransfer,
  setDeclareTransfer,
  sysCashExpected,
  sysPosExpected,
  sysTransExpected,
  shiftSealHash,
  goToCashCloseStep2,
  backToCashCloseStep1,
  emitReportZ,
  confirmShiftClose,
  manualTxModalOpen,
  closeManualTransactionModal,
  manualTxType,
  setManualTxType,
  manualTxAmount,
  setManualTxAmount,
  manualTxDesc,
  setManualTxDesc,
  manualTxAuth,
  setManualTxAuth,
  manualTxPin,
  setManualTxPin,
  confirmManualTransaction,
  pinModalType,
  closePinModal,
  pinValue,
  setPinValue,
  pinReason,
  setPinReason,
  discountAmountInput,
  setDiscountAmountInput,
  confirmPinException,
}: OfficialModalsProps) {
  const decCashNum = parseInt(declareCash) || 0;
  const decPosNum = parseInt(declarePos) || 0;
  const decTransNum = parseInt(declareTransfer) || 0;
  const totalSys = sysCashExpected + sysPosExpected + sysTransExpected;
  const totalDec = decCashNum + decPosNum + decTransNum;
  const diff = totalDec - totalSys;

  return (
    <>
      {ticketModalOpen && (
        <div id="modal-ticket-preview" className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#e8ecf0] shadow-[0_16px_48px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.06)] w-full max-w-sm animate-fade-in-up">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#f1f5f9]">
              <span className="text-[13px] font-bold uppercase tracking-[0.07em] font-mono text-slate-700">Ticket Térmico — 80mm</span>
              <button onClick={closeTicketModal} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors text-base font-bold">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-5 bg-[#fafafa] border border-[#e8ecf0] rounded-xl font-mono text-xs space-y-3 text-center text-slate-800 tabular-nums">
                <div className="border-b border-dashed border-slate-300 pb-3 space-y-0.5">
                  <div className="font-bold text-[13px] text-slate-900">CORDANO INVERSIONES INMOBILIARIAS</div>
                  <div className="text-[11px] font-bold text-slate-700">PARKOPS — SERRANO 447, IQUIQUE</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Tarapacá&nbsp;•&nbsp;RUT: 76.842.190-4</div>
                </div>
                <div className="py-1">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Patente Vehículo</div>
                  <div id="modal-ticket-plate" className="license-plate-chip text-2xl font-extrabold tracking-[0.25em] text-slate-900 inline-block px-4 py-1 bg-white border-2 border-slate-900 rounded">{ticketPreviewData.plate}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left border-y border-dashed border-slate-300 py-2.5">
                  <div><span className="text-slate-400">Fecha:</span><br /><span className="font-bold">{ticketPreviewData.date}</span></div>
                  <div><span className="text-slate-400">Hora:</span><br /><span className="font-bold">{ticketPreviewData.time}</span></div>
                  <div><span className="text-slate-400">Plaza / Llegada:</span><br /><span className="font-bold text-slate-900">{ticketPreviewData.slot}</span></div>
                  <div><span className="text-slate-400">Tarifa:</span><br /><span className="font-bold">${ticketPreviewData.rate}/min</span></div>
                </div>
                {ticketPreviewData.obs && (
                  <div className="text-[10px] text-left bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-900 leading-snug">
                    <strong>Obs. Daños:</strong> {ticketPreviewData.obs}
                  </div>
                )}
                <div className="pt-1 flex flex-col items-center justify-center space-y-2.5">
                  <div className="w-[76px] h-[76px] border-2 border-slate-900 p-1.5 bg-white rounded-md flex items-center justify-center shadow-sm">
                    <svg className="w-full h-full text-slate-900" viewBox="0 0 24 24" fill="currentColor" aria-label="QR Code">
                      <rect x="2" y="2" width="6" height="6" rx="0.5"/>
                      <rect x="16" y="2" width="6" height="6" rx="0.5"/>
                      <rect x="2" y="16" width="6" height="6" rx="0.5"/>
                      <rect x="3.5" y="3.5" width="3" height="3" fill="white"/>
                      <rect x="17.5" y="3.5" width="3" height="3" fill="white"/>
                      <rect x="3.5" y="17.5" width="3" height="3" fill="white"/>
                      <rect x="10" y="10" width="4" height="4" rx="0.25"/>
                      <rect x="16" y="16" width="4" height="4" rx="0.25"/>
                      <rect x="10" y="16" width="4" height="2" rx="0.25"/>
                      <rect x="16" y="10" width="2" height="4" rx="0.25"/>
                      <rect x="10" y="3" width="2" height="2"/>
                      <rect x="13" y="3" width="2" height="2"/>
                      <rect x="3" y="10" width="2" height="2"/>
                      <rect x="3" y="13" width="2" height="2"/>
                    </svg>
                  </div>
                  <div className="w-full px-2">
                    <div className="h-8 w-full rounded-sm overflow-hidden" style={{ background: 'repeating-linear-gradient(90deg,#0f172a 0px,#0f172a 2px,transparent 2px,transparent 4px,#0f172a 4px,#0f172a 5px,transparent 5px,transparent 8px,#0f172a 8px,#0f172a 9px,transparent 9px,transparent 12px)' }} />
                    <div className="text-[10px] font-bold tracking-[0.12em] text-slate-900 mt-1 text-center">{ticketPreviewData.ticketId}</div>
                  </div>
                </div>
                <div className="border border-amber-300 bg-amber-50 rounded-lg px-3 py-2 text-[9px] text-amber-900 text-left leading-snug mt-1">
                  <span className="font-extrabold uppercase tracking-wide">⚠ Importante:</span> No pierda este ticket. El extravío tiene un recargo reglamentario de <strong className="text-amber-800 text-[10px]">$8.000&nbsp;CLP</strong> previa acreditación de dominio.
                </div>
              </div>
              {!ticketPreviewData.confirmed ? (
                <div id="modal-actions-pre" className="space-y-2">
                  <button onClick={confirmVehicleEntry} className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5">
                    Confirmar Ingreso en Sistema [Enter]
                  </button>
                </div>
              ) : (
                <div id="modal-actions-post" className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={printPhysicalTicket} className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5">Imprimir 80mm [F8]</button>
                    <button onClick={sendTicketViaWhatsApp} className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5">WhatsApp</button>
                  </div>
                  <button onClick={closeTicketModal} className="text-[12px] font-semibold text-slate-400 hover:text-slate-700 text-center py-2 w-full transition-colors">Cerrar y continuar operando [Esc]</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {closeShiftModalOpen && (
        <div id="modal-close-shift" className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#e8ecf0] shadow-[0_16px_48px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.06)] w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-rose-500 live-pulse flex-shrink-0" />
                <span className="text-[13px] font-bold uppercase tracking-[0.07em] font-mono text-slate-700 truncate">
                  {closeShiftStep === 3 ? 'Cierre de Caja Exitoso' : 'Arqueo de Caja Ciega y Fin de Turno'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {closeShiftStep !== 3 && <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">PASO {closeShiftStep}&nbsp;/&nbsp;3</span>}
                <button onClick={closeShiftModal} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors text-base font-bold">✕</button>
              </div>
            </div>

            {closeShiftStep === 1 && (
              <div id="close-shift-step-1" className="p-6 space-y-5">
                <p className="text-[13px] text-slate-500 leading-relaxed">Ingrese los montos físicos y comprobantes contabilizados en su garita para realizar la cuadratura ciega (el monto esperado por sistema permanece oculto).</p>
                <div className="space-y-4 font-mono tabular-nums">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">Total Efectivo Físico Recontado (Incluye $50.000 Fondo)</label>
                    <input type="number" value={declareCash} onChange={(e) => setDeclareCash(e.target.value)} placeholder="Ej. 192500" className="w-full h-10 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] font-mono text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-0" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">Total Vouchers Tarjetas (POS Transbank)</label>
                    <input type="number" value={declarePos} onChange={(e) => setDeclarePos(e.target.value)} placeholder="Ej. 150000" className="w-full h-10 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] font-mono text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-0" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">Total Transferencias Verificadas</label>
                    <input type="number" value={declareTransfer} onChange={(e) => setDeclareTransfer(e.target.value)} placeholder="Ej. 50000" className="w-full h-10 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] font-mono text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-0" />
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <button onClick={goToCashCloseStep2} className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5">Verificar Cuadratura de Turno</button>
                  <button onClick={closeShiftModal} className="text-[12px] font-semibold text-slate-400 hover:text-slate-700 text-center py-2 w-full transition-colors">Cancelar y continuar operando</button>
                </div>
              </div>
            )}

            {closeShiftStep === 2 && (
              <div id="close-shift-step-2" className="p-6 space-y-5">
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Conciliación revelada (<span className="font-mono">Efectivo Sistema</span> vs <span className="font-mono">Recontado Físico</span>). Al confirmar, se sellará con firma <span className="font-mono font-bold">SHA-256</span> y se emitirá el Reporte Z.
                </p>
                <div className="rounded-xl border border-[#e8ecf0] overflow-hidden">
                  <div className="grid grid-cols-3 gap-0 bg-[#f8fafc] border-b border-[#e8ecf0] px-4 py-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400">Medio</div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400 text-right">Sistema</div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400 text-right">Declarado</div>
                  </div>
                  <div className="divide-y divide-[#f1f5f9]">
                    <div className="grid grid-cols-3 gap-0 px-4 py-2.5 items-center font-mono tabular-nums text-sm">
                      <div className="text-slate-700 font-medium">Efectivo*</div>
                      <div className="text-right text-slate-400">${sysCashExpected.toLocaleString('es-CL')}</div>
                      <div className="text-right font-bold text-slate-900">${decCashNum.toLocaleString('es-CL')}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-0 px-4 py-2.5 items-center font-mono tabular-nums text-sm">
                      <div className="text-slate-700 font-medium">Tarjetas POS</div>
                      <div className="text-right text-slate-400">${sysPosExpected.toLocaleString('es-CL')}</div>
                      <div className="text-right font-bold text-slate-900">${decPosNum.toLocaleString('es-CL')}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-0 px-4 py-2.5 items-center font-mono tabular-nums text-sm">
                      <div className="text-slate-700 font-medium">Transf.</div>
                      <div className="text-right text-slate-400">${sysTransExpected.toLocaleString('es-CL')}</div>
                      <div className="text-right font-bold text-slate-900">${decTransNum.toLocaleString('es-CL')}</div>
                    </div>
                  </div>
                  <div className={`flex items-center justify-between px-4 py-3 border-t-2 font-mono tabular-nums ${diff === 0 ? 'border-emerald-200 bg-emerald-50' : diff > 0 ? 'border-sky-200 bg-sky-50' : 'border-rose-200 bg-rose-50'}`}>
                    <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-600">Diferencia / Cuadre</span>
                    <span className={`font-black text-base ${diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-sky-600' : 'text-rose-600'}`}>
                      {diff === 0 ? 'CUADRADO ($0)' : diff > 0 ? `SOBRANTE (+$${diff.toLocaleString('es-CL')})` : `FALTANTE (-$${Math.abs(diff).toLocaleString('es-CL')})`}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400 mb-1">Firma Criptográfica SHA-256</div>
                  <div className="text-[9px] font-mono text-slate-500 bg-slate-50 px-2 py-1.5 rounded border border-[#e8ecf0] truncate">{shiftSealHash}</div>
                </div>
                <div className="space-y-2 pt-1">
                  <button onClick={emitReportZ} className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-50 text-white font-bold text-sm shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5">Emitir Reporte Z y Cerrar Caja</button>
                  <button onClick={backToCashCloseStep1} className="text-[12px] font-semibold text-slate-400 hover:text-slate-700 text-center py-2 w-full transition-colors">Volver a corregir montos</button>
                </div>
              </div>
            )}

            {closeShiftStep === 3 && (
              <div id="close-shift-step-3" className="p-6 space-y-5 text-center py-10">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">Turno Finalizado</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    El <strong>Reporte Z #1042</strong> ha sido generado e impreso en 80mm con sello <span className="font-mono font-bold text-slate-800">{shiftSealHash}</span>.
                  </p>
                </div>
                <button onClick={confirmShiftClose} className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 mt-2">
                  Cerrar Sesión del Sistema
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {manualTxModalOpen && (
        <div id="modal-manual-transaction" className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#e8ecf0] shadow-[0_16px_48px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.06)] w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#f1f5f9]">
              <span className="text-[13px] font-bold uppercase tracking-[0.07em] font-mono text-slate-700">Registrar Movimiento en Efectivo</span>
              <button onClick={closeManualTransactionModal} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors text-base font-bold">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">Tipo de Movimiento</label>
                <div className="flex p-1 bg-[#f1f5f9] rounded-xl gap-1">
                  <button type="button" onClick={() => setManualTxType('INGRESO')} className={`flex-1 h-9 rounded-[9px] text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${manualTxType === 'INGRESO' ? 'bg-white text-emerald-700 shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-emerald-200' : 'text-slate-500 hover:text-slate-700'}`}>
                    <span className="text-base leading-none">+</span> Ingreso Extra
                  </button>
                  <button type="button" onClick={() => setManualTxType('EGRESO')} className={`flex-1 h-9 rounded-[9px] text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${manualTxType === 'EGRESO' ? 'bg-white text-rose-700 shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-rose-200' : 'text-slate-500 hover:text-slate-700'}`}>
                    <span className="text-base leading-none">−</span> Retiro / Gasto
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">Monto (CLP) *</label>
                <input type="number" value={manualTxAmount} onChange={(e) => setManualTxAmount(e.target.value)} placeholder="Ej. 15000" className="w-full h-10 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] font-mono text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-0 tabular-nums text-xl font-bold" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">Concepto / Justificación (&gt;10 caracteres) *</label>
                <input type="text" value={manualTxDesc} onChange={(e) => setManualTxDesc(e.target.value)} placeholder="Ej. Pago a proveedor de bobinas térmicas..." className="w-full h-10 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] font-mono text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-0" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">Autoriza</label>
                  <select value={manualTxAuth} onChange={(e) => setManualTxAuth(e.target.value)} className="w-full h-10 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] font-mono text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-0">
                    <option value="Operador: Juan P.">Operador: Juan P.</option>
                    <option value="Supervisor: A. Soto">Supervisor: A. Soto</option>
                    <option value="Admin: B. Abarca">Admin: B. Abarca</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">PIN Autorizador *</label>
                  <input type="password" maxLength={4} value={manualTxPin} onChange={(e) => setManualTxPin(e.target.value)} placeholder="••••" className="w-full h-10 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] font-mono text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-0 text-center text-lg tracking-[0.2em]" />
                </div>
              </div>
              <div className="pt-1 border-t border-[#f1f5f9] space-y-2">
                <button onClick={confirmManualTransaction} className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5">Confirmar Movimiento en Caja</button>
                <button onClick={closeManualTransactionModal} className="text-[12px] font-semibold text-slate-400 hover:text-slate-700 text-center py-2 w-full transition-colors">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pinModalType && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#e8ecf0] shadow-[0_16px_48px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.06)] w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${pinModalType === 'DISCOUNT' ? 'bg-emerald-500' : 'bg-rose-600'}`} />
                <span className="text-[13px] font-bold uppercase tracking-[0.07em] font-mono text-slate-700 truncate">
                  {pinModalType === 'DISCOUNT' ? 'Autorización Descuento Comercial [F6]' : 'Recargo por Ticket Extraviado [F7]'}
                </span>
              </div>
              <button onClick={closePinModal} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors text-base font-bold ml-3 flex-shrink-0">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div className={`pl-4 pr-3 py-3 rounded-xl border text-[12px] leading-relaxed ${pinModalType === 'DISCOUNT' ? 'border-l-4 border-l-emerald-500 border border-emerald-100 bg-emerald-50 text-emerald-900' : 'border-l-4 border-l-rose-600 border border-rose-100 bg-rose-50 text-rose-900'}`}>
                {pinModalType === 'DISCOUNT' ? 'Regla Antifraude (Verde): Exige PIN individual de Operador (ej. 1234) y justificación escrita obligatoria mayor a 10 caracteres.' : 'Regla Antifraude (Rojo): Exige PIN de Administrador (ej. 9988). Aplica multa reglamentaria de $8.000 CLP por extravío de ticket.'}
              </div>
              {pinModalType === 'DISCOUNT' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">Monto de Descuento (CLP)</label>
                  <input type="number" value={discountAmountInput} onChange={(e) => setDiscountAmountInput(e.target.value)} className="w-full h-10 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] font-mono text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-0 tabular-nums" />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">{pinModalType === 'DISCOUNT' ? 'PIN de Operador (4 dígitos) *' : 'PIN de Administrador (4 dígitos) *'}</label>
                <input type="password" maxLength={4} value={pinValue} onChange={(e) => setPinValue(e.target.value)} placeholder="••••" className={`w-full h-14 px-3 rounded-[10px] border-[1.5px] bg-[#f8fafc] font-mono text-slate-900 focus:outline-none focus:ring-0 text-2xl tracking-[0.3em] text-center transition-colors ${pinModalType === 'DISCOUNT' ? 'border-emerald-300 focus:border-emerald-600' : 'border-rose-300 focus:border-rose-600'}`} />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">Justificación Obligatoria (&gt;10 caracteres) *</label>
                <input type="text" value={pinReason} onChange={(e) => setPinReason(e.target.value)} placeholder="Ej. Convenio comercial autorizado por gerencia..." className="w-full h-10 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] font-mono text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-0" />
              </div>
              <div className="pt-1 flex gap-3">
                <button onClick={closePinModal} className="flex-1 h-11 rounded-xl border border-[#dde2e8] text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                <button onClick={confirmPinException} className={`flex-1 h-11 rounded-xl text-white text-xs font-bold shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 ${pinModalType === 'DISCOUNT' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}>
                  {pinModalType === 'DISCOUNT' ? 'Aplicar Descuento (Verde)' : 'Aplicar Multa $8.000 (Rojo)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
