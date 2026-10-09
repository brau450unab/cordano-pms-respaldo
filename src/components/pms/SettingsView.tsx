import React, { useState } from 'react';
import { useParking } from '../../context/ParkingContext';

interface SettingsViewProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onShowToast }) => {
  const { tariffConfig, updateTariffConfig, isOffline, setIsOffline } = useParking();

  const [rateSedan, setRateSedan] = useState(tariffConfig.vehicleRates['Automóvil']?.minuteRate || 25);
  const [rateSuv, setRateSuv] = useState(tariffConfig.vehicleRates['Camioneta']?.minuteRate || 30);
  const [rateMoto, setRateMoto] = useState(tariffConfig.vehicleRates['Motocicleta']?.minuteRate || 15);
  const [gracePeriod, setGracePeriod] = useState(tariffConfig.gracePeriodMinutes ?? 0);
  const [lostTicketFee, setLostTicketFee] = useState(8000);
  const [subscriptionPlans, setSubscriptionPlans] = useState(tariffConfig.subscriptionPlans || []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTariffConfig({
      ...tariffConfig,
      gracePeriodMinutes: gracePeriod,
      lostTicketFee: lostTicketFee,
      subscriptionPlans: subscriptionPlans,
      vehicleRates: {
        'Automóvil': { minuteRate: rateSedan, hourlyRate: rateSedan * 60, maxDailyRate: 15000 },
        'Camioneta': { minuteRate: rateSuv, hourlyRate: rateSuv * 60, maxDailyRate: 18000 },
        'Motocicleta': { minuteRate: rateMoto, hourlyRate: rateMoto * 60, maxDailyRate: 8000 },
        'Furgón / SUV': { minuteRate: rateSuv, hourlyRate: rateSuv * 60, maxDailyRate: 18000 },
      },
    });
    onShowToast('Parámetros de tarifario y garita guardados correctamente.', 'success');
  };

