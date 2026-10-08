const fs = require('fs');
let cssContent = fs.readFileSync('src/index.css', 'utf8');

if (!cssContent.includes('@media print')) {
  cssContent += `
@media print {
  body * {
    visibility: hidden;
  }
  #ticket-receipt, #ticket-receipt * {
    visibility: visible;
  }
  #ticket-receipt {
    position: absolute;
    left: 0;
    top: 0;
    width: 80mm;
    margin: 0;
    padding: 0;
  }
}
`;
  fs.writeFileSync('src/index.css', cssContent);
}
console.log('CSS updated.');

let modalContent = fs.readFileSync('src/components/pms/TicketPreviewModal.tsx', 'utf8');
// revert the hack
modalContent = modalContent.replace(/\(\(\) => \{[^]*?onPrintTicket\(\);\n\s*\}\)\(\)/g, `(() => { window.print(); onPrintTicket(); })()`);
fs.writeFileSync('src/components/pms/TicketPreviewModal.tsx', modalContent);
