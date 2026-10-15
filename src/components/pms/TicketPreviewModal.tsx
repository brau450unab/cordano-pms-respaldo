import React, { useState, useEffect } from 'react';
import { generateTicketPdf, ThermalPaperSize } from '../../utils/pdfGenerator';
import { generateQrSvgString } from '../../utils/qrCodeGenerator';

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
      `🅿️ *PARKING OPS — TICKET DE ESTACIONAMIENTO*`,
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
      `⏱️ *Tiempo de Gracia:* 15 minutos sin costo incluidos`,
      ...(data.obs ? [`📝 *Obs / Daños:* ${data.obs}`] : []),
      ``,
      `ℹ️ *Importante:* Es responsabilidad del cliente conservar este comprobante para acreditar su hora de ingreso. Conforme a la Ley N° 20.967, ante extravío se liquida exclusivamente el tiempo efectivo por patente sin cobros punitivos.`,
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
    try {
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
        '80mm',
        false
      );
    } catch (err) {
      console.warn('Error imprimiendo ticket:', err);
    }
    if (onPrintTicket) {
      onPrintTicket();
    }
  };

  // Ejecución de descarga de PDF
  const handleTriggerDownloadPdf = () => {
    try {
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
        '80mm',
        true
      );
    } catch (err) {
      console.warn('Error descargando PDF:', err);
    }
    if (onExportPdf) {
      onExportPdf();
    }
  };

  return (
    <div
      id="modal-ticket-preview"
      onClick={(e) => {
        // Si no está confirmado, permite cerrar al hacer clic en el fondo
        if (!isConfirmed && e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in-up font-sans"
    >
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-[0_20px_60px_rgba(30,30,47,0.25)] w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#E2E8F0] shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E2498A]" />
            <span className="text-xs font-black uppercase tracking-wider text-[#1E1E2F]">
              {isConfirmed ? 'Ticket Confirmado — Emisión de Comprobante' : 'Vista Previa del Ticket (Térmica 80mm)'}
            </span>
          </div>
          {!isConfirmed ? (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-200/60 text-[#94A3B8] hover:text-[#1E1E2F] flex items-center justify-center transition-colors text-base font-bold cursor-pointer"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          ) : (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              80mm Térmica
            </span>
          )}
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

              {/* Tiempo de Gracia */}
              <div className="col-span-2 pt-1 border-t border-dashed border-[#CBD5E1] flex justify-between items-center">
                <span className="text-[#94A3B8]">Tiempo de Gracia:</span>
                <span className="font-extrabold text-emerald-700 font-mono">15 minutos sin costo</span>
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

            {/* CÓDIGO QR FUNCIONAL DENTRO DEL TICKET (ISO/IEC 18004) */}
            <div className="pt-2 pb-1 flex flex-col items-center justify-center space-y-1.5">
              <div
                className="w-[104px] h-[104px] border-2 border-[#1E1E2F] p-1 bg-white rounded-2xl flex items-center justify-center shadow-xs overflow-hidden"
                dangerouslySetInnerHTML={{
                  __html: generateQrSvgString(
                    `https://cordanopms.ai.studio/verify?folio=${encodeURIComponent(ticketId)}&plate=${encodeURIComponent(data.plate)}`,
                    96,
                    'M',
                    '#1E1E2F',
                    '#FFFFFF'
                  ),
                }}
              />

              <div className="text-[11px] font-bold tracking-wider text-[#1E1E2F] font-mono">
                {ticketId}
              </div>
              <span className="text-[9px] text-[#64748B]">
                Escanee con su cámara para verificar ticket en línea
              </span>
            </div>

            {/* LEYENDA LEGAL: RESPONSABILIDAD DEL CLIENTE (SIN MULTAS ILEGALES) */}
            <div className="border border-slate-200 bg-slate-100 rounded-xl px-3 py-2 text-[9px] text-slate-700 text-left leading-snug mt-1">
              <span className="font-extrabold uppercase tracking-wide text-slate-900 block mb-0.5">
                ℹ️ Responsabilidad del Cliente:
              </span>
              Es responsabilidad del cliente conservar este ticket para acreditar su hora de ingreso al momento del retiro. Conforme a la Ley N° 20.967, ante extravío se liquida exclusivamente el tiempo efectivo por patente sin recargos.
            </div>
          </div>

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
            <div className="space-y-3 pt-1">
              {/* Botones de acción principales */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="h-12 rounded-xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white text-xs font-bold shadow-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-98"
                  title="Imprimir ticket térmico en impresora USB de 80mm"
                >
                  <span>🖨️ Imprimir</span>
                  <span className="text-[9px] text-slate-300 font-mono">80mm Térmica</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerDownloadPdf}
                  className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 shadow-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-98"
                  title="Descargar documento PDF de 80mm directamente"
                >
                  <span>📄 Guardar</span>
                  <span className="text-[9px] text-slate-500 font-mono">PDF 80mm</span>
                </button>

                <button
                  type="button"
                  onClick={() => executeSendWhatsApp()}
                  className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-98"
                  title="Enviar comprobante vía WhatsApp wa.me"
                >
                  <span>💬 WhatsApp</span>
                  <span className="text-[9px] text-emerald-100 font-mono">wa.me</span>
                </button>
              </div>

              {/* Botón copiar mensaje */}
              <button
                type="button"
                onClick={handleCopyMessage}
                className="w-full py-2.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <span>{copiedMsg ? '✓' : '📋'}</span>
                <span>{copiedMsg ? '¡Texto y Enlace Copiados al Portapapeles!' : 'Copiar Texto y Enlace para WhatsApp'}</span>
              </button>

              {/* BOTÓN ENORME FINALIZAR: Obligatorio para cerrar el modal */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl bg-[#1E1E2F] hover:bg-[#2D2D44] active:scale-[0.99] text-white font-black text-sm sm:text-base shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>✅</span>
                  <span>Finalizar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
