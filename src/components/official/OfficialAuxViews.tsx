'use client';

import React, { useState } from 'react';
import { AuditLog } from '@/types';
import { ActiveVehicle } from '@/components/official/OfficialModals';

const helpDocuments = [
  { id: 1, title: 'Apertura de Caja y Turno', type: 'Manual', content: 'Pasos para iniciar el turno de forma correcta en Serrano 447. Incluye cómo registrar el fondo inicial de $50.000 pesos, revisión de gaveta y firma del checklist de calidad en la garita.' },
  { id: 2, title: 'Operación del POS (Atajos F1–F9)', type: 'Manual', content: 'Guía sobre cómo utilizar el Punto de Venta. Ingreso por orden de llegada y asignación en 30 plazas (Sector A y B), selección de tarifas (Sedán $25, SUV $30, Moto $15), y proceso de liquidación de salida.' },
  { id: 3, title: 'Cierre de Caja Ciega y Reporte Z (SHA-256)', type: 'Manual', content: 'Procedimiento de fin de turno. Instrucciones para arqueo ciego, cuadratura de efectivo vs sistema, voucher Transbank, y emisión definitiva del corte Z fiscal firmado con SHA-256.' },
  { id: 4, title: 'Reemplazo de Rollo Térmico (80mm Dual QR + Code 128)', type: 'Video', content: 'Videotutorial VD-01. Muestra cómo abrir la impresora térmica, colocar correctamente la bobina de papel de 80mm y verificar la impresión dual QR y Code 128.' },
  { id: 5, title: 'Reinicio de Gaveta de Dinero RJ11', type: 'Video', content: 'Videotutorial VD-02. Qué hacer si la caja registradora o gaveta de dinero no abre automáticamente. Revisión de cable RJ11 y apertura manual de emergencia.' },
  { id: 6, title: 'Procesamiento de Pago con POS Transbank', type: 'Video', content: 'Videotutorial VD-03. Cómo enlazar un cobro del sistema con el terminal de tarjetas, aceptar débito/crédito y emitir la boleta electrónica DTE.' },
  { id: 7, title: 'Caída de Sistema o Corte de Internet (Modo Offline -O)', type: 'Procedimiento', content: 'SOP-01. Protocolo ante corte de internet. El sistema activa persistencia local IndexedDB y añade el sufijo O a los tickets (TKT-AAAAMMDD-T01-XXXXO), sincronizando con Cloud Run al reconectar.' },
  { id: 8, title: 'Vehículo con ticket extraviado o robado ($8.000 CLP)', type: 'Procedimiento', content: 'SOP-02. Cómo actuar si el cliente pierde el ticket. Solicitar padrón del vehículo, carnet de identidad, cobro de recargo reglamentario ($8.000 CLP) autorizado con PIN de Administrador (Auditoría Roja).' },
  { id: 9, title: 'Siniestros o daños a vehículos dentro del patio', type: 'Procedimiento', content: 'SOP-03. Qué hacer si un cliente reporta un choque o rayón dentro del estacionamiento. Revisión de observaciones de ingreso, levantamiento de cámaras CCTV y bloqueo de plaza temporal.' }
];

const learningModules = [
  {
    title: 'Configuración Inicial',
    subtitle: 'Ajustes básicos para comenzar a operar el sistema de garita en Serrano 447',
    cards: [
      { icon: '📄', title: 'Categorías', desc: 'Configuración → Categorías (Sedán, SUV, Moto)' },
      { icon: '🗃️', title: 'Tarifas (Configuración)', desc: '8 artículos • Por minuto, Noche y Convenios' },
      { icon: '📄', title: 'Usuarios y Roles (RBAC)', desc: 'Segregación Operador vs Administrador' },
      { icon: '📄', title: 'Precios y Recargos', desc: 'Multa extravío $8.000 CLP y Gracia' },
      { icon: '📄', title: 'Medios de Pago', desc: 'Efectivo, Tarjeta POS y Transferencia' }
    ]
  },
  {
    title: 'Caja',
    subtitle: 'Protocolo de apertura con sencillo y arqueo de caja ciega',
    cards: [
      { icon: '📄', title: 'Apertura de Caja ($50.000)', desc: 'Declaración obligatoria de fondo inicial de sencillo' },
      { icon: '📄', title: 'Cierre de Caja Ciega (Corte Z)', desc: 'Declaración física vs Efectivo Sistema + Sello SHA-256' }
    ]
  },
  {
    title: 'Auditoría',
    subtitle: 'Control antifraude con PIN y trazabilidad inmutable en Cloud Run',
    cards: [
      { icon: '📄', title: 'TicketControl Monitor', desc: 'Descuentos (Verde - PIN Operador) y Extravíos (Rojo - PIN Admin)' },
      { icon: '📄', title: 'Informes y Exportación', desc: 'Sincronización con Google Sheets y CSV' }
    ]
  }
];

