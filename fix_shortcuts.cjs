const fs = require('fs');

// App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/if \(e\.key === 'F1'[^]*?else if \(e\.key === 'F8'\) {[^]*?}\n/, '');
fs.writeFileSync('src/App.tsx', appContent);

// PosView.tsx
let posContent = fs.readFileSync('src/components/pms/PosView.tsx', 'utf8');
posContent = posContent.replace(/if \(e\.key === 'F2'[^]*?else if \(e\.key === 'F8'\) {[^]*?}\n/, '');
// Also remove the badges from PosView.tsx rendering
posContent = posContent.replace(/\[F2\] Foco · /g, '');
posContent = posContent.replace(/\[F4\] Buscar · /g, '');
posContent = posContent.replace(/\[F\d{1,2}\] /g, '');
fs.writeFileSync('src/components/pms/PosView.tsx', posContent);

console.log('Shortcuts removed.');
