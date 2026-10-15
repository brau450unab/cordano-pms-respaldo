import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParking } from '../context/ParkingContext';
import { Shift, ChileanCashBreakdown, Ticket, PaymentMethod } from '../types';
import { generateShiftReportPDF, generateShiftOpenReportPDF } from '../utils/pdfGenerator';
import { ModalAperturaTurno } from '../components/pms/ModalAperturaTurno';
import { ModalMovimientoCaja } from '../components/ModalMovimientoCaja';
import { ModalInstruccionesCierreCiego } from '../components/ModalInstruccionesCierreCiego';
import { ReporteFinancieroTurnoModal } from '../components/ReporteFinancieroTurnoModal';
import {
  Lock,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Printer,
  RotateCcw,
  Banknote,
  CreditCard,
  Send,
  ShieldAlert,
  KeyRound,
  Coins,
  ArrowUpRight,
  Car,
  FileCheck,
  HelpCircle,
  Share2,
  Check,
  Layers,
  FileSignature,
  ShieldCheck,
  Receipt,
  ArrowRight,
  ArrowLeft,
  Clock,
  Sparkles,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export const CierreCajaCiego: React.FC = () => {
  const {
    user,
    currentShift,
    tickets,
    cashToleranceClp,
    performBlindClose,
    registerCashMovement,
    signShiftCopy,
    resolvePendingApproval,
    calculateFee,
    processPayment,
  } = useParking();

  // ── ESTADO DEL STEPPER (1 A 5) ──
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Estado Aprobaciones Diferidas
  const [adminPinExpress, setAdminPinExpress] = useState<string>('');
  const [expressError, setExpressError] = useState<string>('');

  // Modales adicionales auxiliares
  const [isAperturaModalOpen, setIsAperturaModalOpen] = useState(false);
  const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);
  const [isInstruccionesOpen, setIsInstruccionesOpen] = useState(false);
  const [isReporteModalOpen, setIsReporteModalOpen] = useState(false);

  // Formulario de Arqueo Ciego
  const [cashInputMode, setCashInputMode] = useState<'total' | 'denominaciones'>('denominaciones');
  const [declaredCash, setDeclaredCash] = useState<string>('');
  const [declaredCard, setDeclaredCard] = useState<string>('');
  const [declaredTransfer, setDeclaredTransfer] = useState<string>('');
  const [handoverFundAmount, setHandoverFundAmount] = useState<string>('50000');
  const [justification, setJustification] = useState<string>('');

  // Estado integrado de control de vehículos en patio (Paso 2)
  const [vehicleDecisions, setVehicleDecisions] = useState<
    Record<string, { action: 'traspasar' | 'cobrar'; paymentMethod?: PaymentMethod }>
  >({});
  const [hasCompletedVehicleReview, setHasCompletedVehicleReview] = useState<boolean>(false);

  // Supervisor PIN modal / WhatsApp notification option
  const [supervisorPin, setSupervisorPin] = useState<string>('');
  const [showPinRequirementModal, setShowPinRequirementModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Resultado de cierre & pestañas del reporte (Paso 5)
  const [closedShiftResult, setClosedShiftResult] = useState<Shift | null>(null);
  const [reportActiveTab, setReportActiveTab] = useState<'resumen' | 'conteo' | 'movimientos' | 'vehiculos' | 'firmas'>('resumen');
  const [selectedSignatureCopy, setSelectedSignatureCopy] = useState<'copia1_caja' | 'copia2_operador'>('copia1_caja');

  // Calculadora Chilena Integrada
  const [breakdown, setBreakdown] = useState<ChileanCashBreakdown>({
    coins50: 0,
    coins100: 0,
    coins500: 0,
    bills1000: 0,
    bills2000: 0,
    bills5000: 0,
    bills10000: 0,
    bills20000: 0,
  });

  const handleUpdateBreakdown = (field: keyof ChileanCashBreakdown, count: number) => {
    const nextBreakdown = {
      ...breakdown,
      [field]: Math.max(0, count),
    };
    setBreakdown(nextBreakdown);

    // Auto-sum to declared cash
    const totalCoins =
      nextBreakdown.coins50 * 50 +
      nextBreakdown.coins100 * 100 +
      nextBreakdown.coins500 * 500;

    const totalBills =
      nextBreakdown.bills1000 * 1000 +
      nextBreakdown.bills2000 * 2000 +
      nextBreakdown.bills5000 * 5000 +
      nextBreakdown.bills10000 * 10000 +
      nextBreakdown.bills20000 * 20000;

    setDeclaredCash((totalCoins + totalBills).toString());
  };

  // Cálculo de vehículos activos en el recinto
  const activeTicketsInParking = tickets.filter((t) => t.status === 'activo');
  const hasActiveVehicles = activeTicketsInParking.length > 0;

  // Cálculos de tickets electrónicos del turno
  const electronicTickets = tickets.filter(
    (t) => t.status === 'pagado' && t.paymentMethod !== 'efectivo'
  );
  const posTickets = electronicTickets.filter(
    (t) => t.paymentMethod === 'tarjeta_debito' || t.paymentMethod === 'tarjeta_credito'
  );
  const transferTickets = electronicTickets.filter(
    (t) => t.paymentMethod === 'transferencia'
  );

  const totalPosSystemAmount = posTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const totalTransferSystemAmount = transferTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  const isShiftClosed = currentShift.status === 'cerrado' || closedShiftResult !== null;
  const activeShift = closedShiftResult || currentShift;

  const currentCashInDrawer =
    currentShift.initialCash +
    tickets
      .filter((t) => t.status === 'pagado' && t.paymentMethod === 'efectivo')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0) +
    (currentShift.cashMovements?.reduce((sum, m) => {
      if (m.type === 'INGRESO_MANUAL') return sum + m.amount;
      if (m.type === 'GASTO_MENOR' || m.type === 'RETIRO_SANGRIA') return sum - m.amount;
      return sum;
    }, 0) || 0);

  const totalDeclared =
    (activeShift.declaredCash || 0) +
    (activeShift.declaredCard || 0) +
    (activeShift.declaredTransfer || 0);

  const totalExpected =
    (activeShift.expectedCash || 0) +
    (activeShift.expectedCard || 0) +
    (activeShift.expectedTransfer || 0);

  const discrepancyCash = (activeShift.declaredCash || 0) - (activeShift.expectedCash || 0);
  const discrepancyTotal = totalDeclared - totalExpected;
  const isFlagged = activeShift.isDiscrepancyFlagged || Math.abs(discrepancyCash) > cashToleranceClp;
  const isPerfect = discrepancyTotal === 0;

  const pendingApprovals = currentShift.pendingApprovals?.filter(a => a.status === 'pending') || [];
  const hasPendingApprovals = pendingApprovals.length > 0 && !isShiftClosed;

  // Resolución de aprobaciones diferidas con PIN de Administrador
  const handleResolvePending = (id: string, status: 'approved' | 'rejected') => {
    if (adminPinExpress.trim() !== '9988') {
      setExpressError('PIN de Administrador incorrecto (ej: 9988).');
      return;
    }
    setExpressError('');
    resolvePendingApproval(id, status);
  };

  // Traspasar todos los vehículos en 1 clic
  const handleTransferAllVehicles = () => {
    const newDecisions: Record<string, { action: 'traspasar' }> = {};
    activeTicketsInParking.forEach((t) => {
      newDecisions[t.id] = { action: 'traspasar' };
    });
    setVehicleDecisions(newDecisions);
    setHasCompletedVehicleReview(true);
  };

  // Traspasar o Cobrar individual
  const handleToggleVehicleDecision = (ticket: Ticket, action: 'traspasar' | 'cobrar') => {
    if (action === 'cobrar') {
      const fee = calculateFee(ticket, new Date());
      try {
        processPayment({
          ticketId: ticket.id,
          paymentMethod: 'efectivo',
          paidAmount: fee.totalAmount,
        });
      } catch (e) {
        console.error('Error cobrando salida de vehículo en cierre:', e);
      }
    }

    setVehicleDecisions((prev) => ({
      ...prev,
      [ticket.id]: { action, paymentMethod: action === 'cobrar' ? 'efectivo' : undefined },
    }));
  };

  // Autocompletar vouchers con montos del sistema
  const handleAutofillVouchers = () => {
    setDeclaredCard(totalPosSystemAmount.toString());
    setDeclaredTransfer(totalTransferSystemAmount.toString());
  };

  // Ejecución definitiva del cierre de caja
  const executeShiftClose = (supervisorPinArg?: string) => {
    const cashVal = parseInt(declaredCash) || 0;
    const cardVal = parseInt(declaredCard) || 0;
    const transferVal = parseInt(declaredTransfer) || 0;

    const result = performBlindClose(
      cashVal,
      cardVal,
      transferVal,
      justification,
      cashInputMode === 'denominaciones' ? breakdown : undefined,
      supervisorPinArg,
      undefined,
      undefined,
      parseInt(handoverFundAmount) || 0
    );

    setClosedShiftResult(result);
    setShowPinRequirementModal(false);
    setCurrentStep(5);

    try {
      generateShiftReportPDF(result, true);
    } catch (err) {
      console.error('Error al generar PDF de cierre automático:', err);
    }
  };

  // Validar y procesar cierre desde Paso 4 / Paso 5
  const handlePerformCloseValidation = () => {
    setErrorMessage('');

    if (declaredCash === '' || declaredCard === '' || declaredTransfer === '') {
      setErrorMessage('Debe ingresar un monto válido (o $0) en cada medio de pago antes de cerrar.');
      return;
    }

    if (hasActiveVehicles && !hasCompletedVehicleReview) {
      const allAssigned = activeTicketsInParking.every((t) => vehicleDecisions[t.id]);
      if (!allAssigned) {
        setErrorMessage('Debe revisar y confirmar la custodia de los vehículos activos en el recinto.');
        setCurrentStep(2);
        return;
      }
    }

    // Calcular si la discrepancia estimada en efectivo superará la tolerancia
    const cashVal = parseInt(declaredCash) || 0;
    const estimatedDiscrepancy = Math.abs(cashVal - currentShift.expectedCash);

    if (estimatedDiscrepancy > cashToleranceClp) {
      setShowPinRequirementModal(true);
      return;
    }

    executeShiftClose();
  };

  const handleConfirmWithPin = () => {
    if (!supervisorPin || supervisorPin.trim().length !== 4) {
      setErrorMessage('Debe ingresar un PIN de 4 dígitos válido (ej: 1234 o 2026).');
      return;
    }
    if (!justification.trim()) {
      setErrorMessage('La justificación del descuadre es obligatoria para el arqueo.');
      return;
    }

    executeShiftClose(supervisorPin);
  };

  const handleConfirmWithWhatsAppNotification = () => {
    if (!justification.trim()) {
      setErrorMessage('La justificación del descuadre es obligatoria para la notificación.');
      return;
    }

    executeShiftClose();
  };

  // Navegación fluida del Stepper
  const markStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  const goToNextStep = () => {
    setErrorMessage('');
    if (currentStep === 1) {
      if (hasPendingApprovals) {
        setErrorMessage('Debe resolver las aprobaciones diferidas con el PIN de administrador antes de avanzar.');
        return;
      }
      markStepComplete(1);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (hasActiveVehicles) {
        const allAssigned = activeTicketsInParking.every((t) => vehicleDecisions[t.id]);
        if (!allAssigned && !hasCompletedVehicleReview) {
          setErrorMessage('Por favor confirme el traspaso de custodia de los vehículos antes de continuar.');
          return;
        }
      }
      markStepComplete(2);
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (declaredCard === '' || declaredTransfer === '') {
        setErrorMessage('Ingrese los montos de vouchers POS y transferencias (o use el botón de autocompletar).');
        return;
      }
      markStepComplete(3);
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (declaredCash === '') {
        setErrorMessage('Debe declarar el total de dinero en efectivo contado físicamente.');
        return;
      }
      markStepComplete(4);
      setCurrentStep(5);
    }
  };

  const goToPreviousStep = () => {
    setErrorMessage('');
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  // Definición de las 5 Fases del Stepper
  const STEPS_CONFIG = [
    { number: 1, title: 'Turno & Excepciones', subtitle: 'Aprobaciones y contexto' },
    { number: 2, title: 'Control de Patio', subtitle: 'Vehículos en recinto' },
    { number: 3, title: 'Vouchers & Pagos', subtitle: 'POS Transbank y Transf.' },
    { number: 4, title: 'Arqueo Ciego', subtitle: 'Efectivo, gaveta y sobre' },
    { number: 5, title: 'Certificación Z', subtitle: 'Sello SHA-256 y Acta A4' },
  ];

  const totalCashContado = parseInt(declaredCash) || 0;
  const fondoGaveta = parseInt(handoverFundAmount) || 0;
  const sobreRemesa = Math.max(0, totalCashContado - fondoGaveta);

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-[#1E1E2F] animate-fade-in-up pb-12">
      {/* ── HEADER PRINCIPAL & RESUMEN DE CONTEXTO ── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#1E1E2F] text-white flex items-center justify-center border border-slate-900 shadow-sm shrink-0">
            <Lock className="w-6 h-6 text-[#E2498A]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-black tracking-wider text-[#E2498A] uppercase bg-[#FFF5F8] border border-[#E2498A]/30 px-2.5 py-0.5 rounded-full">
                FLUJO GUIADO DE CIERRE • SERRANO 447
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                Tolerancia: ${cashToleranceClp.toLocaleString('es-CL')} CLP
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  isShiftClosed
                    ? 'bg-[#1E1E2F] text-white border-slate-900'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {isShiftClosed ? 'TURNO CERRADO' : 'TURNO ACTIVO'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1E1E2F] tracking-tight">
              Asistente de Arqueo Ciego & Cierre de Caja
            </h1>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Protocolo paso a paso para el relevo de garita, custodia vehicular y certificación criptográfica.
            </p>
          </div>
        </div>

        {/* Botones de Utilidad */}
        <div className="flex flex-wrap items-center gap-2">
          {!isShiftClosed && currentShift && (
            <button
              type="button"
              onClick={() => generateShiftOpenReportPDF(currentShift)}
              className="h-9 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 border border-emerald-200 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>Acta Apertura</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsInstruccionesOpen(true)}
            id="btn-instrucciones-cierre"
            className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Guía & SOP</span>
          </button>

          {!isShiftClosed && (
            <button
              type="button"
              onClick={() => setIsMovimientoModalOpen(true)}
              className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
              <span>Sangría / Gasto</span>
            </button>
          )}
        </div>
      </div>

      {/* ── BARRA STEPPER (INDICADOR DE PROGRESO DE 5 FASES) ── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {STEPS_CONFIG.map((step, idx) => {
            const isCurrent = currentStep === step.number && !isShiftClosed;
            const isCompleted = completedSteps.includes(step.number) || isShiftClosed;
            const isAccessible = isCompleted || step.number <= currentStep;

            return (
              <React.Fragment key={step.number}>
                <button
                  type="button"
                  disabled={!isAccessible && !isShiftClosed}
                  onClick={() => {
                    if (isAccessible || isShiftClosed) {
                      setCurrentStep(step.number as any);
                    }
                  }}
                  className={`flex-1 p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    isCurrent
                      ? 'border-[#E2498A] bg-[#FFF5F8] shadow-sm ring-2 ring-[#E2498A]/20'
                      : isCompleted
                      ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                      : 'border-slate-200 bg-slate-50/50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                      isCurrent
                        ? 'bg-[#E2498A] text-white shadow-xs'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted && !isCurrent ? <Check className="w-4 h-4 stroke-[3]" /> : step.number}
                  </div>
                  <div className="overflow-hidden">
                    <span
                      className={`block text-xs font-black truncate leading-tight ${
                        isCurrent ? 'text-[#E2498A]' : isCompleted ? 'text-emerald-900' : 'text-slate-700'
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-medium truncate mt-0.5">
                      {step.subtitle}
                    </span>
                  </div>
                </button>

                {idx < STEPS_CONFIG.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 select-none" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Mensaje de Error Global del Flujo */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2 shadow-sm"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          FASE 1: PRE-CIERRE & VALIDACIONES PREVIAS
      ─────────────────────────────────────────────────────────────── */}
      {currentStep === 1 && !isShiftClosed && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-black uppercase text-[#E2498A] tracking-wider block mb-1">
              FASE 1 DE 5 • CONTEXTO OPERATIVO
            </span>
            <h2 className="text-lg font-black text-[#1E1E2F]">
              Verificación del Turno & Aprobaciones Diferidas
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Revise las condiciones generales del turno antes de proceder al conteo físico de gaveta.
            </p>
          </div>

          {/* Tarjetas de Datos del Turno */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Cajero Activo</span>
              <span className="text-sm font-black text-[#1E1E2F] block truncate">{user.name}</span>
              <span className="text-[11px] text-slate-500 block font-mono">Rol: {user.role.toUpperCase()}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Folio de Turno</span>
              <span className="text-sm font-black text-[#1E1E2F] font-mono block">#{currentShift.id.slice(-8)}</span>
              <span className="text-[11px] text-slate-500 block">Garita Central 01</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Fondo Inicial Apertura</span>
              <span className="text-sm font-black text-emerald-600 font-mono block">
                $ {(currentShift.initialCash || 50000).toLocaleString('es-CL')} CLP
              </span>
              <span className="text-[10px] text-slate-400 block">Declarado al iniciar</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Hora de Apertura</span>
              <span className="text-sm font-black text-[#1E1E2F] font-mono block">
                {new Date(currentShift.startTime).toLocaleTimeString('es-CL')}
              </span>
              <span className="text-[10px] text-slate-400 block font-sans">Serrano 447, Iquique</span>
            </div>
          </div>

          {/* Bloque de Aprobaciones Diferidas (Express) */}
          {hasPendingApprovals ? (
            <div className="p-5 bg-[#FFF5F8] border border-[#E2498A]/40 rounded-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E2498A] text-white flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#1E1E2F]">
                    {pendingApprovals.length} Aprobación(es) Express Pendientes de Validación
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Durante las horas punta, se postergó la validación con PIN de supervisor para liberar el flujo.
                    Ingrese el PIN de Administrador (ej: <span className="font-mono font-bold">9988</span>) para autorizarlas o rechazarlas.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="w-full sm:w-auto flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">PIN Administrador:</span>
                </div>
                <input
                  type="password"
                  maxLength={4}
                  value={adminPinExpress}
                  onChange={(e) => {
                    setAdminPinExpress(e.target.value);
                    setExpressError('');
                  }}
                  placeholder="••••"
                  className="w-full sm:w-36 h-10 px-3 text-center text-lg tracking-widest font-mono font-bold rounded-xl border border-slate-300 focus:border-[#E2498A] focus:outline-none"
                />
                {expressError && (
                  <span className="text-xs text-rose-600 font-bold">{expressError}</span>
                )}
              </div>

              <div className="space-y-2">
                {pendingApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            approval.type === 'DISCOUNT'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {approval.type === 'DISCOUNT' ? 'Descuento' : 'Liberación'}
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                          Monto: ${approval.amount.toLocaleString('es-CL')} CLP
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 font-medium">{approval.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResolvePending(approval.id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                      >
                        Rechazar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolvePending(approval.id, 'approved')}
                        className="px-3.5 py-1.5 rounded-lg bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs shadow-xs transition cursor-pointer"
                      >
                        Aprobar con PIN
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-xs block">Sin excepciones ni aprobaciones pendientes</span>
                <span className="text-[11px] text-emerald-700 font-sans block">
                  Todas las operaciones de garita se encuentran validadas. Puede continuar al control de patio.
                </span>
              </div>
            </div>
          )}

          {/* Botón de Avance */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={goToNextStep}
              className="h-11 px-6 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <span>Continuar al Paso 2: Control de Patio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FASE 2: CONTROL DE PATIO & TRASPASO DE CUSTODIA
      ─────────────────────────────────────────────────────────────── */}
      {currentStep === 2 && !isShiftClosed && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <span className="text-[10px] font-black uppercase text-[#E2498A] tracking-wider block mb-1">
                FASE 2 DE 5 • RECINTO FÍSICO
              </span>
              <h2 className="text-lg font-black text-[#1E1E2F]">
                Control 1 a 1 de Vehículos en Recinto
              </h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Revise los vehículos que permanecen físicamente en las 30 plazas de Serrano 447 y defina el traspaso de custodia al siguiente turno.
              </p>
            </div>

            {hasActiveVehicles && (
              <button
                type="button"
                onClick={handleTransferAllVehicles}
                className="h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Check className="w-4 h-4" />
                <span>Traspasar Todos al Relevo</span>
              </button>
            )}
          </div>

          {!hasActiveVehicles ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-[#1E1E2F]">Patio Despejado (0 Vehículos Activos)</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No hay vehículos con estadía corriendo dentro del estacionamiento. Todas las 30 plazas se encuentran libres.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                <span>Vehículos detectados ({activeTicketsInParking.length})</span>
                <span className="text-[11px] text-slate-400">Acción requerida por vehículo</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {activeTicketsInParking.map((ticket) => {
                  const fee = calculateFee(ticket, new Date());
                  const decision = vehicleDecisions[ticket.id]?.action || 'traspasar';

                  return (
                    <div
                      key={ticket.id}
                      className="p-4 bg-white hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                          <Car className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-[#1E1E2F] tracking-wide">
                              {ticket.plateNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-[10px] text-slate-600">
                              {ticket.slotCode || 'Plaza s/n'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Ingreso: {new Date(ticket.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 font-mono block mt-0.5">
                            Tiempo: {fee.durationMinutes} min • Cobro acum: ${fee.totalAmount.toLocaleString('es-CL')} CLP
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleToggleVehicleDecision(ticket, 'traspasar')}
                          className={`h-9 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            decision === 'traspasar'
                              ? 'bg-slate-800 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Traspasar Custodia</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleVehicleDecision(ticket, 'cobrar')}
                          className={`h-9 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            decision === 'cobrar'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Cobrar Salida</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botones de Navegación */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPreviousStep}
              className="h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Fase 1</span>
            </button>

            <button
              type="button"
              onClick={goToNextStep}
              className="h-11 px-6 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <span>Continuar al Paso 3: Vouchers POS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FASE 3: CONCILIACIÓN DE VOUCHERS POS & TRANSFERENCIAS
      ─────────────────────────────────────────────────────────────── */}
      {currentStep === 3 && !isShiftClosed && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <span className="text-[10px] font-black uppercase text-[#E2498A] tracking-wider block mb-1">
                FASE 3 DE 5 • DINERO ELECTRÓNICO
              </span>
              <h2 className="text-lg font-black text-[#1E1E2F]">
                Cuadratura de Vouchers POS & Transferencias
              </h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Coteje los comprobantes físicos del terminal Transbank (cierre de lote) y las transferencias electrónicas validadas.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAutofillVouchers}
              className="h-9 px-3.5 rounded-xl bg-[#FFF5F8] border border-[#E2498A]/30 text-[#E2498A] hover:bg-[#E2498A] hover:text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Autocompletar con Registros</span>
            </button>
          </div>

          {/* Resumen del Sistema */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                  <CreditCard className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block uppercase">POS Transbank (Sistema)</span>
                  <span className="text-base font-black font-mono text-[#1E1E2F]">
                    $ {totalPosSystemAmount.toLocaleString('es-CL')} CLP
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-mono">
                {posTickets.length} vouchers
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                  <Send className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block uppercase">Transferencias (Sistema)</span>
                  <span className="text-base font-black font-mono text-[#1E1E2F]">
                    $ {totalTransferSystemAmount.toLocaleString('es-CL')} CLP
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-mono">
                {transferTickets.length} registros
              </span>
            </div>
          </div>

          {/* Formulario de Declaración de Medios Electrónicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-slate-50/50 rounded-2xl border border-slate-200">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#E2498A]" />
                <span>Total de Vouchers Físicos POS ($) *</span>
              </label>
              <input
                type="number"
                min="0"
                value={declaredCard}
                onChange={(e) => setDeclaredCard(e.target.value)}
                placeholder="0"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-[#1E1E2F] focus:border-[#E2498A] focus:outline-none shadow-xs"
              />
              <span className="text-[10px] text-slate-400 block">
                Monto impreso en el voucher del cierre de lote del terminal POS.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-[#E2498A]" />
                <span>Total Transferencias Bancarias ($) *</span>
              </label>
              <input
                type="number"
                min="0"
                value={declaredTransfer}
                onChange={(e) => setDeclaredTransfer(e.target.value)}
                placeholder="0"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-[#1E1E2F] focus:border-[#E2498A] focus:outline-none shadow-xs"
              />
              <span className="text-[10px] text-slate-400 block">
                Suma de comprobantes de transferencias recibidos y verificados.
              </span>
            </div>
          </div>

          {/* Botones de Navegación */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPreviousStep}
              className="h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Patio</span>
            </button>

            <button
              type="button"
              onClick={goToNextStep}
              className="h-11 px-6 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <span>Continuar al Paso 4: Arqueo de Efectivo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FASE 4: ARQUEO FÍSICO CIEGO & DISTRIBUCIÓN DE EFECTIVO
      ─────────────────────────────────────────────────────────────── */}
      {currentStep === 4 && !isShiftClosed && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <span className="text-[10px] font-black uppercase text-[#E2498A] tracking-wider block mb-1">
                FASE 4 DE 5 • CONTEO FÍSICO ESTRICTO
              </span>
              <h2 className="text-lg font-black text-[#1E1E2F]">
                Arqueo Ciego de Efectivo & Declaración
              </h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Protocolo sin sesgo: Ingrese el dinero en efectivo contado en gaveta física sin saldos sugeridos.
              </p>
            </div>

            {/* Selector de Modo */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setCashInputMode('denominaciones')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  cashInputMode === 'denominaciones'
                    ? 'bg-white text-[#1E1E2F] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Denominaciones CLP
              </button>
              <button
                type="button"
                onClick={() => setCashInputMode('total')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  cashInputMode === 'total'
                    ? 'bg-white text-[#1E1E2F] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Total Directo
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2.5">
            <EyeOff className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold block">Arqueo 100% Ciego por Auditoría Interna</span>
              <span className="text-[11px] text-amber-800 font-sans block">
                Por normativa antifraude de Cordano PMS, el sistema no muestra el efectivo esperado al cajero.
              </span>
            </div>
          </div>

          {/* Calculadora por Denominaciones */}
          {cashInputMode === 'denominaciones' && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#E2498A]" />
                  <span>Monedas & Billetes de Curso Legal (Chile)</span>
                </span>
                <span className="text-xs font-mono font-black text-[#E2498A]">
                  Total Sumado: $ {(totalCashContado).toLocaleString('es-CL')} CLP
                </span>
              </div>

              {/* Monedas */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-2">Monedas Metálicas</span>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '$50', field: 'coins50' as const, mult: 50 },
                    { label: '$100', field: 'coins100' as const, mult: 100 },
                    { label: '$500', field: 'coins500' as const, mult: 500 },
                  ].map((m) => (
                    <div key={m.field} className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                      <span className="text-xs font-black text-slate-700 block font-mono">{m.label}</span>
                      <input
                        type="number"
                        min="0"
                        value={breakdown[m.field] || ''}
                        onChange={(e) => handleUpdateBreakdown(m.field, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full mt-1.5 h-9 text-center font-bold font-mono text-sm border border-slate-300 rounded-lg outline-none focus:border-[#E2498A]"
                      />
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">
                        = ${((breakdown[m.field] || 0) * m.mult).toLocaleString('es-CL')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billetes */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-2">Billetes Nacionales</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: '$1.000', field: 'bills1000' as const, mult: 1000 },
                    { label: '$2.000', field: 'bills2000' as const, mult: 2000 },
                    { label: '$5.000', field: 'bills5000' as const, mult: 5000 },
                    { label: '$10.000', field: 'bills10000' as const, mult: 10000 },
                    { label: '$20.000', field: 'bills20000' as const, mult: 20000 },
                  ].map((b) => (
                    <div key={b.field} className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                      <span className="text-xs font-black text-slate-700 block font-mono">{b.label}</span>
                      <input
                        type="number"
                        min="0"
                        value={breakdown[b.field] || ''}
                        onChange={(e) => handleUpdateBreakdown(b.field, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full mt-1.5 h-9 text-center font-bold font-mono text-sm border border-slate-300 rounded-lg outline-none focus:border-[#E2498A]"
                      />
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">
                        = ${((breakdown[b.field] || 0) * b.mult).toLocaleString('es-CL')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input Total Directo */}
          {cashInputMode === 'total' && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-black text-slate-700 block">
                Total de Efectivo Físico Contado ($) *
              </label>
              <input
                data-testid="declared-cash-total-input"
                type="number"
                min="0"
                value={declaredCash}
                onChange={(e) => setDeclaredCash(e.target.value)}
                placeholder="0"
                className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white font-mono font-black text-lg text-[#1E1E2F] focus:border-[#E2498A] focus:outline-none"
              />
            </div>
          )}

          {/* ── DISTRIBUCIÓN DE EFECTIVO: GAVETA VS SOBRE ── */}
          <div className="p-5 rounded-2xl bg-[#FFF5F8] border border-[#E2498A]/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2498A]/20 pb-2">
              <div>
                <span className="text-xs font-black text-[#1E1E2F] uppercase flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-[#E2498A]" />
                  <span>Distribución de Efectivo (Fondo Gaveta vs Sobre de Remesa)</span>
                </span>
                <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                  El fondo de gaveta queda físicamente al cajero relevo. El excedente se sella en sobre de recaudación.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setHandoverFundAmount('50000')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                    handoverFundAmount === '50000'
                      ? 'bg-[#E2498A] text-white border-[#E2498A]'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  $ 50.000 Oficial
                </button>
                <button
                  type="button"
                  onClick={() => setHandoverFundAmount('0')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                    handoverFundAmount === '0'
                      ? 'bg-[#E2498A] text-white border-[#E2498A]'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  $ 0 (Caja a Cero)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">1. Total Efectivo Contado</span>
                <span className="text-base font-black font-mono text-[#1E1E2F] block mt-1">
                  $ {totalCashContado.toLocaleString('es-CL')} CLP
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                <label className="text-[10px] text-slate-500 uppercase font-bold block">2. Fondo Queda en Gaveta</label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm font-bold text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={handoverFundAmount}
                    onChange={(e) => setHandoverFundAmount(e.target.value)}
                    className="w-full font-black font-mono text-base text-[#1E1E2F] outline-none"
                  />
                  <span className="text-[11px] text-slate-400 font-mono">CLP</span>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#E2498A]/40 bg-[#FFF5F8]">
                <span className="text-[10px] text-[#E2498A] uppercase font-black block">3. Sobre Entrega Administración</span>
                <span className="text-base font-black font-mono text-[#E2498A] block mt-1">
                  $ {sobreRemesa.toLocaleString('es-CL')} CLP
                </span>
              </div>
            </div>
          </div>

          {/* Justificación / Observaciones */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 block">
              Observaciones del Arqueo / Justificación de Novedades (Opcional)
            </label>
            <textarea
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Indique si existió algún inconveniente de vuelto o billete dañado durante el turno..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs text-[#1E1E2F] outline-none focus:border-[#E2498A]"
            />
          </div>

          {/* Botones de Navegación */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPreviousStep}
              className="h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Vouchers</span>
            </button>

            <button
              type="button"
              onClick={goToNextStep}
              className="h-11 px-6 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <span>Continuar al Paso 5: Certificación Z</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FASE 5: RESUMEN, SELLO SHA-256 & CERTIFICACIÓN Z
      ─────────────────────────────────────────────────────────────── */}
      {currentStep === 5 && !isShiftClosed && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-black uppercase text-[#E2498A] tracking-wider block mb-1">
              FASE 5 DE 5 • CIERRE DEFINITIVO
            </span>
            <h2 className="text-lg font-black text-[#1E1E2F]">
              Resumen Previo a la Certificación & Sello Criptográfico
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Revise la totalidad de los valores declarados antes de sellar el cierre de caja. Una vez emitido el cierre, el turno se bloqueará definitivamente con firma SHA-256.
            </p>
          </div>

          {/* Tabla de Resumen Consolidado */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            <div className="p-4 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase">Concepto Declarado</span>
              <span className="text-xs font-bold text-slate-600 uppercase">Total en Turno</span>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Banknote className="w-5 h-5 text-slate-600" />
                <div>
                  <span className="font-bold text-xs text-[#1E1E2F] block">Efectivo Físico Declarado</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    (Gaveta: ${fondoGaveta.toLocaleString('es-CL')} + Sobre: ${sobreRemesa.toLocaleString('es-CL')})
                  </span>
                </div>
              </div>
              <span className="font-mono font-black text-sm text-[#1E1E2F]">
                $ {totalCashContado.toLocaleString('es-CL')} CLP
              </span>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-slate-600" />
                <div>
                  <span className="font-bold text-xs text-[#1E1E2F] block">Vouchers POS (Débito / Crédito)</span>
                  <span className="text-[11px] text-slate-400 font-mono">Total según cierre de lote</span>
                </div>
              </div>
              <span className="font-mono font-black text-sm text-[#1E1E2F]">
                $ {(parseInt(declaredCard) || 0).toLocaleString('es-CL')} CLP
              </span>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Send className="w-5 h-5 text-slate-600" />
                <div>
                  <span className="font-bold text-xs text-[#1E1E2F] block">Transferencias Bancarias</span>
                  <span className="text-[11px] text-slate-400 font-mono">Comprobantes confirmados</span>
                </div>
              </div>
              <span className="font-mono font-black text-sm text-[#1E1E2F]">
                $ {(parseInt(declaredTransfer) || 0).toLocaleString('es-CL')} CLP
              </span>
            </div>

            <div className="p-4.5 bg-[#FFF5F8] flex items-center justify-between">
              <span className="font-black text-xs text-[#1E1E2F] uppercase">TOTAL GENERAL DECLARADO</span>
              <span className="font-mono font-black text-lg text-[#E2498A]">
                $ {(totalCashContado + (parseInt(declaredCard) || 0) + (parseInt(declaredTransfer) || 0)).toLocaleString('es-CL')} CLP
              </span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPreviousStep}
              className="h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Modificar Arqueo</span>
            </button>

            <button
              type="button"
              id="btn-submit-blind-close"
              onClick={handlePerformCloseValidation}
              className="h-12 px-7 rounded-xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white font-black text-xs tracking-wider uppercase transition flex items-center gap-2.5 shadow-md cursor-pointer ring-2 ring-slate-900/10"
            >
              <Lock className="w-4 h-4 text-[#E2498A]" />
              <span>EJECUTAR ARQUEO CIEGO & SELLAR TURNO</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          POST-CIERRE: REPORTE Z, CUADRATURA REVELADA & DOBLE FIRMA A4
      ─────────────────────────────────────────────────────────────── */}
      {isShiftClosed && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          {/* Header de Cierre Certificado */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block">
                  CUADRATURA REVELADA (REPORTE Z)
                </span>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-700">
                  {isFlagged ? 'DESCUADRADO' : isPerfect ? 'CUADRADO PERFECTO' : 'TOLERANCIA OK'}
                </span>
              </div>
              <h2 className="text-xl font-black text-[#1E1E2F]">
                Cierre de Turno #{activeShift.id.slice(-8)} Certificado
              </h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Operador: {activeShift.operatorName} • Hash SHA-256 inmutable generado conforme a directiva legal.
              </p>
            </div>

            {/* Acciones de Salida y Documentos A4 */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => generateShiftReportPDF(activeShift, true)}
                className="h-10 px-4 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Acta A4 (2 Copias)</span>
              </button>

              <button
                type="button"
                onClick={() => generateShiftReportPDF(activeShift, false)}
                className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2 border border-slate-200 cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-slate-600" />
                <span>Descargar PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReporteModalOpen(true)}
                className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2 border border-slate-200 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-slate-600" />
                <span>Auditoría Z</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAperturaModalOpen(true)}
                className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <span>Iniciar Nuevo Turno</span>
              </button>
            </div>
          </div>

          {/* Pestañas del Reporte Z */}
          <div className="flex border-b border-slate-200 gap-1 overflow-x-auto text-xs font-bold">
            {[
              { id: 'resumen', label: 'Resumen Cuadratura', icon: Layers },
              { id: 'conteo', label: 'Conteo Físico', icon: Coins },
              { id: 'movimientos', label: `Movimientos (${activeShift.cashMovements?.length || 0})`, icon: ShieldCheck },
              { id: 'vehiculos', label: 'Vehículos Traspasados', icon: Car },
              { id: 'firmas', label: 'Firmas en 2 Copias', icon: FileSignature },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = reportActiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReportActiveTab(tab.id as any)}
                  className={`py-2 px-3.5 rounded-t-xl transition cursor-pointer flex items-center gap-2 border-t-2 border-x ${
                    isActive
                      ? 'border-t-[#E2498A] border-x-slate-200 bg-white text-[#1E1E2F] font-black'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT: RESUMEN */}
          {reportActiveTab === 'resumen' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-sm block text-[#1E1E2F]">
                      {user.role === 'administrador' ? (
                        isFlagged
                          ? 'TURNO DESCUADRADO (SUPERÓ TOLERANCIA OPERATIVA)'
                          : isPerfect
                          ? 'Cuadratura Exacta (Sin Diferencias)'
                          : `Descuadre Aceptado dentro de Tolerancia ($${cashToleranceClp.toLocaleString('es-CL')} CLP)`
                      ) : (
                        'CIERRE CERTIFICADO EXITOSAMENTE'
                      )}
                    </span>
                    {user.role === 'administrador' && (
                      <span className="text-xs text-slate-600 font-mono">
                        Diferencia Neta en Caja: {discrepancyCash >= 0 ? '+' : ''}
                        ${discrepancyCash.toLocaleString('es-CL')} CLP
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabla Comparativa de Medios de Pago */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-3 px-4">Canal de Pago</th>
                      <th className="py-3 px-4 text-right">Declarado (Cajero)</th>
                      {user.role === 'administrador' && (
                        <>
                          <th className="py-3 px-4 text-right">Esperado (Sistema)</th>
                          <th className="py-3 px-4 text-right">Diferencia</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="py-3 px-4 font-sans font-bold text-slate-800">Efectivo Físico</td>
                      <td className="py-3 px-4 text-right font-black text-[#1E1E2F]">
                        ${(activeShift.declaredCash || 0).toLocaleString('es-CL')}
                      </td>
                      {user.role === 'administrador' && (
                        <>
                          <td className="py-3 px-4 text-right text-slate-600">
                            ${(activeShift.expectedCash || 0).toLocaleString('es-CL')}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-bold ${
                              discrepancyCash < 0 ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {discrepancyCash >= 0 ? '+' : ''}${discrepancyCash.toLocaleString('es-CL')}
                          </td>
                        </>
                      )}
                    </tr>

                    <tr>
                      <td className="py-3 px-4 font-sans font-bold text-slate-800">POS Vouchers (Débito/Crédito)</td>
                      <td className="py-3 px-4 text-right font-black text-[#1E1E2F]">
                        ${(activeShift.declaredCard || 0).toLocaleString('es-CL')}
                      </td>
                      {user.role === 'administrador' && (
                        <>
                          <td className="py-3 px-4 text-right text-slate-600">
                            ${(activeShift.expectedCard || 0).toLocaleString('es-CL')}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-600">$0</td>
                        </>
                      )}
                    </tr>

                    <tr>
                      <td className="py-3 px-4 font-sans font-bold text-slate-800">Transferencias Electrónicas</td>
                      <td className="py-3 px-4 text-right font-black text-[#1E1E2F]">
                        ${(activeShift.declaredTransfer || 0).toLocaleString('es-CL')}
                      </td>
                      {user.role === 'administrador' && (
                        <>
                          <td className="py-3 px-4 text-right text-slate-600">
                            ${(activeShift.expectedTransfer || 0).toLocaleString('es-CL')}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-600">$0</td>
                        </>
                      )}
                    </tr>

                    <tr className="bg-slate-50 font-black">
                      <td className="py-3 px-4 font-sans text-[#1E1E2F]">TOTAL RECAUDACIÓN</td>
                      <td className="py-3 px-4 text-right text-[#1E1E2F]">
                        ${totalDeclared.toLocaleString('es-CL')} CLP
                      </td>
                      {user.role === 'administrador' && (
                        <>
                          <td className="py-3 px-4 text-right text-[#1E1E2F]">
                            ${totalExpected.toLocaleString('es-CL')}
                          </td>
                          <td className="py-3 px-4 text-right text-[#1E1E2F]">
                            ${discrepancyTotal.toLocaleString('es-CL')} CLP
                          </td>
                        </>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Justificación Registrada */}
              {activeShift.closeJustification && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-[#1E1E2F] block">Justificación Registrada:</span>
                  <span className="text-slate-600 mt-0.5 block font-sans">{activeShift.closeJustification}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: CONTEO */}
          {reportActiveTab === 'conteo' && (
            <div className="space-y-3">
              <span className="font-bold text-xs text-slate-700 block">
                Desglose por denominación registrado al momento del cierre:
              </span>
              {activeShift.declaredCashBreakdown ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: '$50 Moneda', count: activeShift.declaredCashBreakdown.coins50, val: 50 },
                    { label: '$100 Moneda', count: activeShift.declaredCashBreakdown.coins100, val: 100 },
                    { label: '$500 Moneda', count: activeShift.declaredCashBreakdown.coins500, val: 500 },
                    { label: '$1.000 Billete', count: activeShift.declaredCashBreakdown.bills1000, val: 1000 },
                    { label: '$2.000 Billete', count: activeShift.declaredCashBreakdown.bills2000, val: 2000 },
                    { label: '$5.000 Billete', count: activeShift.declaredCashBreakdown.bills5000, val: 5000 },
                    { label: '$10.000 Billete', count: activeShift.declaredCashBreakdown.bills10000, val: 10000 },
                    { label: '$20.000 Billete', count: activeShift.declaredCashBreakdown.bills20000, val: 20000 },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-500 block font-bold font-mono">{item.label}</span>
                      <div className="flex items-baseline justify-between font-mono">
                        <span className="font-black text-xs text-[#1E1E2F]">{item.count || 0} un.</span>
                        <span className="font-bold text-xs text-slate-700">
                          ${((item.count || 0) * item.val).toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                  Total declarado en modalidad directa: ${(activeShift.declaredCash || 0).toLocaleString('es-CL')} CLP.
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: MOVIMIENTOS */}
          {reportActiveTab === 'movimientos' && (
            <div className="space-y-3">
              <span className="font-bold text-xs text-slate-700 block">
                Movimientos manuales de caja registrados durante el turno:
              </span>
              {activeShift.cashMovements && activeShift.cashMovements.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {activeShift.cashMovements.map((m) => (
                    <div key={m.id} className="p-3.5 bg-white flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {m.type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(m.timestamp).toLocaleTimeString('es-CL')}
                          </span>
                        </div>
                        <p className="font-sans text-slate-800 font-medium">{m.reason}</p>
                        <span className="text-[10px] text-slate-400 block">
                          Resp: {m.requesterName || m.operatorName} | Aut: {m.authorizerName || m.authorizedBySupervisor || 'Supervisor'}
                        </span>
                      </div>
                      <div className="text-right font-black font-mono text-[#1E1E2F]">
                        {m.type === 'INGRESO_MANUAL' ? '+' : '-'}${m.amount.toLocaleString('es-CL')} CLP
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                  No se registraron sangrías ni gastos durante este turno.
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: VEHÍCULOS TRASPASADOS */}
          {reportActiveTab === 'vehiculos' && (
            <div className="space-y-3">
              <span className="font-bold text-xs text-slate-700 block">
                Resumen de vehículos en recinto al cierre de turno:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 text-xs block font-bold">Vehículos Traspasados al Siguiente Turno:</span>
                  <span className="text-2xl font-black font-mono text-[#1E1E2F]">
                    {activeShift.transferredVehiclesCount || 0}
                  </span>
                  <span className="text-[11px] text-slate-500 block font-sans">
                    Permanecen activos en sus respectivas plazas con custodia continua.
                  </span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-500 text-xs block font-bold">Salidas Forzadas / Cobradas en Cierre:</span>
                  <span className="text-2xl font-black font-mono text-[#1E1E2F]">
                    {activeShift.forcedExitVehiclesCount || 0}
                  </span>
                  <span className="text-[11px] text-slate-500 block font-sans">
                    Fueron liquidadas y liberaron plaza antes del cambio de turno.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: FIRMAS EN DOS COPIAS */}
          {reportActiveTab === 'firmas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[#1E1E2F] uppercase">
                    Actas de Doble Firma Física (Hoja A4 Oficial)
                  </h4>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    Copia 1 para archivo en garita del recinto; Copia 2 entregada a administración junto al sobre de remesa.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSignatureCopy('copia1_caja')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition ${
                      selectedSignatureCopy === 'copia1_caja'
                        ? 'bg-[#1E1E2F] text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Copia 1: Garita
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSignatureCopy('copia2_operador')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition ${
                      selectedSignatureCopy === 'copia2_operador'
                        ? 'bg-[#1E1E2F] text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Copia 2: Administración
                  </button>
                </div>
              </div>

              {selectedSignatureCopy === 'copia1_caja' ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-black text-xs text-[#1E1E2F]">
                      COPIA 1 — PARA ARCHIVO FÍSICO DE GARITA (RECINTO SERRANO 447)
                    </span>
                    <span className="font-bold text-xs text-emerald-600">
                      {activeShift.signedCopy1Caja ? '✓ Certificada y Sellada' : 'Pendiente de Firma'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-sans">
                    Permanece archivada en la garita junto a la bitácora física de turno.
                  </p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => signShiftCopy('caja')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>{activeShift.signedCopy1Caja ? 'Volver a Firmar Copia 1' : 'Firmar Copia 1 (Garita)'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-black text-xs text-[#1E1E2F]">
                      COPIA 2 — PARA ENTREGA A ADMINISTRACIÓN (SOBRE DE REMESA)
                    </span>
                    <span className="font-bold text-xs text-emerald-600">
                      {activeShift.signedCopy2Operador ? '✓ Certificada por Operador' : 'Pendiente de Firma'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 font-mono">
                    Total declarado para entrega en sobre: ${(sobreRemesa || 0).toLocaleString('es-CL')} CLP.
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => signShiftCopy('operador')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>{activeShift.signedCopy2Operador ? 'Copia 2 Ya Firmada' : 'Firmar Copia 2 (Administración)'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: VALIDACIÓN CON PIN O NOTIFICACIÓN WHATSAPP ── */}
      <AnimatePresence>
        {showPinRequirementModal && (
          <div className="fixed inset-0 z-50 bg-[#1E1E2F]/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4 text-[#1E1E2F]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FFF5F8] border border-[#E2498A]/30 text-[#E2498A] flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-black text-base text-[#1E1E2F]">
                  Diferencia Superior a Tolerancia (${cashToleranceClp.toLocaleString('es-CL')} CLP)
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  El descuadre supera la tolerancia operativa de caja. Ingrese una justificación obligatoria y valide con PIN de Supervisor presencial o envíe notificación a gerencia.
                </p>
              </div>

              {/* Justificación obligatoria */}
              <div className="space-y-1 text-left text-xs">
                <label className="font-bold text-slate-700 block">
                  Justificación Obligatoria del Descuadre *
                </label>
                <textarea
                  rows={2}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Detalle el motivo de la diferencia en efectivo..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white outline-none focus:border-[#E2498A]"
                  required
                />
              </div>

              {/* Opción A: PIN Supervisor */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <label className="font-bold text-slate-700 block text-center">
                  Opción 1: PIN de Supervisor Presencial (ej: 1234)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={4}
                    value={supervisorPin}
                    onChange={(e) => setSupervisorPin(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-center font-mono font-bold text-base outline-none bg-white tracking-widest focus:border-[#E2498A]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleConfirmWithPin}
                  className="w-full py-2.5 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs transition cursor-pointer shadow-xs"
                >
                  Autorizar Cierre con PIN
                </button>
              </div>

              {/* Opción B: WhatsApp Notification */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <button
                  type="button"
                  onClick={handleConfirmWithWhatsAppNotification}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>Cerrar & Notificar por WhatsApp</span>
                </button>
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold text-center">
                  {errorMessage}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowPinRequirementModal(false)}
                className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer text-center"
              >
                Volver a revisar conteo
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Instrucciones Paso a Paso */}
      <ModalInstruccionesCierreCiego
        isOpen={isInstruccionesOpen}
        onClose={() => setIsInstruccionesOpen(false)}
      />

      {/* Modal Reporte Financiero Z Completo */}
      {isShiftClosed && (
        <ReporteFinancieroTurnoModal
          isOpen={isReporteModalOpen}
          onClose={() => setIsReporteModalOpen(false)}
          shift={activeShift}
          onOpenNewShift={() => setIsAperturaModalOpen(true)}
        />
      )}

      {/* Modal Apertura de Turno Oficial */}
      <ModalAperturaTurno
        isOpen={isAperturaModalOpen}
        onClose={() => setIsAperturaModalOpen(false)}
        onSuccess={() => {
          setIsAperturaModalOpen(false);
          setClosedShiftResult(null);
          setDeclaredCash('');
          setDeclaredCard('');
          setDeclaredTransfer('');
          setCurrentStep(1);
        }}
        onShowToast={(_msg, _type) => {}}
      />

      {/* Modal Movimiento de Caja */}
      <ModalMovimientoCaja
        isOpen={isMovimientoModalOpen}
        onClose={() => setIsMovimientoModalOpen(false)}
        onConfirm={(type, amt, rsn, pin, req, auth) => {
          registerCashMovement(type, amt, rsn, pin, req, auth);
        }}
        currentCashInDrawer={currentCashInDrawer}
      />
    </div>
  );
};
