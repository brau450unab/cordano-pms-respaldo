const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

const searchWhatsApp = `        onSendWhatsApp={() => {
          showToast('Comprobante digital enviado vía WhatsApp.', 'success');
        }}`;

const replaceWhatsApp = `        onSendWhatsApp={() => {
          if (!ticketPreviewData) return;
          const text = encodeURIComponent(\`*ParkOps - Ingreso Registrado*\\n\\n🚗 Vehículo: *\${ticketPreviewData.plateNumber}*\\n🎫 Ticket: \${ticketPreviewData.ticketCode}\\n\\nEl comprobante en PDF puede ser generado desde la opción Exportar.\`);
          window.open(\`https://wa.me/?text=\${text}\`, '_blank');
          showToast('Redirigiendo a WhatsApp...', 'success');
        }}`;

appContent = appContent.replace(searchWhatsApp, replaceWhatsApp);
fs.writeFileSync('src/App.tsx', appContent);
console.log('WhatsApp updated.');
