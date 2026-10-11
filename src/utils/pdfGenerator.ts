import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Shift } from '../types';

export type ThermalPaperSize = '80mm' | '58mm' | 'a4';

// Utilidad para imprimir un contenedor HTML usando el diálogo del sistema
export const printViaSystemDialog = (elementId: string, title: string) => {
  const content = document.getElementById(elementId);
  if (!content) return;
  const printWindow = window.open('', '', 'width=800,height=600');
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head>
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
  }, 300);
};

// Generador de Ticket en formato Rollo Térmico o A4
export const generateTicketPdf = (ticket: any, paperSize: ThermalPaperSize = '80mm', download = false) => {
  const isA4 = paperSize === 'a4';
  const widthMm = isA4 ? 210 : (paperSize === '80mm' ? 80 : 58);
  const heightMm = isA4 ? 297 : 170;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isA4 ? 'a4' : [widthMm, heightMm]
  });

  const center = widthMm / 2;
  
  // Header Corporativo Cordano PMS
  doc.setFillColor(30, 30, 47); // #1E1E2F
  doc.rect(0, 0, widthMm, isA4 ? 24 : 16, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(isA4 ? 16 : 12);
  doc.text('CORDANO PMS', center, isA4 ? 12 : 8, { align: 'center' });
  
  doc.setFontSize(isA4 ? 10 : 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 73, 138); // #E2498A
  doc.text('Serrano 447, Iquique • Control de Estacionamiento', center, isA4 ? 18 : 12, { align: 'center' });

  // Body
  let y = isA4 ? 35 : 22;
  doc.setTextColor(30, 30, 47);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA4 ? 13 : 10);
  doc.text(`TICKET DE ESTACIONAMIENTO`, center, y, { align: 'center' });
  
  y += isA4 ? 8 : 6;
  doc.setFontSize(isA4 ? 10 : 8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Folio: ${ticket.ticketCode || ticket.id}`, center, y, { align: 'center' });
  
  y += isA4 ? 8 : 6;
  doc.setFontSize(isA4 ? 14 : 11);
  doc.setFont('helvetica', 'bold');
  doc.text(`PATENTE: ${ticket.plateNumber || ticket.plate || 'S/N'}`, center, y, { align: 'center' });

  y += isA4 ? 8 : 6;
  doc.setFontSize(isA4 ? 10 : 8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Categoría: ${ticket.vehicleType || 'Automóvil'} • Cupo: ${ticket.slotCode || 'Asignado'}`, center, y, { align: 'center' });
  
  y += isA4 ? 7 : 5;
  doc.text(`Entrada: ${new Date(ticket.entryTime).toLocaleString('es-CL')}`, center, y, { align: 'center' });

  if (ticket.status === 'pagado' || ticket.status === 'completado' || ticket.exitTime) {
    y += isA4 ? 7 : 5;
    doc.text(`Salida: ${new Date(ticket.exitTime || new Date()).toLocaleString('es-CL')}`, center, y, { align: 'center' });
    y += isA4 ? 10 : 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isA4 ? 15 : 12);
    doc.setTextColor(226, 73, 138);
    doc.text(`TOTAL PAGADO: $${(ticket.totalAmount || 0).toLocaleString('es-CL')} CLP`, center, y, { align: 'center' });
    doc.setTextColor(30, 30, 47);
  }

  // Footer & Disclaimer
  y += isA4 ? 18 : 12;
  doc.setFontSize(isA4 ? 9 : 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Conserve este comprobante. Recargo por ticket perdido: $8.000 CLP.', center, y, { align: 'center' });
  y += isA4 ? 6 : 4;
  doc.text('Iquique, Región de Tarapacá • Horario Continuado', center, y, { align: 'center' });

  // Bloque de Firmas si es A4
  if (isA4) {
    renderA4DualSignatureBlock(doc, 240);
  }

  if (download) {
    doc.save(`Ticket_${ticket.plateNumber || ticket.plate || ticket.id}.pdf`);
  } else {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }
};

/**
 * Renderiza el bloque estándar corporativo de dos firmas al pie de hoja A4
 */
export const renderA4DualSignatureBlock = (doc: jsPDF, yPosition: number = 245) => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 47);

  // Firma Operario (Izquierda)
  doc.setDrawColor(30, 30, 47);
  doc.setLineWidth(0.4);
  doc.line(20, yPosition, 90, yPosition);
  doc.setFont('helvetica', 'bold');
  doc.text('Firma del Operario', 55, yPosition + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RUT / Cédula de Identidad', 55, yPosition + 9, { align: 'center' });

  // Firma Administrador (Derecha)
  doc.setDrawColor(30, 30, 47);
  doc.line(120, yPosition, 190, yPosition);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 47);
  doc.text('Firma del Administrador', 155, yPosition + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('V°B° Supervisor Serrano 447', 155, yPosition + 9, { align: 'center' });
};

