'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Car,
  LayoutGrid,
  Moon,
  FileBarChart,
  Settings,
  Users,
  BookOpen,
  Camera,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Grid
} from 'lucide-react';

interface MacOSNavigationShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  roleLabel?: string;
  rightActions?: React.ReactNode;
  hideSidebarByDefault?: boolean;
}

export const MacOSNavigationShell: React.FC<MacOSNavigationShellProps> = ({
  children,
  title = 'ParkOps PMS · Cordano Serrano 447',
  subtitle,
  roleLabel = 'Operador Garita',
  rightActions,
  hideSidebarByDefault = false,
}) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(hideSidebarByDefault);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('es-CL', {
          timeZone: 'America/Santiago',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { label: 'Garita POS', href: '/', shortcut: 'F1', icon: Car },
    { label: 'Menú Central', href: '/hub', shortcut: 'F2', icon: Grid },
    { label: 'Panel Control', href: '/admin', shortcut: 'F3', icon: LayoutGrid },
    { label: 'Convenios & Noche', href: '/convenios', shortcut: 'F4', icon: Moon },
    { label: 'Reportes Z', href: '/reportes', shortcut: 'F5', icon: FileBarChart },
    { label: 'Configuración', href: '/configuracion', shortcut: 'F6', icon: Settings },
    { label: 'Usuarios RBAC', href: '/admin/usuarios', shortcut: 'F7', icon: Users },
    { label: 'Manuales SOP', href: '/documentacion', shortcut: 'F8', icon: BookOpen },
    { label: 'CCTV LPR', href: '/cctv', shortcut: 'F9', icon: Camera },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Barra Superior Estructural */}
      <header className="h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
            title={collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <Link href="/hub" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#80093A] text-white font-black text-xs flex items-center justify-center">
              P
            </span>
            <span className="font-extrabold text-sm tracking-tight text-slate-900">
              ParkOps PMS
            </span>
          </Link>

          <div className="h-4 w-px bg-slate-200 hidden md:block" />

          <div>
            <h1 className="text-xs font-bold text-slate-800 leading-tight">{title}</h1>
            {subtitle && <p className="text-[11px] text-slate-500 hidden lg:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 tabular-nums">
            <span>CLT: {currentTime || '12:00:00'}</span>
          </div>

          <span className="px-2.5 py-1 rounded-md bg-[#80093A]/10 text-[#80093A] font-mono text-xs font-bold">
            {roleLabel}
          </span>

          {rightActions}
        </div>
      </header>

      {/* Cuerpo con Barra Lateral y Contenido */}
      <div className="flex-1 flex overflow-hidden">
        {/* Barra Lateral Funcional */}
        <aside
          className={`${
            collapsed ? 'w-16' : 'w-56'
          } bg-white border-r border-slate-200 p-3 flex flex-col justify-between shrink-0 transition-all duration-150`}
        >
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={`${item.label} (${item.shortcut})`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#80093A] text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </span>
                  {!collapsed && (
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.shortcut}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-200 text-center">
            {!collapsed ? (
              <div className="text-[10px] font-mono text-slate-500">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5 align-middle" />
                <span>Cloud Run · Serrano 447</span>
              </div>
            ) : (
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" title="Online" />
            )}
          </div>
        </aside>

        {/* Área de Contenido Principal */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};
