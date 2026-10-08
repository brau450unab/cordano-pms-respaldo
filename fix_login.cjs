const fs = require('fs');
let content = fs.readFileSync('src/components/pms/LandingView.tsx', 'utf8');

// Replace const { user, isLoggedIn } = useParking();
// With const { user, isLoggedIn, setIsLoggedIn } = useParking();
content = content.replace(
  `const { user, isLoggedIn } = useParking();`,
  `const { user, isLoggedIn, setIsLoggedIn } = useParking();`
);

// Replace onLoginSuccess();
// With setIsLoggedIn(true); onLoginSuccess();
content = content.replace(
  `onLoginSuccess();`,
  `setIsLoggedIn(true);\n      onLoginSuccess();`
);

fs.writeFileSync('src/components/pms/LandingView.tsx', content);
