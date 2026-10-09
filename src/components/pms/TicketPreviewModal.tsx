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
  onExportPdf?: () => void;
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
      className="fixed inset-0 bg-[#1E1E2F]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in-up"
    >
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-[0_20px_50px_rgba(44,19,56,0.2)] w-full max-w-sm overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E2E8F0] shrink-0">
          <span className="text-[13px] font-bold uppercase tracking-[0.07em] tabular-nums text-[#1E1E2F]">
            Ticket Térmico — 80mm
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#FFF5F8] text-[#94A3B8] hover:text-[#1E1E2F] flex items-center justify-center transition-colors text-base font-bold cursor-pointer"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Body (Scrollable if viewport is small) */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Thermal Ticket Inner Paper Area */}
          <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl tabular-nums text-xs space-y-3 text-center text-[#1E1E2F] tabular-nums shadow-inner">
            {/* Header section */}
            <div className="border-b border-dashed border-[#E2E8F0] pb-3 space-y-0.5">
              <div className="font-extrabold text-[13px] text-[#1E1E2F] leading-tight">
                CORDANO INVERSIONES INMOBILIARIAS
              </div>
              <div className="text-[11px] font-bold text-[#64748B]">
                PARKOPS — SERRANO 447, IQUIQUE
              </div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">
                Tarapacá · RUT: 76.842.190-4
              </div>
            </div>

            {/* Plate */}
            <div className="py-1">
              <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest mb-1 font-bold">
                Patente Vehículo
              </div>
              <div
                id="modal-ticket-plate"
                className="license-plate-chip text-2xl font-extrabold tracking-[0.25em] text-[#1E1E2F] inline-block px-4 py-1 bg-white border-2 border-[#1E1E2F] rounded-xl"
              >
                {data.plate}
              </div>
            </div>

            {/* Grid of fields */}
            <div className="grid grid-cols-2 gap-2 text-left border-y border-dashed border-[#E2E8F0] py-2.5">
              <div>
                <span className="text-[#94A3B8]">Fecha:</span>
                <br />
                <span className="font-bold text-[#1E1E2F]">{dateStr}</span>
              </div>
              <div>
                <span className="text-[#94A3B8]">Hora:</span>
                <br />
                <span className="font-bold text-[#1E1E2F]">{timeStr}</span>
              </div>
              <div>
                <span className="text-[#94A3B8]">Cupo / Llegada:</span>
                <br />
                <span className="font-bold text-[#1E1E2F]">
                  {slotCode} (#{data.slot})
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8]">Tarifa:</span>
                <br />
                <span className="font-bold text-[#1E1E2F]">${data.rate}/min</span>
              </div>
            </div>

            {/* Optional damage observation */}
            {data.obs && (
              <div className="text-[10px] text-left bg-[#FFF5F8] border border-[#E2E8F0] rounded-xl p-2.5 text-[#1E1E2F] leading-snug">
                <strong className="text-[#E2498A]">Obs. Daños:</strong> {data.obs}
              </div>
            )}

            {/* DUAL IDENTIFICATION: 2D QR + LINEAR CODE 128 */}
            <div className="pt-1 flex flex-col items-center justify-center space-y-2.5">
              {/* QR Code SVG */}
              <div className="w-[80px] h-[80px] border-2 border-[#1E1E2F] p-1.5 bg-white rounded-xl flex items-center justify-center shadow-xs">
                <svg className="w-full h-full text-[#1E1E2F]" viewBox="0 0 24 24" fill="currentColor">
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
                      'repeating-linear-gradient(90deg,#1E1E2F 0px,#1E1E2F 2px,transparent 2px,transparent 4px,#1E1E2F 4px,#1E1E2F 5px,transparent 5px,transparent 8px,#1E1E2F 8px,#1E1E2F 9px,transparent 9px,transparent 12px)',
                  }}
                />
                <div className="text-[10px] font-bold tracking-[0.12em] text-[#1E1E2F] mt-1 text-center tabular-nums">
                  {ticketId}
                </div>
              </div>
            </div>

            {/* LEYENDA LEGAL OBLIGATORIA */}
            <div className="border border-[#EAA023]/30 bg-[#FFF5F8] rounded-xl px-3 py-2 text-[9px] text-[#1E1E2F] text-left leading-snug mt-1 font-sans">
              <span className="font-extrabold uppercase tracking-wide text-[#EAA023]">⚠ Importante:</span> No pierda este ticket. El extravío tiene un recargo reglamentario de{' '}
              <strong className="text-[#1E1E2F] text-[10px] tabular-nums font-bold">$8.000 CLP</strong> previa acreditación de dominio.
            </div>
          </div>

          {/* Action Buttons */}
          {!isConfirmed ? (
            <div className="space-y-2">
              <button
                onClick={onConfirmEntry}
                
                className="shortcut-tooltip w-full h-11 rounded-full bg-[#E2498A] hover:bg-[#E2498A] text-white font-bold text-sm shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Confirmar Ingreso en Sistema
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onPrintTicket}
                  
                  className="shortcut-tooltip h-11 rounded-full bg-[#1E1E2F] hover:bg-[#2D2D44] text-white text-xs font-bold shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  Imprimir 80mm
                </button>
                <button
                  onClick={onSendWhatsApp}
                  className="h-11 rounded-full bg-[#E2498A] hover:bg-[#C83472] text-white text-xs font-bold shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  WhatsApp
                </button>
              </div>
              <button
                onClick={onClose}
                
                className="shortcut-tooltip text-[12px] font-semibold text-[#94A3B8] hover:text-[#1E1E2F] text-center py-2 w-full transition-colors cursor-pointer"
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
