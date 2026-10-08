const fs = require('fs');

// Patch TicketPreviewModal.tsx
let modalContent = fs.readFileSync('src/components/pms/TicketPreviewModal.tsx', 'utf8');

modalContent = modalContent.replace(
  'onSendWhatsApp: () => void;',
  'onSendWhatsApp: () => void;\n  onExportPdf?: () => void;'
);

modalContent = modalContent.replace(
  'onSendWhatsApp,\n}) => {',
  'onSendWhatsApp,\n  onExportPdf,\n}) => {'
);

const buttonsOld = `<button
                    onClick={onSendWhatsApp}
                    className="h-11 rounded-full bg-[#2B9E78] hover:bg-[#238262] text-white text-xs font-bold shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    WhatsApp
                  </button>`;

const buttonsNew = `<button
                    onClick={onSendWhatsApp}
                    className="h-11 rounded-full bg-[#2B9E78] hover:bg-[#238262] text-white text-xs font-bold shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={onExportPdf}
                    className="h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    Exportar PDF
                  </button>`;

modalContent = modalContent.replace(buttonsOld, buttonsNew);

fs.writeFileSync('src/components/pms/TicketPreviewModal.tsx', modalContent);

// Patch App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

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
            // Simply trigger print dialog for now, CSS print rules handle PDF layout
            window.print();
            showToast('Abriendo cuadro de diálogo de PDF...', 'info');
          }}`;

appContent = appContent.replace(oldWhatsApp, newWhatsApp);
fs.writeFileSync('src/App.tsx', appContent);

console.log('Patched TicketPreviewModal and App.tsx');

