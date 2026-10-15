import React, { useState, useMemo, useEffect } from 'react';
import { useParking } from '../../context/ParkingContext';
import { AppScreen } from '../../types';
import { PatioMatrix2D } from '../common/PatioMatrix2D';
import { PatioVehicle, CashHistoryLog } from './PosView';
import {
  Clock,
  Car,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Calendar,
  Search,
  CheckCircle2,
  Building2,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  Filter,
  User as UserIcon,
  X,
  CreditCard,
  Banknote,
  Send,
  Lock,
} from 'lucide-react';

export type SupervisorMobileTab = 'supervision' | 'patio' | 'flujo' | 'reportes' | 'ajustes';

interface SupervisorMobileViewProps {
  activeTab: SupervisorMobileTab;
  onSelectTab: (tab: SupervisorMobileTab) => void;
  activeVehicles: PatioVehicle[];
  historyLogs: CashHistoryLog[];
  onNavigate: (screen: AppScreen) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onInitiateOpenShift?: () => void;
  onInitiateCashClose?: () => void;
}

export const SupervisorMobileView: React.FC<SupervisorMobileViewProps> = ({
  activeTab,
  onSelectTab,
  activeVehicles,
  historyLogs,
  onNavigate,
  onShowToast,
  onInitiateOpenShift,
  onInitiateCashClose,
}) => {
  const { user, currentShift, tickets, slots, tariffConfig, agreements } = useParking();

  const isShiftActive = currentShift?.status === 'abierto';
  const totalSlots = 30;
  const occupiedCount = activeVehicles.length;
  const freeCount = Math.max(0, totalSlots - occupiedCount);
  const occupancyPercent = Math.round((occupiedCount / totalSlots) * 100);

  // Sector A (01-15 techado) y Sector B (16-30 general)
  const sectorAOccupied = activeVehicles.filter((v) => v.slot <= 15).length;
  const sectorBOccupied = activeVehicles.filter((v) => v.slot > 15).length;

  // Estadía media y sobreestadía (> 2 horas)
  const averageStayMin = useMemo(() => {
    if (activeVehicles.length === 0) return 0;
    const sum = activeVehicles.reduce((acc, v) => acc + (v.durationMin || 0), 0);
    return Math.round(sum / activeVehicles.length);
  }, [activeVehicles]);

  const overstayVehicles = useMemo(() => {
    return activeVehicles.filter((v) => (v.durationMin || 0) >= 120);
  }, [activeVehicles]);

  // Recaudación en vivo del turno actual
  const paidTickets = useMemo(() => tickets.filter((t) => t.status === 'pagado'), [tickets]);
  const todayRevenue = useMemo(
    () => paidTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0),
    [paidTickets]
  );

  const cashIncome = useMemo(
    () =>
      paidTickets
        .filter((t) => t.paymentMethod === 'efectivo')
        .reduce((sum, t) => sum + (t.totalAmount || 0), 0),
    [paidTickets]
  );

  const cardIncome = useMemo(
    () =>
      paidTickets
        .filter((t) => t.paymentMethod && t.paymentMethod !== 'efectivo')
        .reduce((sum, t) => sum + (t.totalAmount || 0), 0),
    [paidTickets]
  );

  // Temporizador en vivo
  const [shiftDuration, setShiftDuration] = useState('00:00:00');
  useEffect(() => {
    const updateTimer = () => {
      if (isShiftActive && currentShift?.startTime) {
        const start = new Date(currentShift.startTime).getTime();
        const diffMs = Math.max(0, Date.now() - start);
        const hours = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setShiftDuration(
          `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        );
      } else {
        setShiftDuration('--:--:--');
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isShiftActive, currentShift?.startTime]);

  // Gráfico de Ingresos de Vehículos por Hora (08:00 a 20:00)
  const hourlyEntries = useMemo(() => {
    const hours = [
      { label: '08h', count: 0 },
      { label: '10h', count: 0 },
      { label: '12h', count: 0 },
      { label: '14h', count: 0 },
      { label: '16h', count: 0 },
      { label: '18h', count: 0 },
      { label: '20h', count: 0 },
    ];

    tickets.forEach((t) => {
      if (!t.entryTime) return;
      const h = new Date(t.entryTime).getHours();
      if (h >= 8 && h < 10) hours[0].count++;
      else if (h >= 10 && h < 12) hours[1].count++;
      else if (h >= 12 && h < 14) hours[2].count++;
      else if (h >= 14 && h < 16) hours[3].count++;
      else if (h >= 16 && h < 18) hours[4].count++;
      else if (h >= 18 && h < 20) hours[5].count++;
      else if (h >= 20) hours[6].count++;
    });

    const maxVal = Math.max(1, ...hours.map((h) => h.count));
    return { slots: hours, maxVal };
  }, [tickets]);

  // Aprobaciones Express Diferidas (Simulación reactiva con persistencia local)
  const [pendingApprovals, setPendingApprovals] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('cordano_deferred_approvals');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'appr-01',
        type: 'DISCOUNT',
        amount: 1500,
        description: 'Descuento cliente frecuente vecino Serrano ($1.500)',
        operator: 'Juan Pérez (Garita 01)',
        time: '11:20 hrs',
        status: 'pending',
      },
    ];
  });

  const [activeApprovalToReview, setActiveApprovalToReview] = useState<any | null>(null);
  const [supervisorPinInput, setSupervisorPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const handleAuthorizeApproval = (approvalId: string) => {
    const validPins = ['2026', '9988', '1234', 'admin', 'admin123'];
    if (!validPins.includes(supervisorPinInput.trim())) {
      setPinError('PIN de Supervisor inválido. Ingrese el código maestro (ej. 2026).');
      return;
    }
    const updated = pendingApprovals.filter((a) => a.id !== approvalId);
    setPendingApprovals(updated);
    try {
      localStorage.setItem('cordano_deferred_approvals', JSON.stringify(updated));
    } catch (e) {}
    setActiveApprovalToReview(null);
    setSupervisorPinInput('');
    setPinError(null);
    onShowToast('Excepción diferida autorizada y firmada electrónicamente.', 'success');
  };

  // Estado para ficha modal táctil de vehículo al pulsar cupo en Patio 2D
  const [inspectedVehicle, setInspectedVehicle] = useState<PatioVehicle | null>(null);

  // Filtros y búsqueda para el stream de Flujo en Vivo
  const [flowSearch, setFlowSearch] = useState('');
  const [flowFilter, setFlowFilter] = useState<'TODOS' | 'ENTRADAS' | 'SALIDAS'>('TODOS');

  // Timeline unificado de movimientos vehiculares
  const liveMovements = useMemo(() => {
    const list: Array<{
      id: string;
      time: string;
      plate: string;
      type: 'INGRESO' | 'SALIDA';
      slotCode?: string;
      vehicleType: string;
      amount?: number;
      paymentMethod?: string;
      durationMin?: number;
    }> = [];

    // 1. Cobros y salidas
    paidTickets.forEach((t) => {
      list.push({
        id: `salida-${t.id}`,
        time: t.exitTime ? new Date(t.exitTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '---',
        plate: t.plateNumber,
        type: 'SALIDA',
        slotCode: t.slotCode,
        vehicleType: t.vehicleType,
        amount: t.totalAmount,
        paymentMethod: t.paymentMethod,
        durationMin: t.durationMinutes || 0,
      });
    });

    // 2. Ingresos activos
    activeVehicles.forEach((v) => {
      list.push({
        id: `ingreso-${v.ticketId || v.plate}`,
        time: v.entry,
        plate: v.plate,
        type: 'INGRESO',
        slotCode: v.slotCode,
        vehicleType: v.cat === 'Moto' ? 'Motocicleta' : v.cat === 'SUV' ? 'Furgón / SUV' : 'Automóvil',
        durationMin: v.durationMin,
      });
    });

    // Ordenar del más reciente al más antiguo
    return list.filter((m) => {
      if (flowFilter === 'ENTRADAS' && m.type !== 'INGRESO') return false;
      if (flowFilter === 'SALIDAS' && m.type !== 'SALIDA') return false;
      if (flowSearch.trim()) {
        const q = flowSearch.trim().toUpperCase();
        return m.plate.toUpperCase().includes(q) || (m.slotCode && m.slotCode.toUpperCase().includes(q));
      }
      return true;
    });
  }, [paidTickets, activeVehicles, flowFilter, flowSearch]);

  return (
    <div className="w-full min-h-screen bg-[#1E1E2F] text-slate-100 flex flex-col font-sans pb-24 animate-fade-in">
      
      {/* ── SUBHEADER DE SUPERVISIÓN EN VIVO ── */}
      <div className="bg-[#2D2D44] border-b border-slate-700/80 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E2498A] flex items-center justify-center text-white font-black text-xs shadow-xs">
            👁️
          </div>
          <div>
            <h2 className="font-extrabold text-white text-xs leading-none">
              Supervisión Serrano 447
            </h2>
            <span className="text-[10px] text-pink-300 font-mono font-semibold">
              {user?.name || 'Braulio Cordano'} · {user?.role || 'supervisor'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isShiftActive ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-emerald-950 text-emerald-300 border border-emerald-700/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {shiftDuration}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-amber-950 text-amber-300 border border-amber-800">
              🔒 Turno Cerrado
            </span>
          )}
        </div>
      </div>

      {/* ── CUERPO PRINCIPAL SEGÚN PESTAÑA ACTIVA ── */}
      <div className="p-3.5 space-y-4 max-w-xl mx-auto w-full flex-1">
        
        {/* ============================================================== */}
        {/* PESTAÑA 1: COCKPIT DE SUPERVISIÓN & KPIs                       */}
        {/* ============================================================== */}
        {activeTab === 'supervision' && (
          <div className="space-y-4 animate-fade-in-up">
            
            {/* Banner de Operador en Garita */}
            <div className="p-3.5 rounded-2xl bg-[#2D2D44] border border-slate-700 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1E1E2F] border border-slate-700 flex items-center justify-center text-base">
                  👮
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block font-mono">
                    Cajero en Garita
                  </span>
                  <span className="text-xs font-black text-white">
                    {currentShift?.operatorName || 'Carlos Mendoza'}
                  </span>
                </div>
              </div>

              <div className="text-right font-mono tabular-nums">
                <span className="text-[10px] text-gray-400 block font-sans">Fondo Inicial</span>
                <span className="text-xs font-black text-amber-300">
                  $ {(currentShift?.initialCash || 50000).toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            {/* 4 KPIs de Telemetría Ejecutiva */}
            <div className="grid grid-cols-2 gap-2.5 font-mono tabular-nums">
              
              {/* KPI 1: Ocupación de Patio */}
              <div 
                onClick={() => onSelectTab('patio')}
                className="p-3.5 rounded-2xl bg-[#2D2D44] border border-slate-700 shadow-xs hover:border-[#E2498A]/50 transition cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-sans uppercase font-bold">
                  <span>Ocupación 30 Cupos</span>
                  <Car className="w-3.5 h-3.5 text-[#E2498A]" />
                </div>
                <div className="text-xl font-black text-white mt-1">
                  {occupiedCount} <span className="text-xs text-gray-400 font-normal">/ 30</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1 pt-1 border-t border-slate-700/60 font-mono">
                  <span className="text-emerald-400 font-bold">{freeCount} libres</span>
                  <span className="text-pink-300 font-bold">{occupancyPercent}%</span>
                </div>
              </div>

              {/* KPI 2: Recaudación Hoy */}
              <div 
                onClick={() => onSelectTab('flujo')}
                className="p-3.5 rounded-2xl bg-[#2D2D44] border border-slate-700 shadow-xs hover:border-[#E2498A]/50 transition cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-sans uppercase font-bold">
                  <span>Recaudación Hoy</span>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xl font-black text-emerald-400 mt-1">
                  ${todayRevenue.toLocaleString('es-CL')}
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1 pt-1 border-t border-slate-700/60 font-mono">
                  <span>Efec: ${cashIncome.toLocaleString('es-CL')}</span>
                  <span>POS: ${cardIncome.toLocaleString('es-CL')}</span>
                </div>
              </div>

              {/* KPI 3: Permanencia Media & Sobrestadía */}
              <div className="p-3.5 rounded-2xl bg-[#2D2D44] border border-slate-700 shadow-xs">
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-sans uppercase font-bold">
                  <span>Estadía Media</span>
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="text-xl font-black text-white mt-1">
                  {averageStayMin} <span className="text-xs text-gray-400 font-normal">min (ALOS)</span>
                </div>
                <div className="mt-1 pt-1 border-t border-slate-700/60 text-[10px]">
                  {overstayVehicles.length > 0 ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <span>⚠️</span> {overstayVehicles.length} con sobreestadía (&gt;2h)
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold">✓ Sin sobreestadía</span>
                  )}
                </div>
              </div>

              {/* KPI 4: Afluencia Horario Punta */}
              <div className="p-3.5 rounded-2xl bg-[#2D2D44] border border-slate-700 shadow-xs">
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-sans uppercase font-bold">
                  <span>Horario Punta</span>
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-base font-black text-purple-300 mt-1 font-mono">
                  11:00 — 14:00
                </div>
                <div className="mt-1 pt-1 border-t border-slate-700/60 text-[10px] text-gray-400">
                  <span>Afluencia alta en garita</span>
                </div>
              </div>
            </div>

            {/* Curva Dinámica de Vehículos por Hora (08:00 a 20:00) */}
            <div className="p-4 rounded-2xl bg-[#2D2D44] border border-slate-700 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#E2498A]" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                    Ingresos por Hora (Hoy)
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-pink-300 bg-pink-950/80 border border-pink-800/80 px-2 py-0.5 rounded-full">
                  Total: {tickets.length} veh.
                </span>
              </div>

              {/* Gráfico de Barras Ergonómico */}
              <div className="h-28 w-full flex items-end gap-2 pt-3 pb-1 bg-[#1E1E2F] rounded-xl border border-slate-800 px-3">
                {hourlyEntries.slots.map((point) => {
                  const heightPercent = Math.min(100, Math.max(14, Math.round((point.count / hourlyEntries.maxVal) * 100)));
                  const isPeak = point.count > 0 && point.count === hourlyEntries.maxVal;

                  return (
                    <div key={point.label} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <span className="text-[9px] font-mono font-bold text-gray-400 mb-1 opacity-80 group-hover:opacity-100 tabular-nums">
                        {point.count}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t transition-all duration-300 ${
                          isPeak
                            ? 'bg-[#E2498A] shadow-[0_0_8px_rgba(226,73,138,0.7)]'
                            : 'bg-slate-600 group-hover:bg-[#E2498A]/70'
                        }`}
                      />
                      <span className={`text-[9px] font-mono mt-1 ${isPeak ? 'text-pink-300 font-black' : 'text-gray-400'}`}>
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span>Garita: Serrano 447</span>
                <span className="text-pink-300 font-bold">Punta destacada</span>
              </div>
            </div>

            {/* Bandeja de Aprobaciones Express Diferidas (Antifraude) */}
            <div className="p-4 rounded-2xl bg-[#2D2D44] border border-slate-700 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#E2498A]" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                    Aprobaciones Express Diferidas
                  </h3>
                </div>
                {pendingApprovals.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                    {pendingApprovals.length} pendientes
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Al día
                  </span>
                )}
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="p-3 rounded-xl bg-[#1E1E2F] border border-slate-800 flex items-center gap-2.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sin excepciones pendientes. Control antifraude al día.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingApprovals.map((appr) => (
                    <div
                      key={appr.id}
                      className="p-3 rounded-xl bg-[#1E1E2F] border border-rose-900/60 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-pink-300 text-[11px]">
                          {appr.type === 'DISCOUNT' ? 'Descuento Manual en Garita' : 'Ticket Extraviado'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{appr.time}</span>
                      </div>
                      <p className="text-gray-300 text-[11px] leading-relaxed">
                        "{appr.description}"
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                        <span className="text-[10px] text-gray-400 font-mono">{appr.operator}</span>
                        <button
                          type="button"
                          onClick={() => setActiveApprovalToReview(appr)}
                          className="px-3 py-1 rounded-lg bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs shadow-xs active:scale-95 cursor-pointer"
                        >
                          Autorizar con PIN
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accesos Rápidos Complementarios */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('clients')}
                className="p-3.5 rounded-2xl bg-[#2D2D44] hover:bg-slate-700 border border-slate-700 text-left transition active:scale-98 cursor-pointer space-y-1"
              >
                <div className="w-8 h-8 rounded-xl bg-pink-950 text-pink-300 flex items-center justify-center text-sm font-bold">
                  🏢
                </div>
                <div className="font-extrabold text-xs text-white">Convenios &amp; Flotas</div>
                <div className="text-[10px] text-gray-400">{agreements.length} contratos activos</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('support')}
                className="p-3.5 rounded-2xl bg-[#2D2D44] hover:bg-slate-700 border border-slate-700 text-left transition active:scale-98 cursor-pointer space-y-1"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-950 text-blue-300 flex items-center justify-center text-sm font-bold">
                  📘
                </div>
                <div className="font-extrabold text-xs text-white">SOPs &amp; Ayuda</div>
                <div className="text-[10px] text-gray-400">Manuales garita Serrano</div>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 2: PATIO 2D ARQUITECTÓNICO (30 CUPOS SERRANO 447)      */}
        {/* ============================================================== */}
        {activeTab === 'patio' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="p-3.5 rounded-2xl bg-[#2D2D44] border border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-xs text-white flex items-center gap-1.5 font-mono uppercase">
                  <span>🗺️ Patio 2D · Serrano 447</span>
                </h3>
                <span className="text-[10px] text-gray-400">
                  Sector A (01–15 Techado) · Sector B (16–30 General)
                </span>
              </div>
              <span className="text-xs font-mono font-black text-[#E2498A]">
                {occupiedCount}/30 Ocupados
              </span>
            </div>

            {/* Matriz 2D adaptada para pantalla táctil móvil */}
            <div className="bg-[#2D2D44] p-3.5 rounded-2xl border border-slate-700 shadow-sm">
              <PatioMatrix2D
                activeVehicles={activeVehicles}
                mode="mobile"
                onSelectSlot={(slotCode, vehicle) => {
                  if (vehicle) {
                    setInspectedVehicle(vehicle);
                  } else {
                    onShowToast(`Cupo ${slotCode} libre y disponible para estacionar.`, 'info');
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 3: FLUJO EN VIVO, BUSCADOR & TRANSACCIONES             */}
        {/* ============================================================== */}
        {activeTab === 'flujo' && (
          <div className="space-y-4 animate-fade-in-up font-sans">
            
            {/* Buscador Rápido de Patente */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={flowSearch}
                onChange={(e) => setFlowSearch(e.target.value)}
                placeholder="Buscar por patente o cupo (ej. BBCL10, A-04)..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#2D2D44] border border-slate-700 text-xs font-mono text-white placeholder-gray-400 focus:outline-none focus:border-[#E2498A]"
              />
            </div>

            {/* Resumen Financiero del Día */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono tabular-nums">
              <div className="p-2.5 rounded-xl bg-[#2D2D44] border border-slate-700">
                <span className="text-[9px] uppercase font-bold text-gray-400 block font-sans">Total Cobros</span>
                <span className="text-xs font-black text-emerald-400 mt-0.5 block">
                  ${todayRevenue.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#2D2D44] border border-slate-700">
                <span className="text-[9px] uppercase font-bold text-gray-400 block font-sans">Efectivo</span>
                <span className="text-xs font-black text-white mt-0.5 block">
                  ${cashIncome.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#2D2D44] border border-slate-700">
                <span className="text-[9px] uppercase font-bold text-gray-400 block font-sans">POS / Tarjetas</span>
                <span className="text-xs font-black text-blue-300 mt-0.5 block">
                  ${cardIncome.toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            {/* Filtros de Tipo de Movimiento */}
            <div className="flex bg-[#2D2D44] p-1 rounded-xl border border-slate-700 gap-1 text-[11px] font-bold">
              {(['TODOS', 'ENTRADAS', 'SALIDAS'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFlowFilter(f)}
                  className={`flex-1 py-1.5 rounded-lg transition active:scale-95 cursor-pointer ${
                    flowFilter === f ? 'bg-[#E2498A] text-white shadow-xs' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {f === 'TODOS' ? 'Todos' : f === 'ENTRADAS' ? 'Entradas' : 'Salidas & Cobros'}
                </button>
              ))}
            </div>

            {/* Timeline Cronológico de Movimientos */}
            <div className="space-y-2">
              {liveMovements.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 bg-[#2D2D44] rounded-2xl border border-slate-700">
                  No se encontraron movimientos registrados con el filtro actual.
                </div>
              ) : (
                liveMovements.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-[#2D2D44] border border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          item.type === 'INGRESO'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-pink-950 text-pink-300 border border-pink-800'
                        }`}
                      >
                        {item.type === 'INGRESO' ? '↓' : '↑'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-white tracking-wider">
                            {item.plate}
                          </span>
                          {item.slotCode && (
                            <span className="text-[10px] font-mono text-gray-400 bg-[#1E1E2F] px-1.5 py-0.2 rounded border border-slate-800">
                              {item.slotCode}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-sans mt-0.5 truncate">
                          {item.type === 'INGRESO'
                            ? `Entrada · ${item.vehicleType}`
                            : `Salida · Estadía: ${item.durationMin}m`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono tabular-nums">
                      <div className="text-[10px] text-gray-400">{item.time}</div>
                      {item.type === 'SALIDA' && item.amount !== undefined && (
                        <div className="text-xs font-black text-emerald-400 mt-0.5">
                          +${item.amount.toLocaleString('es-CL')}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 4: HUB DE REPORTES & CORTES Z                          */}
        {/* ============================================================== */}
        {activeTab === 'reportes' && (
          <div className="space-y-4 animate-fade-in-up font-sans">
            <div className="p-4 rounded-2xl bg-[#2D2D44] border border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                    Hub Financiero &amp; Cortes Z
                  </h3>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">Serrano 447</span>
              </div>

              <div className="p-3 rounded-xl bg-[#1E1E2F] border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center text-gray-300">
                  <span>Recaudación del Turno en Curso:</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">
                    ${todayRevenue.toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <span>Tickets Liquidados:</span>
                  <span className="font-mono font-bold text-white">{paidTickets.length} operaciones</span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <span>Vehículos en Patio al Momento:</span>
                  <span className="font-mono font-bold text-pink-300">{activeVehicles.length} activos</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
              >
                <span>📊</span>
                <span>Abrir Módulo Completo de Reportes Z &amp; Auditoría</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 5: AJUSTES & CONFIGURACIÓN                             */}
        {/* ============================================================== */}
        {activeTab === 'ajustes' && (
          <div className="space-y-4 animate-fade-in-up font-sans">
            <div className="p-4 rounded-2xl bg-[#2D2D44] border border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#E2498A]" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                    Ajustes de Supervisión
                  </h3>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">Ley 20.967</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[#1E1E2F] border border-slate-800 flex justify-between items-center">
                  <span className="text-gray-300">Tarifa Minuto (Automóvil):</span>
                  <span className="font-mono font-black text-white">
                    ${tariffConfig?.vehicleRates?.['Automóvil']?.minuteRate || 35} / min
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#1E1E2F] border border-slate-800 flex justify-between items-center">
                  <span className="text-gray-300">Tolerancia de Gracia:</span>
                  <span className="font-mono font-black text-emerald-400">15 minutos</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1E1E2F] border border-slate-800 flex justify-between items-center">
                  <span className="text-gray-300">Recargo Ticket Extraviado:</span>
                  <span className="font-mono font-black text-amber-300">$ 8.000 CLP</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
              >
                <span>⚙️</span>
                <span>Gestionar Configuración Completa</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL INFERIOR: FICHA DE INSPECCIÓN DE VEHÍCULO (PATIO 2D) ── */}
      {inspectedVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end justify-center p-0 sm:p-4 animate-fade-in font-sans">
          <div className="bg-[#2D2D44] border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 max-w-sm w-full space-y-4 animate-slide-in-up text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#E2498A] text-white font-mono font-black text-sm">
                  {inspectedVehicle.plate}
                </span>
                <span className="text-xs text-gray-400 font-mono">Cupo {inspectedVehicle.slotCode}</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectedVehicle(null)}
                className="w-7 h-7 rounded-full bg-slate-700 text-gray-300 hover:text-white flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#1E1E2F] border border-slate-800 flex justify-between">
                <span className="text-gray-400 font-sans">Tipo Vehículo:</span>
                <span className="font-bold text-white">{inspectedVehicle.cat}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#1E1E2F] border border-slate-800 flex justify-between">
                <span className="text-gray-400 font-sans">Hora Ingreso:</span>
                <span className="font-bold text-white">{inspectedVehicle.entry} hrs</span>
              </div>
              <div className="p-3 rounded-xl bg-[#1E1E2F] border border-slate-800 flex justify-between">
                <span className="text-gray-400 font-sans">Tiempo en Patio:</span>
                <span className="font-black text-pink-300">{inspectedVehicle.durationMin} min</span>
              </div>
              <div className="p-3 rounded-xl bg-[#1E1E2F] border border-slate-800 flex justify-between">
                <span className="text-gray-400 font-sans">Tarifa Estimada:</span>
                <span className="font-black text-emerald-400">
                  ${(inspectedVehicle.durationMin * (inspectedVehicle.rate || 35)).toLocaleString('es-CL')} CLP
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInspectedVehicle(null)}
              className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs cursor-pointer"
            >
              Cerrar Ficha
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: AUTORIZACIÓN PIN DE APROBACIÓN EXPRESS (ANTIFRAUDE) ── */}
      {activeApprovalToReview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#2D2D44] border border-slate-700 rounded-3xl p-5 max-w-sm w-full space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛡️</span>
                <h4 className="font-black text-sm text-white">Autorización de Excepción</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveApprovalToReview(null);
                  setSupervisorPinInput('');
                  setPinError(null);
                }}
                className="w-7 h-7 rounded-full bg-slate-700 text-gray-300 hover:text-white flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              {activeApprovalToReview.description}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAuthorizeApproval(activeApprovalToReview.id);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                  Ingrese PIN de Supervisor (ej. 2026)
                </label>
                <input
                  type="password"
                  autoFocus
                  value={supervisorPinInput}
                  onChange={(e) => {
                    setSupervisorPinInput(e.target.value);
                    if (pinError) setPinError(null);
                  }}
                  placeholder="PIN maestro..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-[#1E1E2F] font-mono text-sm font-bold text-white focus:border-[#E2498A] focus:outline-none"
                />
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold">
                  ⚠️ {pinError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveApprovalToReview(null);
                    setSupervisorPinInput('');
                    setPinError(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs shadow-xs"
                >
                  Autorizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
