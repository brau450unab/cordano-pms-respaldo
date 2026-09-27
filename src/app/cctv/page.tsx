'use client';

import React from 'react';
import { MacOSNavigationShell } from '@/components/MacOSNavigationShell';
import { Camera, ShieldCheck } from 'lucide-react';

const CCTV_FEEDS = [
  {
    id: 'CAM-01',
    name: 'CAM 01 · Acceso Principal Serrano 447 (LPR Entrada)',
    plateDetected: 'ABCD-12',
    confidence: '99.4%',
    sector: 'Gate 1 · Entrada',
    status: 'LIVE · 60 FPS',
  },
  {
    id: 'CAM-02',
    name: 'CAM 02 · Salida Garita Cobro (LPR Salida)',
    plateDetected: 'JK-LP-34',
    confidence: '98.9%',
    sector: 'Gate 2 · Salida',
    status: 'LIVE · 60 FPS',
  },
  {
    id: 'CAM-03',
    name: 'CAM 03 · Pasillo Central Sector A (Plazas 01–15)',
    plateDetected: 'RT-WX-91',
    confidence: '97.8%',
    sector: 'Sector A',
    status: 'LIVE · 30 FPS',
  },
  {
    id: 'CAM-04',
    name: 'CAM 04 · Sector B & Zona VIP (Plazas 16–30)',
    plateDetected: 'CD-AB-89',
    confidence: '99.1%',
    sector: 'Sector B · VIP',
    status: 'LIVE · 30 FPS',
  },
];

export default function CctvPage() {
  return (
    <MacOSNavigationShell
      title="CCTV & Reconocimiento LPR"
      subtitle="Monitoreo óptico de patentes y control de barreras en vivo"
      roleLabel="Seguridad LPR"
    >
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CCTV_FEEDS.map((cam) => (
            <div key={cam.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">{cam.name}</span>
                <span className="font-mono text-[10px] text-emerald-700 font-bold">{cam.status}</span>
              </div>

              {/* Contenedor Estructural de Video */}
              <div className="h-44 bg-slate-900 flex flex-col items-center justify-center p-4 text-center space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  Feed Video IP · {cam.sector}
                </span>
                <div className="px-4 py-2 rounded bg-black/60 border border-slate-700">
                  <span className="text-[10px] text-emerald-400 font-mono block">
                    LPR OCR: {cam.confidence}
                  </span>
                  <span className="text-xl font-mono font-black text-white tracking-widest tabular-nums">
                    {cam.plateDetected}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MacOSNavigationShell>
  );
}
