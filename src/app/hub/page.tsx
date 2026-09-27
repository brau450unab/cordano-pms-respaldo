'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Car,
  LayoutGrid,
  Lock,
  LayoutDashboard,
  Moon,
  FileBarChart2,
  Settings,
  Users,
  BookOpen,
  Camera,
  Search,
  LogOut
} from 'lucide-react';
import { ParkingSlot } from '@/types';

interface ModuleItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MODULE_ITEMS: ModuleItem[] = [
  { id: 'garita', title: 'Garita POS (40/60)', subtitle: 'Check-in y cobro vehicular', href: '/', shortcut: 'F1', icon: Car },
  { id: 'hub', title: 'Menú Central', subtitle: 'Catálogo de aplicaciones', href: '/hub', shortcut: 'F2', icon: LayoutGrid },
  { id: 'panel', title: 'Panel de Control', subtitle: 'KPIs, barreras y telemetría', href: '/admin', shortcut: 'F3', icon: LayoutDashboard },
  { id: 'convenios', title: 'Convenios & Noche', subtitle: 'Servicios en paralelo', href: '/convenios', shortcut: 'F4', icon: Moon },
  { id: 'reportes', title: 'Reportes Z & P&L', subtitle: 'Cierres de caja y hash SHA-256', href: '/reportes', shortcut: 'F5', icon: FileBarChart2 },
  { id: 'configuracion', title: 'Configuraciones', subtitle: 'Motor de tarifas e impresora 80mm', href: '/configuracion', shortcut: 'F6', icon: Settings },
  { id: 'usuarios', title: 'Usuarios & RBAC', subtitle: 'Roles y políticas de PIN', href: '/admin/usuarios', shortcut: 'F7', icon: Users },
  { id: 'manuales', title: 'Manuales SOP', subtitle: 'Flujo estándar y contingencia', href: '/documentacion', shortcut: 'F8', icon: BookOpen },
  { id: 'cctv', title: 'CCTV & LPR', subtitle: 'Monitoreo de patentes en vivo', href: '/cctv', shortcut: 'F9', icon: Camera },
];

export default function HubPage() {
  const router = useRouter();
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/slots')
      .then((r) => r.json())
      .then((data) => {
        if (data?.slots) setSlots(data.slots);
      })
      .catch(() => {});
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const match = MODULE_ITEMS.find((item) => item.shortcut === e.key);
      if (match) {
        e.preventDefault();
        router.push(match.href);
      }
    },
    [router]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const occupiedCount = slots.filter((s) => s.estado !== 'DISPONIBLE').length;
  const availableCount = Math.max(0, 30 - occupiedCount);

  const filtered = MODULE_ITEMS.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Encabezado Superior */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded bg-[#80093A] text-white font-bold text-sm flex items-center justify-center">
            P
          </span>
          <div>
            <span className="font-bold text-sm text-slate-900 block leading-tight">
              ParkOps PMS &amp; ERP
            </span>
            <span className="text-[11px] text-slate-500">Serrano 447, Iquique</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            <span>Aforo: {availableCount} Libres / {occupiedCount} Ocupadas (30 Plazas)</span>
          </div>

          <Link
            href="/landing"
            className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-600"
            title="Ir a Portal de Acceso"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Cuerpo Principal: Buscador y Módulos */}
      <main className="max-w-5xl w-full mx-auto p-6 space-y-6 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Menú Central de Módulos</h1>
            <p className="text-xs text-slate-500">
              Seleccione un módulo o use los atajos de teclado F1 a F9
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar módulo..."
              className="w-full h-9 pl-9 pr-3 rounded border border-slate-300 text-xs focus:outline-none focus:border-[#80093A]"
            />
          </div>
        </div>

        {/* Grilla de Módulos Limpia y Estructural */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="p-4 bg-white rounded-lg border border-slate-200 hover:border-[#80093A] hover:shadow-sm transition flex items-start gap-3 group"
              >
                <div className="w-10 h-10 rounded bg-slate-100 group-hover:bg-[#80093A] group-hover:text-white text-slate-700 flex items-center justify-center shrink-0 transition">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-900 group-hover:text-[#80093A] truncate">
                      {item.title}
                    </h2>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-500">
                      {item.shortcut}
                    </kbd>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    {item.subtitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