  return (
    <div id="view-settings" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-[#1E1E2F] animate-fade-in-up">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2E8F0] pb-4 gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1E2F]">
            Configuración del Sistema &amp; Tarifas CLP
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Parámetros operativos de Serrano 447, Iquique (La Plataforma `us-west1`).
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rate Cards */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-6 space-y-4">
            <h3 className="text-xs tabular-nums font-bold uppercase tracking-wider text-[#1E1E2F] border-b border-[#F8FAFC] pb-3">
              Motor de Tarifas por Minuto y Multas (CLP)
            </h3>
            <div className="space-y-3 tabular-nums tabular-nums">
              <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs text-[#64748B] font-sans font-bold">Auto / Sedán:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rateSedan}
                    onChange={(e) => setRateSedan(parseInt(e.target.value) || 0)}
                    className="w-20 h-9 px-2 rounded-lg border border-[#E2E8F0] bg-white text-right font-black text-[#1E1E2F] text-sm focus:border-[#E2498A] focus:outline-none"
                  />
                  <span className="text-xs text-[#64748B]">CLP/min</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs text-[#64748B] font-sans font-bold">Camioneta / SUV:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rateSuv}
                    onChange={(e) => setRateSuv(parseInt(e.target.value) || 0)}
                    className="w-20 h-9 px-2 rounded-lg border border-[#E2E8F0] bg-white text-right font-black text-[#1E1E2F] text-sm focus:border-[#E2498A] focus:outline-none"
                  />
                  <span className="text-xs text-[#64748B]">CLP/min</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs text-[#64748B] font-sans font-bold">Motocicleta:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rateMoto}
                    onChange={(e) => setRateMoto(parseInt(e.target.value) || 0)}
                    className="w-20 h-9 px-2 rounded-lg border border-[#E2E8F0] bg-white text-right font-black text-[#1E1E2F] text-sm focus:border-[#E2498A] focus:outline-none"
                  />
                  <span className="text-xs text-[#64748B]">CLP/min</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#FFF5F8] rounded-xl border border-[#E2498A]/30 flex items-center justify-between">
                <span className="text-xs text-[#E2498A] font-bold font-sans">
                  Recargo Ticket Extraviado:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={lostTicketFee}
                    onChange={(e) => setLostTicketFee(parseInt(e.target.value) || 0)}
                    className="w-24 h-9 px-2 rounded-lg border border-[#E2498A]/40 bg-white text-right font-black text-[#E2498A] text-sm focus:border-[#E2498A] focus:outline-none"
                  />
                  <span className="text-xs text-[#E2498A] font-bold">CLP</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#E2498A] hover:bg-[#E2498A] text-white font-extrabold text-xs shadow-[0_2px_10px_rgba(226,73,138,0.35)] transition-all cursor-pointer active:scale-[0.98]"
              >
                Guardar Tarifario Operativo
              </button>
            </div>
          </div>

          {/* Offline Toggle Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-6 space-y-4">
            <h3 className="text-xs tabular-nums font-bold uppercase tracking-wider text-[#1E1E2F] border-b border-[#F8FAFC] pb-3">
              Resiliencia Offline-First (IndexedDB + Sufijo -O)
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Al activarse la contingencia offline, los tickets emitidos añaden el sufijo obligatorio{' '}
              <strong>O</strong> (`TKT-AAAAMMDD-T01-XXXXO`) y se encolan localmente hasta sincronizar con La Plataforma.
            </p>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${isOffline ? 'bg-amber-500 animate-pulse' : 'bg-[#E2498A]'}`} />
                    <span className="text-xs font-bold text-[#1E1E2F]">
                      {isOffline ? 'CONTINGENCIA OFFLINE (-O)' : 'ONLINE (EN LÍNEA)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748B] tabular-nums">
                    Servicio: cordano-pms-v1 (us-west1)
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOffline(!isOffline);
                    onShowToast(
                      !isOffline
                        ? 'Modo Contingencia Offline (-O) activado. Persistencia local encolada.'
                        : 'Conexión con La Plataforma restablecida.',
                      !isOffline ? 'error' : 'success'
                    );
                  }}
                  className={`px-4 h-10 rounded-full text-xs font-bold text-white transition-all shrink-0 cursor-pointer ${
                    isOffline ? 'bg-[#E2498A] hover:bg-[#C83472]' : 'bg-[#1E1E2F] hover:bg-[#2D2D44]'
                  }`}
                >
                  {isOffline ? 'Reconectar La Plataforma' : 'Simular Modo Offline (-O)'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Planes y Suscripciones Publicas */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-6 space-y-4 col-span-1 lg:col-span-2">
            <h3 className="text-xs tabular-nums font-bold uppercase tracking-wider text-[#1E1E2F] border-b border-[#F8FAFC] pb-3 flex justify-between items-center">
              <span>Planes de Suscripción Públicos (Landing Page)</span>
              <button type="button" onClick={() => {
                setSubscriptionPlans([...subscriptionPlans, { id: 'nuevo', title: 'Nuevo Plan', price: '$0', desc: 'Descripción' }]);
              }} className="text-[#E2498A] hover:underline cursor-pointer lowercase">+ Añadir Plan</button>
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Configura los planes y precios que se muestran públicamente en la Landing Page para la captación de convenios.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {subscriptionPlans.map((plan, idx) => (
                <div key={idx} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3 relative group">
                  <button type="button" onClick={() => setSubscriptionPlans(subscriptionPlans.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    ✕
                  </button>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">ID Interno</label>
                    <input type="text" value={plan.id} onChange={(e) => {
                      const newPlans = [...subscriptionPlans];
                      newPlans[idx].id = e.target.value;
                      setSubscriptionPlans(newPlans);
                    }} className="w-full h-8 px-2 rounded border border-[#E2E8F0] text-sm font-medium focus:border-[#E2498A] focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Título Público</label>
                    <input type="text" value={plan.title} onChange={(e) => {
                      const newPlans = [...subscriptionPlans];
                      newPlans[idx].title = e.target.value;
                      setSubscriptionPlans(newPlans);
                    }} className="w-full h-8 px-2 rounded border border-[#E2E8F0] text-sm font-bold text-[#1E1E2F] focus:border-[#E2498A] focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Precio Display</label>
                    <input type="text" value={plan.price} onChange={(e) => {
                      const newPlans = [...subscriptionPlans];
                      newPlans[idx].price = e.target.value;
                      setSubscriptionPlans(newPlans);
                    }} className="w-full h-8 px-2 rounded border border-[#E2E8F0] text-sm font-bold text-[#E2498A] focus:border-[#E2498A] focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Breve Descripción</label>
                    <input type="text" value={plan.desc} onChange={(e) => {
                      const newPlans = [...subscriptionPlans];
                      newPlans[idx].desc = e.target.value;
                      setSubscriptionPlans(newPlans);
                    }} className="w-full h-8 px-2 rounded border border-[#E2E8F0] text-xs focus:border-[#E2498A] focus:outline-none" />
                  </div>
                </div>
              ))}
            </div>
        </div>

          {/* User Management Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-6 space-y-4">
            <h3 className="text-xs tabular-nums font-bold uppercase tracking-wider text-[#1E1E2F] border-b border-[#F8FAFC] pb-3">
              Gestión de Usuarios y Roles (RBAC)
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Administra los accesos al sistema. Los operadores tienen acceso exclusivo al POS y control de patio. Los administradores tienen acceso global.
            </p>
            
            <div className="space-y-3">
              {/* Mock User 1 */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E2498A] text-white flex items-center justify-center font-bold text-xs">JP</div>
                  <div>
                    <div className="text-sm font-bold text-[#1E1E2F]">Juan Pérez</div>
                    <div className="text-[10px] tabular-nums text-[#64748B]">admin@cordano.cl</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold text-[#E2498A] bg-[#FFF5F8] px-2 py-0.5 rounded-md">Administrador</span>
                  <button type="button" className="text-[10px] font-bold text-[#64748B] hover:text-[#1E1E2F] underline cursor-pointer">Editar Permisos</button>
                </div>
              </div>

              {/* Mock User 2 */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E2498A] text-white flex items-center justify-center font-bold text-xs">MG</div>
                  <div>
                    <div className="text-sm font-bold text-[#1E1E2F]">María González</div>
                    <div className="text-[10px] tabular-nums text-[#64748B]">operador01</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold text-[#E2498A] bg-[#FFF5F8] px-2 py-0.5 rounded-md">Operador Garita</span>
                  <button type="button" className="text-[10px] font-bold text-[#64748B] hover:text-[#1E1E2F] underline cursor-pointer">Editar Permisos</button>
                </div>
              </div>
            </div>

            <button type="button" className="w-full py-2.5 mt-2 rounded-xl border border-[#E2E8F0] bg-white text-[#1E1E2F] font-bold text-xs shadow-sm hover:bg-[#F8FAFC] transition cursor-pointer">
              + Añadir Nuevo Usuario
            </button>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-6 space-y-4">
            <h3 className="text-xs tabular-nums font-bold uppercase tracking-wider text-[#1E1E2F] border-b border-[#F8FAFC] pb-3">
              Auditoría y Seguridad
            </h3>
            
            <div className="space-y-4 mt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 text-[#E2498A] focus:ring-[#E2498A] rounded" />
                <div>
                  <div className="text-sm font-bold text-[#1E1E2F]">Requerir PIN para Descuentos</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">Solicita validación de Administrador o Supervisor para aplicar descuentos superiores al 10%.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 text-[#E2498A] focus:ring-[#E2498A] rounded" />
                <div>
                  <div className="text-sm font-bold text-[#1E1E2F]">Bloqueo de Cierre Ciego Incompleto</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">Impide cerrar el turno si hay vehículos transitorios dentro de la matriz sin ticket liquidado.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 text-[#E2498A] focus:ring-[#E2498A] rounded" />
                <div>
                  <div className="text-sm font-bold text-[#1E1E2F]">Forzar Modo Offline Estricto</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">Mantiene el sistema funcionando 100% local aunque haya micro-cortes, sincronizando en lote.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Third Row: Appearance and Hardware */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Theme & Appearance Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-6 space-y-4">
            <h3 className="text-xs tabular-nums font-bold uppercase tracking-wider text-[#1E1E2F] border-b border-[#F8FAFC] pb-3">
              Apariencia del Sistema
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
              Personaliza la visualización de la plataforma. (Los cambios se aplicarán globalmente tras guardar).
            </p>
            
            <div>
              <label className="block text-xs font-bold text-[#1E1E2F] mb-1.5">Tema Principal</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#1E1E2F] focus:outline-none focus:border-[#E2498A]">
                <option value="light">Modo Claro (Por defecto)</option>
                <option value="dark">Modo Oscuro (Garita nocturna)</option>
                <option value="system">Sincronizar con el Sistema</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[#1E1E2F] mb-1.5">Densidad de la Interfaz</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#1E1E2F] focus:outline-none focus:border-[#E2498A]">
                <option value="compact">Compacta (Ideal para monitores 1080p en Garita)</option>
                <option value="spacious">Espaciosa (Ideal para tablets o táctil)</option>
              </select>
            </div>
          </div>

          {/* Hardware & POS Settings Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-6 space-y-4">
            <h3 className="text-xs tabular-nums font-bold uppercase tracking-wider text-[#1E1E2F] border-b border-[#F8FAFC] pb-3">
              Hardware y Emisión de Tickets
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
              Configuración de la impresora térmica conectada al equipo de punto de venta.
            </p>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#1E1E2F] mb-1.5">Formato Impresora</label>
                <select className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#1E1E2F] focus:outline-none focus:border-[#E2498A]">
                  <option value="80mm">Rollo 80mm (Estándar)</option>
                  <option value="58mm">Rollo 58mm (Compacto)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#1E1E2F] mb-1.5">Conexión</label>
                <select className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#1E1E2F] focus:outline-none focus:border-[#E2498A]">
                  <option value="usb">USB Directo (WebUSB)</option>
                  <option value="network">Red (LAN / Wi-Fi)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 text-[#E2498A] focus:ring-[#E2498A] rounded" />
                <div>
                  <div className="text-sm font-bold text-[#1E1E2F]">Imprimir Código QR en Ticket</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">Genera un QR escaneable por lectores 2D en el extremo inferior del comprobante.</div>
                </div>
              </label>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[#1E1E2F] mb-1.5 mt-2">Mensaje Pie de Página</label>
              <textarea 
                className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#1E1E2F] focus:outline-none focus:border-[#E2498A] resize-none" 
                rows={2}
                defaultValue="Conserve este ticket. En caso de pérdida se cobrará una multa de $8.000 CLP conforme a la ley vigente."
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white font-extrabold text-sm tracking-tight shadow-sm transition active:scale-95 cursor-pointer"
          >
            Guardar Configuraciones
          </button>
        </div>
      </form>
    </div>
  );
};
