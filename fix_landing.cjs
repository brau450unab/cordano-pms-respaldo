const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import { AppScreen } from '../../types';

interface LandingViewProps {
  onLoginSuccess: (targetScreen?: AppScreen) => void;
  onNavigate: (screen: AppScreen) => void;
  shiftTimer?: string;
  onInitiateCashClose?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onLoginSuccess,
  onNavigate,
  onShowToast,
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginStep, setLoginStep] = useState<'credentials' | 'success'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  
  // Fake login state to mimic real UI flow
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const state = localStorage.getItem('pms_matic_is_logged_in');
    setIsLoggedIn(state === 'true');
  }, []);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStep('success');
    setTimeout(() => {
      setIsLoggedIn(true);
      onLoginSuccess();
      setShowLoginModal(false);
    }, 1200);
  };
  
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    setTimeout(() => {
      setIsSubmittingContact(false);
      setContactSuccess(true);
    }, 1500);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
       setShowLoginModal(true);
    } else {
       onNavigate('support');
    }
  };

  const LoginModal = () => (
    <div className="fixed inset-0 bg-[#2C1338]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-[#FEF9F5] rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] p-10 max-w-md w-full relative">
        <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 p-2 text-[#96859B] hover:text-[#2C1338] transition bg-white rounded-full shadow-sm hover:shadow-md">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="text-center mb-8">
           <div className="w-14 h-14 bg-[#FEE8E8] text-[#E2498A] rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-sm border border-[#E2498A]/20">
             <svg className="w-7 h-7 -rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
           </div>
           <h3 className="text-2xl font-black text-[#2C1338] tracking-tight">Acceso Requerido</h3>
           <p className="text-sm font-medium text-[#65546C] mt-2">Inicia sesión con tus credenciales de operador.</p>
        </div>
        {loginStep === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#96859B] uppercase tracking-wider mb-2 ml-1">Correo Electrónico</label>
              <input type="text" required placeholder="operador@cordano.cl" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-5 py-4 bg-white border border-[#EDE4E2] rounded-2xl text-sm font-semibold focus:outline-none focus:border-[#E2498A] focus:ring-4 focus:ring-[#E2498A]/10 transition-all text-[#2C1338] shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#96859B] uppercase tracking-wider mb-2 ml-1">Contraseña</label>
              <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-4 bg-white border border-[#EDE4E2] rounded-2xl text-sm font-semibold focus:outline-none focus:border-[#E2498A] focus:ring-4 focus:ring-[#E2498A]/10 transition-all text-[#2C1338] shadow-sm" />
            </div>
            <button type="submit" className="w-full py-4 bg-[#E2498A] hover:bg-[#E57CD8] text-white rounded-2xl text-sm font-extrabold shadow-[0_8px_20px_rgba(226,73,138,0.25)] transition-all hover:-translate-y-1 mt-4">
              Ingresar a la Plataforma
            </button>
          </form>
        ) : (
          <div className="py-10 flex flex-col items-center justify-center text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-[#E8F8F2] rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-[#2B9E78]/20 rotate-6">
              <svg className="w-10 h-10 text-[#2B9E78] -rotate-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-black text-[#2C1338]">Conectando...</h3>
            <p className="text-sm font-medium text-[#65546C] mt-2">Cargando módulos y turnos</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FEF9F5] font-sans selection:bg-[#E2498A] selection:text-white flex flex-col">
      {/* ── NAVBAR (MODERN PILLS STYLE) ── */}
      <nav className="flex items-center justify-between px-6 py-4 bg-[#FEF9F5]/90 backdrop-blur-xl border-b border-[#EDE4E2] sticky top-0 z-50">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-[#2C1338] text-[#FEE8E8] rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(44,19,56,0.15)] transform -rotate-3 transition-transform hover:rotate-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[#2C1338]">ParkOps</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-2 bg-white p-1.5 rounded-full border border-[#EDE4E2] shadow-sm">
          <a href="#inicio" className="px-5 py-2.5 rounded-full text-sm font-bold text-[#65546C] hover:text-[#2C1338] hover:bg-[#FEF9F5] transition-all">Inicio</a>
          <a href="#soporte" className="px-5 py-2.5 rounded-full text-sm font-bold text-[#65546C] hover:text-[#2C1338] hover:bg-[#FEF9F5] transition-all">Buscar y Soporte</a>
          <a href="#convenios" className="px-5 py-2.5 rounded-full text-sm font-bold text-[#65546C] hover:text-[#2C1338] hover:bg-[#FEF9F5] transition-all">Convenios Mensuales</a>
        </div>

        {isLoggedIn ? (
          <button 
            onClick={() => onNavigate('menu')}
            className="px-6 py-3 bg-[#2C1338] text-white text-sm font-extrabold rounded-full hover:bg-[#412A4C] transition-all shadow-[0_4px_14px_rgba(44,19,56,0.3)] hover:-translate-y-0.5 flex items-center gap-2"
          >
            Ir al Dashboard
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
          </button>
        ) : (
          <button 
            onClick={() => setShowLoginModal(true)}
            className="px-6 py-3 bg-[#E2498A] text-white text-sm font-extrabold rounded-full hover:bg-[#E57CD8] transition-all shadow-[0_4px_14px_rgba(226,73,138,0.3)] hover:-translate-y-0.5"
          >
            Iniciar Sesión
          </button>
        )}
      </nav>

      {showLoginModal && <LoginModal />}

      {/* ── HERO SECTION (RICH & BOLD) ── */}
      <section id="inicio" className="max-w-[1200px] mx-auto px-6 pt-24 pb-20 text-center relative">
        {/* Background Decorative Shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#FEE8E8] to-transparent rounded-full blur-[100px] -z-10 opacity-70"></div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E2498A]/20 rounded-full text-xs font-black text-[#E2498A] mb-8 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E2498A] animate-pulse"></span>
          PMS Operativo v2.0
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-[#2C1338] tracking-tight leading-[1.05] mb-8">
          Gestión de cupos<br className="hidden md:block"/> sin interrupciones.
        </h1>
        
        <p className="text-lg md:text-xl text-[#65546C] max-w-2xl mx-auto font-medium leading-relaxed mb-12">
          Control de acceso ultra rápido, facturación automatizada y arqueos de caja transparentes. Diseñado para mantener el flujo en todo momento.
        </p>

        {/* Abstract Product Showcase Graphic */}
        <div className="relative w-full max-w-4xl mx-auto bg-white border border-[#EDE4E2] rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(44,19,56,0.1)] p-4 overflow-hidden mb-12">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI0VERTRFMiIvPjwvc3ZnPg==')] opacity-60"></div>
            
            <div className="relative z-10 bg-[#FEF9F5]/80 backdrop-blur-sm rounded-[2rem] border border-[#EDE4E2]/50 p-6 sm:p-10">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EDE4E2] text-left transform transition hover:-translate-y-1">
                     <div className="w-12 h-12 bg-[#E8F8F2] text-[#2B9E78] rounded-2xl flex items-center justify-center mb-5 border border-[#2B9E78]/20">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                     </div>
                     <h3 className="font-black text-[#2C1338] text-lg mb-2">Ingreso Rápido</h3>
                     <p className="text-sm font-medium text-[#65546C]">Registro y emisión de tickets en un clic. Atajos de teclado para no usar el mouse.</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EDE4E2] text-left transform transition hover:-translate-y-1">
                     <div className="w-12 h-12 bg-[#FEE8E8] text-[#E2498A] rounded-2xl flex items-center justify-center mb-5 border border-[#E2498A]/20">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                     </div>
                     <h3 className="font-black text-[#2C1338] text-lg mb-2">Arqueos Seguros</h3>
                     <p className="text-sm font-medium text-[#65546C]">Cierre ciego sin visibilidad del monto del sistema para evitar descuadres. Trazabilidad total.</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EDE4E2] text-left transform transition hover:-translate-y-1">
                     <div className="w-12 h-12 bg-[#F3E8FF] text-[#9333EA] rounded-2xl flex items-center justify-center mb-5 border border-[#9333EA]/20">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>
                     </div>
                     <h3 className="font-black text-[#2C1338] text-lg mb-2">Modo Contingencia</h3>
                     <p className="text-sm font-medium text-[#65546C]">Continúa la operación usando comprobantes manuales si se interrumpe la conexión.</p>
                  </div>
               </div>
            </div>
        </div>
      </section>

      {/* ── FAQ & SEARCH SECTION ── */}
      <section id="soporte" className="py-24 bg-white border-y border-[#EDE4E2]">
         <div className="max-w-[800px] mx-auto px-6 text-center">
            <h2 className="text-4xl font-black text-[#2C1338] mb-4 tracking-tight">Centro de Ayuda</h2>
            <p className="text-[#65546C] font-medium mb-10 text-lg">Respuestas rápidas a procedimientos operativos de la garita.</p>
            
            <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
               <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#96859B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Ej: ¿Cómo registrar un ticket perdido?"
                 className="w-full pl-16 pr-36 py-5 bg-[#FEF9F5] border border-[#EDE4E2] rounded-full text-base font-bold text-[#2C1338] focus:outline-none focus:border-[#E2498A] focus:ring-4 focus:ring-[#E2498A]/10 transition-all shadow-sm"
               />
               <button type="submit" className="absolute right-2.5 top-2.5 bottom-2.5 px-8 bg-[#2C1338] hover:bg-[#412A4C] text-white rounded-full font-extrabold text-sm transition-colors shadow-md">
                 Buscar
               </button>
            </form>

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-5 text-left max-w-2xl mx-auto">
               <button onClick={() => setShowLoginModal(true)} className="p-6 bg-[#FEF9F5] border border-[#EDE4E2] rounded-[2rem] hover:border-[#E2498A]/50 hover:shadow-lg transition-all group">
                  <h4 className="font-black text-[#2C1338] group-hover:text-[#E2498A] transition-colors mb-2 text-lg">Cierre de Caja</h4>
                  <p className="text-sm font-medium text-[#65546C] leading-relaxed">Manual paso a paso para cuadrar el efectivo y emitir el corte Z.</p>
               </button>
               <button onClick={() => setShowLoginModal(true)} className="p-6 bg-[#FEF9F5] border border-[#EDE4E2] rounded-[2rem] hover:border-[#E2498A]/50 hover:shadow-lg transition-all group">
                  <h4 className="font-black text-[#2C1338] group-hover:text-[#E2498A] transition-colors mb-2 text-lg">Gestión de Convenios</h4>
                  <p className="text-sm font-medium text-[#65546C] leading-relaxed">Cómo ingresar una nueva patente al listado de corporativos.</p>
               </button>
               <button onClick={() => setShowLoginModal(true)} className="p-6 bg-[#FEF9F5] border border-[#EDE4E2] rounded-[2rem] hover:border-[#E2498A]/50 hover:shadow-lg transition-all group">
                  <h4 className="font-black text-[#2C1338] group-hover:text-[#E2498A] transition-colors mb-2 text-lg">Pérdida de Ticket</h4>
                  <p className="text-sm font-medium text-[#65546C] leading-relaxed">Pasos a seguir si un cliente extravía su comprobante de ingreso.</p>
               </button>
               <button onClick={() => setShowLoginModal(true)} className="p-6 bg-[#FEF9F5] border border-[#EDE4E2] rounded-[2rem] hover:border-[#E2498A]/50 hover:shadow-lg transition-all group">
                  <h4 className="font-black text-[#2C1338] group-hover:text-[#E2498A] transition-colors mb-2 text-lg">Multas y Siniestros</h4>
                  <p className="text-sm font-medium text-[#65546C] leading-relaxed">Protocolo ante vehículos dañados o sobrestadía prolongada.</p>
               </button>
            </div>
         </div>
      </section>

      {/* ── CONTACT & CONVENIOS ── */}
      <section id="convenios" className="py-24 bg-[#2C1338] text-white flex-1 flex flex-col justify-center">
         <div className="max-w-[1200px] mx-auto px-6 flex flex-col lg:flex-row gap-16 items-center w-full">
            <div className="flex-1">
               <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8 leading-[1.1]">Convenios<br />Mensuales.</h2>
               <p className="text-lg text-[#96859B] max-w-lg mb-10 font-medium leading-relaxed">
                  Asegura cupos fijos para tu empresa con facturación automatizada y accesos priorizados.
               </p>
               
               <div className="space-y-8">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-sm">
                      <svg className="w-6 h-6 text-[#E2498A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </div>
                    <div>
                       <div className="font-bold text-lg text-white mb-1">Ubicación Estratégica</div>
                       <div className="text-sm font-medium text-[#96859B]">Instalaciones seguras a pasos del centro.</div>
                    </div>
                 </div>
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-sm">
                      <svg className="w-6 h-6 text-[#E2498A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </div>
                    <div>
                       <div className="font-bold text-lg text-white mb-1">Facturación B2B</div>
                       <div className="text-sm font-medium text-[#96859B]">Emisión de DTE mensual consolidado.</div>
                    </div>
                 </div>
               </div>
            </div>

            <div className="w-full lg:w-[480px]">
               <div className="bg-[#412A4C] border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
                  {contactSuccess ? (
                     <div className="text-center py-12">
                        <div className="w-20 h-20 bg-[#2B9E78]/20 text-[#2B9E78] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner rotate-3">
                           <svg className="w-10 h-10 -rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <h3 className="text-2xl font-black mb-3 text-white">Solicitud Recibida</h3>
                        <p className="text-[#96859B] text-sm font-medium">Un ejecutivo te contactará a la brevedad.</p>
                     </div>
                  ) : (
                     <form onSubmit={handleContactSubmit} className="space-y-6">
                        <h3 className="text-2xl font-black mb-8 text-white">Cotizar Convenio</h3>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-[11px] font-bold text-[#96859B] uppercase tracking-wider mb-2 ml-1">Nombre</label>
                              <input required type="text" className="w-full px-5 py-4 bg-[#2C1338] border border-transparent rounded-2xl text-sm font-semibold text-white focus:outline-none focus:border-[#E2498A] transition-all shadow-inner" />
                           </div>
                           <div>
                              <label className="block text-[11px] font-bold text-[#96859B] uppercase tracking-wider mb-2 ml-1">Empresa</label>
                              <input required type="text" className="w-full px-5 py-4 bg-[#2C1338] border border-transparent rounded-2xl text-sm font-semibold text-white focus:outline-none focus:border-[#E2498A] transition-all shadow-inner" />
                           </div>
                        </div>
                        <div>
                           <label className="block text-[11px] font-bold text-[#96859B] uppercase tracking-wider mb-2 ml-1">Correo Corporativo</label>
                           <input required type="email" className="w-full px-5 py-4 bg-[#2C1338] border border-transparent rounded-2xl text-sm font-semibold text-white focus:outline-none focus:border-[#E2498A] transition-all shadow-inner" />
                        </div>
                        <button type="submit" disabled={isSubmittingContact} className="w-full py-4 bg-[#E2498A] hover:bg-[#E57CD8] text-white rounded-2xl text-sm font-extrabold shadow-[0_8px_20px_rgba(226,73,138,0.25)] transition-all hover:-translate-y-1 mt-4 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none">
                           {isSubmittingContact ? 'Procesando...' : 'Solicitar Información'}
                        </button>
                     </form>
                  )}
               </div>
            </div>
         </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 bg-[#1A0B22] text-[#65546C] text-center text-xs font-bold border-t border-white/5">
         <p>© {new Date().getFullYear()} Cordano Inversiones Inmobiliarias Ltda.</p>
      </footer>
    </div>
  );
};
`
fs.writeFileSync('src/components/pms/LandingView.tsx', content);
console.log('LandingView.tsx completely rewritten.');