interface OfficialAuxViewsProps {
  activeView: string;
  activeVehicles: ActiveVehicle[];
  auditLogs: AuditLog[];
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
  onSelectVehicleForCheckout: (v: ActiveVehicle) => void;
  onInitiateCashClose: () => void;
  isOfflineMode: boolean;
  onToggleOfflineMode: () => void;
  parallelRecords: any[];
  onAddParallelRecord: (plate: string, company: string, type: 'CONVENIO' | 'NOCHE', slotCode: string) => void;
}

export function OfficialAuxViews({
  activeView,
  activeVehicles,
  auditLogs,
  showToast,
  onSelectVehicleForCheckout,
  isOfflineMode,
  onToggleOfflineMode,
  parallelRecords,
  onAddParallelRecord,
}: OfficialAuxViewsProps) {
  const [timeframe, setTimeframe] = useState('today');
  const [dimension, setDimension] = useState('intervals');
  const [helpQuery, setHelpQuery] = useState('');
  const [learningStep, setLearningStep] = useState(0);

  // New parallel convenio form
  const [newConvPlate, setNewConvPlate] = useState('');
  const [newConvCompany, setNewConvCompany] = useState('');
  const [newConvType, setNewConvType] = useState<'CONVENIO' | 'NOCHE'>('CONVENIO');
  const [newConvSlot, setNewConvSlot] = useState('B-28');

  const helpMatches = helpQuery.trim().length >= 2
    ? helpDocuments.filter((d) => d.title.toLowerCase().includes(helpQuery.toLowerCase()) ||
        d.content.toLowerCase().includes(helpQuery.toLowerCase()))
    : [];

  return (
    <>
      {activeView === 'map' && (
        <div id="view-map" className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in-up">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-bold mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-pulse" />
                <span>AUDITORÍA ECONÓMICA • SERRANO 447 (30 PLAZAS + 5 SOBRECUPO)</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Análisis de Rendimiento &amp; Ocupación Global
              </h2>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Evaluación del establecimiento: métricas de facturación, efectividad horaria, matriz de 30 plazas y comparativas de tendencia.
              </p>
            </div>

            <div className="bg-[#f4f6f9] p-1 rounded-xl flex gap-0.5 self-start shrink-0">
              {[
                { id: 'today', label: 'Hoy' },
                { id: 'week', label: 'Esta Sem' },
                { id: '15d', label: '15 Días' },
                { id: '30d', label: '30 Días' },
              ].map((t) => (
                <button key={t.id} onClick={() => {
                  setTimeframe(t.id);
                  showToast(`Filtro actualizado a: ${t.label}`, 'info');
                }} className={`px-4 py-2 rounded-lg text-[13px] transition-all font-mono ${timeframe === t.id
                  ? 'bg-white rounded-lg shadow-sm font-bold text-slate-900'
                  : 'text-slate-500 font-medium hover:text-slate-700'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#dde2e8] hover:shadow-[0_4px_8px_rgba(0,0,0,0.06)] transition-all">
              <div className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-400 mb-2 flex items-center justify-between">
                <span>Facturación Global</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">+14.5%</span>
              </div>
              <div className="text-3xl font-black font-mono tabular-nums tracking-tight text-emerald-600">$342.500</div>
              <div className="text-[12px] text-slate-500 mt-2">48 vehículos atendidos</div>
            </div>
            <div className="p-5 bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#dde2e8] hover:shadow-[0_4px_8px_rgba(0,0,0,0.06)] transition-all">
              <div className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-400 mb-2 flex items-center justify-between">
                <span title="Revenue Per Available Space">RevPAS Recinto</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700 border-sky-200">KPI</span>
              </div>
              <div className="text-3xl font-black font-mono tabular-nums tracking-tight text-slate-900">$11.417</div>
              <div className="text-[12px] text-slate-500 mt-2">Ingreso diario / plaza física</div>
            </div>
            <div className="p-5 bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#dde2e8] hover:shadow-[0_4px_8px_rgba(0,0,0,0.06)] transition-all">
              <div className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-400 mb-2 flex items-center justify-between">
                <span>Rotación (Turnover)</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">Óptimo</span>
              </div>
              <div className="text-3xl font-black font-mono tabular-nums tracking-tight text-slate-900">1.60x</div>
              <div className="text-[12px] text-slate-500 mt-2">Rotaciones diarias por cupo</div>
            </div>
            <div className="p-5 bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#dde2e8] hover:shadow-[0_4px_8px_rgba(0,0,0,0.06)] transition-all">
              <div className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-400 mb-2 flex items-center justify-between">
                <span title="Average Length of Stay">Permanencia (ALOS)</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">Media</span>
              </div>
              <div className="text-3xl font-black font-mono tabular-nums tracking-tight text-slate-900">51 min</div>
              <div className="text-[12px] text-slate-500 mt-2">Estadía media global</div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'intervals', label: 'Franjas Horarias & Efectividad' },
              { id: 'heatmap', label: 'Matriz Semanal' },
              { id: 'benchmark', label: 'Comparativa por Días' },
              { id: 'matrix', label: 'Plano Físico 30 Plazas (Serrano 447)' },
            ].map((d) => (
              <button key={d.id} onClick={() => setDimension(d.id)} className={`px-4 h-10 shrink-0 rounded-xl text-[13px] transition-all ${dimension === d.id ? 'bg-slate-900 text-white shadow-sm font-bold' : 'bg-[#f4f6f9] text-slate-500 font-medium hover:text-slate-700 hover:bg-[#eceef2]'}`}>
                {d.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-8 bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 min-h-[400px] space-y-5">
              <div className="border-b border-[#f1f5f9] pb-4 mb-5">
                <h3 className="text-[15px] font-bold tracking-tight text-slate-900">
                  {dimension === 'intervals' && 'Efectividad por Franjas Horarias'}
                  {dimension === 'heatmap' && 'Matriz Semanal de Calor (Ocupación y Flujo)'}
                  {dimension === 'benchmark' && 'Comparativa de Tendencia: Hoy vs Promedio Histórico'}
                  {dimension === 'matrix' && 'Matriz Semántica Serrano 447 (Sector A 01–15 | Sector B 16–30)'}
                </h3>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  {dimension === 'intervals' && 'Rendimiento monetario por hora activa ($/hr) y porcentaje de afluencia del recinto.'}
                  {dimension === 'heatmap' && 'Densidad de saturación física en los 7 días de la semana por bloques horarios.'}
                  {dimension === 'benchmark' && 'Evaluación del comportamiento de la jornada contra el promedio histórico.'}
                  {dimension === 'matrix' && 'Código semántico oficial: Disponible (#10B981), Ocupada (#64748B), Convenio/VIP (#3B82F6), PMR (#06B6D4), EV (#8B5CF6), Sobrestadía (#EF4444).'}
                </p>
              </div>

              {dimension === 'intervals' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 tabular-nums">
                  <div className="p-5 rounded-2xl border border-[#e8ecf0] bg-white hover:border-[#dde2e8] hover:shadow-[0_4px_8px_rgba(0,0,0,0.06)] transition-all space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[14px] font-bold text-slate-900">Mañana (Apertura)</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">07:00 a 12:00 hrs</div>
                      </div>
                      <span className="text-lg font-black font-mono tabular-nums text-emerald-600">$113.000</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1.5">
                        <span>Aporte</span><span className="font-bold text-slate-800">33.0%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '33%' }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#f1f5f9] text-[11px] font-mono text-center">
                      <div className="bg-[#f8fafc] p-2 rounded-xl border border-[#e8ecf0]">
                        <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em] mb-1">Rendimiento:</span>
                        <span className="font-bold text-emerald-700">$22.600 / hr</span>
                      </div>
                      <div className="bg-[#f8fafc] p-2 rounded-xl border border-[#e8ecf0]">
                        <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em] mb-1">Pico Patio:</span>
                        <span className="font-bold text-slate-800">76%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-[#e8ecf0] bg-white hover:border-[#dde2e8] hover:shadow-[0_4px_8px_rgba(0,0,0,0.06)] transition-all space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[14px] font-bold text-slate-900">Mediodía &amp; Almuerzo</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">12:00 a 15:30 hrs</div>
                      </div>
                      <span className="text-lg font-black font-mono tabular-nums text-emerald-600">$174.000</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1.5">
                        <span>Aporte</span><span className="font-bold text-slate-800">50.8%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '50.8%' }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#f1f5f9] text-[11px] font-mono text-center">
                      <div className="bg-[#f8fafc] p-2 rounded-xl border border-[#e8ecf0]">
                        <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em] mb-1">Rendimiento:</span>
                        <span className="font-bold text-emerald-700">$49.714 / hr</span>
                      </div>
                      <div className="bg-[#f8fafc] p-2 rounded-xl border border-[#e8ecf0]">
                        <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em] mb-1">Pico Patio:</span>
                        <span className="font-bold text-slate-800">94%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {dimension === 'heatmap' && (
                <div className="space-y-3 font-mono text-sm">
                  <div className="grid grid-cols-7 gap-2 text-center text-[10px] text-slate-400 font-bold pb-2 border-b border-[#f1f5f9] uppercase tracking-[0.06em]">
                    <div>Día</div><div>07-10h</div><div>10-13h</div><div>13-16h</div><div>16-19h</div><div>19-21h</div><div>21-23h</div>
                  </div>
                  <div className="grid grid-cols-7 gap-2 items-center text-center">
                    <div className="text-[11px] font-bold text-slate-700 text-left">Lunes</div>
                    <div className="h-10 rounded-lg bg-emerald-100" /><div className="h-10 rounded-lg bg-emerald-200" /><div className="h-10 rounded-lg bg-emerald-400" /><div className="h-10 rounded-lg bg-emerald-200" /><div className="h-10 rounded-lg bg-emerald-50" /><div className="h-10 rounded-lg bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-7 gap-2 items-center text-center">
                    <div className="text-[11px] font-bold text-slate-700 text-left">Martes</div>
                    <div className="h-10 rounded-lg bg-emerald-100" /><div className="h-10 rounded-lg bg-emerald-400" /><div className="h-10 rounded-lg bg-emerald-600 shadow text-white font-bold flex items-center justify-center text-[9px]">PEAK</div><div className="h-10 rounded-lg bg-emerald-200" /><div className="h-10 rounded-lg bg-emerald-50" /><div className="h-10 rounded-lg bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-7 gap-2 items-center text-center">
                    <div className="text-[11px] font-bold text-slate-700 text-left">Miércoles</div>
                    <div className="h-10 rounded-lg bg-emerald-100" /><div className="h-10 rounded-lg bg-emerald-200" /><div className="h-10 rounded-lg bg-emerald-400" /><div className="h-10 rounded-lg bg-emerald-400" /><div className="h-10 rounded-lg bg-emerald-50" /><div className="h-10 rounded-lg bg-slate-100" />
                  </div>
                </div>
              )}

              {dimension === 'benchmark' && (
                <div className="space-y-6 font-mono tabular-nums">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 bg-[#f8fafc] rounded-2xl border border-[#e8ecf0]">
                      <span className="text-[10px] text-slate-400 block uppercase tracking-[0.07em] mb-2">Facturación Actual:</span>
                      <span className="text-2xl font-black text-emerald-600 tabular-nums">$342.500</span>
                    </div>
                    <div className="p-5 bg-[#f8fafc] rounded-2xl border border-[#e8ecf0]">
                      <span className="text-[10px] text-slate-400 block uppercase tracking-[0.07em] mb-2">Promedio Histórico:</span>
                      <span className="text-2xl font-bold text-slate-700 tabular-nums">$299.000</span>
                    </div>
                    <div className="p-5 bg-[#f8fafc] rounded-2xl border border-[#e8ecf0]">
                      <span className="text-[10px] text-slate-400 block uppercase tracking-[0.07em] mb-2">Variación:</span>
                      <span className="text-2xl font-black text-emerald-600 tabular-nums">+14.5%</span>
                    </div>
                  </div>
                </div>
              )}

              {dimension === 'matrix' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 font-mono text-xs tabular-nums">
                    {Array.from({ length: 30 }, (_, idx) => {
                      const slotNum = idx + 1;
                      const slotCode = slotNum <= 15 ? `A-${slotNum.toString().padStart(2, '0')}` : `B-${slotNum.toString().padStart(2, '0')}`;
                      const veh = activeVehicles.find((v) => v.slot === slotNum);
                      const isConvenio = slotNum >= 29 || parallelRecords.some((p) => p.slotCode === slotCode);
                      const isPMR = slotNum === 1 || slotNum === 2;
                      const isEV = slotNum === 3;
                      const isOverstay = veh && veh.durationMin >= 120;
                      let bgStyle = 'bg-[#10B981]/10 border-[#10B981] text-emerald-950';
                      let badgeText = 'LIBRE';
                      if (isOverstay) {
                        bgStyle = 'bg-[#EF4444]/10 border-[#EF4444] text-rose-950';
                        badgeText = veh?.plate || 'ALERTA';
                      } else if (veh) {
                        bgStyle = 'bg-[#64748B]/10 border-[#64748B] text-slate-900';
                        badgeText = veh.plate;
                      } else if (isConvenio) {
                        bgStyle = 'bg-[#3B82F6]/10 border-[#3B82F6] text-blue-950';
                        badgeText = 'ABONADO';
                      } else if (isPMR) {
                        bgStyle = 'bg-[#06B6D4]/10 border-[#06B6D4] text-cyan-950';
                        badgeText = 'PMR';
                      } else if (isEV) {
                        bgStyle = 'bg-[#8B5CF6]/10 border-[#8B5CF6] text-purple-950';
                        badgeText = 'EV';
                      }
                      return (
                        <div key={slotCode} onClick={() => { if (veh) onSelectVehicleForCheckout(veh); }} className={`p-2.5 rounded-xl border-2 ${bgStyle} cursor-pointer transition-transform hover:-translate-y-0.5 h-20 flex flex-col justify-between font-mono text-xs tabular-nums`}>
                          <div className="flex justify-between items-center text-[10px] font-bold opacity-75">
                            <span>{slotCode}</span>
                            {veh && <span>{veh.durationMin}m</span>}
                          </div>
                          <div className="font-extrabold text-xs tracking-wider truncate">{badgeText}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-4 space-y-4">
              <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                  <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-900">Diagnóstico Operativo</h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">SCORE 94/100</span>
                </div>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#e8ecf0] space-y-2">
                    <div className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>Ventana de Rentabilidad Máxima</span>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed pl-4">La franja <strong>12:00 a 15:30 hrs</strong> rinde <strong>$49.714 / hr</strong> en Serrano 447.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#e8ecf0] space-y-2">
                    <div className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>Oportunidad Horario Valle</span>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed pl-4">Entre <strong>16:00 y 17:30 hrs</strong> la ocupación desciende. Ideal para convenios corporativos vespertinos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-4 mb-5">
              <div>
                <h3 className="text-[15px] font-bold tracking-tight text-slate-900">Evolución Global Horaria: Ocupación vs Recaudación</h3>
                <p className="text-[13px] text-slate-500 mt-0.5">Comportamiento dinámico de los 30 cupos del establecimiento para optimizar turnos.</p>
              </div>
              <span className="inline-flex items-center gap-2 text-emerald-700 font-mono text-[12px] font-bold shrink-0">
                <span className="w-3 h-3 rounded bg-emerald-500" /> Facturación ($)
              </span>
            </div>
            <div className="h-52 flex items-end gap-2 px-2 tabular-nums">
              {[
                { h: '07h', val: '$12k', pct: 25 }, { h: '08h', val: '$22k', pct: 45 }, { h: '09h', val: '$31k', pct: 60 }, { h: '10h', val: '$36k', pct: 70 },
                { h: '11h', val: '$42k', pct: 80 }, { h: '12h', val: '$48k', pct: 88 }, { h: '13h', val: '$58k', pct: 95, peak: true }, { h: '14h', val: '$52k', pct: 90 },
                { h: '15h', val: '$35k', pct: 68 }, { h: '16h', val: '$30k', pct: 58 }, { h: '17h', val: '$38k', pct: 72 }, { h: '18h', val: '$44k', pct: 82 },
                { h: '19h*', val: '$39k', pct: 76 }, { h: '20h', val: '$29k', pct: 60 }, { h: '21h', val: '$24k', pct: 50 }, { h: '22h', val: '$18k', pct: 38 },
              ].map((bar) => (
                <div key={bar.h} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                  {bar.peak && <span className="absolute -top-6 text-[9px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200">PEAK</span>}
                  <div className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-[#e8ecf0] rounded-lg px-1.5 py-0.5 shadow-sm absolute -top-8 whitespace-nowrap">{bar.val}</div>
                  <div className="w-full bg-emerald-500 rounded-t transition-all group-hover:bg-emerald-400" style={{ height: `${bar.pct}%` }} />
                  <span className="text-[10px] font-mono text-slate-400 mt-1 shrink-0">{bar.h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'support' && (
        <div id="view-support" className="animate-fade-in-up pb-16 w-full">
          <div className="bg-white border-b border-[#e8ecf0] pt-14 pb-20 text-center px-6 relative">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-8 tracking-tight">
              <span className="relative inline-block">
                Hola,
                <span className="absolute bottom-1.5 left-0 w-full h-2 bg-blue-600 rounded-full opacity-90 -z-10" />
              </span>{' '}
              ¿en qué podemos ayudarte?
            </h2>
            <div className="max-w-xl mx-auto relative z-40">
              <div className="bg-white rounded-2xl border border-[#dde2e8] shadow-[0_4px_8px_rgba(0,0,0,0.06)] p-2 flex items-center gap-3">
                <input type="text" value={helpQuery} onChange={(e) => setHelpQuery(e.target.value)} placeholder="Busca por palabra clave (ej. offline, arqueo, ticket perdido, 80mm)..." className="flex-1 bg-transparent border-none outline-none px-4 text-slate-700 text-[15px] placeholder:text-slate-400" />
                <button className="rounded-xl bg-slate-900 text-white w-10 h-10 flex items-center justify-center shrink-0 hover:bg-slate-800 transition-colors">🔍</button>
              </div>
              {helpQuery.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.10)] max-h-80 overflow-y-auto divide-y divide-[#f1f5f9] text-left z-50">
                  {helpMatches.length === 0 ? (
                    <div className="p-5 text-[13px] text-slate-500 text-center font-mono">No se encontraron resultados para &quot;{helpQuery}&quot;</div>
                  ) : (
                    helpMatches.map((doc) => (
                      <div key={doc.id} onClick={() => { setHelpQuery(''); showToast(`Abriendo ${doc.type}: ${doc.title}`, 'info'); }} className="p-4 hover:bg-[#f8fafc] cursor-pointer transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <span className="font-bold text-slate-800 text-[13px]">{doc.title}</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-[#f4f6f9] text-slate-600 border-[#e8ecf0] shrink-0">{doc.type.toUpperCase()}</span>
                        </div>
                        <div className="text-[12px] text-slate-500 leading-relaxed">{doc.content}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="-mt-10 relative z-10 max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { title: 'Primeros Pasos', desc: 'Guía básica para iniciar turno, declarar $50.000 de sencillo y operar el POS.' },
              { title: 'Conceptos Clave', desc: 'Liquidación de salidas, cuadratura ciega y emisión de Reporte Z con SHA-256.' },
              { title: 'Documentación Canónica', desc: 'PRD V2.0, Flujo Operador 6 Fases, Especificaciones Cloud Run e Impresora 80mm.' },
            ].map((card) => (
              <div key={card.title} onClick={() => showToast(`Consultando sección: ${card.title}`, 'info')} className="bg-white rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.06)] border border-[#e8ecf0] p-6 text-center flex flex-col items-center hover:-translate-y-1 transition-transform cursor-pointer">
                <h3 className="text-[15px] font-bold text-slate-900 mb-2">{card.title}</h3>
                <p className="text-[12px] text-slate-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="max-w-5xl mx-auto px-6 mt-12">
            <div className="bg-[#f4f6f9] rounded-[24px] p-8 border border-[#e8ecf0]">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-1">{learningModules[learningStep].title}</h2>
              <p className="text-[13px] text-slate-500 mb-6">{learningModules[learningStep].subtitle}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {learningModules[learningStep].cards.map((c) => (
                  <div key={c.title} onClick={() => showToast(`Módulo SOP: ${c.title}`, 'info')} className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#e8ecf0] p-5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.06)] hover:border-[#dde2e8] transition-all cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{c.icon}</span>
                      <h4 className="text-[14px] font-bold text-slate-800">{c.title}</h4>
                    </div>
                    <p className="text-[12px] text-slate-500 leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-6 border-t border-[#e8ecf0] pt-5">
                <div>
                  {learningStep > 0 && (
                    <button onClick={() => setLearningStep(learningStep - 1)} className="w-full bg-white rounded-xl p-4 border border-[#e8ecf0] hover:border-[#dde2e8] hover:shadow-sm text-left transition-all">
                      <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-[0.06em]">Anterior</div>
                      <div className="text-[13px] font-bold text-blue-600 mt-0.5">« {learningModules[learningStep - 1].title}</div>
                    </button>
                  )}
                </div>
                <div>
                  {learningStep < learningModules.length - 1 && (
                    <button onClick={() => setLearningStep(learningStep + 1)} className="w-full bg-white rounded-xl p-4 border border-[#e8ecf0] hover:border-[#dde2e8] hover:shadow-sm text-right transition-all">
                      <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-[0.06em]">Siguiente</div>
                      <div className="text-[13px] font-bold text-blue-600 mt-0.5">{learningModules[learningStep + 1].title} »</div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'reports' && (
        <div id="view-reports" className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#f1f5f9]">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Reportes de Recaudación, Arqueos Ciegos &amp; Bitácora PIN</h2>
              <p className="text-[13px] text-slate-500 mt-0.5">Resaltado normativo: Verde para descuentos autorizados (PIN Operador) y Rojo para recargos/ticket extraviado (PIN Admin).</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <a href="/api/export/sheets" target="_blank" rel="noreferrer" className="px-4 h-10 rounded-xl border border-[#dde2e8] bg-white hover:bg-[#f8fafc] text-slate-700 text-[12px] font-bold flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors">
                Exportar CSV / Sheets
              </a>
              <button onClick={() => showToast('Corte Z Fiscal #1042 generado con sello SHA-256', 'success')} className="px-4 h-10 rounded-xl bg-slate-900 text-white text-[12px] font-bold shadow-sm hover:bg-slate-800 transition-colors">
                Generar Corte Z del Día
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
            <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-500 mb-4">Bitácora Inmutable de Auditoría Antifraude (`/api/audit`)</h3>
            <div className="max-h-96 overflow-y-auto space-y-1 font-mono text-xs tabular-nums">
              {auditLogs.map((log: any) => {
                const isGreen = log.color_tag === 'VERDE';
                const isRed = log.color_tag === 'ROJO';
                return (
                  <div key={log.id_auditoria} className={`flex items-start justify-between py-3 px-4 rounded-xl border hover:border-[#dde2e8] transition-colors ${isGreen ? 'bg-white border-[#e8ecf0] border-l-4 border-l-emerald-500' : isRed ? 'bg-white border-[#e8ecf0] border-l-4 border-l-rose-500' : 'bg-white border-[#e8ecf0] border-l-4 border-l-slate-200'}`}>
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{log.accion}</span>
                        {log.autorizador_pin && <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-mono">PIN VERIFICADO</span>}
                      </div>
                      <div className="text-slate-500 text-[11px] font-sans">{log.motivo}</div>
                    </div>
                    <div className="text-right text-slate-400 shrink-0 pl-4">
                      <div className="text-[11px]">{new Date(log.fecha_hora).toLocaleTimeString('es-CL')}</div>
                      <div className="text-[10px] font-bold text-slate-600 mt-0.5">{log.nombre_usuario || log.id_usuario}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeView === 'clients' && (
        <div id="view-clients" className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#f1f5f9]">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Submódulo en Paralelo: Abonados Mensuales &amp; Servicio Noche</h2>
              <p className="text-[13px] text-slate-500 mt-0.5">Regla de Dominio #7: Bloquea plaza en la matriz Serrano 447 sin ingresar a la lista de transitorios ni alterar la contabilidad por minuto.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-5 bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 space-y-5">
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-500">Registrar Servicio en Paralelo [F3]</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-[0.05em]">Patente Vehículo *</label>
                  <input type="text" value={newConvPlate} onChange={(e) => setNewConvPlate(e.target.value.toUpperCase())} placeholder="Ej. KJWP92" maxLength={8} className="w-full h-11 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] font-mono font-bold uppercase text-slate-900 text-[13px] focus:outline-none focus:border-slate-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-[0.05em]">Empresa / Titular *</label>
                  <input type="text" value={newConvCompany} onChange={(e) => setNewConvCompany(e.target.value)} placeholder="Ej. Notaría Iquique / Clínica Tarapacá" className="w-full h-11 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] text-slate-700 text-[13px] focus:outline-none focus:border-slate-400 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-[0.05em]">Modalidad</label>
                    <select value={newConvType} onChange={(e) => setNewConvType(e.target.value as 'CONVENIO' | 'NOCHE')} className="w-full h-11 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] text-[12px] font-mono font-bold text-slate-800 focus:outline-none focus:border-slate-400 transition-colors">
                      <option value="CONVENIO">Convenio Mensual ($75.000)</option>
                      <option value="NOCHE">Pernocta Noche ($8.000)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-[0.05em]">Plaza Bloqueada</label>
                    <input type="text" value={newConvSlot} onChange={(e) => setNewConvSlot(e.target.value.toUpperCase())} className="w-full h-11 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] text-[12px] font-mono font-bold text-slate-800 focus:outline-none focus:border-slate-400 transition-colors" />
                  </div>
                </div>
                <button onClick={() => {
                  if (!newConvPlate.trim() || !newConvCompany.trim()) { showToast('Complete patente y empresa/titular', 'error'); return; }
                  onAddParallelRecord(newConvPlate.trim(), newConvCompany.trim(), newConvType, newConvSlot);
                  setNewConvPlate(''); setNewConvCompany('');
                }} className="h-11 w-full rounded-xl bg-slate-900 text-white text-[12px] font-bold hover:bg-slate-800 shadow-sm transition-colors">
                  Bloquear Plaza en Paralelo (Sin sumar a Caja Rotativa)
                </button>
              </div>
            </div>

            <div className="md:col-span-7 bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-500 mb-4">Nómina Activa en Paralelo ({parallelRecords.length} Plazas Reservadas)</h3>
              <div className="divide-y divide-[#f1f5f9] font-mono text-xs tabular-nums">
                {parallelRecords.map((rec) => (
                  <div key={rec.id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="license-plate-chip px-2.5 py-0.5 text-xs">{rec.plate}</span>
                      <div>
                        <div className="font-sans font-bold text-slate-900 text-[13px]">{rec.company}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Plaza {rec.slotCode} •{' '}
                          {rec.type === 'CONVENIO' ? <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-0.5 text-[11px] font-mono font-bold">CONVENIO</span> : <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-0.5 text-[11px] font-mono font-bold">NOCHE</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900 font-mono tabular-nums text-[14px]">${rec.amount.toLocaleString('es-CL')}</div>
                      <span className="inline-block mt-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold">{rec.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'settings' && (
        <div id="view-settings" className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#f1f5f9]">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Configuración del Sistema, Tarifas CLP &amp; Contingencia Offline</h2>
              <p className="text-[13px] text-slate-500 mt-0.5">Parámetros operativos de Serrano 447, Iquique (`cordano-pms-v1` en Google Cloud Run `us-west1`).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 space-y-4">
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-500 border-b border-[#f1f5f9] pb-3">Motor de Tarifas por Minuto y Multas (CLP)</h3>
              <div className="space-y-3 font-mono tabular-nums">
                {[
                  { label: 'Auto / Sedán', rate: '$25 CLP / min' },
                  { label: 'Camioneta / SUV', rate: '$30 CLP / min' },
                  { label: 'Motocicleta', rate: '$15 CLP / min' },
                ].map((item) => (
                  <div key={item.label} className="p-4 bg-[#f8fafc] rounded-xl border border-[#e8ecf0] flex items-center justify-between">
                    <span className="text-[13px] text-slate-600">{item.label}:</span>
                    <span className="text-[15px] font-black text-slate-900 tabular-nums">{item.rate}</span>
                  </div>
                ))}
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between">
                  <span className="text-[12px] text-rose-700">Recargo Pérdida de Ticket (Leyenda Legal):</span>
                  <span className="text-[15px] font-black text-rose-800 tabular-nums">$8.000 CLP</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 space-y-4">
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-500 border-b border-[#f1f5f9] pb-3">Resiliencia Offline-First (IndexedDB + Sufijo -O)</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">Al activarse la contingencia offline, los tickets emitidos añaden el sufijo obligatorio <strong>O</strong> (`TKT-AAAAMMDD-T01-XXXXO`) y se encolan localmente hasta sincronizar con Cloud Run.</p>
              <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#e8ecf0]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${isOfflineMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <span className="text-[13px] font-bold text-slate-900">{isOfflineMode ? 'CONTINGENCIA OFFLINE (-O)' : 'ONLINE (CLOUD RUN)'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">Servicio: cordano-pms-v1 (us-west1)</div>
                  </div>
                  <button onClick={onToggleOfflineMode} className={`px-5 h-10 rounded-xl text-[12px] font-bold text-white transition-colors shrink-0 ${isOfflineMode ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'}`}>
                    {isOfflineMode ? 'Reconectar a Cloud Run' : 'Simular Modo Offline (-O)'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <div>
                <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-500">Magnific AI / Freepik API — Presets de Super-Resolución &amp; Relighting</h3>
                <p className="text-[12px] text-slate-400 mt-0.5">Parámetros calibrados para los Slots Wireframe de Landing sin contaminar el Core Funcional Puro.</p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#f4f6f9] text-slate-600 border border-[#e8ecf0] shrink-0">POST /v1/ai/image-upscaler</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Preset A: UI Dashboard (Faithful)', params: 'Creativity: 0 | HDR: 10 | Resemblance: 95 | Fractality: 0', prompt: 'Ultra-sharp enterprise UI dashboard, crisp vector icons, perfectly legible monospace numbers, 8k resolution.' },
                { name: 'Preset B: Serrano 447 (Architecture)', params: 'Creativity: +3 | HDR: 45 | Resemblance: 75 | Fractality: 35', prompt: 'Architectural aerial view of parking lot in Iquique Chile, 30 stalls marked A-01 to B-30, sunny coastal daylight.' },
                { name: 'Preset C: CCTV LPR (Photographic)', params: 'Creativity: +2 | HDR: 30 | Resemblance: 80 | Fractality: 20', prompt: 'Security CCTV camera angle of a car entering parking booth, crisp Chilean license plate visible, timestamp overlay.' },
              ].map((preset) => (
                <div key={preset.name} className="p-4 rounded-xl bg-[#f8fafc] border border-[#e8ecf0] space-y-3">
                  <div className="text-[12px] font-bold text-slate-800">{preset.name}</div>
                  <code className="block text-[11px] text-emerald-700 font-mono bg-white border border-[#e8ecf0] rounded-lg px-3 py-2 leading-relaxed">{preset.params}</code>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{preset.prompt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
