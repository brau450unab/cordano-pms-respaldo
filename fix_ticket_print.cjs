const fs = require('fs');
let modalContent = fs.readFileSync('src/components/pms/TicketPreviewModal.tsx', 'utf8');

modalContent = modalContent.replace(/onPrintTicket\(\)/g, `(() => {
                    const printContents = document.getElementById('ticket-receipt')?.innerHTML;
                    if (printContents) {
                      const originalContents = document.body.innerHTML;
                      document.body.innerHTML = \`<div style="padding:20px;width:300px;margin:0 auto;font-family:sans-serif;">\${printContents}</div>\`;
                      window.print();
                      document.body.innerHTML = originalContents;
                      window.location.reload();
                    }
                    onPrintTicket();
                  })()`);

fs.writeFileSync('src/components/pms/TicketPreviewModal.tsx', modalContent);
console.log('Ticket preview print fixed.');
