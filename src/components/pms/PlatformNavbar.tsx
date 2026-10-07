import React, { useState } from 'react';
import { AppScreen } from '../../types';
import { useParking } from '../../context/ParkingContext';

interface PlatformNavbarProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  shiftTimer: string;
  operatorName: string;
  onInitiateCashClose: () => void;
  onOpenCommandPalette?: () => void;
  onLogout?: () => void;
}

export const PlatformNavbar: React.FC<PlatformNavbarProps> = ({
  currentScreen,
  onNavigate,
  shiftTimer,
  operatorName,
  onInitiateCashClose,
  onOpenCommandPalette,
  onLogout,
}) => {
  const { user, setUserRole, isOffline, setIsOffline, syncQueueCount } = useParking();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: { id: AppScreen; label: string; shortcut?: string; icon: string }[] = [
    { id: 'menu', label: 'Menú', shortcut: 'F1', icon: 'M3 3h7v7H3zm11 0h7v7h-7zm0 11h7v7h-7zM3 14h7v7H3z' },
    { id: 'pos', label: 'POS Garita', shortcut: 'F2', icon: 'M2 4h20v16H2zm0 6h20' },
    { id: 'clients', label: 'Abonados', shortcut: 'F3', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
    { id: 'map', label: 'Analítica & Matriz', shortcut: 'Plano 30 Plazas', icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 4v6l4 2' },
    { id: 'reports', label: 'Reportes & Bitácora', shortcut: 'Auditoría PIN', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'settings', label: 'Ajustes', shortcut: 'Tarifas & Offline', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zm7.4 1.4l1.6 2.8-2.8 1.6-1.6-2.8a7.9 7.9 0 01-2.6 1.1l-.4 3.2h-3.2l-.4-3.2a7.9 7.9 0 01-2.6-1.1L5.8 20.8 3 19.2l1.6-2.8a7.9 7.9 0 01-1.1-2.6L.3 13.4v-3.2l3.2-.4a7.9 7.9 0 011.1-2.6L3 4.4 5.8 2.8l1.6 2.8a7.9 7.9 0 012.6-1.1L10.4 1.3h3.2l.4 3.2a7.9 7.9 0 012.6 1.1L18.2 2.8l2.8 1.6-1.6 2.8a7.9 7.9 0 011.1 2.6l3.2.4v3.2l-3.2.4a7.9 7.9 0 01-1.1 2.6z' },
    { id: 'support', label: 'SOPs & Ayuda', shortcut: 'Manuales', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  ];

  const handleNavClick = (screen: AppScreen) => {
    onNavigate(screen);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      id="platform-app-navbar"
      className="bg-white/95 backdrop-blur-sm border-b border-[#e8ecf0] shrink-0 shadow-xs z-30 select-none sticky top-0"
    >
      <div className="max-w-[1536px] mx-auto px-3 sm:px-5 lg:px-6 h-14 flex items-center justify-between">
        {/* Brand & Desktop Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">
          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer border border-[#dde2e8]"
            aria-label="Abrir menú de navegación"
            title="Abrir menú"
          >
            {isMobileMenuOpen ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          {/* Brand Chip */}
          <div
            onClick={() => handleNavClick('menu')}
            className="flex items-center gap-2.5 pr-2 sm:pr-3.5 sm:border-r sm:border-[#e8ecf0] cursor-pointer shrink-0"
            title="ParkOps PMS — Cordano Inversiones (Serrano 447, Iquique)"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center font-mono font-black text-sm tracking-tighter shadow-xs">
              CP
            </div>
            <div className="hidden sm:block">
              <div className="font-extrabold text-xs text-slate-900 leading-tight flex items-center gap-1.5">
                <span>PARKOPS PMS</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-mono font-bold">V4</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Serrano 447 · 30 Cupos</div>
            </div>
          </div>

          {/* Desktop Primary Operational Tabs with Shortcut Tooltips */}
          <nav className="hidden lg:flex items-center gap-1 shrink-0">
            {navItems.map((item) => {
              const isActive =
                currentScreen === item.id ||
                (item.id === 'pos' && (currentScreen === 'operacion_salida' || currentScreen === 'operacion_ingreso')) ||
                (item.id === 'map' && currentScreen === 'operacion_layout') ||
                (item.id === 'menu' && (currentScreen === 'inicio' || currentScreen === 'landing'));

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  data-shortcut={item.shortcut ? `Atajo: ${item.shortcut}` : item.label}
                  className={`shortcut-tooltip shortcut-tooltip-bottom px-3 h-9 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-transparent text-slate-600 hover:bg-[#f1f5f9] hover:text-slate-900'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Controls: Shift, Offline, Role, Command Palette, Cierre Ciego */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Command Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              data-shortcut="Atajo: ⌘K / Ctrl+K"
              className="shortcut-tooltip shortcut-tooltip-bottom hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#f8fafc] hover:bg-[#f1f5f9] text-slate-600 text-xs font-mono font-medium transition cursor-pointer border border-[#dde2e8]"
            >
              <span className="font-bold text-slate-800">⌘K</span>
              <span className="text-[11px] text-slate-500">Buscar</span>
            </button>
          )}

          {/* Offline Toggle with Contingency -O indicator */}
          <button
            onClick={() => setIsOffline(!isOffline)}
            data-shortcut={isOffline ? 'Modo Offline Activo (-O)' : 'Cloud Run us-west1 Conectado'}
            className={`shortcut-tooltip shortcut-tooltip-bottom flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer border ${
              isOffline
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500 live-pulse' : 'bg-emerald-500 live-pulse'}`} />
            <span className="hidden sm:inline">{isOffline ? 'OFFLINE (-O)' : 'GARITA 01'}</span>
            {isOffline && syncQueueCount > 0 && (
              <span className="bg-amber-600 text-white text-[9px] px-1 rounded-full">{syncQueueCount}</span>
            )}
          </button>

          {/* Role Toggle Pill (Operador / Admin) */}
          <button
            onClick={() => setUserRole(user.role === 'operador' ? 'administrador' : 'operador')}
            data-shortcut="Clic para alternar rol"
            className="shortcut-tooltip shortcut-tooltip-bottom hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-[#f8fafc] hover:bg-[#f1f5f9] text-slate-700 border border-[#dde2e8] cursor-pointer"
          >
            <span className="text-slate-400 font-normal">Rol:</span>
            <span className="uppercase font-bold text-slate-900">{user.role}</span>
          </button>

          {/* Shift Timer & User */}
          <div className="hidden xl:flex items-center gap-2 text-xs font-mono text-slate-600 bg-[#f8fafc] px-2.5 py-1 rounded-md border border-[#dde2e8] tabular-nums">
            <span className="font-bold text-slate-900">{shiftTimer}</span>
            <span className="text-slate-300">|</span>
            <span className="font-medium text-slate-700 truncate max-w-[100px]">{operatorName}</span>
          </div>

          {/* Cierre Ciego de Turno Action Button */}
          <button
            onClick={() => {
              onInitiateCashClose();
              setIsMobileMenuOpen(false);
            }}
            data-shortcut="Atajo: F4 (Arqueo 3 Pasos + SHA-256)"
            className="shortcut-tooltip shortcut-tooltip-bottom h-9 px-2.5 sm:px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span className="hidden sm:inline">Arqueo Ciego</span>
          </button>

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              data-shortcut="Cerrar sesión segura"
              className="shortcut-tooltip shortcut-tooltip-bottom w-9 h-9 rounded-lg bg-[#f8fafc] hover:bg-rose-50 border border-[#dde2e8] text-slate-500 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Slide-down Navigation Panel */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#e8ecf0] bg-white px-4 py-3 shadow-lg animate-fade-in-up space-y-3">
          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Módulos del Sistema
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const isActive =
                currentScreen === item.id ||
                (item.id === 'pos' && (currentScreen === 'operacion_salida' || currentScreen === 'operacion_ingreso')) ||
                (item.id === 'map' && currentScreen === 'operacion_layout') ||
                (item.id === 'menu' && (currentScreen === 'inicio' || currentScreen === 'landing'));

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-2.5 rounded-lg flex items-center justify-between text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-[#f8fafc] text-slate-700 hover:bg-[#f1f5f9]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={item.icon} />
                    </svg>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.shortcut && (
                    <span className="text-[9px] font-mono px-1 rounded bg-black/10 text-current ml-1 shrink-0">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile Shift Details & Role Info */}
          <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-xs font-mono text-slate-600">
            <div>
              <span className="text-slate-400 text-[10px] block">OPERADOR ACTIVO:</span>
              <span className="font-bold text-slate-900">{operatorName}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-[10px] block">DURACIÓN TURNO:</span>
              <span className="font-bold text-emerald-600 tabular-nums">{shiftTimer}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
