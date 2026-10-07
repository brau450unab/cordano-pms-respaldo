import { jsPDF } from 'jspdf';
import { Ticket, Shift, TariffConfig, VehicleType } from '../types';

export type ThermalPaperSize = '58mm' | '80mm' | 'a4';

/**
 * Sends a DOM element to the system print dialog cleanly, isolating it
 * so only the document (ticket/report) is printed without navigation or page UI.
 */
export const printViaSystemDialog = (elementId: string, docTitle: string = 'Documento Cordano'): boolean => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with id "${elementId}" not found. Falling back to window.print()`);
    window.print();
    return false;
  }

  // Create an isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.id = 'print-engine-frame';
  document.body.appendChild(iframe);

  const pri = iframe.contentWindow;
  if (!pri) {
    window.print();
    return false;
  }

  const doc = pri.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${docTitle}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            margin: 4mm;
            size: auto;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif, monospace;
            color: #1a1c1d;
            background: #ffffff;
            margin: 0;
            padding: 8px;
            font-size: 12px;
          }
          .ticket-container {
            width: 100%;
            max-width: 320px;
            margin: 0 auto;
            border: 1px dashed #717785;
            padding: 12px;
            border-radius: 8px;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .font-black { font-weight: 900; }
          .font-mono { font-family: monospace; }
          .uppercase { text-transform: uppercase; }
          .flex-between { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .license-plate-box {
            border: 2px solid #1a1c1d;
            padding: 6px;
            border-radius: 8px;
            margin: 8px 0;
            text-align: center;
            background: #ffffff;
          }
          .plate-number {
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 3px;
          }
          .divider {
            border-bottom: 1px dashed #717785;
            margin: 8px 0;
          }
          .barcode-sim {
            height: 36px;
            background: #1a1c1d;
            margin: 10px auto 4px auto;
            max-width: 220px;
            border-radius: 2px;
          }
          .small-note {
            font-size: 9px;
            color: #555555;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    pri.focus();
    pri.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 350);

  return true;
};

/**
 * Generates an official vector PDF for a Ticket (check-in or check-out receipt).
 */
export const generateTicketPdf = (
  ticket: Ticket,
  paperSize: ThermalPaperSize = '80mm',
  autoDownload: boolean = true
): jsPDF => {
  const is58mm = paperSize === '58mm';
  const widthMm = is58mm ? 58 : paperSize === 'a4' ? 210 : 80;
  // Estimate needed height based on status
  const heightMm = paperSize === 'a4' ? 297 : ticket.status === 'pagado' ? 165 : 140;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: paperSize === 'a4' ? 'a4' : [widthMm, heightMm],
  });

  const margin = is58mm ? 4 : 6;
  const contentWidth = widthMm - margin * 2;
  const centerX = widthMm / 2;
  let y = margin + 4;

  // Header banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(is58mm ? 10 : 12);
  doc.setTextColor(128, 9, 58); // #80093A
  doc.text('CORDANO PARKING OPS', centerX, y, { align: 'center' });
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(is58mm ? 6.5 : 7.5);
  doc.setTextColor(90, 95, 105);
  doc.text('Sistema Automatizado de Control & Cobro', centerX, y, { align: 'center' });
  y += 3.5;
  doc.text('RUT: 76.892.110-3 • Iquique, Chile', centerX, y, { align: 'center' });
  y += 4;

  // Dashed line
  doc.setLineDashPattern([1, 1], 0);
  doc.setDrawColor(180, 185, 195);
  doc.line(margin, y, margin + contentWidth, y);
  y += 4;

  // License plate display box
  const plateBoxHeight = is58mm ? 18 : 20;
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(26, 28, 29);
  doc.setLineWidth(0.6);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 2, y, contentWidth - 4, plateBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(is58mm ? 6.5 : 7);
  doc.setTextColor(100, 105, 115);
  doc.text('PATENTE VEHÍCULO', centerX, y + 4, { align: 'center' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(is58mm ? 14 : 16);
  doc.setTextColor(26, 28, 29);
  doc.text(ticket.plateNumber, centerX, y + 11, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(is58mm ? 6.5 : 7.5);
  doc.setTextColor(128, 9, 58);
  doc.text(`[ ${ticket.vehicleType} ]`, centerX, y + 16, { align: 'center' });
  y += plateBoxHeight + 4;

  // Key-value lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(is58mm ? 7 : 8);
  doc.setTextColor(26, 28, 29);

  const drawRow = (label: string, value: string, highlightValue: boolean = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 95, 105);
    doc.text(label, margin, y);
    doc.setFont('helvetica', highlightValue ? 'bold' : 'normal');
    doc.setTextColor(highlightValue ? 128 : 26, highlightValue ? 9 : 28, highlightValue ? 58 : 29);
    doc.text(value, margin + contentWidth, y, { align: 'right' });
    y += 4;
  };

  drawRow('N° TICKET:', ticket.ticketCode, true);
  drawRow('SLOT ASIGNADO:', ticket.slotCode, true);
  drawRow('FECHA:', new Date(ticket.entryTime).toLocaleDateString('es-CL'));
  drawRow('HORA INGRESO:', new Date(ticket.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }));
  drawRow('OPERADOR:', ticket.operatorEntryName);

  if (ticket.status === 'pagado') {
    y += 2;
    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(180, 185, 195);
    doc.line(margin, y, margin + contentWidth, y);
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(is58mm ? 7.5 : 8.5);
    doc.setTextColor(16, 120, 60);
    doc.text('COMPROBANTE DE SALIDA Y PAGO', centerX, y, { align: 'center' });
    y += 4.5;

    if (ticket.exitTime) {
      drawRow('HORA SALIDA:', new Date(ticket.exitTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }));
    }
    if (ticket.durationMinutes !== undefined) {
      drawRow('ESTADÍA TOTAL:', `${ticket.durationMinutes} minutos`);
    }
    if (ticket.paymentMethod) {
      drawRow('MEDIO DE PAGO:', ticket.paymentMethod.toUpperCase());
    }

    y += 1;
    doc.setLineDashPattern([], 0);
    doc.setDrawColor(16, 120, 60);
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(is58mm ? 8 : 9.5);
    doc.setTextColor(16, 120, 60);
    doc.text('TOTAL COBRADO:', margin + 2, y + 6);
    doc.text(`$${(ticket.totalAmount || 0).toLocaleString('es-CL')} CLP`, margin + contentWidth - 2, y + 6, { align: 'right' });
    y += 13;
  }

  // Barcode / QR Box
  y += 2;
  doc.setLineDashPattern([], 0);
  doc.setFillColor(26, 28, 29);
  const barcodeWidth = Math.min(contentWidth - 6, 44);
  doc.rect((widthMm - barcodeWidth) / 2, y, barcodeWidth, 8, 'F');
  y += 10;

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(90, 95, 105);
  doc.text(`* ${ticket.ticketCode} *`, centerX, y, { align: 'center' });
  y += 4;

  // Legal & instructions note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(is58mm ? 5.5 : 6);
  doc.setTextColor(120, 125, 135);
  const legalNote1 = 'Custodia asegurada. Tolerancia de 10 min de gracia.';
  const legalNote2 = 'Boleta fiscal electrónica SII es emitida en caja POS.';
  doc.text(legalNote1, centerX, y, { align: 'center' });
  y += 3;
  doc.text(legalNote2, centerX, y, { align: 'center' });

  if (autoDownload) {
    const filename = `Ticket_${ticket.plateNumber}_${ticket.ticketCode}.pdf`;
    doc.save(filename);
  }

  return doc;
};

/**
 * Generates an official Tariff Sheet PDF for the day, formatted for posting
 * at the entrance booth or keeping in administrative files.
 */
export const generateTariffPdf = (
  tariffConfig: TariffConfig,
  companyInfo: {
    name?: string;
    rut?: string;
    address?: string;
  } = {},
  autoDownload: boolean = true
): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin + 4;

  // Top header with brand colors
  doc.setFillColor(128, 9, 58); // #80093A
  doc.rect(margin, y, contentWidth, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('CORDANO PARKING OPS • TARIFARIO OFICIAL VIGENTE', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 220, 230);
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Documento Válido para el día de hoy: ${dateFormatted.toUpperCase()} • ${now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} HRS`, margin + 6, y + 14);

  y += 24;

  // Company Information Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(26, 28, 29);
  doc.text(companyInfo.name || 'CORDANO PMS (ParkOps Iquique)', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 95, 105);
  doc.text(`RUT Empresa: ${companyInfo.rut || '76.892.340-K'}  |  Dirección: ${companyInfo.address || 'Serrano 447, Iquique, Tarapacá'}`, margin, y);
  y += 4;
  doc.text('Regulado conforme a la Ley 20.956 de Redondeo en Efectivo y Normativa SERNAC de Estacionamientos.', margin, y);
  y += 8;

  // Policy Highlights Banner
  doc.setFillColor(255, 241, 244);
  doc.setDrawColor(240, 180, 200);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(128, 9, 58);
  doc.text('POLÍTICAS DE COBRO PRINCIPALES:', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(65, 71, 83);
  doc.text(`• Tolerancia de Gracia: ${tariffConfig.gracePeriodMinutes} minutos libres sin cobro al ingresar.`, margin + 4, y + 10);
  doc.text(`• Recargo Nocturno: ${tariffConfig.nightSurchargePercent}% (22:00 a 07:00 hrs).`, margin + 80, y + 10);
  doc.text(`• Multa Ticket Perdido: $${(tariffConfig.lostTicketFee || 10000).toLocaleString('es-CL')} CLP.`, margin + 145, y + 10);

  y += 20;

  // Table Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(26, 28, 29);
  doc.text('VALORES POR TIPO DE VEHÍCULO Y TRAMOS DE TIEMPO', margin, y);
  y += 6;

  // Table Headers
  const colWidths = [38, 22, 22, 22, 22, 24, 28];
  const colHeaders = [
    'Tipo Vehículo',
    'Minuto',
    '30 Min',
    '1 Hora',
    '2 Horas',
    '3 Horas',
    'Tope Diario',
  ];

  doc.setFillColor(26, 28, 29);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  let currentX = margin;
  colHeaders.forEach((header, idx) => {
    const align = idx === 0 ? 'left' : 'right';
    const textX = idx === 0 ? currentX + 3 : currentX + colWidths[idx] - 3;
    doc.text(header, textX, y + 5.5, { align });
    currentX += colWidths[idx];
  });
  y += 8;

  // Table Rows
  const vehicleTypes: VehicleType[] = ['Automóvil', 'Camioneta', 'Motocicleta', 'Furgón / SUV'];

  vehicleTypes.forEach((vType, rowIndex) => {
    const rate = tariffConfig.vehicleRates[vType] || { minuteRate: 30, hourlyRate: 1800, maxDailyRate: 15000 };
    const minRate = rate.minuteRate;
    const cost30m = minRate * 30;
    const cost1h = minRate * 60;
    const cost2h = minRate * 120;
    const cost3h = minRate * 180;
    const maxDaily = rate.maxDailyRate;

    doc.setFillColor(rowIndex % 2 === 0 ? 250 : 255, rowIndex % 2 === 0 ? 250 : 255, rowIndex % 2 === 0 ? 252 : 255);
    doc.rect(margin, y, contentWidth, 9, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(26, 28, 29);

    let cellX = margin;
    // Type name
    doc.text(vType, cellX + 3, y + 6);
    cellX += colWidths[0];

    // Prices
    const values = [
      `$${minRate}`,
      `$${cost30m.toLocaleString('es-CL')}`,
      `$${cost1h.toLocaleString('es-CL')}`,
      `$${cost2h.toLocaleString('es-CL')}`,
      `$${cost3h.toLocaleString('es-CL')}`,
      `$${maxDaily.toLocaleString('es-CL')}`,
    ];

    doc.setFont('helvetica', 'normal');
    values.forEach((val, valIdx) => {
      const isMaxDaily = valIdx === values.length - 1;
      if (isMaxDaily) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(128, 9, 58);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(26, 28, 29);
      }
      doc.text(val, cellX + colWidths[valIdx + 1] - 3, y + 6, { align: 'right' });
      cellX += colWidths[valIdx + 1];
    });

    // Sub divider line
    doc.setDrawColor(230, 232, 236);
    doc.setLineDashPattern([], 0);
    doc.line(margin, y + 9, margin + contentWidth, y + 9);
    y += 9;
  });

  y += 8;

  // Breakdown of Detailed Tramos Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(26, 28, 29);
  doc.text('DESGLOSE DE TRAMOS OPERATIVOS APLICADOS EN PISTA:', margin, y);
  y += 5;

  const tramosData = [
    { tramo: 'Tramo 1 (0 a 10 min)', detalle: 'Período de Gracia: $0 CLP. El vehículo puede salir sin cobro.' },
    { tramo: 'Tramo 2 (11 a 60 min)', detalle: 'Cobro por minuto exacto según tarifa vehículo. Aplica redondeo en efectivo.' },
    { tramo: 'Tramo 3 (1 a 4 horas)', detalle: 'Tarifa continua por fracción de minuto acumulada.' },
    { tramo: 'Tramo 4 (Tope Diario)', detalle: 'Se congela el valor máximo pactado por cada período de 24 horas continuas.' },
    { tramo: 'Ticket Extraviado', detalle: 'Aplica tarifa plana de penalización ($10.000) más acreditación de dominio.' },
  ];

  tramosData.forEach((t) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(128, 9, 58);
    doc.text(t.tramo + ':', margin + 2, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(65, 71, 83);
    doc.text(t.detalle, margin + 48, y + 4);
    y += 6;
  });

  y += 12;

  // Signatures and Stamp area
  doc.setDrawColor(180, 185, 195);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin + 15, y + 15, margin + 75, y + 15);
  doc.line(margin + contentWidth - 75, y + 15, margin + contentWidth - 15, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 95, 105);
  doc.text('Firma Supervisor de Turno', margin + 45, y + 20, { align: 'center' });
  doc.text('Administración CORDANO PMS', margin + contentWidth - 45, y + 20, { align: 'center' });

  // Footer Note
  y += 30;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(130, 135, 145);
  doc.text('Este documento fue emitido desde el Módulo de Ajustes CORDANO PMS y constituye el tarifario oficial del recinto.', margin + contentWidth / 2, y, { align: 'center' });

  if (autoDownload) {
    const filename = `Tarifario_Oficial_Cordano_${now.toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  }

  return doc;
};

/**
 * Generates an official PDF for Shift Closing (Reporte Z / Arqueo Ciego).
 */
export const generateShiftClosingPdf = (shift: Shift, autoDownload: boolean = true): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin + 4;

  // Header Banner
  doc.setFillColor(128, 9, 58); // #80093A
  doc.rect(margin, y, contentWidth, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('CORDANO PARKING OPS • REPORTE Z DE CIERRE DE CAJA', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 220, 230);
  doc.text(`Turno ID: ${shift.id} • Operador: ${shift.operatorName} • Fecha: ${new Date(shift.endTime || shift.startTime).toLocaleDateString('es-CL')}`, margin + 6, y + 14);

  y += 24;

  // Summary Metrics Block
  const totalDeclared = (shift.declaredCash || 0) + (shift.declaredCard || 0) + (shift.declaredTransfer || 0);
  const totalExpected = (shift.expectedCash || 0) + (shift.expectedCard || 0) + (shift.expectedTransfer || 0);
  const discrepancy = shift.discrepancyTotal ?? (totalDeclared - totalExpected);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(26, 28, 29);
  doc.text('RESUMEN DE RECAUDACIÓN Y ARQUEO CIEGO', margin, y);
  y += 6;

  // Metrics Table
  const rows = [
    ['Fondo Inicial (Apertura)', `$${(shift.initialCash || 0).toLocaleString('es-CL')} CLP`],
    ['Efectivo Físico Declarado', `$${(shift.declaredCash || 0).toLocaleString('es-CL')} CLP`],
    ['Comprobantes POS Tarjetas (Débito/Crédito)', `$${(shift.declaredCard || 0).toLocaleString('es-CL')} CLP`],
    ['Transferencias Bancarias Declaradas', `$${(shift.declaredTransfer || 0).toLocaleString('es-CL')} CLP`],
    ['TOTAL RECAUDADO DECLARADO', `$${totalDeclared.toLocaleString('es-CL')} CLP`],
    ['Total Calculado por Sistema (Esperado)', `$${totalExpected.toLocaleString('es-CL')} CLP`],
    ['Diferencia de Caja (Arqueo Ciego)', `${discrepancy >= 0 ? '+' : ''}$${discrepancy.toLocaleString('es-CL')} CLP`],
  ];

  rows.forEach(([label, value], i) => {
    const isHighlight = i === 4 || i === 6;
    doc.setFillColor(isHighlight ? 255 : (i % 2 === 0 ? 250 : 255), isHighlight ? 240 : (i % 2 === 0 ? 250 : 255), isHighlight ? 245 : 255);
    doc.rect(margin, y, contentWidth, 8, 'F');

    doc.setFont('helvetica', isHighlight ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(isHighlight && i === 6 && discrepancy < 0 ? 180 : (isHighlight ? 128 : 26), isHighlight && i === 6 && discrepancy < 0 ? 20 : (isHighlight ? 9 : 28), isHighlight && i === 6 && discrepancy < 0 ? 30 : (isHighlight ? 58 : 29));
    doc.text(label, margin + 4, y + 5.5);
    doc.text(value, margin + contentWidth - 4, y + 5.5, { align: 'right' });

    doc.setDrawColor(230, 232, 236);
    doc.line(margin, y + 8, margin + contentWidth, y + 8);
    y += 8;
  });

  y += 10;

  // Status Badge
  const isOk = Math.abs(discrepancy) <= 2000;
  doc.setFillColor(isOk ? 240 : 255, isOk ? 253 : 241, isOk ? 244 : 242);
  doc.setDrawColor(isOk ? 74 : 225, isOk ? 222 : 29, isOk ? 128 : 72);
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(isOk ? 16 : 180, isOk ? 120 : 20, isOk ? 60 : 30);
  doc.text(
    isOk
      ? '✓ ARQUEO CUADRADO DENTRO DE TOLERANCIA OPERATIVA (±$2.000 CLP)'
      : '⚠️ ADVERTENCIA: DESCUADRE DE CAJA SUPERIOR A TOLERANCIA MÁXIMA ($2.000 CLP)',
    margin + 6,
    y + 7.5
  );

  y += 16;

  // Observation / Justification if discrepancy > $2000
  if (shift.closeJustification || !isOk) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(185, 28, 28);
    doc.text('JUSTIFICACIÓN DE DESCUADRE Y VALIDACIÓN SUPERVISOR:', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(69, 10, 10);
    const justifText = shift.closeJustification || 'Sin justificación escrita.';
    doc.text(`Observación: ${justifText}`, margin + 4, y + 10);
    doc.text(`Aprobación Supervisor: PIN registrado y validado en sistema.`, margin + 4, y + 14);

    y += 20;
  }

  // Cash movements (Retiros parciales / Sangrías / Gastos)
  if (shift.cashMovements && shift.cashMovements.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(26, 28, 29);
    doc.text('RETIROS PARCIALES Y GASTOS MENORES DEL TURNO (SANGRÍAS)', margin, y);
    y += 5;

    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(55, 65, 81);
    doc.text('Hora', margin + 3, y + 4);
    doc.text('Tipo', margin + 20, y + 4);
    doc.text('Motivo / Justificación', margin + 60, y + 4);
    doc.text('Voucher / Folio', margin + 125, y + 4);
    doc.text('Monto CLP', margin + contentWidth - 3, y + 4, { align: 'right' });
    y += 6;

    shift.cashMovements.forEach((m) => {
      const timeStr = new Date(m.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(31, 41, 55);
      doc.text(timeStr, margin + 3, y + 4.5);
      doc.text(m.type === 'RETIRO_SANGRIA' ? 'Retiro Parcial' : m.type === 'GASTO_MENOR' ? 'Gasto Menor' : 'Ingreso Manual', margin + 20, y + 4.5);
      doc.text(m.reason.slice(0, 35), margin + 60, y + 4.5);
      doc.text(m.voucherFolio || 'N/A', margin + 125, y + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${m.amount.toLocaleString('es-CL')}`, margin + contentWidth - 3, y + 4.5, { align: 'right' });

      doc.setDrawColor(229, 231, 235);
      doc.line(margin, y + 6, margin + contentWidth, y + 6);
      y += 6;
    });

    y += 4;
  }

  // Shift Handover Details (Entrega al turno siguiente)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(26, 28, 29);
  doc.text('INFORMACIÓN DE ENTREGA Y TRASPASO DE TURNO', margin, y);
  y += 5;

  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);
  doc.text(`• Vehículos Activos Traspasados: ${shift.transferredVehiclesCount || 0} vehículos permanecen en recinto.`, margin + 4, y + 5);
  doc.text(`• Política de Relevo: El operador saliente retira su efectivo recaudado. La gaveta queda lista para el nuevo fondo.`, margin + 4, y + 9.5);
  if (shift.hashAuditoria) {
    doc.text(`• Sello de Integridad SHA-256: ${shift.hashAuditoria.slice(0, 48)}...`, margin + 4, y + 13.5);
  }

  y += 18;

  // Signature Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(26, 28, 29);
  doc.text('CONSTANCIA DE FIRMAS Y CONFORMIDAD', margin, y);
  y += 16;

  doc.setDrawColor(160, 165, 175);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin + 15, y, margin + 75, y);
  doc.line(margin + contentWidth - 75, y, margin + contentWidth - 15, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 95, 105);
  doc.text(`Firma Operador Saliente: ${shift.operatorName}`, margin + 45, y + 5, { align: 'center' });
  doc.text('Firma Operador Entrante / Supervisor', margin + contentWidth - 45, y + 5, { align: 'center' });

  if (autoDownload) {
    const filename = `Reporte_Z_Turno_${shift.id}.pdf`;
    doc.save(filename);
  }

  return doc;
};
