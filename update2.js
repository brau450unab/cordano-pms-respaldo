const fs = require('fs');
const file = 'src/components/pms/LandingView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Hide navbar when logged in
content = content.replace(
  /{[\s\S]*?\/\* ── STITCH DESIGN NAVBAR \(TOGGL AESTHETIC\) ── \*\/[\s\S]*?<nav/g,
  \{/* ── STITCH DESIGN NAVBAR (TOGGL AESTHETIC) ── */}
      {!isLoggedIn && (
        <nav\
);
// the end of the nav closing tag
content = content.replace(
  /Acceso Garita →\n          <\/button>\n        <\/nav>/g,
  \Acceso Garita →\n          </button>\n        </nav>\n      )}\
);

// Conditionally render Dashboard button if isLoggedIn
const targetLogin = \        {/* Right: Login Widget */}
        <div className="w-full xl:w-[420px] shrink-0">
          <div className="bg-white rounded-[24px] p-8 shadow-floating border border-toggl-border relative overflow-hidden">\;

const replaceLogin = \        {/* Right: Login Widget or Dashboard Link */}
        <div className="w-full xl:w-[420px] shrink-0">
          {isLoggedIn ? (
            <div className="bg-white rounded-[24px] p-8 shadow-floating border border-toggl-border flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="w-20 h-20 bg-[#F6EDFA] text-toggl-purple rounded-full flex items-center justify-center text-4xl mb-6">
                👤
              </div>
              <h3 className="text-2xl font-black text-toggl-dark mb-2 tracking-tight">¡Hola, {user?.name || 'Usuario'}!</h3>
              <p className="text-toggl-muted text-sm mb-8">
                Sesión activa ({user?.role === 'administrador' ? 'Administrador' : 'Operador'})
              </p>
              <button 
                onClick={() => onNavigate('menu')}
                className="w-full py-4 bg-toggl-magenta hover:bg-toggl-pink text-white font-bold rounded-xl transition-all shadow-btn hover:shadow-btn-hover"
              >
                Continuar al Dashboard →
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] p-8 shadow-floating border border-toggl-border relative overflow-hidden">\;

content = content.replace(targetLogin, replaceLogin);

const endLogin = \                  </div>
                )}
              </div>
            </div>
        </div>\;
        
const endReplace = \                  </div>
                )}
              </div>
            </div>
          )}
        </div>\;
        
content = content.replace(endLogin, endReplace);

fs.writeFileSync(file, content);
console.log('Update done');
