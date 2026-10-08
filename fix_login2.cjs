const fs = require('fs');
const file = 'src/components/pms/LandingView.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `        {/* Right: Login Card */}
        <div className="w-full xl:w-[420px] shrink-0 mt-4 xl:mt-0">
          <div className="bg-toggl-surface border border-toggl-border rounded-[28px] shadow-card p-8">`;

const replaceStr = `        {/* Right: Login Card or Dashboard Link */}
        <div className="w-full xl:w-[420px] shrink-0 mt-4 xl:mt-0">
          {isLoggedIn ? (
            <div className="bg-toggl-surface border border-toggl-border rounded-[28px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-20 h-20 bg-[#F6EDFA] text-toggl-purple rounded-full flex items-center justify-center text-4xl mb-6">
                👤
              </div>
              <h3 className="text-2xl font-black text-toggl-dark mb-2 tracking-tight">¡Hola, {user?.name || 'Usuario'}!</h3>
              <p className="text-toggl-muted text-sm mb-8">
                Sesión activa ({user?.role === 'administrador' ? 'Administrador' : 'Operador'})
              </p>
              <button 
                onClick={() => onNavigate('menu')}
                className="w-full py-4 bg-toggl-magenta hover:bg-toggl-pink text-white font-bold rounded-xl transition-all shadow-sm flex justify-center items-center gap-2"
              >
                Continuar al Dashboard →
              </button>
            </div>
          ) : (
          <div className="bg-toggl-surface border border-toggl-border rounded-[28px] shadow-card p-8">`;

const endLoginTarget = `            </div>
          </div>
        </div>
      </section>`;

const endLoginReplace = `            </div>
          </div>
          )}
        </div>
      </section>`;

content = content.replace(targetStr, replaceStr);
content = content.replace(endLoginTarget, endLoginReplace);

fs.writeFileSync(file, content);
console.log('Done replacement');
