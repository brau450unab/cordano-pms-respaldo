import React, { useState, useEffect } from 'react';
import { AppScreen } from '../../types';
import { useParking } from '../../context/ParkingContext';

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
  const { setIsLoggedIn, isLoggedIn } = useParking();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginState, setLoginState] = useState<'idle' | 'loading'>('idle');
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [contactForm, setContactForm] = useState({ name: '', company: '', email: '', plan: 'mensual' });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);


  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginState('loading');
    setTimeout(() => {
      setIsLoggedIn(true);
      setLoginState('idle');
      onLoginSuccess();
    }, 1200);
  };
  
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    setTimeout(() => {
      setIsSubmittingContact(false);
      setContactSuccess(true);
      console.log('Notifying admin@cordano.cl about new B2B request:', contactForm);
    }, 1500);
  };

  const scrollToLogin = () => {
    document.getElementById('inicio')?.scrollIntoView({ behavior: 'smooth' });
    onShowToast('Inicia sesión para continuar', 'info');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
       scrollToLogin();
    } else {
       onNavigate('support');
    }
  };

  const handleFaqClick = () => {
    if (!isLoggedIn) {
       scrollToLogin();
    } else {
       onNavigate('support');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF5] font-sans selection:bg-[#E2498A] selection:text-white flex flex-col relative">
      
      {/* ── BACKGROUND DECORATION ── */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
         <div className="absolute top-[-10%] right-[-5%] w-[80%] h-[800px] bg-[#E2498A]/5 blur-[120px] rounded-full"></div>
         <div className="absolute top-[20%] left-[-10%] w-[50%] h-[600px] bg-[#2C1338]/5 blur-[120px] rounded-full"></div>
      </div>

      {/* ── NAVBAR ── */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-5 sticky top-0 z-40 bg-[#FAFAF5]/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-[#2C1338] text-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 transition-transform cursor-pointer" onClick={() => onNavigate('menu')}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-[#2C1338] cursor-pointer" onClick={() => onNavigate('menu')}>ParkOps</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-8">
          <a href="#inicio" className="text-sm font-bold text-gray-600 hover:text-[#E2498A] transition-colors">Acceso</a>
          <a href="#proceso" className="text-sm font-bold text-gray-600 hover:text-[#E2498A] transition-colors">Operación</a>
          <a href="#matriz" className="text-sm font-bold text-gray-600 hover:text-[#E2498A] transition-colors">Matriz</a>
          <a href="#convenios" className="text-sm font-bold text-gray-600 hover:text-[#E2498A] transition-colors">Convenios</a>
          <a href="#soporte" className="text-sm font-bold text-gray-600 hover:text-[#E2498A] transition-colors">FAQ</a>
        </div>

        {isLoggedIn && (
          <button onClick={() => onNavigate('menu')} className="px-6 py-3 bg-[#E2498A] hover:bg-[#C83472] text-white text-sm font-extrabold rounded-full transition-all shadow-md hover:-translate-y-0.5">
            Ir al Dashboard →
          </button>
        )}
      </nav>

      {/* 1. ── BANNER ARRIBA (HERO) + INICIAR SESIÓN INTEGRADO ── */}
      <section id="inicio" className="w-full max-w-[1400px] mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        
        {/* Left: Copy & Graphic */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FFF0F6] border border-[#E2498A]/20 rounded-full text-[10px] font-black text-[#E2498A] uppercase tracking-wide shadow-sm">
            Terminal POS y ERP Integrado
          </div>
          
          <h1 className="text-5xl lg:text-[5rem] font-black text-[#2C1338] tracking-tight leading-[1.05]">
            Tu Parking.<br/>
            Bajo Control.<br/>
            <span className="text-[#E2498A]">Velocidad Total.</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-gray-600 font-medium max-w-lg leading-relaxed">
            Plataforma ofimática con foco automático, auditoría de caja ciega y matriz vectorial en tiempo real. Cero clics redundantes.
          </p>

          {/* Inline Graphic: Barrier opening */}
          <div className="w-full max-w-sm h-32 relative mt-4 opacity-80 pointer-events-none">
             <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible">
                {/* Base barrier stand */}
                <rect x="20" y="80" width="16" height="40" rx="4" fill="#2C1338" />
                <circle cx="28" cy="85" r="5" fill="#E2498A" />
                {/* Barrier Arm (Open position) */}
                <rect x="28" y="80" width="220" height="8" rx="4" fill="#E2498A" className="origin-[28px_84px] -rotate-[35deg]" />
                {/* Car Vector moving in */}
                <g className="translate-x-[120px] translate-y-[60px]">
                   <path d="M 0 40 L 15 15 L 75 15 L 90 40 L 105 40 L 105 70 L -15 70 L -15 40 Z" fill="#2B9E78" fillOpacity="0.1" stroke="#2B9E78" strokeWidth="3" strokeLinejoin="round" />
                   <circle cx="10" cy="70" r="12" fill="#2C1338" />
                   <circle cx="80" cy="70" r="12" fill="#2C1338" />
                   {/* Plate */}
                   <rect x="35" y="55" width="20" height="8" fill="#FAFAF5" stroke="#2B9E78" strokeWidth="1" />
                </g>
             </svg>
          </div>
        </div>

        {/* Right: Login Form (NO POP-UP) */}
        <div className="w-full flex justify-center lg:justify-end">
           <div className="w-full max-w-[450px] bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-[0_20px_60px_rgba(44,19,56,0.08)] border border-gray-100 relative">
              
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-[#FFF0F6] text-[#E2498A] rounded-3xl flex items-center justify-center mx-auto mb-5 rotate-3 shadow-sm border border-[#E2498A]/10">
                   <svg className="w-8 h-8 -rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                 </div>
                 <h3 className="text-3xl font-black text-[#2C1338] tracking-tight">Acceso Operador</h3>
                 <p className="text-sm font-medium text-gray-500 mt-2">{isLoggedIn ? 'Tu sesión está activa' : 'Identifícate para iniciar tu turno'}</p>
              </div>

              {!isLoggedIn ? (
                 <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                   <div>
                     <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Correo Electrónico</label>
                     <input required type="email" placeholder="operador@cordano.cl" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-[#E2498A] focus:bg-white focus:ring-4 focus:ring-[#E2498A]/10 transition-all text-gray-900 shadow-sm" />
                   </div>
                   <div>
                     <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Contraseña</label>
                     <input required type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-[#E2498A] focus:bg-white focus:ring-4 focus:ring-[#E2498A]/10 transition-all text-gray-900 shadow-sm" />
                   </div>
                   <button type="submit" disabled={loginState === 'loading'} className="w-full py-4 bg-[#E2498A] hover:bg-[#C83472] text-white rounded-2xl text-sm font-extrabold shadow-lg transition-all hover:-translate-y-1 mt-4 flex items-center justify-center gap-2">
                     {loginState === 'loading' ? (
                        <>
                           <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                           <span>Conectando...</span>
                        </>
                     ) : (
                        <span>Ingresar al Sistema →</span>
                     )}
                   </button>
                 </form>
              ) : (
                 <div className="flex flex-col items-center">
                    <div className="w-full p-4 bg-[#E8F8F2] border border-[#2B9E78]/30 rounded-2xl mb-6 flex items-center gap-4">
                       <div className="w-10 h-10 bg-[#2B9E78] rounded-full flex items-center justify-center text-white font-bold shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                       </div>
                       <div className="text-left">
                          <div className="text-sm font-black text-[#2C1338]">Autenticado correctamente</div>
                          <div className="text-xs font-bold text-[#2B9E78]">Listo para operar</div>
                       </div>
                    </div>
                    <button onClick={() => onNavigate('menu')} className="w-full py-4 bg-[#2C1338] hover:bg-[#412A4C] text-white rounded-2xl text-sm font-extrabold shadow-lg transition-all hover:-translate-y-1">
                      Ir al Dashboard de Control
                    </button>
                 </div>
              )}
           </div>
        </div>
      </section>

      {/* 2. ── PROCESO OPERATIVO (NUEVO SHOWCASE) ── */}
      <section id="proceso" className="py-24 bg-white border-t border-gray-100">
         <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl lg:text-4xl font-black text-[#2C1338] mb-4">Flujo Vehicular Sin Fricción</h2>
               <p className="text-gray-500 font-medium max-w-2xl mx-auto text-lg">
                  Nuestra interfaz está diseñada ergonómicamente para que el flujo de vehículos transitorios y abonados fluya rápidamente, disminuyendo filas.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               {[
                  { step: '1', title: 'Check-In Rápido', icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v12h16V6H4zm2 3h12v2H6V9zm0 4h8v2H6v-2z' },
                  { step: '2', title: 'Asignación 2D', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
                  { step: '3', title: 'Cálculo Auto', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
                  { step: '4', title: 'Barrera Abierta', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
               ].map((proc, i) => (
                  <div key={i} className="relative p-6 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center text-center">
                     <div className="w-12 h-12 bg-white text-[#2C1338] font-black rounded-full flex items-center justify-center shadow-sm absolute -top-6 border-4 border-gray-50">
                        {proc.step}
                     </div>
                     <svg className="w-12 h-12 text-[#E2498A] mt-8 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={proc.icon} />
                     </svg>
                     <h3 className="font-bold text-gray-900 text-lg">{proc.title}</h3>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* 3. ── SHOWCASE VECTORIAL MATRIZ ── */}
      <section id="matriz" className="w-full py-24 bg-[#2C1338] text-white relative overflow-hidden">
         <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#E2498A] via-transparent to-transparent"></div>
         
         <div className="max-w-[1200px] mx-auto px-6 relative z-10 text-center mb-12">
            <h2 className="text-3xl lg:text-5xl font-black mb-4 tracking-tight">Matriz de Ocupación Viva</h2>
            <p className="text-gray-400 font-medium max-w-2xl mx-auto text-lg">
               Sincronización en tiempo real de todos los slots. Los colores comunican al instante el estado del parqueadero.
            </p>
         </div>
         
         <div className="max-w-[900px] mx-auto px-6 relative z-10">
            {/* Vector representation of a parking lot */}
            <div className="w-full bg-[#1A0B22] p-8 lg:p-12 rounded-[3rem] border border-white/10 shadow-2xl">
               <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 lg:gap-4">
                  {[...Array(12)].map((_, i) => {
                     const isOccupied = i === 2 || i === 5 || i === 8 || i === 9;
                     const isPMR = i === 0;
                     const isEV = i === 1;
                     
                     let color = "border-gray-700 bg-gray-800/50";
                     let icon = null;
                     
                     if (isOccupied) color = "border-transparent bg-[#65546C]";
                     else if (isPMR) { color = "border-[#06B6D4]/30 bg-[#06B6D4]/10"; icon = <span className="text-[#06B6D4] font-bold text-sm">PMR</span>; }
                     else if (isEV) { color = "border-[#9E59C7]/30 bg-[#9E59C7]/10"; icon = <span className="text-[#9E59C7] font-bold text-sm">EV</span>; }
                     else { color = "border-[#2B9E78]/50 bg-[#2B9E78]/10"; icon = <span className="text-[#2B9E78] font-black text-[11px] uppercase tracking-wider">Libre</span>; }

                     return (
                        <div key={i} className={`aspect-[2/3] rounded-xl border-2 ${color} flex flex-col items-center justify-center relative overflow-hidden transition-all hover:scale-105 cursor-pointer`}>
                           <div className="absolute top-2 left-2 text-[10px] font-black opacity-40 text-white">A-{i + 1}</div>
                           {isOccupied ? (
                              <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                                 <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                              </svg>
                           ) : (
                              icon
                           )}
                        </div>
                     )
                  })}
               </div>
               
               <div className="mt-10 pt-8 border-t border-white/10 flex items-center justify-center gap-6 lg:gap-10 flex-wrap">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#2B9E78] shadow-[0_0_10px_#2B9E78]"></div><span className="text-sm font-bold text-gray-300">Disponible</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#65546C]"></div><span className="text-sm font-bold text-gray-300">Ocupado</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#06B6D4]"></div><span className="text-sm font-bold text-gray-300">PMR</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#EAA023]"></div><span className="text-sm font-bold text-gray-300">Reservado</span></div>
               </div>
            </div>
         </div>
      </section>

      {/* 4. ── FUNCIONALIDADES Y MÓDULOS ── */}
      <section id="funcionalidades" className="py-24 bg-[#FAFAF5]">
         <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-black text-[#2C1338] mb-4">Herramientas Operativas</h2>
               <p className="text-gray-500 font-medium max-w-2xl mx-auto text-lg">
                  Todo lo necesario para auditar y controlar en tiempo real.
               </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                  { title: 'POS Rápido', desc: 'Registro de entrada y salida optimizado para teclado (F1-F12).', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                  { title: 'Auditoría Ciega', desc: 'Arqueo de caja y cuadre con validación criptográfica.', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                  { title: 'Gestión de Convenios', desc: 'Administra corporativos, mensualidades y multas.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                  { title: 'Estadísticas', desc: 'Métricas de ocupación y reportes de recaudación en vivo.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
               ].map((item, idx) => (
                  <div key={idx} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(226,73,138,0.15)] transition-all hover:-translate-y-2 group">
                     <div className="w-16 h-16 rounded-2xl bg-[#FFF0F6] text-[#E2498A] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon}/></svg>
                     </div>
                     <h3 className="text-xl font-black text-[#2C1338] mb-3">{item.title}</h3>
                     <p className="text-sm font-medium text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* 5. ── PLANES EMPRESAS & FORMULARIO ── */}
      <section id="convenios" className="py-24 bg-white">
         <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            
            <div className="space-y-8 lg:pr-10">
               <h2 className="text-4xl lg:text-5xl font-black text-[#2C1338] tracking-tight">
                  Planes B2B y Convenios.
               </h2>
               <p className="text-lg text-gray-500 font-medium">
                  Asegura cupos para tu equipo de trabajo o clientes con beneficios exclusivos de facturación y control de acceso preferencial.
               </p>
               
               <div className="space-y-4 pt-4">
                  {[
                     { title: 'Contrato Anual (Preferencial)', desc: 'Tarifa congelada por 12 meses, facturación automática DTE.' },
                     { title: 'Plan Mensual Flexible', desc: 'Sin amarres, renueva mes a mes según tu capacidad.' },
                     { title: 'Espacio Cerrado y Techado', desc: 'Protección contra el clima y seguridad 24/7 con CCTV.' },
                  ].map((benefit, i) => (
                     <div key={i} className="flex items-start gap-4 p-5 rounded-3xl bg-gray-50 border border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-[#2B9E78]/10 text-[#2B9E78] flex items-center justify-center shrink-0 mt-0.5">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <div>
                           <div className="font-bold text-gray-900 text-lg">{benefit.title}</div>
                           <div className="text-sm text-gray-500 font-medium mt-1">{benefit.desc}</div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
            
            <div className="relative">
               {/* Contact Form with Overlay Success */}
               <div className="bg-gray-50 border border-gray-200 p-8 sm:p-10 rounded-[3rem] shadow-sm relative overflow-visible">
                  
                  {/* Success Overlay */}
                  <div className={`absolute inset-0 bg-white/95 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-8 transition-all duration-500 rounded-[3rem] border border-[#2B9E78]/20 ${contactSuccess ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
                     <div className="w-24 h-24 bg-[#E8F8F2] text-[#2B9E78] rounded-[2.5rem] flex items-center justify-center mb-6 shadow-sm border border-[#2B9E78]/20 animate-bounce">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                     </div>
                     <h3 className="text-3xl font-black mb-2 text-[#2C1338]">¡Solicitud Enviada!</h3>
                     <p className="text-gray-500 font-medium text-lg">Se ha notificado al área comercial.<br/>Te contactaremos pronto.</p>
                     <button onClick={() => setContactSuccess(false)} className="mt-8 px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-bold transition-colors shadow-sm">
                        Enviar otra solicitud
                     </button>
                  </div>

                  <form onSubmit={handleContactSubmit} className="space-y-6 relative z-10">
                     <h3 className="text-2xl font-black mb-8 text-[#2C1338]">Cotizar Plan Corporativo</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                           <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Nombre</label>
                           <input required type="text" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#E2498A] transition-all shadow-sm" />
                        </div>
                        <div>
                           <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Empresa</label>
                           <input required type="text" value={contactForm.company} onChange={e => setContactForm({...contactForm, company: e.target.value})} className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#E2498A] transition-all shadow-sm" />
                        </div>
                     </div>
                     <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Correo Electrónico</label>
                        <input required type="email" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#E2498A] transition-all shadow-sm" />
                     </div>
                     <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Interés</label>
                        <select value={contactForm.plan} onChange={e => setContactForm({...contactForm, plan: e.target.value})} className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#E2498A] transition-all shadow-sm appearance-none cursor-pointer">
                           <option value="mensual">Plan Mensual Flexible</option>
                           <option value="anual">Contrato Anual Preferencial</option>
                           <option value="flota">Convenio Flota Comercial</option>
                        </select>
                     </div>
                     <button type="submit" disabled={isSubmittingContact} className="w-full py-4 bg-[#E2498A] hover:bg-[#C83472] text-white rounded-2xl text-base font-extrabold shadow-md transition-all hover:-translate-y-1 mt-6 disabled:opacity-50">
                        {isSubmittingContact ? 'Procesando...' : 'Solicitar Información →'}
                     </button>
                  </form>
               </div>
            </div>
         </div>
      </section>

      {/* 6. ── BUSCADOR DE SOPORTE & 7. FAQ (MÁS GRANDE Y CLARO) ── */}
      <section id="soporte" className="py-24 bg-[#2C1338] text-white border-t-8 border-[#E2498A]">
         <div className="max-w-[1000px] mx-auto px-6 text-center">
            
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 mb-8 shadow-inner border border-white/5 rotate-3">
               <svg className="w-10 h-10 text-[#E2498A] -rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-black mb-6 tracking-tight">Centro de Asistencia Operativa</h2>
            <p className="text-gray-400 font-medium mb-16 text-lg max-w-2xl mx-auto">
               Consulta manuales, protocolos de contingencia o busca directamente sobre incidencias como pérdida de tickets o auditorías de caja.
            </p>
            
            {/* Search Bar - Big */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-3xl mx-auto group mb-20">
               <svg className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 text-gray-500 group-focus-within:text-[#E2498A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Ej: ¿Qué hacer si hay un ticket extraviado?"
                 className="w-full pl-20 pr-40 py-6 bg-[#1A0B22] border-2 border-white/10 rounded-[2.5rem] text-lg font-bold text-white focus:outline-none focus:border-[#E2498A] transition-all shadow-inner placeholder:text-gray-600"
               />
               <button type="submit" className="absolute right-3 top-3 bottom-3 px-10 bg-[#E2498A] hover:bg-[#C83472] text-white rounded-full font-extrabold text-base transition-colors shadow-lg">
                 Buscar
               </button>
            </form>

            {/* Main FAQs Grid - Big Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
               {[
                  { q: '¿Cómo realizar un arqueo ciego?', a: 'Procedimiento obligatorio para cuadrar la caja física contra el sistema antes del cierre del turno. El administrador debe aprobar desfases.' },
                  { q: 'Registro de Convenios (B2B)', a: 'Asignación de patentes mensuales a empresas con facturación DTE automática para evitar cobro en barrera.' },
                  { q: 'Procedimiento: Ticket Extraviado', a: 'Aplicación de multa legal de $8.000 CLP, toma de fotografía de documento de identidad y liberación de vehículo.' },
                  { q: 'Siniestros, Fugas y Daños', a: 'Protocolo de registro fotográfico y alerta a supervisión para dejar constancia legal ante SERNAC.' }
               ].map((faq, i) => (
                  <button key={i} onClick={handleFaqClick} className="p-8 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 hover:border-[#E2498A]/50 transition-all text-left group flex items-start justify-between shadow-lg">
                    <div className="pr-6">
                       <h4 className="font-black text-xl text-white mb-3 group-hover:text-[#E2498A] transition-colors">{faq.q}</h4>
                       <p className="text-base font-medium text-gray-400 leading-relaxed">{faq.a}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1 group-hover:bg-[#E2498A] transition-colors">
                       <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                    </div>
                  </button>
               ))}
            </div>
            
         </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 bg-[#1A0B22] text-center border-t border-white/5">
         <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center rotate-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-2xl text-white tracking-tight">ParkOps</span>
         </div>
         <p className="text-gray-500 text-sm font-bold">© {new Date().getFullYear()} Cordano Inversiones Inmobiliarias Ltda.<br/>Sistema diseñado en Chile. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
