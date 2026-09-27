'use client';

import React from 'react';
import { MacOSNavigationShell } from '@/components/MacOSNavigationShell';
import { BookOpen, WifiOff, Keyboard } from 'lucide-react';

const SOP_PHASES = [
  {
    step: '01',
    title: 'Apertura de Turno y Fondo de Sencillo',
    desc: 'El Operador declara el fondo inicial en CLP para dar vuelto. El Administrador tiene restringida la apertura de caja (Regla 7).',
    shortcut: 'Login',
  },
  {
    step: '02',
    title: 'Detección LPR / Digitación de Patente',
    desc: 'El campo de matrícula cuenta con autofoco inmediato [F1/F2]. Se selecciona tarifa ($30/min, Jornada $6.000 o Noche $5.000).',
    shortcut: 'F1 / F2',
  },
  {
    step: '03',
    title: 'Emisión de Ticket Térmico 80mm Dual',
    desc: 'Imprime comprobante térmico con Code 128 lineal + QR 2D + advertencia legal de extravío ($8.000 CLP).',
    shortcut: 'F8',
  },
  {
    step: '04',
    title: 'Monitoreo en Matriz Serrano 447',
    desc: 'Las 30 plazas (Sector A 01–15, Sector B 16–30) y fila de sobrecupo (SC-01..05) actualizan su color semántico en tiempo real.',
    shortcut: 'Matriz 60%',
  },
  {
    step: '05',
    title: 'Liquidación, Vuelto o Excepción PIN',
    desc: 'Cobro en Efectivo [F4] o Tarjeta [F5]. Descuentos exigen PIN Operador + justificación >10 car. (Verde); Ticket perdido exige PIN Admin (Rojo).',
    shortcut: 'F4–F7',
  },
  {
    step: '06',
    title: 'Arqueo de Caja Ciega & Reporte Z SHA-256',
    desc: 'El operador cuenta efectivo físico sin ver monto de sistema. Se calcula Efectivo Sistema vs Recontado = Diferencia y se firma con SHA-256.',
    shortcut: 'Cierre Z',
  },
];

export default function DocumentacionPage() {
  return (
    <MacOSNavigationShell
      title="Manuales SOP & Procedimientos"
      subtitle="Flujo estándar de garita en 6 fases, atajos de teclado y contingencia offline (-O)"
      roleLabel="Soporte & SOP"
    >
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Flujo SOP en 6 Fases */}
        <section className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <h2 className="text-xs font-bold uppercase text-slate-800 border-b border-slate-200 pb-2">
            Flujo Operativo Estándar (SOP) — Garita Serrano 447
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {SOP_PHASES.map((p) => (
              <div key={p.step} className="p-3 rounded border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="w-6 h-6 rounded bg-[#80093A] text-white font-mono font-bold text-xs flex items-center justify-center">
                    {p.step}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-slate-500">{p.shortcut}</span>
                </div>
                <h3 className="font-bold text-slate-900">{p.title}</h3>
                <p className="text-slate-600 text-[11px] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Protocolo Offline y Atajos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-2.5 text-xs">
            <h2 className="font-bold uppercase text-slate-800 flex items-center gap-1.5">
              <WifiOff className="w-4 h-4 text-amber-600" />
              <span>Contingencia Offline-First (Sufijo -O)</span>
            </h2>
            <ul className="space-y-1.5 text-slate-600 text-[11px]">
              <li>• <strong>Sufijo -O:</strong> Folio con formato <code className="font-mono font-bold">TKT-AAAAMMDD-T0X-XXXXO</code>.</li>
              <li>• <strong>Persistencia Local:</strong> Registro en IndexedDB sincronizado al restablecerse la red.</li>
              <li>• <strong>Lectura Dual:</strong> Timestamp codificado en Code 128 para liquidación offline.</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-2 text-xs">
            <h2 className="font-bold uppercase text-slate-800 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-[#80093A]" />
              <span>Atajos de Teclado (Garita Sin Scroll)</span>
            </h2>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200 flex justify-between">
                <strong>F1 / F2</strong> <span>Autofoco Patente</span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200 flex justify-between">
                <strong>F3</strong> <span>Cambiar Tarifa</span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200 flex justify-between">
                <strong>F4</strong> <span>Cobro Efectivo</span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200 flex justify-between">
                <strong>F5</strong> <span>Cobro Tarjeta</span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200 flex justify-between">
                <strong>F6</strong> <span>Descuento PIN</span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200 flex justify-between">
                <strong>F7</strong> <span>Ticket Perdido</span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200 flex justify-between">
                <strong>F8</strong> <span>Imprimir 80mm</span>
              </div>
              <div className="p-1.5 rounded bg-slate-50 border border-slate-200 flex justify-between">
                <strong>F9</strong> <span>Abrir Barrera</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MacOSNavigationShell>
  );
}
