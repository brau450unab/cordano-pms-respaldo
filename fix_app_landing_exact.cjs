const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const search = `            <LandingView
              onNavigate={(screen) => handleNavigate(screen)}
              shiftTimer={shiftTimer}
              onInitiateCashClose={() => setIsArqueoCiegoModalOpen(true)}
              onShowToast={(msg, type) => showToast(msg, type)}
            />`;

const replace = `            <LandingView
              onLoginSuccess={() => handleNavigate('menu')}
              onNavigate={(screen) => handleNavigate(screen)}
              shiftTimer={shiftTimer}
              onInitiateCashClose={() => setIsArqueoCiegoModalOpen(true)}
              onShowToast={(msg, type) => showToast(msg, type as any)}
            />`;

content = content.replace(search, replace);
fs.writeFileSync('src/App.tsx', content);
