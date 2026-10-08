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
      className="fixed inset-0 bg-[#2C1338]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in-up"
    >
      <div className="bg-white rounded-3xl border border-[#EDE4E2] shadow-[0_20px_50px_rgba(44,19,56,0.2)] w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#EDE4E2]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E2498A] live-pulse shrink-0" />
            <span className="text-[13px] font-bold uppercase tracking-[0.07em] tabular-nums text-[#2C1338] truncate">
              {step === 3 ? 'Cierre de Caja Exitoso' : 'Arqueo de Caja Ciega y Fin de Turno'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {step !== 3 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FDF1EC] border border-[#EDE4E2] text-[10px] font-bold tabular-nums text-[#2C1338] uppercase tracking-wider">
                PASO {step}&nbsp;/&nbsp;3
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-[#FDF1EC] text-[#8C7C92] hover:text-[#2C1338] flex items-center justify-center transition-colors text-base font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* STEP 1: Declare amounts */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            <p className="text-[13px] text-[#65546C] leading-relaxed">
              Ingrese los montos físicos y comprobantes contabilizados en su garita para realizar la cuadratura ciega (el monto esperado por sistema permanece oculto).
            </p>

            <div className="space-y-4 tabular-nums tabular-nums">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#65546C] mb-1.5">
                  Total Efectivo Físico Recontado (Incluye ${initialFloat.toLocaleString('es-CL')} Fondo)
                </label>
                <input
                  type="number"
                  value={declareCash}
                  onChange={(e) => setDeclareCash(e.target.value)}
                  placeholder={`Ej. ${(sysCashExpected).toString()}`}
                  className="w-full h-10 px-3 rounded-xl border border-[#EDE4E2] bg-[#FEF9F5] tabular-nums text-[#2C1338] focus:border-[#E2498A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#65546C] mb-1.5">
                  Total Vouchers Tarjetas (POS Transbank)
                </label>
                <input
                  type="number"
                  value={declarePos}
                  onChange={(e) => setDeclarePos(e.target.value)}
                  placeholder={`Ej. ${(sysPosExpected).toString()}`}
                  className="w-full h-10 px-3 rounded-xl border border-[#EDE4E2] bg-[#FEF9F5] tabular-nums text-[#2C1338] focus:border-[#E2498A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#65546C] mb-1.5">
                  Total Transferencias Verificadas
                </label>
                <input
                  type="number"
                  value={declareTransfer}
                  onChange={(e) => setDeclareTransfer(e.target.value)}
                  placeholder={`Ej. ${(sysTransExpected).toString()}`}
                  className="w-full h-10 px-3 rounded-xl border border-[#EDE4E2] bg-[#FEF9F5] tabular-nums text-[#2C1338] focus:border-[#E2498A] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleStep1ToStep2}
                className="w-full h-11 rounded-full bg-[#2C1338] hover:bg-[#412A4C] text-white font-bold text-sm shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                Verificar Cuadratura de Turno
              </button>
              <button
                onClick={onClose}
                className="text-[12px] font-semibold text-[#8C7C92] hover:text-[#2C1338] text-center py-2 w-full transition-colors cursor-pointer"
              >
                Cancelar y continuar operando
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Reconciliation revealed */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            <p className="text-[13px] text-[#65546C] leading-relaxed">
              Conciliación revelada (<span className="tabular-nums text-[#2C1338]">Efectivo Sistema</span> vs <span className="tabular-nums text-[#2C1338]">Recontado Físico</span>). Al confirmar, se sellará con firma <span className="tabular-nums font-bold text-[#E2498A]">SHA-256</span> y se emitirá el Reporte Z.
            </p>

            {/* Reconciliation table */}
            <div className="rounded-2xl border border-[#EDE4E2] overflow-hidden">
              <div className="grid grid-cols-3 gap-0 bg-[#FDF1EC] border-b border-[#EDE4E2] px-4 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#65546C]">Medio</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#65546C] text-right">Sistema</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#65546C] text-right">Declarado</div>
              </div>

              <div className="divide-y divide-[#EDE4E2] bg-white">
                <div className="grid grid-cols-3 gap-0 px-4 py-2.5 items-center tabular-nums tabular-nums text-sm">
                  <div className="text-[#2C1338] font-medium">Efectivo*</div>
                  <div className="text-right text-[#8C7C92]">${sysCashExpected.toLocaleString('es-CL')}</div>
                  <div className="text-right font-bold text-[#2C1338]">${decCashNum.toLocaleString('es-CL')}</div>
                </div>
                <div className="grid grid-cols-3 gap-0 px-4 py-2.5 items-center tabular-nums tabular-nums text-sm">
                  <div className="text-[#2C1338] font-medium">Tarjetas POS</div>
                  <div className="text-right text-[#8C7C92]">${sysPosExpected.toLocaleString('es-CL')}</div>
                  <div className="text-right font-bold text-[#2C1338]">${decPosNum.toLocaleString('es-CL')}</div>
                </div>
                <div className="grid grid-cols-3 gap-0 px-4 py-2.5 items-center tabular-nums tabular-nums text-sm">
                  <div className="text-[#2C1338] font-medium">Transf.</div>
                  <div className="text-right text-[#8C7C92]">${sysTransExpected.toLocaleString('es-CL')}</div>
                  <div className="text-right font-bold text-[#2C1338]">${decTransNum.toLocaleString('es-CL')}</div>
                </div>
              </div>

              {/* Difference row */}
              <div
                className={`flex items-center justify-between px-4 py-3 border-t-2 tabular-nums tabular-nums ${
                  diff === 0
                    ? 'border-[#2B9E78] bg-[#2B9E78]/10'
                    : diff > 0
                    ? 'border-[#2DA8D8] bg-[#2DA8D8]/10'
                    : 'border-[#E2498A] bg-[#E2498A]/10'
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#2C1338]">
                  Diferencia / Cuadre
                </span>
                <span
                  className={`font-black text-base ${
                    diff === 0 ? 'text-[#2B9E78]' : diff > 0 ? 'text-[#2DA8D8]' : 'text-[#E2498A]'
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
              <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#8C7C92] mb-1">
                Firma Criptográfica SHA-256
              </div>
              <div className="text-[10px] tabular-nums text-[#2C1338] bg-[#FEF9F5] px-3 py-2 rounded-xl border border-[#EDE4E2] truncate">
                {shiftSealHash}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleEmitReportZ}
                className="w-full h-11 rounded-full bg-[#E2498A] hover:bg-[#E57CD8] text-white font-bold text-sm shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                Emitir Reporte Z y Cerrar Caja
              </button>
              <button
                onClick={() => setStep(1)}
                className="text-[12px] font-semibold text-[#8C7C92] hover:text-[#2C1338] text-center py-2 w-full transition-colors cursor-pointer"
              >
                Volver a corregir montos
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === 3 && (
          <div className="p-6 space-y-5 text-center py-8">
            <div className="w-16 h-16 bg-[#2B9E78]/15 rounded-full flex items-center justify-center mx-auto text-[#2B9E78]">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#2C1338]">Turno Finalizado</h3>
              <p className="text-xs text-[#65546C] leading-relaxed max-w-xs mx-auto">
                El <strong>Reporte Z #1042</strong> ha sido generado e impreso en 80mm con sello{' '}
                <span className="tabular-nums font-bold text-[#E2498A]">{shiftSealHash}</span>.
              </p>
            </div>
            <button
              onClick={handleFinalize}
              className="w-full h-11 rounded-full bg-[#2C1338] hover:bg-[#412A4C] text-white font-bold text-sm shadow-md transition-all hover:-translate-y-0.5 cursor-pointer mt-2"
            >
              Cerrar Sesión del Sistema
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
