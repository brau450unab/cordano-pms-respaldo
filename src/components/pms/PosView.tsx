import React, { useState, useEffect, useRef } from 'react';
import { PaymentMethod } from '../../types';
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
}

export const PosView: React.FC<PosViewProps> = ({
  initialSubtab = 'entry',
  activeVehicles,
  historyLogs,
  onOpenTicketPreview,
  onProcessCheckout,
  onOpenManualTransaction,
  onShowToast,
}) => {
  const [currentSubtab, setCurrentSubtab] = useState<'entry' | 'exit' | 'history'>(initialSubtab);

  useEffect(() => {
    setCurrentSubtab(initialSubtab);
  }, [initialSubtab]);

  // Entry Form States
  const [entryPlate, setEntryPlate] = useState('');
  const [entryCategory, setEntryCategory] = useState<'Sedán' | 'SUV' | 'Moto'>('Sedán');
  const [entryRate, setEntryRate] = useState<number>(25);
  const [selectedTariffLabel, setSelectedTariffLabel] = useState('Diurna Regular (Predeterminada)');
  const [entryName, setEntryName] = useState('');
  const [entryPhone, setEntryPhone] = useState('');
  const [entryObs, setEntryObs] = useState('');
  const entryPlateInputRef = useRef<HTMLInputElement>(null);

  // Exit Checkout States
  const [exitSearchQuery, setExitSearchQuery] = useState('');
  const [selectedExitVehicle, setSelectedExitVehicle] = useState<PatioVehicle | null>(() => {
    return activeVehicles.length > 0 ? activeVehicles[0] : null;
  });
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [cashGiven, setCashGiven] = useState<string>('2000');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [appliedSurcharge, setAppliedSurcharge] = useState<number>(0);
  const [pinModalType, setPinModalType] = useState<PinModalType>(null);
  const exitSearchInputRef = useRef<HTMLInputElement>(null);

  // Keep selectedExitVehicle in sync with activeVehicles
  useEffect(() => {
    if (selectedExitVehicle) {
      const stillActive = activeVehicles.find((v) => v.plate === selectedExitVehicle.plate);
      if (!stillActive && activeVehicles.length > 0) {
        loadVehicleIntoExit(activeVehicles[0]);
      }
    } else if (activeVehicles.length > 0) {
      loadVehicleIntoExit(activeVehicles[0]);
    }
  }, [activeVehicles]);

  // Autofocus when switching tabs
  useEffect(() => {
    if (currentSubtab === 'entry') {
      setTimeout(() => entryPlateInputRef.current?.focus(), 60);
    } else if (currentSubtab === 'exit') {
      setTimeout(() => exitSearchInputRef.current?.focus(), 60);
    }
  }, [currentSubtab]);

  const nextArrivalSeq = activeVehicles.length + 1;
  const slotSuggestion =
    nextArrivalSeq <= 15
      ? `A-${nextArrivalSeq.toString().padStart(2, '0')}`
      : `B-${Math.min(30, nextArrivalSeq).toString().padStart(2, '0')}`;

  // Anti-Passback Check
  const cleanEntryPlate = entryPlate.trim().toUpperCase();
  const existingActiveVehicle =
    cleanEntryPlate.length >= 4
      ? activeVehicles.find((v) => v.plate.toUpperCase() === cleanEntryPlate)
      : null;

  const handleCategorySelect = (cat: 'Sedán' | 'SUV' | 'Moto', rate: number) => {
    setEntryCategory(cat);
    setEntryRate(rate);
  };

  const handleEmitTicketClick = () => {
    if (cleanEntryPlate.length < 4) {
      onShowToast('Ingrese una patente válida (mínimo 4 caracteres).', 'error');
      entryPlateInputRef.current?.focus();
      return;
    }
    if (activeVehicles.length >= 30) {
      onShowToast('El recinto ha alcanzado su capacidad máxima (30/30 plazas).', 'error');
      return;
    }

    onOpenTicketPreview({
      plate: cleanEntryPlate,
      category: entryCategory,
      rate: entryRate,
      name: entryName.trim() || 'Particular',
      phone: entryPhone.trim(),
      obs: entryObs.trim(),
      slot: nextArrivalSeq,
    });
  };

  // Exit Functions
  const loadVehicleIntoExit = (v: PatioVehicle) => {
    setSelectedExitVehicle(v);
    setAppliedDiscount(v.discount || 0);
    setAppliedSurcharge(v.surcharge || 0);
    const baseTotal = v.durationMin * (v.rate || 25);
    const roundedCash = Math.max(2000, Math.ceil(baseTotal / 1000) * 1000);
    setCashGiven(roundedCash.toString());
  };

  const exitFilteredVehicles = exitSearchQuery.trim().length > 0
    ? activeVehicles.filter(
        (v) =>
          v.plate.toUpperCase().includes(exitSearchQuery.trim().toUpperCase()) ||
          (v.ticketId && v.ticketId.toUpperCase().includes(exitSearchQuery.trim().toUpperCase()))
      )
    : [];

  const baseTotal = selectedExitVehicle
    ? selectedExitVehicle.durationMin * (selectedExitVehicle.rate || 25)
    : 0;
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
    setEntryPlate('');
    setEntryName('');
    setEntryPhone('');
    setEntryObs('');
    setCurrentSubtab('entry');
  };

  const handlePinConfirm = (payload: {
    type: 'DISCOUNT' | 'LOST_TICKET';
    pin: string;
    reason: string;
    discountAmount?: number;
  }) => {
    if (payload.type === 'DISCOUNT') {
      const disc = payload.discountAmount || 0;
      setAppliedDiscount(disc);
      onShowToast(`Descuento comercial autorizado ($${disc.toLocaleString('es-CL')}) con PIN Operador [Auditoría Verde].`, 'success');
    } else {
      setAppliedSurcharge(8000);
      onShowToast('Multa por Ticket Extraviado (+$8.000 CLP) aplicada con PIN Administrador [Auditoría Roja].', 'error');
    }
    setPinModalType(null);
  };

  // Running Balance for History Ledger
  const runningBalance = historyLogs.reduce(
    (acc, item) => (item.isEgreso ? acc - item.amount : acc + item.amount),
    0
  );

  return (
    <div id="view-pos" className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-5 animate-fade-in-up">
      {/* ── TOP OPERATIONAL SUBTABS WITH SHORTCUT TOOLTIPS ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#e8ecf0] pb-4 gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          <button
            id="btn-subtab-entry"
            onClick={() => setCurrentSubtab('entry')}
            data-shortcut="Atajo: F2"
            className={`shortcut-tooltip px-4 h-10 shrink-0 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
              currentSubtab === 'entry'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-[#e8ecf0] hover:bg-[#f8fafc] hover:border-[#dde2e8]'
            }`}
          >
            <span>1. Ingreso de Vehículo</span>
          </button>
          <button
            id="btn-subtab-exit"
            onClick={() => setCurrentSubtab('exit')}
            data-shortcut="Atajo: F4"
            className={`shortcut-tooltip px-4 h-10 shrink-0 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
              currentSubtab === 'exit'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-[#e8ecf0] hover:bg-[#f8fafc] hover:border-[#dde2e8]'
            }`}
          >
            <span>2. Salida y Cobro</span>
          </button>
          <button
            id="btn-subtab-history"
            onClick={() => setCurrentSubtab('history')}
            className={`px-4 h-10 shrink-0 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
              currentSubtab === 'history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-[#e8ecf0] hover:bg-[#f8fafc] hover:border-[#dde2e8]'
            }`}
          >
            <span>3. Historial del Turno</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[12px] font-mono shrink-0 tabular-nums">
          <span className="text-slate-400">Tarifa Activa:</span>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
            ${entryRate} / min
          </span>
        </div>
      </div>

      {/* ── SUBPANE 1: INGRESO DE VEHÍCULO ── */}
      {currentSubtab === 'entry' && (
        <div id="pos-subtab-entry" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form Panel */}
          <div className="lg:col-span-7 bg-white border border-[#e8ecf0] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-[#f1f5f9] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold tracking-tight text-slate-900">
                  Registro de Nuevo Vehículo
                </h3>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Ingreso en Serrano 447 con autofoco inmediato.
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-[#f8fafc] px-2 py-1 rounded border border-[#e8ecf0]">
                F2 Autofoco · Enter Confirmar · F8 Imprimir
              </span>
            </div>

            <div className="space-y-4">
              {/* License Plate Input with Anti-Passback */}
              <div>
                <div className="flex items-center justify-between max-w-sm mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                    Patente del Vehículo *
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">Formato: ABCD12 / CHI</span>
                </div>
                <div className="relative max-w-sm">
                  <input
                    ref={entryPlateInputRef}
                    type="text"
                    id="pos-entry-plate"
                    value={entryPlate}
                    onChange={(e) => setEntryPlate(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleEmitTicketClick();
                      }
                    }}
                    placeholder="ABCD12"
                    maxLength={8}
                    className="w-full h-14 pl-5 pr-14 rounded-xl border-[1.5px] border-[#dde2e8] font-mono font-black text-2xl uppercase tracking-[0.14em] text-slate-900 focus:border-slate-900 focus:outline-none bg-[#f8fafc] tabular-nums transition-colors"
                  />
                  <span className="absolute right-4 top-4 text-[11px] font-mono text-slate-400 font-bold pointer-events-none">
                    CHI
                  </span>
                </div>

                {/* ANTI-PASSBACK ALERT (Regla #2) */}
                {existingActiveVehicle && (
                  <div className="mt-2 max-w-sm p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-mono flex items-center justify-between gap-3 animate-fade-in-up">
                    <span className="truncate">⚠ [ANTI-PASSBACK]: Patente ya activa en patio.</span>
                    <button
                      type="button"
                      onClick={() => {
                        loadVehicleIntoExit(existingActiveVehicle);
                        setCurrentSubtab('exit');
                      }}
                      className="underline font-bold text-amber-950 shrink-0 cursor-pointer hover:text-amber-800"
                    >
                      Ir a Cobro →
                    </button>
                  </div>
                )}
              </div>

              {/* Category Pills & Modality Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-2">
                    Categoría Vehicular
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { cat: 'Sedán' as const, rate: 25 },
                      { cat: 'SUV' as const, rate: 30 },
                      { cat: 'Moto' as const, rate: 15 },
                    ].map((c) => (
                      <button
                        key={c.cat}
                        type="button"
                        onClick={() => handleCategorySelect(c.cat, c.rate)}
                        className={`h-10 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                          entryCategory === c.cat
                            ? 'border-[1.5px] border-slate-900 bg-slate-900 text-white shadow-xs'
                            : 'border border-[#dde2e8] bg-white text-slate-700 hover:bg-[#f8fafc] hover:border-[#c1c9d4]'
                        }`}
                      >
                        {c.cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-2">
                    Modalidad / Tarifa
                  </label>
                  <select
                    value={selectedTariffLabel}
                    onChange={(e) => setSelectedTariffLabel(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#dde2e8] text-[13px] font-mono focus:border-slate-900 focus:outline-none bg-white text-slate-900 transition-colors"
                  >
                    <option>Diurna Regular (Predeterminada)</option>
                    <option>Nocturna / Fin de Semana</option>
                    <option>Convenio Corporativo</option>
                  </select>
                </div>
              </div>

              {/* Driver info & Damage observation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#f1f5f9] pt-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">
                    Conductor (Opcional)
                  </label>
                  <input
                    type="text"
                    value={entryName}
                    onChange={(e) => setEntryName(e.target.value)}
                    placeholder="Nombre conductor..."
                    className="w-full h-10 px-3 rounded-xl border border-[#dde2e8] text-[13px] focus:border-slate-900 focus:outline-none bg-[#f8fafc] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">
                    WhatsApp (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={entryPhone}
                    onChange={(e) => setEntryPhone(e.target.value)}
                    placeholder="+56 9..."
                    className="w-full h-10 px-3 rounded-xl border border-[#dde2e8] text-[13px] font-mono focus:border-slate-900 focus:outline-none bg-[#f8fafc] tabular-nums transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">
                  Observaciones / Daños Previos (Resguardo Legal)
                </label>
                <input
                  type="text"
                  value={entryObs}
                  onChange={(e) => setEntryObs(e.target.value)}
                  placeholder="Ej. Espejo derecho raspado, abolladura previa parachoques..."
                  className="w-full h-10 px-3 rounded-xl border border-[#dde2e8] text-[13px] focus:border-slate-900 focus:outline-none bg-[#f8fafc] transition-colors"
                />
              </div>

              {/* Suggested Slot Banner */}
              <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e8ecf0] flex items-center justify-between tabular-nums">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.06em] block mb-0.5">
                    Registro Operativo Serrano 447:
                  </span>
                  <div className="text-[13px] font-bold text-slate-900 font-mono">
                    Plaza sugerida {slotSuggestion} (Cupo #{nextArrivalSeq})
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Asignación Automática
                </span>
              </div>
            </div>

            {/* Emit Ticket Button */}
            <button
              onClick={handleEmitTicketClick}
              data-shortcut="Atajo: Enter"
              className={`shortcut-tooltip w-full h-13 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer ${
                cleanEntryPlate.length >= 4 ? '' : 'opacity-60'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <path d="M6 14h12v8H6z" />
              </svg>
              <span>Emitir Ticket 80mm &amp; Registrar Ingreso</span>
            </button>
          </div>

          {/* Right Patio Layout Panel */}
          <div className="lg:col-span-5 bg-white border border-[#e8ecf0] rounded-2xl p-5 shadow-xs flex flex-col h-[680px]">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3 shrink-0">
              <div>
                <h3 className="text-[13px] font-bold tracking-tight text-slate-900">
                  Plano del Patio (Serrano 447)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  30 cupos físicos. Clic en vehículo para liquidar salida.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 font-mono text-[10px] tabular-nums">
                <span className="px-2.5 py-0.5 rounded-full bg-[#f1f5f9] text-slate-800 font-bold border border-[#dde2e8]">
                  {activeVehicles.length} Ocupados
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  {Math.max(0, 30 - activeVehicles.length)} Libres
                </span>
              </div>
            </div>

            {/* Semantic Legend */}
            <div className="flex flex-wrap items-center gap-3 py-2.5 shrink-0 border-b border-[#f1f5f9] text-[10px] font-mono uppercase text-slate-500 font-bold justify-center">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#10B981]" /> Libre
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#64748B]" /> Ocupado
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#3B82F6]" /> Abonado
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#EF4444]" /> Sobrestadía
              </span>
            </div>

            {/* Active List */}
            <div
              id="pos-patio-active-list"
              className="flex-1 overflow-y-auto pt-3 pr-1 grid grid-cols-2 gap-2.5 content-start"
            >
              {activeVehicles.map((v) => {
                const accumulated = v.durationMin * (v.rate || 25);
                const isOverstay = v.durationMin >= 120;
                let cardStyle = 'border-[#dde2e8] bg-white hover:border-slate-400';
                if (isOverstay) {
                  cardStyle = 'border-rose-200 bg-rose-50/40 hover:border-rose-300';
                } else if (v.cat === 'SUV') {
                  cardStyle = 'border-purple-200 bg-purple-50/30 hover:border-purple-300';
                } else if (v.cat === 'Moto') {
                  cardStyle = 'border-amber-200 bg-amber-50/30 hover:border-amber-300';
                }

                return (
                  <div
                    key={`${v.slot}-${v.plate}`}
                    onClick={() => {
                      loadVehicleIntoExit(v);
                      setCurrentSubtab('exit');
                    }}
                    className={`p-3 rounded-xl border ${cardStyle} transition-all cursor-pointer hover:shadow-xs hover:-translate-y-0.5 tabular-nums`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {v.slotCode || `Cupo #${v.slot}`}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600">{v.cat}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="license-plate-chip px-2.5 py-0.5 text-xs bg-white">
                        {v.plate}
                      </span>
                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-emerald-600">
                          ${accumulated.toLocaleString('es-CL')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold">{v.durationMin} min</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBPANE 2: SALIDA Y COBRO ── */}
      {currentSubtab === 'exit' && (
        <div id="pos-subtab-exit" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Checkout Search & Vehicle Detail Panel */}
          <div className="lg:col-span-6 bg-white border border-[#e8ecf0] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-[#f1f5f9] pb-4">
              <h3 className="text-[15px] font-bold tracking-tight text-slate-900">
                Despacho de Vehículo
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Búsqueda predictiva por Patente o Número de Ticket (`TKT-...`).
              </p>
            </div>

            {/* Predictive Search Bar */}
            <div className="relative">
              <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-2">
                Buscar Patente o Ticket #
              </label>
              <input
                ref={exitSearchInputRef}
                type="text"
                id="pos-exit-search-input"
                value={exitSearchQuery}
                onChange={(e) => setExitSearchQuery(e.target.value)}
                placeholder="Ej. BBCL84 o TKT-..."
                className="w-full h-12 pl-4 pr-3 rounded-xl border-[1.5px] border-[#dde2e8] font-mono font-bold text-xl uppercase text-slate-900 focus:border-slate-900 focus:outline-none bg-[#f8fafc] tabular-nums transition-colors"
              />

              {exitSearchQuery.trim().length > 0 && (
                <div className="absolute top-20 inset-x-0 bg-white border border-[#e8ecf0] rounded-xl shadow-floating z-30 max-h-52 overflow-y-auto divide-y divide-[#f1f5f9] font-mono tabular-nums">
                  {exitFilteredVehicles.length === 0 ? (
                    <div className="p-4 text-xs text-slate-400 text-center">
                      No se encontró vehículo con esa patente en el patio activo.
                    </div>
                  ) : (
                    exitFilteredVehicles.map((v) => (
                      <div
                        key={v.plate}
                        onClick={() => {
                          loadVehicleIntoExit(v);
                          setExitSearchQuery('');
                        }}
                        className="p-3.5 hover:bg-[#f8fafc] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="license-plate-chip px-2 py-0.5 text-sm">{v.plate}</span>
                          <span className="text-xs font-bold text-slate-700">{v.cat}</span>
                        </div>
                        <div className="text-right text-xs">
                          <span className="text-emerald-600 font-bold">{v.durationMin} min</span>
                          <span className="text-slate-400 ml-2">{v.slotCode || `#${v.slot}`}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Vehicle Details Card */}
            {selectedExitVehicle ? (
              <div className="p-5 bg-[#f8fafc] rounded-xl border border-[#e8ecf0] space-y-4 font-mono tabular-nums">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-[0.06em] font-bold block mb-0.5">
                      Vehículo Seleccionado:
                    </span>
                    <span className="text-[11px] text-slate-500 font-bold">
                      {selectedExitVehicle.ticketId || `TKT-PLAZA-${selectedExitVehicle.slot}`}
                    </span>
                  </div>
                  <span className="license-plate-chip px-4 py-1.5 text-lg font-bold shadow-xs bg-white">
                    {selectedExitVehicle.plate}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-[#e8ecf0]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em] mb-1">
                      Categoría:
                    </span>
                    <span className="font-bold text-slate-900 text-base">{selectedExitVehicle.cat}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em] mb-1">
                      Plaza / Llegada:
                    </span>
                    <span className="font-bold text-slate-900 text-base">
                      {selectedExitVehicle.slotCode || `Cupo #${selectedExitVehicle.slot}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em] mb-1">
                      Hora Ingreso:
                    </span>
                    <span className="font-bold text-slate-900 text-base">{selectedExitVehicle.entry} hrs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em] mb-1">
                      Estadía Computada:
                    </span>
                    <span className="font-bold text-emerald-600 text-base">
                      {selectedExitVehicle.durationMin} min
                    </span>
                  </div>
                </div>

                {/* Damage & Driver info */}
                <div className="pt-4 border-t border-[#e8ecf0] text-sm space-y-2">
                  <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em]">
                    Datos Conductor &amp; Daños:
                  </span>
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#e8ecf0]">
                    <span className="text-slate-800 font-bold font-sans text-[13px]">
                      {selectedExitVehicle.client || 'Particular'}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {selectedExitVehicle.phone || 'Sin WhatsApp'}
                    </span>
                  </div>
                  <div className="text-xs bg-white px-3 py-2.5 rounded-xl border border-[#e8ecf0] text-slate-600 font-sans">
                    <strong className="text-slate-800">Inspección Previa:</strong>{' '}
                    {selectedExitVehicle.obs || 'Sin observaciones de daño preexistente'}
                  </div>
                </div>

                {/* Antifraud Exception Buttons with Discrete Tooltips */}
                <div className="pt-3 border-t border-[#e8ecf0] grid grid-cols-3 gap-2 font-sans">
                  <button
                    type="button"
                    onClick={() => setPinModalType('DISCOUNT')}
                    data-shortcut="Atajo: F6 (PIN Operador)"
                    className="shortcut-tooltip h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Descuento PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setPinModalType('LOST_TICKET')}
                    data-shortcut="Atajo: F7 (PIN Admin +$8.000)"
                    className="shortcut-tooltip h-10 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Extravío +$8k
                  </button>
                  <button
                    type="button"
                    onClick={() => onShowToast(`Reimpresión térmica enviada para ${selectedExitVehicle.plate}`, 'success')}
                    data-shortcut="Atajo: F8"
                    className="shortcut-tooltip h-10 rounded-xl bg-white hover:bg-[#f1f5f9] border border-[#dde2e8] text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Reimprimir
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 font-mono text-xs border border-dashed border-[#dde2e8] rounded-xl">
                Seleccione un vehículo del patio para procesar su cobro.
              </div>
            )}
          </div>

          {/* Right Settlement & Payment Panel (Dark Linear Panel) */}
          <div className="lg:col-span-6 bg-white border border-[#e8ecf0] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-[#f1f5f9] pb-4">
              <h3 className="text-[15px] font-bold tracking-tight text-slate-900">
                Liquidación de Pago
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Emisión de Boleta / Voucher DTE SII y cálculo de vuelto en efectivo.
              </p>
            </div>

            {/* Dark Financial Card */}
            <div className="p-5 rounded-xl space-y-3 font-mono text-[13px] text-slate-300 tabular-nums bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-white/5 shadow-md">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tarifa Aplicada:</span>
                <span className="font-bold text-white">${selectedExitVehicle?.rate || 25} / min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tiempo Transcurrido:</span>
                <span className="font-bold text-white">{selectedExitVehicle?.durationMin || 0} min</span>
              </div>

              {appliedDiscount > 0 && (
                <div className="flex justify-between items-center text-emerald-400 font-bold">
                  <span>Descuento Autorizado (PIN Operador):</span>
                  <span>-${appliedDiscount.toLocaleString('es-CL')}</span>
                </div>
              )}
              {appliedSurcharge > 0 && (
                <div className="flex justify-between items-center text-rose-400 font-bold">
                  <span>Multa Ticket Extraviado (PIN Admin):</span>
                  <span>+${appliedSurcharge.toLocaleString('es-CL')}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                <span className="text-slate-400">Subtotal Neto:</span>
                <span className="text-slate-300">${netSubtotal.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">IVA (19% DTE SII):</span>
                <span className="text-slate-300">${ivaAmount.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-slate-700">
                <span className="text-sm font-bold text-white uppercase tracking-[0.06em]">
                  Total a Pagar:
                </span>
                <span className="text-4xl font-black text-emerald-400 tracking-tight">
                  ${finalTotal.toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                Medio de Pago
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'efectivo' as const, label: 'Efectivo' },
                  { id: 'tarjeta' as const, label: 'Tarjeta POS' },
                  { id: 'transferencia' as const, label: 'Transferencia' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCheckoutPaymentMethod(m.id)}
                    className={`h-10 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                      checkoutPaymentMethod === m.id
                        ? 'border-[1.5px] border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border border-[#dde2e8] bg-white text-slate-700 hover:bg-[#f8fafc] hover:border-[#c1c9d4]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Calculator (for Cash payment) */}
            {checkoutPaymentMethod === 'efectivo' && (
              <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e8ecf0] space-y-3 font-mono text-[13px] tabular-nums">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-bold uppercase text-xs tracking-[0.04em]">
                    Monto Recibido:
                  </span>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    className="w-32 h-10 px-3 rounded-lg border-[1.5px] border-[#dde2e8] text-right font-mono font-bold text-xl text-slate-900 bg-white focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div className="flex gap-1.5 justify-end flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCashGiven(finalTotal.toString())}
                    className="px-3 py-1.5 bg-white border border-[#dde2e8] rounded-lg text-[12px] text-slate-600 hover:bg-[#f1f5f9] hover:border-[#c1c9d4] font-bold transition-colors cursor-pointer"
                  >
                    Exacto
                  </button>
                  {[2000, 5000, 10000, 20000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashGiven(amt.toString())}
                      className="px-3 py-1.5 bg-white border border-[#dde2e8] rounded-lg text-[12px] text-slate-600 hover:bg-[#f1f5f9] hover:border-[#c1c9d4] font-bold transition-colors cursor-pointer"
                    >
                      ${amt / 1000}k
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#e8ecf0]">
                  <span className="text-slate-600 font-bold uppercase text-xs tracking-[0.04em]">
                    Vuelto a Entregar:
                  </span>
                  <span className="font-black text-emerald-600 text-2xl">
                    ${cashChange.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            )}

            {/* Confirm Checkout Button */}
            <button
              onClick={handleConfirmCheckout}
              data-shortcut="Atajo: Enter"
              className="shortcut-tooltip w-full h-13 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[15px] flex items-center justify-center gap-3 shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Cobrar y Emitir Voucher DTE</span>
            </button>
          </div>
        </div>
      )}

      {/* ── SUBPANE 3: HISTORIAL DEL TURNO ── */}
      {currentSubtab === 'history' && (
        <div id="pos-subtab-history" className="bg-white border border-[#e8ecf0] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#f1f5f9] pb-4 gap-3">
            <div>
              <h3 className="text-[15px] font-bold tracking-tight text-slate-900">
                Libro de Caja Diario
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Registro cronológico de movimientos del turno en Serrano 447. Ingresos en verde, egresos en rojo.
              </p>
            </div>
            <div className="flex items-center gap-3 tabular-nums">
              <button
                onClick={onOpenManualTransaction}
                className="px-4 h-10 rounded-xl border border-[#dde2e8] bg-white text-slate-700 hover:bg-[#f8fafc] text-[12px] font-bold font-mono transition-colors shadow-xs cursor-pointer"
              >
                + / - Movimiento de Caja Manual
              </button>
              <div className="px-5 py-2 rounded-xl bg-[#0f172a] text-white font-mono text-[13px] font-bold flex items-center gap-3">
                <span className="text-slate-400">Balance Total:</span>
                <span className="text-emerald-400 text-lg font-black">
                  ${runningBalance.toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-[#f8fafc] text-slate-400 text-[10px] uppercase font-mono font-bold tracking-[0.07em] rounded-xl border border-[#e8ecf0]">
            <div className="col-span-1">Hora</div>
            <div className="col-span-2">Tipo</div>
            <div className="col-span-3">Concepto &amp; Vehículo</div>
            <div className="col-span-2">Medio Pago</div>
            <div className="col-span-2 text-right">Ingresos (+)</div>
            <div className="col-span-2 text-right">Egresos (-)</div>
          </div>

          <div className="flex flex-col max-h-[500px] overflow-y-auto pb-3 space-y-1 tabular-nums">
            {historyLogs.map((log, i) => (
              <div
                key={`${log.time}-${i}`}
                className="grid grid-cols-12 gap-3 items-center px-4 py-3 border-b border-[#f8fafc] bg-white hover:bg-[#f8fafc] transition-colors font-mono text-[12px]"
              >
                <div className="col-span-1 text-slate-400 font-bold">{log.time}</div>
                <div className="col-span-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${
                      log.type === 'APERTURA'
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : log.type === 'INGRESO'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : log.type === 'RETIRO'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {log.type}
                  </span>
                </div>
                <div className="col-span-3 text-slate-700 font-sans text-xs leading-tight">
                  {log.desc} <br />
                  {log.plate !== '---' && (
                    <span className="license-plate-chip px-1.5 py-0.5 text-[10px] shadow-xs mt-1.5 inline-block">
                      {log.plate}
                    </span>
                  )}
                </div>
                <div className="col-span-2 text-slate-500 font-bold">{log.method}</div>
                <div className="col-span-2 text-right bg-emerald-50/40 py-2 px-3 rounded-lg border border-emerald-100/50">
                  {!log.isEgreso && log.amount > 0 ? (
                    <span className="text-emerald-600 font-black">${log.amount.toLocaleString('es-CL')}</span>
                  ) : (
                    <span className="text-slate-300">---</span>
                  )}
                </div>
                <div className="col-span-2 text-right bg-rose-50/40 py-2 px-3 rounded-lg border border-rose-100/50">
                  {log.isEgreso && log.amount > 0 ? (
                    <span className="text-rose-600 font-black">${log.amount.toLocaleString('es-CL')}</span>
                  ) : (
                    <span className="text-slate-300">---</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Antifraud PIN Modal */}
      <AntifraudPinModal
        type={pinModalType}
        baseAmount={baseTotal}
        onClose={() => setPinModalType(null)}
        onConfirm={handlePinConfirm}
      />
    </div>
  );
};
