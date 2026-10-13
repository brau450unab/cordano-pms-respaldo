import React, { useState, useEffect } from 'react';
import { generateTicketPdf, ThermalPaperSize } from '../../utils/pdfGenerator';

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
  onPrintTicket?: () => void;
  onSendWhatsApp?: (phone?: string) => void;
  onExportPdf?: () => void;
  onUpdateTicketPhone?: (phone: string) => void;
}

export const TicketPreviewModal: React.FC<TicketPreviewModalProps> = ({
  data,
  onClose,
  onConfirmEntry,
  isConfirmed,
  onPrintTicket,
  onSendWhatsApp,
  onExportPdf,
  onUpdateTicketPhone,
}) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [paperFormat, setPaperFormat] = useState<ThermalPaperSize>('80mm');

  useEffect(() => {
    if (data) {
      setPhoneInput(data.phone || '');
      setShowPhonePrompt(false);
      setCopiedMsg(false);
    }
  }, [data]);

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

  // Formateador telefónico para WhatsApp (Chile / Internacional)
  const formatPhoneForWhatsApp = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    // Formato móvil chileno 9 dígitos empezando en 9
    if (digits.length === 9 && digits.startsWith('9')) {
      return `56${digits}`;
    }
    // Formato con código país Chile 569XXXXXXXX
    if (digits.length === 11 && digits.startsWith('569')) {
      return digits;
    }
    // 8 dígitos fijos/móvil local
    if (digits.length === 8) {
      return `569${digits}`;
    }
    // Número con código internacional completo
    return digits;
  };

  // Generador del mensaje formal de WhatsApp
  const buildWhatsAppMessage = (): string => {
    const greeting =
      data.name && data.name !== 'Particular'
        ? `Estimado/a *${data.name}*:`
        : 'Estimado/a cliente:';

    const lines = [
      `🅿️ *CORDANO PMS — TICKET DE ESTACIONAMIENTO*`,
      `📍 Serrano 447, Iquique, Región de Tarapacá`,
      ``,
      greeting,
      `Su vehículo ha ingresado exitosamente al recinto.`,
      ``,
      `🏷️ *Folio Ticket:* \`${ticketId}\``,
      `🚘 *Patente:* *${data.plate}* (${data.category})`,
      `📅 *Fecha:* ${dateStr}`,
      `⏰ *Hora de Ingreso:* ${timeStr}`,
      `🅿️ *Cupo Asignado:* *${slotCode}*`,
      `💲 *Tarifa:* $${data.rate.toLocaleString('es-CL')}/minuto`,
      ...(data.obs ? [`📝 *Obs / Daños:* ${data.obs}`] : []),
      ``,
      `⚠️ *Importante:* Conserve este comprobante digital. Recargo reglamentario por ticket extraviado: $8.000 CLP previa acreditación de dominio.`,
      ``,
      `🌐 *Portal en línea:* https://cordanopms.ai.studio`,
      `_¡Gracias por preferir Cordano Parking Ops!_`,
    ];
    return lines.join('\n');
  };

  // Enviar a WhatsApp con wa.me
  const executeSendWhatsApp = (customPhone?: string) => {
    const phoneToUse = customPhone !== undefined ? customPhone : phoneInput;
    const cleanDigits = formatPhoneForWhatsApp(phoneToUse);

    if (!cleanDigits || cleanDigits.length < 8) {
      setShowPhonePrompt(true);
      return;
    }

    const message = buildWhatsAppMessage();
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${cleanDigits}?text=${encoded}`;

    window.open(url, '_blank');

    if (onUpdateTicketPhone && phoneToUse !== data.phone) {
      onUpdateTicketPhone(phoneToUse);
    }
    if (onSendWhatsApp) {
      onSendWhatsApp(cleanDigits);
    }
    setShowPhonePrompt(false);
  };

  // Copiar mensaje al portapapeles
  const handleCopyMessage = () => {
    const msg = buildWhatsAppMessage();
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2500);
    });
  };

  // Ejecución de impresión térmica o PDF
  const handleTriggerPrint = () => {
    if (onPrintTicket) {
      onPrintTicket();
    } else {
      generateTicketPdf(
        {
          ticketCode: ticketId,
          plateNumber: data.plate,
          vehicleType:
            data.category === 'Moto'
              ? 'Motocicleta'
              : data.category === 'SUV'
              ? 'Camioneta'
              : 'Automóvil',
          slotCode,
          entryTime: new Date().toISOString(),
          customerName: data.name,
          customerPhone: phoneInput || data.phone,
          notes: data.obs,
          rate: data.rate,
        },
        paperFormat,
        false
      );
    }
  };

  // Ejecución de descarga de PDF
  const handleTriggerDownloadPdf = () => {
    if (onExportPdf) {
      onExportPdf();
    } else {
      generateTicketPdf(
        {
          ticketCode: ticketId,
          plateNumber: data.plate,
          vehicleType:
            data.category === 'Moto'
              ? 'Motocicleta'
              : data.category === 'SUV'
              ? 'Camioneta'
              : 'Automóvil',
          slotCode,
          entryTime: new Date().toISOString(),
          customerName: data.name,
          customerPhone: phoneInput || data.phone,
          notes: data.obs,
          rate: data.rate,
        },
        paperFormat,
        true
      );
    }
  };

  return (
    <div
      id="modal-ticket-preview"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in-up font-sans"
    >
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-[0_20px_60px_rgba(30,30,47,0.25)] w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#E2E8F0] shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E2498A]" />
            <span className="text-xs font-black uppercase tracking-wider text-[#1E1E2F]">
              {isConfirmed ? 'Ticket Confirmado — Emisión de Comprobante' : 'Vista Previa del Ticket'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 text-[#94A3B8] hover:text-[#1E1E2F] flex items-center justify-center transition-colors text-base font-bold cursor-pointer"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Banner de confirmación exitosa si ya fue registrado */}
          {isConfirmed && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <div>
                  <span className="text-xs font-extrabold block">Ingreso Registrado con Éxito</span>
                  <span className="text-[10px] text-emerald-700">Cupo asignado: {slotCode} · Folio {ticketId}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-200/60 px-2 py-0.5 rounded-md">
                ACTIVO
              </span>
            </div>
          )}

          {/* Thermal Ticket Inner Paper Area */}
          <div className="p-4 sm:p-5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl text-xs space-y-3 text-center text-[#1E1E2F] shadow-inner font-sans">
            {/* Header section */}
            <div className="border-b border-dashed border-[#CBD5E1] pb-2.5 space-y-0.5">
              <div className="font-extrabold text-[13px] text-[#1E1E2F] leading-tight">
                CORDANO INVERSIONES INMOBILIARIAS
              </div>
              <div className="text-[11px] font-bold text-[#64748B]">
                PARKOPS — SERRANO 447, IQUIQUE
              </div>
              <div className="text-[10px] text-[#94A3B8]">
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
                className="license-plate-chip text-2xl sm:text-3xl font-extrabold tracking-[0.25em] text-[#1E1E2F] inline-block px-4 py-1.5 bg-white border-2 border-[#1E1E2F] rounded-xl font-mono"
              >
                {data.plate}
              </div>
            </div>

            {/* Grid of fields */}
            <div className="grid grid-cols-2 gap-2 text-left border-y border-dashed border-[#CBD5E1] py-2.5 text-[11px]">
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
                <span className="text-[#94A3B8]">Cupo Asignado:</span>
                <br />
                <span className="font-bold text-[#1E1E2F]">
                  {slotCode} (#{data.slot})
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8]">Tarifa Aplicada:</span>
                <br />
                <span className="font-bold text-[#1E1E2F] font-mono">${data.rate.toLocaleString('es-CL')}/min</span>
              </div>

              {/* Cliente y WhatsApp en ticket */}
              {data.name && data.name !== 'Particular' && (
                <div className="col-span-2 pt-1 border-t border-slate-200/60">
                  <span className="text-[#94A3B8]">Cliente:</span>{' '}
                  <span className="font-bold text-[#1E1E2F]">{data.name}</span>
                </div>
              )}

              {(phoneInput || data.phone) && (
                <div className="col-span-2">
                  <span className="text-[#94A3B8]">WhatsApp / Contacto:</span>{' '}
                  <span className="font-bold text-[#1E1E2F] font-mono">{phoneInput || data.phone}</span>
                </div>
              )}
            </div>

            {/* Optional damage observation */}
            {data.obs && (
              <div className="text-[10px] text-left bg-[#FFF5F8] border border-[#E2498A]/30 rounded-xl p-2.5 text-[#1E1E2F] leading-snug">
                <strong className="text-[#E2498A]">Obs. Daños:</strong> {data.obs}
              </div>
            )}

            {/* DUAL IDENTIFICATION: 2D QR + LINEAR CODE 128 */}
            <div className="pt-1 flex flex-col items-center justify-center space-y-2">
              {/* QR Code SVG */}
              <div className="w-[74px] h-[74px] border-2 border-[#1E1E2F] p-1.5 bg-white rounded-xl flex items-center justify-center shadow-xs">
                <svg className="w-full h-full text-[#1E1E2F]" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="2" width="6" height="6" rx="0.5" />
                  <rect x="16" y="2" width="6" height="6" rx="0.5" />
                  <rect x="2" y="16" width="6" height="6" rx="0.5" />
                  <rect x="3.5" y="3.5" width="3" height="3" fill="white" />
                  <rect x="17.5" y="3.5" width="3" height="3" fill="white" />
                  <rect x="3.5" y="17.5" width="3" height="3" fill="white" />
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
                  className="h-7 w-full rounded-sm overflow-hidden"
                  style={{
                    background:
                      'repeating-linear-gradient(90deg,#1E1E2F 0px,#1E1E2F 2px,transparent 2px,transparent 4px,#1E1E2F 4px,#1E1E2F 5px,transparent 5px,transparent 8px,#1E1E2F 8px,#1E1E2F 9px,transparent 9px,transparent 12px)',
                  }}
                />
                <div className="text-[10px] font-bold tracking-[0.12em] text-[#1E1E2F] mt-1 text-center font-mono">
                  {ticketId}
                </div>
              </div>
            </div>

            {/* LEYENDA LEGAL OBLIGATORIA */}
            <div className="border border-amber-300 bg-amber-50 rounded-xl px-3 py-2 text-[9px] text-amber-900 text-left leading-snug mt-1">
              <span className="font-extrabold uppercase tracking-wide text-amber-800">⚠️ Aviso Legal:</span> No pierda este comprobante. El extravío tiene un recargo reglamentario de{' '}
              <strong className="text-amber-950 text-[10px] font-mono font-bold">$ 8.000 CLP</strong> previa acreditación de dominio.
            </div>
          </div>

          {/* Formato de papel térmico / A4 selector */}
          {isConfirmed && (
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="text-slate-500 font-bold">Formato de Documento:</span>
              <div className="flex gap-1.5">
                {(['80mm', '58mm', 'a4'] as ThermalPaperSize[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setPaperFormat(fmt)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                      paperFormat === fmt
                        ? 'bg-[#1E1E2F] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Panel Interactivo de Solicitud de Teléfono para WhatsApp */}
          {showPhonePrompt && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-3 animate-fade-in text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💬</span>
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-950">
                      Enviar Comprobante por WhatsApp
                    </h4>
                    <p className="text-[10px] text-emerald-700">
                      Ingresa el teléfono celular del cliente para abrir wa.me:
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPhonePrompt(false)}
                  className="text-xs text-emerald-700 font-bold hover:text-emerald-900 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="tel"
                    autoFocus
                    placeholder="Ej. +56 9 8765 4321 o 987654321"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-emerald-300 bg-white font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => executeSendWhatsApp(phoneInput)}
                  className="px-4 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>🚀</span>
                  <span>Abrir wa.me</span>
                </button>
              </div>

              <div className="flex justify-between items-center pt-1 text-[10px] text-emerald-800">
                <span>Formato chileno: 9 dígitos (+56 9)</span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="underline font-bold hover:text-emerald-950 cursor-pointer"
                >
                  {copiedMsg ? '✓ ¡Texto copiado!' : '📋 Copiar mensaje'}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isConfirmed ? (
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onConfirmEntry}
                className="w-full h-12 rounded-2xl bg-[#E2498A] hover:bg-[#C83472] text-white font-extrabold text-sm shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🚀 Confirmar Ingreso en Sistema</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 py-1.5 w-full text-center cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="h-11 rounded-xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white text-xs font-bold shadow-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-98"
                  title="Imprimir ticket térmico en impresora USB o diálogo del sistema"
                >
                  <span>🖨️ Imprimir</span>
                  <span className="text-[9px] text-slate-300 font-mono">{paperFormat}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerDownloadPdf}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 shadow-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-98"
                  title="Descargar documento PDF directamente"
                >
                  <span>📄 Guardar</span>
                  <span className="text-[9px] text-slate-500 font-mono">PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => executeSendWhatsApp()}
                  className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-98"
                  title="Enviar comprobante vía WhatsApp wa.me"
                >
                  <span>💬 WhatsApp</span>
                  <span className="text-[9px] text-emerald-200 font-mono">wa.me</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer text-center"
                >
                  {copiedMsg ? '✓ Mensaje Copiado' : '📋 Copiar Enlace y Texto'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer text-center"
                >
                  Finalizar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
