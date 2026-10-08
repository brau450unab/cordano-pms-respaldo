const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
const searchApp = `      if (e.key === 'F1' && !isInput) {
        e.preventDefault();
        handleNavigate('menu');
      } else if (e.key === 'F2' && !isInput) {
        e.preventDefault();
        setPosInitialSubtab('entry');
        handleNavigate('pos');
      } else if (e.key === 'F3' && !isInput) {
        e.preventDefault();
        handleNavigate('clients');
      } else if (e.key === 'F4' && !isInput) {
        e.preventDefault();
        setPosInitialSubtab('exit');
        handleNavigate('pos');
      } else if (e.key === 'F8') {
        e.preventDefault();
        showToast('Impresión térmica 80mm ejecutada (QR + Code 128).', 'success');
      }`;
appContent = appContent.replace(searchApp, '');
fs.writeFileSync('src/App.tsx', appContent);

let posContent = fs.readFileSync('src/components/pms/PosView.tsx', 'utf8');
const searchPos = `      if (e.key === 'F2' && !isInput) {
        e.preventDefault();
        document.getElementById('pos-plate-input')?.focus();
      } else if (e.key === 'F4' && !isInput) {
        e.preventDefault();
        document.getElementById('pos-ticket-input')?.focus();
      } else if (e.key === 'F6') {
        e.preventDefault();
        // action dcto
      } else if (e.key === 'F7') {
        e.preventDefault();
        // action extravio
      } else if (e.key === 'F8') {
        e.preventDefault();
        onShowToast('Impresión térmica 80mm ejecutada', 'success');
      }`;
posContent = posContent.replace(searchPos, '');
fs.writeFileSync('src/components/pms/PosView.tsx', posContent);

let navContent = fs.readFileSync('src/components/pms/PlatformNavbar.tsx', 'utf8');
navContent = navContent.replace(/\[F\d{1,2}\]/g, '');
navContent = navContent.replace(/ shortcut: 'F\d{1,2}',/g, '');
fs.writeFileSync('src/components/pms/PlatformNavbar.tsx', navContent);

console.log('Shortcuts removed for sure.');
