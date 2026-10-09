import React, { useState, useEffect, useRef } from 'react';
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
  const { setIsLoggedIn, isLoggedIn, tariffConfig } = useParking();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginState, setLoginState] = useState<'idle' | 'loading'>('idle');
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [contactForm, setContactForm] = useState({ name: '', phone: '', comments: '', plan: [] as string[] });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Intersection Observer for scroll animations
  const observerRefs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    observerRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const addToRefs = (el: HTMLElement | null) => {
    if (el && !observerRefs.current.includes(el)) {
      observerRefs.current.push(el);
    }
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      onShowToast('Ingrese credenciales', 'error');
      return;
    }
    setLoginState('loading');
    setTimeout(() => {
      setLoginState('idle');
      setIsLoggedIn(true);
      onShowToast('Bienvenido al sistema', 'success');
      onNavigate('pos');
      onLoginSuccess('pos');
    }, 800);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone) {
      onShowToast('Por favor, completa nombre y teléfono', 'error');
      return;
    }

    setIsSubmittingContact(true);
    
    const selectedPlans = tariffConfig.subscriptionPlans?.filter(p => contactForm.plan.includes(p.id)) || [];
    const selectedServices = selectedPlans.map(p => p.title).join(", ") || "Ninguno específico";
    const obs = contactForm.comments ? `%0A%0A*Observaciones:* ${contactForm.comments}` : "";
    
    const text = `Hola, mi nombre es ${contactForm.name}. Me interesa obtener información sobre los siguientes servicios: *${selectedServices}*. Mi teléfono de contacto es: ${contactForm.phone}.${obs}`;
    const encodedText = encodeURIComponent(text);
    const waUrl = `https://wa.me/56900000000?text=${encodedText}`; 

    setTimeout(() => {
      setIsSubmittingContact(false);
      setContactSuccess(true);
      onShowToast('Solicitud enviada correctamente', 'success');
      
      window.open(waUrl, '_blank');
      
      setTimeout(() => {
         setContactSuccess(false);
         setContactForm({ name: '', phone: '', comments: '', plan: [] });
      }, 5000);
    }, 1200);
  };

  const togglePlan = (planId: string) => {
     setContactForm(prev => ({
        ...prev,
        plan: prev.plan.includes(planId) 
           ? prev.plan.filter(p => p !== planId)
           : [...prev.plan, planId]
     }));
  };

  const dynamicPricingOptions = tariffConfig.subscriptionPlans || [
     { id: 'mensual', title: 'Mensual', price: '$50.000', desc: 'Por mes' },
     { id: 'semanal', title: 'Semanal', price: '$15.000', desc: 'Por semana' },
     { id: 'diurno', title: 'Diurno', price: '$5.000', desc: 'Por día' },
     { id: 'flota', title: 'Flota Corp.', price: 'A conv.', desc: 'Multivehículo' }
  ];

  const renderFormContent = () => (
    <form onSubmit={handleContactSubmit} className="space-y-6 animate-fade-in-up">
      <div>
        <h4 className="font-black text-xl mb-1">Solicitud de Convenios</h4>
        <p className="text-slate-500 text-sm mb-5">Completa tus datos y selecciona los planes de interés. Te contactaremos por WhatsApp.</p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Nombre Completo *</label>
              <input required type="text" placeholder="Ej. Juan Pérez" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#E2498A] focus:ring-4 focus:ring-[#E2498A]/10 transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Teléfono / WhatsApp *</label>
              <input required type="text" placeholder="Ej. +56 9 1234 5678" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#E2498A] focus:ring-4 focus:ring-[#E2498A]/10 transition-all" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h5 className="text-sm font-black text-slate-800 mb-3">Selecciona los Planes de Interés</h5>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
           {dynamicPricingOptions.map(opt => (
              <div key={opt.id} onClick={() => togglePlan(opt.id)} className={`cursor-pointer border-2 rounded-xl p-3 transition-all flex flex-col items-center text-center ${contactForm.plan.includes(opt.id) ? 'border-[#E2498A] bg-[#FFF5F8] text-[#1E1E2F]' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                 <span className="font-black text-[13px] mb-1">{opt.title}</span>
                 <span className={`text-sm font-black tabular-nums ${contactForm.plan.includes(opt.id) ? 'text-[#E2498A]' : 'text-slate-800'}`}>{opt.price}</span>
                 <span className="text-[9px] uppercase font-bold opacity-70">{opt.desc}</span>
              </div>
           ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase">Observaciones Adicionales</label>
        <textarea rows={2} placeholder="¿Algún detalle de tu empresa o flota?" value={contactForm.comments} onChange={e => setContactForm({...contactForm, comments: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#E2498A] focus:ring-4 focus:ring-[#E2498A]/10 transition-all resize-none"></textarea>
      </div>

      <button type="submit" disabled={isSubmittingContact || contactForm.plan.length === 0} className="w-full h-14 bg-[#E2498A] text-white rounded-xl text-base font-black shadow-lg hover:bg-[#C83472] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
         {isSubmittingContact ? "Enviando..." : "Enviar Información por WhatsApp"}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-white text-[#1E1E2F] font-sans selection:bg-[#E2498A] selection:text-white overflow-hidden">
      
      {/* NAVBAR */}
      <nav className="absolute top-0 left-0 w-full z-50 px-6 py-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-[#E2498A] rounded-2xl flex items-center justify-center shadow-md">
             <span className="text-white font-black text-xl">C</span>
           </div>
           <span className="font-extrabold text-2xl tracking-tight text-[#1E1E2F]">
             Cordano<span className="text-[#E2498A]">PMS</span>
           </span>
        </div>
        <div className="hidden lg:flex items-center gap-8 font-bold text-sm text-slate-500">
           <a href="#inicio" className="hover:text-[#E2498A] transition-colors">Inicio</a>
           <a href="#monitor" className="hover:text-[#E2498A] transition-colors">Monitor</a>
           <a href="#funcionalidades" className="hover:text-[#E2498A] transition-colors">POS</a>
           <a href="#convenios" className="hover:text-[#E2498A] transition-colors">Convenios</a>
           <a href="#faq" className="hover:text-[#E2498A] transition-colors">FAQ</a>
        </div>
      </nav>

      {/* 1. HERO & LOGIN SIDE-BY-SIDE */}
      <section id="inicio" className="relative pt-32 pb-16 lg:pt-40 lg:pb-32">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 -translate-y-24 translate-x-1/4 pointer-events-none z-0">
           <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-[800px] h-[800px] lg:w-[1200px] lg:h-[1200px] opacity-10 text-[#E2498A] animate-[spin_120s_linear_infinite]">
             <path fill="currentColor" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,80.1,-46.1C88.4,-33.1,91.9,-17.1,89.5,-1.9C87.2,13.2,79.1,27.5,69.5,39.9C59.9,52.3,48.9,62.8,36.2,69.7C23.5,76.6,9.1,79.9,-4.7,78.2C-18.4,76.5,-31.6,69.7,-43.8,61.7C-56,53.8,-67.2,44.7,-75.4,32.8C-83.6,20.8,-88.9,5.9,-86.3,-7.9C-83.7,-21.7,-73.2,-34.5,-61.7,-44.3C-50.2,-54.1,-37.8,-61,-25.1,-67C-12.4,-73.1,0.5,-78.3,13.5,-77.8C26.5,-77.3,44.7,-76.4,44.7,-76.4Z" transform="translate(100 100)" />
           </svg>
        </div>

        <div className="max-w-[1300px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            
            <div className="lg:col-span-7 space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-[#E2498A] text-sm font-bold border border-slate-200 shadow-sm">
                 <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E2498A] opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E2498A]"></span></span>
                 Cordano PMS Version 1.0
              </div>
              <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-[#1E1E2F] leading-[1.05]">
                Inteligencia y <span className="text-[#E2498A]">Rapidez</span> en cada turno.
              </h1>
              <p className="text-lg lg:text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">
                El sistema de punto de venta y matriz de ocupación optimizado para garantizar tiempos de atención rápidos y máxima seguridad operativa.
              </p>
            </div>

            <div className="lg:col-span-5 relative">
               <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-[0_20px_60px_-15px_rgba(226,73,138,0.3)] relative z-10 border border-slate-100 animate-fade-in-up" style={{animationDelay: '100ms'}}>
                  <div className="text-center mb-10">
                     <div className="w-16 h-16 bg-[#E2498A]/10 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#E2498A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                     </div>
                     <h3 className="text-2xl font-black text-[#1E1E2F] tracking-tight">Acceso Operador</h3>
                     <p className="text-sm font-medium text-slate-500 mt-2">{isLoggedIn ? 'Tu sesión está activa en este equipo' : 'Ingresa tus credenciales para operar'}</p>
                  </div>

                  {!isLoggedIn ? (
                     <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                       <div>
                         <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Usuario / PIN</label>
                         <input required type="text" placeholder="operador@cordano.cl" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-[#E2498A] focus:bg-white focus:ring-4 focus:ring-[#E2498A]/10 transition-all text-[#1E1E2F]" />
                       </div>
                       <div>
                         <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Contraseña</label>
                         <input required type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-[#E2498A] focus:bg-white focus:ring-4 focus:ring-[#E2498A]/10 transition-all text-[#1E1E2F]" />
                       </div>
                       <button type="submit" disabled={loginState === "loading"} className="w-full h-14 bg-[#E2498A] hover:bg-[#C83472] text-white rounded-2xl text-base font-black shadow-lg shadow-[#E2498A]/25 transition-all mt-2 flex items-center justify-center gap-2">
                         {loginState === "loading" ? "Conectando..." : "Ingresar"}
                       </button>
                     </form>
                  ) : (
                     <div className="flex flex-col items-center mt-6">
                        <button onClick={() => { onNavigate("pos"); onLoginSuccess("pos"); }} className="w-full py-5 bg-[#E2498A] text-white rounded-2xl text-base font-black shadow-lg shadow-[#E2498A]/25 transition-all hover:bg-[#C83472]">
                          Abrir Consola POS
                        </button>
                     </div>
                  )}
               </div>
            </div>

          </div>
        </div>
      </section>

            {/* UBICACIÓN SERRANO 447 & SHOWCASE */}
        <section ref={addToRefs} className="py-20 bg-[#1E1E2F] text-white opacity-0 translate-y-10 transition-all duration-700 ease-out overflow-hidden relative">
           {/* Decorative Grid Background */}
           <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
           
           <div className="max-w-[1300px] mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Text & Stats */}
              <div className="space-y-10">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-inner">
                       <svg className="w-10 h-10 text-[#E2498A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <div>
                       <h3 className="text-4xl font-black text-white tracking-tight">Serrano 447, <span className="text-[#E2498A]">Iquique</span></h3>
                       <p className="text-slate-400 font-medium text-lg mt-1">Operación 24/7 • Tarifas Inteligentes</p>
                    </div>
                 </div>
                 
                 <div className="flex gap-12">
                    <div>
                       <div className="text-white font-black text-5xl">30</div>
                       <div className="text-sm font-bold uppercase tracking-wider text-[#E2498A] mt-2">Plazas Max</div>
                    </div>
                    <div>
                       <div className="text-white font-black text-5xl">100%</div>
                       <div className="text-sm font-bold uppercase tracking-wider text-[#E2498A] mt-2">Digital</div>
                    </div>
                 </div>
              </div>

              {/* Vector Showcase */}
              <div className="relative h-64 lg:h-auto flex justify-center lg:justify-end">
                 <div className="w-full max-w-md bg-[#2D2D44] rounded-3xl p-6 border border-slate-700 shadow-2xl relative transform lg:rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="flex justify-between items-center mb-6">
                       <div className="text-xs font-bold text-slate-400">ESTACIONAMIENTO</div>
                       <div className="flex gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                          <span className="w-3 h-3 rounded-full bg-slate-600"></span>
                          <span className="w-3 h-3 rounded-full bg-[#E2498A]"></span>
                       </div>
                    </div>
                    {/* Parking Grid Vector */}
                    <div className="grid grid-cols-3 gap-4">
                       {[...Array(6)].map((_, i) => (
                          <div key={i} className={`h-24 rounded-xl border-2 flex items-center justify-center relative ${[1,4].includes(i) ? 'bg-slate-700 border-slate-600' : 'bg-emerald-900/20 border-emerald-500/30'}`}>
                             {[1,4].includes(i) && (
                                <svg className="w-10 h-10 text-slate-500 absolute" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                             )}
                             {![1,4].includes(i) && (
                                <span className="text-emerald-500/50 font-black text-xl">{i+1}</span>
                             )}
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </section>
  
        {/* MÓDULOS DEL SISTEMA */}
        <section id="funcionalidades" ref={addToRefs} className="py-16 bg-slate-50 relative opacity-0 translate-y-10 transition-all duration-700 ease-out border-y border-slate-100">
           <div className="max-w-[1300px] mx-auto px-6">
              <div className="text-center mb-12">
                 <h2 className="text-[#E2498A] font-black text-sm tracking-wider uppercase mb-2">Módulos del Sistema</h2>
                 <h3 className="text-3xl lg:text-4xl font-black text-[#1E1E2F]">Control total en una sola plataforma</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* 1. POS Ágil */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                    </div>
                    <h4 className="font-black text-lg text-[#1E1E2F] mb-2">POS Ágil</h4>
                    <p className="text-sm text-slate-500 font-medium">Atajos F1-F9, lector de patentes y emisión térmica automática para operación ultra veloz.</p>
                 </div>

                 {/* 2. Control de Turnos */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-100 text-[#E2498A] rounded-xl flex items-center justify-center mb-4">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <h4 className="font-black text-lg text-[#1E1E2F] mb-2">Control de Turnos</h4>
                    <p className="text-sm text-slate-500 font-medium">Aperturas con saldo inicial, registro exacto de jornadas y cierre de caja ciego con firma SHA-256.</p>
                 </div>

                 {/* 3. Reportes */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </div>
                    <h4 className="font-black text-lg text-[#1E1E2F] mb-2">Reportes y Auditoría</h4>
                    <p className="text-sm text-slate-500 font-medium">Historial detallado de tickets, ingresos, evasiones y exportación de balances en un clic.</p>
                 </div>

                 {/* 4. Contratos Mensuales */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    </div>
                    <h4 className="font-black text-lg text-[#1E1E2F] mb-2">Contratos Mensuales</h4>
                    <p className="text-sm text-slate-500 font-medium">Gestión de abonados, facturación recurrente, flotas y control de acceso preferencial.</p>
                 </div>

                 {/* 5. Supervisión Remota */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center mb-4">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    </div>
                    <h4 className="font-black text-lg text-[#1E1E2F] mb-2">Supervisión en Tiempo Real</h4>
                    <p className="text-sm text-slate-500 font-medium">Matriz de ocupación semaforizada en vivo para monitorear plazas desde cualquier dispositivo.</p>
                 </div>

                 {/* 6. Aprobaciones TOTP */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-[#E2498A]/10 text-[#E2498A] rounded-xl flex items-center justify-center mb-4">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    </div>
                    <h4 className="font-black text-lg text-[#1E1E2F] mb-2">Aprobaciones Remotas</h4>
                    <p className="text-sm text-slate-500 font-medium">Autoriza descuentos, anulaciones o tickets perdidos remotamente con seguridad TOTP.</p>
                 </div>
              </div>
           </div>
        </section>

        {/* CONVENIOS */}
      <section id="convenios" ref={addToRefs} className="py-24 bg-white relative opacity-0 translate-y-10 transition-all duration-700 ease-out">
         <div className="max-w-[1000px] mx-auto px-6">
            <div className="bg-[#1E1E2F] rounded-[3rem] p-8 lg:p-16 shadow-2xl flex flex-col lg:flex-row gap-16 items-center text-white relative overflow-hidden">
               <div className="absolute bottom-0 left-0 -translate-x-1/3 translate-y-1/3 text-[#E2498A] opacity-20">
                  <svg viewBox="0 0 200 200" className="w-[500px] h-[500px]"><path fill="currentColor" d="M38.1,-48.9C49.9,-40.4,60.5,-28.5,65.4,-14.2C70.3,0.1,69.5,16.8,61.9,29.9C54.3,43,39.9,52.5,24.6,58.4C9.3,64.3,-6.9,66.6,-22.4,63.1C-37.9,59.6,-52.7,50.3,-61.7,37.1C-70.7,23.9,-73.9,6.8,-69.5,-8.3C-65.1,-23.4,-53.1,-36.5,-40,-44.8C-26.9,-53.1,-13.4,-56.6,0.3,-57.1C14.1,-57.5,26.3,-57.4,38.1,-48.9Z" transform="translate(100 100)"/></svg>
               </div>

               <div className="flex-1 space-y-6 relative z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white border border-white/20 text-sm font-bold">Para Empresas</div>
                  <h2 className="text-4xl font-black">Convenios y Flotas</h2>
                  <p className="text-slate-400 font-medium text-lg leading-relaxed">
                     Solicita un convenio para tu empresa. Planes de abonados fijos, techados o flota flotante con facturación consolidada a fin de mes.
                  </p>
               </div>
               
               <div className="flex-1 w-full bg-white rounded-[2rem] p-8 relative z-10 text-[#1E1E2F] shadow-xl">
                  {contactSuccess ? (
                     <div className="absolute inset-0 bg-emerald-500 rounded-[2rem] flex flex-col items-center justify-center text-white p-8 text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg></div>
                        <h4 className="text-2xl font-black">¡Solicitud Enviada!</h4>
                        <p className="mt-2 text-emerald-50 font-medium">El administrador se contactará a la brevedad.</p>
                     </div>
                  ) : (
                     renderFormContent()
                  )}
               </div>
            </div>
         </div>
      </section>

      {/* FAQ BUSCADOR */}
      <section id="faq" ref={addToRefs} className="py-24 bg-slate-50 relative overflow-hidden opacity-0 translate-y-10 transition-all duration-700 ease-out">
         <div className="absolute right-0 bottom-0 pointer-events-none opacity-5 text-[#E2498A] translate-x-1/2 translate-y-1/2">
            <svg viewBox="0 0 200 200" className="w-[600px] h-[600px]"><path fill="currentColor" d="M37.6,-57.4C50.2,-50.2,63,-42.6,71.3,-31.3C79.6,-20,83.4,-5,81.1,9.4C78.9,23.8,70.5,37.6,60.1,49.2C49.7,60.8,37.3,70.2,23.3,74.7C9.3,79.2,-6.3,78.8,-21.7,75.1C-37.1,71.4,-52.3,64.3,-62.3,52.8C-72.3,41.2,-77.1,25.2,-79.1,9.4C-81,-6.3,-80.1,-21.7,-72.6,-33.5C-65,-45.3,-50.9,-53.4,-37.6,-59.9C-24.3,-66.4,-12.1,-71.2,-0.2,-70.9C11.7,-70.6,25,-64.6,37.6,-57.4Z" transform="translate(100 100)" /></svg>
         </div>

         <div className="max-w-[800px] mx-auto px-6 text-center space-y-10 relative z-10">
            <div>
               <h2 className="text-4xl font-black mb-4 text-[#1E1E2F]">Centro de Ayuda y FAQ</h2>
               <p className="text-slate-500 text-lg font-medium">Busca documentación operativa o procedimientos de garita.</p>
            </div>
            
            <form 
               onSubmit={(e) => {
                 e.preventDefault();
                 if (searchQuery.trim().length > 0) {
                    onNavigate('support');
                 }
               }} 
               className="relative"
            >
               <input 
                  type="text" 
                  placeholder="Ej: ¿Cómo registrar una fuga de vehículo...? (Presiona Enter)" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-5 bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl text-lg text-[#1E1E2F] placeholder-slate-400 focus:outline-none focus:border-[#E2498A] focus:ring-4 focus:ring-[#E2498A]/10 transition-all"
               />
               <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </button>
            </form>
         </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="pt-24 pb-12 bg-white text-center border-t border-slate-100">
         <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1E1E2F] rounded-lg flex items-center justify-center rotate-3">
                    <span className="text-white font-black text-sm -rotate-3">C</span>
                  </div>
                  <span className="font-bold text-[#1E1E2F]">Cordano Inversiones</span>
               </div>
               <div className="flex gap-6 text-sm font-bold text-slate-500">
                  <a href="#" className="hover:text-[#E2498A]">Privacidad</a>
                  <a href="#" className="hover:text-[#E2498A]">Términos</a>
                  <a href="#" className="hover:text-[#E2498A]">Soporte Técnico</a>
               </div>
               <div className="text-slate-400 text-sm font-medium">
                  © 2026 PMS Cloud V1.0
               </div>
            </div>
         </div>
      </footer>

    </div>
  );
};
