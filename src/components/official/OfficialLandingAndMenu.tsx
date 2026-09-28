'use client';

import React from 'react';

interface OfficialLandingAndMenuProps {
  activeView: string;
  navigateTo: (view: string) => void;
  openPosInSubtab: (subtab: 'entry' | 'exit' | 'history') => void;
  isShiftActive: boolean;
  shiftTimerStr: string;
  operatorName: string;
  initialFloat: number;
  shiftRevenue: number;
  occupiedCount: number;
  loginUser: string;
  setLoginUser: (v: string) => void;
  loginPass: string;
  setLoginPass: (v: string) => void;
  loginRole: 'OPERADOR' | 'ADMIN';
  setLoginRole: (r: 'OPERADOR' | 'ADMIN') => void;
  loginFloat: string;
  setLoginFloat: (v: string) => void;
  loginSession: () => void;
  initiateCashClose: () => void;
  checklistItems: boolean[];
  toggleChecklistItem: (idx: number) => void;
  markAllChecklist: (status: boolean) => void;
  signChecklist: () => void;
  scrollToTopOfViews: () => void;
}

const checklistLabels = [
  { title: '1. Verificar perímetro y accesos', desc: 'Portón operativo en Serrano 447, cerco libre de daños y señalética visible.' },
  { title: '2. Verificar cámaras de seguridad', desc: 'Transmisión activa de los canales CCTV NVR y cámara LPR.' },
  { title: '3. Revisar instalaciones físicas', desc: 'Alumbrado de garita y extintor con manómetro al día.' },
  { title: '4. Limpiar sector de clientes', desc: 'Zona de pago y calzada despejada de obstáculos.' },
  { title: '5. Conciliación en patio (30 plazas)', desc: 'Contraste visual físico Sector A (01–15) y Sector B (16–30) contra sistema.' },
  { title: '6. Fondo de caja y bobina 80mm', desc: 'Confirmar $50.000 de sencillo para vuelto y papel térmico de repuesto.' },
];

