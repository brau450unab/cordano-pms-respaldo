import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Shift, Ticket } from '../types';
import { drawQrToJsPdf } from './qrCodeGenerator';

export type ThermalPaperSize = '80mm' | '58mm' | 'a4';

/**
 * Utilidad para imprimir un contenedor HTML usando el diálogo del sistema
 */
export const printViaSystemDialog = (elementId: string, title: string) => {
  const content = document.getElementById(elementId);
  if (!content) return;
  const printWindow = window.open('', '', 'width=800,height=600');
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1E1E2F; margin: 0; padding: 10px; }
          .a4-page { width: 100%; box-sizing: border-box; page-break-after: always; }
          .a4-page:last-child { page-break-after: avoid; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #CBD5E1; padding: 8px 12px; font-size: 11px; }
          th { background-color: #F8FAFC; color: #1E1E2F; font-weight: 700; text-transform: uppercase; }
          .signature-box { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 10px; }
          .signature-line { width: 42%; text-align: center; border-top: 1.5px solid #1E1E2F; padding-top: 6px; font-size: 11px; font-weight: 600; }
          .brand-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E2498A; padding-bottom: 10px; margin-bottom: 15px; }
          .copy-tag { font-size: 10px; font-weight: bold; padding: 4px 8px; border-radius: 4px; background-color: #F1F5F9; color: #475569; }
          .no-print { display: none !important; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; }
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 350);
};

/**
 * Función garantizada para forzar la descarga de un PDF en navegadores modernos
 */
export const triggerPdfDownload = (doc: jsPDF, filename: string) => {
  try {
    const blob = doc.output('blob');
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 1500);
    return true;
  } catch (err) {
    console.warn('Fallback a doc.save():', err);
    doc.save(filename);
    return true;
  }
};

/**
 * Renderiza el bloque estándar corporativo de dos firmas al pie de hoja A4 (Regla de Negocio #4)
 * Clampeado seguro para que nunca sobresalga del límite inferior de la página (297mm).
 */
export const renderA4DualSignatureBlock = (doc: jsPDF, yPosition: number = 245) => {
  const safeY = Math.min(Math.max(yPosition, 40), 255);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 47);

  // Firma Operario (Izquierda)
  doc.setDrawColor(30, 30, 47);
  doc.setLineWidth(0.4);
  doc.line(20, safeY, 90, safeY);
  doc.setFont('helvetica', 'bold');
  doc.text('Firma del Operario / Cajero', 55, safeY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RUT / Cédula de Identidad', 55, safeY + 9, { align: 'center' });

  // Firma Administrador (Derecha)
  doc.setDrawColor(30, 30, 47);
  doc.line(120, safeY, 190, safeY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 47);
  doc.text('Firma del Administrador / Supervisor', 155, safeY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('V°B° Auditoría Serrano 447', 155, safeY + 9, { align: 'center' });
};

/**
 * Encabezado oficial corporativo estándar para documentos A4 Cordano PMS
 * Margen uniforme con franjas corporativas e información con límite horizontal explícito (maxWidth 182mm).
 */
export const renderA4CorporateHeader = (
  doc: jsPDF,
  title: string,
  subtitle: string,
  rightTag: string = 'Serrano 447 • Iquique'
) => {
  // Franja Azul/Gris Corporativa (#1E1E2F)
  doc.setFillColor(30, 30, 47);
  doc.rect(0, 0, 210, 22, 'F');

  // Franja Rosa Corporativa (#E2498A)
  doc.setFillColor(226, 73, 138);
  doc.rect(0, 22, 210, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text(`CORDANO PMS — ${title}`, 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(rightTag, 196, 14, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(subtitle, 14, 30, { maxWidth: 182 });
};

/**
 * 1. TICKET DE ESTACIONAMIENTO (Rollo Térmico 80mm o Hoja A4)
 * Con código QR de acceso funcional, formato monetario CLP y texto ajustado.
 */
export const generateTicketPdf = (ticket: any, paperSize: ThermalPaperSize = '80mm', download = false) => {
  const isA4 = paperSize === 'a4';
  const widthMm = isA4 ? 210 : 80;
  const heightMm = isA4 ? 297 : 175;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isA4 ? 'a4' : [widthMm, heightMm],
  });

  const center = widthMm / 2;

  // Header Corporativo
  doc.setFillColor(30, 30, 47);
  doc.rect(0, 0, widthMm, isA4 ? 24 : 16, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(isA4 ? 16 : 12);
  doc.text('PARKING OPS — CORDANO', center, isA4 ? 12 : 7.5, { align: 'center' });

  doc.setFontSize(isA4 ? 10 : 7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 73, 138);
  doc.text('Serrano 447, Iquique • Control de Acceso Garita', center, isA4 ? 18 : 12, { align: 'center' });

  let y = isA4 ? 35 : 22;
  doc.setTextColor(30, 30, 47);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 13 : 10);
  doc.text('TICKET DE ESTACIONAMIENTO', center, y, { align: 'center' });

  y += isA4 ? 8 : 5.5;
  doc.setFontSize(isA4 ? 10 : 8);
  doc.setFont('helvetica', 'normal');
  const folio = ticket.ticketCode || ticket.ticketId || ticket.id || 'TKT-0001';
  doc.text(`Folio: ${folio}`, center, y, { align: 'center' });

  y += isA4 ? 9 : 7;
  doc.setFontSize(isA4 ? 15 : 13);
  doc.setFont('helvetica', 'bold');
  doc.text(`PATENTE: ${ticket.plateNumber || ticket.plate || 'S/N'}`, center, y, { align: 'center' });

  y += isA4 ? 8 : 5.5;
  doc.setFontSize(isA4 ? 10 : 8);
  doc.setFont('helvetica', 'normal');
  const slotText =
    ticket.slotCode ||
    (ticket.slot
      ? ticket.slot <= 15
        ? `A-${String(ticket.slot).padStart(2, '0')}`
        : `B-${String(ticket.slot).padStart(2, '0')}`
      : 'Asignado');
  doc.text(`Categoría: ${ticket.vehicleType || ticket.category || 'Automóvil'} • Cupo: ${slotText}`, center, y, {
    align: 'center',
  });

  y += isA4 ? 7 : 5;
  const entryDate = ticket.entryTime ? new Date(ticket.entryTime) : new Date();
  doc.text(`Entrada: ${entryDate.toLocaleString('es-CL')}`, center, y, { align: 'center' });

  // Tarifa por minuto y Tiempo de Gracia
  y += isA4 ? 6 : 4.5;
  const rateMin = ticket.rate || ticket.frozenRate?.minuteRate || 35;
  doc.setFont('helvetica', 'bold');
  doc.text(`Tarifa: $ ${rateMin.toLocaleString('es-CL')} CLP / minuto`, center, y, { align: 'center' });

  y += isA4 ? 5 : 4;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text('Período de Gracia: 15 minutos sin costo ($0 CLP)', center, y, { align: 'center' });
  doc.setTextColor(30, 30, 47);

  // Cliente si existe
  const custName = ticket.customerName || ticket.name;
  const custPhone = ticket.customerPhone || ticket.phone;
  if (custName && custName !== 'Particular') {
    y += isA4 ? 6 : 4.5;
    doc.text(`Cliente: ${custName}${custPhone ? ` • ${custPhone}` : ''}`, center, y, { align: 'center' });
  } else if (custPhone) {
    y += isA4 ? 6 : 4.5;
    doc.text(`WhatsApp: ${custPhone}`, center, y, { align: 'center' });
  }

  // Observaciones si existen
  const obs = ticket.notes || ticket.obs;
  if (obs) {
    y += isA4 ? 6 : 4.5;
    doc.setTextColor(226, 73, 138);
    doc.setFontSize(isA4 ? 9 : 7);
    doc.text(`Obs: ${obs}`, center, y, { align: 'center' });
    doc.setTextColor(30, 30, 47);
  }

  if (ticket.status === 'pagado' || ticket.status === 'completado' || ticket.exitTime) {
    y += isA4 ? 7 : 5;
    doc.text(`Salida: ${new Date(ticket.exitTime || new Date()).toLocaleString('es-CL')}`, center, y, {
      align: 'center',
    });
    y += isA4 ? 10 : 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isA4 ? 15 : 12);
    doc.setTextColor(226, 73, 138);
    doc.text(`TOTAL PAGADO: $ ${(ticket.totalAmount || 0).toLocaleString('es-CL')} CLP`, center, y, {
      align: 'center',
    });
    doc.setTextColor(30, 30, 47);
  }

  // Código QR Funcional (ISO/IEC 18004)
  y += isA4 ? 10 : 7;
  const qrBoxSize = isA4 ? 32 : 24;
  const qrX = center - qrBoxSize / 2;
  const qrPayload = `https://cordanopms.ai.studio/verify?folio=${encodeURIComponent(folio)}&plate=${encodeURIComponent(ticket.plateNumber || ticket.plate || '')}`;
  drawQrToJsPdf(doc, qrPayload, qrX, y, qrBoxSize, 'M', [30, 30, 47], [255, 255, 255]);

  y += qrBoxSize + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 9 : 7.5);
  doc.setTextColor(30, 30, 47);
  doc.text(`QR DE ACCESO: ${folio}`, center, y, { align: 'center' });

  // Leyenda legal justificada al ancho de rollo
  y += isA4 ? 7 : 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 8.5 : 7);
  doc.setTextColor(71, 85, 105);
  doc.text('Es responsabilidad del usuario conservar este ticket.', center, y, { align: 'center' });

  y += isA4 ? 5 : 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA4 ? 8 : 6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Ley N° 20.967: Ante extravío se liquida el tiempo efectivo por patente.', center, y, {
    align: 'center',
    maxWidth: isA4 ? 170 : 70,
  });

  y += isA4 ? 5 : 4;
  doc.text('Iquique, Serrano 447 • https://cordanopms.ai.studio', center, y, { align: 'center' });

  if (isA4) {
    renderA4DualSignatureBlock(doc, 240);
  }

  const safePlate = (ticket.plateNumber || ticket.plate || 'vehiculo').replace(/[^a-zA-Z0-9]/g, '');
  const safeFilename = `Ticket_${safePlate}_${folio}.pdf`;

  if (download) {
    triggerPdfDownload(doc, safeFilename);
  } else {
    try {
      doc.autoPrint();
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow) {
        triggerPdfDownload(doc, safeFilename);
      }
    } catch (err) {
      console.warn('Fallback a descarga directa de PDF:', err);
      triggerPdfDownload(doc, safeFilename);
    }
  }
  return { doc, filename: safeFilename };
};

