import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PaymentMethod } from '../../types';
import { useParking } from '../../context/ParkingContext';

import { AntifraudPinModal, PinModalType } from './AntifraudPinModal';

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
    total: number
  ) => void;
  onOpenManualTransaction: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate?: (screen: string) => void;
  onInitiateOpenShift?: () => void;
}

export const PosView: React.FC<PosViewProps> = ({
  initialSubtab = 'entry',
  activeVehicles,
  historyLogs,
  onOpenTicketPreview,
  onProcessCheckout,
  onOpenManualTransaction,
  onShowToast,
  onNavigate,
  onInitiateOpenShift,
}) => {
  const { currentShift, tickets, addPendingApproval, printFiscalReceipt, printEntryTicket } = useParking();
  const isShiftClosed = currentShift?.status === 'cerrado';
  const [posTab, setPosTab] = useState<'entry' | 'exit' | 'history'>(initialSubtab);

  // Mobile Supervisor States & Filters
  const [mobileTab, setMobileTab] = useState<'plano' | 'cronologia' | 'finanzas'>('plano');
  const [planoFilter, setPlanoFilter] = useState<'TODOS' | 'OCUPADOS' | 'LIBRES' | 'SOBREESTADIA'>('TODOS');
  const [cronologiaFilter, setCronologiaFilter] = useState<'TODOS' | 'INGRESOS' | 'SALIDAS'>('TODOS');
  const [cronologiaSearch, setCronologiaSearch] = useState('');
  const [selectedMobileVehicle, setSelectedMobileVehicle] = useState<PatioVehicle | null>(null);
  const [showMobileGaritaPos, setShowMobileGaritaPos] = useState(false);

  // Entry State
  const [entryPlate, setEntryPlate] = useState('');
  const [entryCategory, setEntryCategory] = useState<'Sedán' | 'SUV' | 'Moto'>('Sedán');
  const [entryRate, setEntryRate] = useState(35);
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  const [entryName, setEntryName] = useState('');
  const [entryPhone, setEntryPhone] = useState('');
  const [entryObs, setEntryObs] = useState('');
  const plateInputRef = useRef<HTMLInputElement>(null);

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
    const cleanPlate = entryPlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleanPlate.length < 5) {
      onShowToast('Patente inválida (mín. 5 caracteres)', 'error');
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
    if (!availableSlotIndex) {
      onShowToast('Patio lleno, no hay cupos disponibles', 'error');
      return;
    }

    onOpenTicketPreview({
      plate: cleanPlate,
      category: entryCategory,
      rate: entryRate,
      name: entryName.trim() || 'Particular',
      phone: entryPhone.trim(),
      obs: entryObs.trim(),
      slot: availableSlotIndex,
    });

    setEntryPlate('');
    setEntryName('');
    setEntryPhone('');
    setEntryObs('');
    setShowEntryDetails(false);
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
    if (!selectedExitVehicle) {
      onShowToast('Seleccione un vehículo para liquidar su salida', 'error');
      return;
    }
    const methodMapping: Record<'efectivo' | 'tarjeta' | 'transferencia', PaymentMethod> = {
      efectivo: 'efectivo',
      tarjeta: 'tarjeta_debito',
      transferencia: 'transferencia',
    };
    onProcessCheckout(selectedExitVehicle, methodMapping[checkoutPaymentMethod], finalTotal);
    onShowToast(`Cobro registrado: $${finalTotal.toLocaleString('es-CL')} para ${selectedExitVehicle.plate}. Barrera abierta.`, 'success');
    setSelectedExitVehicle(null);
    setExitSearchQuery('');
  };

  const handlePinConfirm = (payload: { type: 'DISCOUNT' | 'LOST_TICKET'; pin: string; reason: string; discountAmount?: number; deferred?: boolean; }) => {
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

  const filteredMobileSlots = useMemo(() => {
    const all = Array.from({ length: 30 }, (_, i) => i + 1).map((slotIndex) => {
      const vehicle = activeVehicles.find((v) => v.slot === slotIndex);
      const slotCode = slotIndex <= 15 ? `A-${String(slotIndex).padStart(2, '0')}` : `B-${String(slotIndex).padStart(2, '0')}`;
      const isOccupied = !!vehicle;
      const isOverstay = vehicle ? (vehicle.durationMin || 0) >= 120 : false;
      return {
        slotIndex,
        slotCode,
        isOccupied,
        isOverstay,
        vehicle,
      };
    });

    if (planoFilter === 'OCUPADOS') {
      return all.filter((s) => s.isOccupied);
    }
    if (planoFilter === 'LIBRES') {
      return all.filter((s) => !s.isOccupied);
    }
    if (planoFilter === 'SOBREESTADIA') {
      return all.filter((s) => s.isOverstay);
    }
    return all;
  }, [activeVehicles, planoFilter]);

  // Layout Render
  return (
    <div className="p-3 sm:p-6 lg:p-8 2xl:px-12 w-full max-w-[1850px] mx-auto min-h-screen bg-[#F8FAFC] animate-fade-in-up font-sans pb-24 md:pb-8">
      {/* ── DESKTOP MODAL BLOQUEO DE TURNO (GARITA OPERADOR) ── */}
      {isShiftClosed && (
        <div className="hidden lg:flex fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl text-center space-y-4 sm:space-y-5 animate-fade-in-up">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center text-2xl sm:text-3xl">
              🔒
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Punto de Venta Bloqueado</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">El turno actual se encuentra cerrado. Para realizar nuevos ingresos o cobros debe aperturar un nuevo turno con fondo de gaveta.</p>
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
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                Volver al Menú Principal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── VERSIÓN MÓVIL EXCLUSIVA: SUPERVISIÓN OPERATIVA & PATIO (LG:HIDDEN) ── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div className="block lg:hidden space-y-4">
        {/* Banner no bloqueante de turno en móvil */}
        {isShiftClosed && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-amber-900">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🔒</span>
              <div>
                <span className="font-extrabold text-xs text-amber-950 block">Turno Garita Cerrado</span>
                <span className="text-[10px] text-amber-800">Modo supervisión activo (solo lectura).</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onInitiateOpenShift ? onInitiateOpenShift() : undefined}
              className="px-3 py-1.5 rounded-xl bg-[#E2498A] text-white text-[11px] font-bold shrink-0 shadow-xs active:scale-95 cursor-pointer"
            >
              Iniciar Turno
            </button>
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
            <div className="text-[10px] text-slate-500 font-sans mt-0.5">{paidTickets.length} cobros hoy</div>
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

        {/* ── TABS SUPERVISIÓN MÓVIL ── */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 gap-1 shadow-xs">
          <button
            type="button"
            onClick={() => setMobileTab('plano')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'plano'
                ? 'bg-[#1E1E2F] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>🗺️</span>
            <span>Plano 2D</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('cronologia')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'cronologia'
                ? 'bg-[#1E1E2F] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>⏱️</span>
            <span>Cronología</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('finanzas')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'finanzas'
                ? 'bg-[#1E1E2F] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>💰</span>
            <span>Finanzas</span>
          </button>
        </div>

        {/* ── TAB 1 MÓVIL: PLANO 2D CON PERMANENCIAS DETALLADAS ── */}
        {mobileTab === 'plano' && (
          <div className="space-y-3">
            {/* Filtros de Patio */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'TODOS', label: `Todos (${totalSlotsCount})` },
                { id: 'OCUPADOS', label: `Ocupados (${occupiedCount})` },
                { id: 'LIBRES', label: `Libres (${freeSlotsCount})` },
                { id: 'SOBREESTADIA', label: `> 2h (${overstayVehicles.length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPlanoFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                    planoFilter === f.id
                      ? 'bg-[#E2498A] text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Matriz 2D Responsive de Cupos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredMobileSlots.map((slot) => {
                const { slotIndex, slotCode, isOccupied, isOverstay, vehicle } = slot;

                return (
                  <div
                    key={slotIndex}
                    onClick={() => {
                      if (isOccupied && vehicle) {
                        setSelectedMobileVehicle(vehicle);
                      } else {
                        onShowToast(`Cupo ${slotCode} se encuentra libre y disponible para estacionar.`, 'info');
                      }
                    }}
                    className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[120px] shadow-xs active:scale-[0.98] ${
                      isOccupied
                        ? isOverstay
                          ? 'bg-[#1E1E2F] border-rose-500/80 shadow-rose-500/10'
                          : 'bg-[#1E1E2F] border-slate-700 hover:border-slate-500'
                        : 'bg-emerald-950/30 border-emerald-500/60 hover:bg-emerald-900/40'
                    }`}
                  >
                    {/* Header del Cupo */}
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[11px] font-mono font-bold ${isOccupied ? 'text-slate-300' : 'text-emerald-400'}`}>
                        {slotCode}
                      </span>
                      {isOccupied ? (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isOverstay ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-700 text-slate-300'}`}>
                          {vehicle?.cat}
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>

                    {/* Contenido Central */}
                    {isOccupied && vehicle ? (
                      <div className="my-1.5">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-[#E2498A] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-5h14v5z"/>
                          </svg>
                          <span className="text-base font-black text-white tracking-wider tabular-nums">
                            {vehicle.plate}
                          </span>
                        </div>

                        {/* Indicador de Permanencia en Tiempo Real */}
                        <div className="mt-1 flex items-center gap-1">
                          <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                            isOverstay 
                              ? 'bg-rose-500 text-white animate-pulse' 
                              : 'bg-[#E2498A]/20 text-[#E2498A] border border-[#E2498A]/30'
                          }`}>
                            <span>⏱️</span>
                            <span>{formatStayDuration(vehicle.durationMin)}</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="my-auto text-center py-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/40">
                          LIBRE
                        </span>
                        <div className="text-[10px] text-emerald-400/80 mt-1">Disponible</div>
                      </div>
                    )}

                    {/* Footer del Cupo */}
                    <div className="text-[9px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-700/50">
                      {isOccupied && vehicle ? (
                        <>
                          <span>In: {vehicle.entry}</span>
                          <span className="text-[#E2498A] font-bold">Ver ficha →</span>
                        </>
                      ) : (
                        <span className="text-emerald-500/80">Serrano 447</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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

        {/* ── TAB 3 MÓVIL: FINANZAS & CAJA DIARIA ── */}
        {mobileTab === 'finanzas' && (
          <div className="space-y-3">
            {/* Resumen de Métodos de Pago */}
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

            {/* Gráfico Horario en Móvil */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-slate-500 flex items-center gap-1.5">
                  <span>📊</span> Ocupación Horaria (Hoy)
                </span>
                <span className="text-[10px] font-bold text-[#E2498A] bg-[#FFF5F8] px-2 py-0.5 rounded-full">
                  En patio: {occupiedCount}
                </span>
              </div>

              <div className="h-32 w-full flex items-end gap-1 pt-2 pb-1 bg-slate-50 rounded-xl border border-slate-100 px-1">
                {[
                  { hour: '08:00', count: Math.max(2, Math.round(activeVehicles.length * 0.35)) },
                  { hour: '10:00', count: Math.max(9, Math.round(activeVehicles.length * 0.85)) },
                  { hour: '12:00', count: Math.max(14, Math.round(activeVehicles.length * 1.1)) },
                  { hour: '14:00', count: Math.max(15, Math.round(activeVehicles.length * 0.9)) },
                  { hour: '16:00', count: Math.max(12, Math.round(activeVehicles.length * 0.8)) },
                  { hour: '18:00', count: activeVehicles.length },
                ].map((point) => {
                  const heightPercent = Math.min(100, Math.max(15, Math.round((point.count / 30) * 100)));
                  return (
                    <div key={point.hour} className="flex-1 flex flex-col items-center h-full justify-end">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-[#E2498A] rounded-t transition-all"
                      />
                      <span className="text-[9px] font-mono text-slate-400 mt-1">{point.hour.slice(0, 2)}h</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── BOTÓN ACCORDEÓN: MODO GARITA POS EN MÓVIL (EMERGENCIA) ── */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowMobileGaritaPos(!showMobileGaritaPos)}
            className="w-full py-2.5 px-3 rounded-2xl bg-white border border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <span>🛠️</span>
            <span>{showMobileGaritaPos ? 'Ocultar Teclado Garita POS' : 'Abrir Operación Garita POS (Cobro/Ingreso)'}</span>
            <span className="text-slate-400">{showMobileGaritaPos ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* ── FORMULARIO GARITA POS EXPANDIBLE EN MÓVIL ── */}
        {showMobileGaritaPos && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in-up">
            <div className="flex border-b border-gray-100 bg-gray-50/50 p-1.5 gap-1.5">
              <button onClick={() => setPosTab('entry')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${posTab === 'entry' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}>Ingreso</button>
              <button onClick={() => setPosTab('exit')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${posTab === 'exit' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}>Cobro</button>
              <button onClick={() => setPosTab('history')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${posTab === 'history' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}>Caja</button>
            </div>
            {/* Los formularios se reutilizan dinámicamente si se despliega este modo */}
            <div className="p-4">
              <p className="text-xs text-slate-500 mb-3">Modo caja express para cobro o ingreso rápido en piso.</p>
              {posTab === 'entry' && (
                <form onSubmit={handleEntrySubmit} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Patente (ej. ABCD12)..."
                    className="w-full text-center py-3 text-2xl font-black uppercase rounded-xl border border-slate-200 focus:outline-none focus:border-[#E2498A]"
                    value={entryPlate}
                    onChange={(e) => setEntryPlate(e.target.value.toUpperCase())}
                  />
                  <button type="submit" disabled={!entryPlate || entryPlate.length < 5} className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold">
                    Emitir Ticket Rápido
                  </button>
                </form>
              )}
              {posTab === 'exit' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Buscar patente para cobrar..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-mono text-sm font-bold uppercase"
                    value={exitSearchQuery}
                    onChange={(e) => setExitSearchQuery(e.target.value)}
                  />
                  {exitFilteredVehicles.slice(0, 3).map((v) => (
                    <div key={v.plate} onClick={() => loadVehicleIntoExit(v)} className="p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-black text-sm">{v.plate}</span>
                        <div className="text-[10px] text-slate-500">{v.durationMin} min en patio</div>
                      </div>
                      <button className="px-3 py-1 bg-pink-50 text-[#E2498A] font-bold text-xs rounded-lg">Cargar</button>
                    </div>
                  ))}
                </div>
              )}
              {posTab === 'history' && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700">Total en Caja: ${runningBalance.toLocaleString('es-CL')}</div>
                  <button onClick={onOpenManualTransaction} className="w-full py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700">
                    + / - Movimiento Manual
                  </button>
                </div>
              )}
            </div>
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
                  setShowMobileGaritaPos(true);
                  setSelectedMobileVehicle(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Cobrar en Garita POS
              </button>
              <button
                type="button"
                onClick={() => setSelectedMobileVehicle(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── VERSIÓN DESKTOP ESTRICTA: ESTACIÓN OPERADOR GARITA (HIDDEN LG:GRID) ── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8 items-start">
        
        {/* ── LEFT COLUMN: POS SYSTEM (Adelgazado a 5/12 cols) ── */}
        <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          {/* POS TABS */}
          <div className="flex border-b border-gray-100 bg-gray-50/50 p-1.5 sm:p-2 gap-1.5 sm:gap-2">
            <button onClick={() => setPosTab('entry')} className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${posTab === 'entry' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>Ingreso</button>
            <button onClick={() => setPosTab('exit')} className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${posTab === 'exit' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>Cobro (Salida)</button>
            <button onClick={() => setPosTab('history')} className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${posTab === 'history' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>Caja</button>
          </div>

          <div className="p-4 sm:p-6">
            {/* INGRESO TAB */}
            {posTab === 'entry' && (
              <form onSubmit={handleEntrySubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Ingresar Patente</label>
                  <div className="flex bg-white rounded-2xl border-2 border-gray-200 focus-within:border-[#E2498A] focus-within:ring-4 focus-within:ring-[#E2498A]/10 transition-all overflow-hidden shadow-sm">
                    <input
                      ref={plateInputRef}
                      autoFocus
                      type="text"
                      placeholder="AAAABB o AABB11"
                      className="w-full text-center py-3.5 sm:py-5 text-2xl sm:text-4xl font-extrabold uppercase bg-transparent outline-none tabular-nums tracking-wider sm:tracking-widest text-gray-900 placeholder:text-gray-300"
                      value={entryPlate}
                      onChange={(e) => setEntryPlate(e.target.value.toUpperCase())}
                    />
                  </div>
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
                      className={`py-4 rounded-2xl text-sm font-bold border-2 transition-all ${entryCategory === cat ? 'border-[#E2498A] bg-[#FFF5F8] text-[#E2498A]' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button type="button" onClick={() => setShowEntryDetails(!showEntryDetails)} className="text-sm font-bold text-[#E2498A] hover:text-[#C83472] flex items-center justify-center gap-1 w-full p-2">
                  {showEntryDetails ? 'Ocultar Datos Adicionales' : 'Añadir Datos Adicionales'}
                </button>

                {showEntryDetails && (
                  <div className="space-y-4 animate-fade-in-up bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">Nombre</label><input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium" value={entryName} onChange={(e) => setEntryName(e.target.value)} /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">Teléfono</label><input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium" value={entryPhone} onChange={(e) => setEntryPhone(e.target.value)} /></div>
                    </div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Observaciones</label><input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium" value={entryObs} onChange={(e) => setEntryObs(e.target.value)} /></div>
                  </div>
                )}

                <button type="submit" disabled={!entryPlate || entryPlate.length < 5} className="w-full py-5 bg-gray-900 text-white rounded-2xl text-lg font-extrabold hover:bg-black transition-all hover:shadow-lg disabled:opacity-50 flex justify-center items-center gap-3">
                  Emitir Ticket
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
                               <div className="text-xs font-semibold text-gray-500">Cupo {v.slotCode || `A-${String(v.slot).padStart(2, '0')}`} • {v.durationMin} min</div>
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
                          <div className="text-3xl font-black text-gray-900 tracking-tight tabular-nums">{selectedExitVehicle.plate}</div>
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
                       <button onClick={() => setPinModalType('DISCOUNT')} className="flex-1 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Aplicar Descuento</button>
                       <button onClick={() => setPinModalType('LOST_TICKET')} className="flex-1 py-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100">Ticket Extraviado (Ley 20.967)</button>
                    </div>

                    <div className="space-y-2">
                      <button onClick={handleConfirmCheckout} className="w-full py-4 bg-[#E2498A] text-white rounded-2xl text-base font-extrabold hover:bg-[#C83472] transition-all hover:-translate-y-0.5 hover:shadow-lg flex justify-center items-center gap-3 cursor-pointer">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                         Confirmar Cobro &amp; Emitir Boleta SII
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
                        <span>Imprimir Boleta Térmica ESC/POS (Sunmi V2 / 58-80mm)</span>
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
                 <button onClick={onOpenManualTransaction} className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50">
                    + / - Movimiento Manual
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

                 {/* ── GRÁFICO DE VEHÍCULOS ACTIVOS POR HORA ── */}
                 <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                       <span>📊</span> Vehículos Activos por Hora (Hoy)
                     </span>
                     <span className="text-[11px] font-bold text-[#E2498A] bg-[#FFF5F8] px-2 py-0.5 rounded-full">
                       En patio: {activeVehicles.length}
                     </span>
                   </div>

                   <div className="h-36 w-full flex items-end gap-1.5 pt-3 pb-1 px-1 bg-slate-50/70 rounded-2xl border border-slate-100">
                     {[
                       { hour: '08:00', count: Math.max(2, Math.round(activeVehicles.length * 0.35)) },
                       { hour: '09:00', count: Math.max(5, Math.round(activeVehicles.length * 0.6)) },
                       { hour: '10:00', count: Math.max(9, Math.round(activeVehicles.length * 0.85)) },
                       { hour: '11:00', count: Math.max(12, Math.round(activeVehicles.length * 0.95)) },
                       { hour: '12:00', count: Math.max(14, Math.round(activeVehicles.length * 1.1)) },
                       { hour: '13:00', count: Math.max(16, Math.round(activeVehicles.length * 1.05)) },
                       { hour: '14:00', count: Math.max(15, Math.round(activeVehicles.length * 0.9)) },
                       { hour: '15:00', count: Math.max(13, Math.round(activeVehicles.length * 0.85)) },
                       { hour: '16:00', count: Math.max(12, Math.round(activeVehicles.length * 0.8)) },
                       { hour: '17:00', count: Math.max(10, Math.round(activeVehicles.length * 0.75)) },
                       { hour: '18:00', count: activeVehicles.length },
                     ].map((point, pIdx) => {
                       const maxCapacity = 30;
                       const heightPercent = Math.min(100, Math.max(12, Math.round((point.count / maxCapacity) * 100)));
                       const isCurrentHour = pIdx === 10;

                       return (
                         <div key={point.hour} className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-default">
                           <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 bg-slate-900 text-white text-[10px] font-mono py-0.5 px-1.5 rounded pointer-events-none z-20 whitespace-nowrap shadow-sm">
                             {point.count} autos ({point.hour})
                           </div>
                           <div 
                             style={{ height: `${heightPercent}%` }} 
                             className={`w-full rounded-t-md transition-all ${
                               isCurrentHour 
                                 ? 'bg-[#E2498A] shadow-xs' 
                                 : 'bg-slate-300 hover:bg-[#E2498A]/60'
                             }`}
                           />
                           <span className="text-[8px] font-mono font-bold text-slate-400 mt-1 truncate">
                             {point.hour.slice(0, 2)}h
                           </span>
                         </div>
                       );
                     })}
                   </div>
                   <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium px-1">
                     <span>Entradas y salidas continuas</span>
                     <span className="font-mono">Capacidad: 30 plazas</span>
                   </div>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: 2D MAP MATRIX (Agrandado a 7/12 cols) ── */}
        <div className="lg:col-span-7 space-y-6">
           <div className="bg-[#1E1E2F] text-white rounded-3xl p-6 shadow-sm border border-gray-800">
             <div className="flex justify-between items-center mb-6">
                <div>
                   <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                     <span className="w-2.5 h-2.5 rounded-full bg-[#E2498A] animate-pulse"></span>
                     Plano 2D Interactivo
                   </h2>
                   <p className="text-sm text-gray-400 font-medium mt-1">Serrano 447 • Ocupación en Tiempo Real</p>
                </div>
                <div className="bg-[#2D2D44] px-4 py-2 rounded-xl border border-gray-700 text-center">
                   <div className="text-2xl font-black text-[#E2498A] tabular-nums leading-none tracking-tight">{Math.max(0, 30 - activeVehicles.length)}</div>
                   <div className="text-[10px] uppercase font-bold text-gray-400 mt-1">Libres</div>
                </div>
             </div>

             <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
               {Array.from({ length: 30 }, (_, i) => i + 1).map((slotIndex) => {
                 const vehicle = activeVehicles.find((v) => v.slot === slotIndex);
                 const slotCode = `A-${String(slotIndex).padStart(2, '0')}`;
                 const isOccupied = !!vehicle;

                 return (
                   <div 
                     key={slotIndex}
                     onClick={() => {
                        if (isOccupied) {
                           onShowToast(`${slotCode}: Ocupado por ${vehicle.plate} (${vehicle.durationMin} min)`, 'info');
                           loadVehicleIntoExit(vehicle);
                           setPosTab('exit');
                        } else {
                           onShowToast(`Cupo ${slotCode} está libre.`, 'success');
                           setPosTab('entry');
                        }
                     }}
                     className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden group 
                       ${isOccupied 
                         ? 'bg-[#2D2D44] border-gray-700 hover:border-gray-500 shadow-xs' 
                         : 'bg-emerald-950/40 border-emerald-500/70 hover:border-emerald-400 hover:bg-emerald-900/50 shadow-sm'
                       }`}
                   >
                     <span className={`text-[10px] font-bold mb-1 z-10 ${isOccupied ? 'text-gray-400' : 'text-emerald-400'}`}>{slotCode}</span>
                     {isOccupied ? (
                       <div className="flex flex-col items-center z-10 w-full">
                          {/* Distintivo / Silueta de Vehículo */}
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#E2498A]/20 text-[#E2498A] mb-1">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-5h14v5z"/>
                              <circle cx="7.5" cy="14.5" r="1.5"/>
                              <circle cx="16.5" cy="14.5" r="1.5"/>
                            </svg>
                          </div>
                          <span className="text-sm font-black text-white tabular-nums tracking-wide">{vehicle.plate}</span>
                          <span className="text-[10px] font-bold text-[#E2498A] bg-[#E2498A]/10 px-1.5 py-0.5 rounded mt-1">{vehicle.durationMin}m</span>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center z-10">
                          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            LIBRE
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-400/90 mt-1">Disponible</span>
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
