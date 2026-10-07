import React from 'react';

export interface TicketPreviewData {
  plate: string;
  category: 'Sedán' | 'SUV' | 'Moto';
  rate: number;
  name: string;
  phone: string;
  obs: string;
  slot: number;
  ticketId?: string;
  isOffline?: boolean;
  dateStr?: string;
  timeStr?: string;
}

interface TicketPreviewModalProps {
  data: TicketPreviewData | null;
  onClose: () => void;
  onConfirmEntry: () => void;
  isConfirmed: boolean;
  onPrintTicket: () => void;
  onSendWhatsApp: () => void;
}

export const TicketPreviewModal: React.FC<TicketPreviewModalProps> = ({
  data,
  onClose,
  onConfirmEntry,
  isConfirmed,
  onPrintTicket,
  onSendWhatsApp,
}) => {
  if (!data) return null;

  const now = new Date();
  const timeStr =
    data.timeStr ||
    `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} hrs`;
  const dateStr =
    data.dateStr ||
    `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = data.isOffline ? 'O' : '';
  const ticketId =
    data.ticketId ||
    `TKT-${datePart}-T01-${(100 + data.slot).toString().padStart(4, '0')}${suffix}`;
  const slotCode =
    data.slot <= 15
      ? `A-${data.slot.toString().padStart(2, '0')}`
      : `B-${Math.min(30, data.slot).toString().padStart(2, '0')}`;

  return (
    <div
      id="modal-ticket-preview"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in-up"
    >
      <div className="bg-white rounded-2xl border border-[#e8ecf0] shadow-floating w-full max-w-sm overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#f1f5f9] shrink-0">
          <span className="text-[13px] font-bold uppercase tracking-[0.07em] font-mono text-slate-700">
            Ticket Térmico — 80mm
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors text-base font-bold cursor-pointer"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Body (Scrollable if viewport is small) */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Thermal Ticket Inner Paper Area */}
          <div className="p-5 bg-[#fafafa] border border-[#e8ecf0] rounded-xl font-mono text-xs space-y-3 text-center text-slate-800 tabular-nums shadow-inner">
            {/* Header section */}
            <div className="border-b border-dashed border-slate-300 pb-3 space-y-0.5">
              <div className="font-extrabold text-[13px] text-slate-900 leading-tight">
                CORDANO INVERSIONES INMOBILIARIAS
              </div>
              <div className="text-[11px] font-bold text-slate-700">
                PARKOPS — SERRANO 447, IQUIQUE
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Tarapacá · RUT: 76.842.190-4
              </div>
            </div>

            {/* Plate */}
            <div className="py-1">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">
                Patente Vehículo
              </div>
              <div
                id="modal-ticket-plate"
                className="license-plate-chip text-2xl font-extrabold tracking-[0.25em] text-slate-900 inline-block px-4 py-1 bg-white border-2 border-slate-900 rounded"
              >
                {data.plate}
              </div>
            </div>

            {/* Grid of fields */}
            <div className="grid grid-cols-2 gap-2 text-left border-y border-dashed border-slate-300 py-2.5">
              <div>
                <span className="text-slate-400">Fecha:</span>
                <br />
                <span className="font-bold">{dateStr}</span>
              </div>
              <div>
                <span className="text-slate-400">Hora:</span>
                <br />
                <span className="font-bold">{timeStr}</span>
              </div>
              <div>
                <span className="text-slate-400">Plaza / Llegada:</span>
                <br />
                <span className="font-bold text-slate-900">
                  {slotCode} (#{data.slot})
                </span>
              </div>
              <div>
                <span className="text-slate-400">Tarifa:</span>
                <br />
                <span className="font-bold">${data.rate}/min</span>
              </div>
            </div>

            {/* Optional damage observation */}
            {data.obs && (
              <div className="text-[10px] text-left bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-900 leading-snug">
                <strong>Obs. Daños:</strong> {data.obs}
              </div>
            )}

            {/* DUAL IDENTIFICATION: 2D QR + LINEAR CODE 128 */}
            <div className="pt-1 flex flex-col items-center justify-center space-y-2.5">
              {/* QR Code SVG */}
              <div className="w-[80px] h-[80px] border-2 border-slate-900 p-1.5 bg-white rounded-md flex items-center justify-center shadow-xs">
                <svg className="w-full h-full text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                  {/* Corner finders */}
                  <rect x="2" y="2" width="6" height="6" rx="0.5" />
                  <rect x="16" y="2" width="6" height="6" rx="0.5" />
                  <rect x="2" y="16" width="6" height="6" rx="0.5" />
                  {/* Inner finders */}
                  <rect x="3.5" y="3.5" width="3" height="3" fill="white" />
                  <rect x="17.5" y="3.5" width="3" height="3" fill="white" />
                  <rect x="3.5" y="17.5" width="3" height="3" fill="white" />
                  {/* Data modules */}
                  <rect x="10" y="10" width="4" height="4" rx="0.25" />
                  <rect x="16" y="16" width="4" height="4" rx="0.25" />
                  <rect x="10" y="16" width="4" height="2" rx="0.25" />
                  <rect x="16" y="10" width="2" height="4" rx="0.25" />
                  <rect x="10" y="3" width="2" height="2" />
                  <rect x="13" y="3" width="2" height="2" />
                  <rect x="3" y="10" width="2" height="2" />
                  <rect x="3" y="13" width="2" height="2" />
                </svg>
              </div>

              {/* Code 128 linear barcode */}
              <div className="w-full px-2">
                <div
                  className="h-8 w-full rounded-sm overflow-hidden"
                  style={{
                    background:
                      'repeating-linear-gradient(90deg,#0f172a 0px,#0f172a 2px,transparent 2px,transparent 4px,#0f172a 4px,#0f172a 5px,transparent 5px,transparent 8px,#0f172a 8px,#0f172a 9px,transparent 9px,transparent 12px)',
                  }}
                />
                <div className="text-[10px] font-bold tracking-[0.12em] text-slate-900 mt-1 text-center font-mono">
                  {ticketId}
                </div>
              </div>
            </div>

            {/* LEYENDA LEGAL OBLIGATORIA */}
            <div className="border border-amber-300 bg-amber-50 rounded-lg px-3 py-2 text-[9px] text-amber-900 text-left leading-snug mt-1 font-sans">
              <span className="font-extrabold uppercase tracking-wide">⚠ Importante:</span> No pierda este ticket. El extravío tiene un recargo reglamentario de{' '}
              <strong className="text-amber-800 text-[10px] font-mono font-bold">$8.000 CLP</strong> previa acreditación de dominio.
            </div>
          </div>

          {/* Action Buttons */}
          {!isConfirmed ? (
            <div className="space-y-2">
              <button
                onClick={onConfirmEntry}
                data-shortcut="Atajo: Enter"
                className="shortcut-tooltip w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Confirmar Ingreso en Sistema
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onPrintTicket}
                  data-shortcut="Atajo: F8"
                  className="shortcut-tooltip h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  Imprimir 80mm
                </button>
                <button
                  onClick={onSendWhatsApp}
                  className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  WhatsApp
                </button>
              </div>
              <button
                onClick={onClose}
                data-shortcut="Atajo: Esc"
                className="shortcut-tooltip text-[12px] font-semibold text-slate-400 hover:text-slate-700 text-center py-2 w-full transition-colors cursor-pointer"
              >
                Cerrar y continuar operando
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
