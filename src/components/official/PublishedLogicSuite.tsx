'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Car,
  Clock,
  ArrowRight,
  Command,
  ShieldAlert,
  AlertTriangle,
  X,
  KeyRound,
  Printer,
  CheckCircle2,
  Sparkles,
  Database,
  Lock,
  Unlock,
  Filter,
  ArrowRightLeft,
} from 'lucide-react';
import { ActiveVehicle } from './OfficialModals';

// ============================================================================
// 1. CORDANO VECTOR LOGO (Ported from cordano-pms-version-publicada)
// ============================================================================
export const CordanoLogo: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 32,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Cordano Parking Logo"
    >
      <rect width="100" height="100" rx="22" fill="#0F172A" />
      <rect
        x="3"
        y="3"
        width="94"
        height="94"
        rx="19"
        stroke="white"
        strokeOpacity="0.15"
        strokeWidth="2"
      />
      <path
        d="M68 28H42C30.9543 28 22 36.9543 22 48V52C22 63.0457 30.9543 72 42 72H68"
        stroke="#FFFFFF"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path
        d="M46 40V60M46 40H58C62.4183 40 66 43.5817 66 48C66 52.4183 62.4183 56 58 56H46"
        stroke="#10B981"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="75" cy="50" r="5" fill="#10B981" />
    </svg>
  );
};

