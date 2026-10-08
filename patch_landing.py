import re

with open('src/components/pms/LandingView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Hide nav
content = content.replace(
    '{/* ── STITCH DESIGN NAVBAR (TOGGL AESTHETIC) ── */}\n      <nav',
    '{/* ── STITCH DESIGN NAVBAR (TOGGL AESTHETIC) ── */}\n      {!isLoggedIn && (\n        <nav'
)
content = content.replace(
    'Acceso Garita →\n          </button>\n        </nav>',
    'Acceso Garita →\n          </button>\n        </nav>\n      )}'
)

# Login toggle
target_login = """        {/* Right: Login Widget */}
        <div className="w-full xl:w-[420px] shrink-0">
          <div className="bg-white rounded-[24px] p-8 shadow-floating border border-toggl-border relative overflow-hidden">"""

replace_login = """        {/* Right: Login Widget or Dashboard Link */}
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
            <div className="bg-white rounded-[24px] p-8 shadow-floating border border-toggl-border relative overflow-hidden">"""

content = content.replace(target_login, replace_login)

end_login = """                  </div>
                )}
              </div>
            </div>
        </div>"""
        
end_replace = """                  </div>
                )}
              </div>
            </div>
          )}
        </div>"""

content = content.replace(end_login, end_replace)

with open('src/components/pms/LandingView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated successfully')