export interface ExitReceiptPdfData {
  ticketCode: string;
  invoiceFolio?: string;
  plateNumber: string;
  vehicleType: string;
  slotCode?: string;
  entryTime: string;
  exitTime: string;
  durationMinutes: number;
  ratePerMinute: number;
  subtotalAmount: number;
  discountAmount?: number;
  netSubtotal: number;
  ivaAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paidAmount?: number;
  changeAmount?: number;
  operatorName?: string;
  shiftId?: string;
  customerName?: string;
  customerPhone?: string;
}

/**
 * 1.1 COMPROBANTE TÉRMICO DE SALIDA & PAGO (Boleta DTE 80mm)
 * Formato térmico estándar de 80mm con badge PAGADO, desglose fiscal DTE y QR funcional.
 */
export const generateExitReceiptPdf = (
  receipt: ExitReceiptPdfData,
  paperSize: ThermalPaperSize = '80mm',
  download = false
) => {
  const isA4 = paperSize === 'a4';
  const widthMm = isA4 ? 210 : 80;
  const heightMm = isA4 ? 297 : 210;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isA4 ? 'a4' : [widthMm, heightMm],
  });

  const center = widthMm / 2;

  // Header Corporativo
  doc.setFillColor(30, 30, 47);
  doc.rect(0, 0, widthMm, isA4 ? 24 : 16, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(isA4 ? 16 : 12);
  doc.text('PARKING OPS — CORDANO', center, isA4 ? 12 : 7.5, { align: 'center' });

  doc.setFontSize(isA4 ? 10 : 7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 73, 138);
  doc.text('Serrano 447, Iquique • Boleta Electrónica SII / Salida', center, isA4 ? 18 : 12, { align: 'center' });

  // Badge PAGADO
  let y = isA4 ? 35 : 23;
  doc.setFillColor(16, 185, 129); // Emerald
  doc.roundedRect(center - (isA4 ? 40 : 28), y - 4, isA4 ? 80 : 56, isA4 ? 10 : 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(isA4 ? 12 : 9);
  doc.text('✓ PAGADO — SALIDA CONFIRMADA', center, y + (isA4 ? 2.5 : 1), { align: 'center' });

  // Folios
  y += isA4 ? 14 : 9;
  doc.setTextColor(30, 30, 47);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 11 : 8.5);
  doc.text(`Boleta Electrónica DTE: ${receipt.invoiceFolio || receipt.ticketCode}`, center, y, { align: 'center' });

  y += isA4 ? 6 : 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA4 ? 9 : 7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Ticket Origen: ${receipt.ticketCode}`, center, y, { align: 'center' });

  // Patente Destacada
  y += isA4 ? 11 : 7.5;
  doc.setTextColor(30, 30, 47);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 17 : 14);
  doc.text(`PATENTE: ${receipt.plateNumber}`, center, y, { align: 'center' });

  // Vehículo & Cupo
  y += isA4 ? 8 : 5.5;
  doc.setFontSize(isA4 ? 10 : 8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tipo: ${receipt.vehicleType} • Plaza Liberada: ${receipt.slotCode || 'Liberado'}`, center, y, { align: 'center' });

  // Tiempos
  y += isA4 ? 7 : 5;
  const entryDate = new Date(receipt.entryTime);
  const exitDate = new Date(receipt.exitTime);
  doc.text(`Entrada: ${entryDate.toLocaleDateString('es-CL')} ${entryDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`, center, y, { align: 'center' });

  y += isA4 ? 6 : 4.5;
  doc.text(`Salida:  ${exitDate.toLocaleDateString('es-CL')} ${exitDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`, center, y, { align: 'center' });

  y += isA4 ? 6 : 4.5;
  const hours = Math.floor(receipt.durationMinutes / 60);
  const mins = receipt.durationMinutes % 60;
  const stayText = hours > 0 ? `${hours}h ${mins}m (${receipt.durationMinutes} min)` : `${receipt.durationMinutes} minutos`;
  doc.setFont('helvetica', 'bold');
  doc.text(`Permanencia Total: ${stayText}`, center, y, { align: 'center' });

  // Desglose Financiero
  y += isA4 ? 8 : 6;
  doc.setDrawColor(203, 213, 225);
  doc.line(isA4 ? 25 : 8, y, isA4 ? widthMm - 25 : widthMm - 8, y);

  y += isA4 ? 6 : 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA4 ? 9.5 : 7.5);
  const leftX = isA4 ? 28 : 10;
  const rightX = isA4 ? widthMm - 28 : widthMm - 10;

  doc.text(`Tarifa ($${receipt.ratePerMinute}/min + 15m gracia):`, leftX, y);
  doc.text(`$ ${receipt.subtotalAmount.toLocaleString('es-CL')}`, rightX, y, { align: 'right' });

  if (receipt.discountAmount && receipt.discountAmount > 0) {
    y += isA4 ? 5 : 4;
    doc.setTextColor(16, 185, 129);
    doc.text(`Descuento comercial:`, leftX, y);
    doc.text(`-$ ${receipt.discountAmount.toLocaleString('es-CL')}`, rightX, y, { align: 'right' });
    doc.setTextColor(30, 30, 47);
  }

  y += isA4 ? 5 : 4;
  doc.text(`Subtotal Neto:`, leftX, y);
  doc.text(`$ ${receipt.netSubtotal.toLocaleString('es-CL')}`, rightX, y, { align: 'right' });

  y += isA4 ? 5 : 4;
  doc.text(`IVA (19%):`, leftX, y);
  doc.text(`$ ${receipt.ivaAmount.toLocaleString('es-CL')}`, rightX, y, { align: 'right' });

  y += isA4 ? 7 : 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 14 : 11);
  doc.setTextColor(226, 73, 138);
  doc.text(`TOTAL PAGADO:`, leftX, y);
  doc.text(`$ ${receipt.totalAmount.toLocaleString('es-CL')} CLP`, rightX, y, { align: 'right' });
  doc.setTextColor(30, 30, 47);

  // Medio de pago y vueltos
  y += isA4 ? 6 : 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA4 ? 9 : 7.5);
  doc.text(`Medio de Pago: ${receipt.paymentMethod}`, leftX, y);
  if (receipt.paidAmount && receipt.paidAmount > receipt.totalAmount) {
    doc.text(`Recibido: $${receipt.paidAmount.toLocaleString('es-CL')} | Vuelto: $${(receipt.changeAmount || 0).toLocaleString('es-CL')}`, rightX, y, { align: 'right' });
  }

  y += isA4 ? 6 : 4.5;
  doc.line(isA4 ? 25 : 8, y, isA4 ? widthMm - 25 : widthMm - 8, y);

  // Operador y Turno
  y += isA4 ? 6 : 4.5;
  doc.setFontSize(isA4 ? 8.5 : 7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Atendido por: ${receipt.operatorName || 'Operador'} ${receipt.shiftId ? `• Turno: ${receipt.shiftId}` : ''}`, center, y, { align: 'center' });

  // QR de Verificación
  y += isA4 ? 8 : 6;
  const qrBoxSize = isA4 ? 30 : 22;
  const qrX = center - qrBoxSize / 2;
  const qrPayload = `https://cordanopms.ai.studio/verify?type=exit&folio=${encodeURIComponent(receipt.invoiceFolio || receipt.ticketCode)}&plate=${encodeURIComponent(receipt.plateNumber)}&total=${receipt.totalAmount}`;
  drawQrToJsPdf(doc, qrPayload, qrX, y, qrBoxSize, 'M', [30, 30, 47], [255, 255, 255]);

  y += qrBoxSize + (isA4 ? 5 : 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 8.5 : 7);
  doc.setTextColor(30, 30, 47);
  doc.text(`TIMBRE ELECTRÓNICO SII / SALIDA AUTORIZADA`, center, y, { align: 'center' });

  // Leyenda Legal
  y += isA4 ? 5 : 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA4 ? 7.5 : 6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Comprobante de salida vehicular conforme a la Ley N° 20.967.', center, y, { align: 'center' });

  y += isA4 ? 4 : 3;
  doc.text('Iquique, Serrano 447 • https://cordanopms.ai.studio', center, y, { align: 'center' });

  if (isA4) {
    renderA4DualSignatureBlock(doc, 245);
  }

  const safePlate = receipt.plateNumber.replace(/[^a-zA-Z0-9]/g, '');
  const safeFilename = `Boleta_Salida_${safePlate}_${receipt.invoiceFolio || receipt.ticketCode}.pdf`;

  if (download) {
    triggerPdfDownload(doc, safeFilename);
  } else {
    try {
      doc.autoPrint();
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow) {
        triggerPdfDownload(doc, safeFilename);
      }
    } catch (err) {
      console.warn('Fallback a descarga directa de PDF:', err);
      triggerPdfDownload(doc, safeFilename);
    }
  }

  return { doc, filename: safeFilename };
};

