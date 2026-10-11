import React, { useState, useEffect, useRef } from 'react';
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
}) => {
  const { currentShift, user, tickets, setUserRole } = useParking();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [internalTimer, setInternalTimer] = useState('00:00:00');
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState<'operador' | 'supervisor' | 'administrador'>('administrador');
  const avatarRef = useRef<HTMLDivElement>(null);

  const isShiftActive = !!currentShift && currentShift.status === 'abierto';

  const shiftRevenue = tickets
    .filter((t) => t.status === 'pagado')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const primaryNavItems: { id: AppScreen; label: string; icon: string }[] = [
    { id: 'pos',     label: 'Garita POS', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'menu',    label: 'Dashboard',  icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'map',     label: 'Plano 2D',   icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
    { id: 'clients', label: 'Convenios',  icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'reports', label: 'Auditoría',  icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

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
               Cordano<span className="text-[#E2498A]">PMS</span>
             </span>
             <span className="text-[9px] sm:text-[10px] text-gray-400 font-semibold mt-0.5 tracking-wide hidden xs:inline">Serrano 447</span>
          </div>
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

          {/* Avatar Dropdown */}
          <div className="relative" ref={avatarRef}>
            <button 
              onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E2498A] text-white flex items-center justify-center font-bold text-xs shadow-sm hover:ring-2 hover:ring-[#E2498A]/50 transition-all focus:outline-none cursor-pointer"
              title="Abrir menú de usuario y control de turno"
            >
              {initials}
            </button>
            
            {isAvatarMenuOpen && (
              <div className="absolute top-11 sm:top-12 right-0 w-80 max-w-[92vw] bg-white rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.22)] border border-slate-200 py-3 z-50 animate-fade-in-up text-slate-800">
                
                {/* Header Operador (Sin Serrano 447 al lado del nombre según indicación) */}
                <div className="px-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-[#E2498A] text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                       {initials}
                     </div>
                     <div className="flex flex-col min-w-0">
                        <span className="text-sm font-extrabold text-gray-900 leading-tight truncate">{operatorName}</span>
                        <span className="text-xs font-semibold text-gray-500">{user?.role === 'administrador' ? 'Administrador' : user?.role === 'supervisor' ? 'Supervisor' : 'Operador Garita'}</span>
                     </div>
                   </div>
                </div>

                {/* ── WIDGET PERSISTENTE DE TURNO INTEGRADO EN MENÚ AVATAR (Requerimiento Directo) ── */}
                <div className="p-3 mx-3 my-2.5 rounded-xl bg-[#1E1E2F] text-white border border-slate-700 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">
                      Control de Turno
                    </span>
                    {isShiftActive ? (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-950 text-emerald-300 border border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ACTIVO
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-950 text-amber-300 border border-amber-800">
                        🔒 CERRADO
                      </span>
                    )}
                  </div>

                  {/* Timer & Folio */}
                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-700/60">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-semibold">Tiempo en Turno:</span>
                      <span className="text-lg font-mono font-black text-white tabular-nums tracking-wide">
                        {isShiftActive ? (shiftTimer || internalTimer) : '--:--:--'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 font-semibold">Folio Turno:</span>
                      <div className="text-xs font-mono font-bold text-pink-400">
                        {currentShift?.id ? currentShift.id.slice(-8) : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Datos Financieros en Vivo */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-[11px] font-mono">
                    <div className="bg-[#2D2D44] p-2 rounded-lg">
                      <div className="text-[10px] text-gray-400">Fondo Inicial:</div>
                      <div className="font-bold text-white tabular-nums">
                        ${(currentShift?.initialCash || 50000).toLocaleString('es-CL')}
                      </div>
                    </div>
                    <div className="bg-[#2D2D44] p-2 rounded-lg">
                      <div className="text-[10px] text-gray-400">Recaudación:</div>
                      <div className="font-bold text-emerald-400 tabular-nums">
                        ${shiftRevenue.toLocaleString('es-CL')}
                      </div>
                    </div>
                  </div>

                  {/* Botón de Acción Principal del Turno */}
                  <div className="pt-1">
                    {isShiftActive ? (
                      <button
                        onClick={() => { onInitiateCashClose(); setIsAvatarMenuOpen(false); }}
                        className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Arqueo Ciego &amp; Cerrar Turno</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => { 
                          if (onInitiateOpenShift) onInitiateOpenShift(); 
                          setIsAvatarMenuOpen(false); 
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-[#E2498A] hover:bg-[#C83472] text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                      >
                        <span>🚀 Aperturar Turno con Fondo</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Accesos Rápidos de Configuración y Soporte */}
                <div className="px-2 space-y-0.5">
                  {/* Selector RBAC de 3 Roles: Operador, Supervisor, Administrador */}
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                      Perfil Operacional (RBAC)
                    </span>
                    <div className="grid grid-cols-3 gap-1 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setUserRole('operador');
                          setIsAvatarMenuOpen(false);
                        }}
                        className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
                          user?.role === 'operador'
                            ? 'bg-[#E2498A] text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        Operador
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (user?.role === 'operador') {
                            setTargetRole('supervisor');
                            setAdminAuthError(null);
                            setAdminPasswordInput('');
                            setIsAdminAuthModalOpen(true);
                            setIsAvatarMenuOpen(false);
                          } else {
                            setUserRole('supervisor');
                            setIsAvatarMenuOpen(false);
                          }
                        }}
                        className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
                          user?.role === 'supervisor'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        Supervisor
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (user?.role !== 'administrador') {
                            setTargetRole('administrador');
                            setAdminAuthError(null);
                            setAdminPasswordInput('');
                            setIsAdminAuthModalOpen(true);
                            setIsAvatarMenuOpen(false);
                          } else {
                            setIsAvatarMenuOpen(false);
                          }
                        }}
                        className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer text-center ${
                          user?.role === 'administrador'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  {user?.role === 'administrador' && (
                    <button onClick={() => { onNavigate('settings'); setIsAvatarMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 text-xs font-bold transition-colors cursor-pointer">
                      <svg className="w-4 h-4 text-[#E2498A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Ajustes de Plataforma (Admin)
                    </button>
                  )}
                  <button onClick={() => { onNavigate('support'); setIsAvatarMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 text-xs font-bold transition-colors cursor-pointer">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Centro de Soporte &amp; SOPs
                  </button>
                </div>

                {/* Cerrar Sesión */}
                <div className="pt-2 px-2 border-t border-gray-100 mt-1">
                  <button 
                    onClick={() => { if(onLogout) onLogout(); setIsAvatarMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
            {/* Dynamic Mobile Menu Hamburger Button */}
            <button 
              type="button"
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="md:hidden flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#1E1E2F] hover:bg-slate-700 border border-slate-600 text-white transition-colors cursor-pointer"
              title="Abrir menú dinámico de navegación"
              aria-label="Abrir menú"
            >
              {isMobileDrawerOpen ? (
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ── MENÚ DINÁMICO MÓVIL (DRAWER LATERAL PARA SUPERVISORES EN SMARTPHONES) ── */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex justify-end animate-fade-in font-sans">
          {/* Backdrop click close */}
          <div className="flex-1" onClick={() => setIsMobileDrawerOpen(false)} />

          <div className="w-[85vw] max-w-sm bg-[#1E1E2F] text-white h-full flex flex-col border-l border-slate-700 shadow-2xl animate-slide-in-right overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-700/80 flex items-center justify-between bg-[#2D2D44]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E2498A] flex items-center justify-center text-white font-black text-sm shadow-sm">
                  C
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-white leading-none">
                    Cordano<span className="text-[#E2498A]">PMS</span>
                  </h3>
                  <span className="text-[10px] text-gray-400 font-medium">Modo Supervisión Móvil</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-xl bg-[#1E1E2F] hover:bg-slate-700 text-gray-300 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Supervisor Identity Card */}
            <div className="p-4 border-b border-slate-700/60 bg-[#1E1E2F] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#E2498A] text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-extrabold text-white truncate">{operatorName}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                      {user?.role === 'administrador' ? '👑 Administrador' : '👷 Operador Garita'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Conmutador Rápido de Rol */}
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
                className="w-full py-2 px-3 rounded-xl bg-[#2D2D44] hover:bg-slate-700 border border-slate-600 text-xs font-bold text-pink-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🔄</span>
                <span>Cambiar a {user?.role === 'administrador' ? 'Operador' : 'Administrador'}</span>
              </button>
            </div>

            {/* Shift Live Telemetry */}
            <div className="p-4 border-b border-slate-700/60 bg-[#252538] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Estado Turno:</span>
                {isShiftActive ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    ACTIVO ({shiftTimer || internalTimer})
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold">🔒 CERRADO</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Recaudación:</span>
                <span className="text-white font-extrabold tabular-nums">${shiftRevenue.toLocaleString('es-CL')}</span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="p-3 space-y-1 flex-1">
              <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 px-3 py-1">
                Módulos del Sistema
              </div>

              {[
                { id: 'pos' as AppScreen, label: 'Supervisión Garita & Patio', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', badge: 'Principal' },
                { id: 'menu' as AppScreen, label: 'Dashboard Operativo', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                { id: 'map' as AppScreen, label: 'Plano 2D Interactivo', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
                { id: 'clients' as AppScreen, label: 'Convenios & Flotas', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                { id: 'reports' as AppScreen, label: 'Auditoría & Cierres Z', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { id: 'support' as AppScreen, label: 'Centro de Soporte & SOPs', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
                { id: 'settings' as AppScreen, label: 'Ajustes del Sistema', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
              ].map((item) => {
                const active = isActive(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#E2498A] text-white shadow-md'
                        : 'text-gray-300 hover:bg-[#2D2D44] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-700/80 bg-[#1E1E2F] space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (onOpenCommandPalette) onOpenCommandPalette();
                  setIsMobileDrawerOpen(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#2D2D44] hover:bg-slate-700 text-gray-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
                className="w-full py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>🚪</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DOCK INFERIOR TÁCTIL DE SUPERVISIÓN (ERGONOMÍA MÓVIL) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1E1E2F]/95 border-t border-slate-700/80 px-2 py-1.5 flex items-center justify-around shadow-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => onNavigate('pos')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            isActive('pos') ? 'text-[#E2498A] font-black' : 'text-gray-400 font-medium hover:text-white'
          }`}
        >
          <svg className={`w-5 h-5 ${isActive('pos') ? 'text-[#E2498A]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive('pos') ? "2.5" : "2"} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="text-[10px] mt-0.5 whitespace-nowrap">Patio 2D</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('pos')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            isActive('menu') ? 'text-[#E2498A] font-black' : 'text-gray-400 font-medium hover:text-white'
          }`}
        >
          <svg className={`w-5 h-5 ${isActive('menu') ? 'text-[#E2498A]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] mt-0.5 whitespace-nowrap">Cronología</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('reports')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            isActive('reports') ? 'text-[#E2498A] font-black' : 'text-gray-400 font-medium hover:text-white'
          }`}
        >
          <svg className={`w-5 h-5 ${isActive('reports') ? 'text-[#E2498A]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] mt-0.5 whitespace-nowrap">Finanzas</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            isMobileDrawerOpen ? 'text-[#E2498A] font-black' : 'text-gray-400 font-medium hover:text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-[10px] mt-0.5 whitespace-nowrap">Menú</span>
        </button>
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
