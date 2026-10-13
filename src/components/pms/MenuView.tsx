import React, { useState } from 'react';
import { AppScreen } from '../../types';
import { useParking } from '../../context/ParkingContext';

interface MenuViewProps {
  occupiedCount: number;
  totalSlots: number;
  shiftRevenue: number;
  initialCash: number;
  activeAgreementsCount: number;
  totalAgreementsCount: number;
  onNavigate: (screen: AppScreen) => void;
  onOpenPosInSubtab: (subtab: 'entry' | 'exit' | 'history') => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onInitiateOpenShift?: () => void;
}

const CHECKLIST_ITEMS = [
  {
    title: '1. Verificar perímetro y accesos',
    desc: 'Portón operativo en Serrano 447, cerco libre de daños y señalética visible.',
  },
  {
    title: '2. Verificar cámaras de seguridad',
    desc: 'Transmisión activa de los canales CCTV NVR y cámara de acceso de garita.',
  },
  {
    title: '3. Revisar instalaciones físicas',
    desc: 'Alumbrado de garita y extintor con manómetro al día.',
  },
  {
    title: '4. Limpiar sector de clientes',
    desc: 'Zona de pago y calzada despejada de obstáculos.',
  },
  {
    title: '5. Conciliación en patio (30 cupos)',
    desc: 'Contraste visual físico Sector A (01–15) y Sector B (16–30) contra sistema.',
  },
  {
    title: '6. Fondo de caja y bobina 80mm',
    desc: 'Confirmar $50.000 de sencillo para vuelto y papel térmico de repuesto.',
  },
];