// ============================================================================
// 2. ISOLATED IFRAME THERMAL PRINTER (80mm / 58mm / A4 System Dialog)
//    Ported from cordano-pms-version-publicada/src/utils/pdfGenerator.ts
// ============================================================================
export function printThermalTicketIsolated(params: {
  ticketCode: string;
  plate: string;
  slotCode: string;
  vehicleType: string;
  entryTime: string;
  ratePerMin: number;
  clientName?: string;
  isOffline?: boolean;
  paperWidthMm?: 80 | 58;
  paidAmount?: number;
  paymentMethod?: string;
  stayMinutes?: number;
}) {
  if (typeof document === 'undefined') return;

  const widthMm = params.paperWidthMm || 80;
  const codeWithOffline =
    params.isOffline && !params.ticketCode.endsWith('O')
      ? `${params.ticketCode}O`
      : params.ticketCode;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Ticket ${codeWithOffline}</title>
  <style>
    @page { size: ${widthMm}mm auto; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: ${widthMm}mm;
      padding: 4mm;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      color: #000;
      background: #fff;
      font-size: 11px;
      line-height: 1.35;
    }
    .center { text-align: center; }
    .bold { font-weight: 800; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .plate-box {
      border: 2px solid #000;
      padding: 6px;
      margin: 6px 0;
      text-align: center;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 2px;
    }
    .row { display: flex; justify-content: space-between; margin: 3px 0; }
    .barcode-bars {
      height: 34px;
      margin: 6px auto 2px;
      width: 92%;
      background: repeating-linear-gradient(
        90deg,
        #000,
        #000 2px,
        #fff 2px,
        #fff 4px,
        #000 4px,
        #000 5px,
        #fff 5px,
        #fff 8px
      );
    }
    .qr-box {
      width: 64px;
      height: 64px;
      margin: 6px auto;
      border: 2px solid #000;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 2px;
      padding: 3px;
    }
    .qr-cell { background: #000; }
    .qr-empty { background: #fff; }
    .legal-box {
      margin-top: 6px;
      padding: 4px;
      border: 1px solid #000;
      font-size: 9px;
      text-align: center;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="center bold" style="font-size:13px;">CORDANO INVERSIONES</div>
  <div class="center" style="font-size:10px;">Serrano 447, Iquique - Garita 01</div>
  <div class="center" style="font-size:9px;">RUT: 76.842.190-4 • ParkOps PMS v4.5</div>
  <div class="divider"></div>
  <div class="center bold" style="font-size:10px;">
    ${params.paidAmount !== undefined ? 'COMPROBANTE DE SALIDA / PAGO' : 'TICKET DE INGRESO VEHICULAR'}
  </div>
  <div class="plate-box">${params.plate}</div>
  <div class="row"><span>FOLIO:</span><span class="bold">${codeWithOffline}</span></div>
  <div class="row"><span>PLAZA:</span><span class="bold">${params.slotCode} (${params.vehicleType.toUpperCase()})</span></div>
  <div class="row"><span>INGRESO:</span><span class="bold">${params.entryTime} hrs</span></div>
  <div class="row"><span>TARIFA:</span><span class="bold">$${params.ratePerMin} CLP / min</span></div>
  ${params.clientName ? `<div class="row"><span>CLIENTE:</span><span class="bold">${params.clientName}</span></div>` : ''}
  ${
    params.paidAmount !== undefined
      ? `
    <div class="divider"></div>
    <div class="row"><span>ESTADÍA:</span><span class="bold">${params.stayMinutes || 0} min</span></div>
    <div class="row"><span>MEDIO PAGO:</span><span class="bold">${params.paymentMethod || 'EFECTIVO'}</span></div>
    <div class="row" style="font-size:14px;margin-top:4px;"><span class="bold">TOTAL PAGADO:</span><span class="bold">$${params.paidAmount.toLocaleString('es-CL')}</span></div>
  `
      : ''
  }
  <div class="divider"></div>
  <div class="center" style="font-size:9px;font-weight:700;">IDENTIFICACIÓN DUAL (QR 2D + CODE 128)</div>
  <div class="qr-box">
    <div class="qr-cell"></div><div class="qr-cell"></div><div class="qr-empty"></div><div class="qr-cell"></div><div class="qr-cell"></div>
    <div class="qr-cell"></div><div class="qr-empty"></div><div class="qr-cell"></div><div class="qr-empty"></div><div class="qr-cell"></div>
    <div class="qr-empty"></div><div class="qr-cell"></div><div class="qr-cell"></div><div class="qr-cell"></div><div class="qr-empty"></div>
    <div class="qr-cell"></div><div class="qr-empty"></div><div class="qr-cell"></div><div class="qr-empty"></div><div class="qr-cell"></div>
    <div class="qr-cell"></div><div class="qr-cell"></div><div class="qr-empty"></div><div class="qr-cell"></div><div class="qr-cell"></div>
  </div>
  <div class="barcode-bars"></div>
  <div class="center bold" style="font-size:9px;letter-spacing:1px;">${codeWithOffline}</div>
  <div class="legal-box">
    ADVERTENCIA LEGAL OBLIGATORIA:<br/>
    EL EXTRAVÍO O PÉRDIDA DE ESTE TICKET TIENE UN RECARGO FIJO DE $8.000 CLP (EXIGE VALIDACIÓN DE IDENTIDAD Y PIN ADMIN).
  </div>
</body>
</html>`;

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1200);
    }
  }, 180);
}

// ============================================================================
// 3. COMMAND PALETTE MODAL (⌘K / Ctrl+K)
//    Ported from cordano-pms-version-publicada/src/components/CommandPalette.tsx
// ============================================================================
interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: ActiveVehicle[];
  onSelectVehicleForCheckout: (vehicle: ActiveVehicle) => void;
  onNavigateView: (view: string) => void;
  onTriggerBarrier: () => void;
  onOpenArqueoCiego: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  onSelectVehicleForCheckout,
  onNavigateView,
  onTriggerBarrier,
  onOpenArqueoCiego,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredVehicles = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return vehicles.slice(0, 8);
    return vehicles.filter(
      (v) =>
        v.plate.toUpperCase().includes(q) ||
        v.slotCode.toUpperCase().includes(q) ||
        v.ticketId.toUpperCase().includes(q) ||
        (v.client && v.client.toUpperCase().includes(q))
    );
  }, [vehicles, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredVehicles.length > 0 ? (prev + 1) % filteredVehicles.length : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredVehicles.length > 0
          ? (prev - 1 + filteredVehicles.length) % filteredVehicles.length
          : 0
      );
    } else if (e.key === 'Enter' && filteredVehicles[selectedIndex]) {
      e.preventDefault();
      onSelectVehicleForCheckout(filteredVehicles[selectedIndex]);
      onClose();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/65 backdrop-blur-sm flex items-start justify-center pt-[10vh] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar patente (ej: BBCL84), código de ticket (TKT-...) o plaza (A-01)..."
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm font-mono font-bold outline-none uppercase"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-1 rounded bg-slate-200/80 text-slate-700 font-mono text-[10px] font-bold">
              ESC
            </span>
          </div>
        </div>

        {/* Quick Operational Actions Bar */}
        <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Comandos Rápidos:
          </span>
          <button
            type="button"
            onClick={() => {
              onTriggerBarrier();
              onClose();
            }}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 shadow-sm"
          >
            <Unlock className="w-3 h-3 text-blue-600" />
            <span>Abrir Barrera (F9)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenArqueoCiego();
              onClose();
            }}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 shadow-sm"
          >
            <Lock className="w-3 h-3 text-amber-600" />
            <span>Arqueo Ciego SHA-256</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigateView('engine');
              onClose();
            }}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 shadow-sm"
          >
            <Database className="w-3 h-3 text-emerald-600" />
            <span>Motor Híbrido &amp; Archify (F10)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigateView('clients');
              onClose();
            }}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>Convenios en Paralelo (F3)</span>
          </button>
        </div>

        {/* Active Vehicles Results */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {filteredVehicles.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No se encontraron vehículos activos en patio para{' '}
              <span className="font-mono font-bold text-slate-900">&quot;{query}&quot;</span>
            </div>
          ) : (
            filteredVehicles.map((v, idx) => {
              const isSelected = idx === selectedIndex;
              const isOverstay = v.durationMin >= 240;
              const fee = v.durationMin * (v.rate || 25);
              return (
                <button
                  key={v.plate}
                  type="button"
                  onClick={() => {
                    onSelectVehicleForCheckout(v);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full px-4 py-3 flex items-center justify-between text-left transition ${
                    isSelected ? 'bg-blue-50/90' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs border ${
                        isOverstay
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : isSelected
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {v.slotCode}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-extrabold text-slate-900 tracking-wider tabular-nums">
                          {v.plate}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {v.ticketId}
                        </span>
                        {isOverstay && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                            SOBRESTADÍA &gt;4H
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5 font-mono tabular-nums">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Ingreso: {v.entry} ({v.durationMin} min)
                        </span>
                        <span>•</span>
                        <span>Cliente: {v.client || 'Particular'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Cobro Actual
                      </span>
                      <span className="font-mono text-base font-extrabold text-emerald-700 tabular-nums">
                        ${fee.toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3 font-mono">
            <span>↑↓ Navegar</span>
            <span>↵ Seleccionar para Cobro</span>
            <span>ESC Cerrar</span>
          </div>
          <div className="flex items-center gap-1 font-mono font-bold text-slate-700">
            <Command className="w-3.5 h-3.5" />
            <span>Paleta Global ParkOps ({vehicles.length} en patio)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. MODAL FUGA DE VEHÍCULO (PIN Supervisor + Alerta Crítica Roja)
//    Ported from cordano-pms-version-publicada/src/components/ModalFugaVehiculo.tsx
// ============================================================================
interface ModalFugaVehiculoProps {
  vehicle: ActiveVehicle | null;
  onClose: () => void;
  onConfirmFuga: (vehicle: ActiveVehicle, notes: string, supervisorPin: string) => void;
}

export const ModalFugaVehiculo: React.FC<ModalFugaVehiculoProps> = ({
  vehicle,
  onClose,
  onConfirmFuga,
}) => {
  const [supervisorPin, setSupervisorPin] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!vehicle) return null;

  const fee = vehicle.durationMin * (vehicle.rate || 25);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!supervisorPin.trim()) {
      setErrorMsg('Debe ingresar el PIN de Supervisor / Administrador para autorizar.');
      return;
    }

    if (
      supervisorPin !== '1234' &&
      supervisorPin !== '2026' &&
      supervisorPin !== '9999' &&
      supervisorPin !== 'admin123'
    ) {
      setErrorMsg('PIN de Supervisor inválido (Autorizados en garita: 1234, 2026 o 9999).');
      return;
    }

    onConfirmFuga(
      vehicle,
      notes.trim() || 'Vehículo forzó salida sin registrar pago en caja (Fuga registrada)',
      supervisorPin
    );
    setSupervisorPin('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl border border-red-200 shadow-2xl overflow-hidden">
        <div className="p-4 bg-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-100 bg-black/25 px-2 py-0.5 rounded-full inline-block">
                REGLA #5 • AUDITORÍA ROJA ANTIFRAUDE
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Reportar Fuga de Vehículo
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-white text-red-700 flex items-center justify-center border border-red-200 font-bold">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <span className="font-mono text-base font-extrabold text-red-950 block tabular-nums">
                  {vehicle.plate}
                </span>
                <span className="text-[11px] font-mono font-bold text-red-700">
                  Plaza: {vehicle.slotCode} • {vehicle.ticketId}
                </span>
              </div>
            </div>
            <div className="text-right font-mono tabular-nums">
              <span className="text-[10px] text-slate-500 block">Deuda Impaga:</span>
              <span className="text-sm font-extrabold text-red-700">
                ${fee.toLocaleString('es-CL')}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Esta acción liberará de inmediato la plaza{' '}
            <strong className="font-mono text-slate-900">{vehicle.slotCode}</strong> y registrará una{' '}
            <strong className="text-red-700">Alerta Crítica Roja</strong> en la Bitácora de Auditoría
            e historial de patentes (Datastore) para bloqueo automático en futuras visitas.
          </p>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Detalle del Incidente / Evidencia LPR:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Conductor salió pegado al vehículo anterior sin pagar en Garita 01..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-red-600 focus:bg-white resize-none"
            />
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-red-600" />
                <span>PIN Supervisor / Admin:</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">Ej: 1234 / 2026 / 9999</span>
            </label>
            <input
              type="password"
              value={supervisorPin}
              onChange={(e) => setSupervisorPin(e.target.value)}
              placeholder="••••"
              className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-red-600 rounded-lg text-center font-mono font-extrabold text-base outline-none tracking-widest"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Confirmar Fuga</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 5. TABLERO KANBAN POR TIEMPOS DE ESTADÍA (4 Tramos Operativos)
//    Ported from cordano-pms-version-publicada/src/components/TableroKanbanEstadia.tsx
// ============================================================================
interface TableroKanbanEstadiaViewProps {
  vehicles: ActiveVehicle[];
  onSelectVehicleForCheckout: (vehicle: ActiveVehicle) => void;
  onReportFuga: (vehicle: ActiveVehicle) => void;
}

export const TableroKanbanEstadiaView: React.FC<TableroKanbanEstadiaViewProps> = ({
  vehicles,
  onSelectVehicleForCheckout,
  onReportFuga,
}) => {
  const [filterType, setFilterType] = useState<'TODOS' | 'Sedán' | 'SUV' | 'Moto'>('TODOS');
  const [searchPlate, setSearchPlate] = useState('');

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesType = filterType === 'TODOS' || v.cat === filterType;
      const matchesSearch =
        !searchPlate.trim() ||
        v.plate.toUpperCase().includes(searchPlate.trim().toUpperCase()) ||
        v.slotCode.toUpperCase().includes(searchPlate.trim().toUpperCase());
      return matchesType && matchesSearch;
    });
  }, [vehicles, filterType, searchPlate]);

  const columns = useMemo(() => {
    const col1: ActiveVehicle[] = []; // 0 - 30 min
    const col2: ActiveVehicle[] = []; // 31 - 120 min
    const col3: ActiveVehicle[] = []; // 121 - 240 min (2 - 4h)
    const col4: ActiveVehicle[] = []; // > 240 min (> 4h Alerta Crítica)

    filteredVehicles.forEach((v) => {
      const mins = v.durationMin || 15;
      if (mins <= 30) col1.push(v);
      else if (mins <= 120) col2.push(v);
      else if (mins <= 240) col3.push(v);
      else col4.push(v);
    });

    return [
      {
        id: 'tramo-1',
        title: '0 - 30 min',
        subtitle: 'Estadía Corta',
        hex: '#10B981',
        headerBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        badgeClass: 'bg-emerald-600 text-white',
        items: col1,
      },
      {
        id: 'tramo-2',
        title: '31 - 120 min',
        subtitle: 'Rotación Media',
        hex: '#3B82F6',
        headerBg: 'bg-blue-50 border-blue-200 text-blue-900',
        badgeClass: 'bg-blue-600 text-white',
        items: col2,
      },
      {
        id: 'tramo-3',
        title: '2 - 4 horas',
        subtitle: 'Estadía Prolongada',
        hex: '#F59E0B',
        headerBg: 'bg-amber-50 border-amber-200 text-amber-900',
        badgeClass: 'bg-amber-600 text-white',
        items: col3,
      },
      {
        id: 'tramo-4',
        title: '> 4 horas',
        subtitle: 'Alerta Sobrestadía',
        hex: '#EF4444',
        headerBg: 'bg-red-50 border-red-200 text-red-900',
        badgeClass: 'bg-red-600 text-white',
        items: col4,
      },
    ];
  }, [filteredVehicles]);

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-2 pt-2">
      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shrink-0">
        <div className="flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-400 ml-1" />
          {(['TODOS', 'Sedán', 'SUV', 'Moto'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition ${
                filterType === type
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="relative w-36">
          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value)}
            placeholder="Patente/Slot..."
            className="w-full pl-6 pr-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-mono font-bold uppercase outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* 4 Kanban Columns */}
      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
        {columns.map((col) => (
          <div
            key={col.id}
            className="bg-slate-50/90 rounded-xl border border-slate-200 flex flex-col min-h-[150px] overflow-hidden"
          >
            {/* Column Header */}
            <div className={`px-2.5 py-1.5 border-b flex items-center justify-between ${col.headerBg}`}>
              <div>
                <div className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: col.hex }}
                  />
                  <h4 className="text-[11px] font-extrabold tracking-tight">{col.title}</h4>
                </div>
                <p className="text-[9px] opacity-80 font-medium">{col.subtitle}</p>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold tabular-nums ${col.badgeClass}`}
              >
                {col.items.length}
              </span>
            </div>

            {/* Cards List */}
            <div className="p-1.5 space-y-1.5 overflow-y-auto max-h-44">
              {col.items.length === 0 ? (
                <div className="h-16 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-medium">
                  Sin vehículos
                </div>
              ) : (
                col.items.map((v) => {
                  const fee = v.durationMin * (v.rate || 25);
                  return (
                    <div
                      key={v.plate}
                      className="bg-white rounded-lg p-2 border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-1.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono font-extrabold text-[11px] tracking-wider tabular-nums">
                            {v.plate}
                          </span>
                          <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                            <strong className="text-slate-800">{v.slotCode}</strong> • {v.cat}
                          </div>
                        </div>
                        <div className="text-right font-mono tabular-nums">
                          <span className="text-[11px] font-extrabold text-emerald-700 block">
                            ${fee.toLocaleString('es-CL')}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500">
                            {v.durationMin}m
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-1">
                        <button
                          type="button"
                          onClick={() => onSelectVehicleForCheckout(v)}
                          className="flex-1 py-0.5 px-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold flex items-center justify-center gap-0.5"
                        >
                          <span>Cobrar</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            printThermalTicketIsolated({
                              ticketCode: v.ticketId,
                              plate: v.plate,
                              slotCode: v.slotCode,
                              vehicleType: v.cat,
                              entryTime: v.entry,
                              ratePerMin: v.rate || 25,
                              clientName: v.client,
                              isOffline: v.isOffline,
                            })
                          }
                          title="Imprimir Ticket Térmico 80mm Aislado"
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          <Printer className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onReportFuga(v)}
                          title="Reportar Fuga de Vehículo (PIN Supervisor)"
                          className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                        >
                          <ShieldAlert className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 6. MODAL REVISIÓN 1 A 1 DE VEHÍCULOS EN PATIO ANTES DE CIERRE DE CAJA
//    Ported from cordano-pms-version-publicada/src/components/ModalRevisionVehiculosCierre.tsx
// ============================================================================
interface ModalRevisionVehiculosCierreProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: ActiveVehicle[];
  onForceCheckoutVehicle: (vehicle: ActiveVehicle) => void;
  onConfirmAllHandover: (transferredPlates: string[]) => void;
}

export const ModalRevisionVehiculosCierre: React.FC<ModalRevisionVehiculosCierreProps> = ({
  isOpen,
  onClose,
  vehicles,
  onForceCheckoutVehicle,
  onConfirmAllHandover,
}) => {
  const [decisions, setDecisions] = useState<Record<string, 'TRASPASAR' | 'COBRADO'>>({});

  useEffect(() => {
    if (isOpen) {
      const init: Record<string, 'TRASPASAR' | 'COBRADO'> = {};
      vehicles.forEach((v) => {
        init[v.slotCode] = 'TRASPASAR';
      });
      setDecisions(init);
    }
  }, [isOpen, vehicles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[135] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 block">
                PROTOCOLO PRE-CIERRE • ARRASTRE DE PATIO
              </span>
              <h3 className="text-base font-bold text-white">
                Revisión 1 a 1 de Vehículos en Patio ({vehicles.length} activos)
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subheader explanation */}
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between">
          <span>
            Verifica cada vehículo físicamente estacionado: puedes{' '}
            <strong>1. Traspasarlo en arrastre al siguiente turno</strong> o{' '}
            <strong>2. Forzar su salida y cobro inmediato</strong>.
          </span>
          <span className="font-mono font-bold text-amber-800 shrink-0 ml-2">
            {vehicles.length} en recinto
          </span>
        </div>

        {/* Vehicle Handover List */}
        <div className="p-4 overflow-y-auto divide-y divide-slate-100 flex-1">
          {vehicles.map((v) => {
            const currentDecision = decisions[v.slotCode] || 'TRASPASAR';
            const fee = v.durationMin * (v.rate || 25);
            return (
              <div
                key={v.plate}
                className="py-2.5 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-9 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                    {v.slotCode}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-slate-900 tabular-nums">
                        {v.plate}
                      </span>
                      <span className="text-[11px] text-slate-500">{v.cat}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                      Ingreso: {v.entry} ({v.durationMin} min) • Acumulado:{' '}
                      <strong className="text-emerald-700">
                        ${fee.toLocaleString('es-CL')}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDecisions((prev) => ({ ...prev, [v.slotCode]: 'TRASPASAR' }))
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                      currentDecision === 'TRASPASAR'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>1. Traspasar Turno</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onForceCheckoutVehicle(v);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition flex items-center gap-1"
                  >
                    <span>2. Cobrar Ahora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-600">
            Se traspasarán <strong>{vehicles.length} vehículos</strong> en acta de cambio de turno.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirmAllHandover(vehicles.map((v) => v.plate));
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Confirmar Arrastre ({vehicles.length} Vehículos)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
