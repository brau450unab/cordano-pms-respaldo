import React, { useState } from 'react';
import { Ticket } from '../types';
import { CordanoLogo } from './CordanoLogo';
import {
  X,
  Printer,
  Share2,
  Check,
  Download,
  FileText,
  Sliders,
  Sparkles,
  QrCode
} from 'lucide-react';
import { printViaSystemDialog, generateTicketPdf, ThermalPaperSize } from '../utils/pdfGenerator';

interface TicketModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  title?: string;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  ticket,
  onClose,
  title = 'Ticket de Estacionamiento',
}) => {
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [paperSize, setPaperSize] = useState<ThermalPaperSize>('80mm');

  if (!ticket) return null;

  // 1. Native System Print Dialog (Thermal or System Printer or Save-to-PDF)
  const handleSystemPrint = () => {
    printViaSystemDialog('printable-ticket', `Ticket_${ticket.plateNumber}_${ticket.ticketCode}`);
  };

  // 2. Direct Vector PDF Download using jsPDF
  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    try {
      generateTicketPdf(ticket, paperSize, true);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setTimeout(() => setDownloadingPdf(false), 800);
    }
  };

  // 3. WhatsApp Share Link
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🅿️ *CORDANO PARKING OPS — COMPROBANTE*\n` +
      `Ticket: ${ticket.ticketCode}\n` +
      `Patente: ${ticket.plateNumber}\n` +
      `Tipo: ${ticket.vehicleType}\n` +
      `Slot: ${ticket.slotCode}\n` +
      `Entrada: ${new Date(ticket.entryTime).toLocaleString('es-CL')}\n` +
      (ticket.status === 'pagado'
        ? `Salida: ${ticket.exitTime ? new Date(ticket.exitTime).toLocaleString('es-CL') : 'N/A'}\n` +
          `Monto Pagado: $${ticket.totalAmount?.toLocaleString('es-CL')} CLP\n` +
          `Medio de Pago: ${ticket.paymentMethod?.toUpperCase()}\n` +
          `Estado: COMPROBANTE PAGADO`
        : `Estado: ACTIVO EN RECINTO`)
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200 font-['Manrope',sans-serif]">
      {/* Modal Card with restricted height & sticky footer */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#e2e2e4]">
        
        {/* Modal Top Header (Sticky) */}
        <div className="bg-[#1a1c1d] p-3.5 sm:p-4 text-white flex items-center justify-between shrink-0 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg overflow-hidden bg-white/10 p-0.5 flex items-center justify-center">
              <CordanoLogo className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-white leading-tight">
                {title}
              </h3>
              <p className="text-[10px] text-white/60 tabular-nums">
                {ticket.ticketCode} • {ticket.plateNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white rounded-full p-1.5 hover:bg-white/15 transition cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Format Selector Bar */}
        <div className="bg-[#f9f9fb] px-4 py-2 border-b border-[#e2e2e4] flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] font-bold text-[#717785] flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-[#0F172A]" />
            <span>Formato Impresión:</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPaperSize('58mm')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                paperSize === '58mm'
                  ? 'bg-[#0F172A] text-white shadow-2xs'
                  : 'bg-white text-[#414753] border border-[#e2e2e4] hover:bg-[#f3f3f5]'
              }`}
            >
              58 mm
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('80mm')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                paperSize === '80mm'
                  ? 'bg-[#0F172A] text-white shadow-2xs'
                  : 'bg-white text-[#414753] border border-[#e2e2e4] hover:bg-[#f3f3f5]'
              }`}
            >
              80 mm (Estándar)
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('a4')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                paperSize === 'a4'
                  ? 'bg-[#0F172A] text-white shadow-2xs'
                  : 'bg-white text-[#414753] border border-[#e2e2e4] hover:bg-[#f3f3f5]'
              }`}
            >
              Carta / A4
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          <div
            id="printable-ticket"
            className={`mx-auto bg-white rounded-2xl p-5 border border-dashed border-[#c1c6d6] shadow-xs tabular-nums text-[#1a1c1d] ${
              paperSize === '58mm' ? 'max-w-[260px]' : 'max-w-[320px]'
            }`}
          >
            {/* Logo & Header */}
            <div className="text-center space-y-1 mb-3 border-b border-dashed border-[#c1c6d6] pb-3">
              <div className="w-10 h-10 mx-auto mb-1.5 rounded-xl overflow-hidden flex items-center justify-center bg-slate-50 p-1">
                <CordanoLogo className="w-9 h-9" />
              </div>
              <p className="font-black text-base tracking-wider text-[#0F172A]">CORDANO PARKING OPS</p>
              <p className="text-[11px] text-[#717785] font-sans font-medium">Control de Estacionamiento</p>
              <p className="text-[10px] text-[#717785] font-sans">RUT: 76.892.110-3 • Iquique, Chile</p>
            </div>

            {/* License Plate Banner */}
            <div className="bg-white border-2 border-[#1a1c1d] rounded-2xl p-2.5 mb-3 text-center shadow-2xs">
              <p className="text-[10px] text-[#717785] uppercase tracking-widest font-sans font-extrabold">PATENTE VEHÍCULO</p>
              <p className="text-2xl sm:text-3xl font-black text-[#1a1c1d] tracking-widest my-0.5">{ticket.plateNumber}</p>
              <span className="inline-block bg-[#F1F5F9]/60 text-[#0F172A] text-[11px] px-2.5 py-0.5 rounded-full font-bold font-sans">
                {ticket.vehicleType}
              </span>
            </div>

            {/* Ticket Data Lines */}
            <div className="space-y-1.5 text-xs border-b border-dashed border-[#c1c6d6] pb-3">
              <div className="flex justify-between">
                <span className="text-[#717785]">N° TICKET:</span>
                <span className="font-bold text-[#0F172A]">{ticket.ticketCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#717785]">SLOT ASIGNADO:</span>
                <span className="font-bold text-[#0059b5] bg-[#d7e2ff] px-1.5 rounded">{ticket.slotCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#717785]">FECHA:</span>
                <span>{new Date(ticket.entryTime).toLocaleDateString('es-CL')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#717785]">HORA INGRESO:</span>
                <span className="font-semibold">{new Date(ticket.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#717785]">OPERADOR:</span>
                <span className="truncate max-w-[140px] text-right">{ticket.operatorEntryName}</span>
              </div>
            </div>

            {/* Paid / Check-out Details */}
            {ticket.status === 'pagado' && (
              <div className="mt-3 bg-slate-900 border border-slate-400 rounded-xl p-2.5 space-y-1.5 text-xs text-slate-800">
                <div className="flex justify-between font-bold">
                  <span>ESTADO:</span>
                  <span className="text-slate-800 uppercase font-black">COMPROBANTE PAGADO</span>
                </div>
                {ticket.exitTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-800/80">HORA SALIDA:</span>
                    <span className="font-bold">{new Date(ticket.exitTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-800/80">TIEMPO TOTAL:</span>
                  <span>{ticket.durationMinutes} minutos</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t border-slate-400 pt-1 text-[#1a1c1d]">
                  <span>TOTAL COBRADO:</span>
                  <span className="text-slate-800">${ticket.totalAmount?.toLocaleString('es-CL')} CLP</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#717785]">
                  <span>MEDIO DE PAGO:</span>
                  <span className="uppercase font-semibold text-slate-800">{ticket.paymentMethod}</span>
                </div>
                <div className="text-[9px] text-zinc-600 bg-white/70 p-1.5 rounded-lg border border-slate-400 text-center font-medium leading-tight">
                  * Comprobante de Control. Boleta Fiscal Electrónica SII emitida en POS Transbank.
                </div>
              </div>
            )}

            {/* Simulated Barcode */}
            <div className="mt-3 pt-1 text-center">
              <div className="h-8 bg-[#1a1c1d] mx-auto w-40 flex items-center justify-center rounded">
                <div className="flex space-x-1 items-center h-full px-2">
                  {[4,2,5,1,4,3,2,5,1,4,2,4,3,1,5,2,4,1].map((w, i) => (
                    <div key={i} className="bg-white h-full" style={{ width: `${w}px` }}></div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-[#717785] tabular-nums mt-1">* {ticket.ticketCode} *</p>
              <p className="text-[9px] text-[#9095a5] font-sans mt-0.5">Tolerancia: 10 min de gracia</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STICKY FOOTER ACTIONS (GUARANTEED VISIBLE ON ALL SCREENS) */}
        {/* ========================================================================= */}
        <div className="sticky bottom-0 bg-[#fbfbfc] border-t border-[#e2e2e4] p-3 sm:p-4 z-20 shrink-0 shadow-lg space-y-2">
          
          {/* Main Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            
            {/* Primary Option: Print with System Dialog (Select Thermal or Save to PDF) */}
            <button
              type="button"
              id="btn-print-system-dialog"
              onClick={handleSystemPrint}
              className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-black py-2.5 px-3.5 rounded-xl shadow-md transition flex items-center justify-center space-x-2 text-xs cursor-pointer active:scale-98"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Imprimir (Diálogo Sistema)</span>
            </button>

            {/* Direct Vector PDF Download */}
            <button
              type="button"
              id="btn-download-ticket-pdf"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="w-full bg-[#1a1c1d] hover:bg-[#2d3034] text-white font-bold py-2.5 px-3.5 rounded-xl shadow-xs transition flex items-center justify-center space-x-2 text-xs cursor-pointer active:scale-98"
            >
              {downloadingPdf ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-800" />
                  <span>Descargar Archivo PDF</span>
                </>
              )}
            </button>
          </div>

          {/* Secondary Options: WhatsApp and Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex-1 bg-slate-900 hover:bg-slate-900 text-white font-bold py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer shadow-xs"
            >
              {copiedWhatsApp ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Enviado a WhatsApp</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Enviar por WhatsApp</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#f3f3f5] hover:bg-[#e2e2e4] text-[#414753] font-bold rounded-xl transition text-xs cursor-pointer"
            >
              Cerrar
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