export const MenuView: React.FC<MenuViewProps> = ({
  occupiedCount,
  totalSlots,
  shiftRevenue,
  initialCash,
  activeAgreementsCount,
  totalAgreementsCount,
  onNavigate,
  onOpenPosInSubtab,
  onShowToast,
  onInitiateOpenShift,
}) => {
  const { user, currentShift } = useParking();
  const [checklist, setChecklist] = useState<boolean[]>([
    true,
    true,
    true,
    true,
    false,
    false,
  ]);

  const toggleChecklistItem = (index: number) => {
    setChecklist((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const markAll = (status: boolean) => {
    setChecklist(new Array(6).fill(status));
  };

  const checkedCount = checklist.filter(Boolean).length;
  const checklistPercent = Math.round((checkedCount / checklist.length) * 100);
  const occupancyPercent = Math.round((occupiedCount / Math.max(totalSlots, 1)) * 100);
  const freeCount = Math.max(0, totalSlots - occupiedCount);

  return (
    <div id="view-menu" className="p-3 sm:p-6 lg:p-8 2xl:px-12 w-full max-w-[1850px] mx-auto space-y-5 sm:space-y-6 text-[#1E1E2F] animate-fade-in-up pb-20 md:pb-8">
      {/* ── VISTA MÓVIL EXCLUSIVA: SÓLO KPIS Y ACCESOS A LA PLATAFORMA (BOTONES ERGONÓMICOS) ── */}
      <div className="block md:hidden space-y-4 pb-28">
        {/* Banner de Bienvenida y Turno */}
        <div className="p-4 rounded-2xl bg-[#1E1E2F] text-white border border-[#2D2D44] shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E2498A] flex items-center justify-center text-white font-black text-sm shadow-sm">
              C
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white leading-tight">
                Sesión de Supervisión Activa
              </h2>
              <span className="text-[10px] text-pink-300 font-mono font-semibold">
                Serrano 447 · 30 Cupos
              </span>
            </div>
          </div>
          {currentShift?.status === 'abierto' ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-emerald-950 text-emerald-300 border border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              TURNO ACTIVO
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-amber-950 text-amber-300 border border-amber-800">
              🔒 CERRADO
            </span>
          )}
        </div>

        {/* ── SECCIÓN 1: KPIS ESENCIALES (GRID 2x2) ── */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 px-1">
            Indicadores Clave (KPIs)
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {/* KPI 1: Vehículos en Patio */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-500 flex items-center justify-between">
                <span>Vehículos Patio</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#E2498A]" />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#1E1E2F] tabular-nums font-mono">
                  {occupiedCount}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">/ {totalSlots}</span>
              </div>
              <div className="mt-1.5 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E2498A] rounded-full"
                  style={{ width: `${occupancyPercent}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] font-mono text-slate-500 flex justify-between">
                <span>{occupancyPercent}%</span>
                <span className="text-emerald-600 font-bold">{freeCount} libres</span>
              </div>
            </div>

            {/* KPI 2: Recaudación del Turno (Ciega para Operadores) */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-500 flex items-center justify-between">
                <span>{user?.role === 'operador' ? 'Turno Caja' : 'Recaudación'}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${user?.role === 'operador' ? 'bg-purple-500' : 'bg-emerald-500'}`} />
              </div>
              <div className="mt-1">
                <span className={`text-xl font-black tabular-nums font-mono ${user?.role === 'operador' ? 'text-slate-800' : 'text-[#E2498A]'}`}>
                  {user?.role === 'operador' ? '🔒 Ciego' : `$${shiftRevenue.toLocaleString('es-CL')}`}
                </span>
              </div>
              <div className={`mt-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md inline-block ${
                user?.role === 'operador' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {user?.role === 'operador' ? 'Arqueo protegido' : 'Flujo validado'}
              </div>
            </div>

            {/* KPI 3: Fondo Inicial en Gaveta */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-500">
                Fondo Gaveta
              </div>
              <div className="mt-1">
                <span className="text-xl font-black text-[#1E1E2F] tabular-nums font-mono">
                  ${initialCash.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                Sencillo apertura
              </div>
            </div>

            {/* KPI 4: Convenios en Patio */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-500">
                Convenios Activos
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#1E1E2F] tabular-nums font-mono">
                  {activeAgreementsCount}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">/ {totalAgreementsCount}</span>
              </div>
              <div className="mt-2 text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                Abonados al día
              </div>
            </div>
          </div>
        </div>

        {/* ── SECCIÓN 2: ACCESOS A LA PLATAFORMA COMO BOTONES GRANDES (SIN SOLAPAMIENTOS) ── */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 px-1">
            Accesos a la Plataforma
          </div>

          <div className="space-y-2.5">
            {/* Botón Principal: Garita POS */}
            <button
              type="button"
              onClick={() => onOpenPosInSubtab('entry')}
              className="w-full min-h-[56px] p-4 rounded-2xl bg-[#E2498A] hover:bg-[#C83472] text-white flex items-center justify-between shadow-md active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-sm leading-tight">Punto de Venta Garita (POS)</div>
                  <div className="text-[11px] text-pink-100 font-medium">Registrar ingresos, salidas y tickets QR</div>
                </div>
              </div>
              <span className="text-lg font-bold text-white/80">→</span>
            </button>

            {/* Botón: Plano 2D Interactivo */}
            <button
              type="button"
              onClick={() => onNavigate('map')}
              className="w-full min-h-[52px] p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-between shadow-xs active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#E2498A] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs text-slate-900 leading-tight">Plano 2D Serrano 447</div>
                  <div className="text-[10px] text-slate-500 font-medium">Matriz de 30 cupos en tiempo real</div>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-400">→</span>
            </button>

            {/* Botón: Arqueo Ciego de Caja */}
            <button
              type="button"
              onClick={() => onNavigate('operacion_cierre')}
              className="w-full min-h-[52px] p-3.5 rounded-2xl bg-white hover:bg-rose-50 border border-rose-200 text-slate-800 flex items-center justify-between shadow-xs active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs text-slate-900 leading-tight">Arqueo Ciego / Cierre de Turno</div>
                  <div className="text-[10px] text-slate-500 font-medium">Declaración de efectivo y acta A4</div>
                </div>
              </div>
              <span className="text-sm font-bold text-rose-400">→</span>
            </button>

            {/* Botón: Convenios & Abonados */}
            <button
              type="button"
              onClick={() => onNavigate('clients')}
              className="w-full min-h-[52px] p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-between shadow-xs active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs text-slate-900 leading-tight">Convenios &amp; Abonados Mensuales</div>
                  <div className="text-[10px] text-slate-500 font-medium">Contratos corporativos y tarifa noche</div>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-400">→</span>
            </button>

            {/* Botón: Reportes & Auditoría PIN (si admin o supervisor) */}
            {(user?.role === 'administrador' || user?.role === 'supervisor') && (
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="w-full min-h-[52px] p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-between shadow-xs active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-xs text-slate-900 leading-tight">Reportes &amp; Auditoría PIN</div>
                    <div className="text-[10px] text-slate-500 font-medium">Cortes Z y bitácora antifraude</div>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-400">→</span>
              </button>
            )}

            {/* Botón: Centro de Soporte & SOPs */}
            <button
              type="button"
              onClick={() => onNavigate('support')}
              className="w-full min-h-[52px] p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-between shadow-xs active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs text-slate-900 leading-tight">Centro de Ayuda &amp; SOPs</div>
                  <div className="text-[10px] text-slate-500 font-medium">Protocolos operativos y contingencia</div>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-400">→</span>
            </button>

            {/* Botón: Configuración según Rol */}
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="w-full min-h-[52px] p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-between shadow-xs active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#E2498A] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs text-slate-900 leading-tight">
                    {user?.role === 'administrador' ? 'Ajustes del Sistema & Presets' : 'Ajustes de Garita & Hardware'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {user?.role === 'administrador' ? 'Tarifario Ley 20.967, personal y DTE' : 'Hardware de tickets, pantalla y atajos'}
                  </div>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-400">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── VISTA ESCRITORIO COMPLETA (MD EN ADELANTE) ── */}
      <div className="hidden md:block space-y-5 sm:space-y-6">
{/* ── 4 KPI BANNER CARDS (TOGGL TRACK METRICS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Ocupación */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-[#E2498A]/50 transition-all">
          <div className="text-xs tabular-nums font-bold uppercase text-slate-500 flex items-center justify-between">
            <span>Ocupación Actual</span>
            <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 tabular-nums">
            <span className="text-3xl font-extrabold tracking-tight text-[#1E1E2F]">
              {occupiedCount}
            </span>
            <span className="text-xs font-medium text-slate-500">/ {totalSlots} Cupos</span>
          </div>
          <div className="mt-3 w-full h-2 bg-[#F8FAFC] rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-[#E2498A] rounded-full transition-all duration-500"
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] tabular-nums text-slate-500 flex items-center justify-between">
            <span>{occupancyPercent}% ocupado</span>
            <span className="text-[#E2498A] font-bold">{freeCount} libres</span>
          </div>
        </div>

        {/* Recaudación */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-[#E2498A]/50 transition-all">
          <div className="text-xs tabular-nums font-bold uppercase text-slate-500 flex items-center justify-between">
            <span>{user?.role === 'operador' ? 'Control de Turno (Ciego)' : 'Recaudación del Turno'}</span>
            <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
          </div>
          <div className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight text-[#E2498A]">
            {user?.role === 'operador' ? (
              <span className="text-slate-800 text-2xl flex items-center gap-2">
                <span>🔒</span> Arqueo Ciego
              </span>
            ) : (
              `$ ${shiftRevenue.toLocaleString('es-CL')}`
            )}
          </div>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF5F8] border border-[#E2498A]/30">
            <span className={`text-[10px] tabular-nums font-bold ${user?.role === 'operador' ? 'text-purple-700' : 'text-[#E2498A]'}`}>
              {user?.role === 'operador' ? 'Declaración física obligatoria al cierre' : 'Flujo en garita activo'}
            </span>
          </div>
        </div>

        {/* Fondo Inicial */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-[#EAA023]/50 transition-all">
          <div className="text-xs tabular-nums font-bold uppercase text-slate-500">
            Fondo Inicial en Gaveta
          </div>
          <div className="mt-2 text-3xl font-extrabold tabular-nums tabular-nums tracking-tight text-[#1E1E2F]">
            ${initialCash.toLocaleString('es-CL')}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Sencillo validado en apertura
          </div>
        </div>

        {/* Convenios */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-[#C83472]/50 transition-all">
          <div className="text-xs tabular-nums font-bold uppercase text-slate-500">
            Convenios en Patio
          </div>
          <div className="mt-2 text-3xl font-extrabold tabular-nums tabular-nums tracking-tight text-[#1E1E2F]">
            {activeAgreementsCount} <span className="text-xs font-normal text-slate-500">/ {totalAgreementsCount}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Convenios mensuales en paralelo
          </div>
        </div>
      </div>

      {/* ── 2 COLUMNS: HERO POS & MODULES (LEFT) + QUALITY CHECKLIST (RIGHT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Hero POS + Secondary Modules */}
        <div className="lg:col-span-8 space-y-5">
          {/* HERO POS CARD (Toggl Aubergine Theme) */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E2F] border border-[#2D2D44] text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 space-y-5">
              {/* Header row */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2D2D44] border border-[#563560]">
                  <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
                  <span className="text-[10px] tabular-nums font-bold uppercase tracking-wider text-[#E2498A]">
                    Módulo Operativo Principal · F2
                  </span>
                </div>
                <span className="text-xs tabular-nums tabular-nums text-[#CBD5E1]">
                  {occupiedCount} Ocupadas · {freeCount} Libres · Serrano 447
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Punto de Venta Garita (POS)
                </h3>
                <p className="text-xs sm:text-sm text-[#E5DBDF] max-w-xl leading-relaxed">
                  Centro de control en garita para registrar ingresos de vehículos, liquidar cobros por tiempo de estadía,
                  emitir tickets térmicos de 80mm con código QR y consultar el historial del turno.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={() => onOpenPosInSubtab('entry')}
                  title="Atajo: F2"
                  className="py-3 px-6 sm:px-8 rounded-full bg-[#E2498A] hover:bg-[#E2498A] text-white font-extrabold text-xs tracking-tight shadow-[0_2px_12px_rgba(226,73,138,0.35)] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Registrar Nuevo Ingreso </span>
                </button>
                {/* Acceso a Configuración según Rol */}
                  <button
                    onClick={() => onNavigate('settings')}
                    title="Atajo: Ajustes & Presets"
                    className="py-3 px-5 rounded-full bg-[#2D2D44] hover:bg-[#563560] border border-[#563560] text-white text-xs tabular-nums font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-[#E2498A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>{user?.role === 'administrador' ? 'Ajustes Globales & Presets' : 'Ajustes de Garita & Hardware'}</span>
                  </button>

              </div>
            </div>
          </div>

          {/* 2X2 SECONDARY MODULES GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Plano & Analítica */}
            <div
              onClick={() => onNavigate('map')}
              title="Atajo: Plano 30 Cupos"
              className="bg-white border border-slate-200 hover:border-[#E2498A] rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
                  <span className="text-sm font-bold text-[#1E1E2F] group-hover:text-[#E2498A] transition-colors">
                    Plano &amp; Analítica Global
                  </span>
                </div>
                <span className="text-[#94A3B8] group-hover:text-[#E2498A] transition-colors">→</span>
              </div>
              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                Rendimiento del recinto: análisis por franjas, matriz semántica de 30 cupos Serrano 447 y métricas RevPAS.
              </p>
            </div>

            {/* Si es Operador: Arqueo Ciego / Turno. Si es Admin/Supervisor: Reportes & Auditoría PIN */}
            {user?.role === 'operador' ? (
              <div
                onClick={() => onNavigate('operacion_cierre')}
                title="Cierre de Turno de Garita"
                className="bg-white border border-slate-200 hover:border-rose-500 rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-[#F8FAFC]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-sm font-bold text-[#1E1E2F] group-hover:text-rose-600 transition-colors">
                      Arqueo Ciego de Caja
                    </span>
                  </div>
                  <span className="text-[#94A3B8] group-hover:text-rose-500 transition-colors">→</span>
                </div>
                <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                  Cierre definitivo de turno, declaración de efectivo de gaveta y emisión de acta A4 con firmas físicas.
                </p>
              </div>
            ) : (
              <div
                onClick={() => onNavigate('reports')}
                title="Atajo: Bitácora & Corte Z"
                className="bg-white border border-slate-200 hover:border-[#E2498A] rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-[#F8FAFC]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
                    <span className="text-sm font-bold text-[#1E1E2F] group-hover:text-[#E2498A] transition-colors">
                      Reportes &amp; Auditoría PIN
                    </span>
                  </div>
                  <span className="text-[#94A3B8] group-hover:text-[#E2498A] transition-colors">→</span>
                </div>
                <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                  Cortes de caja Z, arqueos ciegos con firma SHA-256 y bitácora antifraude (Verde Operador / Rojo Admin).
                </p>
              </div>
            )}

            {/* Convenios & Abonados Mensuales */}
            <div
              onClick={() => onNavigate('clients')}
              title="Atajo: F3"
              className="bg-white border border-slate-200 hover:border-[#C83472] rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C83472]" />
                  <span className="text-sm font-bold text-[#1E1E2F] group-hover:text-[#C83472] transition-colors">
                    Convenios &amp; Abonados Mensuales
                  </span>
                </div>
                <span className="text-[#94A3B8] group-hover:text-[#C83472] transition-colors">→</span>
              </div>
              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                Submódulo paralelo de convenios corporativos mensuales ($ 75.000) y servicio Noche ($ 8.000).
              </p>
            </div>

            {/* Centro de Ayuda & SOPs */}
            <div
              onClick={() => onNavigate('support')}
              title="Atajo: Manuales & SOPs"
              className="bg-white border border-slate-200 hover:border-[#E2498A] rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
                  <span className="text-sm font-bold text-[#1E1E2F] group-hover:text-[#E2498A] transition-colors">
                    Centro de Ayuda &amp; SOPs
                  </span>
                </div>
                <span className="text-[#94A3B8] group-hover:text-[#E2498A] transition-colors">→</span>
              </div>
              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                Manuales operativos, protocolo de contingencia offline (-O), bobinas 80mm y guías paso a paso.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Quality Checklist (6 Items) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="flex items-start justify-between border-b border-[#F8FAFC] pb-3">
            <div>
              <div className="text-xs tabular-nums font-bold uppercase text-[#E2498A]">
                Apertura de Turno
              </div>
              <h3 className="text-base font-extrabold tracking-tight text-[#1E1E2F] mt-0.5">
                Checklist de Calidad
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Supervisión en apertura de garita</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] tabular-nums font-bold bg-[#F8FAFC] text-[#1E1E2F] border border-slate-200 tabular-nums shrink-0 mt-0.5">
              {checkedCount}/{checklist.length} REV.
            </span>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-xs tabular-nums text-slate-500 mb-1.5 tabular-nums">
              <span>Progreso de Verificación</span>
              <span className="font-bold text-[#1E1E2F]">{checklistPercent}%</span>
            </div>
            <div className="w-full h-2 bg-[#F8FAFC] rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-[#E2498A] rounded-full transition-all duration-300"
                style={{ width: `${checklistPercent}%` }}
              />
            </div>
          </div>

          {/* Checklist items */}
          <div className="space-y-1">
            {CHECKLIST_ITEMS.map((item, idx) => (
              <label
                key={item.title}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F8FAFC] cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checklist[idx]}
                  onChange={() => toggleChecklistItem(idx)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-200 text-[#E2498A] focus:ring-0 cursor-pointer accent-[#E2498A] shrink-0"
                />
                <div className="min-w-0">
                  <div
                    className={`text-xs font-bold leading-snug ${
                      checklist[idx] ? 'text-[#94A3B8] line-through' : 'text-[#1E1E2F]'
                    }`}
                  >
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-[#F8FAFC] flex items-center justify-between">
            <button
              onClick={() => markAll(true)}
              className="text-xs tabular-nums font-bold text-slate-500 hover:text-[#1E1E2F] transition-colors uppercase tracking-wider cursor-pointer"
            >
              Marcar todas
            </button>
            <button
              onClick={() => {
                if (onInitiateOpenShift) {
                  onInitiateOpenShift();
                } else {
                  onShowToast('Apertura de turno firmada y registrada en auditoría.', 'success');
                }
              }}
              className="px-4 py-2 rounded-full bg-[#E2498A] hover:bg-[#C83472] text-white text-xs font-bold tabular-nums transition-colors shadow-xs cursor-pointer active:scale-[0.98] flex items-center gap-1.5"
            >
              <span>🚀 Iniciar Turno con Fondo</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
