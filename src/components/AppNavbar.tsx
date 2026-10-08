import React, { useState, useEffect } from 'react';
import { useParking } from '../context/ParkingContext';
import { AppScreen } from '../types';
import { APP_ROUTES } from '../utils/routes';
import {
  Car,
  Receipt,
  MapPin,
  Lock,
  BarChart3,
  ShieldAlert,
  Sliders,
  Users,
  LogOut,
  ChevronDown,
  Database,
  BookOpen,
  Search,
  Building2,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AppNavbarProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onLogout: () => void;
  onOpenCommandPalette?: () => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  currentScreen,
  onNavigate,
  onLogout,
  onOpenCommandPalette
}) => {
  const { user, currentShift, slots } = useParking();
  const [openDropdown, setOpenDropdown] = useState<'mas' | 'user' | null>(null);
  const [chileTime, setChileTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('es-CL', {
          timeZone: 'America/Santiago',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        setChileTime(timeStr);
      } catch {
        setChileTime(new Date().toLocaleTimeString('es-CL', { hour12: false }));
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const isAdmin = user.role === 'administrador';
  const occupiedSlots = slots.filter((s) => s.status === 'ocupado').length;
  const isShiftOpen = currentShift.status === 'abierto';

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'OP';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 font-sans select-none shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">

          {/* Left: Brand Identity in Wireframe Style */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => onNavigate('inicio')}
              className="flex items-center space-x-3 focus:outline-none cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center tabular-nums font-bold text-xs border border-slate-800 shrink-0">
                CP
              </div>
              <div className="leading-tight">
                <div className="flex items-center space-x-2">
                  <span className="tabular-nums uppercase font-black text-xs tracking-wider text-slate-900">
                    CORDANO PMS
                  </span>
                  <span className="text-[10px] text-slate-400 tabular-nums">
                    [ WIREFRAME ]
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 tabular-nums block">
                  Garita Serrano 447 · Iquique
                </span>
              </div>
            </button>
          </div>

          {/* Center: Command Palette Trigger & Main Navigation */}
          <div className="hidden md:flex items-center space-x-2 flex-1 max-w-2xl justify-center">
            {/* Quick Plate Search Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenCommandPalette) onOpenCommandPalette();
              }}
              className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-600 tabular-nums transition w-56 shrink-0 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="flex-1 text-left truncate">Buscar patente...</span>
              <kbd className="px-1.5 py-0.2 text-[10px] tabular-nums text-slate-600 bg-white border border-slate-300 rounded">
                ⌘K
              </kbd>
            </button>

            {/* Navigation Tabs */}
            <nav className="flex items-center space-x-1 pl-2">
              <button
                onClick={() => onNavigate('inicio')}
                className={`px-3 py-1.5 rounded-lg text-xs tabular-nums font-semibold transition cursor-pointer border ${
                  currentScreen === 'inicio'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                }`}
              >
                Inicio
              </button>

              <button
                onClick={() => onNavigate('operacion_salida')}
                className={`px-3 py-1.5 rounded-lg text-xs tabular-nums font-semibold transition flex items-center space-x-1.5 cursor-pointer border ${
                  currentScreen === 'operacion_salida'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Salida (POS)</span>
              </button>

              <button
                onClick={() => onNavigate('operacion_ingreso')}
                className={`px-3 py-1.5 rounded-lg text-xs tabular-nums font-semibold transition flex items-center space-x-1.5 cursor-pointer border ${
                  currentScreen === 'operacion_ingreso'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Ingreso</span>
              </button>

              <button
                onClick={() => onNavigate('operacion_layout')}
                className={`px-3 py-1.5 rounded-lg text-xs tabular-nums font-semibold transition flex items-center space-x-1.5 cursor-pointer border ${
                  currentScreen === 'operacion_layout'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Plano 30P</span>
              </button>

              <button
                onClick={() => onNavigate('operacion_cierre')}
                className={`px-3 py-1.5 rounded-lg text-xs tabular-nums font-semibold transition flex items-center space-x-1.5 cursor-pointer border ${
                  currentScreen === 'operacion_cierre'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Arqueo Caja</span>
              </button>

              {/* Más Módulos Dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(openDropdown === 'mas' ? null : 'mas');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs tabular-nums font-semibold transition flex items-center space-x-1 cursor-pointer border ${
                    ['operacion_convenios', 'reportes_dashboard', 'reportes_auditoria', 'reportes_database', 'config_tarifas'].includes(currentScreen)
                      ? 'bg-slate-100 text-slate-900 border-slate-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                  }`}
                >
                  <span>Módulos</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {openDropdown === 'mas' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-60 bg-white border border-slate-300 rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95"
                  >
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setOpenDropdown(null);
                          onNavigate('operacion_convenios');
                        }}
                        className="w-full text-left px-3 py-2 text-xs tabular-nums text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg flex items-center space-x-2 transition"
                      >
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <span>Convenios & Convenios</span>
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setOpenDropdown(null);
                              onNavigate('reportes_dashboard');
                            }}
                            className="w-full text-left px-3 py-2 text-xs tabular-nums text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg flex items-center space-x-2 transition"
                          >
                            <BarChart3 className="w-4 h-4 text-slate-500" />
                            <span>Dashboard Ejecutivo</span>
                          </button>
                          <button
                            onClick={() => {
                              setOpenDropdown(null);
                              onNavigate('reportes_auditoria');
                            }}
                            className="w-full text-left px-3 py-2 text-xs tabular-nums text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg flex items-center space-x-2 transition"
                          >
                            <ShieldAlert className="w-4 h-4 text-slate-500" />
                            <span>Bitácora Auditoría</span>
                          </button>
                          <button
                            onClick={() => {
                              setOpenDropdown(null);
                              onNavigate('reportes_database');
                            }}
                            className="w-full text-left px-3 py-2 text-xs tabular-nums text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg flex items-center space-x-2 transition"
                          >
                            <Database className="w-4 h-4 text-slate-500" />
                            <span>Base de Datos</span>
                          </button>
                          <button
                            onClick={() => {
                              setOpenDropdown(null);
                              onNavigate('config_tarifas');
                            }}
                            className="w-full text-left px-3 py-2 text-xs tabular-nums text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg flex items-center space-x-2 transition"
                          >
                            <Sliders className="w-4 h-4 text-slate-500" />
                            <span>Configurar Tarifas</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right: Shift Status, Live Clock & User Menu */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Shift Status Indicator */}
            <div className="hidden lg:flex items-center space-x-2 text-xs border border-slate-200 bg-slate-50 px-2.5 py-1 rounded-lg">
              <span className={`w-2 h-2 rounded-full ${isShiftOpen ? 'bg-slate-900' : 'bg-slate-400'}`} />
              <span className="tabular-nums text-xs font-semibold text-slate-800">
                {isShiftOpen ? 'Turno Activo' : 'Turno Cerrado'}
              </span>
              <span className="text-slate-300">·</span>
              <span className="tabular-nums text-xs text-slate-500 font-bold">
                {occupiedSlots}/30
              </span>
            </div>

            {/* Live Chilean Clock */}
            <div className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg tabular-nums text-xs font-medium text-slate-700 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{chileTime || '--:--:--'}</span>
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === 'user' ? null : 'user');
                }}
                className="flex items-center space-x-2 p-1 pl-2 hover:bg-slate-50 rounded-lg border border-slate-200 transition cursor-pointer"
              >
                <div className="text-right hidden sm:block">
                  <span className="text-xs tabular-nums font-semibold text-slate-800 block leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-400 tabular-nums block capitalize">
                    {user.role}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center tabular-nums font-bold text-xs border border-slate-800">
                  {initials}
                </div>
              </button>

              {openDropdown === 'user' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-56 bg-white border border-slate-300 rounded-xl shadow-lg p-2 z-50 animate-in fade-in zoom-in-95 divide-y divide-slate-100"
                >
                  <div className="px-3 py-2">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {user.name}
                    </span>
                    <span className="text-[11px] text-slate-500 tabular-nums block truncate">
                      {user.email || 'operador@cordano.cl'}
                    </span>
                    <span className="text-[10px] text-slate-400 tabular-nums mt-0.5 block uppercase">
                      Rol: {user.role}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        onNavigate('operacion_cierre');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs tabular-nums text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg flex items-center space-x-2 transition"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Arqueo de Turno</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setOpenDropdown(null);
                          onNavigate('config_sistema');
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs tabular-nums text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg flex items-center space-x-2 transition"
                      >
                        <Sliders className="w-3.5 h-3.5 text-slate-500" />
                        <span>Configuración Sistema</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs tabular-nums font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-2 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
