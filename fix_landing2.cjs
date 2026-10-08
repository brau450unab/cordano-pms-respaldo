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
    <div className="fixed inset-0 bg-[#1A0B22]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] p-10 max-w-md w-full relative border border-gray-100">
        <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition bg-gray-50 rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-[#FFF0F6] text-[#E2498A] rounded-3xl flex items-center justify-center mx-auto mb-5 rotate-3 shadow-sm border border-[#E2498A]/10">
             <svg className="w-8 h-8 -rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
           </div>
           <h3 className="text-3xl font-black text-gray-900 tracking-tight">Acceso Operador</h3>
           <p className="text-sm font-medium text-gray-500 mt-2">Identifícate para iniciar tu turno.</p>
        </div>
        {loginStep === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Correo Electrónico</label>
              <input autoFocus type="email" required placeholder="operador@cordano.cl" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-[#E2498A] focus:bg-white focus:ring-4 focus:ring-[#E2498A]/10 transition-all text-gray-900 shadow-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Contraseña</label>
              <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-[#E2498A] focus:bg-white focus:ring-4 focus:ring-[#E2498A]/10 transition-all text-gray-900 shadow-sm" />
            </div>
            <button type="submit" className="w-full py-4 bg-[#E2498A] hover:bg-[#C83472] text-white rounded-2xl text-sm font-extrabold shadow-lg transition-all hover:-translate-y-1 mt-4">
              Ingresar al Sistema →
            </button>
          </form>
        ) : (
          <div className="py-10 flex flex-col items-center justify-center text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-[#E8F8F2] rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-[#2B9E78]/20 rotate-6">
              <svg className="w-10 h-10 text-[#2B9E78] -rotate-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-black text-gray-900">Conectando...</h3>
            <p className="text-sm font-medium text-gray-500 mt-2">Accediendo a la plataforma</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF5] font-sans selection:bg-[#E2498A] selection:text-white flex flex-col">
      {/* ── NAVBAR ── */}
      <nav className="flex items-center justify-between px-6 py-5 bg-[#FAFAF5] sticky top-0 z-40 border-b border-gray-200/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-[#2C1338] text-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer" onClick={() => onNavigate('menu')}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-[#2C1338] cursor-pointer" onClick={() => onNavigate('menu')}>ParkOps</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-8">
          <a href="#inicio" className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">General</a>
          <a href="#convenios" className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Planes Corporativos</a>
          <a href="#soporte" className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Soporte Operativo</a>
        </div>

        {isLoggedIn ? (
          <button onClick={() => onNavigate('menu')} className="px-6 py-3 bg-[#E2498A] hover:bg-[#C83472] text-white text-sm font-extrabold rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
            Ir al Dashboard →
          </button>
        ) : (
          <button onClick={() => setShowLoginModal(true)} className="px-6 py-3 bg-[#E2498A] hover:bg-[#C83472] text-white text-sm font-extrabold rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
            Acceso Garita →
          </button>
        )}
      </nav>

      {showLoginModal && <LoginModal />}

      {/* ── HERO SECTION ── */}
      <section id="inicio" className="max-w-[1400px] w-full mx-auto px-6 py-12 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: Copy & Abstract Graphic */}
        <div className="space-y-8 relative">
          <div className="flex flex-wrap items-center gap-3">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#E8F8F2] border border-[#2B9E78]/30 rounded-full text-[10px] font-black text-[#2B9E78] uppercase tracking-wide">
               <span className="w-1.5 h-1.5 rounded-full bg-[#2B9E78] animate-pulse"></span>
               Capacidad: 30 Cupos
             </div>
             <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[10px] font-black text-gray-600 uppercase tracking-wide">
               Sector: Casco Histórico
             </div>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black text-gray-900 tracking-tight leading-[1.05]">
            Sistema de<br/>
            Control<br/>
            Operacional.
          </h1>
          
          <p className="text-lg lg:text-xl text-gray-500 font-medium max-w-lg leading-relaxed">
            Plataforma integral de alta precisión para el flujo vehicular, cobro auditado y visualización de cupos en tiempo real para recintos de uso comercial.
          </p>
          
          {/* Abstract Vector Showcase / Animation Placeholder */}
          <div className="relative w-full aspect-video bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center group mt-10">
             {/* Decorative Background Grid */}
             <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI0QxRDVEQiIvPjwvc3ZnPg==')] opacity-40 group-hover:opacity-60 transition-opacity"></div>
             {/* Abstract Shapes */}
             <div className="relative z-10 w-full h-full flex items-center justify-center">
                <div className="absolute w-40 h-40 bg-[#E2498A]/20 rounded-full blur-2xl top-1/2 left-1/4 -translate-y-1/2 animate-pulse"></div>
                <div className="absolute w-48 h-48 bg-[#2B9E78]/20 rounded-full blur-2xl bottom-1/4 right-1/4 animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                {/* Clean Vector UI Representation */}
                <svg className="w-64 h-64 drop-shadow-xl transform group-hover:scale-105 transition-transform duration-700" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="50" y="50" width="300" height="200" rx="20" fill="white" stroke="#E5E7EB" strokeWidth="4"/>
                  <rect x="70" y="80" width="60" height="140" rx="8" fill="#F3F4F6"/>
                  <rect x="150" y="80" width="180" height="140" rx="8" fill="#F3F4F6"/>
                  <rect x="170" y="100" width="140" height="20" rx="4" fill="#E5E7EB"/>
                  <circle cx="100" cy="110" r="12" fill="#E2498A"/>
                  <circle cx="100" cy="150" r="12" fill="#2B9E78"/>
                  <circle cx="100" cy="190" r="12" fill="#E5E7EB"/>
                  <rect x="250" y="270" width="100" height="80" rx="12" fill="#2C1338"/>
                  <rect x="50" y="270" width="180" height="80" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="4"/>
                </svg>
             </div>
          </div>
        </div>

        {/* Right: Login Card */}
        <div className="relative w-full max-w-lg mx-auto lg:ml-auto">
          {/* Shadow Behind Card */}
          <div className="absolute inset-0 bg-[#E2498A]/10 rounded-[3rem] blur-3xl transform translate-x-4 translate-y-8 -z-10"></div>
          
          <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
             <div className="mb-8">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Acceso Operativo</h3>
                <p className="text-gray-500 font-medium text-sm mt-2">Ingresa tus credenciales autorizadas.</p>
             </div>
             
             <form onSubmit={(e) => { e.preventDefault(); setShowLoginModal(true); }} className="space-y-5">
               <div>
                 <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Correo Electrónico</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                   </div>
                   <input type="email" placeholder="operador@cordano.cl" className="w-full pl-11 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-gray-400 focus:bg-white transition-all text-gray-900" />
                 </div>
               </div>
               <div>
                 <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Contraseña</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   </div>
                   <input type="password" placeholder="••••••••" className="w-full pl-11 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-gray-400 focus:bg-white transition-all text-gray-900" />
                 </div>
               </div>
               <button type="submit" className="w-full py-4 bg-[#E2498A] hover:bg-[#C83472] text-white rounded-2xl text-sm font-extrabold shadow-lg transition-all hover:-translate-y-1 mt-6">
                 Ingresar al Sistema →
               </button>
             </form>
             
             <div className="mt-8 pt-8 border-t border-gray-100">
               <div className="bg-[#FFF0F6] rounded-2xl p-5 flex items-center justify-between border border-[#E2498A]/20">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                     <svg className="w-5 h-5 text-[#E2498A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                   </div>
                   <div>
                     <p className="text-sm font-black text-[#2C1338]">Planes Empresas</p>
                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Tarifas especiales</p>
                   </div>
                 </div>
                 <a href="#convenios" className="px-4 py-2 bg-white text-[#2C1338] text-xs font-black rounded-xl border border-gray-200 hover:border-[#E2498A] transition-colors shadow-sm">
                   Contactar
                 </a>
               </div>
             </div>
          </div>
        </div>

      </section>

      {/* ── CONVENIOS / CORPORATIVOS ── */}
      <section id="convenios" className="py-24 bg-white border-t border-gray-100">
         <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
               <h2 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-6">Planes para<br/>Empresas.</h2>
               <p className="text-lg text-gray-500 font-medium max-w-lg mb-10 leading-relaxed">
                  Asegura cupos fijos para tu empresa con facturación B2B automatizada y accesos priorizados en nuestra sucursal.
               </p>
               <ul className="space-y-6">
                 <li className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                      <svg className="w-5 h-5 text-[#E2498A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </div>
                    <div>
                       <div className="font-bold text-lg text-gray-900">Ubicación Estratégica</div>
                       <div className="text-sm font-medium text-gray-500 mt-1">Instalaciones seguras y protegidas.</div>
                    </div>
                 </li>
                 <li className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                      <svg className="w-5 h-5 text-[#E2498A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </div>
                    <div>
                       <div className="font-bold text-lg text-gray-900">Facturación Automática</div>
                       <div className="text-sm font-medium text-gray-500 mt-1">Emisión de DTE mensual consolidado.</div>
                    </div>
                 </li>
               </ul>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 p-8 sm:p-10 rounded-[2.5rem] shadow-sm">
               {contactSuccess ? (
                  <div className="text-center py-12 animate-fade-in-up">
                     <div className="w-20 h-20 bg-[#E8F8F2] text-[#2B9E78] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#2B9E78]/20">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                     </div>
                     <h3 className="text-2xl font-black mb-2 text-gray-900">Solicitud Recibida</h3>
                     <p className="text-gray-500 font-medium">Un ejecutivo de ventas te contactará a la brevedad.</p>
                  </div>
               ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-5">
                     <h3 className="text-2xl font-black mb-6 text-gray-900">Cotizar Plan</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Nombre</label>
                           <input required type="text" className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#E2498A] transition-all shadow-sm" />
                        </div>
                        <div>
                           <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Empresa</label>
                           <input required type="text" className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#E2498A] transition-all shadow-sm" />
                        </div>
                     </div>
                     <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Correo Electrónico</label>
                        <input required type="email" className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#E2498A] transition-all shadow-sm" />
                     </div>
                     <button type="submit" disabled={isSubmittingContact} className="w-full py-4 bg-[#2C1338] hover:bg-[#412A4C] text-white rounded-2xl text-sm font-extrabold shadow-md transition-all hover:-translate-y-1 mt-4 disabled:opacity-50">
                        {isSubmittingContact ? 'Enviando...' : 'Solicitar Información'}
                     </button>
                  </form>
               )}
            </div>
         </div>
      </section>

      {/* ── FAQ & SEARCH SECTION (BOTTOM) ── */}
      <section id="soporte" className="py-24 bg-[#2C1338] text-white text-center">
         <div className="max-w-[800px] mx-auto px-6">
            <h2 className="text-4xl font-black mb-4 tracking-tight">Soporte Operativo</h2>
            <p className="text-gray-400 font-medium mb-10 text-lg">Busca respuestas a procedimientos de la garita o incidentes.</p>
            
            <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto group">
               <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 group-focus-within:text-[#E2498A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Ej: ¿Qué hacer si hay un ticket extraviado?"
                 className="w-full pl-16 pr-36 py-5 bg-[#1A0B22] border border-white/10 rounded-full text-base font-bold text-white focus:outline-none focus:border-[#E2498A] transition-all shadow-inner placeholder:text-gray-600"
               />
               <button type="submit" className="absolute right-2.5 top-2.5 bottom-2.5 px-8 bg-[#E2498A] hover:bg-[#C83472] text-white rounded-full font-extrabold text-sm transition-colors shadow-md">
                 Buscar
               </button>
            </form>

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-3xl mx-auto">
               {['Arqueo y Cierre Ciego', 'Ingresar Plan Corporativo', 'Pérdida de Ticket', 'Multas y Siniestros'].map((tema, i) => (
                  <button key={i} onClick={() => setShowLoginModal(true)} className="p-6 bg-white/5 border border-white/10 rounded-[1.5rem] hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-between group">
                    <span className="font-bold text-gray-200 group-hover:text-white">{tema}</span>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-[#E2498A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                  </button>
               ))}
            </div>
         </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 bg-[#1A0B22] text-gray-500 text-center text-xs font-bold border-t border-white/5">
         <p>© {new Date().getFullYear()} Cordano Inversiones Inmobiliarias Ltda.</p>
      </footer>
    </div>
  );
};
`
fs.writeFileSync('src/components/pms/LandingView.tsx', content);