export function OfficialLandingAndMenu({
  activeView,
  navigateTo,
  openPosInSubtab,
  isShiftActive,
  shiftTimerStr,
  operatorName,
  initialFloat,
  shiftRevenue,
  occupiedCount,
  loginUser,
  setLoginUser,
  loginPass,
  setLoginPass,
  loginRole,
  setLoginRole,
  loginFloat,
  setLoginFloat,
  loginSession,
  initiateCashClose,
  checklistItems,
  toggleChecklistItem,
  markAllChecklist,
  signChecklist,
  scrollToTopOfViews,
}: OfficialLandingAndMenuProps) {
  const checkedCount = checklistItems.filter(Boolean).length;
  const checklistPct = Math.round((checkedCount / checklistItems.length) * 100);
  const occupancyPct = Math.min(100, Math.round((occupiedCount / 30) * 100));

  const [showVisualRenders, setShowVisualRenders] = React.useState(true);
  const [checklistSnoozeSec, setChecklistSnoozeSec] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (checklistSnoozeSec === null || checklistSnoozeSec <= 0) return;
    const t = setInterval(() => {
      setChecklistSnoozeSec((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(t);
  }, [checklistSnoozeSec]);

  return (
    <>
      {activeView === 'landing' && (
        <div id="view-landing" className="min-h-screen bg-[#f4f6f9] p-6 md:p-8 animate-fade-in-up">
          <div className="max-w-6xl mx-auto space-y-10">
            <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2">
              <div className="md:col-span-7 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#e8ecf0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">
                      Sistema de Gestión Operativa en Garita &nbsp;·&nbsp; Serrano 447, Iquique
                    </span>
                  </div>
                  <button
                    onClick={() => setShowVisualRenders(!showVisualRenders)}
                    className="text-[11px] font-mono font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 transition-colors"
                  >
                    {showVisualRenders ? 'Ocultar Renders' : 'Ver Renders Magnific AI'}
                  </button>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl md:text-[2.2rem] font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                    Plataforma de Control de Estacionamiento &amp; Recaudación Presencial
                  </h1>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                    Control de ingresos y salidas en recinto Serrano 447 (~700 m², 30 plazas: Sector A 01–15, Sector B 16–30). Emisión inmediata de comprobante térmico de 80mm con identificación dual (QR + Code 128) y cuadratura ciega de turno con sello SHA-256.
                  </p>
                </div>

                <div className="w-full h-52 rounded-xl border-dashed border-2 border-[#dde2e8] bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center group hover:border-slate-400 transition-colors overflow-hidden relative">
                  {showVisualRenders ? (
                    <img 
                      src="https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=1000&auto=format&fit=crop" 
                      alt="Garita Render"
                      className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-white border border-[#e8ecf0] shadow-[0_1px_2px_rgba(0,0,0,0.06)] flex items-center justify-center text-slate-400 mb-3">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">
                        [ Slot Wireframe: Banner Principal / Fotografía de la Garita Serrano 447 ]
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 max-w-sm">
                        Espacio para render o fotografía del computador presencial, impresora térmica 80mm y acceso vehicular del patio.
                      </p>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Ergonomía F1–F9', sub: 'Operación 100% digital asistida' },
                    { label: 'DTE SII & Dual 80mm', sub: 'QR + Code 128, contingencia offline (-O)' },
                    { label: 'Arqueo Ciego SHA-256', sub: 'Cierre transparente con PIN antifraude' },
                  ].map((f) => (
                    <div key={f.label} className="bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-3.5">
                      <div className="text-xs font-bold text-slate-900 leading-tight">{f.label}</div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">{f.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-5">
                {isShiftActive ? (
                  <div id="landing-auth-active-card" className="bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-6 space-y-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400" />
                    <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 live-pulse" />
                        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">
                          Sesión de Turno Activa
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        GARITA 01
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-xl border border-[#e8ecf0]">
                      <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 tracking-tight">
                        JP
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{operatorName}</div>
                        <div className="text-[11px] text-slate-400">Operador en Turno Diurno · Serrano 447</div>
                      </div>
                      <div className="ml-auto text-right shrink-0">
                        <div id="landing-card-shift-timer" className="text-sm font-mono font-bold tabular-nums text-slate-900">
                          {shiftTimerStr}
                        </div>
                        <div className="text-[10px] font-mono tabular-nums text-slate-400">
                          Fondo: ${initialFloat.toLocaleString('es-CL')}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 relative z-10">
                      <button onClick={() => navigateTo('menu')} className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2.5 shadow-sm transition-colors shortcut-tooltip" data-shortcut="F1">
                        <span>Ir al Menú Principal</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-slate-700 border border-slate-600 text-[10px] font-mono font-bold text-slate-300">F1</kbd>
                      </button>
                      <button onClick={() => navigateTo('pos')} className="w-full h-11 rounded-xl bg-white hover:bg-[#f8fafc] border border-[#dde2e8] text-slate-800 text-sm font-bold flex items-center justify-center gap-2.5 transition-colors shortcut-tooltip" data-shortcut="F2">
                        <span>Volver al Punto de Venta (POS)</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#f1f5f9] border border-[#c1c9d4] text-[10px] font-mono font-bold text-slate-500">F2</kbd>
                      </button>
                    </div>

                    <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Cloud Run Conectado
                      </span>
                      <button onClick={initiateCashClose} className="text-rose-600 hover:text-rose-700 text-xs font-bold font-mono transition-colors">
                        Cerrar Turno y Sesión
                      </button>
                    </div>
                  </div>
                ) : (
                  <div id="landing-auth-login-card" className="bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-6 space-y-5">
                    <div className="border-b border-[#f1f5f9] pb-4">
                      <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400 mb-1">
                        Acceso a Garita
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Ingrese credenciales y declare fondo inicial (Regla #7: Administradores no abren caja).
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400 mb-2">Rol de Sesión</label>
                        <div className="flex p-1 bg-slate-100 rounded-lg gap-1">
                          <button type="button" onClick={() => setLoginRole('OPERADOR')} className={`flex-1 h-8 rounded-md text-xs font-bold transition-all ${loginRole === 'OPERADOR' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            Operador de Garita
                          </button>
                          <button type="button" onClick={() => setLoginRole('ADMIN')} className={`flex-1 h-8 rounded-md text-xs font-bold transition-all ${loginRole === 'ADMIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            Administrador
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400 mb-1.5">Operador / Correo</label>
                        <input type="text" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} className="w-full h-10 px-3 bg-[#f8fafc] border-[1.5px] border-[#dde2e8] rounded-[10px] text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-0 focus:outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400 mb-1.5">Contraseña</label>
                        <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="w-full h-10 px-3 bg-[#f8fafc] border-[1.5px] border-[#dde2e8] rounded-[10px] text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-0 focus:outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400 mb-1.5">Fondo Inicial de Sencillo Declarado (CLP) *</label>
                        <input type="number" value={loginFloat} onChange={(e) => setLoginFloat(e.target.value)} className="w-full h-10 px-3 bg-[#f8fafc] border-[1.5px] border-[#dde2e8] rounded-[10px] text-sm font-mono font-bold tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-0 focus:outline-none transition-colors" />
                      </div>
                    </div>
                    <button onClick={loginSession} className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors shadow-sm">
                      Iniciar Turno y Abrir Sistema
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#e8ecf0] pb-3">
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">Infraestructura de Garita</div>
                  <h2 className="text-base font-extrabold tracking-tight text-slate-900 mt-0.5">Hardware &amp; Dispositivos de Garita (Wireframes)</h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Conexión Local Plug &amp; Play</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { title: 'Térmica 80mm', sub: 'Corte automático ESC/POS' },
                  { title: 'Lector Óptico QR', sub: 'Lectura 2D + Code 128' },
                  { title: 'Gaveta RJ11', sub: 'Apertura electrónica' },
                  { title: 'Integración POS', sub: 'Débito / Crédito / Prepago' },
                  { title: 'Respaldo UPS', sub: 'Autonomía + IndexedDB' },
                ].map((hw) => (
                  <div key={hw.title} className="bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-3 text-center space-y-2.5 hover:-translate-y-0.5 transition-transform">
                    <div className="h-20 rounded-xl border-dashed border-2 border-[#dde2e8] bg-[#f8fafc] flex items-center justify-center">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.06em] text-slate-400">[HW SLOT]</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">{hw.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono leading-tight">{hw.sub}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="border-b border-[#e8ecf0] pb-3">
                <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">Arquitectura de la Plataforma</div>
                <h2 className="text-base font-extrabold tracking-tight text-slate-900 mt-0.5">Capturas &amp; Mockups de Módulos</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { slot: '[ Slot: Captura POS Garita ]', sub: 'Ingreso por patente en 4 seg', title: 'Punto de Venta Garita', desc: 'Formulario limpio con teclado rápido y cálculo de tarifa por minuto en tiempo real.', target: 'pos' },
                  { slot: '[ Slot: Dashboard de Rendimiento ]', sub: 'Analítica global del establecimiento', title: 'Analítica & Rendimiento', desc: 'Comparativas por día, franjas horarias efectivas, matriz de 30 plazas y rentabilidad RevPAS.', target: 'map' },
                  { slot: '[ Slot: Arqueo Ciego & Corte Z ]', sub: 'Conciliación de caja garantizada', title: 'Arqueos & Cuadraturas', desc: 'Reportes sin descuadre por jornada con desglose en efectivo, débito, transferencia y firma SHA-256.', target: 'reports' },
                ].map((m) => (
                  <div key={m.title} onClick={() => navigateTo(m.target)} className="bg-white border border-[#e8ecf0] border-l-2 border-l-transparent hover:border-l-emerald-500 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-4 space-y-3 cursor-pointer group transition-all">
                    <div className="h-36 rounded-xl border-dashed border-2 border-[#dde2e8] bg-[#f8fafc] flex flex-col items-center justify-center p-3 text-center group-hover:border-emerald-300 group-hover:bg-emerald-50/40 transition-colors">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-[0.06em] text-slate-400 group-hover:text-emerald-600 transition-colors">{m.slot}</span>
                      <span className="text-[10px] text-slate-400 mt-1">{m.sub}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{m.title}</h3>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <footer className="pt-5 border-t border-[#e8ecf0] flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="text-[11px] font-mono text-slate-400">ParkOps POS · v4.0.0 Enterprise — Cordano Inversiones (Serrano 447, Iquique)</div>
              <div className="flex items-center gap-5 text-[11px] font-mono text-slate-400">
                <span>Cloud Run: cordano-pms-v1</span>
                <button onClick={scrollToTopOfViews} className="hover:text-slate-700 transition-colors font-bold">↑ Volver Arriba</button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {activeView === 'menu' && (
        <div id="view-menu" className="min-h-screen bg-[#f4f6f9] p-6 md:p-8 animate-fade-in-up">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-5">
                <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">Ocupación Actual</div>
                <div className="mt-2 flex items-baseline gap-1.5 font-mono tabular-nums">
                  <span id="menu-kpi-occupied" className="text-3xl font-extrabold tracking-tight text-slate-900">{occupiedCount}</span>
                  <span className="text-sm font-bold text-slate-400">/ 30 Plazas</span>
                </div>
                <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div id="menu-kpi-bar" className="h-full bg-slate-900 rounded-full transition-all duration-500" style={{ width: `${occupancyPct}%` }} />
                </div>
                <div className="mt-1.5 text-[10px] font-mono tabular-nums text-slate-400">{occupancyPct}% de capacidad</div>
              </div>
              <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-5">
                <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">Recaudación Turno</div>
                <div className="mt-2 text-3xl font-extrabold font-mono tabular-nums tracking-tight text-emerald-600">${shiftRevenue.toLocaleString('es-CL')}</div>
                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-mono font-bold text-emerald-600">48 vehículos atendidos hoy</span>
                </div>
              </div>
              <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-5">
                <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">Fondo Inicial Garita</div>
                <div className="mt-2 text-3xl font-extrabold font-mono tabular-nums tracking-tight text-slate-800">${initialFloat.toLocaleString('es-CL')}</div>
                <div className="mt-1.5 text-[10px] font-mono text-slate-400">Sencillo validado en apertura</div>
              </div>
              <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-5">
                <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">Abonados en Patio</div>
                <div className="mt-2 text-3xl font-extrabold font-mono tabular-nums tracking-tight text-slate-800">4 / 6</div>
                <div className="mt-1.5 text-[10px] font-mono text-slate-400">Convenios mensuales en paralelo</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              <div className="md:col-span-8 space-y-4">
                <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white shadow-[0_4px_24px_rgba(0,0,0,0.18)] relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.8)_0%,_transparent_60%)]" />
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] border border-white/10 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-pulse" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-emerald-400">Módulo Operativo Principal</span>
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-slate-400">{occupiedCount} Ocupados · {Math.max(0, 28 - occupiedCount)} Libres · 2 Bloqueados</span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-none">Punto de Venta Garita (POS)</h3>
                      <p className="text-sm text-slate-400 max-w-lg leading-relaxed">Centro de operaciones en Serrano 447 para registrar ingresos de vehículos, liquidar cobros por tiempo de estadía, emitir comprobantes DTE / 80mm y visualizar el historial del turno.</p>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-1">
                      <button onClick={() => openPosInSubtab('entry')} className="py-3 px-7 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-3 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0">
                        <span>+ Registrar Nuevo Ingreso (POS)</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-emerald-700/60 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-200">F2</kbd>
                      </button>
                      <button onClick={() => navigateTo('settings')} className="py-3 px-5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-slate-300 text-xs font-mono font-bold flex items-center gap-2 transition-all">
                        <span>Ajustes &amp; Modo Offline</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-mono font-bold text-slate-400">F5</kbd>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div onClick={() => navigateTo('map')} className="bg-white border border-[#e8ecf0] border-l-2 border-l-transparent hover:border-l-emerald-500 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-5 cursor-pointer group transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#f1f5f9]">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-pulse" />
                        <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Plano &amp; Analítica Global</span>
                      </div>
                      <span className="text-slate-400 group-hover:text-emerald-500 transition-colors text-base">→</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">Rendimiento del recinto: análisis por franjas, matriz de 30 plazas Serrano 447 y métricas RevPAS.</p>
                  </div>
                  <div onClick={() => navigateTo('reports')} className="bg-white border border-[#e8ecf0] border-l-2 border-l-transparent hover:border-l-slate-400 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-5 cursor-pointer group transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#f1f5f9]">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-slate-700 transition-colors">Reportes &amp; Auditoría PIN</span>
                      <span className="text-slate-400 group-hover:text-slate-600 transition-colors text-base">→</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">Cortes de caja Z, arqueos ciegos con firma SHA-256 y bitácora antifraude (Verde/Rojo).</p>
                  </div>
                  <div onClick={() => navigateTo('clients')} className="bg-white border border-[#e8ecf0] border-l-2 border-l-transparent hover:border-l-slate-400 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-5 cursor-pointer group transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#f1f5f9]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-slate-700 transition-colors">Abonados &amp; Convenios</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#f1f5f9] border border-[#c1c9d4] text-[10px] font-mono font-bold text-slate-500">F3</kbd>
                      </div>
                      <span className="text-slate-400 group-hover:text-slate-600 transition-colors text-base">→</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">Submódulo paralelo de convenios corporativos mensuales y servicio Noche (bloqueo de plaza independiente).</p>
                  </div>
                  <div onClick={() => navigateTo('support')} className="bg-white border border-[#e8ecf0] border-l-2 border-l-transparent hover:border-l-blue-400 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-5 cursor-pointer group transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#f1f5f9]">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Centro de Ayuda &amp; SOPs</span>
                      <span className="text-slate-400 group-hover:text-blue-500 transition-colors text-base">→</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">Manuales operativos, protocolo de contingencia offline (-O), showroom interactivo y soporte TI.</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 bg-white border border-[#e8ecf0] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-5 space-y-5">
                {checklistSnoozeSec && checklistSnoozeSec > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-center">
                    <span className="text-[11px] font-mono font-bold text-amber-800 block">SNOOZE ACTIVO</span>
                    <span className="text-xl font-black font-mono text-amber-600 tabular-nums">
                      {Math.floor(checklistSnoozeSec / 60).toString().padStart(2, '0')}:
                      {(checklistSnoozeSec % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
                
                <div className="flex items-start justify-between border-b border-[#f1f5f9] pb-3.5">
                  <div>
                    <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">Apertura de Turno</div>
                    <h3 className="text-sm font-extrabold tracking-tight text-slate-900 mt-0.5">Checklist de Calidad</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Supervisión en apertura de turno</p>
                  </div>
                  <span id="checklist-status-badge" className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 tabular-nums shrink-0 mt-0.5">
                    {checkedCount}/{checklistItems.length} REV.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5 tabular-nums">
                    <span>Progreso de Verificación</span>
                    <span id="checklist-percentage" className="font-bold text-slate-700">{checklistPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div id="checklist-progress-bar" className="h-full bg-slate-900 rounded-full transition-all duration-300" style={{ width: `${checklistPct}%` }} />
                  </div>
                </div>

                <div className="space-y-0.5">
                  {checklistLabels.map((item, idx) => (
                    <label key={item.title} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-[#edf0f4]">
                      <input type="checkbox" checked={checklistItems[idx]} onChange={() => toggleChecklistItem(idx)} className="mt-0.5 w-4 h-4 rounded border-[#dde2e8] text-slate-900 focus:ring-0 cursor-pointer accent-slate-900 shrink-0" />
                      <div className="min-w-0">
                        <div className={`text-xs font-bold leading-snug ${checklistItems[idx] ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{item.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                  <button onClick={() => markAllChecklist(true)} className="text-[11px] font-mono font-bold text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-[0.06em]">
                    Marcar todas
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setChecklistSnoozeSec(15 * 60);
                        scrollToTopOfViews();
                      }} 
                      className="px-3 h-9 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold transition-colors shadow-sm"
                    >
                      ⏱ Omitir (15m)
                    </button>
                    <button onClick={signChecklist} className="px-5 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-sm">
                      Firmar Apertura
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <footer className="pt-4 border-t border-[#e8ecf0] flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="text-[11px] font-mono text-slate-400">ParkOps POS · v4.0.0 Enterprise — Cordano Inversiones (Serrano 447, Iquique)</div>
              <div className="flex items-center gap-5 text-[11px] font-mono text-slate-400">
                <span>Cloud Run: cordano-pms-v1</span>
                <button onClick={scrollToTopOfViews} className="hover:text-slate-700 transition-colors font-bold">↑ Volver Arriba</button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
