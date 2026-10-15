import React, { useState, useEffect } from 'react';
import { generateExitReceiptPdf } from '../../utils/pdfGenerator';
import { generateQrSvgString } from '../../utils/qrCodeGenerator';
import { PaymentMethod } from '../../types';

export interface CheckoutReceiptData {
  ticketId: string;
  invoiceFolio?: string;
  plate: string;
  category: 'Sedán' | 'SUV' | 'Moto' | string;
  slotCode: string;
  entryTime: string;
  exitTime: string;
  durationMinutes: number;
  ratePerMinute: number;
  subtotalAmount: number;
  discountAmount?: number;
  discountReason?: string;
  surchargeAmount?: number;
  netSubtotal: number;
  ivaAmount: number;
  totalAmount: number;
  paidAmount?: number;
  changeAmount?: number;
  paymentMethod: PaymentMethod | string;
  operatorName?: string;
  shiftId?: string;
  customerName?: string;
  customerPhone?: string;
}

interface CheckoutReceiptModalProps {
  data: CheckoutReceiptData | null;
  onClose: () => void;
  onFinalizeCheckout?: () => void;
  onPrintReceipt?: () => void;
  onExportPdf?: () => void;
  onSendWhatsApp?: (phone: string) => void;
}

export const CheckoutReceiptModal: React.FC<CheckoutReceiptModalProps> = ({
  data,
  onClose,
  onFinalizeCheckout,
  onPrintReceipt,
  onExportPdf,
  onSendWhatsApp,
}) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  useEffect(() => {
    if (data) {
      setPhoneInput(data.customerPhone || '');
      setShowPhonePrompt(false);
      setCopiedMsg(false);
    }
  }, [data]);

  if (!data) return null;

  const entryDate = new Date(data.entryTime);
  const exitDate = new Date(data.exitTime);

  const entryTimeStr = entryDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const entryDateStr = entryDate.toLocaleDateString('es-CL');
  const exitTimeStr = exitDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const exitDateStr = exitDate.toLocaleDateString('es-CL');

  const hours = Math.floor(data.durationMinutes / 60);
  const mins = data.durationMinutes % 60;
  const durationStr = hours > 0 ? `${hours}h ${mins}m (${data.durationMinutes} min)` : `${data.durationMinutes} minutos`;

  const methodLabel =
    data.paymentMethod === 'efectivo'
      ? 'Efectivo en Gaveta'
      : data.paymentMethod === 'tarjeta_debito' || data.paymentMethod === 'tarjeta'
      ? 'Tarjeta POS Débito'
      : data.paymentMethod === 'tarjeta_credito'
      ? 'Tarjeta POS Crédito'
      : 'Transferencia Bancaria';

  // Formateador telefónico para WhatsApp (Chile / Internacional)
  const formatPhoneForWhatsApp = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 9 && digits.startsWith('9')) return `56${digits}`;
    if (digits.length === 11 && digits.startsWith('569')) return digits;
    if (digits.length === 8) return `569${digits}`;
    return digits;
  };

  // Generador del mensaje formal de WhatsApp
  const buildWhatsAppMessage = (): string => {
    const greeting =
      data.customerName && data.customerName !== 'Particular'
        ? `Estimado/a *${data.customerName}*:`
        : 'Estimado/a cliente:';

    const lines = [
      `🅿️ *CORDANO PARKING OPS — COMPROBANTE DE SALIDA Y PAGO*`,
      `📍 Serrano 447, Iquique, Región de Tarapacá`,
      ``,
      greeting,
      `Su pago y salida vehicular han sido registrados exitosamente.`,
      ``,
      `✅ *ESTADO:* *PAGADO — SALIDA CONFIRMADA*`,
      `🧾 *Boleta DTE:* \`${data.invoiceFolio || data.ticketId}\``,
      `🚘 *Patente:* *${data.plate}* (${data.category})`,
      `🅿️ *Plaza Liberada:* *${data.slotCode}*`,
      `⏰ *Hora de Entrada:* ${entryDateStr} ${entryTimeStr}`,
      `🏁 *Hora de Salida:* ${exitDateStr} ${exitTimeStr}`,
      `⏱️ *Tiempo Efectivo:* *${durationStr}*`,
      `💲 *Tarifa Aplicada:* $${data.ratePerMinute.toLocaleString('es-CL')}/minuto (15 min de gracia)`,
      ...(data.discountAmount && data.discountAmount > 0
        ? [`🏷️ *Descuento:* -$${data.discountAmount.toLocaleString('es-CL')} CLP`]
        : []),
      `💳 *Medio de Pago:* ${methodLabel}`,
      `💰 *TOTAL PAGADO:* *$${data.totalAmount.toLocaleString('es-CL')} CLP*`,
      ...(data.paidAmount && data.paidAmount > data.totalAmount
        ? [
            `💵 *Monto Entregado:* $${data.paidAmount.toLocaleString('es-CL')} CLP`,
            `🔄 *Vuelto al Cliente:* $${(data.changeAmount || 0).toLocaleString('es-CL')} CLP`,
          ]
        : []),
      ``,
      `👤 *Atendido por:* ${data.operatorName || 'Operador en Garita'}${data.shiftId ? ` (Turno: ${data.shiftId})` : ''}`,
      `ℹ️ Conforme a la Ley N° 20.967. Comprobante válido para control de barrera.`,
      ``,
      `🌐 *Verificación digital:* https://cordanopms.ai.studio`,
      `_¡Gracias por preferir Cordano Parking Ops!_`,
    ];
    return lines.join('\n');
  };

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

    if (onSendWhatsApp) {
      onSendWhatsApp(cleanDigits);
    }
    setShowPhonePrompt(false);
  };

  const handleCopyMessage = () => {
    const msg = buildWhatsAppMessage();
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2500);
    });
  };

  const handleTriggerPrint = () => {
    try {
      generateExitReceiptPdf(
        {
          ticketCode: data.ticketId,
          invoiceFolio: data.invoiceFolio,
          plateNumber: data.plate,
          vehicleType: data.category,
          slotCode: data.slotCode,
          entryTime: data.entryTime,
          exitTime: data.exitTime,
          durationMinutes: data.durationMinutes,
          ratePerMinute: data.ratePerMinute,
          subtotalAmount: data.subtotalAmount,
          discountAmount: data.discountAmount,
          netSubtotal: data.netSubtotal,
          ivaAmount: data.ivaAmount,
          totalAmount: data.totalAmount,
          paymentMethod: methodLabel,
          paidAmount: data.paidAmount,
          changeAmount: data.changeAmount,
          operatorName: data.operatorName,
          shiftId: data.shiftId,
          customerName: data.customerName,
          customerPhone: phoneInput || data.customerPhone,
        },
        '80mm',
        false
      );
    } catch (err) {
      console.warn('Error imprimiendo boleta de salida:', err);
    }
    if (onPrintReceipt) onPrintReceipt();
  };

  const handleTriggerDownloadPdf = () => {
    try {
      generateExitReceiptPdf(
        {
          ticketCode: data.ticketId,
          invoiceFolio: data.invoiceFolio,
          plateNumber: data.plate,
          vehicleType: data.category,
          slotCode: data.slotCode,
          entryTime: data.entryTime,
          exitTime: data.exitTime,
          durationMinutes: data.durationMinutes,
          ratePerMinute: data.ratePerMinute,
          subtotalAmount: data.subtotalAmount,
          discountAmount: data.discountAmount,
          netSubtotal: data.netSubtotal,
          ivaAmount: data.ivaAmount,
          totalAmount: data.totalAmount,
          paymentMethod: methodLabel,
          paidAmount: data.paidAmount,
          changeAmount: data.changeAmount,
          operatorName: data.operatorName,
          shiftId: data.shiftId,
          customerName: data.customerName,
          customerPhone: phoneInput || data.customerPhone,
        },
        '80mm',
        true
      );
    } catch (err) {
      console.warn('Error descargando boleta de salida:', err);
    }
    if (onExportPdf) onExportPdf();
  };

  const handleFinalize = () => {
    if (onFinalizeCheckout) onFinalizeCheckout();
    onClose();
  };

  const qrPayload = `https://cordanopms.ai.studio/verify?type=exit&folio=${encodeURIComponent(data.invoiceFolio || data.ticketId)}&plate=${encodeURIComponent(data.plate)}&total=${data.totalAmount}`;
  const qrSvg = generateQrSvgString(qrPayload, 120);

  return (
    <div
      id="modal-checkout-receipt"
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in font-sans"
    >
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-[0_25px_70px_rgba(30,30,47,0.35)] w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[94vh] animate-fade-in-up">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#E2E8F0] shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-[#1E1E2F]">
              Comprobante de Salida &amp; Boleta DTE (80mm)
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✓ PAGADO
          </span>
        </div>

        {/* Cuerpo Térmico Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar text-[#1E1E2F]">
          {/* Tarjeta de Ticket Térmico 80mm */}
          <div className="bg-[#FAF8F9] rounded-2xl p-4 sm:p-5 border-2 border-dashed border-[#CBD5E1] shadow-inner space-y-3 font-mono text-center relative overflow-hidden">
            {/* Sello de Agua / Badge de Pagado */}
            <div className="bg-emerald-600 text-white py-1.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 font-black text-xs tracking-wider uppercase font-sans">
              <span>✓</span>
              <span>PAGO CONFIRMADO · SALIDA AUTORIZADA</span>
            </div>

            {/* Cabecera del Ticket */}
            <div className="pt-1">
              <h3 className="font-extrabold text-sm sm:text-base text-[#1E1E2F] tracking-tight">
                PARKING OPS — CORDANO
              </h3>
              <p className="text-[10px] text-slate-500 font-sans">
                Serrano 447, Iquique • Boleta Electrónica SII
              </p>
              <div className="text-[11px] font-bold text-slate-700 mt-1">
                Boleta DTE: <span className="text-[#E2498A]">{data.invoiceFolio || data.ticketId}</span>
              </div>
            </div>

            <div className="border-t border-slate-300 border-dashed my-1" />

            {/* Patente Gigante */}
            <div className="py-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">Patente Liquidada</div>
              <div className="text-3xl sm:text-4xl font-black text-[#1E1E2F] tracking-widest tabular-nums">
                {data.plate}
              </div>
              <div className="text-xs text-slate-600 font-sans font-semibold mt-0.5">
                {data.category} • Plaza {data.slotCode} (Liberada)
              </div>
            </div>

            <div className="border-t border-slate-300 border-dashed my-1" />

            {/* Tiempos de Permanencia */}
            <div className="text-left text-xs space-y-1.5 font-sans bg-white/80 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-slate-600 text-[11px]">
                <span>Hora Ingreso:</span>
                <span className="font-mono font-bold text-slate-800">{entryDateStr} {entryTimeStr}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 text-[11px]">
                <span>Hora Salida:</span>
                <span className="font-mono font-bold text-slate-800">{exitDateStr} {exitTimeStr}</span>
              </div>
              <div className="flex justify-between items-center text-slate-900 font-bold pt-1 border-t border-slate-100 text-xs">
                <span>Tiempo Total:</span>
                <span className="font-mono text-[#E2498A] font-black">{durationStr}</span>
              </div>
            </div>

            {/* Desglose Monetario */}
            <div className="text-left text-xs space-y-1 font-mono tabular-nums bg-white/80 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-600 text-[11px] font-sans">
                <span>Tarifa Base (${data.ratePerMinute}/min):</span>
                <span>${data.subtotalAmount.toLocaleString('es-CL')}</span>
              </div>

              {data.discountAmount && data.discountAmount > 0 ? (
                <div className="flex justify-between text-emerald-600 text-[11px] font-sans font-bold">
                  <span>Descuento Comercial:</span>
                  <span>-${data.discountAmount.toLocaleString('es-CL')}</span>
                </div>
              ) : null}

              <div className="flex justify-between text-slate-500 text-[10px] font-sans">
                <span>Subtotal Neto:</span>
                <span>${data.netSubtotal.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[10px] font-sans">
                <span>IVA (19%):</span>
                <span>${data.ivaAmount.toLocaleString('es-CL')}</span>
              </div>

              <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline font-sans">
                <span className="font-black text-sm text-slate-900">TOTAL PAGADO:</span>
                <span className="text-2xl font-black text-[#E2498A] font-mono">
                  ${data.totalAmount.toLocaleString('es-CL')} CLP
                </span>
              </div>

              <div className="pt-1.5 flex justify-between text-[11px] text-slate-700 font-sans border-t border-slate-100">
                <span>Medio de Pago:</span>
                <span className="font-bold">{methodLabel}</span>
              </div>

              {data.paidAmount && data.paidAmount > data.totalAmount ? (
                <div className="flex justify-between text-[10px] text-emerald-700 font-sans font-bold">
                  <span>Entregado: ${data.paidAmount.toLocaleString('es-CL')}</span>
                  <span>Vuelto: ${(data.changeAmount || 0).toLocaleString('es-CL')}</span>
                </div>
              ) : null}
            </div>

            {/* Código QR de Salida */}
            <div className="flex flex-col items-center justify-center pt-2">
              <div
                className="p-2 bg-white rounded-xl shadow-xs border border-slate-200"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-1.5 font-sans">
                TIMBRE ELECTRÓNICO DTE / SALIDA
              </span>
            </div>

            {/* Atendido por & Leyenda Legal */}
            <div className="text-[10px] text-slate-500 font-sans pt-1 space-y-0.5">
              <div>Atendido por: <strong>{data.operatorName || 'Operador en Garita'}</strong></div>
              {data.shiftId && <div>Turno: <span className="font-mono">{data.shiftId}</span></div>}
              <div className="pt-1 text-[9px] text-slate-400">
                Ley N° 20.967: Cobro por tiempo efectivo de permanencia.
              </div>
            </div>
          </div>

          {/* Prompt de Teléfono para WhatsApp */}
          {showPhonePrompt && (
            <div className="p-3 bg-pink-50 border border-pink-200 rounded-2xl space-y-2 animate-fade-in font-sans">
              <div className="text-xs font-bold text-pink-900">
                📱 Ingrese el número móvil para enviar el comprobante:
              </div>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="+56 9 1234 5678"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-xl border border-pink-300 text-xs font-mono font-bold text-slate-800 bg-white focus:outline-none focus:border-[#E2498A]"
                />
                <button
                  type="button"
                  onClick={() => executeSendWhatsApp()}
                  className="px-3.5 py-1.5 bg-[#E2498A] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#C83472] cursor-pointer"
                >
                  Enviar
                </button>
              </div>
            </div>
          )}

          {/* Feedback de Copiado */}
          {copiedMsg && (
            <div className="p-2 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl text-center font-sans animate-fade-in">
              ✓ Comprobante copiado al portapapeles
            </div>
          )}

          {/* Opciones de Salida: Imprimir, Exportar PDF, WhatsApp */}
          <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>🖨️</span>
              <span>Imprimir Boleta (80mm)</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerDownloadPdf}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>📥</span>
              <span>Descargar PDF</span>
            </button>

            <button
              type="button"
              onClick={() => executeSendWhatsApp()}
              className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>📱</span>
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopyMessage}
              className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>📋</span>
              <span>Copiar Texto</span>
            </button>
          </div>

          {/* BOTÓN GRANDE FINALIZAR */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleFinalize}
              className="w-full min-h-[52px] py-4 px-6 rounded-2xl bg-[#E2498A] hover:bg-[#C83472] active:scale-[0.99] text-white text-sm sm:text-base font-black shadow-lg shadow-[#E2498A]/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>🏁</span>
              <span>Finalizar Salida &amp; Abrir Barrera</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-1.5">
              Al hacer clic en Finalizar se confirma la liberación del cupo y apertura de barrera.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
