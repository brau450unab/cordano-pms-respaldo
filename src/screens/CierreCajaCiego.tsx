import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParking } from '../context/ParkingContext';
import { Shift, ChileanCashBreakdown } from '../types';
import { ModalAperturaTurno } from '../components/ModalAperturaTurno';
import { ModalMovimientoCaja } from '../components/ModalMovimientoCaja';
import { ModalRevisionVehiculosCierre } from '../components/ModalRevisionVehiculosCierre';
import { ModalInstruccionesCierreCiego } from '../components/ModalInstruccionesCierreCiego';
import { ReporteFinancieroTurnoModal } from '../components/ReporteFinancieroTurnoModal';
import { ModalCuadraturaVouchers } from '../components/ModalCuadraturaVouchers';
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
  Receipt
} from 'lucide-react';

export const CierreCajaCiego: React.FC = () => {
  const {
    user,
    currentShift,
    tickets,
    cashToleranceClp,
    performBlindClose,
    openNewShift,
    registerCashMovement,
    signShiftCopy
  } = useParking();

  // Modales adicionales
  const [isAperturaModalOpen, setIsAperturaModalOpen] = useState(false);
  const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);
  const [isRevisionVehiculosOpen, setIsRevisionVehiculosOpen] = useState(false);
  const [isInstruccionesOpen, setIsInstruccionesOpen] = useState(false);
  const [isReporteModalOpen, setIsReporteModalOpen] = useState(false);
  const [isVouchersModalOpen, setIsVouchersModalOpen] = useState(false);
  const [handoverFundAmount, setHandoverFundAmount] = useState<string>('30000');

  // Formulario Ciego
  const [cashInputMode, setCashInputMode] = useState<'total' | 'denominaciones'>('total');
  const [declaredCash, setDeclaredCash] = useState<string>('');
  const [declaredCard, setDeclaredCard] = useState<string>('');
  const [declaredTransfer, setDeclaredTransfer] = useState<string>('');
  const [justification, setJustification] = useState<string>('');

  // Estado de revisión de vehículos
  const [hasCompletedVehicleReview, setHasCompletedVehicleReview] = useState<boolean>(false);
  const [, setVehicleHandoverInfo] = useState<{
    transferredVehiclesCount: number;
    forcedExitVehiclesCount: number;
  }>({ transferredVehiclesCount: 0, forcedExitVehiclesCount: 0 });

  // Supervisor PIN modal / WhatsApp notification option
  const [supervisorPin, setSupervisorPin] = useState<string>('');
  const [showPinRequirementModal, setShowPinRequirementModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Resultado de cierre & pestañas del reporte
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

  const activeTicketsInParking = tickets.filter((t) => t.status === 'activo');
  const hasActiveVehicles = activeTicketsInParking.length > 0;

  // Electronic tickets calculations
  const electronicTickets = tickets.filter(
    (t) => t.status === 'pagado' && t.paymentMethod !== 'efectivo'
  );
  const posTickets = electronicTickets.filter(
    (t) => t.paymentMethod === 'tarjeta_debito' || t.paymentMethod === 'tarjeta_credito'
  );
  const transferTickets = electronicTickets.filter(
    (t) => t.paymentMethod === 'transferencia'
  );

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
      supervisorPinArg
    );

    setClosedShiftResult(result);
    setShowPinRequirementModal(false);
  };

  const handlePerformClose = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (declaredCash === '' || declaredCard === '' || declaredTransfer === '') {
      setErrorMessage('Debe ingresar un valor (o $0) en cada medio de pago.');
      return;
    }

    if (hasActiveVehicles && !hasCompletedVehicleReview) {
      setErrorMessage('Debe realizar la revisión 1 a 1 de vehículos en el recinto antes del cierre.');
      setIsRevisionVehiculosOpen(true);
      return;
    }

    const cashVal = parseInt(declaredCash) || 0;
    const expected = currentShift.expectedCash || 0;
    const diffCash = Math.abs(cashVal - expected);

    if (diffCash > cashToleranceClp) {
      setShowPinRequirementModal(true);
      return;
    }

    executeShiftClose();
  };

  const handleConfirmWithPin = () => {
    if (!supervisorPin || supervisorPin.trim().length !== 4) {
      setErrorMessage('Debe ingresar un PIN de 4 dígitos válido.');
      return;
    }
    if (!justification.trim()) {
      setErrorMessage('La justificación del descuadre es obligatoria.');
      return;
    }

    executeShiftClose(supervisorPin);
  };

  const handleConfirmWithWhatsAppNotification = () => {
    if (!justification.trim()) {
      setErrorMessage('La justificación del descuadre es obligatoria.');
      return;
    }

    executeShiftClose();
  };

  const handleOpenShiftConfirm = (total: number, brk?: ChileanCashBreakdown) => {
    openNewShift(total, brk);
    setIsAperturaModalOpen(false);
    setClosedShiftResult(null);
    setDeclaredCash('');
    setDeclaredCard('');
    setDeclaredTransfer('');
    setJustification('');
    setHasCompletedVehicleReview(false);
  };

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-slate-900">
      {/* Title Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center border border-slate-900 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-700 uppercase bg-slate-100 border border-slate-300 px-2 py-0.5 rounded inline-block">
                GESTIÓN DE EFECTIVO & ARQUEO CIEGO
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                Tolerancia: ${cashToleranceClp.toLocaleString('es-CL')} CLP
              </span>
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
              Cierre de Caja Ciego & Arqueo
            </h1>
            <p className="text-xs text-slate-500 font-sans">
              Conteo imparcial de valores físicos, revisión 1 a 1 de recinto y reportes de doble firma
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsInstruccionesOpen(true)}
            id="btn-instrucciones-cierre"
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-300"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Instrucciones</span>
          </button>

          {!isShiftClosed && (
            <button
              type="button"
              onClick={() => setIsMovimientoModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-300"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Sangría / Gasto</span>
            </button>
          )}

          <div className="text-right">
            <span
              className={`inline-block font-mono font-bold text-xs px-2.5 py-1 rounded border ${
                isShiftClosed
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              {isShiftClosed ? 'TURNO CERRADO' : 'TURNO EN CURSO'}
            </span>
          </div>
        </div>
      </div>

      {/* BLOQUE REVISIÓN DE VEHÍCULOS EN RECINTO */}
      {hasActiveVehicles && !isShiftClosed && (
        <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded bg-slate-200 text-slate-800 border border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
              <Car className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">
                  {activeTicketsInParking.length} Vehículos Aún Dentro del Recinto
                </span>
                {hasCompletedVehicleReview ? (
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-800 border border-slate-400 rounded text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Revisión Completada</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-300 rounded text-[10px]">
                    Revisión Pendiente
                  </span>
                )}
              </div>
              <p className="text-slate-500 font-sans text-xs">
                Defina si se traspasa la custodia al siguiente turno o si se cobra la salida.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsRevisionVehiculosOpen(true)}
            id="btn-revisar-vehiculos-cierre"
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Car className="w-3.5 h-3.5" />
            <span>{hasCompletedVehicleReview ? 'Modificar Revisión' : 'Revisar Vehículos Uno a Uno'}</span>
          </button>
        </div>
      )}

      {!isShiftClosed ? (
        /* STEP 1: BLIND CASH DECLARATION FORM */
        <form onSubmit={handlePerformClose} className="space-y-6 font-mono text-xs">
          <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 flex items-start space-x-2.5">
              <EyeOff className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wide text-slate-900">
                  Formulario 100% Ciego Estricto
                </p>
                <p className="font-sans text-slate-500 mt-0.5">
                  Ingrese el dinero contado físicamente. Tolerancia máxima de descuadre: ${cashToleranceClp.toLocaleString('es-CL')} CLP.
                </p>
              </div>
            </div>

            {/* Toggle de Modo de Ingreso de Efectivo */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Coins className="w-4 h-4 text-slate-700" />
                <span>[ Modalidad de Conteo ]</span>
              </span>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setCashInputMode('total')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer border ${
                    cashInputMode === 'total'
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Vista 1: Total Directo
                </button>
                <button
                  type="button"
                  onClick={() => setCashInputMode('denominaciones')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer border ${
                    cashInputMode === 'denominaciones'
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Vista 2: Por Denominaciones
                </button>
              </div>
            </div>

            {/* VISTA 2: CALCULADORA DE DENOMINACIONES CHILENAS */}
            {cashInputMode === 'denominaciones' && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-300 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-800 uppercase">
                    Conteo de Monedas & Billetes (CLP)
                  </span>
                  <span className="font-bold text-slate-900">
                    Total Sumado: ${declaredCash ? parseInt(declaredCash).toLocaleString('es-CL') : '0'} CLP
                  </span>
                </div>

                {/* Monedas */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white p-2 rounded border border-slate-300">
                    <span className="text-[10px] text-slate-500 font-bold block">$50 Moneda (x)</span>
                    <input
                      type="number"
                      min="0"
                      value={breakdown.coins50 || ''}
                      onChange={(e) => handleUpdateBreakdown('coins50', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full mt-1 px-2 py-1 text-center font-bold text-xs border border-slate-300 rounded outline-none bg-slate-50 text-slate-900"
                    />
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-300">
                    <span className="text-[10px] text-slate-500 font-bold block">$100 Moneda (x)</span>
                    <input
                      type="number"
                      min="0"
                      value={breakdown.coins100 || ''}
                      onChange={(e) => handleUpdateBreakdown('coins100', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full mt-1 px-2 py-1 text-center font-bold text-xs border border-slate-300 rounded outline-none bg-slate-50 text-slate-900"
                    />
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-300">
                    <span className="text-[10px] text-slate-500 font-bold block">$500 Moneda (x)</span>
                    <input
                      type="number"
                      min="0"
                      value={breakdown.coins500 || ''}
                      onChange={(e) => handleUpdateBreakdown('coins500', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full mt-1 px-2 py-1 text-center font-bold text-xs border border-slate-300 rounded outline-none bg-slate-50 text-slate-900"
                    />
                  </div>
                </div>

                {/* Billetes */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: '$1.000', field: 'bills1000' as const },
                    { label: '$2.000', field: 'bills2000' as const },
                    { label: '$5.000', field: 'bills5000' as const },
                    { label: '$10.000', field: 'bills10000' as const },
                    { label: '$20.000', field: 'bills20000' as const },
                  ].map((b) => (
                    <div key={b.field} className="bg-white p-2 rounded border border-slate-300">
                      <span className="text-[10px] text-slate-500 font-bold block">{b.label} (x)</span>
                      <input
                        type="number"
                        min="0"
                        value={breakdown[b.field] || ''}
                        onChange={(e) => handleUpdateBreakdown(b.field, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full mt-1 px-2 py-1 text-center font-bold text-xs border border-slate-300 rounded outline-none bg-slate-50 text-slate-900"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Banner de Cuadratura de Vouchers POS & Transferencias */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 border border-slate-300 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-xs text-slate-700">
                <Receipt className="w-4 h-4 text-slate-600 shrink-0" />
                <div>
                  <span className="font-bold block text-slate-900">
                    Cuadratura de Vouchers POS & Transferencias
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {electronicTickets.length} comprobantes registrados ({posTickets.length} POS, {transferTickets.length} Transferencias)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVouchersModalOpen(true)}
                className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Revisar Vouchers ({electronicTickets.length})</span>
              </button>
            </div>

            {/* Direct Inputs per Channel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold flex items-center space-x-1.5">
                  <Banknote className="w-4 h-4 text-slate-600" />
                  <span>Total Físico Efectivo ($)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={declaredCash}
                  onChange={(e) => setDeclaredCash(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-sm text-slate-900 outline-none bg-white focus:border-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-slate-600" />
                  <span>Vouchers POS ($)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={declaredCard}
                  onChange={(e) => setDeclaredCard(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-sm text-slate-900 outline-none bg-white focus:border-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold flex items-center space-x-1.5">
                  <Send className="w-4 h-4 text-slate-600" />
                  <span>Transferencias Validadas ($)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={declaredTransfer}
                  onChange={(e) => setDeclaredTransfer(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-sm text-slate-900 outline-none bg-white focus:border-slate-800"
                />
              </div>
            </div>

            {/* Justificación opcional/obligatoria */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">
                Observaciones del Arqueo / Justificación de Descuadre
              </label>
              <textarea
                rows={2}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Indique si existió algún inconveniente de vuelto..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 outline-none bg-white focus:border-slate-800 font-sans"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-slate-100 border border-slate-400 rounded-lg text-slate-900 text-xs font-bold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-slate-700" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                id="btn-submit-blind-close"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center space-x-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>DECLARAR MONTOS & PROCESAR ARQUEO CIEGO</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* STEP 2: REVEALED SUMMARY & MULTI-TAB REPORT */
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded inline-block">
                    CUADRATURA REVELADA (REPORTE Z)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-800">
                    {isFlagged ? 'DESCUADRADO' : isPerfect ? 'CUADRADO PERFECTO' : 'TOLERANCIA OK'}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  Resumen de Cuadratura & Reportes de Turno
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Turno #{activeShift.id.slice(-6)} • Operador: {activeShift.operatorName}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReporteModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Ver Reporte & Firmas</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer border border-slate-300"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir A4</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAperturaModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Abrir Nuevo Turno</span>
                </button>
              </div>
            </div>

            {/* Sub-páginas o Pestañas en la vista de Cierre */}
            <div className="flex border-b border-slate-300 gap-1.5 overflow-x-auto text-xs font-bold">
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
                    className={`py-1.5 px-3 rounded-t-lg transition cursor-pointer flex items-center gap-1.5 border-t border-x ${
                      isActive
                        ? 'border-slate-400 bg-slate-100 text-slate-900 font-bold'
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
                {/* Discrepancy Banner */}
                <div className="p-3.5 rounded-lg border border-slate-300 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-5 h-5 text-slate-800 shrink-0" />
                    <div>
                      <span className="font-bold text-xs block text-slate-900">
                        {isFlagged
                          ? 'REPORTE 1: TURNO DESCUADRADO (SUPERÓ TOLERANCIA)'
                          : isPerfect
                          ? 'Cuadratura Perfecta (Sin Diferencias)'
                          : `Descuadre Aceptado dentro de Tolerancia ($${cashToleranceClp.toLocaleString('es-CL')} CLP)`}
                      </span>
                      <span className="text-[11px] text-slate-600">
                        Diferencia Neta en Caja:{' '}
                        {discrepancyCash >= 0 ? '+' : ''}
                        ${discrepancyCash.toLocaleString('es-CL')} CLP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] font-bold uppercase text-slate-700 bg-slate-100 border-b border-slate-300">
                      <tr>
                        <th className="py-2 px-3">Canal de Pago</th>
                        <th className="py-2 px-3 text-right">Monto Declarado</th>
                        <th className="py-2 px-3 text-right">Monto Esperado</th>
                        <th className="py-2 px-3 text-right">Diferencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          Efectivo en Caja
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          ${(activeShift.declaredCash || 0).toLocaleString('es-CL')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          ${(activeShift.expectedCash || 0).toLocaleString('es-CL')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          ${(activeShift.discrepancyCash || 0).toLocaleString('es-CL')}
                        </td>
                      </tr>

                      <tr>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          POS Vouchers Débito / Crédito
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          ${(activeShift.declaredCard || 0).toLocaleString('es-CL')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          ${(activeShift.expectedCard || 0).toLocaleString('es-CL')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">$0</td>
                      </tr>

                      <tr>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          Transferencias Electrónicas
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          ${(activeShift.declaredTransfer || 0).toLocaleString('es-CL')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          ${(activeShift.expectedTransfer || 0).toLocaleString('es-CL')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">$0</td>
                      </tr>

                      <tr className="bg-slate-100 font-bold">
                        <td className="py-2.5 px-3 text-slate-900">TOTAL RECAUDACIÓN</td>
                        <td className="py-2.5 px-3 text-right text-slate-900">
                          ${totalDeclared.toLocaleString('es-CL')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-900">
                          ${totalExpected.toLocaleString('es-CL')}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-900">
                          ${(activeShift.discrepancyTotal || 0).toLocaleString('es-CL')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Justificación Registrada */}
                {activeShift.closeJustification && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <span className="font-bold text-slate-900 block">Justificación Registrada:</span>
                    <span className="text-slate-600 mt-0.5 block font-sans">{activeShift.closeJustification}</span>
                  </div>
                )}

                {/* Entrega de Turno Directo */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-300 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                        <Banknote className="w-4 h-4 text-slate-700" />
                        <span>Entrega al Turno Directo (Relevo de Gaveta)</span>
                      </span>
                      <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                        El monto que queda en gaveta física pasa a ser el fondo inicial del operador entrante.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setHandoverFundAmount('0')}
                        className={`px-2.5 py-1 rounded border text-xs font-bold transition cursor-pointer ${
                          handoverFundAmount === '0'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Caja en Cero ($0)
                      </button>
                      <button
                        type="button"
                        onClick={() => setHandoverFundAmount('30000')}
                        className={`px-2.5 py-1 rounded border text-xs font-bold transition cursor-pointer ${
                          handoverFundAmount === '30000'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Fondo $30.000
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-2.5 bg-white border border-slate-300 rounded space-y-0.5">
                      <span className="text-[10px] text-slate-500 block">Efectivo Total Arqueado</span>
                      <span className="font-bold text-sm text-slate-900">
                        ${(activeShift.declaredCash || 0).toLocaleString('es-CL')} CLP
                      </span>
                    </div>

                    <div className="p-2.5 bg-white border border-slate-300 rounded space-y-0.5">
                      <label htmlFor="input-handover-fund" className="text-[10px] text-slate-500 block font-bold">
                        Fondo de Gaveta Informado
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 font-bold">$</span>
                        <input
                          id="input-handover-fund"
                          type="number"
                          min="0"
                          step="1000"
                          value={handoverFundAmount}
                          onChange={(e) => setHandoverFundAmount(e.target.value)}
                          className="w-full font-bold text-sm text-slate-900 bg-transparent outline-none border-b border-slate-400"
                        />
                        <span className="text-[10px] text-slate-500">CLP</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white border border-slate-300 rounded space-y-0.5">
                      <span className="text-[10px] text-slate-500 block">Retiro Neto a Caja Fuerte</span>
                      <span className="font-bold text-sm text-slate-900">
                        ${Math.max(0, (activeShift.declaredCash || 0) - (parseInt(handoverFundAmount) || 0)).toLocaleString('es-CL')} CLP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CONTEO */}
            {reportActiveTab === 'conteo' && (
              <div className="space-y-3">
                <span className="font-bold text-xs text-slate-800 block">
                  Desglose por denominación registrado al momento del cierre:
                </span>
                {activeShift.declaredCashBreakdown ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-300 rounded space-y-0.5">
                        <span className="text-[10px] text-slate-500 block font-bold">{item.label}</span>
                        <div className="flex items-baseline justify-between">
                          <span className="font-bold text-xs text-slate-900">{item.count || 0} un.</span>
                          <span className="font-bold text-xs text-slate-700">
                            ${((item.count || 0) * item.val).toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 text-center text-slate-500">
                    Total declarado directo: ${(activeShift.declaredCash || 0).toLocaleString('es-CL')} CLP.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: MOVIMIENTOS */}
            {reportActiveTab === 'movimientos' && (
              <div className="space-y-3">
                <span className="font-bold text-xs text-slate-800 block">
                  Movimientos manuales de caja registrados durante el turno:
                </span>
                {activeShift.cashMovements && activeShift.cashMovements.length > 0 ? (
                  <div className="divide-y divide-slate-200 border border-slate-300 rounded-lg overflow-hidden">
                    {activeShift.cashMovements.map((m) => (
                      <div key={m.id} className="p-3 bg-white flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded border border-slate-300 bg-slate-100 text-slate-800">
                              {m.type}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(m.timestamp).toLocaleTimeString('es-CL')}
                            </span>
                          </div>
                          <p className="font-sans text-xs text-slate-800">{m.reason}</p>
                          <span className="text-[10px] text-slate-500 block">
                            Resp: {m.requesterName || m.operatorName} | Aut: {m.authorizerName || m.authorizedBySupervisor || 'Supervisor'}
                          </span>
                        </div>
                        <div className="text-right font-bold text-slate-900">
                          {m.type === 'INGRESO_MANUAL' ? '+' : '-'}${m.amount.toLocaleString('es-CL')} CLP
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 text-center text-slate-500">
                    No se realizaron sangrías ni ingresos durante este turno.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: VEHICULOS TRASPASADOS */}
            {reportActiveTab === 'vehiculos' && (
              <div className="space-y-3">
                <span className="font-bold text-xs text-slate-800 block">
                  Resumen de vehículos en recinto al cierre de turno:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
                    <span className="text-slate-500 text-xs block">Vehículos Traspasados al Siguiente Turno:</span>
                    <span className="text-xl font-bold text-slate-900">
                      {activeShift.transferredVehiclesCount || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-sans">
                      Permanecen activos en sus respectivos slots con tiempo corriendo.
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
                    <span className="text-slate-500 text-xs block">Salidas Forzadas / Cobradas en Cierre:</span>
                    <span className="text-xl font-bold text-slate-900">
                      {activeShift.forcedExitVehiclesCount || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-sans">
                      Fueron liquidadas y liberaron slot antes del cambio de turno.
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
                    <h4 className="font-bold text-xs text-slate-900 uppercase">
                      [ Actas de Doble Firma ]
                    </h4>
                    <p className="text-xs text-slate-500 font-sans">
                      Copia 1 para la caja del recinto; Copia 2 con solo los montos declarados para el operador.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSignatureCopy('copia1_caja')}
                      className={`px-2.5 py-1 rounded text-xs font-bold border ${
                        selectedSignatureCopy === 'copia1_caja'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Copia 1: Caja
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSignatureCopy('copia2_operador')}
                      className={`px-2.5 py-1 rounded text-xs font-bold border ${
                        selectedSignatureCopy === 'copia2_operador'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Copia 2: Operador
                    </button>
                  </div>
                </div>

                {selectedSignatureCopy === 'copia1_caja' ? (
                  <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-lg space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-900">
                        COPIA 1 — PARA LA CAJA DEL RECINTO (AUDITORÍA COMPLETA)
                      </span>
                      <span className="font-bold text-slate-700">
                        {activeShift.signedCopy1Caja ? '✓ Firmada y Sellada' : 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-slate-600 font-sans">
                      Permanece archivada en la caja del establecimiento junto a los sobres de recaudación física.
                    </p>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => signShiftCopy('caja')}
                        className="px-3.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{activeShift.signedCopy1Caja ? 'Volver a Firmar Copia 1' : 'Firmar Copia 1 (Caja)'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-lg space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-900">
                        COPIA 2 — RESPALDO LEGAL PARA EL OPERADOR
                      </span>
                      <span className="font-bold text-slate-700">
                        {activeShift.signedCopy2Operador ? '✓ Firmada por Operador' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200 text-slate-700 font-sans">
                      En esta copia solo figuran los montos declarados (${totalDeclared.toLocaleString('es-CL')} CLP).
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => signShiftCopy('operador')}
                        className="px-3.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{activeShift.signedCopy2Operador ? 'Copia 2 Ya Firmada' : 'Firmar Copia 2 (Respaldo)'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Validación con PIN o Notificación WhatsApp si supera tolerancia */}
      <AnimatePresence>
        {showPinRequirementModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-xl border border-slate-400 p-5 shadow-xl space-y-4 text-slate-900"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-bold text-sm text-slate-900">
                  [ Diferencia Superior a Tolerancia (${cashToleranceClp.toLocaleString('es-CL')} CLP) ]
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  El descuadre supera la tolerancia operativa. Redacte una justificación obligatoria y autorice con PIN de Supervisor o notifique vía WhatsApp.
                </p>
              </div>

              {/* Observación obligatoria */}
              <div className="space-y-1 text-left text-xs">
                <label className="font-bold text-slate-800 block">
                  Observación Obligatoria del Descuadre *
                </label>
                <textarea
                  rows={2}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Describa el motivo de la diferencia..."
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white outline-none font-sans"
                  required
                />
              </div>

              {/* Opción 1: PIN Supervisor */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-300 space-y-2 text-xs">
                <label className="font-bold text-slate-800 block text-center">
                  Opción A: PIN Supervisor Presencial (ej: 2026)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={4}
                    value={supervisorPin}
                    onChange={(e) => setSupervisorPin(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-9 pr-3 py-1.5 rounded border border-slate-300 text-center font-bold text-sm outline-none bg-white tracking-widest"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleConfirmWithPin}
                  className="w-full py-2 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                >
                  Autorizar Cierre con PIN
                </button>
              </div>

              {/* Opción 2: WhatsApp Notification */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-300 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Share2 className="w-4 h-4" />
                  <span>Opción B: Notificar por WhatsApp</span>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmWithWhatsAppNotification}
                  id="btn-close-with-whatsapp-notice"
                  className="w-full py-2 rounded bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Cerrar y Notificar</span>
                </button>
              </div>

              {errorMessage && (
                <div className="p-2 bg-slate-100 border border-slate-300 rounded text-slate-800 text-xs font-bold text-center">
                  {errorMessage}
                </div>
              )}

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPinRequirementModal(false)}
                  className="w-full py-1.5 rounded text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-300 transition cursor-pointer text-center"
                >
                  Volver a Contar Efectivo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Cuadratura de Vouchers POS & Transferencias */}
      <ModalCuadraturaVouchers
        isOpen={isVouchersModalOpen}
        onClose={() => setIsVouchersModalOpen(false)}
        electronicTickets={electronicTickets}
        onApplyTotals={(posSum, transSum) => {
          setDeclaredCard(posSum.toString());
          setDeclaredTransfer(transSum.toString());
        }}
      />

      {/* Modal Instrucciones Paso a Paso */}
      <ModalInstruccionesCierreCiego
        isOpen={isInstruccionesOpen}
        onClose={() => setIsInstruccionesOpen(false)}
      />

      {/* Modal Revisión Uno a Uno de Vehículos */}
      <ModalRevisionVehiculosCierre
        isOpen={isRevisionVehiculosOpen}
        onClose={() => setIsRevisionVehiculosOpen(false)}
        activeTickets={activeTicketsInParking}
        onComplete={(summary) => {
          setHasCompletedVehicleReview(true);
          setVehicleHandoverInfo({
            transferredVehiclesCount: summary.transferredCount,
            forcedExitVehiclesCount: summary.forcedExitCount,
          });
        }}
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

      {/* Modal Apertura de Turno */}
      <ModalAperturaTurno
        isOpen={isAperturaModalOpen}
        onClose={() => setIsAperturaModalOpen(false)}
        onConfirm={handleOpenShiftConfirm}
        operatorName={user.name}
        suggestedInitialCash={parseInt(handoverFundAmount) || 30000}
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