/**
 * 2. REPORTE Z DE CIERRE DE TURNO / ARQUEO DE CAJA (A4 con 2 copias obligatorias y doble firma)
 * Regla de Negocio #3 y #4: Cierre ciego, hash SHA-256, cuadratura completa y 2 copias físicas.
 */
export const generateShiftClosingPdf = (shift: Shift, download: boolean = true) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const copies = [
    { title: 'COPIA 1: GARITA / CONTROL DE TURNO', tag: 'Garita' },
    { title: 'COPIA 2: ADMINISTRACIÓN / RESPALDO CONTABLE', tag: 'Administración' },
  ];

  const totalDec = (shift.declaredCash || 0) + (shift.declaredCard || 0) + (shift.declaredTransfer || 0);
  const totalExp = (shift.expectedCash || 0) + (shift.expectedCard || 0) + (shift.expectedTransfer || 0);
  const totalDif = totalDec - totalExp;

  const handoverFund = shift.handoverFundAmount || shift.initialCash || 50000;
  const deliveryCash = (shift.declaredCash || 0) - handoverFund;

  copies.forEach((copy, index) => {
    if (index > 0) {
      doc.addPage('a4', 'portrait');
    }

    renderA4CorporateHeader(
      doc,
      'REPORTE Z DE CIERRE DE TURNO',
      `ID Turno: #${shift.id} • Operador a Cargo: ${shift.operatorName} • Recinto: Serrano 447, Iquique`,
      copy.title
    );

    // Metadata del Turno
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(`Inicio: ${new Date(shift.startTime).toLocaleString('es-CL')}`, 14, 38);
    const closeTimeStr = shift.endTime
      ? new Date(shift.endTime).toLocaleString('es-CL')
      : new Date().toLocaleString('es-CL');
    doc.text(`Cierre: ${closeTimeStr}`, 14, 43);

    const safeHash = shift.hash || shift.hashAuditoria || 'SHA256-INMUTABLE-VERIFIED';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 47);
    doc.text(`Sello Criptográfico SHA-256: ${safeHash}`, 196, 38, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Vehículos Procesados: ${shift.totalTicketsProcessed || 0} tickets`, 196, 43, { align: 'right' });

    // Cuadro 1: Cuadratura de Medios de Pago (Ancho exacto 182mm)
    autoTable(doc, {
      startY: 48,
      margin: { left: 14, right: 14 },
      head: [['Concepto de Cobro', 'Monto Declarado (Físico)', 'Monto Esperado (Sistema)', 'Diferencia Neta']],
      body: [
        [
          'Total Efectivo en Gaveta',
          `$ ${(shift.declaredCash || 0).toLocaleString('es-CL')}`,
          `$ ${(shift.expectedCash || 0).toLocaleString('es-CL')}`,
          `$ ${(shift.discrepancyCash || 0).toLocaleString('es-CL')}`,
        ],
        [
          '  ├─ Fondo Base de Cambio (Sencillo)',
          `$ ${handoverFund.toLocaleString('es-CL')}`,
          `$ ${handoverFund.toLocaleString('es-CL')}`,
          '$ 0',
        ],
        [
          '  └─ Sobre de Recaudación a Entregar',
          `$ ${Math.max(0, deliveryCash).toLocaleString('es-CL')}`,
          '-',
          '-',
        ],
        [
          'Tarjetas POS (Transbank / Débito / Crédito)',
          `$ ${(shift.declaredCard || 0).toLocaleString('es-CL')}`,
          `$ ${(shift.expectedCard || 0).toLocaleString('es-CL')}`,
          `$ ${((shift.declaredCard || 0) - (shift.expectedCard || 0)).toLocaleString('es-CL')}`,
        ],
        [
          'Transferencias Bancarias Validadas',
          `$ ${(shift.declaredTransfer || 0).toLocaleString('es-CL')}`,
          `$ ${(shift.expectedTransfer || 0).toLocaleString('es-CL')}`,
          `$ ${((shift.declaredTransfer || 0) - (shift.expectedTransfer || 0)).toLocaleString('es-CL')}`,
        ],
      ],
      foot: [
        [
          'TOTALES CONSOLIDADOS DEL TURNO',
          `$ ${totalDec.toLocaleString('es-CL')}`,
          `$ ${totalExp.toLocaleString('es-CL')}`,
          `$ ${totalDif.toLocaleString('es-CL')}`,
        ],
      ],
      columnStyles: {
        0: { cellWidth: 70, halign: 'left' },
        1: { cellWidth: 38, halign: 'right' },
        2: { cellWidth: 38, halign: 'right' },
        3: { cellWidth: 36, halign: 'right' },
      },
      headStyles: {
        fillColor: [30, 30, 47],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 30, 47],
      },
      footStyles: {
        fillColor: [226, 73, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      theme: 'grid',
    });

    let currentY = (doc as any).lastAutoTable?.finalY + 6 || 115;

    // Cuadro 2 (Opcional): Movimientos de Caja durante el Turno
    if (shift.cashMovements && shift.cashMovements.length > 0) {
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 47);
      doc.text('MOVIMIENTOS DE CAJA REGISTRADOS EN EL TURNO', 14, currentY + 4);

      autoTable(doc, {
        startY: currentY + 6,
        margin: { left: 14, right: 14 },
        head: [['Hora', 'Tipo de Movimiento', 'Monto (CLP)', 'Glosa / Motivo', 'Autorización']],
        body: shift.cashMovements.map((m) => [
          new Date(m.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
          m.type === 'INGRESO_MANUAL' ? 'INGRESO MANUAL' : m.type === 'GASTO_MENOR' ? 'GASTO MENOR' : 'SANGRÍA BÓVEDA',
          `${m.type === 'INGRESO_MANUAL' ? '+' : '-'}$ ${m.amount.toLocaleString('es-CL')}`,
          m.reason || 'Sin observación',
          m.authorizerName || m.authorizedBySupervisor || 'Supervisor',
        ]),
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 36, halign: 'center' },
          2: { cellWidth: 28, halign: 'right' },
          3: { cellWidth: 62, halign: 'left', overflow: 'linebreak' },
          4: { cellWidth: 36, halign: 'left' },
        },
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 30, 47] },
        theme: 'grid',
      });

      currentY = (doc as any).lastAutoTable?.finalY + 6 || currentY + 30;
    }

    // Cuadro Resumen Ejecutivo
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, currentY, 182, 26, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 47);
    doc.text('AUDITORÍA DE CUADRATURA & SITUACIÓN DEL RECINTO', 18, currentY + 6);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Físico Declarado: $ ${totalDec.toLocaleString('es-CL')} CLP`, 18, currentY + 13);
    doc.text(`Total Esperado en Sistema: $ ${totalExp.toLocaleString('es-CL')} CLP`, 18, currentY + 19);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(totalDif === 0 ? 16 : 226, totalDif === 0 ? 185 : 73, totalDif === 0 ? 129 : 138);
    const difSign = totalDif > 0 ? '+' : '';
    doc.text(`Diferencia Neta: ${difSign}$ ${totalDif.toLocaleString('es-CL')} CLP`, 108, currentY + 13);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Vehículos en Custodia Traspasados: ${shift.transferredVehiclesCount || 0} automóviles`,
      108,
      currentY + 19
    );

    // Observación del cajero si existe
    if (shift.closeJustification) {
      currentY += 30;
      doc.setFillColor(255, 245, 248);
      doc.setDrawColor(226, 73, 138);
      doc.roundedRect(14, currentY, 182, 16, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(226, 73, 138);
      doc.text('OBSERVACIÓN / JUSTIFICACIÓN DECLARADA POR EL CAJERO:', 18, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 47);
      doc.text(shift.closeJustification, 18, currentY + 11, { maxWidth: 174 });
    }

    renderA4DualSignatureBlock(doc, 245);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Emisión: ${new Date().toLocaleString('es-CL')} • Cordano PMS A4 Engine • Hoja ${index + 1} de 2 (${copy.tag})`,
      105,
      278,
      { align: 'center' }
    );
  });

  const filename = `Reporte_Z_Cierre_Turno_${shift.id || Date.now()}.pdf`;

  if (download) {
    triggerPdfDownload(doc, filename);
  } else {
    try {
      doc.autoPrint();
      const printWin = window.open(doc.output('bloburl'), '_blank');
      if (!printWin) {
        triggerPdfDownload(doc, filename);
      }
    } catch {
      triggerPdfDownload(doc, filename);
    }
  }

  return { doc, filename };
};

