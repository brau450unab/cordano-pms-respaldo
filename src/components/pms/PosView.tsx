import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PaymentMethod } from '../../types';
import { useParking } from '../../context/ParkingContext';

import { AntifraudPinModal, PinModalType } from './AntifraudPinModal';
import { PatioMatrix2D } from '../common/PatioMatrix2D';
import { generateTicketPdf } from '../../utils/pdfGenerator';

export interface PatioVehicle {
  slot: number;
  slotCode?: string;
  plate: string;
  cat: 'Sedán' | 'SUV' | 'Moto';
  rate: number;
  entry: string;
  durationMin: number;
  client?: string;
  phone?: string;
  obs?: string;
  ticketId?: string;
  discount?: number;
  surcharge?: number;
}

export interface CashHistoryLog {
  time: string;
  type: 'APERTURA' | 'INGRESO' | 'COBRO' | 'RETIRO' | 'INGRESO_MANUAL';
  desc: string;
  method: string;
  amount: number;
  plate: string;
  isEgreso: boolean;
}

interface PosViewProps {
  initialSubtab?: 'entry' | 'exit' | 'history';
  activeMobileTab?: 'supervision' | 'patio' | 'flujo' | 'reportes' | 'ajustes' | 'plano' | 'cronologia' | string;
  onMobileTabChange?: (tab: any) => void;
  activeVehicles: PatioVehicle[];
  historyLogs: CashHistoryLog[];
  onOpenTicketPreview: (data: {
    plate: string;
    category: 'Sedán' | 'SUV' | 'Moto';
    rate: number;
    name: string;
    phone: string;
    obs: string;
    slot: number;
  }) => void;
  onProcessCheckout: (
    vehicle: PatioVehicle,
    method: PaymentMethod,
    total: number,
    cashGiven?: number,
    change?: number,
    discount?: number,
    discountReason?: string
  ) => void;
  onOpenManualTransaction: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate?: (screen: string) => void;
  onInitiateOpenShift?: () => void;
}

