import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParking } from '../context/ParkingContext';
import { Ticket, PaymentMethod, VehicleType } from '../types';
import { TicketModal } from '../components/TicketModal';
import { ModalMovimientoCaja } from '../components/ModalMovimientoCaja';
import { ModalFugaVehiculo } from '../components/ModalFugaVehiculo';
import {
  ArrowLeft,
  Search,
  Clock,
  Car,
  Bike,
  Truck,
  CreditCard,
  Banknote,
  Building2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Tag,
  Check,
  Barcode,
  ArrowUpRight,
  Sparkles,
  Info,
  KeyRound,
  FileQuestion,
  Receipt,
  Printer,
  ChevronRight,
  Flame,
  Zap,
  Layers,
  HelpCircle,
  QrCode,
  X,
  Send
} from 'lucide-react';

interface PuntoVentaSalidaProps {
  onBack?: () => void;
  initialTicket?: Ticket | null;
}

export const PuntoVentaSalida: React.FC<PuntoVentaSalidaProps> = ({ onBack, initialTicket }) => {
  const {
    tickets,
    slots,
    calculateFee,
    processPayment,
    tariffConfig,
    cancelTicket,
    currentShift,
    registerCashMovement,
    registerVehicleEscape,
    findAgreementByPlate,
    user
  } = useParking();

  // Search & Selection
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(initialTicket || null);

  // Live Exit Clock
  const [nowClock, setNowClock] = useState<Date>(new Date());
  const [chileTimeString, setChileTimeString] = useState<string>('');

  // Payment params
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [receivedCashInput, setReceivedCashInput] = useState<string>('');
  const [convenioAccountName, setConvenioAccountName] = useState<string>('Empresa Cordano / Vecino Registrado');
  const [isLostTicket, setIsLostTicket] = useState<boolean>(false);

  // Set initial ticket if passed
  useEffect(() => {
    if (initialTicket) {
      setSelectedTicket(initialTicket);
      setSearchTerm(initialTicket.ticketCode);
      const stay = calculateFee(initialTicket, nowClock);
      setReceivedCashInput(stay.totalAmount.toString());
      setIsLostTicket(false);
      setShowShortStayAlert(true);
    }
  }, [initialTicket]);

  // Short stay warning & Lost Ticket Modal
  const [showLostTicketConfirmModal, setShowLostTicketConfirmModal] = useState(false);
  const [lostTicketSupervisorPin, setLostTicketSupervisorPin] = useState('');
  const [lostTicketAuthError, setLostTicketAuthError] = useState('');
  const [showShortStayAlert, setShowShortStayAlert] = useState(true);

  // Cash movement modal
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);
  // Fuga / Forced exit modal
  const [isFugaModalOpen, setIsFugaModalOpen] = useState(false);

  // Completed payment ticket modal
  const [completedTicket, setCompletedTicket] = useState<Ticket | null>(null);
  const [completedChange, setCompletedChange] = useState<number>(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [barrierOpenNotice, setBarrierOpenNotice] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Helper: breakdown of Chilean bills & coins for change display
  const getChangeBreakdownText = (change: number): string => {
    if (change <= 0) return 'Pago Exacto (Sin vuelto)';
    const denoms = [20000, 10000, 5000, 2000, 1000, 500, 100, 50];
    let rem = change;
    const parts: string[] = [];
    for (const d of denoms) {
      if (rem >= d) {
        const count = Math.floor(rem / d);
        rem %= d;
        parts.push(`${count}x $${d.toLocaleString('es-CL')}`);
      }
    }
    return `Desglose: ${parts.slice(0, 3).join(' + ')}`;
  };

  // Helper: description of bills received
  const getReceivedBillDescription = (amt: number): string => {
    if (amt === 20000) return '1 billete de veinte mil';
    if (amt === 10000) return '1 billete de diez mil';
    if (amt === 5000) return '1 billete de cinco mil';
    if (amt === 2000) return '1 billete de dos mil';
    if (amt === 1000) return '1 billete de mil';
    if (amt > 0) return `$${amt.toLocaleString('es-CL')} CLP ingresado`;
    return 'Calculadora activa';
  };

  // Live clock tick
  useEffect(() => {
    const updateTime = () => {
      const current = new Date();
      setNowClock(current);
      const formatted = current.toLocaleTimeString('es-CL', {
        timeZone: 'America/Santiago',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dateFormatted = current.toLocaleDateString('es-CL', {
        timeZone: 'America/Santiago',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      setChileTimeString(`${formatted} • ${dateFormatted}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Autofocus search on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Active tickets
  const activeTickets = tickets.filter((t) => t.status === 'activo');

  // Drawer Cash computation
  const paidTickets = tickets.filter((t) => t.status === 'pagado');
  const paidCash = paidTickets
    .filter((t) => t.paymentMethod === 'efectivo')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const movements = currentShift.cashMovements || [];
  const manualIngresos = movements
    .filter((m) => m.type === 'INGRESO_MANUAL')
    .reduce((sum, m) => sum + m.amount, 0);
  const manualSangrias = movements
    .filter((m) => m.type === 'RETIRO_SANGRIA')
    .reduce((sum, m) => sum + m.amount, 0);
  const currentCashInDrawer = (currentShift.initialCash || 0) + paidCash + manualIngresos - manualSangrias;

  // Search logic (supports barcode scanner, ticketCode, plateNumber, slotCode)
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPaymentError(null);

    const term = searchTerm.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (!term) return;

    const found = activeTickets.find(
      (t) =>
        t.ticketCode.toUpperCase() === term ||
        t.ticketCode.toUpperCase().replace('-', '') === term.replace('-', '') ||
        t.plateNumber.toUpperCase().replace('-', '') === term.replace('-', '') ||
        t.slotCode.toUpperCase() === term
    );

    if (found) {
      setSelectedTicket(found);
      const stay = calculateFee(found, nowClock);
      setReceivedCashInput(stay.totalAmount.toString());
      setIsLostTicket(false);
      setShowShortStayAlert(true);
    } else {
      setPaymentError(`No se encontró un ticket activo con la búsqueda "${searchTerm}"`);
    }
  };

  const handleSelectTicketDirect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setSearchTerm(ticket.ticketCode);
    setPaymentError(null);
    setIsLostTicket(false);
    setShowShortStayAlert(true);
    const stay = calculateFee(ticket, nowClock);
    setReceivedCashInput(stay.totalAmount.toString());
  };

  // Fee calculation
  const currentStay = selectedTicket ? calculateFee(selectedTicket, nowClock) : null;
  const isShortStay = currentStay ? currentStay.durationMinutes < 5 : false;
  const selectedAgreement = selectedTicket ? findAgreementByPlate(selectedTicket.plateNumber) : undefined;
  
  // Rate applied
  const vehicleRate = selectedTicket
    ? tariffConfig.vehicleRates[selectedTicket.vehicleType] || tariffConfig.vehicleRates['Automóvil']
    : { minuteRate: 40, hourlyRate: 2400, maxDailyRate: 18000 };

  const billableMinutes = currentStay
    ? Math.max(0, currentStay.durationMinutes - (currentStay.isGracePeriod ? currentStay.durationMinutes : tariffConfig.gracePeriodMinutes))
    : 0;

  // Base total (with $100 CLP rounding already performed by calculateFee)
  const feeTotal = isLostTicket
    ? tariffConfig.lostTicketFee
    : currentStay
    ? currentStay.totalAmount
    : 0;

  const finalTotalToPay = feeTotal;
  const receivedCashNum = parseFloat(receivedCashInput) || 0;
  const computedChange = Math.max(0, receivedCashNum - finalTotalToPay);
  const isCashInsufficient = paymentMethod === 'efectivo' && receivedCashNum < finalTotalToPay && finalTotalToPay > 0;

  // Quick cash buttons
  const handleQuickCash = (amount: number) => {
    setReceivedCashInput(amount.toString());
    setPaymentMethod('efectivo');
  };

  // Execute payment
  const handleExecuteCheckout = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTicket) return;
    setPaymentError(null);

    if (paymentMethod === 'efectivo' && isCashInsufficient) {
      setPaymentError(`El monto recibido ($${receivedCashNum.toLocaleString('es-CL')}) es insuficiente. Faltan $${(finalTotalToPay - receivedCashNum).toLocaleString('es-CL')} CLP.`);
      return;
    }

    try {
      const { ticket, changeAmount } = processPayment({
        ticketId: selectedTicket.id,
        paymentMethod,
        paidAmount: paymentMethod === 'efectivo' ? (receivedCashNum || finalTotalToPay) : finalTotalToPay,
        isLostTicket,
        discountReason: paymentMethod === 'convenio' ? convenioAccountName : undefined,
        authorizedByAdmin: isLostTicket ? 'Supervisor Cordano' : undefined,
      });

      // Visual feedback: barrier open notification
      setBarrierOpenNotice(true);
      setTimeout(() => {
        setBarrierOpenNotice(false);
      }, 2500);

      setCompletedTicket(ticket);
      setCompletedChange(changeAmount);
      setSelectedTicket(null);
      setSearchTerm('');
      setReceivedCashInput('');
      setIsLostTicket(false);
      searchInputRef.current?.focus();
    } catch (err: any) {
      setPaymentError(err.message || 'Error al procesar el pago de salida');
    }
  };

  // Global Keyboard listener: Atajos [1, 2, 3], [ESC], [ENTER]
  const handleGlobalKeyDown = (e: React.KeyboardEvent) => {
    const isInput = document.activeElement instanceof HTMLInputElement;

    if (e.key === 'Escape') {
      if (selectedTicket) {
        e.preventDefault();
        setSelectedTicket(null);
        setSearchTerm('');
      }
    } else if (e.key === '1' && selectedTicket && !isInput) {
      e.preventDefault();
      setPaymentMethod('efectivo');
    } else if (e.key === '2' && selectedTicket && !isInput) {
      e.preventDefault();
      setPaymentMethod('tarjeta_debito');
    } else if (e.key === '3' && selectedTicket && !isInput) {
      e.preventDefault();
      setPaymentMethod('transferencia');
    } else if (e.key === 'Enter' && !showLostTicketConfirmModal) {
      e.preventDefault();
      if (selectedTicket) {
        handleExecuteCheckout();
      } else {
        handleSearchSubmit();
      }
    }
  };

  // Confirm lost ticket modal
  const handleConfirmLostTicket = () => {
    if (lostTicketSupervisorPin !== 'admin123' && lostTicketSupervisorPin !== '1234' && lostTicketSupervisorPin !== '2026') {
      setLostTicketAuthError('PIN de Supervisor inválido (Prueba 1234 / 2026)');
      return;
    }
    setIsLostTicket(true);
    setReceivedCashInput(tariffConfig.lostTicketFee.toString());
    setShowLostTicketConfirmModal(false);
    setLostTicketSupervisorPin('');
    setLostTicketAuthError('');
  };

  return (
    <div
      onKeyDown={handleGlobalKeyDown}
      className="space-y-6 max-w-7xl mx-auto font-sans text-slate-900 outline-none"
      tabIndex={0}
    >
      {/* 1. TOP BAR: Navigation, Title & Live System Clock */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        {/* Left: Back button & Title */}
        <div className="flex items-center space-x-3.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Volver al Hub"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
            </button>
          )}

          <div className="w-9 h-9 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
            <Receipt className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="font-bold text-slate-900">[ MÓDULO: PUNTO DE VENTA Y COBRO POS ]</span>
              <span>·</span>
              <span className="font-mono text-slate-700 font-semibold">
                Caja: ${currentCashInDrawer.toLocaleString('es-CL')} CLP
              </span>
            </div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
              Punto de Venta Salida (POS)
            </h1>
          </div>
        </div>

        {/* Right: Cash Movement Action & Live Chilean Clock */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsCashMovementModalOpen(true)}
            className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-700" />
            <span>Movimiento Caja</span>
          </button>

          {/* Chilean Live Clock */}
          <div className="bg-slate-50 border border-slate-300 text-slate-900 px-3.5 py-1.5 rounded text-right">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">
              Hora de Salida
            </span>
            <span className="font-mono text-xs font-bold text-slate-800">
              {chileTimeString || 'Cargando...'}
            </span>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {paymentError && (
        <div className="p-3 bg-slate-100 border border-slate-400 rounded text-slate-800 text-xs flex items-center space-x-2 font-mono">
          <AlertTriangle className="w-4 h-4 text-slate-900 shrink-0" />
          <span className="font-semibold">{paymentError}</span>
        </div>
      )}

      {/* 1.5 METRICS SUMMARY (Wireframe Bento Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        {/* Card 1: Ocupación Garita */}
        <div className="bg-white border border-slate-300 rounded-xl p-3.5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>[ OCUPACIÓN ]</span>
            <span className="font-bold text-slate-900">{Math.round((activeTickets.length / 30) * 100)}%</span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {activeTickets.length} <span className="text-xs text-slate-500 font-normal">/ 30 Plazas</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded overflow-hidden mt-1">
            <div
              className="h-full bg-slate-800"
              style={{ width: `${Math.min(100, (activeTickets.length / 30) * 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Disponibilidad */}
        <div className="bg-white border border-slate-300 rounded-xl p-3.5 space-y-1 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">[ DISPONIBLE ]</span>
          <div className="text-xl font-black text-slate-900 flex items-center space-x-1.5">
            <span>{Math.max(0, 30 - activeTickets.length)}</span>
            <span className="text-xs text-slate-500 font-normal">Libres</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Pistas expeditas</span>
        </div>

        {/* Card 3: Recaudación Turno */}
        <div className="bg-white border border-slate-300 rounded-xl p-3.5 space-y-1 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">[ RECAUDACIÓN ]</span>
          <div className="text-xl font-black text-slate-900">
            ${currentCashInDrawer.toLocaleString('es-CL')}
            <span className="text-xs text-slate-500 ml-1 font-normal">CLP</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Auditoría al día</span>
        </div>

        {/* Card 4: Sobrestadía / Alertas */}
        <div className="bg-white border border-slate-300 rounded-xl p-3.5 space-y-1 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">[ ALERTAS ]</span>
          <div className="text-xl font-black text-slate-900 flex items-center space-x-1.5">
            <span>{activeTickets.filter((t) => (nowClock.getTime() - new Date(t.entryTime).getTime()) > 3 * 3600000).length}</span>
            <span className="text-xs font-normal text-slate-600">&gt; 3 Horas</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Revisión en terreno</span>
        </div>
      </div>

      {/* 2. MAIN LAYOUT: Left Panel (Search & Fee Breakdown) vs Right Panel (Payment & Giant Change Display) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* =========================================
            LEFT PANEL: BÚSQUEDA & DESGLOSE TRANSPARENTE (6 cols)
            ========================================= */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Search Card with Autofocus */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Barcode className="w-4 h-4 text-slate-500" />
                  <span>[ ESCANEAR TICKET / BUSCAR PATENTE ]</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-bold">
                  Enter
                </span>
              </label>

              <form onSubmit={handleSearchSubmit} className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ticket (T-84920) o Patente (ABCD-12)..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 focus:border-slate-800 rounded-lg text-sm font-mono font-bold text-slate-900 uppercase transition outline-none placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs rounded-lg transition shadow-xs cursor-pointer shrink-0 border border-slate-900"
                >
                  Buscar
                </button>
              </form>
            </div>

            {/* Quick Active Vehicle Selector Chips */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-slate-600">
                <span>Vehículos en garita ({activeTickets.length}):</span>
                <span>Selección rápida</span>
              </div>
              
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {activeTickets.length === 0 ? (
                  <p className="text-xs font-mono text-slate-400 py-1">No hay vehículos estacionados actualmente.</p>
                ) : (
                  activeTickets.map((t) => {
                    const isSelected = selectedTicket?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTicketDirect(t)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition cursor-pointer flex items-center space-x-1 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 font-bold'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span>{t.plateNumber}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          ({t.slotCode})
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Information & Transparent Breakdown Card */}
          {selectedTicket ? (
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
              
              {/* Short Stay Warning (< 5 min) */}
              {isShortStay && showShortStayAlert && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start justify-between gap-2 text-xs text-blue-900 font-mono">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">
                        Estadía corta ({currentStay?.durationMinutes} min)
                      </span>
                      <p className="mt-0.5 text-slate-800 leading-normal">
                        Menos de 5 min en recinto. Primeros {tariffConfig.gracePeriodMinutes} min gratuitos por período de gracia.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowShortStayAlert(false)}
                    className="text-[10px] font-bold text-blue-800 px-2 py-0.5 bg-blue-100 rounded border border-slate-300 cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              )}

              {/* Agreement / Abonado Status Alert Banner */}
              {selectedAgreement && (
                <div
                  className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                    selectedAgreement.status === 'vencido'
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : selectedAgreement.status === 'por_vencer'
                      ? 'bg-amber-50 border-slate-300 text-amber-900'
                      : 'bg-slate-900 border-slate-400 text-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold">
                    {selectedAgreement.status === 'vencido' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                    {selectedAgreement.status === 'por_vencer' && <AlertTriangle className="w-4 h-4 text-slate-800" />}
                    {selectedAgreement.status === 'al_dia' && <CheckCircle2 className="w-4 h-4 text-slate-800" />}
                    <span>
                      {selectedAgreement.status === 'vencido'
                        ? 'Convenio Vencido — Salida Excepcional Autorizada'
                        : selectedAgreement.status === 'por_vencer'
                        ? 'Convenio Por Vencer — Salida Exenta ($0 CLP)'
                        : 'Convenio Vigente — Sin Cobro ($0 CLP)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    Empresa: <strong>{selectedAgreement.companyName}</strong>. Vence: {new Date(selectedAgreement.validUntil).toLocaleDateString('es-CL')}.
                  </p>
                </div>
              )}

              {/* Vehicle Badge & Key Information */}
              <div className="border border-dashed border-slate-300 p-4 rounded-lg bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xl font-bold bg-white text-slate-900 border border-slate-300 px-3 py-0.5 rounded tracking-wide shadow-xs">
                      {selectedTicket.plateNumber}
                    </span>
                    <span className="text-xs font-mono text-slate-700 bg-white border border-slate-300 px-2 py-0.5 rounded">
                      {selectedTicket.vehicleType}
                    </span>
                  </div>
                  
                  <div className="text-xs font-mono text-slate-500 pt-0.5 flex items-center space-x-2">
                    <span>Ticket: <strong>{selectedTicket.ticketCode}</strong></span>
                    <span>·</span>
                    <span>Plaza: <strong>{selectedTicket.slotCode}</strong></span>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4 space-y-0.5 text-xs font-mono text-slate-600">
                  <div>
                    Ingreso:{' '}
                    <strong className="text-slate-900">
                      {new Date(selectedTicket.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                  <div>
                    Salida:{' '}
                    <strong className="text-slate-900">
                      {nowClock.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Operador: {selectedTicket.operatorEntryName}
                  </div>
                </div>
              </div>

              {/* Transparent Fee Breakdown Table */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider block">
                  [ DESGLOSE DE COBRO ]
                </span>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs font-mono">
                  {/* Row 1: Duration */}
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Tiempo transcurrido:</span>
                    <span className="font-bold text-slate-900">
                      {currentStay?.durationMinutes} min ({Math.floor((currentStay?.durationMinutes || 0) / 60)}h {(currentStay?.durationMinutes || 0) % 60}m)
                    </span>
                  </div>

                  {/* Row 2: Grace Period */}
                  <div className="flex justify-between items-center text-slate-800">
                    <span>Tolerancia de Gracia:</span>
                    <span className="font-bold bg-slate-900 border border-slate-400 text-slate-800 px-1.5 py-0.2 rounded">
                      -{Math.min(currentStay?.durationMinutes || 0, tariffConfig.gracePeriodMinutes)} min ($0)
                    </span>
                  </div>

                  {/* Row 3: Billable Minutes */}
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Minutos Facturables:</span>
                    <span className="font-bold text-slate-900">
                      {billableMinutes} min × ${vehicleRate.minuteRate}/min
                    </span>
                  </div>

                  {/* Row 4: Lost ticket penalty if active */}
                  {isLostTicket && (
                    <div className="flex justify-between items-center text-red-900 bg-red-100 p-2 rounded border border-red-300">
                      <span className="font-bold">Multa Ticket Extraviado:</span>
                      <span className="font-bold">
                        +${tariffConfig.lostTicketFee.toLocaleString('es-CL')} CLP
                      </span>
                    </div>
                  )}

                  {/* Row 5: Rounding */}
                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1.5 border-t border-slate-200">
                    <span>Ley de Redondeo:</span>
                    <span>Ajustado a $100 CLP</span>
                  </div>
                </div>
              </div>

              {/* Giant Amount Display */}
              <div className="p-4 rounded-xl border border-slate-300 bg-slate-100 text-center space-y-0.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 block">
                  TOTAL A COBRAR
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 tracking-tight">
                  ${finalTotalToPay.toLocaleString('es-CL')} <span className="text-sm font-bold text-slate-600">CLP</span>
                </div>
                <p className="text-[11px] font-mono text-slate-500">
                  {currentStay?.isGracePeriod && !isLostTicket
                    ? 'Período de gracia vigente: $0 a pagar'
                    : 'Tarifa congelada al momento de salida'}
                </p>
              </div>

              {/* Special Action: Lost Ticket & Fuga Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLostTicketConfirmModal(true)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition flex items-center space-x-1 cursor-pointer"
                  >
                    <FileQuestion className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ticket Perdido ($10.000)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFugaModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold text-red-700 bg-white hover:bg-red-50 border border-red-300 transition flex items-center space-x-1 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    <span>Declarar Fuga</span>
                  </button>
                </div>

                <span className="text-[10px] font-mono text-slate-400">
                  ID: {selectedTicket.id}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-2 shadow-xs">
              <div className="w-12 h-12 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-600 flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-mono font-bold text-slate-800">[ SIN TICKET SELECCIONADO ]</h3>
              <p className="text-xs font-mono text-slate-500 max-w-sm mx-auto leading-normal">
                Escanee el ticket, ingrese la patente en el buscador superior o haga clic en un vehículo de la lista.
              </p>
            </div>
          )}
        </div>

        {/* =========================================
            RIGHT PANEL: MÉTODO DE PAGO & VUELTO (6 cols)
            ========================================= */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            
            {/* 1. Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider block">
                [ MÉTODO DE PAGO ]
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: 'efectivo' as PaymentMethod,
                    label: 'Efectivo',
                    sub: 'Calcula vuelto',
                    icon: Banknote,
                  },
                  {
                    id: 'tarjeta_debito' as PaymentMethod,
                    label: 'Tarjeta POS',
                    sub: 'Transbank',
                    icon: CreditCard,
                  },
                  {
                    id: 'convenio' as PaymentMethod,
                    label: 'Convenio',
                    sub: 'Cargo empresa',
                    icon: Building2,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(item.id);
                        if (item.id !== 'efectivo') {
                          setReceivedCashInput(finalTotalToPay.toString());
                        }
                      }}
                      className={`p-3 rounded-lg border text-center font-mono transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                      <span className="text-xs font-bold leading-tight">{item.label}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {item.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Dynamic Content depending on Payment Method */}
            {paymentMethod === 'efectivo' && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                {/* Monto Recibido Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                      <Banknote className="w-3.5 h-3.5 text-slate-500" />
                      <span>Monto Recibido del Cliente</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">CLP Efectivo</span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold font-mono text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={receivedCashInput}
                      onChange={(e) => setReceivedCashInput(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 focus:border-slate-800 rounded-lg text-xl font-black font-mono text-slate-900 outline-none transition"
                    />
                  </div>
                </div>

                {/* Quick Chilean Bills Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono font-semibold text-slate-600 block">
                    Billetes rápidos:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[2000, 5000, 10000, 20000].map((bill) => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => handleQuickCash(bill)}
                        className="py-2 px-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-mono font-bold text-xs border border-slate-300 transition cursor-pointer"
                      >
                        ${bill >= 1000 ? `${bill / 1000}k` : bill}
                      </button>
                    ))}
                  </div>
                  {/* Exact amount button */}
                  <button
                    type="button"
                    onClick={() => handleQuickCash(finalTotalToPay)}
                    className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-xs border border-slate-300 transition cursor-pointer"
                  >
                    Monto Exacto (${finalTotalToPay.toLocaleString('es-CL')})
                  </button>
                </div>

                {/* VUELTO EN WIREFRAME FORMAT */}
                <div
                  className={`p-4 rounded-xl border text-center space-y-1 transition-all ${
                    isCashInsufficient
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : computedChange > 0
                      ? 'bg-slate-100 border-slate-400 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${
                      isCashInsufficient ? 'text-red-700' : 'text-slate-600'
                    }`}
                  >
                    {isCashInsufficient ? '[ MONTO INSUFICIENTE - FALTA ]' : '[ VUELTO A ENTREGAR ]'}
                  </span>

                  <div
                    className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                      isCashInsufficient ? 'text-red-700' : 'text-slate-900'
                    }`}
                  >
                    ${(isCashInsufficient ? finalTotalToPay - receivedCashNum : computedChange).toLocaleString('es-CL')}
                    <span className="text-sm font-mono font-bold ml-1.5">CLP</span>
                  </div>

                  <p className="text-[11px] font-mono text-slate-500 pt-0.5">
                    {isCashInsufficient
                      ? 'Ingrese un monto igual o superior al total'
                      : computedChange === 0
                      ? 'Pago exacto (sin vuelto)'
                      : getChangeBreakdownText(computedChange)}
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === 'tarjeta_debito' && (
              <div className="space-y-3 pt-2 border-t border-slate-100 font-mono">
                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center space-y-2">
                  <CreditCard className="w-6 h-6 text-slate-600 mx-auto" />
                  <h4 className="font-bold text-sm text-slate-900">
                    Terminal POS Transbank
                  </h4>
                  <p className="text-xs text-slate-600 leading-normal max-w-sm mx-auto">
                    1. Digite <strong>${finalTotalToPay.toLocaleString('es-CL')} CLP</strong> en el terminal POS.<br />
                    2. Inserte o acerque tarjeta.<br />
                    3. Confirme salida tras voucher aprobado.
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === 'convenio' && (
              <div className="space-y-3 pt-2 border-t border-slate-100 font-mono">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2 text-slate-800">
                    <Building2 className="w-4 h-4 text-slate-600" />
                    <h4 className="font-bold text-xs uppercase">Cargo a Convenio Empresa</h4>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">
                      Razón Social / Empresa:
                    </label>
                    <input
                      type="text"
                      value={convenioAccountName}
                      onChange={(e) => setConvenioAccountName(e.target.value)}
                      placeholder="Empresa o RUT convenio..."
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 font-bold text-xs text-slate-900 outline-none focus:border-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. BOTÓN PRINCIPAL DE CONFIRMACIÓN */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedTicket || (paymentMethod === 'efectivo' && isCashInsufficient)}
                onClick={() => handleExecuteCheckout()}
                className="w-full py-3.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-sm rounded-lg transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-slate-900"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>
                  {selectedAgreement
                    ? 'Liberar Salida de Convenio ($0 CLP)'
                    : finalTotalToPay === 0
                    ? 'Liberar Salida Gratuita ($0 CLP)'
                    : 'Confirmar Pago y Liberar Plaza'}
                </span>
                <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.2 rounded text-white font-bold ml-1">
                  Enter ↵
                </span>
              </button>
              <p className="text-[10px] font-mono text-slate-500 text-center mt-1.5">
                Libera automáticamente el slot {selectedTicket ? selectedTicket.slotCode : '...'} e imprime comprobante térmico.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CONFIRMACIÓN TICKET PERDIDO (MULTA $10.000 CON AUTORIZACIÓN PIN) */}
      <AnimatePresence>
        {showLostTicketConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0B0F19]/95 w-full max-w-sm rounded-3xl border border-white/15 p-6 shadow-glass space-y-4 font-sans text-white"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800/20 text-amber-300 border border-amber-500/30 flex items-center justify-center mx-auto shadow-xs">
                <FileQuestion className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-base text-white">
                  Declaración de Ticket Extraviado
                </h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Se aplicará una tarifa fija por pérdida de comprobante de <strong className="text-amber-300 font-mono">${tariffConfig.lostTicketFee.toLocaleString('es-CL')} CLP</strong>.
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-[#CBD5E1] block text-center">
                  PIN de Autorización Supervisor:
                </label>
                <input
                  type="password"
                  value={lostTicketSupervisorPin}
                  onChange={(e) => setLostTicketSupervisorPin(e.target.value)}
                  placeholder="PIN (Ej: 1234)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/20 text-center font-mono font-black text-lg outline-none focus:border-[#1E293B] bg-[#06080E] text-white"
                />
                {lostTicketAuthError && (
                  <p className="text-xs text-rose-400 font-bold text-center">{lostTicketAuthError}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLostTicketConfirmModal(false);
                    setLostTicketSupervisorPin('');
                    setLostTicketAuthError('');
                  }}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold text-[#CBD5E1] hover:bg-white/10 border border-white/10 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLostTicket}
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-black transition shadow-xs cursor-pointer"
                >
                  Aplicar Multa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Movimiento de Caja */}
      <ModalMovimientoCaja
        isOpen={isCashMovementModalOpen}
        onClose={() => setIsCashMovementModalOpen(false)}
        onConfirm={(type, amt, rsn, pin) => {
          registerCashMovement(type, amt, rsn, pin);
        }}
        currentCashInDrawer={currentCashInDrawer}
      />

      {/* Modal Fuga / Evasión de Barrera */}
      <ModalFugaVehiculo
        isOpen={isFugaModalOpen}
        onClose={() => setIsFugaModalOpen(false)}
        ticket={selectedTicket}
        onConfirmFuga={(ticketId, notes, supervisorPin) => {
          registerVehicleEscape(ticketId, notes, supervisorPin);
          setSelectedTicket(null);
          setSearchTerm('');
          setIsFugaModalOpen(false);
        }}
      />

      {/* BARRIER OPENED FLASH NOTIFICATION */}
      <AnimatePresence>
        {barrierOpenNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-3.5 rounded-2xl shadow-xs border border-slate-400 flex items-center space-x-3.5"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-black text-sm uppercase tracking-wider block font-mono">
                BARRIER OPENED • AUTOAPERTURA DE PISTA
              </span>
              <span className="text-xs text-slate-800">
                Barrera vehicular levantada exitosamente. Boleta fiscal SII autorizada.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          FLOATING MODAL: COBRO RÁPIDO & SALIDA GARITA (WIRE-FRAME)
          ======================================================== */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-2xl bg-white border-2 border-slate-900 rounded-lg shadow-2xl p-5 sm:p-6 space-y-4 font-mono text-slate-900 relative"
            >
              {/* 1. Modal Title Bar */}
              <div className="flex items-center justify-between border-b border-slate-300 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                  <h3 className="text-xs sm:text-sm font-black tracking-wider text-slate-900 uppercase">
                    [COBRO RÁPIDO & SALIDA GARITA]
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded">
                    Ticket #{selectedTicket.ticketCode}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded">
                    Plaza <strong className="text-slate-900">{selectedTicket.slotCode}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTicket(null);
                      setSearchTerm('');
                    }}
                    className="w-7 h-7 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 2. Hero Vehicle Plate Card */}
              <div className="bg-slate-50 border border-slate-300 rounded p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  {/* Chilean License Plate Badge */}
                  <div className="bg-white border-2 border-slate-900 rounded px-3 py-1.5 font-mono text-xl sm:text-2xl font-black text-slate-900 tracking-widest flex items-center space-x-2 shrink-0">
                    <span className="text-[10px] bg-slate-900 text-white font-mono font-bold px-1.5 py-0.5 rounded">CHI</span>
                    <span>{selectedTicket.plateNumber}</span>
                  </div>

                  <div className="space-y-0.5 text-left">
                    <div className="font-bold text-sm sm:text-base text-slate-900">
                      {selectedTicket.vehicleType === 'Camioneta'
                        ? 'Toyota Hilux 4x4 (Particular)'
                        : `${selectedTicket.vehicleType} (Particular)`}
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                      Ingreso: <strong className="text-slate-900">{new Date(selectedTicket.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs</strong> • Estadía: <strong className="text-slate-900">{Math.floor((currentStay?.durationMinutes || 0) / 60)}h {(currentStay?.durationMinutes || 0) % 60}m</strong>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    TOTAL A PAGAR
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                    ${finalTotalToPay.toLocaleString('es-CL')}
                    <span className="text-xs font-mono font-bold text-slate-500 ml-1.5">CLP</span>
                  </div>
                </div>
              </div>

              {/* 3. Payment Method Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    [ MÉTODO DE PAGO ]
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    ATAJOS: [1, 2, 3]
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* Button 1: Efectivo */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('efectivo');
                    }}
                    className={`p-3 rounded border text-left transition cursor-pointer relative ${
                      paymentMethod === 'efectivo'
                        ? 'bg-slate-100 border-2 border-slate-900 text-slate-900 shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Banknote className="w-5 h-5 text-slate-900" />
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        paymentMethod === 'efectivo' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        1
                      </span>
                    </div>
                    <div className="font-bold text-xs">Efectivo</div>
                    <div className="text-[10px] text-slate-500">Cálculo de vuelto</div>
                  </button>

                  {/* Button 2: Tarjeta POS */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('tarjeta_debito');
                      setReceivedCashInput(finalTotalToPay.toString());
                    }}
                    className={`p-3 rounded border text-left transition cursor-pointer relative ${
                      paymentMethod === 'tarjeta_debito'
                        ? 'bg-slate-100 border-2 border-slate-900 text-slate-900 shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <CreditCard className="w-5 h-5 text-slate-900" />
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        paymentMethod === 'tarjeta_debito' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        2
                      </span>
                    </div>
                    <div className="font-bold text-xs">Tarjeta POS</div>
                    <div className="text-[10px] text-slate-500">Transbank / Redelcom</div>
                  </button>

                  {/* Button 3: Transferencia */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('transferencia');
                      setReceivedCashInput(finalTotalToPay.toString());
                    }}
                    className={`p-3 rounded border text-left transition cursor-pointer relative ${
                      paymentMethod === 'transferencia'
                        ? 'bg-slate-100 border-2 border-slate-900 text-slate-900 shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Send className="w-5 h-5 text-slate-900" />
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        paymentMethod === 'transferencia' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        3
                      </span>
                    </div>
                    <div className="font-bold text-xs">Transferencia</div>
                    <div className="text-[10px] text-slate-500">Banco / Comprobante</div>
                  </button>
                </div>
              </div>

              {/* 4. Cash Calculation & Large Change Panel (when paymentMethod === 'efectivo') */}
              {paymentMethod === 'efectivo' && (
                <div className="bg-slate-50 border border-slate-300 rounded p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 text-[11px]">
                      <Banknote className="w-4 h-4 text-slate-900" />
                      <span>[ CÁLCULO DE EFECTIVO Y VUELTO ]</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      Base Garita: $50.000 CLP
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickCash(finalTotalToPay)}
                      className={`py-2 px-1 rounded text-xs font-mono font-bold border transition cursor-pointer ${
                        receivedCashNum === finalTotalToPay
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Exacto ${finalTotalToPay.toLocaleString('es-CL')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCash(5000)}
                      className={`py-2 px-1 rounded text-xs font-mono font-bold border transition cursor-pointer ${
                        receivedCashNum === 5000
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      $5.000 {receivedCashNum === 5000 ? '✓' : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCash(10000)}
                      className={`py-2 px-1 rounded text-xs font-mono font-bold border transition cursor-pointer ${
                        receivedCashNum === 10000
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      $10.000 {receivedCashNum === 10000 ? '✓' : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCash(20000)}
                      className={`py-2 px-1 rounded text-xs font-mono font-bold border transition cursor-pointer ${
                        receivedCashNum === 20000
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      $20.000 {receivedCashNum === 20000 ? '✓' : ''}
                    </button>
                  </div>

                  {/* Two Columns: Efectivo Recibido vs Vuelto al Conductor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    
                    {/* Column A: Efectivo Recibido */}
                    <div className="bg-white border border-slate-300 rounded p-3 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        EFECTIVO RECIBIDO
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-xl font-bold font-mono text-slate-400">$</span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={receivedCashInput}
                          onChange={(e) => setReceivedCashInput(e.target.value)}
                          placeholder="0"
                          className="w-full text-2xl font-bold font-mono text-slate-900 bg-transparent outline-none border-b border-slate-400 focus:border-slate-900"
                        />
                        <span className="text-xs font-mono text-slate-500">CLP</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {getReceivedBillDescription(receivedCashNum || finalTotalToPay)}
                      </p>
                    </div>

                    {/* Column B: Vuelto al Conductor [LISTO] */}
                    <div
                      className={`rounded p-3 border-2 space-y-1 transition-all ${
                        isCashInsufficient
                          ? 'bg-slate-100 border-slate-800'
                          : computedChange > 0
                          ? 'bg-slate-100 border-slate-900'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-700">
                          {isCashInsufficient ? 'FALTA DINERO' : 'VUELTO AL CONDUCTOR'}
                        </span>
                        {!isCashInsufficient && (
                          <span className="text-[9px] font-mono font-bold bg-slate-900 text-white px-1.5 py-0.2 rounded uppercase">
                            LISTO
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                        ${(isCashInsufficient ? finalTotalToPay - receivedCashNum : computedChange).toLocaleString('es-CL')}
                        <span className="text-xs font-mono ml-1 text-slate-600">CLP</span>
                      </div>
                      <p className="text-[10px] text-slate-600">
                        {isCashInsufficient
                          ? 'Monto menor al importe requerido'
                          : getChangeBreakdownText(computedChange)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Bottom Action Row: Cancelar [ESC] and Confirmar Salida y Abrir Barrera [ENTER] */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTicket(null);
                    setSearchTerm('');
                  }}
                  className="w-full sm:w-auto px-4 py-3 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-mono font-bold transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <span>Cancelar</span>
                  <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded border border-slate-300 text-slate-700">
                    ESC
                  </span>
                </button>

                <button
                  type="button"
                  disabled={paymentMethod === 'efectivo' && isCashInsufficient}
                  onClick={() => handleExecuteCheckout()}
                  className="w-full sm:flex-1 py-3 px-6 rounded bg-slate-900 hover:bg-black text-white font-mono font-bold text-xs transition border border-slate-900 flex flex-col items-center justify-center space-y-0.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>CONFIRMAR SALIDA Y ABRIR BARRERA</span>
                    <span className="font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded text-white ml-1">
                      ENTER ↵
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-300">
                    Emisión Boleta SII + Apertura de Pista
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Ticket Térmico de Salida Procesado */}
      {completedTicket && (
        <TicketModal
          ticket={completedTicket}
          onClose={() => setCompletedTicket(null)}
          title="Comprobante de Salida y Pago"
        />
      )}
    </div>
  );
};