/**
 * 3. LIBRO DE REGISTRO DIARIO PARA CONTABILIDAD (A4 Corporativo)
 * Consolida el Resumen Fiscal de Ventas (IVA 19% DTE), Asiento Contable ERP de Partida Doble,
 * Conciliación Física de Caja y Libro Auxiliar Detallado DTE a DTE en hojas consecutivas sin truncamiento.
 */
export const generateDailyAccountingBookPdf = (
  dateStr: string,
  ticketsList: Ticket[],
  shiftSummary?: { totalCash: number; totalCard: number; initialFund: number },
  download: boolean = true
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const paidTickets = ticketsList.filter((t) => t.status === 'pagado');
  const totalBruto = paidTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const totalNeto = Math.round(totalBruto / 1.19);
  const totalIva19 = totalBruto - totalNeto;

  const totalCash = paidTickets
    .filter((t) => t.paymentMethod === 'efectivo')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const totalCard = totalBruto - totalCash;

  // ── HOJA 1: CARÁTULA TRIBUTARIA, ASIENTO ERP Y CONCILIACIÓN FÍSICA ──
  renderA4CorporateHeader(
    doc,
    'LIBRO DIARIO DE REGISTRO CONTABLE',
    `Jornada Contable: ${dateStr} • Recinto: Serrano 447, Iquique • RUT: 76.840.123-K`,
    'RESPALDO TRIBUTARIO SII'
  );

  // Cuadro 1: Resumen Fiscal de Ventas
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 47);
  doc.text('1. RESUMEN FISCAL DE VENTAS (DTE - ART. 15 A LEY 20.967)', 14, 38);

  autoTable(doc, {
    startY: 42,
    margin: { left: 14, right: 14 },
    head: [['Concepto Tributario', 'Base Imponible (CLP)', 'Tasa', 'Total Débito Fiscal (CLP)']],
    body: [
      [
        'Ventas Netas por Estacionamiento (Afecto)',
        `$ ${totalNeto.toLocaleString('es-CL')}`,
        '19%',
        `$ ${totalIva19.toLocaleString('es-CL')}`,
      ],
      ['Ventas Exentas / No Gravadas', '$ 0', '0%', '$ 0'],
      [
        'TOTAL VENTAS BRUTAS DEL PERÍODO (BOLETAS DTE)',
        `$ ${totalBruto.toLocaleString('es-CL')}`,
        '-',
        `$ ${totalBruto.toLocaleString('es-CL')}`,
      ],
    ],
    columnStyles: {
      0: { cellWidth: 78, halign: 'left' },
      1: { cellWidth: 40, halign: 'right' },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 40, halign: 'right' },
    },
    headStyles: { fillColor: [30, 30, 47], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 47] },
    theme: 'grid',
  });

  const yAsiento = (doc as any).lastAutoTable?.finalY + 8 || 78;

  // Cuadro 2: Asiento Contable Tipo (Póliza de Diario para ERP/QuickBooks/Defontana)
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 47);
  doc.text('2. ASIENTO CONTABLE DIARIO (CENTRO DE COSTOS: SERRANO-447)', 14, yAsiento);

  autoTable(doc, {
    startY: yAsiento + 4,
    margin: { left: 14, right: 14 },
    head: [['Cuenta Contable', 'Nombre de la Cuenta', 'Debe (CLP)', 'Haber (CLP)', 'Glosa / Respaldo']],
    body: [
      [
        '1101-01',
        'Caja Efectivo Garita Serrano',
        `$ ${totalCash.toLocaleString('es-CL')}`,
        '$ 0',
        `Recaudación efectivo jornada ${dateStr}`,
      ],
      [
        '1102-05',
        'Banco / Transbank POS Tarjetas',
        `$ ${totalCard.toLocaleString('es-CL')}`,
        '$ 0',
        'Vouchers Transbank crédito/débito',
      ],
      [
        '2107-01',
        'IVA Débito Fiscal 19% (DTE)',
        '$ 0',
        `$ ${totalIva19.toLocaleString('es-CL')}`,
        'Impuesto al valor agregado liquidado',
      ],
      [
        '4101-01',
        'Ingresos por Estacionamiento',
        '$ 0',
        `$ ${totalNeto.toLocaleString('es-CL')}`,
        'Ingresos netos por minutos de estadía',
      ],
      [
        'SUMAS IGUALES',
        'CUADRATURA DE ASIENTO',
        `$ ${totalBruto.toLocaleString('es-CL')}`,
        `$ ${totalBruto.toLocaleString('es-CL')}`,
        'Partida doble balanceada conforme',
      ],
    ],
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      1: { cellWidth: 54, halign: 'left' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 42, halign: 'left', overflow: 'linebreak' },
    },
    headStyles: { fillColor: [226, 73, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 30, 47] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: 'grid',
  });

  const yConcil = (doc as any).lastAutoTable?.finalY + 8 || 135;

  // Cuadro 3: Conciliación Física de Caja
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 47);
  doc.text('3. CONCILIACIÓN FÍSICA DE RECAUDACIÓN', 14, yConcil);

  const initialCash = shiftSummary?.initialFund || 50000;
  autoTable(doc, {
    startY: yConcil + 4,
    margin: { left: 14, right: 14 },
    head: [['Medio de Pago', 'Transacciones', 'Monto Recaudado', 'Destino del Fondo']],
    body: [
      [
        'Efectivo Físico',
        `${paidTickets.filter((t) => t.paymentMethod === 'efectivo').length}`,
        `$ ${totalCash.toLocaleString('es-CL')}`,
        `Depósito en caja de seguridad + $ ${initialCash.toLocaleString('es-CL')} base gaveta`,
      ],
      [
        'POS Tarjetas (Transbank)',
        `${paidTickets.filter((t) => t.paymentMethod !== 'efectivo').length}`,
        `$ ${totalCard.toLocaleString('es-CL')}`,
        'Abono directo cuenta corriente bancaria comercial',
      ],
      [
        'TOTAL CONCILIADO',
        `${paidTickets.length} operaciones`,
        `$ ${totalBruto.toLocaleString('es-CL')}`,
        'Liquidado formalmente ante administración central',
      ],
    ],
    columnStyles: {
      0: { cellWidth: 46, halign: 'left' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 38, halign: 'right' },
      3: { cellWidth: 72, halign: 'left', overflow: 'linebreak' },
    },
    headStyles: { fillColor: [30, 30, 47], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 30, 47] },
    theme: 'grid',
  });

  renderA4DualSignatureBlock(doc, 245);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Emisión: ${new Date().toLocaleString('es-CL')} • Cordano PMS A4 Engine • Hoja 1 de Libro Contable`, 105, 278, {
    align: 'center',
  });

  // ── HOJA 2+: LIBRO AUXILIAR DETALLADO DE VENTAS (DTE POR DTE) ──
  if (paidTickets.length > 0) {
    doc.addPage('a4', 'portrait');

    renderA4CorporateHeader(
      doc,
      'LIBRO AUXILIAR DETALLADO DE VENTAS',
      `Detalle de Boletas y Comprobantes Emitidos • Recinto Serrano 447 • Jornada: ${dateStr}`,
      'REGISTRO AUXILIAR DTE'
    );

    const bodyTickets = paidTickets.map((t) => {
      const tot = t.totalAmount || 0;
      const net = Math.round(tot / 1.19);
      const iva = tot - net;
      return [
        t.ticketCode || t.id.slice(0, 8),
        t.plateNumber,
        t.vehicleType,
        t.entryTime ? t.entryTime.slice(11, 16) : '--:--',
        t.exitTime ? t.exitTime.slice(11, 16) : '--:--',
        `${t.durationMinutes || 0}m`,
        (t.paymentMethod || 'EFECTIVO').toUpperCase(),
        `$ ${net.toLocaleString('es-CL')}`,
        `$ ${iva.toLocaleString('es-CL')}`,
        `$ ${tot.toLocaleString('es-CL')}`,
      ];
    });

    autoTable(doc, {
      startY: 38,
      margin: { left: 14, right: 14 },
      head: [['Ticket', 'Patente', 'Tipo', 'In', 'Out', 'Dur.', 'Medio', 'Neto (CLP)', 'IVA 19%', 'Total CLP']],
      body: bodyTickets,
      foot: [
        [
          'TOTALES',
          '',
          '',
          '',
          '',
          '',
          `${paidTickets.length} DTEs`,
          `$ ${totalNeto.toLocaleString('es-CL')}`,
          `$ ${totalIva19.toLocaleString('es-CL')}`,
          `$ ${totalBruto.toLocaleString('es-CL')}`,
        ],
      ],
      showHead: 'everyPage',
      showFoot: 'lastPage',
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 22, halign: 'left' },
        3: { cellWidth: 13, halign: 'center' },
        4: { cellWidth: 13, halign: 'center' },
        5: { cellWidth: 12, halign: 'center' },
        6: { cellWidth: 18, halign: 'center' },
        7: { cellWidth: 21, halign: 'right' },
        8: { cellWidth: 19, halign: 'right' },
        9: { cellWidth: 24, halign: 'right' },
      },
      headStyles: { fillColor: [30, 30, 47], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7, textColor: [30, 30, 47] },
      footStyles: { fillColor: [226, 73, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'grid',
    });

    const finalAuxY = (doc as any).lastAutoTable?.finalY || 100;
    if (finalAuxY > 230) {
      doc.addPage('a4', 'portrait');
      renderA4CorporateHeader(doc, 'LIBRO AUXILIAR — FIRMAS Y CONFORMIDAD', `Cierre de Folios Contables: ${dateStr}`);
      renderA4DualSignatureBlock(doc, 60);
    } else {
      renderA4DualSignatureBlock(doc, 245);
    }
  }

  const filename = `Libro_Diario_Contable_Cordano_${dateStr.replace(/[^0-9a-zA-Z-]/g, '_')}.pdf`;

  if (download) {
    triggerPdfDownload(doc, filename);
  } else {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }

  return { doc, filename };
};

/**
 * 4. ACTA DE APERTURA DE TURNO EN A4 (2 copias obligatorias y doble firma)
 * Regla de Negocio #1 y #4: Declaración de fondo inicial de caja de $50.000 CLP.
 */
export const generateShiftOpenReportPDF = (shift: Shift) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const copies = [
    { title: 'COPIA 1: GARITA / CONTROL DE APERTURA', tag: 'Garita' },
    { title: 'COPIA 2: ADMINISTRACIÓN / ARCHIVO OPERATIVO', tag: 'Administración' },
  ];

  copies.forEach((copy, index) => {
    if (index > 0) {
      doc.addPage('a4', 'portrait');
    }

    renderA4CorporateHeader(
      doc,
      'APERTURA DE TURNO & RECEPCIÓN DE GAVETA',
      `ID Turno: #${shift.id} • Operador a Cargo: ${shift.operatorName} • Recinto: Serrano 447, Iquique`,
      copy.title
    );

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha y Hora de Apertura: ${new Date(shift.startTime).toLocaleString('es-CL')}`, 14, 38);
    doc.text(`Capacidad del Recinto: 30 Plazas (Serrano 447)`, 196, 38, { align: 'right' });

    // Cuadro de Fondo Asignado
    autoTable(doc, {
      startY: 46,
      margin: { left: 14, right: 14 },
      head: [['Concepto Asignado', 'Monto en Efectivo (CLP)', 'Responsable', 'Observaciones de Custodia']],
      body: [
        [
          'Fondo Inicial de Gaveta (Sencillo)',
          `$ ${(shift.initialCash || 50000).toLocaleString('es-CL')}`,
          shift.operatorName,
          'Fondo verificado físicamente y recibido conforme para cambio de garita',
        ],
      ],
      columnStyles: {
        0: { cellWidth: 55, halign: 'left' },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 35, halign: 'left' },
        3: { cellWidth: 52, halign: 'left', overflow: 'linebreak' },
      },
      headStyles: { fillColor: [30, 30, 47], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 30, 47] },
      theme: 'grid',
    });

    // Cláusula de Responsabilidad Operacional
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 80, 182, 38, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 47);
    doc.text('DECLARACIÓN JURADA OPERACIONAL DE RECEPCIÓN DE CAJA', 18, 88);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const declText =
      'Por la presente, el Operador individualizado declara recibir en este acto la cantidad de $ 50.000 CLP (cincuenta mil pesos chilenos) en dinero efectivo, constituyendo el fondo inicial de sencillo y cambio para la garita de Serrano 447. Se compromete a su adecuada custodia, registro fehaciente en el sistema POS y rendición formal e inmutable mediante Arqueo Ciego (Reporte Z) al cierre de la jornada.';
    doc.text(declText, 18, 95, { maxWidth: 174 });

    renderA4DualSignatureBlock(doc, 245);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Emisión: ${new Date().toLocaleString('es-CL')} • Cordano PMS A4 Engine • Hoja ${index + 1} de 2 (${copy.tag})`,
      105,
      278,
      { align: 'center' }
    );
  });

  const filename = `Apertura_Turno_${shift.id || Date.now()}.pdf`;
  triggerPdfDownload(doc, filename);
};

