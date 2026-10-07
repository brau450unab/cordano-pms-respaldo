import React, { useState } from 'react';

interface ArqueoCiegoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFloat: number;
  shiftRevenue: number;
  onConfirmClose: () => void;
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

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [declareCash, setDeclareCash] = useState('');
  const [declarePos, setDeclarePos] = useState('');
  const [declareTransfer, setDeclareTransfer] = useState('');
  const [shiftSealHash] = useState('SHA256-9F8E2A4B1C7D0E3F');

  const sysCashExpected = initialFloat + Math.round(shiftRevenue * 0.6);
  const sysPosExpected = Math.round(shiftRevenue * 0.3);
  const sysTransExpected = Math.round(shiftRevenue * 0.1);

  const decCashNum = parseInt(declareCash) || 0;
  const decPosNum = parseInt(declarePos) || 0;
  const decTransNum = parseInt(declareTransfer) || 0;

  const totalSys = sysCashExpected + sysPosExpected + sysTransExpected;
  const totalDec = decCashNum + decPosNum + decTransNum;
  const diff = totalDec - totalSys;

  const handleStep1ToStep2 = () => {
    if (!declareCash && !declarePos && !declareTransfer) {
      onShowToast('Ingrese los montos recontados para continuar.', 'error');
      return;
    }
    setStep(2);
  };

  const handleEmitReportZ = () => {
    onShowToast('Reporte Z emitido en impresora térmica con sello SHA-256.', 'success');
    setStep(3);
  };

  const handleFinalize = () => {
    onConfirmClose();
    onClose();
  };

  return (
    <div
      id="modal-close-shift"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in-up"
    >
      <div className="bg-white rounded-2xl border border-[#e8ecf0] shadow-floating w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 live-pulse shrink-0" />
            <span className="text-[13px] font-bold uppercase tracking-[0.07em] font-mono text-slate-700 truncate">
              {step === 3 ? 'Cierre de Caja Exitoso' : 'Arqueo de Caja Ciega y Fin de Turno'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {step !== 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">
                PASO {step}&nbsp;/&nbsp;3
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors text-base font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* STEP 1: Declare amounts */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Ingrese los montos físicos y comprobantes contabilizados en su garita para realizar la cuadratura ciega (el monto esperado por sistema permanece oculto).
            </p>

            <div className="space-y-4 font-mono tabular-nums">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">
                  Total Efectivo Físico Recontado (Incluye ${initialFloat.toLocaleString('es-CL')} Fondo)
                </label>
                <input
                  type="number"
                  value={declareCash}
                  onChange={(e) => setDeclareCash(e.target.value)}
                  placeholder={`Ej. ${(sysCashExpected).toString()}`}
                  className="w-full h-10 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] font-mono text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">
                  Total Vouchers Tarjetas (POS Transbank)
                </label>
                <input
                  type="number"
                  value={declarePos}
                  onChange={(e) => setDeclarePos(e.target.value)}
                  placeholder={`Ej. ${(sysPosExpected).toString()}`}
                  className="w-full h-10 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] font-mono text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">
                  Total Transferencias Verificadas
                </label>
                <input
                  type="number"
                  value={declareTransfer}
                  onChange={(e) => setDeclareTransfer(e.target.value)}
                  placeholder={`Ej. ${(sysTransExpected).toString()}`}
                  className="w-full h-10 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] font-mono text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleStep1ToStep2}
                className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                Verificar Cuadratura de Turno
              </button>
              <button
                onClick={onClose}
                className="text-[12px] font-semibold text-slate-400 hover:text-slate-700 text-center py-2 w-full transition-colors cursor-pointer"
              >
                Cancelar y continuar operando
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Reconciliation revealed */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Conciliación revelada (<span className="font-mono">Efectivo Sistema</span> vs <span className="font-mono">Recontado Físico</span>). Al confirmar, se sellará con firma <span className="font-mono font-bold">SHA-256</span> y se emitirá el Reporte Z.
            </p>

            {/* Reconciliation table */}
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

              {/* Difference row */}
              <div
                className={`flex items-center justify-between px-4 py-3 border-t-2 font-mono tabular-nums ${
                  diff === 0
                    ? 'border-emerald-200 bg-emerald-50'
                    : diff > 0
                    ? 'border-sky-200 bg-sky-50'
                    : 'border-rose-200 bg-rose-50'
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-600">
                  Diferencia / Cuadre
                </span>
                <span
                  className={`font-black text-base ${
                    diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-sky-600' : 'text-rose-600'
                  }`}
                >
                  {diff === 0
                    ? 'CUADRADO ($0)'
                    : diff > 0
                    ? `SOBRANTE (+$${diff.toLocaleString('es-CL')})`
                    : `FALTANTE (-$${Math.abs(diff).toLocaleString('es-CL')})`}
                </span>
              </div>
            </div>

            {/* SHA-256 hash */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400 mb-1">
                Firma Criptográfica SHA-256
              </div>
              <div className="text-[10px] font-mono text-slate-600 bg-slate-50 px-2 py-1.5 rounded border border-[#e8ecf0] truncate">
                {shiftSealHash}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleEmitReportZ}
                className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                Emitir Reporte Z y Cerrar Caja
              </button>
              <button
                onClick={() => setStep(1)}
                className="text-[12px] font-semibold text-slate-400 hover:text-slate-700 text-center py-2 w-full transition-colors cursor-pointer"
              >
                Volver a corregir montos
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === 3 && (
          <div className="p-6 space-y-5 text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Turno Finalizado</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                El <strong>Reporte Z #1042</strong> ha sido generado e impreso en 80mm con sello{' '}
                <span className="font-mono font-bold text-slate-800">{shiftSealHash}</span>.
              </p>
            </div>
            <button
              onClick={handleFinalize}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer mt-2"
            >
              Cerrar Sesión del Sistema
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
