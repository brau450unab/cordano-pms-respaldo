import React, { useState } from 'react';
import { AppScreen } from '../../types';

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
}

const CHECKLIST_ITEMS = [
  {
    title: '1. Verificar perímetro y accesos',
    desc: 'Portón operativo en Serrano 447, cerco libre de daños y señalética visible.',
  },
  {
    title: '2. Verificar cámaras de seguridad',
    desc: 'Transmisión activa de los canales CCTV NVR y cámara LPR de garita.',
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
    title: '5. Conciliación en patio (30 plazas)',
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
}) => {
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
    <div id="view-menu" className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 animate-fade-in-up">
      {/* ── 4 KPI BANNER CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ocupación */}
        <div className="p-5 bg-white rounded-2xl border border-[#e8ecf0] shadow-xs hover:border-[#dde2e8] transition-all">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">
            Ocupación Actual
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono tabular-nums">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {occupiedCount}
            </span>
            <span className="text-sm font-bold text-slate-400">/ {totalSlots} Plazas</span>
          </div>
          <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 rounded-full transition-all duration-500"
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] font-mono tabular-nums text-slate-400 flex items-center justify-between">
            <span>{occupancyPercent}% ocupado</span>
            <span className="text-emerald-700 font-bold">{freeCount} libres</span>
          </div>
        </div>

        {/* Recaudación */}
        <div className="p-5 bg-white rounded-2xl border border-[#e8ecf0] shadow-xs hover:border-[#dde2e8] transition-all">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">
            Recaudación Turno
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono tabular-nums tracking-tight text-emerald-600">
            ${shiftRevenue.toLocaleString('es-CL')}
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-mono font-bold text-emerald-700">Flujo activo en caja</span>
          </div>
        </div>

        {/* Fondo Inicial */}
        <div className="p-5 bg-white rounded-2xl border border-[#e8ecf0] shadow-xs hover:border-[#dde2e8] transition-all">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">
            Fondo Inicial Garita
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono tabular-nums tracking-tight text-slate-800">
            ${initialCash.toLocaleString('es-CL')}
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-400">
            Sencillo validado en apertura
          </div>
        </div>

        {/* Abonados */}
        <div className="p-5 bg-white rounded-2xl border border-[#e8ecf0] shadow-xs hover:border-[#dde2e8] transition-all">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">
            Abonados en Patio
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono tabular-nums tracking-tight text-slate-800">
            {activeAgreementsCount} / {totalAgreementsCount}
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-400">
            Convenios mensuales en paralelo
          </div>
        </div>
      </div>

      {/* ── 2 COLUMNS: HERO POS & MODULES (LEFT) + QUALITY CHECKLIST (RIGHT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Hero POS + Secondary Modules */}
        <div className="lg:col-span-8 space-y-5">
          {/* HERO POS CARD */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              {/* Header row */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] border border-white/10 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-pulse" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-emerald-400">
                    Módulo Operativo Principal
                  </span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-slate-400">
                  {occupiedCount} Ocupados · {freeCount} Libres · Serrano 447
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                  Punto de Venta Garita (POS)
                </h3>
                <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                  Centro de control en garita para registrar ingresos de vehículos, liquidar cobros por tiempo de estadía,
                  emitir tickets térmicos de 80mm (Dual QR + Code 128) y consultar el historial del turno.
                </p>
              </div>

              {/* Action Buttons with Discrete Tooltips */}
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={() => onOpenPosInSubtab('entry')}
                  data-shortcut="Atajo: F2"
                  className="shortcut-tooltip py-3 px-6 sm:px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2 shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Registrar Nuevo Ingreso</span>
                </button>
                <button
                  onClick={() => onNavigate('settings')}
                  data-shortcut="Atajo: Ajustes & Presets"
                  className="shortcut-tooltip py-3 px-5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-slate-300 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Ajustes &amp; Modo Offline</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2X2 SECONDARY MODULES GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Plano & Analítica */}
            <div
              onClick={() => onNavigate('map')}
              data-shortcut="Atajo: Plano 30 Plazas"
              className="shortcut-tooltip bg-white border border-[#e8ecf0] border-l-3 border-l-transparent hover:border-l-emerald-500 rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#f1f5f9]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 live-pulse" />
                  <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Plano &amp; Analítica Global
                  </span>
                </div>
                <span className="text-slate-400 group-hover:text-emerald-500 transition-colors">→</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                Rendimiento del recinto: análisis por franjas, matriz semántica de 30 plazas Serrano 447 y métricas RevPAS.
              </p>
            </div>

            {/* Reportes & Auditoría PIN */}
            <div
              onClick={() => onNavigate('reports')}
              data-shortcut="Atajo: Bitácora & Corte Z"
              className="shortcut-tooltip bg-white border border-[#e8ecf0] border-l-3 border-l-transparent hover:border-l-slate-400 rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#f1f5f9]">
                <span className="text-sm font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                  Reportes &amp; Auditoría PIN
                </span>
                <span className="text-slate-400 group-hover:text-slate-600 transition-colors">→</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                Cortes de caja Z, arqueos ciegos con firma SHA-256 y bitácora antifraude (Verde Operador / Rojo Admin).
              </p>
            </div>

            {/* Abonados & Convenios */}
            <div
              onClick={() => onNavigate('clients')}
              data-shortcut="Atajo: F3"
              className="shortcut-tooltip bg-white border border-[#e8ecf0] border-l-3 border-l-transparent hover:border-l-blue-400 rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#f1f5f9]">
                <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Abonados &amp; Convenios
                </span>
                <span className="text-slate-400 group-hover:text-blue-500 transition-colors">→</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                Submódulo paralelo de convenios corporativos mensuales ($75.000) y servicio Noche ($8.000) sin alterar caja rotativa.
              </p>
            </div>

            {/* Centro de Ayuda & SOPs */}
            <div
              onClick={() => onNavigate('support')}
              data-shortcut="Atajo: Manuales & SOPs"
              className="shortcut-tooltip bg-white border border-[#e8ecf0] border-l-3 border-l-transparent hover:border-l-purple-400 rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#f1f5f9]">
                <span className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Centro de Ayuda &amp; SOPs
                </span>
                <span className="text-slate-400 group-hover:text-purple-500 transition-colors">→</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                Manuales operativos, protocolo de contingencia offline (-O), bobinas 80mm y showroom interactivo paso a paso.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Quality Checklist (6 Items) */}
        <div className="lg:col-span-4 bg-white border border-[#e8ecf0] rounded-2xl shadow-xs p-5 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#f1f5f9] pb-3.5">
            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">
                Apertura de Turno
              </div>
              <h3 className="text-sm font-extrabold tracking-tight text-slate-900 mt-0.5">
                Checklist de Calidad
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Supervisión en apertura de garita</p>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 tabular-nums shrink-0 mt-0.5">
              {checkedCount}/{checklist.length} REV.
            </span>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5 tabular-nums">
              <span>Progreso de Verificación</span>
              <span className="font-bold text-slate-700">{checklistPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 rounded-full transition-all duration-300"
                style={{ width: `${checklistPercent}%` }}
              />
            </div>
          </div>

          {/* Checklist items */}
          <div className="space-y-1">
            {CHECKLIST_ITEMS.map((item, idx) => (
              <label
                key={item.title}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#f8fafc] cursor-pointer transition-colors border border-transparent hover:border-[#dde2e8]"
              >
                <input
                  type="checkbox"
                  checked={checklist[idx]}
                  onChange={() => toggleChecklistItem(idx)}
                  className="mt-0.5 w-4 h-4 rounded border-[#dde2e8] text-slate-900 focus:ring-0 cursor-pointer accent-slate-900 shrink-0"
                />
                <div className="min-w-0">
                  <div
                    className={`text-xs font-bold leading-snug ${
                      checklist[idx] ? 'text-slate-400 line-through' : 'text-slate-900'
                    }`}
                  >
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
            <button
              onClick={() => markAll(true)}
              className="text-[11px] font-mono font-bold text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-[0.06em] cursor-pointer"
            >
              Marcar todas
            </button>
            <button
              onClick={() => onShowToast('Apertura de turno firmada y registrada en auditoría.', 'success')}
              className="px-5 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              Firmar Apertura
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