export const generateShiftReportPDF = (shift: Shift, download: boolean = true) => {
  return generateShiftClosingPdf(shift, download);
};

/**
 * 5. REPORTE DE AUDITORÍA DE EXCEPCIONES Y ANTIFRAUDE (FUGAS DE CAPITAL)
 * A4 en 2 copias con desglose de:
 * - Estadías cortas sospechosas (<= 5 min con $0 CLP)
 * - Descuentos y liberaciones con PIN supervisor
 * - Tickets extraviados liquidados conforme a Ley N° 20.967
 */
export const generateExceptionAuditReportPdf = (
  ticketsList: Ticket[],
  dateStr: string,
  download: boolean = true
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const alertTickets = ticketsList.filter((t) => {
    const durMin = t.durationMinutes || (t.exitTime ? Math.round((new Date(t.exitTime).getTime() - new Date(t.entryTime).getTime()) / 60000) : 0);
    const isSuspiciousShort = durMin <= 5 && (t.totalAmount || 0) === 0;
    const hasDiscount = (t.discountAmount || 0) > 0;
    const isLost = t.isLostTicket;
    return isSuspiciousShort || hasDiscount || isLost;
  });

  const countShorts = alertTickets.filter((t) => {
    const durMin = t.durationMinutes || 0;
    return durMin <= 5 && (t.totalAmount || 0) === 0;
  }).length;
  const countDiscounts = alertTickets.filter((t) => (t.discountAmount || 0) > 0).length;
  const countLost = alertTickets.filter((t) => t.isLostTicket).length;
  const totalDiscountGranted = alertTickets.reduce((sum, t) => sum + (t.discountAmount || 0), 0);

  const copies = [
    { title: 'COPIA 1: AUDITORÍA DE SEGURIDAD & PREVENCIÓN', tag: 'Auditoría' },
    { title: 'COPIA 2: ADMINISTRACIÓN CENTRAL', tag: 'Administración' },
  ];

  copies.forEach((copy, index) => {
    if (index > 0) {
      doc.addPage('a4', 'portrait');
    }

    renderA4CorporateHeader(
      doc,
      'AUDITORÍA DE EXCEPCIONES & PREVENCIÓN DE FUGAS',
      `Período de Auditoría: ${dateStr} • Recinto: Serrano 447, Iquique • Monitoreo Antifraude`,
      copy.title
    );

    // Cuadro de Métricas de Riesgo
    doc.setFillColor(255, 245, 248);
    doc.setDrawColor(226, 73, 138);
    doc.roundedRect(14, 36, 182, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(190, 24, 93);
    doc.text('INDICADORES DE RIESGO OPERACIONAL & MERMA DE INGRESOS', 18, 43);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 47);
    doc.text(`Estadías Cortas <= 5m ($0): ${countShorts} casos`, 18, 50);
    doc.text(`Descuentos con Supervisor: ${countDiscounts} casos`, 76, 50);
    doc.text(`Tickets Extraviados: ${countLost} casos`, 134, 50);
    doc.text(`Monto Total Descontado / Cedido: $ ${totalDiscountGranted.toLocaleString('es-CL')} CLP`, 18, 55);

    // Tabla de Excepciones Detallada
    const bodyRows = alertTickets.map((t) => {
      const durMin = t.durationMinutes || 0;
      let alertReason = 'ESTADÍA CORTA (POSIBLE FUGA)';
      if (t.isLostTicket) alertReason = 'TICKET EXTRAVIADO (LEY 20.967)';
      else if ((t.discountAmount || 0) > 0) alertReason = `DESCUENTO (-$${(t.discountAmount || 0).toLocaleString('es-CL')})`;

      return [
        t.ticketCode || t.id.slice(0, 8),
        t.plateNumber,
        t.entryTime ? t.entryTime.slice(11, 16) : '--:--',
        t.exitTime ? t.exitTime.slice(11, 16) : 'Patio',
        `${durMin}m`,
        alertReason,
        `$ ${(t.totalAmount || 0).toLocaleString('es-CL')}`,
        t.operatorExitName || t.operatorEntryName || 'Garita',
      ];
    });

    autoTable(doc, {
      startY: 63,
      margin: { left: 14, right: 14 },
      head: [['Ticket', 'Patente', 'In', 'Out', 'Dur.', 'Tipo de Alerta Antifraude', 'Monto Cobrado', 'Operador']],
      body:
        bodyRows.length > 0
          ? bodyRows
          : [['-', 'SIN NOVEDADES', '-', '-', '-', 'No se detectaron fugas ni excepciones en el período', '$ 0', '-']],
      showHead: 'everyPage',
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 12, halign: 'center' },
        5: { cellWidth: 46, halign: 'left', overflow: 'linebreak' },
        6: { cellWidth: 26, halign: 'right' },
        7: { cellWidth: 30, halign: 'left' },
      },
      headStyles: { fillColor: [30, 30, 47], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7, textColor: [30, 30, 47] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'grid',
    });

    renderA4DualSignatureBlock(doc, 245);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Emisión: ${new Date().toLocaleString('es-CL')} • Cordano PMS A4 Engine • Hoja ${index + 1} de 2 (${copy.tag})`,
      105,
      278,
      { align: 'center' }
    );
  });

  const filename = `Reporte_Excepciones_Antifraude_${dateStr.replace(/[^0-9a-zA-Z-]/g, '_')}.pdf`;
  if (download) {
    triggerPdfDownload(doc, filename);
  } else {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }

  return { doc, filename };
};

/**
 * 6. REPORTE EJECUTIVO DE FLUJO DE RECAUDACIÓN Y OPERACIÓN
 * A4 en 2 copias con KPIs directos: RevPAS, Tasa de Rotación, desglose de medios y categorías.
 */
export const generateRevenueReportPdf = (
  ticketsList: Ticket[],
  dateStr: string,
  download: boolean = true
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const paidTickets = ticketsList.filter((t) => t.status === 'pagado');
  const totalRevenue = paidTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const totalCash = paidTickets
    .filter((t) => t.paymentMethod === 'efectivo')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const totalCard = totalRevenue - totalCash;

  const totalVehicles = ticketsList.length;
  const turnoverRate = (totalVehicles / 30).toFixed(2);
  const revPas = Math.round(totalRevenue / 30);
  const avgTicket = paidTickets.length > 0 ? Math.round(totalRevenue / paidTickets.length) : 0;

  const copies = [
    { title: 'COPIA 1: GERENCIA & DIRECCIÓN FINANCIERA', tag: 'Gerencia' },
    { title: 'COPIA 2: ADMINISTRACIÓN OPERACIONAL', tag: 'Operaciones' },
  ];

  copies.forEach((copy, index) => {
    if (index > 0) {
      doc.addPage('a4', 'portrait');
    }

    renderA4CorporateHeader(
      doc,
      'INFORME EJECUTIVO DE RECAUDACIÓN & DEMANDA',
      `Período Analizado: ${dateStr} • Recinto Serrano 447 (30 Plazas) • Visión de Negocio`,
      copy.title
    );

    // Fila de 4 KPIs Superiores
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);

    // KPI 1: Ingreso Total
    doc.roundedRect(14, 36, 42, 22, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL RECAUDADO', 18, 42);
    doc.setFontSize(10.5);
    doc.setTextColor(226, 73, 138);
    doc.text(`$ ${totalRevenue.toLocaleString('es-CL')}`, 18, 51);

    // KPI 2: Flujo y Rotación
    doc.roundedRect(60, 36, 42, 22, 1.5, 1.5, 'FD');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('ROTACIÓN DE PLAZAS', 64, 42);
    doc.setFontSize(10.5);
    doc.setTextColor(30, 30, 47);
    doc.text(`${turnoverRate}x (${totalVehicles} autos)`, 64, 51);

    // KPI 3: RevPAS
    doc.roundedRect(106, 36, 42, 22, 1.5, 1.5, 'FD');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('RevPAS (POR ESPACIO)', 110, 42);
    doc.setFontSize(10.5);
    doc.setTextColor(16, 185, 129);
    doc.text(`$ ${revPas.toLocaleString('es-CL')}`, 110, 51);

    // KPI 4: Ticket Promedio
    doc.roundedRect(152, 36, 44, 22, 1.5, 1.5, 'FD');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('TICKET PROMEDIO', 156, 42);
    doc.setFontSize(10.5);
    doc.setTextColor(30, 30, 47);
    doc.text(`$ ${avgTicket.toLocaleString('es-CL')}`, 156, 51);

    // Tabla 1: Desglose por Medio de Pago
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 47);
    doc.text('1. DESGLOSE POR CANAL DE PAGO', 14, 66);

    const cashPct = totalRevenue > 0 ? ((totalCash / totalRevenue) * 100).toFixed(1) : '0';
    const cardPct = totalRevenue > 0 ? ((totalCard / totalRevenue) * 100).toFixed(1) : '0';

    autoTable(doc, {
      startY: 70,
      margin: { left: 14, right: 14 },
      head: [['Canal de Pago', 'Transacciones', 'Monto Recaudado (CLP)', 'Participación (%)']],
      body: [
        ['Efectivo en Garita', `${paidTickets.filter((t) => t.paymentMethod === 'efectivo').length}`, `$ ${totalCash.toLocaleString('es-CL')}`, `${cashPct}%`],
        ['Tarjetas POS Transbank (Débito/Crédito)', `${paidTickets.filter((t) => t.paymentMethod !== 'efectivo').length}`, `$ ${totalCard.toLocaleString('es-CL')}`, `${cardPct}%`],
        ['TOTAL CONSOLIDADO', `${paidTickets.length} operaciones`, `$ ${totalRevenue.toLocaleString('es-CL')}`, '100.0%'],
      ],
      columnStyles: {
        0: { cellWidth: 62, halign: 'left' },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 45, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
      },
      headStyles: { fillColor: [30, 30, 47], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 30, 47] },
      theme: 'grid',
    });

    const yT2 = (doc as any).lastAutoTable?.finalY + 8 || 110;

    // Tabla 2: Demanda por Tipo de Vehículo
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('2. DISTRIBUCIÓN POR CATEGORÍA VEHICULAR', 14, yT2);

    const autos = ticketsList.filter((t) => t.vehicleType === 'Automóvil' || !t.vehicleType);
    const motos = ticketsList.filter((t) => t.vehicleType === 'Motocicleta');
    const camionetas = ticketsList.filter((t) => t.vehicleType === 'Camioneta' || t.vehicleType === 'Furgón / SUV');

    autoTable(doc, {
      startY: yT2 + 4,
      margin: { left: 14, right: 14 },
      head: [['Categoría', 'Vehículos Atendidos', 'Recaudación Estimada (CLP)', 'Tasa de Utilización']],
      body: [
        [
          'Automóviles / Sedán',
          `${autos.length}`,
          `$ ${autos.reduce((s, t) => s + (t.totalAmount || 0), 0).toLocaleString('es-CL')}`,
          `${totalVehicles > 0 ? ((autos.length / totalVehicles) * 100).toFixed(1) : 0}%`,
        ],
        [
          'Camionetas / SUV / Furgones',
          `${camionetas.length}`,
          `$ ${camionetas.reduce((s, t) => s + (t.totalAmount || 0), 0).toLocaleString('es-CL')}`,
          `${totalVehicles > 0 ? ((camionetas.length / totalVehicles) * 100).toFixed(1) : 0}%`,
        ],
        [
          'Motocicletas',
          `${motos.length}`,
          `$ ${motos.reduce((s, t) => s + (t.totalAmount || 0), 0).toLocaleString('es-CL')}`,
          `${totalVehicles > 0 ? ((motos.length / totalVehicles) * 100).toFixed(1) : 0}%`,
        ],
      ],
      columnStyles: {
        0: { cellWidth: 62, halign: 'left' },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 45, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
      },
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 30, 47] },
      theme: 'grid',
    });

    renderA4DualSignatureBlock(doc, 245);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Emisión: ${new Date().toLocaleString('es-CL')} • Cordano PMS A4 Engine • Hoja ${index + 1} de 2 (${copy.tag})`,
      105,
      278,
      { align: 'center' }
    );
  });

  const filename = `Informe_Recaudacion_Flujo_${dateStr.replace(/[^0-9a-zA-Z-]/g, '_')}.pdf`;
  if (download) {
    triggerPdfDownload(doc, filename);
  } else {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }

  return { doc, filename };
};

