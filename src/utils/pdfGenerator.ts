import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Shift, Ticket } from '../types';

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
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; }
          .no-print { display: none !important; }
          @media print {
            body { -webkit-print-color-adjust: exact; padding: 0; }
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
  }, 250);
};

// Generador de Ticket en formato Rollo Térmico (80mm o 58mm)
export const generateTicketPdf = (ticket: any, paperSize: ThermalPaperSize, download = false) => {
  const widthMm = paperSize === 'a4' ? 210 : (paperSize === '80mm' ? 80 : 58);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: paperSize === 'a4' ? 'a4' : [widthMm, 150]
  });

  const center = widthMm / 2;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ParkOps', center, 10, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Cordano Inversiones', center, 15, { align: 'center' });
  
  doc.setFontSize(9);
  doc.text(`Ticket: ${ticket.id}`, center, 22, { align: 'center' });
  doc.text(`Patente: ${ticket.plate || 'S/N'}`, center, 27, { align: 'center' });
  
  doc.text(`Ingreso: ${new Date(ticket.entryTime).toLocaleString('es-CL')}`, center, 35, { align: 'center' });
  
  if (ticket.status === 'pagado' || ticket.status === 'completado') {
    doc.text(`Salida: ${new Date(ticket.exitTime).toLocaleString('es-CL')}`, center, 40, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL: $${(ticket.totalAmount || 0).toLocaleString('es-CL')}`, center, 50, { align: 'center' });
  }

  doc.setFontSize(8);
  doc.text('Conserve este ticket.', center, 70, { align: 'center' });
  
  if (download) {
    doc.save(`Ticket_${ticket.plate || ticket.id}.pdf`);
  } else {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }
};

// Generador de Reporte Cierre de Turno
export const generateShiftClosingPdf = (shift: Shift, download = false) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(44, 19, 56);
  doc.text('ParkOps - Reporte Z de Cierre', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Operador: ${shift.operatorName}`, 14, 30);
  doc.text(`Apertura: ${new Date(shift.startTime).toLocaleString('es-CL')}`, 14, 35);
  doc.text(`Cierre: ${shift.endTime ? new Date(shift.endTime).toLocaleString('es-CL') : 'Aún en curso'}`, 14, 40);
  doc.text(`ID Turno: ${shift.id}`, 14, 45);

  autoTable(doc, {
    startY: 55,
    head: [['Concepto', 'Declarado', 'Esperado', 'Diferencia']],
    body: [
      ['Efectivo', `$${(shift.declaredCash || 0).toLocaleString('es-CL')}`, `$${(shift.expectedCash || 0).toLocaleString('es-CL')}`, `$${(shift.discrepancyCash || 0).toLocaleString('es-CL')}`],
      ['Tarjetas', `$${(shift.declaredCard || 0).toLocaleString('es-CL')}`, `$${(shift.expectedCard || 0).toLocaleString('es-CL')}`, `$${((shift.declaredCard || 0) - (shift.expectedCard || 0)).toLocaleString('es-CL')}`],
      ['Transferencia', `$${(shift.declaredTransfer || 0).toLocaleString('es-CL')}`, `$${(shift.expectedTransfer || 0).toLocaleString('es-CL')}`, `$${((shift.declaredTransfer || 0) - (shift.expectedTransfer || 0)).toLocaleString('es-CL')}`]
    ]
  });

  if (download) {
    doc.save(`Cierre_${shift.id}.pdf`);
  } else {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }
};

// Generador de Reporte Apertura de Turno (Nuevo)
export const generateShiftOpenReportPDF = (shift: Shift) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(44, 19, 56);
  doc.text('ParkOps - Apertura de Turno', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Operador: ${shift.operatorName}`, 14, 30);
  doc.text(`Fecha/Hora Apertura: ${new Date(shift.startTime).toLocaleString('es-CL')}`, 14, 35);
  doc.text(`ID Turno: ${shift.id}`, 14, 40);

  autoTable(doc, {
    startY: 50,
    head: [['Concepto', 'Monto Declarado (CLP)']],
    body: [
      ['Fondo Inicial Físico en Gaveta', `$${(shift.initialCash || 0).toLocaleString('es-CL')}`]
    ],
    theme: 'grid'
  });

  doc.save(`Apertura_Turno_${shift.id}.pdf`);
};

export const generateShiftReportPDF = (shift: Shift, download: boolean = true) => {
  return generateShiftClosingPdf(shift, download);
};

// Generador de Tarifario
export const generateTariffPdf = (config: any, settings?: any, download = false) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Tarifario ParkOps', 14, 20);
  
  if (settings && settings.name) {
    doc.setFontSize(12);
    doc.text(`${settings.name} - ${settings.rut || ''}`, 14, 28);
    doc.setFontSize(10);
    doc.text(settings.address || '', 14, 34);
  }
  
  const rates = config.vehicleRates || {};
  const body = Object.keys(rates).map(key => [
    key, 
    `$${rates[key].perMinute || rates[key].ratePerMinute || 0}`, 
    `$${rates[key].baseFee || rates[key].baseRate || 0}`
  ]);
  
  autoTable(doc, {
    startY: settings && settings.name ? 40 : 30,
    head: [['Tipo de Vehículo', 'Cobro por Minuto', 'Base']],
    body: body
  });

  if (download) {
    doc.save(`Tarifario.pdf`);
  } else {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }
};
