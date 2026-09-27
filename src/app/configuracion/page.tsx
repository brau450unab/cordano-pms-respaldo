'use client';

import React, { useState } from 'react';
import { MacOSNavigationShell } from '@/components/MacOSNavigationShell';
import { Settings, Printer, Save, CheckCircle2, Wifi } from 'lucide-react';

export default function ConfiguracionPage() {
  const [tarifaMinutoAuto, setTarifaMinutoAuto] = useState(30);
  const [tarifaJornada, setTarifaJornada] = useState(6000);
  const [tarifaPernocta, setTarifaPernocta] = useState(5000);
  const [multaTicketPerdido, setMultaTicketPerdido] = useState(8000);
  const [minutosGracia, setMinutosGracia] = useState(10);

  const [printer80mmConnected, setPrinter80mmConnected] = useState(true);
  const [dualBarcodeEnabled, setDualBarcodeEnabled] = useState(true);
  const [offlineContingencyEnabled, setOfflineContingencyEnabled] = useState(true);

  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <MacOSNavigationShell
      title="Configuración de Sistema"
      subtitle="Parámetros del motor de tarifas CLP e interfaz de impresora térmica 80mm"
      roleLabel="Configuración ERP"
      rightActions={
        <button
          type="button"
          onClick={handleSave}
          className="px-3.5 py-1.5 rounded bg-[#80093A] hover:bg-[#68072f] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Guardar Cambios</span>
        </button>
      }
    >
      <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-5">
        {savedNotice && (
          <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Configuración guardada exitosamente.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Motor de Tarifas */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase text-slate-800 border-b border-slate-200 pb-2">
              Motor de Tarifas CLP
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span>Tarifa por Minuto (Auto / SUV):</span>
                <input
                  type="number"
                  value={tarifaMinutoAuto}
                  onChange={(e) => setTarifaMinutoAuto(Number(e.target.value))}
                  className="w-20 text-right font-mono font-bold border border-slate-300 rounded px-2 py-1"
                />
              </div>

              <div className="flex justify-between items-center">
                <span>Tarifa Plana Jornada (Diurna):</span>
                <input
                  type="number"
                  step={500}
                  value={tarifaJornada}
                  onChange={(e) => setTarifaJornada(Number(e.target.value))}
                  className="w-24 text-right font-mono font-bold border border-slate-300 rounded px-2 py-1"
                />
              </div>

              <div className="flex justify-between items-center">
                <span>Tarifa Pernocta (Nocturna):</span>
                <input
                  type="number"
                  step={500}
                  value={tarifaPernocta}
                  onChange={(e) => setTarifaPernocta(Number(e.target.value))}
                  className="w-24 text-right font-mono font-bold border border-slate-300 rounded px-2 py-1"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-rose-700 font-bold">Multa Ticket Perdido (PIN Admin):</span>
                <input
                  type="number"
                  step={500}
                  value={multaTicketPerdido}
                  onChange={(e) => setMultaTicketPerdido(Number(e.target.value))}
                  className="w-24 text-right font-mono font-bold border border-rose-300 rounded px-2 py-1 text-rose-800"
                />
              </div>

              <div className="flex justify-between items-center">
                <span>Minutos de Gracia (Sin Cobro):</span>
                <input
                  type="number"
                  value={minutosGracia}
                  onChange={(e) => setMinutosGracia(Number(e.target.value))}
                  className="w-16 text-right font-mono font-bold border border-slate-300 rounded px-2 py-1"
                />
              </div>
            </div>
          </div>

          {/* Hardware e Impresión */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase text-slate-800 border-b border-slate-200 pb-2">
              Hardware de Garita &amp; Impresora 80mm
            </h2>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold block">Impresora Térmica 80mm ESC/POS</span>
                  <span className="text-[11px] text-slate-500">Epson TM-T20III (302px)</span>
                </div>
                <input
                  type="checkbox"
                  checked={printer80mmConnected}
                  onChange={(e) => setPrinter80mmConnected(e.target.checked)}
                  className="w-4 h-4 text-[#80093A]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold block">Identificación Dual (Code 128 + QR)</span>
                  <span className="text-[11px] text-slate-500">Escaneo láser y 2D móvil</span>
                </div>
                <input
                  type="checkbox"
                  checked={dualBarcodeEnabled}
                  onChange={(e) => setDualBarcodeEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#80093A]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold block">Modo Offline-First (Sufijo -O)</span>
                  <span className="text-[11px] text-slate-500">IndexedDB local + sincronización</span>
                </div>
                <input
                  type="checkbox"
                  checked={offlineContingencyEnabled}
                  onChange={(e) => setOfflineContingencyEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#80093A]"
                />
              </label>
            </div>

            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Endpoint: cordano-pms-v1 (Cloud Run)</span>
              </span>
              <span className="font-mono font-bold text-emerald-700">OK</span>
            </div>
          </div>
        </div>
      </form>
    </MacOSNavigationShell>
  );
}
