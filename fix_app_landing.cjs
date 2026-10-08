const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldRender = `<LandingView
              onNavigate={handleNavigate}
              shiftTimer={shiftTimer}
              onInitiateCashClose={() => setEffectiveScreen('operacion_cierre')}
              onShowToast={(msg: string, type: string) => showToast(msg, type as any)}
            />`;

const newRender = `<LandingView
              onLoginSuccess={() => handleNavigate('menu')}
              onNavigate={handleNavigate}
              shiftTimer={shiftTimer}
              onInitiateCashClose={() => setEffectiveScreen('operacion_cierre')}
              onShowToast={(msg: string, type: string) => showToast(msg, type as any)}
            />`;

// Fallback search if the previous doesn't match perfectly.
content = content.replace(/<LandingView[^>]*\/>/, newRender);

fs.writeFileSync('src/App.tsx', content);
