const fs = require('fs');
let content = fs.readFileSync('src/components/pms/LandingView.tsx', 'utf8');

const replaceProps = `interface LandingViewProps {
  onLoginSuccess: () => void;
  onNavigate?: (screen: any) => void;
  shiftTimer?: string;
  onInitiateCashClose?: () => void;
  onShowToast?: (msg: string, type: string) => void;
}`;

content = content.replace(`interface LandingViewProps {\n  onLoginSuccess: () => void;\n}`, replaceProps);
fs.writeFileSync('src/components/pms/LandingView.tsx', content);
