const fs = require('fs');
let content = fs.readFileSync('src/components/pms/PosView.tsx', 'utf8');
content = content.replace(
  '<AntifraudPinModal type={pinModalType} onConfirm={handlePinConfirm} onCancel={() => setPinModalType(null)} />',
  '<AntifraudPinModal type={pinModalType} baseAmount={baseTotal} onConfirm={handlePinConfirm} onClose={() => setPinModalType(null)} />'
);
fs.writeFileSync('src/components/pms/PosView.tsx', content);
