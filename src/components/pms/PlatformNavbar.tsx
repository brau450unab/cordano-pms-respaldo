import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppScreen } from '../../types';
import { useParking } from '../../context/ParkingContext';

interface PlatformNavbarProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  shiftTimer?: string;
  operatorName: string;
  onInitiateCashClose: () => void;
  onInitiateOpenShift?: () => void;
  onOpenCommandPalette?: () => void;
  onLogout?: () => void;
  activeMobileTab?: 'plano' | 'cronologia' | 'supervision';
  onSelectMobileTab?: (tab: 'plano' | 'cronologia' | 'supervision') => void;
}

export const PlatformNavbar: React.FC<PlatformNavbarProps> = ({
  currentScreen,
  onNavigate,
  shiftTimer,
  operatorName,
  onInitiateCashClose,
  onInitiateOpenShift,
  onOpenCommandPalette,
  onLogout,
  activeMobileTab = 'plano',
  onSelectMobileTab,
}) => {
  const { currentShift, user, tickets, slots, setUserRole } = useParking();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [internalTimer, setInternalTimer] = useState('00:00:00');
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState<'operador' | 'supervisor' | 'administrador'>('administrador');

  const isShiftActive = !!currentShift && currentShift.status === 'abierto';

  const occupiedCount = slots ? slots.filter((s) => s.status === 'ocupado').length : tickets.filter((t) => t.status === 'activo').length;
  const freeCount = Math.max(0, 30 - occupiedCount);

  const activeVehicles = useMemo(() => {
    return tickets.filter((t) => t.status === 'activo');
  }, [tickets]);

  const overstayVehicles = useMemo(() => {
    return activeVehicles.filter((t) => {
      const dur = (Date.now() - new Date(t.entryTime).getTime()) / 60000;
      return dur >= 120;
    });
  }, [activeVehicles]);

  const paidTickets = useMemo(() => {
    return tickets.filter((t) => t.status === 'pagado');
  }, [tickets]);

  const shiftRevenue = useMemo(() => {
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

  // Hourly vehicles arrivals
  const hourlyVehicles = useMemo(() => {
    const hoursMap: Record<string, number> = {
      '08:00': 0,
      '10:00': 0,
      '12:00': 0,
      '14:00': 0,
      '16:00': 0,
      '18:00': 0,
      '20:00': 0,
    };
    tickets.forEach((t) => {
      const d = new Date(t.entryTime);
      const h = d.getHours();
      if (h < 10) hoursMap['08:00']++;
      else if (h < 12) hoursMap['10:00']++;
      else if (h < 14) hoursMap['12:00']++;
      else if (h < 16) hoursMap['14:00']++;
      else if (h < 18) hoursMap['16:00']++;
      else if (h < 20) hoursMap['18:00']++;
      else hoursMap['20:00']++;
    });
    return Object.entries(hoursMap).map(([hour, count]) => ({
      hour,
      count: Math.max(count, Math.round(activeVehicles.length * 0.3)),
    }));
  }, [tickets, activeVehicles]);

  // Recent timeline events
  const recentMovements = useMemo(() => {
    const list: { id: string; type: 'INGRESO' | 'SALIDA'; plate: string; time: string; slotCode?: string; }[] = [];
    tickets.forEach((t) => {
      list.push({
        id: `in-${t.id}`,
        type: 'INGRESO',
        plate: t.plateNumber,
        time: new Date(t.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        slotCode: t.slotCode || 'Patio',
      });
      if (t.status === 'pagado' && t.exitTime) {
        list.push({
          id: `out-${t.id}`,
          type: 'SALIDA',
          plate: t.plateNumber,
          time: new Date(t.exitTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
          slotCode: t.slotCode || 'Patio',
        });
      }
    });
    return list.slice(-5).reverse();
  }, [tickets]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isShiftActive && currentShift?.startTime) {
      const update = () => {
        const start = new Date(currentShift.startTime).getTime();
        const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(diff % 60).toString().padStart(2, '0');
        setInternalTimer(`${h}:${m}:${s}`);
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    } else {
      setInternalTimer('00:00:00');
    }
  }, [isShiftActive, currentShift?.startTime]);

  

  const rawNavItems: { id: AppScreen; label: string; icon: string; requiresAdmin?: boolean }[] = [
    { id: 'pos',     label: 'Garita POS', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'menu',    label: 'Dashboard',  icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'map',     label: 'Plano 2D',   icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
    { id: 'clients', label: 'Convenios',  icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'reports', label: 'Auditoría',  icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', requiresAdmin: true },
  ];

  const primaryNavItems = rawNavItems.filter((item) => {
    if (item.requiresAdmin) {
      return user?.role === 'administrador' || user?.role === 'supervisor';
    }
    return true;
  });

  const isActive = (id: AppScreen) =>
    currentScreen === id ||
    (id === 'menu'    && currentScreen === 'inicio') ||
    (id === 'pos'     && ['operacion_salida','operacion_ingreso'].includes(currentScreen)) ||
    (id === 'map'     && currentScreen === 'operacion_layout') ||
    (id === 'reports' && ['reportes_dashboard','reportes_auditoria','reportes_database'].includes(currentScreen));

  const initials = operatorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <>
      <nav className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-[#2D2D44] text-[#D1D5DB] sticky top-0 z-50 font-sans border-b border-slate-600 shadow-sm">
        {/* LEFT: BRAND */}
        <div 
          onClick={() => onNavigate('landing')} 
          className="flex items-center gap-2 sm:gap-3 shrink-0 cursor-pointer group"
          title="Ir a Landing Page Principal"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E2498A] flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
             <span className="text-white font-black text-base sm:text-lg">C</span>
          </div>
          <div className="flex flex-col">
             <span className="font-extrabold text-white text-sm sm:text-base tracking-tight leading-none group-hover:text-pink-300 transition-colors">
               Cordano<span className="text-[#E2498A]"> Parking Ops</span>
             </span>
             <span className="text-[9px] sm:text-[10px] text-gray-400 font-semibold mt-0.5 tracking-wide hidden xs:inline">Serrano 447</span>
          </div>

          {/* Role Indicator Badge */}
          {user?.role === 'administrador' ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-700/80">
              👁️ Supervisión Admin
            </span>
          ) : user?.role === 'supervisor' ? (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/80">
              🛡️ Supervisor
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-950 text-pink-300 border border-pink-700/80">
              👷 Operador Garita
            </span>
          )}
        </div>

        {/* CENTER: PILL NAVIGATION (Ocupa libremente el espacio disponible de manera equilibrada y sin barra de scroll) */}
        <div className="hidden md:flex flex-1 items-center justify-center mx-2 lg:mx-6 min-w-0">
          <div className="w-full max-w-4xl flex items-center p-1 bg-[#1E1E2F] rounded-xl border border-slate-600 gap-1 sm:gap-1.5">
            {primaryNavItems.map((item) => {
              const active = isActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex-1 min-w-0 h-9 px-2 sm:px-3 lg:px-4 flex items-center justify-center gap-1.5 rounded-lg text-xs lg:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    active 
                      ? 'bg-slate-600 text-white shadow-sm' 
                      : 'text-[#9CA3AF] hover:text-white hover:bg-slate-600/50'
                  }`}
                >
                  <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${active ? 'text-white' : 'text-[#6B7280]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: TOOLS & PROFILE */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          
          {/* Search (Icon-only on mobile/narrow screens to prevent clipping) */}
          <button 
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 bg-[#1E1E2F] hover:bg-slate-600 border border-slate-600 rounded-lg text-xs sm:text-sm font-semibold text-[#9CA3AF] transition-colors cursor-pointer"
            title="Buscar patente o folio (Ctrl+K)"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden sm:inline">Buscar</span>
            <div className="hidden xl:flex items-center justify-center w-4 h-4 ml-1 rounded bg-[#2D2D44] border border-slate-600 text-[9px] font-bold text-gray-500">
              K
            </div>
          </button>

          {/* Live Shift Timer Widget in Top Navbar (Solo temporizador según indicación) */}
          {isShiftActive ? (
            <div 
              id="persistent-shift-widget-nav" 
              className="flex items-center gap-2 h-8 sm:h-9 px-2.5 sm:px-3 bg-[#1E1E2F] border border-emerald-500/40 rounded-xl shadow-xs"
              title="Turno en curso activo"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-white text-xs sm:text-sm font-mono font-black tabular-nums tracking-wider">
                {shiftTimer || internalTimer}
              </span>
            </div>
          ) : (
            <div 
              id="persistent-shift-widget-nav" 
              className="flex items-center gap-1.5 h-8 sm:h-9 px-2 sm:px-3 bg-[#1E1E2F] border border-amber-500/40 rounded-xl shadow-xs"
            >
              <div className="flex items-center gap-1 text-amber-400">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 hidden md:inline">
                  Sin Turno
                </span>
              </div>

              <button
                onClick={onInitiateOpenShift}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-[#E2498A] hover:bg-[#C83472] text-white text-[11px] sm:text-xs font-black rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                title="Iniciar nuevo turno con fondo de gaveta y checklist"
              >
                <span>🚀 Iniciar</span>
              </button>
            </div>
          )}

          {/* Clock (Hidden on narrow screens) */}
          <div className="text-xs sm:text-sm font-semibold text-[#9CA3AF] tabular-nums hidden lg:block">
            {currentTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
          </div>

          {/* Avatar Button (Sándwich Lateral Drawer Trigger) */}
          <button 
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E2498A] text-white flex items-center justify-center font-bold text-xs shadow-sm hover:ring-2 hover:ring-[#E2498A]/50 transition-all focus:outline-none cursor-pointer active:scale-95 shrink-0"
            title="Abrir panel lateral de supervisión"
            aria-label="Abrir panel lateral de supervisión"
          >
            {initials}
          </button>
        </div>
      </nav>

      {/* ── PANEL LATERAL DESLIZANTE TIPO SÁNDWICH DE SUPERVISIÓN ── */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex justify-end animate-fade-in font-sans">
          {/* Backdrop click close */}
          <div 
            className="flex-1 cursor-pointer" 
            onClick={() => setIsMobileDrawerOpen(false)} 
            aria-label="Cerrar panel lateral"
          />

          <div className="w-[92vw] max-w-md sm:w-[440px] bg-[#1E1E2F] text-white h-full flex flex-col border-l border-slate-700 shadow-2xl animate-slide-in-right overflow-y-auto">
            {/* 1. Header con botón de cierre de 44px */}
            <div className="p-4 border-b border-slate-700/80 flex items-center justify-between bg-[#2D2D44] sticky top-0 z-20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E2498A] flex items-center justify-center text-white font-black text-sm shadow-sm">
                  C
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-white leading-none">
                    Cordano<span className="text-[#E2498A]"> Parking Ops</span>
                  </h3>
                  <span className="text-[10px] text-pink-300 font-bold uppercase tracking-wider">Supervisión en Vivo</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-10 h-10 rounded-xl bg-[#1E1E2F] hover:bg-slate-700 text-gray-300 flex items-center justify-center text-base font-bold transition-colors cursor-pointer active:scale-95"
                aria-label="Cerrar panel de supervisión"
              >
                ✕
              </button>
            </div>

            {/* Contenido scrolleable con padding inferior para evitar solapamientos */}
            <div className="flex-1 p-4 space-y-4 pb-28">
              {/* 2. Tarjeta del Supervisor & Conmutador RBAC */}
              <div className="p-3.5 rounded-2xl bg-[#252538] border border-slate-700 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#E2498A] text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold text-white truncate">{operatorName}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        {user?.role === 'administrador' ? '👑 Administrador' : user?.role === 'supervisor' ? '🛡️ Supervisor' : '👷 Operador Garita'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (user?.role === 'administrador') {
                      setUserRole('operador');
                    } else {
                      setIsAdminAuthModalOpen(true);
                    }
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-[#2D2D44] hover:bg-slate-700 border border-slate-600 text-xs font-bold text-pink-300 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>🔄</span>
                  <span>Cambiar a {user?.role === 'administrador' ? 'Operador Garita' : 'Administrador'}</span>
                </button>
              </div>

              {/* 3. Indicadores del Turno */}
              <div className="p-3.5 rounded-2xl bg-[#252538] border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-gray-300 uppercase tracking-wider">
                    Control de Turno
                  </span>
                  {isShiftActive ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-950 text-emerald-300 border border-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      ACTIVO
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-950 text-amber-300 border border-amber-800">
                      🔒 CERRADO
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-[#1E1E2F] border border-slate-800">
                    <span className="text-[10px] text-gray-400 block font-sans">Tiempo en Turno</span>
                    <span className="text-base font-black text-white tabular-nums">
                      {isShiftActive ? (shiftTimer || internalTimer) : '--:--:--'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1E1E2F] border border-slate-800">
                    <span className="text-[10px] text-gray-400 block font-sans">Folio Turno</span>
                    <span className="text-xs font-black text-pink-300 truncate block mt-1">
                      {currentShift?.id || 'TRN-2026-ACT'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#1E1E2F] border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-sans">Fondo Inicial Gaveta</span>
                    <span className="text-sm font-black text-amber-400 font-mono tabular-nums">
                      $ 50.000 CLP
                    </span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/80">
                    Sencillo Validado
                  </span>
                </div>

                {isShiftActive ? (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('operacion_cierre');
                      setIsMobileDrawerOpen(false);
                    }}
                    className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
                  >
                    <span>🔒</span>
                    <span>Arqueo Ciego / Cerrar Turno</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onInitiateOpenShift) onInitiateOpenShift();
                      setIsMobileDrawerOpen(false);
                    }}
                    className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
                  >
                    <span>🚀</span>
                    <span>Iniciar Turno con Fondo $50.000</span>
                  </button>
                )}
              </div>

              {/* 4. Indicadores de Vehículos en Patio (30 cupos Serrano 447) */}
              <div className="p-3.5 rounded-2xl bg-[#252538] border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-gray-300 uppercase tracking-wider">
                    Control de Patio Serrano 447
                  </span>
                  <span className="text-[10px] font-bold text-[#E2498A]">30 Plazas</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-[#1E1E2F] border border-slate-800 text-center">
                    <span className="text-2xl font-black text-white font-mono tabular-nums">{occupiedCount}</span>
                    <span className="text-[11px] text-gray-400 block font-semibold">Ocupados</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1E1E2F] border border-slate-800 text-center">
                    <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums">{freeCount}</span>
                    <span className="text-[11px] text-gray-400 block font-semibold">Libres</span>
                  </div>
                </div>

                {/* Barra de Ocupación */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-gray-400">
                    <span>Ocupación Global</span>
                    <span className="text-pink-300 font-bold">{Math.round((occupiedCount / 30) * 100)}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div 
                      className="h-full bg-[#E2498A] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((occupiedCount / 30) * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 pt-1 font-mono">
                    <span>Sector A (01–15): {Math.min(15, occupiedCount)}</span>
                    <span>Sector B (16–30): {Math.max(0, occupiedCount - 15)}</span>
                  </div>
                </div>

                {overstayVehicles.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs flex items-center gap-2">
                    <span>⚠️</span>
                    <span><strong>{overstayVehicles.length}</strong> vehículos con sobreestadía (+2 hrs)</span>
                  </div>
                )}
              </div>

              {/* 5. Gráfico de Vehículos Ingresados por Hora */}
              <div className="p-3.5 rounded-2xl bg-[#252538] border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-gray-300 uppercase tracking-wider">
                    Ingreso de Vehículos por Hora
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">Hoy</span>
                </div>

                <div className="h-28 pt-4 flex items-end justify-between gap-1 border-b border-slate-700 pb-2">
                  {(() => {
                    const maxVal = Math.max(...hourlyVehicles.map((h) => h.count), 1);
                    return hourlyVehicles.map((item) => {
                      const barHeight = Math.max(12, Math.round((item.count / maxVal) * 100));
                      return (
                        <div key={item.hour} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] font-mono font-bold text-pink-300 tabular-nums">
                            {item.count}
                          </span>
                          <div className="w-full max-w-[20px] bg-slate-800 rounded-t h-20 flex items-end">
                            <div 
                              className="w-full bg-[#E2498A] hover:bg-[#C83472] rounded-t transition-all duration-300"
                              style={{ height: `${barHeight}%` }}
                              title={`${item.count} vehículos a las ${item.hour}`}
                            />
                          </div>
                          <span className="text-[8px] font-mono text-gray-400 truncate w-full text-center">
                            {item.hour.split(':')[0]}h
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* 6. Cronograma de Movimientos en Vivo */}
              <div className="p-3.5 rounded-2xl bg-[#252538] border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-gray-300 uppercase tracking-wider">
                    Cronograma de Movimientos
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">En Vivo</span>
                </div>

                {recentMovements.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-400">
                    Sin movimientos recientes registrados en el turno.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentMovements.map((mov) => (
                      <div 
                        key={mov.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#1E1E2F] border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold ${
                            mov.type === 'INGRESO' 
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {mov.type}
                          </span>
                          <span className="font-mono font-extrabold text-white">{mov.plate}</span>
                          <span className="text-[10px] text-gray-400 font-mono">({mov.slotCode})</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 tabular-nums">{mov.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 7. Registro de Transacciones del Día (Solo Administrador / Supervisor para Arqueo Ciego) */}
              {(user?.role === 'administrador' || user?.role === 'supervisor') ? (
                <div className="p-3.5 rounded-2xl bg-[#252538] border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-gray-300 uppercase tracking-wider">
                      Registro de Dineros del Día
                    </span>
                    <span className="text-xs font-mono font-black text-pink-300 tabular-nums">
                      ${shiftRevenue.toLocaleString('es-CL')}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Efectivo */}
                    <div className="p-2.5 rounded-xl bg-[#1E1E2F] border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>💵</span>
                        <div>
                          <span className="text-white font-bold block">Efectivo Recaudado</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            Gaveta con fondo: ${(revenueByMethod.cash + 50000).toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-extrabold text-emerald-400 tabular-nums">
                        ${revenueByMethod.cash.toLocaleString('es-CL')}
                      </span>
                    </div>

                    {/* POS Transbank */}
                    <div className="p-2.5 rounded-xl bg-[#1E1E2F] border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>💳</span>
                        <div>
                          <span className="text-white font-bold block">Transbank / POS</span>
                          <span className="text-[10px] text-gray-400 font-mono">Tarjetas Débito &amp; Crédito</span>
                        </div>
                      </div>
                      <span className="font-mono font-extrabold text-sky-400 tabular-nums">
                        ${revenueByMethod.pos.toLocaleString('es-CL')}
                      </span>
                    </div>

                    {/* Transferencias / Convenios */}
                    <div className="p-2.5 rounded-xl bg-[#1E1E2F] border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>📄</span>
                        <div>
                          <span className="text-white font-bold block">Convenios &amp; Transferencias</span>
                          <span className="text-[10px] text-gray-400 font-mono">Abonados corporativos</span>
                        </div>
                      </div>
                      <span className="font-mono font-extrabold text-purple-400 tabular-nums">
                        ${revenueByMethod.transfer.toLocaleString('es-CL')}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-gray-400">
                      <span>Tickets liquidados hoy:</span>
                      <span className="text-white font-bold">{paidTickets.length} operaciones</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#252538] border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-gray-300 uppercase tracking-wider">
                      Arqueo de Turno
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                      MODALIDAD CIEGA
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    La recaudación acumulada se audita tras el cierre definitivo de gaveta. Declare el total físico de efectivo y comprobantes en <strong>Arqueo Ciego</strong>.
                  </p>
                </div>
              )}

              {/* 8. Accesos Rápidos a la Plataforma (Botones de >= 48px, sin solapamiento) */}
              <div className="p-3.5 rounded-2xl bg-[#252538] border border-slate-700 space-y-2">
                <span className="text-[11px] font-mono font-bold text-gray-300 uppercase tracking-wider block mb-1">
                  Accesos a la Plataforma
                </span>

                {[
                  { id: 'pos' as AppScreen, label: 'Garita POS (Cobro & Tickets)', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', badge: 'Principal' },
                  { id: 'menu' as AppScreen, label: 'Dashboard Operativo', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                  { id: 'map' as AppScreen, label: 'Plano 2D Interactivo', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
                  { id: 'clients' as AppScreen, label: 'Convenios & Flotas', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                  { id: 'reports' as AppScreen, label: 'Auditoría & Cierres Z', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', requiresAdmin: true },
                  { id: 'support' as AppScreen, label: 'Centro de Soporte & SOPs', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
                  { id: 'settings' as AppScreen, label: (user?.role === 'administrador' || user?.role === 'supervisor') ? 'Ajustes del Sistema & Presets' : 'Ajustes de Garita & Hardware', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', requiresAdmin: false },
                ]
                  .filter((item) => !item.requiresAdmin || (user?.role === 'administrador' || user?.role === 'supervisor'))
                  .map((item) => {
                    const active = isActive(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          setIsMobileDrawerOpen(false);
                        }}
                        className={`w-full min-h-[48px] flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98 ${
                          active
                            ? 'bg-[#E2498A] text-white shadow-md'
                            : 'text-gray-200 hover:bg-[#2D2D44] hover:text-white bg-[#1E1E2F] border border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <svg className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-pink-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                          </svg>
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/20 text-white font-mono font-bold">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* 9. Footer: Buscar & Cerrar Sesión */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCommandPalette) onOpenCommandPalette();
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full min-h-[48px] py-2.5 px-3 rounded-xl bg-[#2D2D44] hover:bg-slate-700 text-gray-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-98"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Buscar Patente o Folio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onLogout) onLogout();
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full min-h-[48px] py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-98"
                >
                  <span>🚪</span>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DOCK INFERIOR TÁCTIL RESPONSIVO Y ADAPTADO AL ROL ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1E1E2F]/95 border-t border-slate-700/80 px-2 py-1.5 flex items-center justify-around shadow-2xl backdrop-blur-md">
        {user?.role === 'operador' ? (
          <>
            {/* Operador Tab 1: Garita POS */}
            <button
              type="button"
              onClick={() => onNavigate('pos')}
              className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isActive('pos')
                  ? 'text-[#E2498A] font-black'
                  : 'text-gray-400 font-medium hover:text-white'
              }`}
              aria-label="Ir a Garita POS"
            >
              <svg className={`w-5 h-5 ${isActive('pos') ? 'text-[#E2498A]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('pos') ? "2.5" : "2"} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Garita POS</span>
            </button>

            {/* Operador Tab 2: Patio 2D */}
            <button
              type="button"
              onClick={() => onNavigate('map')}
              className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isActive('map')
                  ? 'text-[#E2498A] font-black'
                  : 'text-gray-400 font-medium hover:text-white'
              }`}
              aria-label="Ver plano de patio 2D"
            >
              <svg className={`w-5 h-5 ${isActive('map') ? 'text-[#E2498A]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('map') ? "2.5" : "2"} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Patio 2D</span>
            </button>

            {/* Operador Tab 3: Arqueo Ciego */}
            <button
              type="button"
              onClick={() => onNavigate('operacion_cierre')}
              className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isActive('operacion_cierre')
                  ? 'text-[#E2498A] font-black'
                  : 'text-gray-400 font-medium hover:text-white'
              }`}
              aria-label="Arqueo ciego y cierre de turno"
            >
              <svg className={`w-5 h-5 ${isActive('operacion_cierre') ? 'text-[#E2498A]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('operacion_cierre') ? "2.5" : "2"} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Arqueo Ciego</span>
            </button>

            {/* Operador Tab 4: Menú */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isMobileDrawerOpen || (!isActive('pos') && !isActive('map') && !isActive('operacion_cierre'))
                  ? 'text-[#E2498A] font-black'
                  : 'text-gray-400 font-medium hover:text-white'
              }`}
              aria-label="Abrir menú de opciones"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Menú</span>
            </button>
          </>
        ) : (
          <>
            {/* Supervisor Tab 1: Supervisión */}
            <button
              type="button"
              onClick={() => onNavigate('menu')}
              className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isActive('menu')
                  ? 'text-[#E2498A] font-black'
                  : 'text-gray-400 font-medium hover:text-white'
              }`}
              aria-label="Ver supervisión gerencial"
            >
              <svg className={`w-5 h-5 ${isActive('menu') ? 'text-[#E2498A]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('menu') ? "2.5" : "2"} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Supervisión</span>
            </button>

            {/* Supervisor Tab 2: Patio 2D */}
            <button
              type="button"
              onClick={() => {
                if (onSelectMobileTab) onSelectMobileTab('plano');
                onNavigate('pos');
              }}
              className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isActive('pos') && activeMobileTab === 'plano'
                  ? 'text-[#E2498A] font-black'
                  : 'text-gray-400 font-medium hover:text-white'
              }`}
              aria-label="Ver plano de patio 2D"
            >
              <svg className={`w-5 h-5 ${isActive('pos') && activeMobileTab === 'plano' ? 'text-[#E2498A]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('pos') && activeMobileTab === 'plano' ? "2.5" : "2"} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Patio 2D</span>
            </button>

            {/* Supervisor Tab 3: Cronología */}
            <button
              type="button"
              onClick={() => {
                if (onSelectMobileTab) onSelectMobileTab('cronologia');
                onNavigate('pos');
              }}
              className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isActive('pos') && activeMobileTab === 'cronologia'
                  ? 'text-[#E2498A] font-black'
                  : 'text-gray-400 font-medium hover:text-white'
              }`}
              aria-label="Ver cronología de movimientos"
            >
              <svg className={`w-5 h-5 ${isActive('pos') && activeMobileTab === 'cronologia' ? 'text-[#E2498A]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('pos') && activeMobileTab === 'cronologia' ? "2.5" : "2"} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Cronología</span>
            </button>

            {/* Supervisor Tab 4: Reportes Z */}
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isActive('reports')
                  ? 'text-[#E2498A] font-black'
                  : 'text-gray-400 font-medium hover:text-white'
              }`}
              aria-label="Ver cortes Z y auditoría"
            >
              <svg className={`w-5 h-5 ${isActive('reports') ? 'text-[#E2498A]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('reports') ? "2.5" : "2"} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Cortes Z</span>
            </button>

            {/* Supervisor Tab 5: Menú */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className={`min-h-[48px] min-w-[48px] flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isMobileDrawerOpen || (!isActive('menu') && !isActive('pos') && !isActive('reports'))
                  ? 'text-[#E2498A] font-black'
                  : 'text-gray-400 font-medium hover:text-white'
              }`}
              aria-label="Abrir menú de opciones"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Menú</span>
            </button>
          </>
        )}
      </div>

      {/* ── MODAL DE VERIFICACIÓN DE CLAVE PARA ELEVACIÓN A ADMINISTRADOR (RBAC) ── */}
      {isAdminAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-fade-in-up text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E2498A] flex items-center justify-center text-base font-bold">
                  🔐
                </span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-tight">Elevación de Privilegios</h4>
                  <span className="text-[10px] text-slate-400 font-medium">Requiere clave de Administrador</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminAuthModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Para ingresar al perfil de <strong>{targetRole === 'administrador' ? 'Administrador' : 'Supervisor'}</strong>, ingrese el PIN o clave de seguridad maestra.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Claves maestras autorizadas del sistema (admin123, 2026, 9988, 1234)
                const validKeys = ['admin123', 'admin', '2026', '9988', '1234'];
                if (validKeys.includes(adminPasswordInput.trim())) {
                  setUserRole(targetRole);
                  setIsAdminAuthModalOpen(false);
                  setAdminPasswordInput('');
                  setAdminAuthError(null);
                } else {
                  setAdminAuthError('Contraseña o PIN incorrecto. Acceso denegado.');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Clave o PIN de Supervisor
                </label>
                <input
                  type="password"
                  autoFocus
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    if (adminAuthError) setAdminAuthError(null);
                  }}
                  placeholder="Ingrese clave o PIN (ej. admin123)..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-sm font-bold text-slate-900 focus:border-[#E2498A] focus:bg-white focus:outline-none"
                />
              </div>

              {adminAuthError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5 animate-shake">
                  <span>⚠️</span>
                  <span>{adminAuthError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminAuthModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Verificar &amp; Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
