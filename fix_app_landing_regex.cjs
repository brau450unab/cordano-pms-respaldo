const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<LandingView[\s\S]*?\/>/, `<LandingView
              onLoginSuccess={() => handleNavigate('menu')}
              onNavigate={(screen) => handleNavigate(screen)}
              shiftTimer={shiftTimer}
              onInitiateCashClose={() => setIsArqueoCiegoModalOpen(true)}
              onShowToast={(msg, type) => showToast(msg, type as any)}
            />`);

fs.writeFileSync('src/App.tsx', content);
