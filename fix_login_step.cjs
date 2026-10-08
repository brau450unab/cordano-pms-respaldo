const fs = require('fs');
let content = fs.readFileSync('src/components/pms/LandingView.tsx', 'utf8');

// Replace handleCredentialsSubmit
content = content.replace(
  /const handleCredentialsSubmit =[\s\S]*?};/,
  `const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStep('success');
    setTimeout(() => {
      setIsLoggedIn(true);
      onLoginSuccess();
      setShowLoginModal(false);
    }, 1200);
  };`
);

// Remove totp from state
content = content.replace(/const \[loginStep, setLoginStep\] = useState<[^>]*>\('credentials'\);/, `const [loginStep, setLoginStep] = useState<'credentials' | 'success'>('credentials');`);

// Remove totp form in JSX
content = content.replace(
  /: loginStep === 'totp' \? \([\s\S]*?\) : \(/,
  `: (`
);

fs.writeFileSync('src/components/pms/LandingView.tsx', content);