/**
 * Genera el Reporte Z de Cierre en Hoja Estándar A4 con 2 COPIAS obligatorias y doble firma
 */
export const generateShiftClosingPdf = (shift: Shift, download: boolean = true) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const copies = [
    { title: 'COPIA 1: GARITA / CONTROL DE TURNO', tag: 'Garita' },
    { title: 'COPIA 2: ADMINISTRACIÓN / RESPALDO CONTABLE', tag: 'Administración' }
  ];

  copies.forEach((copy, index) => {
    if (index > 0) {
      doc.addPage('a4', 'portrait');
    }

    // Encabezado Corporativo Cordano PMS (#1E1E2F & #E2498A)
    doc.setFillColor(30, 30, 47);
    doc.rect(0, 0, 210, 22, 'F');
    
    // Franja Rosa Corporativa
    doc.setFillColor(226, 73, 138);
    doc.rect(0, 22, 210, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('CORDANO PMS — REPORTE Z DE CIERRE', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(copy.title, 196, 14, { align: 'right' });

    // Datos del Turno
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 47);
    doc.setFont('helvetica', 'bold');
    doc.text(`Recinto: Serrano 447, Iquique`, 14, 33);
    doc.text(`ID Turno: ${shift.id}`, 196, 33, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Operador a Cargo: ${shift.operatorName}`, 14, 39);
    doc.text(`Sello SHA-256: ${shift.hashAuditoria || 'CPMS-OFFLINE-SEAL'}`, 196, 39, { align: 'right' });
    doc.text(`Inicio de Turno: ${new Date(shift.startTime).toLocaleString('es-CL')}`, 14, 45);
    doc.text(`Cierre de Turno: ${shift.endTime ? new Date(shift.endTime).toLocaleString('es-CL') : new Date().toLocaleString('es-CL')}`, 14, 51);

    const handoverFund = shift.handoverFundAmount || (shift.initialCash || 50000);
    const deliveryCash = (shift.declaredCash || 0) - handoverFund;

    // Tabla de Arqueo y Cuadratura
    autoTable(doc, {
      startY: 57,
      head: [['Concepto de Cobro', 'Monto Declarado (Físico)', 'Monto Esperado (Sistema)', 'Diferencia (CLP)']],
      body: [
        [
          'Total Efectivo en Gaveta',
          `$ ${(shift.declaredCash || 0).toLocaleString('es-CL')}`,
          `$ ${(shift.expectedCash || 0).toLocaleString('es-CL')}`,
          `$ ${(shift.discrepancyCash || 0).toLocaleString('es-CL')}`
        ],
        [
          '  ├─ Fondo de Sencillo en Gaveta',
          `$ ${handoverFund.toLocaleString('es-CL')}`,
          `$ ${handoverFund.toLocaleString('es-CL')}`,
          '$ 0'
        ],
        [
          '  └─ Sobre de Efectivo a Entregar',
          `$ ${Math.max(0, deliveryCash).toLocaleString('es-CL')}`,
          '-',
          '-'
        ],
        [
          'Tarjetas POS (Transbank / Débito / Crédito)',
          `$ ${(shift.declaredCard || 0).toLocaleString('es-CL')}`,
          `$ ${(shift.expectedCard || 0).toLocaleString('es-CL')}`,
          `$ ${((shift.declaredCard || 0) - (shift.expectedCard || 0)).toLocaleString('es-CL')}`
        ],
        [
          'Transferencias Bancarias Validadas',
          `$ ${(shift.declaredTransfer || 0).toLocaleString('es-CL')}`,
          `$ ${(shift.expectedTransfer || 0).toLocaleString('es-CL')}`,
          `$ ${((shift.declaredTransfer || 0) - (shift.expectedTransfer || 0)).toLocaleString('es-CL')}`
        ]
      ],
      headStyles: {
        fillColor: [30, 30, 47],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [30, 30, 47]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      theme: 'grid'
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 120;

    // Resumen General Totales
    const totalDec = (shift.declaredCash || 0) + (shift.declaredCard || 0) + (shift.declaredTransfer || 0);
    const totalExp = (shift.expectedCash || 0) + (shift.expectedCard || 0) + (shift.expectedTransfer || 0);
    const totalDif = totalDec - totalExp;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, finalY + 6, 182, 28, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 47);
    doc.text('RESUMEN CONSOLIDADO DEL TURNO', 20, finalY + 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Declarado: $ ${totalDec.toLocaleString('es-CL')} CLP`, 20, finalY + 21);
    doc.text(`Total Esperado: $ ${totalExp.toLocaleString('es-CL')} CLP`, 20, finalY + 27);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(totalDif === 0 ? 16 : 226, totalDif === 0 ? 185 : 73, totalDif === 0 ? 129 : 138);
    doc.text(`Diferencia Neta: $ ${totalDif.toLocaleString('es-CL')} CLP`, 110, finalY + 21);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Vehículos Procesados: ${shift.totalTicketsProcessed || 0} tickets`, 110, finalY + 27);

    // Observaciones o justificación
    if (shift.closeJustification) {
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Observación/Justificación: ${shift.closeJustification}`, 14, finalY + 41);
    }

    // Pie de página oficial con dos espacios para firmas físicas A4
    renderA4DualSignatureBlock(doc, 248);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Emisión: ${new Date().toLocaleString('es-CL')} • Cordano PMS A4 Engine • Hoja ${index + 1} de 2 (${copy.tag})`, 105, 275, { align: 'center' });
  });

  const filename = `Reporte_Z_Cierre_${shift.id || Date.now()}.pdf`;

  if (download) {
    triggerPdfDownload(doc, filename);
  } else {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }

  return { doc, filename };
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

// Generador de Reporte Apertura de Turno en A4 con dos firmas
export const generateShiftOpenReportPDF = (shift: Shift) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Encabezado Corporativo
  doc.setFillColor(30, 30, 47);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setFillColor(226, 73, 138);
  doc.rect(0, 22, 210, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('CORDANO PMS — APERTURA DE TURNO', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('ACTA DE RECEPCIÓN DE CAJA', 196, 14, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(30, 30, 47);
  doc.setFont('helvetica', 'bold');
  doc.text(`Recinto: Serrano 447, Iquique`, 14, 34);
  doc.text(`ID Turno: ${shift.id}`, 196, 34, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Operador Responsable: ${shift.operatorName}`, 14, 41);
  doc.text(`Fecha y Hora de Apertura: ${new Date(shift.startTime).toLocaleString('es-CL')}`, 14, 47);

  autoTable(doc, {
    startY: 55,
    head: [['Concepto', 'Monto Asignado (CLP)', 'Observaciones']],
    body: [
      [
        'Fondo Inicial Físico en Gaveta (Sencillo)',
        `$ ${(shift.initialCash || 50000).toLocaleString('es-CL')}`,
        'Fondo declarado y verificado en garita de entrada'
      ]
    ],
    headStyles: {
      fillColor: [30, 30, 47],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 30, 47]
    },
    theme: 'grid'
  });

  renderA4DualSignatureBlock(doc, 245);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  triggerPdfDownload(doc, `Apertura_Turno_${shift.id || Date.now()}.pdf`);
};

