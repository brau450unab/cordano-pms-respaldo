import React, { useState } from 'react';
import { AppScreen } from '../../types';
import { useParking } from '../../context/ParkingContext';

interface LandingViewProps {
  onNavigate: (screen: AppScreen) => void;
  shiftTimer: string;
  onInitiateCashClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  shiftTimer,
  onInitiateCashClose,
  onShowToast,
}) => {
  const { user, currentShift, isLoggedIn, setIsLoggedIn, setUserRole } = useParking();

  const [loginRole, setLoginRole] = useState<'OPERADOR' | 'ADMIN'>('OPERADOR');
  const [loginUser, setLoginUser] = useState('jperez@garita.local');
  const [loginPass, setLoginPass] = useState('••••••••');
  const [loginFloat, setLoginFloat] = useState('50000');

  const handleStartShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginRole === 'ADMIN') {
      onShowToast(
        'Regla de Segregación #7: El rol Administrador audita y configura, pero NO puede abrir turnos de caja directamente. Seleccione perfil Operador.',
        'error'
      );
      return;
    }
    const floatNum = parseInt(loginFloat) || 50000;
    if (floatNum <= 0) {
      onShowToast('Debe declarar el fondo inicial de sencillo en gaveta.', 'error');
      return;
    }

    setUserRole('operador');
    setIsLoggedIn(true);
    onShowToast(`Turno iniciado en GARITA 01 con fondo inicial de $${floatNum.toLocaleString('es-CL')}.`, 'success');
    onNavigate('menu');
  };

  return (
    <div id="view-landing" className="min-h-screen bg-[#f4f6f9] p-4 sm:p-6 lg:p-8 animate-fade-in-up">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* ── TOP HERO SECTION ── */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2">
          {/* Left Column */}
          <div className="md:col-span-7 space-y-5">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#e8ecf0] shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-500">
                Sistema de Gestión Operativa en Garita · Serrano 447, Iquique
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-[2.25rem] font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Plataforma de Control de Estacionamiento &amp; Recaudación Presencial
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                Control de ingresos y salidas en recinto Serrano 447 (~700 m², 30 plazas: Sector A 01–15, Sector B 16–30).
                Emisión inmediata de comprobante térmico de 80mm con identificación dual (QR + Code 128) y cuadratura ciega de turno con sello SHA-256.
              </p>
            </div>

            {/* SLOT WIREFRAME: Banner principal / Foto recinto */}
            <div className="w-full h-52 rounded-2xl border-dashed border-2 border-[#dde2e8] bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center group hover:border-slate-400 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#e8ecf0] shadow-xs flex items-center justify-center text-slate-400 mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-500">
                [ Slot Wireframe: Banner Principal / Fotografía de la Garita Serrano 447 ]
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 max-w-sm">
                Espacio reservado para fotografía del computador presencial, impresora térmica 80mm y acceso vehicular del patio.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Ergonomía F1–F9', sub: 'Operación asistida por atajos de teclado globales' },
                { label: 'DTE SII & Dual 80mm', sub: 'QR + Code 128 con contingencia offline (-O)' },
                { label: 'Arqueo Ciego SHA-256', sub: 'Cierre sin sesgos y bitácora con PIN antifraude' },
              ].map((f) => (
                <div key={f.label} className="bg-white border border-[#e8ecf0] rounded-2xl shadow-xs p-3.5">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{f.label}</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">{f.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Dynamic Session Card */}
          <div className="md:col-span-5">
            {isLoggedIn ? (
              /* ACTIVE SHIFT CARD */
              <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 live-pulse" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-500">
                      Sesión de Turno Activa
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    GARITA 01
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-xl border border-[#e8ecf0]">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 tracking-tight">
                    JP
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-400">Operador en Turno Diurno · Serrano 447</div>
                  </div>
                  <div className="ml-auto text-right shrink-0">
                    <div className="text-sm font-mono font-bold tabular-nums text-slate-900">
                      {shiftTimer}
                    </div>
                    <div className="text-[10px] font-mono tabular-nums text-slate-400">
                      Fondo: ${(currentShift.initialCash || 50000).toLocaleString('es-CL')}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={() => onNavigate('menu')}
                    data-shortcut="Atajo: F1"
                    className="shortcut-tooltip w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <span>Ir al Menú Principal</span>
                  </button>
                  <button
                    onClick={() => onNavigate('pos')}
                    data-shortcut="Atajo: F2"
                    className="shortcut-tooltip w-full h-11 rounded-xl bg-white hover:bg-[#f8fafc] border border-[#dde2e8] text-slate-800 text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>Volver al Punto de Venta (POS)</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Cloud Run us-west1 Conectado
                  </span>
                  <button
                    onClick={onInitiateCashClose}
                    className="text-rose-600 hover:text-rose-700 text-xs font-bold font-mono transition-colors cursor-pointer"
                  >
                    Cerrar Turno &amp; Sesión
                  </button>
                </div>
              </div>
            ) : (
              /* LOGIN & APERTURA FORM */
              <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-sm p-6 space-y-5">
                <div className="border-b border-[#f1f5f9] pb-4">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-500 mb-1">
                    Acceso a Garita
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Ingrese credenciales y declare fondo inicial (Regla #7: Administradores no abren caja).
                  </p>
                </div>

                <form onSubmit={handleStartShift} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400 mb-2">
                      Rol de Sesión
                    </label>
                    <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
                      <button
                        type="button"
                        onClick={() => setLoginRole('OPERADOR')}
                        className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          loginRole === 'OPERADOR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Operador de Garita
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginRole('ADMIN')}
                        className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          loginRole === 'ADMIN' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Administrador
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400 mb-1.5">
                      Operador / Correo
                    </label>
                    <input
                      type="text"
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      className="w-full h-10 px-3 bg-[#f8fafc] border-[1.5px] border-[#dde2e8] rounded-[10px] text-sm font-mono text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400 mb-1.5">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      className="w-full h-10 px-3 bg-[#f8fafc] border-[1.5px] border-[#dde2e8] rounded-[10px] text-sm font-mono text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400 mb-1.5">
                      Fondo Inicial de Sencillo (CLP) *
                    </label>
                    <input
                      type="number"
                      value={loginFloat}
                      onChange={(e) => setLoginFloat(e.target.value)}
                      className="w-full h-10 px-3 bg-[#f8fafc] border-[1.5px] border-[#dde2e8] rounded-[10px] text-sm font-mono font-bold tabular-nums text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Iniciar Turno y Abrir Sistema
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* ── HARDWARE & DEVICES SECTION ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#e8ecf0] pb-3">
            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">
                Infraestructura de Garita
              </div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 mt-0.5">
                Hardware &amp; Dispositivos de Garita (Wireframes)
              </h2>
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
              <div
                key={hw.title}
                className="bg-white border border-[#e8ecf0] rounded-2xl shadow-xs p-3 text-center space-y-2.5 hover:-translate-y-0.5 transition-transform"
              >
                <div className="h-20 rounded-xl border-dashed border-2 border-[#dde2e8] bg-[#f8fafc] flex items-center justify-center">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.06em] text-slate-400">
                    [HW SLOT]
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900">{hw.title}</div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">{hw.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PLATFORM MODULE PREVIEWS ── */}
        <section className="space-y-4">
          <div className="border-b border-[#e8ecf0] pb-3">
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-400">
              Arquitectura de la Plataforma
            </div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 mt-0.5">
              Capturas &amp; Mockups de Módulos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                slot: '[ Slot: Captura POS Garita ]',
                sub: 'Ingreso por patente en 4 seg',
                title: 'Punto de Venta Garita',
                desc: 'Formulario limpio con teclado rápido y cálculo de tarifa por minuto en tiempo real.',
                target: 'pos' as AppScreen,
              },
              {
                slot: '[ Slot: Dashboard de Rendimiento ]',
                sub: 'Analítica global del establecimiento',
                title: 'Analítica & Rendimiento',
                desc: 'Comparativas por día, franjas horarias efectivas, matriz de 30 plazas y rentabilidad RevPAS.',
                target: 'map' as AppScreen,
              },
              {
                slot: '[ Slot: Arqueo Ciego & Corte Z ]',
                sub: 'Conciliación de caja garantizada',
                title: 'Arqueos & Cuadraturas',
                desc: 'Reportes sin descuadre por jornada con desglose en efectivo, débito, transferencia y firma SHA-256.',
                target: 'reports' as AppScreen,
              },
            ].map((m) => (
              <div
                key={m.title}
                onClick={() => onNavigate(m.target)}
                className="bg-white border border-[#e8ecf0] border-l-2 border-l-transparent hover:border-l-emerald-500 rounded-2xl shadow-xs p-4 space-y-3 cursor-pointer group transition-all"
              >
                <div className="h-36 rounded-xl border-dashed border-2 border-[#dde2e8] bg-[#f8fafc] flex flex-col items-center justify-center p-3 text-center group-hover:border-emerald-300 group-hover:bg-emerald-50/40 transition-colors">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-[0.06em] text-slate-400 group-hover:text-emerald-600 transition-colors">
                    {m.slot}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">{m.sub}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="pt-5 border-t border-[#e8ecf0] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
          <div>ParkOps POS · v4.0.0 Enterprise — Cordano Inversiones (Serrano 447, Iquique)</div>
          <div>Cloud Run: cordano-pms-v1 (us-west1)</div>
        </footer>
      </div>
    </div>
  );
};
