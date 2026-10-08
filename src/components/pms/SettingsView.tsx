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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTariffConfig({
      ...tariffConfig,
      gracePeriodMinutes: gracePeriod,
      lostTicketFee: lostTicketFee,
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
    <div id="view-settings" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-[#2C1338] animate-fade-in-up">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EDE4E2] pb-4 gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2C1338]">
            Configuración del Sistema &amp; Tarifas CLP
          </h2>
          <p className="text-xs sm:text-sm text-[#65546C] mt-0.5">
            Parámetros operativos de Serrano 447, Iquique (La Plataforma `us-west1`).
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rate Cards */}
          <div className="bg-white border border-[#EDE4E2] rounded-2xl shadow-xs p-6 space-y-4">
            <h3 className="text-xs tabular-nums font-bold uppercase tracking-wider text-[#2C1338] border-b border-[#F7EFE9] pb-3">
              Motor de Tarifas por Minuto y Multas (CLP)
            </h3>
            <div className="space-y-3 tabular-nums tabular-nums">
              <div className="p-3.5 bg-[#FEF9F5] rounded-xl border border-[#EDE4E2] flex items-center justify-between">
                <span className="text-xs text-[#65546C] font-sans font-bold">Auto / Sedán:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rateSedan}
                    onChange={(e) => setRateSedan(parseInt(e.target.value) || 0)}
                    className="w-20 h-9 px-2 rounded-lg border border-[#EDE4E2] bg-white text-right font-black text-[#2C1338] text-sm focus:border-[#E2498A] focus:outline-none"
                  />
                  <span className="text-xs text-[#65546C]">CLP/min</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#FEF9F5] rounded-xl border border-[#EDE4E2] flex items-center justify-between">
                <span className="text-xs text-[#65546C] font-sans font-bold">Camioneta / SUV:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rateSuv}
                    onChange={(e) => setRateSuv(parseInt(e.target.value) || 0)}
                    className="w-20 h-9 px-2 rounded-lg border border-[#EDE4E2] bg-white text-right font-black text-[#2C1338] text-sm focus:border-[#E2498A] focus:outline-none"
                  />
                  <span className="text-xs text-[#65546C]">CLP/min</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#FEF9F5] rounded-xl border border-[#EDE4E2] flex items-center justify-between">
                <span className="text-xs text-[#65546C] font-sans font-bold">Motocicleta:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rateMoto}
                    onChange={(e) => setRateMoto(parseInt(e.target.value) || 0)}
                    className="w-20 h-9 px-2 rounded-lg border border-[#EDE4E2] bg-white text-right font-black text-[#2C1338] text-sm focus:border-[#E2498A] focus:outline-none"
                  />
                  <span className="text-xs text-[#65546C]">CLP/min</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#FEE8E8] rounded-xl border border-[#E2498A]/30 flex items-center justify-between">
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
                className="w-full h-11 rounded-xl bg-[#E2498A] hover:bg-[#E57CD8] text-white font-extrabold text-xs shadow-[0_2px_10px_rgba(226,73,138,0.35)] transition-all cursor-pointer active:scale-[0.98]"
              >
                Guardar Tarifario Operativo
              </button>
            </div>
          </div>

          {/* Offline Toggle Card */}
          <div className="bg-white border border-[#EDE4E2] rounded-2xl shadow-xs p-6 space-y-4">
            <h3 className="text-xs tabular-nums font-bold uppercase tracking-wider text-[#2C1338] border-b border-[#F7EFE9] pb-3">
              Resiliencia Offline-First (IndexedDB + Sufijo -O)
            </h3>
            <p className="text-xs text-[#65546C] leading-relaxed">
              Al activarse la contingencia offline, los tickets emitidos añaden el sufijo obligatorio{' '}
              <strong>O</strong> (`TKT-AAAAMMDD-T01-XXXXO`) y se encolan localmente hasta sincronizar con La Plataforma.
            </p>

            <div className="p-4 rounded-xl bg-[#FEF9F5] border border-[#EDE4E2]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${isOffline ? 'bg-amber-500 animate-pulse' : 'bg-[#2B9E78]'}`} />
                    <span className="text-xs font-bold text-[#2C1338]">
                      {isOffline ? 'CONTINGENCIA OFFLINE (-O)' : 'ONLINE (EN LÍNEA)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#65546C] tabular-nums">
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
                    isOffline ? 'bg-[#2B9E78] hover:bg-[#238263]' : 'bg-[#2C1338] hover:bg-[#412A4C]'
                  }`}
                >
                  {isOffline ? 'Reconectar La Plataforma' : 'Simular Modo Offline (-O)'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* User Management Card */}
          <div className="bg-white border border-[#EDE4E2] rounded-2xl shadow-xs p-6 space-y-4">
            <h3 className="text-xs tabular-nums font-bold uppercase tracking-wider text-[#2C1338] border-b border-[#F7EFE9] pb-3">
              Gestión de Usuarios y Roles (RBAC)
            </h3>
            <p className="text-xs text-[#65546C] leading-relaxed">
              Administra los accesos al sistema. Los operadores tienen acceso exclusivo al POS y control de patio. Los administradores tienen acceso global.
            </p>
            
            <div className="space-y-3">
              {/* Mock User 1 */}
              <div className="p-3.5 bg-[#FEF9F5] rounded-xl border border-[#EDE4E2] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E2498A] text-white flex items-center justify-center font-bold text-xs">JP</div>
                  <div>
                    <div className="text-sm font-bold text-[#2C1338]">Juan Pérez</div>
                    <div className="text-[10px] tabular-nums text-[#65546C]">admin@cordano.cl</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold text-[#E2498A] bg-[#FDF1EC] px-2 py-0.5 rounded-md">Administrador</span>
                  <button type="button" className="text-[10px] font-bold text-[#65546C] hover:text-[#2C1338] underline cursor-pointer">Editar Permisos</button>
                </div>
              </div>

              {/* Mock User 2 */}
              <div className="p-3.5 bg-[#FEF9F5] rounded-xl border border-[#EDE4E2] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#2B9E78] text-white flex items-center justify-center font-bold text-xs">MG</div>
                  <div>
                    <div className="text-sm font-bold text-[#2C1338]">María González</div>
                    <div className="text-[10px] tabular-nums text-[#65546C]">operador01</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold text-[#2B9E78] bg-[#E8F8F2] px-2 py-0.5 rounded-md">Operador Garita</span>
                  <button type="button" className="text-[10px] font-bold text-[#65546C] hover:text-[#2C1338] underline cursor-pointer">Editar Permisos</button>
                </div>
              </div>
            </div>

            <button type="button" className="w-full py-2.5 mt-2 rounded-xl border border-[#EDE4E2] bg-white text-[#2C1338] font-bold text-xs shadow-sm hover:bg-[#FEF9F5] transition cursor-pointer">
              + Añadir Nuevo Usuario
            </button>
          </div>

          <div className="bg-white border border-[#EDE4E2] rounded-2xl shadow-xs p-6 space-y-4">
            <h3 className="text-xs tabular-nums font-bold uppercase tracking-wider text-[#2C1338] border-b border-[#F7EFE9] pb-3">
              Auditoría y Seguridad
            </h3>
            
            <div className="space-y-4 mt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 text-[#E2498A] focus:ring-[#E2498A] rounded" />
                <div>
                  <div className="text-sm font-bold text-[#2C1338]">Requerir PIN para Descuentos</div>
                  <div className="text-[11px] text-[#65546C] mt-0.5">Solicita validación de Administrador o Supervisor para aplicar descuentos superiores al 10%.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 text-[#E2498A] focus:ring-[#E2498A] rounded" />
                <div>
                  <div className="text-sm font-bold text-[#2C1338]">Bloqueo de Cierre Ciego Incompleto</div>
                  <div className="text-[11px] text-[#65546C] mt-0.5">Impide cerrar el turno si hay vehículos transitorios dentro de la matriz sin ticket liquidado.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 text-[#E2498A] focus:ring-[#E2498A] rounded" />
                <div>
                  <div className="text-sm font-bold text-[#2C1338]">Forzar Modo Offline Estricto</div>
                  <div className="text-[11px] text-[#65546C] mt-0.5">Mantiene el sistema funcionando 100% local aunque haya micro-cortes, sincronizando en lote.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Third Row: Appearance and Hardware */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Theme & Appearance Card */}
          <div className="bg-white border border-[#EDE4E2] rounded-2xl shadow-xs p-6 space-y-4">
            <h3 className="text-xs tabular-nums font-bold uppercase tracking-wider text-[#2C1338] border-b border-[#F7EFE9] pb-3">
              Apariencia del Sistema
            </h3>
            <p className="text-xs text-[#65546C] leading-relaxed mb-4">
              Personaliza la visualización de la plataforma. (Los cambios se aplicarán globalmente tras guardar).
            </p>
            
            <div>
              <label className="block text-xs font-bold text-[#2C1338] mb-1.5">Tema Principal</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-[#EDE4E2] bg-[#FEF9F5] text-sm text-[#2C1338] focus:outline-none focus:border-[#E2498A]">
                <option value="light">Modo Claro (Por defecto)</option>
                <option value="dark">Modo Oscuro (Garita nocturna)</option>
                <option value="system">Sincronizar con el Sistema</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[#2C1338] mb-1.5">Densidad de la Interfaz</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-[#EDE4E2] bg-[#FEF9F5] text-sm text-[#2C1338] focus:outline-none focus:border-[#E2498A]">
                <option value="compact">Compacta (Ideal para monitores 1080p en Garita)</option>
                <option value="spacious">Espaciosa (Ideal para tablets o táctil)</option>
              </select>
            </div>
          </div>

          {/* Hardware & POS Settings Card */}
          <div className="bg-white border border-[#EDE4E2] rounded-2xl shadow-xs p-6 space-y-4">
            <h3 className="text-xs tabular-nums font-bold uppercase tracking-wider text-[#2C1338] border-b border-[#F7EFE9] pb-3">
              Hardware y Emisión de Tickets
            </h3>
            <p className="text-xs text-[#65546C] leading-relaxed mb-4">
              Configuración de la impresora térmica conectada al equipo de punto de venta.
            </p>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#2C1338] mb-1.5">Formato Impresora</label>
                <select className="w-full px-3 py-2.5 rounded-xl border border-[#EDE4E2] bg-[#FEF9F5] text-sm text-[#2C1338] focus:outline-none focus:border-[#E2498A]">
                  <option value="80mm">Rollo 80mm (Estándar)</option>
                  <option value="58mm">Rollo 58mm (Compacto)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#2C1338] mb-1.5">Conexión</label>
                <select className="w-full px-3 py-2.5 rounded-xl border border-[#EDE4E2] bg-[#FEF9F5] text-sm text-[#2C1338] focus:outline-none focus:border-[#E2498A]">
                  <option value="usb">USB Directo (WebUSB)</option>
                  <option value="network">Red (LAN / Wi-Fi)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 text-[#E2498A] focus:ring-[#E2498A] rounded" />
                <div>
                  <div className="text-sm font-bold text-[#2C1338]">Imprimir Código QR en Ticket</div>
                  <div className="text-[11px] text-[#65546C] mt-0.5">Genera un QR escaneable por lectores 2D en el extremo inferior del comprobante.</div>
                </div>
              </label>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[#2C1338] mb-1.5 mt-2">Mensaje Pie de Página</label>
              <textarea 
                className="w-full px-3 py-2.5 rounded-xl border border-[#EDE4E2] bg-[#FEF9F5] text-sm text-[#2C1338] focus:outline-none focus:border-[#E2498A] resize-none" 
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
            className="px-6 py-3 rounded-xl bg-[#2C1338] hover:bg-[#1E0C25] text-white font-extrabold text-sm tracking-tight shadow-sm transition active:scale-95 cursor-pointer"
          >
            Guardar Configuraciones
          </button>
        </div>
      </form>
    </div>
  );
};
