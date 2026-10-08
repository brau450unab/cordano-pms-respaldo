const fs = require('fs');
let content = fs.readFileSync('src/components/pms/LandingView.tsx', 'utf8');

const oldProps = `interface LandingViewProps {
  onLoginSuccess: () => void;
}`;

const newProps = `interface LandingViewProps {
  onLoginSuccess: () => void;
  onNavigate?: (screen: string) => void;
  shiftTimer?: string;
  onInitiateCashClose?: () => void;
  onShowToast?: (msg: string, type: string) => void;
}`;

content = content.replace(oldProps, newProps);
fs.writeFileSync('src/components/pms/LandingView.tsx', content);
