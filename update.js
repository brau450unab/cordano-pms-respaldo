const fs = require('fs');
const file = 'src/components/pms/LandingView.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 =         {/* Right: Login Widget */}
        <div className=\"w-full xl:w-[420px] shrink-0\">
          <div className=\"bg-white rounded-[24px] p-8 shadow-floating border border-toggl-border relative overflow-hidden\">;

const replace1 =         {/* Right: Login Widget or Dashboard Link */}
        <div className=\"w-full xl:w-[420px] shrink-0\">
          {isLoggedIn ? (
            <div className=\"bg-white rounded-[24px] p-8 shadow-floating border border-toggl-border flex flex-col items-center justify-center text-center h-full min-h-[400px]\">
              <div className=\"w-20 h-20 bg-[#F6EDFA] text-toggl-purple rounded-full flex items-center justify-center text-4xl mb-6\">
                👤
              </div>
              <h3 className=\"text-2xl font-black text-toggl-dark mb-2 tracking-tight\">¡Hola, {user?.name || 'Usuario'}!</h3>
              <p className=\"text-toggl-muted text-sm mb-8\">
                Sesión activa ({user?.role === 'administrador' ? 'Administrador' : 'Operador'})
              </p>
              <button 
                onClick={() => onNavigate('menu')}
                className=\"w-full py-4 bg-toggl-magenta hover:bg-toggl-pink text-white font-bold rounded-xl transition-all shadow-btn hover:shadow-btn-hover\"
              >
                Continuar al Dashboard →
              </button>
            </div>
          ) : (
          <div className=\"bg-white rounded-[24px] p-8 shadow-floating border border-toggl-border relative overflow-hidden\">;

content = content.replace(target1, replace1);

const target2 =                   </div>
                )}
              </div>
            </div>
        </div>
      </section>;

const replace2 =                   </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>;

content = content.replace(target2, replace2);
fs.writeFileSync(file, content);
