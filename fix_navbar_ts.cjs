const fs = require('fs');
let content = fs.readFileSync('src/components/pms/PlatformNavbar.tsx', 'utf8');

// Fix 1: status check
content = content.replace(/currentShift\?\.status === 'OPEN'/g, `currentShift?.status === 'abierto'`);

// Fix 2: openNewShift
const oldCall = `openNewShift(50000, 'Apertura de turno')`;
const newCall = `window.dispatchEvent(new CustomEvent('pms:openShift', { detail: { amount: 50000, operator: user.id || 'admin' } }))`;
content = content.replace(oldCall, newCall);

fs.writeFileSync('src/components/pms/PlatformNavbar.tsx', content);