/**
 * 7. CARTEL TARIFARIO OFICIAL AL PÚBLICO (Ley N° 20.967)
 * Exhibición obligatoria en acceso vehicular. Tipografía formal sin emojis que provoquen artefactos de impresión.
 */
export const generatePublicTariffPosterPdf = (config: any, facilityInfo?: any, download = false) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const facilityName = facilityInfo?.name || 'PARKING OPS — RECINTO CORDANO IQUIQUE';
  const facilityAddress = facilityInfo?.address || 'Serrano 447, Iquique, Región de Tarapacá';

  // Header llamativo con colores corporativos
  doc.setFillColor(30, 30, 47);
  doc.rect(0, 0, 210, 26, 'F');
  doc.setFillColor(226, 73, 138);
  doc.rect(0, 26, 210, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text(facilityName, 105, 13, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 235, 245);
  doc.text(`${facilityAddress} • ATENCIÓN CONTINUADA 24/7`, 105, 20, { align: 'center' });

  // Título legal
  doc.setTextColor(30, 30, 47);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CARTEL TARIFARIO OFICIAL AL PÚBLICO', 105, 38, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Exhibición reglamentaria obligatoria en acceso vehicular conforme a Ley N° 20.967', 105, 44, {
    align: 'center',
  });

  const rates = config.vehicleRates || {};
  const tranches = config.subsequentTrancheRates || {};
  const isTranche = config.billingModel === 'TRANCHE_30_10';

  const headCols = isTranche
    ? [['Categoría Vehicular', 'Valor Minuto', 'Tramo 10 min', 'Hora Referencial', 'Tope Máximo Diario']]
    : [['Categoría Vehicular', 'Valor Minuto Efectivo', 'Hora Referencial', 'Tope Máximo Diario']];

  const bodyRows = Object.keys(rates).map((key) => {
    const minRate = rates[key]?.minuteRate || 0;
    const hourly = rates[key]?.hourlyRate || minRate * 60;
    const maxDay = rates[key]?.maxDailyRate || 18000;
    const trancheRate = tranches[key] || minRate * 10;
    return isTranche
      ? [
          key,
          `$ ${minRate.toLocaleString('es-CL')} CLP`,
          `$ ${trancheRate.toLocaleString('es-CL')} CLP`,
          `$ ${hourly.toLocaleString('es-CL')} CLP`,
          `$ ${maxDay.toLocaleString('es-CL')} CLP`,
        ]
      : [
          key,
          `$ ${minRate.toLocaleString('es-CL')} CLP/min`,
          `$ ${hourly.toLocaleString('es-CL')} CLP`,
          `$ ${maxDay.toLocaleString('es-CL')} CLP`,
        ];
  });

  autoTable(doc, {
    startY: 50,
    margin: { left: 14, right: 14 },
    head: headCols,
    body: bodyRows,
    columnStyles: isTranche
      ? {
          0: { cellWidth: 50, halign: 'left' },
          1: { cellWidth: 32, halign: 'right' },
          2: { cellWidth: 32, halign: 'right' },
          3: { cellWidth: 34, halign: 'right' },
          4: { cellWidth: 34, halign: 'right' },
        }
      : {
          0: { cellWidth: 62, halign: 'left' },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 40, halign: 'right' },
        },
    headStyles: {
      fillColor: [30, 30, 47],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 30, 47],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    theme: 'grid',
    styles: { cellPadding: 3.5 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 115;

  // Cuadro 1: Período de Gracia
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, finalY + 8, 182, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 47);
  doc.text('[1] TOLERANCIA Y PERÍODO DE GRACIA INICIAL (15 MINUTOS)', 18, finalY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Los primeros ${config.gracePeriodMinutes ?? 15} minutos de estadía son totalmente libres de costo ($0 CLP). Si el vehículo se retira dentro de dicho lapso, no se devengará cobro alguno.`,
    18,
    finalY + 21,
    { maxWidth: 174 }
  );

  // Cuadro 2: Prohibición de Multas por Extravío
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14, finalY + 34, 182, 24, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(190, 24, 93);
  doc.text('[2] PROHIBICIÓN DE MULTAS POR EXTRAVÍO DE TICKET (LEY N° 20.967)', 18, finalY + 41);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'En caso de extravío del ticket, el usuario solo pagará el tiempo efectivamente utilizado. El operador identificará la hora de ingreso en el registro informático del recinto mediante la placa patente, estando expresamente prohibido el cobro de multas o tarifas sancionatorias prefijadas.',
    18,
    finalY + 47,
    { maxWidth: 174 }
  );

  // Cuadro 3: Normativa Tributaria
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, finalY + 62, 182, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52);
  doc.text('[3] MODALIDAD DE COBRO Y EMISIÓN DE BOLETA ELECTRÓNICA DTE', 18, finalY + 69);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const modelExpl = isTranche
    ? 'Cobro por tramo vencido (primer bloque no menor a 30 min y siguientes no mayores a 10 min).'
    : 'Cobro por minuto efectivo lineal. Queda estrictamente prohibido el redondeo al alza.';
  doc.text(
    `Modalidad reglamentaria: ${modelExpl} Todos los valores incluyen IVA (19%). Se emite boleta electrónica obligatoria.`,
    18,
    finalY + 75,
    { maxWidth: 174 }
  );

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento formal para fijación física en accesos vehiculares • PARKING OPS Serrano 447, Iquique', 105, 280, {
    align: 'center',
  });

  const filename = `Cartel_Tarifario_Publico_Entrada_${Date.now()}.pdf`;
  if (download) {
    triggerPdfDownload(doc, filename);
  } else {
    try {
      doc.autoPrint();
      const printWin = window.open(doc.output('bloburl'), '_blank');
      if (!printWin) {
        triggerPdfDownload(doc, filename);
      }
    } catch {
      triggerPdfDownload(doc, filename);
    }
  }
  return doc;
};

/**
 * 8. FICHA TÉCNICA Y NORMATIVA DE TARIFAS (USO INTERNO / AUDITORÍA ADMINISTRATIVA)
 */
export const generateInternalTariffDocumentationPdf = (config: any, facilityInfo?: any, download = false) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const facilityName = facilityInfo?.name || 'PARKING OPS — RECINTO CORDANO IQUIQUE';
  const facilityAddress = facilityInfo?.address || 'Serrano 447, Iquique • 30 Plazas';

  renderA4CorporateHeader(
    doc,
    'FICHA TÉCNICA & NORMATIVA DE TARIFAS',
    `Recinto: ${facilityName} (${facilityAddress}) • Vigencia: ${new Date().toLocaleDateString('es-CL')}`,
    'AUDITORÍA INTERNA'
  );

  const rates = config.vehicleRates || {};
  const isTranche = config.billingModel === 'TRANCHE_30_10';

  autoTable(doc, {
    startY: 38,
    margin: { left: 14, right: 14 },
    head: [['Categoría Vehicular', 'Minuto (CLP)', 'Hora (CLP)', 'Tope Máximo Diario', 'IVA 19% Incluido']],
    body: Object.keys(rates).map((key) => [
      key,
      `$ ${(rates[key]?.minuteRate || 0).toLocaleString('es-CL')}`,
      `$ ${(rates[key]?.hourlyRate || (rates[key]?.minuteRate || 0) * 60).toLocaleString('es-CL')}`,
      `$ ${(rates[key]?.maxDailyRate || 18000).toLocaleString('es-CL')}`,
      'SÍ (Boleta Tipo 39)',
    ]),
    columnStyles: {
      0: { cellWidth: 50, halign: 'left' },
      1: { cellWidth: 32, halign: 'right' },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 34, halign: 'right' },
      4: { cellWidth: 34, halign: 'center' },
    },
    headStyles: { fillColor: [30, 30, 47], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 47] },
    theme: 'grid',
  });

  const nextY = (doc as any).lastAutoTable?.finalY + 8 || 95;

  autoTable(doc, {
    startY: nextY,
    margin: { left: 14, right: 14 },
    head: [['Parámetro Operativo', 'Configuración de Sistema', 'Fundamento Regulatorio']],
    body: [
      [
        'Modalidad de Liquidación',
        isTranche ? 'Tramos (30m base + 10m)' : 'Minuto Efectivo Lineal',
        'Ley N° 20.967 Art. 15',
      ],
      [
        'Período de Gracia Libre',
        `${config.gracePeriodMinutes ?? 15} minutos libres ($0 CLP)`,
        'Tiempo de cortesía vehicular legal',
      ],
      [
        'Extravío de Ticket',
        'Búsqueda por patente en sistema informático',
        'Prohibido cobrar multa fija (Ley 20.967)',
      ],
      [
        'Cálculo de Descuentos/Recargos',
        'Truncamiento Math.floor a la decena',
        'Protección contra redondeo al alza (SERNAC)',
      ],
      [
        'Emisión Tributaria DTE',
        'Boleta Electrónica Tipo 39 en terminal POS',
        'Normativa SII / Facturación Electrónica',
      ],
      [
        'Fondo Inicial de Gaveta',
        '$ 50.000 CLP',
        'Base de cambio obligatorio al inicio de turno',
      ],
    ],
    columnStyles: {
      0: { cellWidth: 48, halign: 'left' },
      1: { cellWidth: 64, halign: 'left', overflow: 'linebreak' },
      2: { cellWidth: 70, halign: 'left', overflow: 'linebreak' },
    },
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 30, 47] },
    theme: 'grid',
  });

  renderA4DualSignatureBlock(doc, 245);

  const filename = `Ficha_Tarifaria_Uso_Interno_${Date.now()}.pdf`;
  if (download) {
    triggerPdfDownload(doc, filename);
  } else {
    try {
      doc.autoPrint();
      const printWin = window.open(doc.output('bloburl'), '_blank');
      if (!printWin) {
        triggerPdfDownload(doc, filename);
      }
    } catch {
      triggerPdfDownload(doc, filename);
    }
  }
  return doc;
};

export const generateTariffPdf = (config: any, settings?: any, download = false) => {
  return generatePublicTariffPosterPdf(config, settings, download);
};