export const generateShiftReportPDF = (shift: Shift, download: boolean = true) => {
  return generateShiftClosingPdf(shift, download);
};

// Generador de Tarifario en A4
export const generateTariffPdf = (config: any, settings?: any, download = false) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  doc.setFillColor(30, 30, 47);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setFillColor(226, 73, 138);
  doc.rect(0, 22, 210, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('CORDANO PMS — TARIFARIO OFICIAL VIGENTE', 14, 14);

  doc.setFontSize(10);
  doc.setTextColor(30, 30, 47);
  doc.text(`${settings?.name || 'Estacionamiento Serrano 447'} - ${settings?.rut || 'Iquique'}`, 14, 34);

  const rates = config.vehicleRates || {};
  const body = Object.keys(rates).map(key => [
    key, 
    `$ ${rates[key].minuteRate || rates[key].perMinute || 0} CLP`, 
    `$ ${(rates[key].hourlyRate || (rates[key].minuteRate ? rates[key].minuteRate * 60 : 0)).toLocaleString('es-CL')} CLP`,
    `$ ${(rates[key].maxDailyRate || 18000).toLocaleString('es-CL')} CLP`
  ]);
  
  autoTable(doc, {
    startY: 42,
    head: [['Tipo de Vehículo', 'Cobro por Minuto', 'Cobro por Hora', 'Tarifa Máxima Diaria']],
    body: body,
    headStyles: {
      fillColor: [30, 30, 47],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    theme: 'grid'
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const modelText = config.billingModel === 'TRANCHE_30_10' ? 'Cobro por tramo legal (30 min base + tramos de 10 min)' : 'Cobro por minuto efectivo';
  doc.text(`Período de Gracia: ${config.gracePeriodMinutes ?? 15} minutos. Modalidad: ${modelText}. Extravío de ticket: Cobro de tiempo efectivo según patente (Ley 20.967).`, 14, finalY + 10);

  renderA4DualSignatureBlock(doc, 245);

  if (download) {
    doc.save(`Tarifario_Oficial_Cordano.pdf`);
  } else {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }
};
