const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix currentShift
content = content.replace(/currentShift\.initialCash/g, '(currentShift?.initialCash || 50000)');
content = content.replace(/currentShift\.startTime/g, '(currentShift?.startTime || new Date().toISOString())');
content = content.replace(/currentShift\.id/g, '(currentShift?.id || "N/A")');
content = content.replace(/currentShift\.cashMovements/g, '(currentShift?.cashMovements || [])');

// 2. Fix WhatsApp
const oldWhatsApp = `onSendWhatsApp={() => {
          showToast('Comprobante digital enviado vía WhatsApp.', 'success');
        }}`;

const newWhatsApp = `onSendWhatsApp={() => {
          if (!ticketPreviewData) return;
          const phoneStr = ticketPreviewData.phone ? ticketPreviewData.phone.replace(/\\D/g, '') : '';
          const msg = \`*CORDANO PMS - Ticket de Ingreso*\\n🚗 Vehículo: \${ticketPreviewData.plate}\\n🏢 Cupo: \${ticketPreviewData.slot}\\n📅 Fecha: \${new Date().toLocaleDateString()}\\n⏰ Hora: \${new Date().toLocaleTimeString()}\\n\\nRecuerde no extraviar su ticket impreso o digital. Multa por extravío: $8.000 CLP.\`;
          const waUrl = \`https://wa.me/\${phoneStr}?text=\${encodeURIComponent(msg)}\`;
          window.open(waUrl, '_blank');
          showToast('Abriendo WhatsApp Web...', 'success');
        }}
        onExportPdf={() => {
          window.print();
          showToast('Abriendo cuadro de diálogo de PDF...', 'info');
        }}`;

content = content.replace(oldWhatsApp, newWhatsApp);

fs.writeFileSync('src/App.tsx', content);
