const fs = require('fs');
let code = `import React, { useState, useEffect } from 'react';
import { AppScreen } from '../../types';

interface LandingViewProps {
  onLoginSuccess: (targetScreen?: AppScreen) => void;
  onNavigate: (screen: AppScreen) => void;
  shiftTimer?: string;
  onInitiateCashClose?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}
`;
fs.writeFileSync('src/components/pms/LandingView.tsx', code);
