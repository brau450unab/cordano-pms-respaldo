import React, { useState } from 'react';
import { useParking } from '../../context/ParkingContext';
import { generateShiftOpenReportPDF } from '../../utils/pdfGenerator';
import { ChileanCashBreakdown } from '../../types';

interface ModalAperturaTurnoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (initialCash: number) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface ChecklistItemState {
  id: string;
  title: string;
  desc: string;
  checked: boolean;
  mandatory: boolean;
}

export const ModalAperturaTurno: React.FC<ModalAperturaTurnoProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const { user, openNewShift, logout } = useParking();

  // Step 1: Cash float & denominations | Step 2: Quality checklist | Step 3: Confirmation
  const [step, setStep] = useState<1 | 2>(1);

  // Cash Float State
  const [initialCashInput, setInitialCashInput] = useState<string>('50000');
  const [showDenominations, setShowDenominations] = useState<boolean>(false);
  const [downloadPdfActa, setDownloadPdfActa] = useState<boolean>(true);

  // Chilean Denominations Breakdown
  const [billetes20k, setBilletes20k] = useState<number>(1);
  const [billetes10k, setBilletes10k] = useState<number>(2);
  const [billetes5k, setBilletes5k] = useState<number>(1);
  const [billetes2k, setBilletes2k] = useState<number>(2);
  const [billetes1k, setBilletes1k] = useState<number>(1);
  const [monedas500, setMonedas500] = useState<number>(0);
  const [monedas100, setMonedas100] = useState<number>(0);

  // Calculate sum from denominations if enabled
  const denominationsTotal =
    billetes20k * 20000 +
    billetes10k * 10000 +
    billetes5k * 5000 +
    billetes2k * 2000 +
    billetes1k * 1000 +
    monedas500 * 500 +
    monedas100 * 100;

  // Checklist Items (Mandatory operational checks) - Inician todos desmarcados según indicación
  const [checklist, setChecklist] = useState<ChecklistItemState[]>([
    {
      id: 'chk-paper',
      title: 'Impresora Térmica 80mm',
      desc: 'Bobina de papel térmico cargada y prueba de corte realizada.',
      checked: false,
      mandatory: true,
    },
    {
      id: 'chk-barrier',
      title: 'Barrera de Entrada & Semáforo',
      desc: 'Brazo de acceso vehicular operativo y sensores limpios.',
      checked: false,
      mandatory: true,
    },
    {
      id: 'chk-pos',
      title: 'Terminal POS Transbank',
      desc: 'Terminal encendido, con señal y batería/fuente conectada.',
      checked: false,
      mandatory: true,
    },
    {
      id: 'chk-cash',
      title: 'Conteo Físico en Gaveta',
      desc: 'Sencillo verificado físicamente contra el monto declarado.',
      checked: false,
      mandatory: true,
    },
    {
      id: 'chk-cctv',
      title: 'Cámaras & Luminarias Serrano 447',
      desc: 'Monitoreo de patio y zona techada con visibilidad óptima.',
      checked: false,
      mandatory: false,
    },
  ]);

  if (!isOpen) return null;

  const initialCashNum = showDenominations
    ? denominationsTotal
    : parseInt(initialCashInput) || 0;

  const checkedCount = checklist.filter((item) => item.checked).length;
  const mandatoryCount = checklist.filter((item) => item.mandatory).length;
  const mandatoryChecked = checklist.filter((item) => item.mandatory && item.checked).length;
  const allMandatoryChecked = mandatoryChecked === mandatoryCount;

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c))
    );
  };

  const markAllChecklist = (checked: boolean) => {
    setChecklist((prev) => prev.map((c) => ({ ...c, checked })));
  };

  const handleNextToStep2 = () => {
    if (initialCashNum <= 0) {
      onShowToast('El fondo de apertura en caja debe ser mayor a $0 CLP.', 'error');
      return;
    }
    setStep(2);
  };

  const handleConfirmShiftStart = () => {
    if (!allMandatoryChecked) {
      onShowToast('Debe marcar todas las verificaciones obligatorias de garita.', 'error');
      return;
    }

    const breakdown: ChileanCashBreakdown | undefined = showDenominations
      ? {
          coins50: 0,
          coins100: monedas100,
          coins500: monedas500,
          bills1000: billetes1k,
          bills2000: billetes2k,
          bills5000: billetes5k,
          bills10000: billetes10k,
          bills20000: billetes20k,
        }
      : undefined;

    // Execute shift opening in context
    openNewShift(initialCashNum, breakdown);

    // Generate and download printable open report if requested
    if (downloadPdfActa) {
      try {
        generateShiftOpenReportPDF({
          id: `TURNO-${Date.now().toString().slice(-6)}`,
          operatorName: user.name,
          startTime: new Date().toISOString(),
          initialCash: initialCashNum,
          status: 'abierto',
          totalTicketsProcessed: 0,
        } as any);
      } catch (err) {
        console.warn('Error al emitir PDF de apertura:', err);
      }
    }

    onShowToast(`¡Turno iniciado con éxito! Fondo de apertura: $${initialCashNum.toLocaleString('es-CL')} CLP. POS desbloqueado.`, 'success');
    onSuccess(initialCashNum);
    onClose();
  };

  return (
    <div
      id="modal-apertura-turno"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in-up font-sans"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header Corporativo */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#1E1E2F] text-white flex items-center justify-between border-b border-[#2D2D44]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E2498A] flex items-center justify-center text-lg font-black text-white shadow-sm">
              🚀
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2498A]">
                CONTROL DE ACCESO & GAVETA · SERRANO 447
              </span>
              <h3 className="text-lg font-black tracking-tight text-white leading-none mt-0.5">
                Apertura Oficial de Turno
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              PASO {step} DE 2
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* ── PASO 1: FONDO DE CAJA INICIAL ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">💵</span>
                  <h4 className="font-extrabold text-sm text-[#1E1E2F]">
                    Declaración de Fondo Inicial en Gaveta (Sencillo)
                  </h4>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Ingrese el monto de dinero físico que recibe en la caja de garita para dar cambio. Este saldo inicial no se suma a las ventas del día y se descontará en el arqueo de cierre.
                </p>
              </div>

              {/* Input Principal de Fondo Simplificado con Separador de Miles */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                  Monto Fondo de Caja ($ CLP) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400 font-mono">
                    $
                  </span>
                  <input
                    type="text"
                    value={
                      initialCashInput === ''
                        ? ''
                        : parseInt(initialCashInput.replace(/\D/g, '') || '0').toLocaleString('es-CL')
                    }
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setInitialCashInput(raw);
                    }}
                    placeholder="50.000"
                    className="w-full h-14 pl-10 pr-16 rounded-2xl border-2 border-slate-300 bg-white font-mono font-black text-2xl sm:text-3xl text-slate-900 tabular-nums focus:border-[#E2498A] focus:outline-none shadow-sm transition"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 font-mono">
                    CLP
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                  Digita el monto recibido para apertura de caja con separador de miles automático (predeterminado: $50.000).
                </p>
              </div>

              {/* Resumen del Cajero Activo con Opción de Cambiar Usuario */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Operador Responsable en Turno
                  </span>
                  <span className="font-extrabold text-sm text-[#1E1E2F] flex items-center gap-1.5 mt-0.5">
                    <span>👤</span>
                    <span>{user.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {user.role}
                    </span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                    onShowToast('Sesión finalizada. Inicia con tu usuario para abrir turno.', 'info');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Cerrar sesión actual e iniciar con otro operador"
                >
                  <span>🔄</span>
                  <span>Cambiar Usuario</span>
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 2: CHECKLIST OBLIGATORIO DE APERTURA ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-[#1E1E2F] flex items-center gap-1.5">
                    <span>📋</span> Checklist de Calidad & Operación Garita
                  </h4>
                  <span className="font-mono font-bold text-[11px] text-[#E2498A]">
                    {checkedCount}/{checklist.length} Verificados
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Verifique las condiciones físicas antes de iniciar la recepción de vehículos en Serrano 447.
                </p>
              </div>

              {/* Lista interactiva de tareas */}
              <div className="space-y-2">
                {checklist.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      item.checked
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleChecklist(item.id)}
                      className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer accent-emerald-600 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800 text-xs">{item.title}</span>
                        {item.mandatory && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                            REQUERIDO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => markAllChecklist(true)}
                  className="text-xs font-bold text-[#E2498A] hover:underline cursor-pointer"
                >
                  ✓ Marcar todas como revisadas
                </button>
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={downloadPdfActa}
                    onChange={(e) => setDownloadPdfActa(e.target.checked)}
                    className="accent-[#E2498A]"
                  />
                  <span className="text-[11px] font-semibold">Descargar Acta A4 de Recepción</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {step === 2 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                ← Volver al Fondo
              </button>
              <button
                type="button"
                onClick={() => {
                  markAllChecklist(true);
                  onShowToast('Checklist pospuesto: Se recordará revisión en 1 hora.', 'info');
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                title="Pospone la revisión del checklist para dentro de 1 hora"
              >
                <span>⏰</span>
                <span>Recordar en 1 hora</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={handleNextToStep2}
              className="px-6 py-2.5 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>Continuar a Checklist</span>
              <span>→</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={!allMandatoryChecked}
              onClick={handleConfirmShiftStart}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-2 ${
                allMandatoryChecked
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>🚀</span>
              <span>Iniciar Turno &amp; Desbloquear POS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
