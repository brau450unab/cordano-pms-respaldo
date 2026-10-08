const fs = require('fs');
let navContent = fs.readFileSync('src/components/pms/PlatformNavbar.tsx', 'utf8');

const regex = /\{isAvatarMenuOpen && \([\s\S]*?\)\}\n\s*<\/div>\n\s*<\/div>\n\s*<\/header>/;

const newDropdown = `{isAvatarMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#2C1338] border border-[#412A4C] rounded-2xl shadow-[0_16px_48px_rgba(44,19,56,0.5)] z-50 overflow-hidden animate-fade-in-up">
                {/* Header (Sesión) */}
                <div className="px-5 py-4 border-b border-[#412A4C] bg-[#1E0C25]/80">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#E2498A] text-white flex items-center justify-center font-black text-lg shadow-[0_4px_12px_rgba(226,73,138,0.3)]">
                      {initials}
                    </div>
                    <div>
                      <p className="text-white font-extrabold text-sm tracking-wide leading-tight">{operatorName}</p>
                      <p className="text-[#E57CD8] text-xs font-medium">{user.role === 'admin' ? 'Administrador' : 'Operador de Garita'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-[#412A4C]/50 mt-1">
                    <span className="text-[#8C7C92] font-medium">Hora del Sistema</span>
                    <span className="text-white font-bold tracking-wider">{currentTime.toLocaleTimeString('es-CL')}</span>
                  </div>
                </div>

                {/* Body (Turno) */}
                <div className="px-5 py-4 bg-[#2C1338]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#96859B]">Control de Turno</h3>
                    {currentShift.status === 'abierto' ? (
                      <span className="bg-[#2B9E78]/20 text-[#2B9E78] px-2 py-0.5 rounded text-[10px] font-bold">ABIERTO</span>
                    ) : (
                      <span className="bg-[#EAA023]/20 text-[#EAA023] px-2 py-0.5 rounded text-[10px] font-bold">CERRADO</span>
                    )}
                  </div>
                  
                  {currentShift.status === 'abierto' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-[#1E0C25] p-2 rounded-lg border border-[#412A4C]">
                          <div className="text-[#8C7C92] text-[10px] mb-0.5">Tiempo Activo</div>
                          <div className="font-bold text-[#E57CD8]">{shiftTimer}</div>
                        </div>
                        <div className="bg-[#1E0C25] p-2 rounded-lg border border-[#412A4C]">
                          <div className="text-[#8C7C92] text-[10px] mb-0.5">Base Inicial</div>
                          <div className="font-bold text-white">$ {currentShift.initialCash ? currentShift.initialCash.toLocaleString('es-CL') : 0}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => { onInitiateCashClose(); setIsAvatarMenuOpen(false); }}
                        className="w-full flex justify-center items-center gap-2 py-3 bg-[#E2498A]/10 hover:bg-[#E2498A] border border-[#E2498A]/30 text-[#E57CD8] hover:text-white rounded-xl text-xs font-bold transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Cerrar Turno (Arqueo Ciego)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-[#8C7C92] leading-relaxed">El turno actual se encuentra cerrado. Para realizar transacciones y emitir tickets, debe abrir la caja declarando su fondo inicial (Sencillo).</p>
                      <button
                        onClick={() => {
                          const cash = window.prompt('Ingrese el monto de fondo de caja inicial (sencillo) en CLP:', '50000');
                          if (cash !== null && !isNaN(parseInt(cash))) {
                             window.dispatchEvent(new CustomEvent('pms:openShift', { detail: { cash: parseInt(cash) } }));
                             setIsAvatarMenuOpen(false);
                          }
                        }}
                        className="w-full flex justify-center items-center gap-2 py-3 bg-[#2B9E78] hover:bg-[#238262] text-white rounded-xl text-xs font-bold shadow-md transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Iniciar Nuevo Turno
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer (Cerrar Sesión) */}
                <div className="p-2 border-t border-[#412A4C] bg-[#1E0C25]">
                  <button
                    onClick={() => { onLogout(); setIsAvatarMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#412A4C] text-[#CDBFC7] hover:text-white transition-colors text-xs font-bold"
                  >
                    Cerrar Sesión del Sistema
                    <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>`;

navContent = navContent.replace(regex, newDropdown);
fs.writeFileSync('src/components/pms/PlatformNavbar.tsx', navContent);
console.log('Dropdown updated successfully.');