export const PosView: React.FC<PosViewProps> = ({
  initialSubtab = 'entry',
  activeMobileTab,
  onMobileTabChange,
  activeVehicles,
  historyLogs,
  onOpenTicketPreview,
  onProcessCheckout,
  onOpenManualTransaction,
  onShowToast,
  onNavigate,
  onInitiateOpenShift,
}) => {
  const {
    currentShift,
    isShiftOpen,
    isShiftOwner,
    isViewerOnly,
    tickets,
    addPendingApproval,
    pendingApprovals,
    resolvePendingApproval,
    user,
    printFiscalReceipt,
    findCustomerByPlate,
    findAgreementByPlate,
    moveOrSwapVehicleSlot,
  } = useParking();
  const isShiftClosed = !isShiftOpen;
  const isSupervisorLiveMode = user?.role === 'administrador' || user?.role === 'supervisor';
  const [posTab, setPosTab] = useState<'entry' | 'exit' | 'history'>(initialSubtab);

  // Mobile Operador States (RBAC Garita Móvil)
  const [operadorMobileTab, setOperadorMobileTab] = useState<'entry' | 'exit' | 'plano' | 'caja'>(
    initialSubtab === 'exit' ? 'exit' : initialSubtab === 'history' ? 'caja' : 'entry'
  );

  useEffect(() => {
    if (initialSubtab === 'exit') setOperadorMobileTab('exit');
    else if (initialSubtab === 'history') setOperadorMobileTab('caja');
    else if (initialSubtab === 'entry') setOperadorMobileTab('entry');
  }, [initialSubtab]);

  // Mobile Supervisor States & Filters
  const [internalMobileTab, setInternalMobileTab] = useState<'plano' | 'cronologia' | 'supervision' | 'finanzas' | 'patio' | 'flujo' | 'reportes' | 'ajustes' | string>('plano');
  const mobileTab = activeMobileTab || internalMobileTab;
  const setMobileTab = (tab: any) => {
    setInternalMobileTab(tab);
    if (onMobileTabChange) onMobileTabChange(tab);
  };
  const [cronologiaFilter, setCronologiaFilter] = useState<'TODOS' | 'INGRESOS' | 'SALIDAS'>('TODOS');
  const [cronologiaSearch, setCronologiaSearch] = useState('');
  const [selectedMobileVehicle, setSelectedMobileVehicle] = useState<PatioVehicle | null>(null);
  const [showMobileGaritaPos, setShowMobileGaritaPos] = useState(false);

  // Drag & Drop 2D Matrix State (Reubicación interactiva de vehículos en patio)
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [reassignModalVehicle, setReassignModalVehicle] = useState<PatioVehicle | null>(null);

  // Entry State
  const [entryPlate, setEntryPlate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [entryCategory, setEntryCategory] = useState<'Sedán' | 'SUV' | 'Moto'>('Sedán');
  const [entryRate, setEntryRate] = useState(35);
  const [entryName, setEntryName] = useState('');
  const [entryPhone, setEntryPhone] = useState('');
  const [entryObs, setEntryObs] = useState('');
  const plateInputRef = useRef<HTMLInputElement>(null);

  // Validador técnico de patentes chilenas (Normativa Registro Civil & MTT)
  const plateValidation = useMemo(() => {
    const clean = entryPlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!clean || clean.length < 2) {
      return { isValidChilean: false, formatDesc: 'Ingrese caracteres de patente', isForeignOrCustom: false };
    }

    // 1. Formato nuevo chileno (4 letras + 2 números: ej. BBCL10, ABCD12)
    if (/^[A-Z]{4}\d{2}$/.test(clean)) {
      const strictConsonants = /^[BCDFGHJKLPRSTVWXYZ]{4}\d{2}$/.test(clean);
      return {
        isValidChilean: true,
        formatDesc: strictConsonants
          ? 'Patente chilena verificada (Formato estándar post-2007)'
          : 'Patente chilena verificada (4 letras + 2 números)',
        isForeignOrCustom: false,
      };
    }

    // 2. Formato tradicional chileno (2 letras + 4 números: ej. AB1234)
    if (/^[A-Z]{2}\d{4}$/.test(clean)) {
      return {
        isValidChilean: true,
        formatDesc: 'Patente chilena verificada (Formato clásico pre-2007)',
        isForeignOrCustom: false,
      };
    }

    // 3. Formato motocicleta chilena (3 letras + 2/3 números o 2 letras + 3 números)
    if (/^[A-Z]{3}\d{2,3}$/.test(clean) || /^[A-Z]{2}\d{3}$/.test(clean)) {
      return {
        isValidChilean: true,
        formatDesc: 'Patente motocicleta chilena verificada',
        isForeignOrCustom: false,
      };
    }

    // 4. Formato especial / extranjero (Permitido para vehículos de Argentina, Bolivia, Perú, diplomáticos, etc.)
    return {
      isValidChilean: false,
      formatDesc: clean.length >= 3 ? 'Vehículo extranjero / Formato especial (Permitido)' : 'Incompleto',
      isForeignOrCustom: clean.length >= 3,
    };
  }, [entryPlate]);

  // Detección proactiva de cliente frecuente o convenio registrado
  const detectedCustomer = useMemo(() => {
    const clean = entryPlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length < 3) return undefined;

    // 1. Búsqueda en directorio de clientes
    if (findCustomerByPlate) {
      const fromCust = findCustomerByPlate(clean);
      if (fromCust) return { name: fromCust.name, phone: fromCust.phone || '' };
    }

    // 2. Búsqueda en convenios
    if (findAgreementByPlate) {
      const fromAg = findAgreementByPlate(clean);
      if (fromAg) return { name: fromAg.contactName || fromAg.companyName, phone: fromAg.phone || '' };
    }

    // 3. Búsqueda en historial de tickets previos
    const prevTicket = tickets.find(
      (t) => t.plateNumber.toUpperCase() === clean && (t.customerName || t.customerPhone || (t.notes && t.notes !== 'Particular'))
    );
    if (prevTicket) {
      return {
        name: prevTicket.customerName || (prevTicket.notes && prevTicket.notes !== 'Particular' ? prevTicket.notes : 'Particular'),
        phone: prevTicket.customerPhone || '',
      };
    }

    return undefined;
  }, [entryPlate, findCustomerByPlate, findAgreementByPlate, tickets]);

  const detectedAgreement = useMemo(() => {
    const clean = entryPlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length >= 3 && findAgreementByPlate) {
      return findAgreementByPlate(clean);
    }
    return undefined;
  }, [entryPlate, findAgreementByPlate]);

  useEffect(() => {
    if (detectedCustomer) {
      if (!entryName || entryName === 'Particular') {
        setEntryName(detectedCustomer.name);
      }
      if (!entryPhone && detectedCustomer.phone) {
        setEntryPhone(detectedCustomer.phone);
      }
    }
  }, [detectedCustomer]);

  // Exit State
  const [exitSearchQuery, setExitSearchQuery] = useState('');
  const [selectedExitVehicle, setSelectedExitVehicle] = useState<PatioVehicle | null>(null);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('tarjeta');
  const [cashGiven, setCashGiven] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedSurcharge, setAppliedSurcharge] = useState(0);
  const [pinModalType, setPinModalType] = useState<PinModalType>(null);

  const exitSearchInputRef = useRef<HTMLInputElement>(null);

  // Focus Management
  useEffect(() => {
    if (posTab === 'entry' && plateInputRef.current) {
      plateInputRef.current.focus();
    } else if (posTab === 'exit' && exitSearchInputRef.current && !selectedExitVehicle) {
      exitSearchInputRef.current.focus();
    }
  }, [posTab, selectedExitVehicle]);

  // Entry Handlers
  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isShiftClosed) {
      onShowToast('Turno cerrado: debe aperturar un nuevo turno con fondo inicial ($ 50.000 CLP) para registrar ingresos.', 'error');
      return;
    }
    if (isViewerOnly) {
      onShowToast(`Modo Solo Visualización: El turno fue abierto por ${currentShift?.operatorName || 'otro operador'}. Solo el titular tiene permisos operativos.`, 'error');
      return;
    }
    if (isSupervisorLiveMode) {
      onShowToast('Modo Supervisión Activo: La emisión de tickets físicos está reservada al operador de turno para resguardar la caja.', 'error');
      return;
    }
    const cleanPlate = entryPlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleanPlate.length < 2) {
      onShowToast('Ingrese una patente válida.', 'error');
      return;
    }
    const isInside = activeVehicles.some((v) => v.plate === cleanPlate);
    if (isInside) {
      onShowToast(`El vehículo ${cleanPlate} ya se encuentra dentro del recinto.`, 'error');
      return;
    }

    const availableSlotIndex = Array.from({ length: 30 }, (_, i) => i + 1).find(
      (s) => !activeVehicles.some((v) => v.slot === s)
    );
    const targetSlot = selectedSlot || availableSlotIndex;
    if (!targetSlot) {
      onShowToast('Patio lleno, no hay cupos disponibles', 'error');
      return;
    }

    if (selectedSlot && activeVehicles.some((v) => v.slot === selectedSlot)) {
      onShowToast(`El cupo #${selectedSlot} ya está ocupado por otro vehículo. Seleccione otro cupo o use asignación libre.`, 'error');
      return;
    }

    onOpenTicketPreview({
      plate: cleanPlate,
      category: entryCategory,
      rate: entryRate,
      name: entryName.trim() || (detectedCustomer?.name || 'Particular'),
      phone: entryPhone.trim() || (detectedCustomer?.phone || ''),
      obs: entryObs.trim(),
      slot: targetSlot,
    });

    setEntryPlate('');
    setEntryName('');
    setEntryPhone('');
    setEntryObs('');
    setSelectedSlot(null);
  };

  // Exit Handlers: Ordenados por hora de entrada del más antiguo al más nuevo (mayor estadía primero)
  const exitFilteredVehicles = exitSearchQuery.trim().length > 0
      ? activeVehicles
          .filter(
            (v) =>
              v.plate.toUpperCase().includes(exitSearchQuery.trim().toUpperCase()) ||
              (v.ticketId && v.ticketId.toUpperCase().includes(exitSearchQuery.trim().toUpperCase()))
          )
          .sort((a, b) => {
            // Vehículos con más duración (más antiguos en patio) primero
            return (b.durationMin || 0) - (a.durationMin || 0);
          })
      : [];

  const loadVehicleIntoExit = (v: PatioVehicle) => {
    setSelectedExitVehicle(v);
    setAppliedDiscount(v.discount || 0);
    setAppliedSurcharge(v.surcharge || 0);
    const baseVal = v.durationMin * (v.rate || 25);
    const roundedCash = Math.max(2000, Math.ceil(baseVal / 1000) * 1000);
    setCashGiven(roundedCash.toString());
  };

  const baseTotal = selectedExitVehicle ? selectedExitVehicle.durationMin * (selectedExitVehicle.rate || 25) : 0;
  const finalTotal = Math.max(0, baseTotal - appliedDiscount + appliedSurcharge);
  const netSubtotal = Math.round(finalTotal / 1.19);
  const ivaAmount = finalTotal - netSubtotal;
  const cashChange = Math.max(0, (parseFloat(cashGiven) || 0) - finalTotal);

  const handleConfirmCheckout = () => {
    if (isShiftClosed) {
      onShowToast('Turno cerrado: debe aperturar un turno para cobrar y liquidar vehículos.', 'error');
      return;
    }
    if (isViewerOnly) {
      onShowToast(`Modo Solo Visualización: El turno activo está a cargo de ${currentShift?.operatorName || 'otro operador'}. Solo el titular puede liquidar cobros.`, 'error');
      return;
    }
    if (isSupervisorLiveMode) {
      onShowToast('Modo Supervisión Activo: El cobro y emisión de boleta fiscal está reservado al cajero del turno físico.', 'error');
      return;
    }
    if (!selectedExitVehicle) {
      onShowToast('Seleccione un vehículo para liquidar su salida', 'error');
      return;
    }
    const methodMapping: Record<'efectivo' | 'tarjeta' | 'transferencia', PaymentMethod> = {
      efectivo: 'efectivo',
      tarjeta: 'tarjeta_debito',
      transferencia: 'transferencia',
    };
    const givenAmount = checkoutPaymentMethod === 'efectivo' ? (parseFloat(cashGiven) || finalTotal) : finalTotal;
    onProcessCheckout(
      selectedExitVehicle,
      methodMapping[checkoutPaymentMethod],
      finalTotal,
      givenAmount,
      cashChange,
      appliedDiscount,
      appliedDiscount > 0 ? 'Descuento Comercial Autorizado' : undefined
    );
    setSelectedExitVehicle(null);
    setExitSearchQuery('');
  };

  const handlePinConfirm = (payload: { type: 'DISCOUNT' | 'LOST_TICKET'; pin: string; reason: string; discountAmount?: number; deferred?: boolean; }) => {
    if (isShiftClosed || isViewerOnly) {
      onShowToast('Acción bloqueada: solo el titular del turno activo puede aplicar excepciones o descuentos.', 'error');
      setPinModalType(null);
      return;
    }
    if (payload.deferred) {
      addPendingApproval({
        type: payload.type,
        description: payload.reason,
        amount: payload.type === 'DISCOUNT' ? (payload.discountAmount || 0) : 0,
        operatorId: 'operador-1',
      });
      onShowToast(`Acción diferida: ${payload.reason}. Aprobación pendiente para cierre de turno.`, 'info');
      if (payload.type === 'DISCOUNT') {
        setAppliedDiscount(payload.discountAmount || 0);
      }
      setPinModalType(null);
      return;
    }

    if (payload.type === 'DISCOUNT') {
      const disc = payload.discountAmount || 0;
      setAppliedDiscount(disc);
      onShowToast(`Descuento comercial autorizado ($${disc.toLocaleString('es-CL')}).`, 'success');
    } else {
      // Conforme a Ley 20.967, no se aplica recargo monetario punitivo ($0 recargo)
      setAppliedSurcharge(0);
      onShowToast('Comprobante extraviado registrado: Cobro liquidado por tiempo efectivo según patente.', 'info');
    }
    setPinModalType(null);
  };

  const runningBalance = historyLogs.reduce((acc, item) => (item.isEgreso ? acc - item.amount : acc + item.amount), 0);

  // ── SUPERVISIÓN MÓVIL: MÉTRICAS & PERMANENCIAS ──
  const totalSlotsCount = 30;
  const occupiedCount = activeVehicles.length;
  const freeSlotsCount = Math.max(0, totalSlotsCount - occupiedCount);
  const occupancyPercent = Math.round((occupiedCount / totalSlotsCount) * 100);

  const averageStayMin = useMemo(() => {
    if (activeVehicles.length === 0) return 0;
    const sum = activeVehicles.reduce((acc, v) => acc + (v.durationMin || 0), 0);
    return Math.round(sum / activeVehicles.length);
  }, [activeVehicles]);

  const overstayVehicles = useMemo(() => {
    return activeVehicles.filter((v) => (v.durationMin || 0) >= 120);
  }, [activeVehicles]);

  const paidTickets = useMemo(() => {
    return tickets.filter((t) => t.status === 'pagado');
  }, [tickets]);

  const todayRevenue = useMemo(() => {
    return paidTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  }, [paidTickets]);

  const revenueByMethod = useMemo(() => {
    const cash = paidTickets
      .filter((t) => t.paymentMethod === 'efectivo')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const pos = paidTickets
      .filter((t) => t.paymentMethod === 'tarjeta_debito' || t.paymentMethod === 'tarjeta_credito')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const transfer = paidTickets
      .filter((t) => t.paymentMethod === 'transferencia' || t.paymentMethod === 'convenio')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    return { cash, pos, transfer };
  }, [paidTickets]);

  const formatStayDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Cronología unificada de entradas y salidas en tiempo real
  const timelineEvents = useMemo(() => {
    const events: {
      id: string;
      type: 'INGRESO' | 'SALIDA';
      plate: string;
      time: string;
      timestamp: number;
      slotCode: string;
      category: string;
      durationMin?: number;
      amount?: number;
      paymentMethod?: string;
      ticketCode?: string;
    }[] = [];

    tickets.forEach((t) => {
      const entryTime = new Date(t.entryTime).getTime();
      events.push({
        id: `entry-${t.id}`,
        type: 'INGRESO',
        plate: t.plateNumber,
        time: new Date(t.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        timestamp: entryTime,
        slotCode: t.slotCode || 'Patio',
        category: t.vehicleType,
        ticketCode: t.ticketCode || t.id,
      });

      if (t.status === 'pagado' && t.exitTime) {
        const exitTime = new Date(t.exitTime).getTime();
        events.push({
          id: `exit-${t.id}`,
          type: 'SALIDA',
          plate: t.plateNumber,
          time: new Date(t.exitTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
          timestamp: exitTime,
          slotCode: t.slotCode || 'Patio',
          category: t.vehicleType,
          durationMin: t.durationMinutes || Math.max(1, Math.round((exitTime - entryTime) / 60000)),
          amount: t.totalAmount || 0,
          paymentMethod: t.paymentMethod || 'efectivo',
          ticketCode: t.ticketCode || t.id,
        });
      }
    });

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }, [tickets]);

  const filteredTimelineEvents = useMemo(() => {
    let list = timelineEvents;
    if (cronologiaFilter === 'INGRESOS') {
      list = list.filter((e) => e.type === 'INGRESO');
    } else if (cronologiaFilter === 'SALIDAS') {
      list = list.filter((e) => e.type === 'SALIDA');
    }

    if (cronologiaSearch.trim()) {
      const q = cronologiaSearch.trim().toUpperCase();
      list = list.filter((e) => e.plate.includes(q) || (e.ticketCode && e.ticketCode.toUpperCase().includes(q)));
    }

    return list;
  }, [timelineEvents, cronologiaFilter, cronologiaSearch]);

  // Layout Render
  return (
    <div className="p-3 sm:p-6 lg:p-8 2xl:px-12 w-full max-w-[1850px] mx-auto min-h-screen bg-[#F8FAFC] animate-fade-in-up font-sans pb-24 md:pb-8">
      {/* ── BANNER MODO SUPERVISIÓN EN VIVO (SOLO LECTURA) PARA ADMINISTRADORES ── */}
      {isSupervisorLiveMode && (
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#1E1E2F] text-white border border-purple-500/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/30 text-purple-300 border border-purple-500/50 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              👁️
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  MODO SUPERVISIÓN EN VIVO (SOLO LECTURA)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/40">
                  Inspección Gerencial
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                Turno de garita en curso a cargo del Operador: <strong className="text-white underline decoration-[#E2498A] underline-offset-2">{currentShift?.operatorName || 'Operador en Garita'}</strong>.
                En este modo puedes consultar patentes, tiempos de estadía y telemetría en tiempo real. La generación de tickets y cobros está restringida al cajero físico.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sincronizado en Tiempo Real
            </span>
          </div>
        </div>
      )}

      {/* ── MODAL BLOQUEO DE TURNO (GARITA POS - RESPONSIVE) ── */}
      {isShiftClosed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-2xl text-center space-y-4 sm:space-y-5 animate-fade-in-up">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 mx-auto flex items-center justify-center text-2xl sm:text-3xl">
              🔒
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">Punto de Venta Bloqueado</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                El turno actual se encuentra cerrado. Para realizar nuevos ingresos o cobros debe aperturar un nuevo turno declarando el fondo inicial ($ 50.000 CLP).
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onInitiateOpenShift) {
                    onInitiateOpenShift();
                  } else if (onNavigate) {
                    onNavigate("menu");
                  }
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>🚀 Iniciar Turno (Apertura de Caja)</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate ? onNavigate("menu") : undefined}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                Volver al Menú Principal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── VERSIÓN MÓVIL EXCLUSIVA: ADAPTADA POR ROL (RBAC) (LG:HIDDEN) ── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div className="block lg:hidden space-y-4 pb-28">
        {!isSupervisorLiveMode ? (
          /* ============================================================ */
          /* MODO GARITA OPERADOR MÓVIL: OPERACIÓN DIARIA DIRECTA         */
          /* ============================================================ */
          <div className="space-y-3.5">
            {/* Banner de Estado de Turno */}
            {isShiftClosed ? (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-amber-900">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🔒</span>
                  <div>
                    <span className="font-extrabold text-xs text-amber-950 block">Garita Bloqueada: Turno Cerrado</span>
                    <span className="text-[10px] text-amber-800">Declare fondo de $50.000 CLP para operar.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onInitiateOpenShift ? onInitiateOpenShift() : undefined}
                  className="px-3.5 py-2 rounded-xl bg-[#E2498A] text-white text-xs font-bold shrink-0 shadow-xs active:scale-95 cursor-pointer"
                >
                  Iniciar Turno
                </button>
              </div>
            ) : isViewerOnly ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-2.5 text-blue-900">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👁️</span>
                  <div>
                    <span className="font-extrabold text-xs block">Modo Solo Visualización</span>
                    <span className="text-[10px] text-blue-700">Turno abierto por {currentShift?.operatorName || 'otro operador'}.</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-300 uppercase shrink-0">
                  Solo Lectura
                </span>
              </div>
            ) : (
              <div className="p-3 bg-[#1E1E2F] text-white border border-slate-800 rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E2498A] flex items-center justify-center text-xs font-black shrink-0">
                    👷
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-white truncate">
                      {currentShift?.operatorName || user?.name || 'Operador en Garita'}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-300 font-mono">
                      <span className="text-pink-300 font-bold">{currentShift?.id || 'TRN-2026-ACT'}</span>
                      <span>·</span>
                      <span className="text-emerald-400 font-bold">🟢 En Turno</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right shrink-0">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Patio Serrano</span>
                    <span className="text-xs font-black font-mono text-emerald-300">
                      {freeSlotsCount} libres ({occupiedCount}/30)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate ? onNavigate('operacion_cierre') : undefined}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                    title="Cerrar turno y realizar arqueo ciego"
                  >
                    <span>🔒</span>
                    <span className="hidden sm:inline">Cerrar Turno</span>
                    <span className="sm:hidden">Cerrar</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4 Tabs Operativos del Cajero */}
            <div className="grid grid-cols-4 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs gap-1">
              <button
                type="button"
                onClick={() => setOperadorMobileTab('entry')}
                className={`py-2 px-1 rounded-xl text-xs font-extrabold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer min-h-[46px] ${
                  operadorMobileTab === 'entry'
                    ? 'bg-[#E2498A] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>🚗</span>
                <span className="text-[11px] truncate">Ingreso</span>
              </button>
              <button
                type="button"
                onClick={() => setOperadorMobileTab('exit')}
                className={`py-2 px-1 rounded-xl text-xs font-extrabold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer min-h-[46px] ${
                  operadorMobileTab === 'exit'
                    ? 'bg-[#E2498A] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>💳</span>
                <span className="text-[11px] truncate">Cobro</span>
              </button>
              <button
                type="button"
                onClick={() => setOperadorMobileTab('plano')}
                className={`py-2 px-1 rounded-xl text-xs font-extrabold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer min-h-[46px] ${
                  operadorMobileTab === 'plano'
                    ? 'bg-[#E2498A] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>🗺️</span>
                <span className="text-[11px] truncate">Patio 2D</span>
              </button>
              <button
                type="button"
                onClick={() => setOperadorMobileTab('caja')}
                className={`py-2 px-1 rounded-xl text-xs font-extrabold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer min-h-[46px] ${
                  operadorMobileTab === 'caja'
                    ? 'bg-[#E2498A] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>💰</span>
                <span className="text-[11px] truncate">Caja</span>
              </button>
            </div>

            {/* TAB OPERADOR: 1. INGRESO VEHICULAR */}
            {operadorMobileTab === 'entry' && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-fade-in font-sans">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎟️</span>
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                        Registro de Entrada
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium">Emisión de ticket físico con QR</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Cupos: {freeSlotsCount}/30
                  </span>
                </div>

                <form onSubmit={handleEntrySubmit} className="space-y-4">
                  {/* Indicador de Cupo Seleccionado Arriba de Patente */}
                  {selectedSlot ? (
                    <div className="flex items-center justify-between p-2.5 bg-pink-50/90 border-2 border-[#E2498A] rounded-xl animate-fade-in shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📍</span>
                        <div>
                          <span className="text-xs font-black uppercase text-[#E2498A] block">
                            Cupo Asignado: {selectedSlot <= 15 ? `A-${String(selectedSlot).padStart(2, '0')}` : `B-${String(selectedSlot).padStart(2, '0')}`}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">Plaza fijada para el próximo ingreso</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSlot(null)}
                        className="text-[10px] font-bold text-rose-600 bg-white border border-rose-200 px-2 py-0.5 rounded-lg cursor-pointer"
                      >
                        ✕ Libre
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span>🎯</span> Asignación: <strong className="text-slate-800">Libre / Automática</strong>
                      </span>
                      <span className="text-[10px] text-slate-400">(Toca un cupo en Patio 2D para fijar)</span>
                    </div>
                  )}

                  {/* Campo Patente Táctil Grande */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                      Placa Patente del Vehículo
                    </label>
                    <input
                      ref={plateInputRef}
                      type="text"
                      maxLength={8}
                      value={entryPlate}
                      onChange={(e) => setEntryPlate(e.target.value.toUpperCase())}
                      placeholder="ABCD12..."
                      className="w-full text-center py-3 text-2xl font-black font-mono tracking-widest uppercase rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#E2498A] focus:outline-none transition-all shadow-inner"
                    />
                    
                    {/* Validador Técnico de Patente Chilena con Check Verde */}
                    {entryPlate.trim().length >= 2 ? (
                      <div className="mt-1.5 flex items-center justify-center">
                        {plateValidation.isValidChilean ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 animate-fade-in">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ✓ {plateValidation.formatDesc}
                          </span>
                        ) : plateValidation.isForeignOrCustom ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300 animate-fade-in">
                            <span>🌐</span>
                            {plateValidation.formatDesc}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 text-center block">
                            Formato estándar: 4 letras + 2 números o 2 letras + 4 números
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 text-center block mt-1">
                        Formato chileno estándar (4 letras + 2 números o 2 letras + 4 números)
                      </span>
                    )}
                  </div>

                  {/* Selector de Categoría de Tarifa */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Categoría &amp; Tarifa por Minuto
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { cat: 'Sedán', rate: 35, icon: '🚗' },
                        { cat: 'SUV', rate: 45, icon: '🚙' },
                        { cat: 'Moto', rate: 25, icon: '🏍️' },
                      ].map((item) => (
                        <button
                          key={item.cat}
                          type="button"
                          onClick={() => {
                            setEntryCategory(item.cat as any);
                            setEntryRate(item.rate);
                          }}
                          className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                            entryCategory === item.cat
                              ? 'border-[#E2498A] bg-[#FFF5F8] text-[#E2498A] shadow-xs'
                              : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-base">{item.icon}</div>
                          <div className="font-extrabold text-xs mt-0.5">{item.cat}</div>
                          <div className="text-[10px] font-mono font-bold mt-0.5">
                            ${item.rate}/min
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Datos del Cliente y WhatsApp (Activos y Visibles) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">👤</span>
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Datos del Cliente & WhatsApp
                        </span>
                      </div>
                      {detectedCustomer && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          ✓ Cliente Registrado
                        </span>
                      )}
                    </div>

                    {detectedAgreement && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 font-medium">
                        🏢 Convenio: <strong>{detectedAgreement.companyName || detectedAgreement.contactName}</strong>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Nombre del Cliente / Particular
                        </label>
                        <input
                          type="text"
                          value={entryName}
                          onChange={(e) => setEntryName(e.target.value)}
                          placeholder="Particular / Nombre cliente..."
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-[#E2498A]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-between">
                          <span>Teléfono Móvil (WhatsApp)</span>
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> wa.me
                          </span>
                        </label>
                        <input
                          type="tel"
                          value={entryPhone}
                          onChange={(e) => setEntryPhone(e.target.value)}
                          placeholder="+56 9 1234 5678"
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#E2498A]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Observación de Ingreso / Daños Preexistentes
                        </label>
                        <input
                          type="text"
                          value={entryObs}
                          onChange={(e) => setEntryObs(e.target.value)}
                          placeholder="Detalles físicos, rayones preexistentes..."
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#E2498A]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botón Principal Emitir Ticket */}
                  <button
                    type="submit"
                    disabled={!entryPlate || entryPlate.replace(/[^a-zA-Z0-9]/g, '').length < 3 || isShiftClosed || isViewerOnly}
                    className={`w-full min-h-[52px] py-3.5 px-4 rounded-2xl text-white text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md ${
                      !entryPlate || entryPlate.replace(/[^a-zA-Z0-9]/g, '').length < 3 || isShiftClosed || isViewerOnly
                        ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                        : 'bg-[#E2498A] hover:bg-[#C83472] active:scale-[0.99] cursor-pointer'
                    }`}
                  >
                    <span>🎟️</span>
                    <span>
                      {isShiftClosed
                        ? 'Turno Cerrado (POS Bloqueado)'
                        : isViewerOnly
                        ? 'Modo Solo Visualización'
                        : 'Emitir Ticket & Asignar Cupo'}
                    </span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB OPERADOR: 2. COBRO & SALIDA VEHICULAR */}
            {operadorMobileTab === 'exit' && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-fade-in font-sans">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💳</span>
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                        Liquidación de Cobro
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium">Cálculo de minutos y boleta fiscal DTE</span>
                    </div>
                  </div>
                  {selectedExitVehicle && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExitVehicle(null);
                        setExitSearchQuery('');
                      }}
                      className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg hover:bg-rose-100 transition-colors"
                    >
                      ← Cambiar Auto
                    </button>
                  )}
                </div>

                {!selectedExitVehicle ? (
                  <div className="space-y-3">
                    {/* Buscador de Patente */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                        Buscar Vehículo para Liquidar
                      </label>
                      <input
                        ref={exitSearchInputRef}
                        type="text"
                        value={exitSearchQuery}
                        onChange={(e) => setExitSearchQuery(e.target.value.toUpperCase())}
                        placeholder="Buscar por patente (ej. ABCD12)..."
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-sm font-bold uppercase text-slate-900 focus:bg-white focus:border-[#E2498A] focus:outline-none transition-all"
                      />
                    </div>

                    {/* Lista de Vehículos en Patio */}
                    <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                      <div className="text-[10px] font-mono font-bold uppercase text-slate-400 px-1">
                        Vehículos en Patio ({exitFilteredVehicles.length > 0 ? exitFilteredVehicles.length : activeVehicles.length})
                      </div>
                      {(exitFilteredVehicles.length > 0 ? exitFilteredVehicles : activeVehicles).length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                          No hay vehículos estacionados en el recinto actualmente.
                        </div>
                      ) : (
                        (exitFilteredVehicles.length > 0 ? exitFilteredVehicles : activeVehicles).map((v) => (
                          <div
                            key={v.plate}
                            onClick={() => loadVehicleIntoExit(v)}
                            className="p-3 rounded-2xl border border-slate-200 hover:border-[#E2498A] bg-white hover:bg-pink-50/20 flex items-center justify-between gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="license-plate-chip px-2.5 py-1 text-xs bg-slate-900 text-white font-extrabold rounded">
                                {v.plate}
                              </span>
                              <div>
                                <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                  <span>{v.slotCode || `Cupo ${v.slot}`}</span>
                                  <span className="text-[10px] text-slate-400">({v.cat})</span>
                                  <span className="text-[10px] text-slate-600 font-semibold truncate max-w-[120px]">
                                    👤 {v.client || 'Particular'}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Entrada: {v.entry} · <strong className="text-pink-600">{formatStayDuration(v.durationMin)}</strong>
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-black font-mono text-[#E2498A] tabular-nums">
                                ${(v.durationMin * (v.rate || 25)).toLocaleString('es-CL')}
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">
                                Cobrar →
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  /* Formulario Completo de Cobro del Vehículo Seleccionado */
                  <div className="space-y-4">
                    {/* Tarjeta Resumen del Auto */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="license-plate-chip px-3 py-1 text-sm bg-slate-900 text-white font-extrabold rounded-md">
                          {selectedExitVehicle.plate}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {selectedExitVehicle.slotCode || `Cupo ${selectedExitVehicle.slot}`} · {selectedExitVehicle.cat} · 👤 {selectedExitVehicle.client || 'Particular'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/80">
                        <div>
                          <span className="text-[10px] text-slate-400 font-sans block">Hora Entrada</span>
                          <span className="font-bold text-slate-800">{selectedExitVehicle.entry}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-sans block">Tiempo Transcurrido</span>
                          <span className="font-bold text-[#E2498A]">{formatStayDuration(selectedExitVehicle.durationMin)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Desglose Monetario */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 font-mono tabular-nums text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Tarifa Base (${selectedExitVehicle.rate || 35}/min):</span>
                        <span className="font-bold text-slate-800">${baseTotal.toLocaleString('es-CL')}</span>
                      </div>
                      {appliedDiscount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Descuento Comercial:</span>
                          <span>-${appliedDiscount.toLocaleString('es-CL')}</span>
                        </div>
                      )}
                      {appliedSurcharge > 0 && (
                        <div className="flex justify-between text-rose-600 font-bold">
                          <span>Recargo (Ticket Extraviado):</span>
                          <span>+${appliedSurcharge.toLocaleString('es-CL')}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                        <span className="font-sans font-black text-sm text-slate-900">Total a Pagar:</span>
                        <span className="text-3xl font-black text-[#E2498A]">
                          ${finalTotal.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>

                    {/* Botones de Excepciones Diferidas */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPinModalType('DISCOUNT')}
                        disabled={isShiftClosed || isViewerOnly}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
                          isShiftClosed || isViewerOnly
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer shadow-xs'
                        }`}
                      >
                        <span>🏷️</span>
                        <span>Descuento</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPinModalType('LOST_TICKET')}
                        disabled={isShiftClosed || isViewerOnly}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
                          isShiftClosed || isViewerOnly
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-900 cursor-pointer shadow-xs'
                        }`}
                      >
                        <span>⚠️</span>
                        <span>Ticket Extraviado</span>
                      </button>
                    </div>

                    {/* Selector de Método de Pago */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Medio de Pago
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'efectivo', label: 'Efectivo', icon: '💵' },
                          { id: 'tarjeta', label: 'Tarjeta POS', icon: '💳' },
                          { id: 'transferencia', label: 'Transferencia', icon: '📱' },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setCheckoutPaymentMethod(m.id as any)}
                            className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                              checkoutPaymentMethod === m.id
                                ? 'border-[#E2498A] bg-[#FFF5F8] text-[#E2498A] shadow-xs'
                                : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <div className="text-base">{m.icon}</div>
                            <div className="font-extrabold text-[11px] mt-0.5">{m.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calculadora Táctil de Vuelto para Efectivo */}
                    {checkoutPaymentMethod === 'efectivo' && (
                      <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2.5 font-mono">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-sans font-bold text-emerald-950">Efectivo Recibido:</span>
                          <span className="text-[10px] text-emerald-800 font-sans">Billetes Chilenos</span>
                        </div>

                        {/* Botones de Billetes Nacionales */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                          {[
                            { label: 'Exacto', val: finalTotal },
                            { label: '+$1.000', add: 1000 },
                            { label: '+$2.000', add: 2000 },
                            { label: '+$5.000', add: 5000 },
                            { label: '+$10.000', add: 10000 },
                            { label: '+$20.000', add: 20000 },
                          ].map((b, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (b.val !== undefined) {
                                  setCashGiven(b.val.toString());
                                } else if (b.add !== undefined) {
                                  const currentVal = parseFloat(cashGiven) || 0;
                                  setCashGiven((currentVal + b.add).toString());
                                }
                              }}
                              className="py-1.5 px-1 bg-white border border-emerald-300 rounded-lg text-[10px] font-bold text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">$</span>
                          <input
                            type="number"
                            value={cashGiven}
                            onChange={(e) => setCashGiven(e.target.value)}
                            placeholder="Monto entregado..."
                            className="w-full h-9 px-3 rounded-xl border border-emerald-300 bg-white font-mono text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-600"
                          />
                        </div>

                        {/* Vuelto Calculado */}
                        <div className="p-2.5 bg-white rounded-xl border border-emerald-200 flex justify-between items-center">
                          <span className="font-sans text-xs font-bold text-emerald-900">Vuelto al Cliente:</span>
                          <span className={`text-lg font-black tabular-nums ${cashChange > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                            ${cashChange.toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Botón Primario de Cobro */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={handleConfirmCheckout}
                        disabled={isShiftClosed || isViewerOnly}
                        className={`w-full min-h-[52px] py-3.5 px-4 rounded-2xl text-white text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md ${
                          isShiftClosed || isViewerOnly
                            ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                            : 'bg-[#E2498A] hover:bg-[#C83472] active:scale-[0.99] cursor-pointer'
                        }`}
                      >
                        <span>💳</span>
                        <span>
                          {isShiftClosed
                            ? 'Turno Cerrado'
                            : isViewerOnly
                            ? 'Modo Solo Visualización'
                            : 'Confirmar Cobro & Abrir Barrera'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (selectedExitVehicle) {
                            const found = tickets.find((t) => t.plateNumber === selectedExitVehicle.plate);
                            if (found) {
                              const ok = await printFiscalReceipt(found);
                              if (ok) onShowToast('Impresión térmica ESC/POS enviada a Sunmi V2', 'success');
                              else onShowToast('Boleta fiscal DTE lista con Timbre SII (Web Serial no conectado)', 'info');
                            } else {
                              handleConfirmCheckout();
                            }
                          }
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <span>🖨️</span>
                        <span>Reimprimir Boleta Térmica ESC/POS (58-80mm)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB OPERADOR: 3. PATIO 2D */}
            {operadorMobileTab === 'plano' && (
              <div className="space-y-3 animate-fade-in font-sans">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>🗺️</span>
                    <span className="text-xs font-extrabold text-slate-800">
                      Plano Serrano 447 (30 Plazas)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {freeSlotsCount} Libres
                  </span>
                </div>

                <PatioMatrix2D
                  activeVehicles={activeVehicles}
                  mode="mobile"
                  isDraggable={!isShiftClosed && !isViewerOnly}
                  onMoveOrSwapSlot={(src, tgt) => {
                    try {
                      const ok = moveOrSwapVehicleSlot(src, tgt);
                      if (ok) {
                        const sCode = src <= 15 ? `A-${String(src).padStart(2, '0')}` : `B-${String(src).padStart(2, '0')}`;
                        const tCode = tgt <= 15 ? `A-${String(tgt).padStart(2, '0')}` : `B-${String(tgt).padStart(2, '0')}`;
                        onShowToast(`Vehículo reubicado con éxito de ${sCode} a ${tCode}.`, 'success');
                      }
                    } catch (e: any) {
                      onShowToast(e.message || 'Error al reubicar vehículo', 'error');
                    }
                  }}
                  selectedSlotCode={selectedSlot ? (selectedSlot <= 15 ? `A-${String(selectedSlot).padStart(2, '0')}` : `B-${String(selectedSlot).padStart(2, '0')}`) : null}
                  onSelectSlot={(slotCode, vehicle) => {
                    if (vehicle) {
                      setSelectedMobileVehicle(vehicle);
                    } else {
                      const numMatch = slotCode.match(/\d+/);
                      const slotNum = numMatch ? parseInt(numMatch[0], 10) : null;
                      if (slotNum) {
                        setSelectedSlot(slotNum);
                        setOperadorMobileTab('entry');
                        onShowToast(`Cupo ${slotCode} seleccionado para el próximo ingreso.`, 'success');
                      } else {
                        onShowToast(`Cupo ${slotCode} disponible para estacionar.`, 'info');
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* TAB OPERADOR: 4. CAJA & ARQUEO CIEGO */}
            {operadorMobileTab === 'caja' && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-fade-in font-sans">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                        Control de Caja de Garita
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium">Turno y Arqueo Ciego Corporativo</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    MODO CIEGO
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">Fondo Inicial Gaveta</span>
                    <span className="text-sm font-black text-amber-600 mt-0.5 block">
                      ${(currentShift?.initialCashDeclared || currentShift?.initialCash || 50000).toLocaleString('es-CL')}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">Estado del Turno</span>
                    <span className="text-xs font-black text-emerald-600 mt-1 block">
                      {isShiftClosed ? '🔒 Cerrado' : '🟢 Activo en Curso'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-2xl text-xs text-purple-900 space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <span>🛡️</span> Política de Arqueo Ciego (Regla #3):
                  </span>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    La recaudación acumulada y el balance teórico se mantienen ocultos al cajero. Al terminar su turno, declare el efectivo exacto en gaveta y sobre entregado en el módulo de arqueo.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isViewerOnly) {
                        onShowToast(`Modo Solo Visualización: El turno activo fue iniciado por ${currentShift?.operatorName || 'otro operador'}. Solo el titular puede realizar el arqueo.`, 'error');
                        return;
                      }
                      if (onNavigate) onNavigate('operacion_cierre');
                    }}
                    disabled={isShiftClosed || isViewerOnly}
                    className={`w-full min-h-[50px] py-3 px-4 rounded-2xl text-white text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-sm ${
                      isShiftClosed || isViewerOnly
                        ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                        : 'bg-[#E2498A] hover:bg-[#C83472] active:scale-[0.99] cursor-pointer'
                    }`}
                  >
                    <span>🔒</span>
                    <span>{isViewerOnly ? 'Arqueo Bloqueado (Solo Titular)' : 'Realizar Arqueo Ciego & Cierre de Turno'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isShiftClosed) {
                        onShowToast('El turno está cerrado. Debe aperturar un turno para registrar movimientos.', 'error');
                        return;
                      }
                      if (isViewerOnly) {
                        onShowToast(`Modo Solo Visualización: Solo ${currentShift?.operatorName || 'el titular'} puede registrar movimientos de caja.`, 'error');
                        return;
                      }
                      onOpenManualTransaction();
                    }}
                    disabled={isShiftClosed || isViewerOnly}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                      isShiftClosed || isViewerOnly
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'
                    }`}
                  >
                    <span>💵</span>
                    <span>Registrar Movimiento Manual de Caja {isViewerOnly ? '(Solo Titular)' : ''}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ============================================================ */
          /* MODO SUPERVISOR MÓVIL: TELEMETRÍA, PATIO, CRONOLOGÍA & AUDITORÍA */
          /* ============================================================ */
          <div className="space-y-4">
            {/* Banner de Estado de Turno para Supervisor */}
            {isShiftClosed && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-amber-900">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🔒</span>
                  <div>
                    <span className="font-extrabold text-xs text-amber-950 block">Turno Garita Cerrado</span>
                    <span className="text-[10px] text-amber-800">Modo supervisión activo (solo lectura).</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300 shrink-0">
                  Solo Lectura
                </span>
              </div>
            )}

            {/* ── TELEMETRÍA SUPERVISIÓN (CHIPS HERO) ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono tabular-nums">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Ocupación</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">
                  {occupiedCount}<span className="text-xs text-slate-400 font-normal">/30</span>
                </div>
                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">{freeSlotsCount} libres ({occupancyPercent}%)</div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Recaudación</div>
                <div className="text-xl font-black text-[#E2498A] mt-0.5">
                  ${todayRevenue.toLocaleString('es-CL')}
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                  {paidTickets.length} cobros hoy
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Estadía Media</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">
                  {averageStayMin}<span className="text-xs text-slate-400 font-normal">m</span>
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">ALOS en patio</div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Sobrestadía</div>
                <div className={`text-xl font-black mt-0.5 ${overstayVehicles.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {overstayVehicles.length}<span className="text-xs text-slate-400 font-normal"> veh.</span>
                </div>
                <div className={`text-[10px] font-bold mt-0.5 ${overstayVehicles.length > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {overstayVehicles.length > 0 ? '⚠️ Alerta > 2 hrs' : 'Al día'}
                </div>
              </div>
            </div>

            {/* ── TAB 1 MÓVIL: PLANO 2D UNIFICADO (30 PLAZAS SERRANO 447) ── */}
            {mobileTab === 'plano' && (
              <div className="space-y-3">
                <PatioMatrix2D
                  activeVehicles={activeVehicles}
                  mode="mobile"
                  onSelectSlot={(slotCode, vehicle) => {
                    if (vehicle) {
                      setSelectedMobileVehicle(vehicle);
                    } else {
                      onShowToast(`Cupo ${slotCode} se encuentra libre y disponible para estacionar.`, 'info');
                    }
                  }}
                />
              </div>
            )}

            {/* ── TAB 2 MÓVIL: CRONOLOGÍA DE FLUJO EN VIVO ── */}
            {mobileTab === 'cronologia' && (
              <div className="space-y-3">
                {/* Buscador y Filtro de Flujo */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={cronologiaSearch}
                    onChange={(e) => setCronologiaSearch(e.target.value)}
                    placeholder="Buscar patente o ticket en cronología..."
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:border-[#E2498A]"
                  />

                  <div className="flex gap-1.5">
                    {[
                      { id: 'TODOS', label: `Todos (${timelineEvents.length})` },
                      { id: 'INGRESOS', label: `↓ Ingresos (${timelineEvents.filter(e => e.type === 'INGRESO').length})` },
                      { id: 'SALIDAS', label: `↑ Salidas (${timelineEvents.filter(e => e.type === 'SALIDA').length})` },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setCronologiaFilter(f.id as any)}
                        className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                          cronologiaFilter === f.id
                            ? 'bg-[#1E1E2F] text-white'
                            : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feed Cronológico */}
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {filteredTimelineEvents.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                      No hay movimientos registrados con los filtros actuales.
                    </div>
                  ) : (
                    filteredTimelineEvents.map((event) => {
                      const isIngreso = event.type === 'INGRESO';

                      return (
                        <div
                          key={event.id}
                          className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 font-mono"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                              isIngreso
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-pink-100 text-[#E2498A]'
                            }`}>
                              {isIngreso ? '↓' : '↑'}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="license-plate-chip px-2 py-0.5 text-xs bg-slate-900 text-white font-extrabold rounded">
                                  {event.plate}
                                </span>
                                <span className="text-[10px] text-slate-400 font-sans font-semibold">
                                  {event.category}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 font-sans">
                                {isIngreso ? (
                                  <span>Asignado en <strong className="text-slate-700 font-mono">{event.slotCode}</strong></span>
                                ) : (
                                  <span>
                                    Estadía: <strong className="text-slate-800 font-mono">{formatStayDuration(event.durationMin || 0)}</strong>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-slate-700">{event.time}</div>
                            {!isIngreso && event.amount !== undefined && (
                              <div className="text-xs font-black text-[#E2498A] mt-0.5 tabular-nums">
                                +${event.amount.toLocaleString('es-CL')}
                              </div>
                            )}
                            <span className={`text-[9px] font-bold uppercase tracking-wider block mt-0.5 ${
                              isIngreso ? 'text-emerald-600' : 'text-slate-400'
                            }`}>
                              {isIngreso ? 'Ingreso' : (event.paymentMethod?.replace('_', ' ') || 'Cobro')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 3 MÓVIL: SUPERVISIÓN DE TRABAJADORES, APROBACIONES & FINANZAS ── */}
            {mobileTab === 'supervision' && (
              <div className="space-y-3 font-sans">
                {/* 1. CONTROL DE TURNO & OPERADOR EN GARITA */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1E1E2F] text-white flex items-center justify-center text-lg font-bold">
                        👮
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">
                          {currentShift?.operatorName || user?.name || 'Operador en Garita'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${!isShiftClosed ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span className="text-[11px] font-bold text-slate-500">
                            {!isShiftClosed ? 'Turno en Curso' : 'Turno Cerrado'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isShiftClosed ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        Turno cerrado
                      </span>
                    ) : (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Inicio Turno</span>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {currentShift?.startTime ? new Date(currentShift.startTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '08:00'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Parámetros de Caja del Turno */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">Fondo Inicial Gaveta</span>
                      <span className="text-sm font-black text-slate-900 mt-0.5 block">
                        ${(currentShift?.initialCashDeclared || currentShift?.initialCash || 50000).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">Efectivo en Gaveta</span>
                      <span className="text-sm font-black text-[#E2498A] mt-0.5 block">
                        ${runningBalance.toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. BANDEJA DE APROBACIONES EXPRESS DIFERIDAS (ANTIFRAUDE) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🛡️</span>
                      <span className="text-xs font-extrabold uppercase text-slate-700 font-sans">
                        Aprobaciones Express Diferidas
                      </span>
                    </div>
                    {pendingApprovals.filter((a: any) => a.status === 'pending').length > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                        {pendingApprovals.filter((a: any) => a.status === 'pending').length} pendientes
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Al día
                      </span>
                    )}
                  </div>

                  {pendingApprovals.filter((a: any) => a.status === 'pending').length === 0 ? (
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                        ✓
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-900 block">Sin excepciones pendientes</span>
                        <span className="text-[10px] text-emerald-700">No hay descuentos o salidas extraordinarias sin autorizar.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {pendingApprovals
                        .filter((a: any) => a.status === 'pending')
                        .map((approval: any) => (
                          <div
                            key={approval.id}
                            className="p-3 rounded-xl border border-rose-200 bg-rose-50/30 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                approval.type === 'DISCOUNT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {approval.type === 'DISCOUNT' ? 'Descuento Diferido' : 'Ticket Extraviado'}
                              </span>
                              {approval.amount > 0 && (
                                <span className="font-mono font-black text-slate-800">
                                  -${approval.amount.toLocaleString('es-CL')}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-700 font-medium italic">
                              "{approval.description}"
                            </p>

                            <div className="flex gap-2 pt-1 border-t border-rose-100">
                              <button
                                type="button"
                                onClick={() => {
                                  resolvePendingApproval(approval.id, 'rejected');
                                  onShowToast('Excepción rechazada', 'info');
                                }}
                                className="flex-1 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-[11px] hover:bg-slate-50 cursor-pointer"
                              >
                                Rechazar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  resolvePendingApproval(approval.id, 'approved');
                                  onShowToast('Excepción aprobada por supervisor', 'success');
                                }}
                                className="flex-1 py-1.5 rounded-lg bg-[#1E1E2F] text-white font-bold text-[11px] hover:bg-[#2D2D44] cursor-pointer"
                              >
                                Aprobar
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* 3. RESUMEN DE MÉTODOS DE PAGO */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 font-mono tabular-nums">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-extrabold uppercase text-slate-500 font-sans">Total Recaudado Hoy</span>
                    <span className="text-2xl font-black text-[#E2498A]">${todayRevenue.toLocaleString('es-CL')}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans flex items-center gap-1.5">
                        <span>💵</span> Efectivo Recaudado:
                      </span>
                      <span className="font-bold text-slate-800">${revenueByMethod.cash.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans flex items-center gap-1.5">
                        <span>💳</span> Tarjetas POS / Débito:
                      </span>
                      <span className="font-bold text-slate-800">${revenueByMethod.pos.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans flex items-center gap-1.5">
                        <span>📱</span> Transferencias / Convenios:
                      </span>
                      <span className="font-bold text-slate-800">${revenueByMethod.transfer.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                      <span className="font-bold text-slate-700 font-sans">Efectivo en Gaveta (con fondo):</span>
                      <span className="font-black text-slate-900">${runningBalance.toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL INSPECCIÓN TÁCTIL DE VEHÍCULO EN MÓVIL ── */}
      {selectedMobileVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚗</span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-tight">Inspección de Vehículo</h4>
                  <span className="text-[10px] text-slate-400 font-medium">Cupo {selectedMobileVehicle.slotCode || `A-${String(selectedMobileVehicle.slot).padStart(2, '0')}`}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMobileVehicle(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5 font-mono">
              <div className="flex justify-between items-center">
                <span className="text-xs font-sans text-slate-500">Patente:</span>
                <span className="license-plate-chip px-2.5 py-1 text-sm bg-slate-900 text-white font-extrabold rounded-md">
                  {selectedMobileVehicle.plate}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-sans text-slate-500">Categoría:</span>
                <span className="font-bold text-slate-800">{selectedMobileVehicle.cat} (${selectedMobileVehicle.rate || 35}/min)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-sans text-slate-500">Hora Entrada:</span>
                <span className="font-bold text-slate-800">{selectedMobileVehicle.entry}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-sans text-slate-500">Tiempo en Patio:</span>
                <span className="font-bold text-[#E2498A]">{formatStayDuration(selectedMobileVehicle.durationMin)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-sans font-bold text-slate-700 text-xs">Monto Acumulado:</span>
                <span className="text-base font-black text-[#E2498A] tabular-nums">
                  ${(selectedMobileVehicle.durationMin * (selectedMobileVehicle.rate || 25)).toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  loadVehicleIntoExit(selectedMobileVehicle);
                  setPosTab('exit');
                  setOperadorMobileTab('exit');
                  setShowMobileGaritaPos(true);
                  setSelectedMobileVehicle(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Cobrar en Garita POS
              </button>
              <button
                type="button"
                onClick={() => {
                  setReassignModalVehicle(selectedMobileVehicle);
                  setSelectedMobileVehicle(null);
                }}
                disabled={isShiftClosed || isViewerOnly}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isShiftClosed || isViewerOnly
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
                title="Mover o cambiar de plaza en el patio"
              >
                <span>🔄</span>
                <span>Reubicar</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMobileVehicle(null)}
                className="px-3 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL REUBICACIÓN MANUAL DE CUPO (MÓVIL / ACCESIBILIDAD) ── */}
      {reassignModalVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔄</span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Reubicar Vehículo</h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Patente {reassignModalVehicle.plate} (Actual: Cupo {reassignModalVehicle.slotCode || `A-${String(reassignModalVehicle.slot).padStart(2, '0')}`})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReassignModalVehicle(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Seleccione la plaza de destino (Sector A o B). Si el cupo está ocupado por otro vehículo, se realizará una permuta de cupos automática con registro de auditoría.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((sNum) => {
                const sCode = sNum <= 15 ? `A-${String(sNum).padStart(2, '0')}` : `B-${String(sNum).padStart(2, '0')}`;
                const occVeh = activeVehicles.find((v) => v.slot === sNum || v.slotCode === sCode);
                const isCurrent = (reassignModalVehicle.slot === sNum) || (reassignModalVehicle.slotCode === sCode);

                return (
                  <button
                    key={sNum}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => {
                      try {
                        const ok = moveOrSwapVehicleSlot(reassignModalVehicle.slot, sNum);
                        if (ok) {
                          onShowToast(`Vehículo ${reassignModalVehicle.plate} reubicado al cupo ${sCode}.`, 'success');
                          setReassignModalVehicle(null);
                        }
                      } catch (err: any) {
                        onShowToast(err.message || 'Error al reubicar', 'error');
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        : occVeh
                        ? 'bg-[#2D2D44] border-gray-700 text-white hover:border-[#E2498A]'
                        : 'bg-emerald-50/50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                    }`}
                  >
                    <span className="font-bold">{sCode}</span>
                    <span className="font-sans text-[11px] font-medium">
                      {isCurrent
                        ? 'Plaza actual'
                        : occVeh
                        ? `Ocupado por ${occVeh.plate} (Permutar)`
                        : '✓ Disponible libre'}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setReassignModalVehicle(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── VERSIÓN DESKTOP ESTRICTA: ESTACIÓN OPERADOR GARITA (HIDDEN LG:GRID) ── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8 items-start">
        
        {/* ── LEFT COLUMN: POS SYSTEM (Adelgazado a 5/12 cols) ── */}
        <div data-testid="desktop-pos-panel" className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          {/* POS TABS */}
          <div className="flex border-b border-gray-100 bg-gray-50/50 p-1.5 sm:p-2 gap-1.5 sm:gap-2">
            <button onClick={() => setPosTab('entry')} className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${posTab === 'entry' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>Ingreso</button>
            <button onClick={() => setPosTab('exit')} className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${posTab === 'exit' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>Cobro (Salida)</button>
            <button onClick={() => setPosTab('history')} className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${posTab === 'history' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>Caja</button>
          </div>

          <div className="p-4 sm:p-6">
            {/* Aviso persistente de Solo Visualización en Desktop */}
            {isViewerOnly && (
              <div className="mb-4 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-blue-900 shadow-xs animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">👁️</span>
                  <div>
                    <span className="font-extrabold text-xs block">
                      Modo Solo Visualización · Titular: {currentShift?.operatorName || 'Otro Operador'}
                    </span>
                    <span className="text-[11px] text-blue-700">
                      Tu usuario ({user?.name || user?.username}) está en modo espectador. Solo el titular que abrió el turno puede emitir tickets o liquidar cobros.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-300 uppercase shrink-0">
                  Solo Lectura
                </span>
              </div>
            )}

            {/* INGRESO TAB */}
            {posTab === 'entry' && (
              <form onSubmit={handleEntrySubmit} className="space-y-4 sm:space-y-6">
                {/* Indicador de Cupo Seleccionado Arriba de Patente */}
                {selectedSlot ? (
                  <div className="flex items-center justify-between p-3 bg-pink-50/80 border-2 border-[#E2498A] rounded-2xl animate-fade-in shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#E2498A] text-white flex items-center justify-center text-sm font-black shadow-xs">
                        📍
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase text-[#E2498A] tracking-wide">
                          Cupo Seleccionado: {selectedSlot <= 15 ? `A-${String(selectedSlot).padStart(2, '0')}` : `B-${String(selectedSlot).padStart(2, '0')}`}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Vehículo se asignará directamente a esta plaza en Sector {selectedSlot <= 15 ? 'A' : 'B'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSlot(null)}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-white border border-rose-200 px-2.5 py-1 rounded-lg cursor-pointer transition hover:bg-rose-50"
                    >
                      ✕ Asignación Libre
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span>🎯</span> Asignación de plaza: <strong className="text-slate-800">Libre / Automática</strong>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (Haz clic en un cupo del plano 2D para fijar)
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Ingresar Patente
                    </label>
                    {detectedCustomer && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ✓ Cliente Registrado: {detectedCustomer.name}
                      </span>
                    )}
                  </div>
                  <div className="flex bg-white rounded-2xl border-2 border-gray-200 focus-within:border-[#E2498A] focus-within:ring-4 focus-within:ring-[#E2498A]/10 transition-all overflow-hidden shadow-sm">
                    <input
                      ref={plateInputRef}
                      autoFocus
                      type="text"
                      placeholder="AAAABB o AABB11"
                      className="w-full text-center py-3.5 sm:py-5 text-2xl sm:text-4xl font-extrabold uppercase bg-transparent outline-none tabular-nums tracking-wider sm:tracking-widest text-gray-900 placeholder:text-gray-300 font-mono"
                      value={entryPlate}
                      onChange={(e) => setEntryPlate(e.target.value.toUpperCase())}
                    />
                  </div>

                  {/* Feedback Técnico de Validación de Patente Chilena */}
                  {entryPlate.trim().length >= 2 && (
                    <div className="mt-2 flex items-center justify-between text-xs px-1">
                      {plateValidation.isValidChilean ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-fade-in">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          ✓ {plateValidation.formatDesc}
                        </span>
                      ) : plateValidation.isForeignOrCustom ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300 animate-fade-in">
                          <span>🌐</span>
                          {plateValidation.formatDesc}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">
                          Formato estándar: 4 letras + 2 dígitos (o 2 letras + 4 dígitos)
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {entryPlate.replace(/[^a-zA-Z0-9]/g, '').length} caracteres
                      </span>
                    </div>
                  )}

                  {detectedAgreement && (
                    <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex justify-between items-center">
                      <span>🏢 Convenio Vigente: <strong>{detectedAgreement.companyName || detectedAgreement.contactName}</strong></span>
                      <span className="font-bold text-[10px] uppercase bg-blue-200/80 text-blue-800 px-2 py-0.5 rounded-md font-mono">{detectedAgreement.agreementType}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(['Sedán', 'SUV', 'Moto'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setEntryCategory(cat);
                        setEntryRate(cat === 'Moto' ? 20 : 35);
                      }}
                      className={`py-4 rounded-2xl text-sm font-bold border-2 transition-all cursor-pointer ${
                        entryCategory === cat
                          ? 'border-[#E2498A] bg-[#FFF5F8] text-[#E2498A]'
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <div>{cat === 'Moto' ? '🏍️ Moto' : cat === 'SUV' ? '🚙 SUV' : '🚗 Sedán'}</div>
                      <div className="text-[11px] font-mono mt-0.5 opacity-80">${cat === 'Moto' ? '20' : '35'}/min</div>
                    </button>
                  ))}
                </div>

                {/* FORMULARIO ACTIVO REGISTRO DE CLIENTE & WHATSAPP */}
                <div className="space-y-3.5 bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">👤</span>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Datos del Cliente & Notificación WhatsApp
                        </h4>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Emisión de comprobante directo con wa.me
                        </span>
                      </div>
                    </div>
                    {detectedCustomer && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Autocompletado
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Nombre del Cliente / Titular
                      </label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#E2498A] focus:ring-2 focus:ring-[#E2498A]/10 transition-all"
                        placeholder="Particular / Nombre..."
                        value={entryName}
                        onChange={(e) => setEntryName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center justify-between">
                        <span>Teléfono WhatsApp</span>
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> wa.me
                        </span>
                      </label>
                      <input
                        type="tel"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#E2498A] focus:ring-2 focus:ring-[#E2498A]/10 transition-all placeholder:font-sans placeholder:font-normal"
                        placeholder="+56 9 1234 5678"
                        value={entryPhone}
                        onChange={(e) => setEntryPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Observaciones / Daños Preexistentes (Opcional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#E2498A] focus:ring-2 focus:ring-[#E2498A]/10 transition-all"
                      placeholder="Ej. Rayón en tapabarro delantero, parachoque..."
                      value={entryObs}
                      onChange={(e) => setEntryObs(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSupervisorLiveMode || isShiftClosed || isViewerOnly || !entryPlate || entryPlate.replace(/[^a-zA-Z0-9]/g, '').length < 3}
                  className={`w-full py-5 text-white rounded-2xl text-lg font-extrabold transition-all flex justify-center items-center gap-3 ${
                    isShiftClosed || isViewerOnly || isSupervisorLiveMode
                      ? 'bg-slate-400 cursor-not-allowed opacity-75'
                      : 'bg-gray-900 hover:bg-black hover:shadow-lg disabled:opacity-50 cursor-pointer'
                  }`}
                >
                  {isShiftClosed
                    ? '🔒 Turno Cerrado (No Operativo)'
                    : isViewerOnly
                    ? '👁️ Solo Visualización'
                    : isSupervisorLiveMode
                    ? '🔒 Ingreso Deshabilitado (Modo Supervisión)'
                    : 'Emitir Ticket'}
                </button>
              </form>
            )}

            {/* EXIT TAB */}
            {posTab === 'exit' && (
              <div className="space-y-6">
                {!selectedExitVehicle ? (
                  <>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Buscar Vehículo para Salida</label>
                       <input ref={exitSearchInputRef} autoFocus type="text" placeholder="Buscar por Patente..." className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xl font-bold uppercase tabular-nums focus:outline-none focus:border-[#E2498A] focus:ring-4 focus:ring-[#E2498A]/10 transition-all text-gray-900" value={exitSearchQuery} onChange={(e) => setExitSearchQuery(e.target.value)} />
                    </div>
                    {exitSearchQuery && (
                      <div className="space-y-3">
                        {exitFilteredVehicles.map((v) => (
                          <div key={v.plate} onClick={() => loadVehicleIntoExit(v)} className="p-4 bg-white border-2 border-gray-100 rounded-2xl flex justify-between items-center cursor-pointer hover:border-[#E2498A] hover:shadow-sm transition-all group">
                             <div>
                               <div className="text-xl font-extrabold text-gray-900 tabular-nums">{v.plate}</div>
                               <div className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                                 <span>Cupo {v.slotCode || `A-${String(v.slot).padStart(2, '0')}`} • {v.durationMin} min</span>
                                 <span className="text-slate-600 font-bold">👤 {v.client || 'Particular'}</span>
                               </div>
                             </div>
                             <button className="px-4 py-2 bg-[#FFF5F8] text-[#E2498A] font-bold text-sm rounded-xl group-hover:bg-[#E2498A] group-hover:text-white transition-colors">Cobrar</button>
                          </div>
                        ))}
                        {exitFilteredVehicles.length === 0 && (
                          <div className="p-8 text-center text-gray-500 font-medium">No se encontraron vehículos.</div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="flex justify-between items-start">
                       <div>
                          <div className="text-3xl font-black text-gray-900 tracking-tight tabular-nums flex items-center gap-3">
                            <span>{selectedExitVehicle.plate}</span>
                            <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                              👤 {selectedExitVehicle.client || 'Particular'}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-gray-500 mt-1">Estadía: {selectedExitVehicle.durationMin} min (Ingreso: {selectedExitVehicle.entry})</div>
                       </div>
                       <button onClick={() => { setSelectedExitVehicle(null); setExitSearchQuery(''); setAppliedDiscount(0); setAppliedSurcharge(0); }} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                       </button>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-3">
                       <div className="flex justify-between text-sm font-medium text-gray-500"><span>Tarifa Base ({selectedExitVehicle.rate}/min)</span><span className="tabular-nums font-bold text-gray-900">${(selectedExitVehicle.durationMin * selectedExitVehicle.rate).toLocaleString('es-CL')}</span></div>
                       {appliedDiscount > 0 && <div className="flex justify-between text-sm font-bold text-green-600"><span>Descuento Comercial</span><span className="tabular-nums">-${appliedDiscount.toLocaleString('es-CL')}</span></div>}
                       {appliedSurcharge > 0 && <div className="flex justify-between text-sm font-bold text-red-600"><span>Recargo (Multa)</span><span className="tabular-nums">+${appliedSurcharge.toLocaleString('es-CL')}</span></div>}
                       <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                          <span className="text-lg font-black text-gray-900">Total a Pagar</span>
                          <span className="text-4xl font-black text-[#E2498A] tabular-nums tracking-tight">${finalTotal.toLocaleString('es-CL')}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {(['efectivo', 'tarjeta', 'transferencia'] as const).map((m) => (
                        <button key={m} onClick={() => setCheckoutPaymentMethod(m)} className={`py-3 rounded-xl text-sm font-bold border-2 capitalize transition-all ${checkoutPaymentMethod === m ? 'border-[#E2498A] bg-[#FFF5F8] text-[#E2498A]' : 'border-gray-100 bg-gray-50 text-gray-500'}`}>{m}</button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                       <button
                         type="button"
                         onClick={() => setPinModalType('DISCOUNT')}
                         disabled={isShiftClosed || isViewerOnly}
                         className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${
                           isShiftClosed || isViewerOnly
                             ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                             : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50 cursor-pointer'
                         }`}
                       >
                         Aplicar Descuento
                       </button>
                       <button
                         type="button"
                         onClick={() => setPinModalType('LOST_TICKET')}
                         disabled={isShiftClosed || isViewerOnly}
                         className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${
                           isShiftClosed || isViewerOnly
                             ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                             : 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100 cursor-pointer'
                         }`}
                       >
                         Ticket Extraviado (Ley 20.967)
                       </button>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={handleConfirmCheckout}
                        disabled={isSupervisorLiveMode || isShiftClosed || isViewerOnly}
                        className={`w-full py-4 text-white rounded-2xl text-base font-extrabold transition-all flex justify-center items-center gap-3 ${
                          isSupervisorLiveMode || isShiftClosed || isViewerOnly
                            ? 'bg-slate-400 cursor-not-allowed opacity-80'
                            : 'bg-[#E2498A] hover:bg-[#C83472] hover:-translate-y-0.5 hover:shadow-lg cursor-pointer'
                        }`}
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                         {isShiftClosed
                           ? '🔒 Turno Cerrado (No Operativo)'
                           : isViewerOnly
                           ? '👁️ Solo Visualización'
                           : isSupervisorLiveMode
                           ? '🔒 Cobro Deshabilitado (Modo Supervisión)'
                           : 'Confirmar Cobro & Emitir Boleta SII'}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (selectedExitVehicle) {
                            const found = tickets.find((t) => t.plateNumber === selectedExitVehicle.plate);
                            if (found) {
                              const ok = await printFiscalReceipt(found);
                              if (ok) {
                                onShowToast('Impresión térmica ESC/POS enviada a Sunmi V2', 'success');
                              } else {
                                onShowToast('Impresora térmica Web Serial no detectada. Generando ticket fiscal en PDF térmico 80mm...', 'info');
                                generateTicketPdf({
                                  ticketNumber: found.ticketCode || found.id,
                                  plate: found.plateNumber,
                                  category: selectedExitVehicle.cat,
                                  entryTime: found.entryTime ? new Date(found.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : selectedExitVehicle.entry,
                                  ratePerMinute: selectedExitVehicle.rate || 35,
                                  barcodeValue: found.ticketCode || found.id,
                                  customerName: found.customerName || selectedExitVehicle.client,
                                  customerPhone: found.customerPhone || selectedExitVehicle.phone,
                                  notes: found.notes || selectedExitVehicle.obs,
                                  slot: selectedExitVehicle.slot,
                                }, '80mm', true);
                              }
                            } else {
                              handleConfirmCheckout();
                            }
                          }
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <span>🖨️</span>
                        <span>Imprimir Boleta Térmica (ESC/POS o PDF 80mm)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* HISTORY TAB */}
            {posTab === 'history' && (
              <div className="space-y-4">
                 <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="font-extrabold text-gray-900">Total Efectivo en Caja</span>
                    <span className="text-2xl font-black text-gray-900 tabular-nums">${runningBalance.toLocaleString('es-CL')}</span>
                 </div>
                 <button
                    onClick={() => {
                      if (isShiftClosed) {
                        onShowToast('El turno está cerrado. Debe aperturar un turno para registrar movimientos de caja.', 'error');
                        return;
                      }
                      if (isViewerOnly) {
                        onShowToast(`Modo Solo Visualización: Solo ${currentShift?.operatorName || 'el titular'} puede registrar movimientos de caja.`, 'error');
                        return;
                      }
                      if (isSupervisorLiveMode) {
                        onShowToast('Modo Supervisión: Movimientos de caja reservados al operador en turno.', 'error');
                        return;
                      }
                      onOpenManualTransaction();
                    }}
                    disabled={isSupervisorLiveMode || isShiftClosed || isViewerOnly}
                    className={`w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl transition ${
                      isSupervisorLiveMode || isShiftClosed || isViewerOnly ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    + / - Movimiento Manual {isShiftClosed ? '(Turno Cerrado)' : isViewerOnly ? '(Solo Titular)' : isSupervisorLiveMode ? '(Solo Cajero)' : ''}
                  </button>
                  <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {historyLogs.map((log, idx) => (
                      <div key={idx} className="p-3 bg-white border border-gray-100 rounded-xl flex justify-between items-center hover:border-gray-200 transition-colors">
                         <div>
                            <div className="text-sm font-bold text-gray-900">{log.desc} {log.plate ? `(${log.plate})` : ''}</div>
                            <div className="text-xs font-semibold text-gray-500">{log.time} • {log.method.toUpperCase()}</div>
                         </div>
                         <div className={`text-sm font-black tabular-nums ${log.isEgreso ? 'text-red-500' : 'text-green-600'}`}>
                            {log.isEgreso ? '-' : '+'}${log.amount.toLocaleString('es-CL')}
                         </div>
                      </div>
                    ))}
                 </div>

                 
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: 2D MAP MATRIX & TELEMETRÍA (7/12 cols) ── */}
        <div className="lg:col-span-7 space-y-6">
           <div className="bg-[#1E1E2F] text-white rounded-3xl p-6 shadow-sm border border-gray-800">
             <div className="flex justify-between items-center mb-6">
                <div>
                   <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                     <span className="w-2.5 h-2.5 rounded-full bg-[#E2498A] animate-pulse"></span>
                     Plano 2D Interactivo
                   </h2>
                   <p className="text-xs text-gray-400 font-medium mt-1 flex items-center gap-1.5">
                     <span>Serrano 447</span>
                     <span>•</span>
                     <span className="text-pink-300 font-semibold">✨ Arrastra y suelta vehículos para reubicar o permutar plazas</span>
                   </p>
                </div>
                <div className="bg-[#2D2D44] px-4 py-2 rounded-xl border border-gray-700 text-center">
                   <div className="text-2xl font-black text-[#E2498A] tabular-nums leading-none tracking-tight">{Math.max(0, 30 - activeVehicles.length)}</div>
                   <div className="text-[10px] uppercase font-bold text-gray-400 mt-1">Libres</div>
                </div>
             </div>

             <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
               {Array.from({ length: 30 }, (_, i) => i + 1).map((slotIndex) => {
                 const vehicle = activeVehicles.find((v) => v.slot === slotIndex);
                 const slotCode = slotIndex <= 15 ? `A-${String(slotIndex).padStart(2, '0')}` : `B-${String(slotIndex).padStart(2, '0')}`;
                 const isOccupied = !!vehicle;
                 const isSelected = selectedSlot === slotIndex;
                 const isBeingDragged = draggedSlot === slotIndex;
                 const isDropTarget = dragOverSlot === slotIndex && draggedSlot !== slotIndex;

                 return (
                   <div 
                     key={slotIndex}
                     draggable={isOccupied && !isShiftClosed && !isViewerOnly}
                     onDragStart={(e) => {
                       if (!isOccupied || isShiftClosed || isViewerOnly) {
                         e.preventDefault();
                         return;
                       }
                       e.dataTransfer.setData('text/plain', String(slotIndex));
                       e.dataTransfer.effectAllowed = 'move';
                       setDraggedSlot(slotIndex);
                     }}
                     onDragEnd={() => {
                       setDraggedSlot(null);
                       setDragOverSlot(null);
                     }}
                     onDragOver={(e) => {
                       e.preventDefault();
                       e.dataTransfer.dropEffect = 'move';
                     }}
                     onDragEnter={(e) => {
                       e.preventDefault();
                       if (draggedSlot !== null && draggedSlot !== slotIndex) {
                         setDragOverSlot(slotIndex);
                       }
                     }}
                     onDragLeave={(e) => {
                       if (dragOverSlot === slotIndex) {
                         setDragOverSlot(null);
                       }
                     }}
                     onDrop={(e) => {
                       e.preventDefault();
                       const sourceStr = e.dataTransfer.getData('text/plain');
                       const sourceNum = parseInt(sourceStr, 10);
                       setDraggedSlot(null);
                       setDragOverSlot(null);
                       if (!sourceNum || isNaN(sourceNum) || sourceNum === slotIndex) return;

                       try {
                         const ok = moveOrSwapVehicleSlot(sourceNum, slotIndex);
                         if (ok) {
                           const targetCode = slotIndex <= 15 ? `A-${String(slotIndex).padStart(2, '0')}` : `B-${String(slotIndex).padStart(2, '0')}`;
                           const sourceCode = sourceNum <= 15 ? `A-${String(sourceNum).padStart(2, '0')}` : `B-${String(sourceNum).padStart(2, '0')}`;
                           onShowToast(`Vehículo reubicado con éxito de cupo ${sourceCode} a ${targetCode}.`, 'success');
                         }
                       } catch (err: any) {
                         onShowToast(err.message || 'Error al reubicar vehículo', 'error');
                       }
                     }}
                     onClick={() => {
                        if (isOccupied) {
                           onShowToast(`${slotCode}: Ocupado por ${vehicle.plate} (${vehicle.client || 'Particular'})`, 'info');
                           loadVehicleIntoExit(vehicle);
                           setPosTab('exit');
                        } else {
                           setSelectedSlot(slotIndex);
                           setPosTab('entry');
                           onShowToast(`Cupo ${slotCode} seleccionado para el próximo ingreso.`, 'success');
                        }
                     }}
                     title={
                       isOccupied && !isShiftClosed && !isViewerOnly
                         ? 'Mantén presionado y arrastra para reubicar a otro cupo'
                         : undefined
                     }
                     className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden group select-none ${
                       isBeingDragged
                         ? 'opacity-35 scale-95 border-dashed border-[#E2498A] bg-pink-500/10'
                         : isDropTarget
                         ? 'ring-4 ring-[#E2498A] bg-[#E2498A]/30 border-[#E2498A] scale-105 z-30 shadow-xl'
                         : isOccupied 
                         ? 'bg-[#2D2D44] border-gray-700 hover:border-gray-500 shadow-xs cursor-grab active:cursor-grabbing hover:scale-[1.02]' 
                         : isSelected
                           ? 'bg-[#FFF5F8] border-[#E2498A] ring-4 ring-[#E2498A]/30 shadow-lg scale-105 z-20'
                           : 'bg-emerald-950/40 border-emerald-500/70 hover:border-emerald-400 hover:bg-emerald-900/50 shadow-sm'
                     }`}
                   >
                     <div className="w-full flex items-center justify-between mb-1 z-10 px-0.5">
                       <span className={`text-[10px] font-bold ${
                         isOccupied ? 'text-gray-400' : isSelected ? 'text-[#E2498A]' : 'text-emerald-400'
                       }`}>
                         {slotCode}
                       </span>
                       {isOccupied && !isShiftClosed && !isViewerOnly && (
                         <span className="text-[9px] text-gray-500 group-hover:text-pink-300 font-mono font-bold tracking-tighter" title="Arrastrar">
                           ⠿
                         </span>
                       )}
                     </div>
                     {isOccupied ? (
                       <div className="flex flex-col items-center z-10 w-full">
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#E2498A]/20 text-[#E2498A] mb-1">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-5h14v5z"/>
                              <circle cx="7.5" cy="14.5" r="1.5"/>
                              <circle cx="16.5" cy="14.5" r="1.5"/>
                            </svg>
                          </div>
                          <span className="text-sm font-black text-white tabular-nums tracking-wide">{vehicle.plate}</span>
                          <span className="text-[10px] font-bold text-slate-300 truncate max-w-[110px] text-center mt-0.5">
                            👤 {vehicle.client || 'Particular'}
                          </span>
                          <span className="text-[10px] font-bold text-[#E2498A] bg-[#E2498A]/10 px-1.5 py-0.5 rounded mt-1">{vehicle.durationMin}m</span>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center z-10">
                          {isSelected ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-white bg-[#E2498A] px-2 py-0.5 rounded-md shadow-xs">
                                ✓ FIJADO
                              </span>
                              <span className="text-[10px] font-bold text-[#E2498A] mt-1">Seleccionado</span>
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                LIBRE
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-400/90 mt-1">Disponible</span>
                            </>
                          )}
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           </div>

        </div>
      </div>

      {pinModalType && (
        <AntifraudPinModal type={pinModalType} baseAmount={baseTotal} onConfirm={handlePinConfirm} onClose={() => setPinModalType(null)} />
      )}
    </div>
  );
};
