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
    <div id="view-menu" className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 text-[#2C1338] animate-fade-in-up">
      {/* ── 4 KPI BANNER CARDS (TOGGL TRACK METRICS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ocupación */}
        <div className="p-5 bg-white rounded-2xl border border-[#EDE4E2] shadow-xs hover:border-[#2DA8D8]/50 transition-all">
          <div className="text-xs tabular-nums font-bold uppercase text-[#65546C] flex items-center justify-between">
            <span>Ocupación Actual</span>
            <span className="w-2 h-2 rounded-full bg-[#2DA8D8]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 tabular-nums tabular-nums">
            <span className="text-3xl font-extrabold tracking-tight text-[#2C1338]">
              {occupiedCount}
            </span>
            <span className="text-xs font-medium text-[#65546C]">/ {totalSlots} Cupos</span>
          </div>
          <div className="mt-3 w-full h-2 bg-[#FEF9F5] rounded-full overflow-hidden border border-[#EDE4E2]">
            <div
              className="h-full bg-[#2DA8D8] rounded-full transition-all duration-500"
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] tabular-nums tabular-nums text-[#65546C] flex items-center justify-between">
            <span>{occupancyPercent}% ocupado</span>
            <span className="text-[#2B9E78] font-bold">{freeCount} libres</span>
          </div>
        </div>

        {/* Recaudación */}
        <div className="p-5 bg-white rounded-2xl border border-[#EDE4E2] shadow-xs hover:border-[#2B9E78]/50 transition-all">
          <div className="text-xs tabular-nums font-bold uppercase text-[#65546C] flex items-center justify-between">
            <span>Recaudación del Turno</span>
            <span className="w-2 h-2 rounded-full bg-[#2B9E78]" />
          </div>
          <div className="mt-2 text-3xl font-extrabold tabular-nums tabular-nums tracking-tight text-[#2B9E78]">
            ${shiftRevenue.toLocaleString('es-CL')}
          </div>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F8F2] border border-[#2B9E78]/30">
            <span className="text-[10px] tabular-nums font-bold text-[#2B9E78]">Flujo en garita activo</span>
          </div>
        </div>

        {/* Fondo Inicial */}
        <div className="p-5 bg-white rounded-2xl border border-[#EDE4E2] shadow-xs hover:border-[#EAA023]/50 transition-all">
          <div className="text-xs tabular-nums font-bold uppercase text-[#65546C]">
            Fondo Inicial en Gaveta
          </div>
          <div className="mt-2 text-3xl font-extrabold tabular-nums tabular-nums tracking-tight text-[#2C1338]">
            ${initialCash.toLocaleString('es-CL')}
          </div>
          <div className="mt-2 text-xs text-[#65546C]">
            Sencillo validado en apertura
          </div>
        </div>

        {/* Convenios */}
        <div className="p-5 bg-white rounded-2xl border border-[#EDE4E2] shadow-xs hover:border-[#9E59C7]/50 transition-all">
          <div className="text-xs tabular-nums font-bold uppercase text-[#65546C]">
            Convenios en Patio
          </div>
          <div className="mt-2 text-3xl font-extrabold tabular-nums tabular-nums tracking-tight text-[#2C1338]">
            {activeAgreementsCount} <span className="text-xs font-normal text-[#65546C]">/ {totalAgreementsCount}</span>
          </div>
          <div className="mt-2 text-xs text-[#65546C]">
            Convenios mensuales en paralelo
          </div>
        </div>
      </div>

      {/* ── 2 COLUMNS: HERO POS & MODULES (LEFT) + QUALITY CHECKLIST (RIGHT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Hero POS + Secondary Modules */}
        <div className="lg:col-span-8 space-y-5">
          {/* HERO POS CARD (Toggl Aubergine Theme) */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#2C1338] border border-[#412A4C] text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 space-y-5">
              {/* Header row */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#412A4C] border border-[#563560]">
                  <span className="w-2 h-2 rounded-full bg-[#E57CD8]" />
                  <span className="text-[10px] tabular-nums font-bold uppercase tracking-wider text-[#E57CD8]">
                    Módulo Operativo Principal · F2
                  </span>
                </div>
                <span className="text-xs tabular-nums tabular-nums text-[#CDBFC7]">
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
                  className="py-3 px-6 sm:px-8 rounded-full bg-[#E2498A] hover:bg-[#E57CD8] text-white font-extrabold text-xs tracking-tight shadow-[0_2px_12px_rgba(226,73,138,0.35)] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Registrar Nuevo Ingreso </span>
                </button>
                <button
                  onClick={() => onNavigate('settings')}
                  title="Atajo: Ajustes & Presets"
                  className="py-3 px-5 rounded-full bg-[#412A4C] hover:bg-[#563560] border border-[#563560] text-white text-xs tabular-nums font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 text-[#E57CD8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              title="Atajo: Plano 30 Cupos"
              className="bg-white border border-[#EDE4E2] hover:border-[#2DA8D8] rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#F7EFE9]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2DA8D8]" />
                  <span className="text-sm font-bold text-[#2C1338] group-hover:text-[#2DA8D8] transition-colors">
                    Plano &amp; Analítica Global
                  </span>
                </div>
                <span className="text-[#96859B] group-hover:text-[#2DA8D8] transition-colors">→</span>
              </div>
              <p className="text-xs text-[#65546C] mt-2.5 leading-relaxed">
                Rendimiento del recinto: análisis por franjas, matriz semántica de 30 cupos Serrano 447 y métricas RevPAS.
              </p>
            </div>

            {/* Reportes & Auditoría PIN */}
            <div
              onClick={() => onNavigate('reports')}
              title="Atajo: Bitácora & Corte Z"
              className="bg-white border border-[#EDE4E2] hover:border-[#E2498A] rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#F7EFE9]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
                  <span className="text-sm font-bold text-[#2C1338] group-hover:text-[#E2498A] transition-colors">
                    Reportes &amp; Auditoría PIN
                  </span>
                </div>
                <span className="text-[#96859B] group-hover:text-[#E2498A] transition-colors">→</span>
              </div>
              <p className="text-xs text-[#65546C] mt-2.5 leading-relaxed">
                Cortes de caja Z, arqueos ciegos con firma SHA-256 y bitácora antifraude (Verde Operador / Rojo Admin).
              </p>
            </div>

            {/* Convenios & Convenios */}
            <div
              onClick={() => onNavigate('clients')}
              title="Atajo: F3"
              className="bg-white border border-[#EDE4E2] hover:border-[#9E59C7] rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#F7EFE9]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#9E59C7]" />
                  <span className="text-sm font-bold text-[#2C1338] group-hover:text-[#9E59C7] transition-colors">
                    Convenios &amp; Convenios
                  </span>
                </div>
                <span className="text-[#96859B] group-hover:text-[#9E59C7] transition-colors">→</span>
              </div>
              <p className="text-xs text-[#65546C] mt-2.5 leading-relaxed">
                Submódulo paralelo de convenios corporativos mensuales ($75.000) y servicio Noche ($8.000).
              </p>
            </div>

            {/* Centro de Ayuda & SOPs */}
            <div
              onClick={() => onNavigate('support')}
              title="Atajo: Manuales & SOPs"
              className="bg-white border border-[#EDE4E2] hover:border-[#2B9E78] rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#F7EFE9]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2B9E78]" />
                  <span className="text-sm font-bold text-[#2C1338] group-hover:text-[#2B9E78] transition-colors">
                    Centro de Ayuda &amp; SOPs
                  </span>
                </div>
                <span className="text-[#96859B] group-hover:text-[#2B9E78] transition-colors">→</span>
              </div>
              <p className="text-xs text-[#65546C] mt-2.5 leading-relaxed">
                Manuales operativos, protocolo de contingencia offline (-O), bobinas 80mm y guías paso a paso.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Quality Checklist (6 Items) */}
        <div className="lg:col-span-4 bg-white border border-[#EDE4E2] rounded-2xl shadow-xs p-5 space-y-4">
          <div className="flex items-start justify-between border-b border-[#F7EFE9] pb-3">
            <div>
              <div className="text-xs tabular-nums font-bold uppercase text-[#E2498A]">
                Apertura de Turno
              </div>
              <h3 className="text-base font-extrabold tracking-tight text-[#2C1338] mt-0.5">
                Checklist de Calidad
              </h3>
              <p className="text-xs text-[#65546C] mt-0.5">Supervisión en apertura de garita</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] tabular-nums font-bold bg-[#FEF9F5] text-[#2C1338] border border-[#EDE4E2] tabular-nums shrink-0 mt-0.5">
              {checkedCount}/{checklist.length} REV.
            </span>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-xs tabular-nums text-[#65546C] mb-1.5 tabular-nums">
              <span>Progreso de Verificación</span>
              <span className="font-bold text-[#2C1338]">{checklistPercent}%</span>
            </div>
            <div className="w-full h-2 bg-[#FEF9F5] rounded-full overflow-hidden border border-[#EDE4E2]">
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
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#FEF9F5] cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checklist[idx]}
                  onChange={() => toggleChecklistItem(idx)}
                  className="mt-0.5 w-4 h-4 rounded border-[#EDE4E2] text-[#E2498A] focus:ring-0 cursor-pointer accent-[#E2498A] shrink-0"
                />
                <div className="min-w-0">
                  <div
                    className={`text-xs font-bold leading-snug ${
                      checklist[idx] ? 'text-[#96859B] line-through' : 'text-[#2C1338]'
                    }`}
                  >
                    {item.title}
                  </div>
                  <div className="text-[11px] text-[#65546C] mt-0.5 leading-snug">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-[#F7EFE9] flex items-center justify-between">
            <button
              onClick={() => markAll(true)}
              className="text-xs tabular-nums font-bold text-[#65546C] hover:text-[#2C1338] transition-colors uppercase tracking-wider cursor-pointer"
            >
              Marcar todas
            </button>
            <button
              onClick={() => onShowToast('Apertura de turno firmada y registrada en auditoría.', 'success')}
              className="px-4 py-2 rounded-full bg-[#2C1338] hover:bg-[#412A4C] text-white text-xs font-bold tabular-nums transition-colors shadow-xs cursor-pointer active:scale-[0.98]"
            >
              Firmar Apertura
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
