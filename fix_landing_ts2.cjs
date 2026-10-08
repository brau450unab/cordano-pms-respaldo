const fs = require('fs');
let content = fs.readFileSync('src/components/pms/LandingView.tsx', 'utf8');
content = content.replace(`onNavigate?: (screen: string) => void;`, `onNavigate?: (screen: any) => void;`);
fs.writeFileSync('src/components/pms/LandingView.tsx', content);
