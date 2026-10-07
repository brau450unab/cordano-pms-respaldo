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
    <div id="view-settings" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e8ecf0] pb-4 gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Configuración del Sistema, Tarifas CLP &amp; Contingencia Offline
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Parámetros operativos de Serrano 447, Iquique (`cordano-pms-v1` en Cloud Run `us-west1`).
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rate Cards */}
          <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-xs p-6 space-y-4">
            <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-500 border-b border-[#f1f5f9] pb-3">
              Motor de Tarifas por Minuto y Multas (CLP)
            </h3>
            <div className="space-y-3 font-mono tabular-nums">
              <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e8ecf0] flex items-center justify-between">
                <span className="text-[13px] text-slate-600">Auto / Sedán:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rateSedan}
                    onChange={(e) => setRateSedan(parseInt(e.target.value) || 0)}
                    className="w-20 h-9 px-2 rounded-lg border border-[#dde2e8] bg-white text-right font-black text-slate-900 text-sm focus:border-slate-900 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">CLP/min</span>
                </div>
              </div>

              <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e8ecf0] flex items-center justify-between">
                <span className="text-[13px] text-slate-600">Camioneta / SUV:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rateSuv}
                    onChange={(e) => setRateSuv(parseInt(e.target.value) || 0)}
                    className="w-20 h-9 px-2 rounded-lg border border-[#dde2e8] bg-white text-right font-black text-slate-900 text-sm focus:border-slate-900 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">CLP/min</span>
                </div>
              </div>

              <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e8ecf0] flex items-center justify-between">
                <span className="text-[13px] text-slate-600">Motocicleta:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rateMoto}
                    onChange={(e) => setRateMoto(parseInt(e.target.value) || 0)}
                    className="w-20 h-9 px-2 rounded-lg border border-[#dde2e8] bg-white text-right font-black text-slate-900 text-sm focus:border-slate-900 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">CLP/min</span>
                </div>
              </div>

              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between">
                <span className="text-[12px] text-rose-800 font-bold">
                  Recargo Ticket Extraviado (Leyenda Legal):
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={lostTicketFee}
                    onChange={(e) => setLostTicketFee(parseInt(e.target.value) || 0)}
                    className="w-24 h-9 px-2 rounded-lg border border-rose-300 bg-white text-right font-black text-rose-800 text-sm focus:border-rose-900 focus:outline-none"
                  />
                  <span className="text-xs text-rose-800 font-bold">CLP</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Guardar Tarifario Operativo
              </button>
            </div>
          </div>

          {/* Offline Toggle Card */}
          <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-xs p-6 space-y-4">
            <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-500 border-b border-[#f1f5f9] pb-3">
              Resiliencia Offline-First (IndexedDB + Sufijo -O)
            </h3>
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Al activarse la contingencia offline, los tickets emitidos añaden el sufijo obligatorio{' '}
              <strong>O</strong> (`TKT-AAAAMMDD-T01-XXXXO`) y se encolan localmente hasta sincronizar con Cloud Run.
            </p>

            <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#e8ecf0]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500 live-pulse' : 'bg-emerald-500'}`} />
                    <span className="text-[13px] font-bold text-slate-900">
                      {isOffline ? 'CONTINGENCIA OFFLINE (-O)' : 'ONLINE (CLOUD RUN)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
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
                        : 'Conexión con Cloud Run restablecida.',
                      !isOffline ? 'error' : 'success'
                    );
                  }}
                  className={`px-4 h-10 rounded-xl text-xs font-bold text-white transition-colors shrink-0 cursor-pointer ${
                    isOffline ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  {isOffline ? 'Reconectar Cloud Run' : 'Simular Modo Offline (-O)'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Magnific AI Presets */}
        <div className="bg-white border border-[#e8ecf0] rounded-2xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
            <div>
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-500">
                Magnific AI / Freepik API — Presets de Super-Resolución &amp; Relighting
              </h3>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Parámetros calibrados para los Wireframes de la plataforma sin alterar el Core Funcional.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#f4f6f9] text-slate-600 border border-[#e8ecf0] shrink-0">
              POST /v1/ai/image-upscaler
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: 'Preset A: UI Dashboard (Faithful)',
                params: 'Creativity: 0 | HDR: 10 | Resemblance: 95 | Fractality: 0',
                prompt:
                  'Ultra-sharp enterprise UI dashboard, crisp vector icons, perfectly legible monospace numbers, 8k resolution.',
              },
              {
                name: 'Preset B: Serrano 447 (Architecture)',
                params: 'Creativity: +3 | HDR: 45 | Resemblance: 75 | Fractality: 35',
                prompt:
                  'Architectural aerial view of parking lot in Iquique Chile, 30 stalls marked A-01 to B-30, sunny coastal daylight.',
              },
              {
                name: 'Preset C: CCTV LPR (Photographic)',
                params: 'Creativity: +2 | HDR: 30 | Resemblance: 80 | Fractality: 20',
                prompt:
                  'Security CCTV camera angle of a car entering parking booth, crisp Chilean license plate visible, timestamp overlay.',
              },
            ].map((preset) => (
              <div key={preset.name} className="p-4 rounded-xl bg-[#f8fafc] border border-[#e8ecf0] space-y-2.5">
                <div className="text-[12px] font-bold text-slate-800">{preset.name}</div>
                <code className="block text-[11px] text-emerald-700 font-mono bg-white border border-[#e8ecf0] rounded-lg px-2.5 py-1.5 leading-relaxed">
                  {preset.params}
                </code>
                <p className="text-[11px] text-slate-500 leading-relaxed">{preset.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};
