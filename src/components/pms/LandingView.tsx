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
  
  const [contactForm, setContactForm] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    fleetSize: '1 a 3 vehículos',
    parkingNeed: 'fijo_reservado',
    schedule: '24_7',
    comments: '',
    plan: [] as string[],
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [activeModuleModal, setActiveModuleModal] = useState<{
    title: string;
    badge: string;
    icon: string;
    desc: string;
    details: string[];
    role: string;
  } | null>(null);

  // Carrusel de imágenes reales del recinto Serrano 447 (movimiento continuo)
  const carouselImages = [
    {
      url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1000&q=80',
      title: 'Acceso Vehicular & Garita Serrano 447',
      desc: 'Barrera automatizada y lector LPR de patentes',
    },
    {
      url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1000&q=80',
      title: 'Patio Central de Estacionamiento',
      desc: '30 plazas pavimentadas con señalética refractaria',
    },
    {
      url: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1000&q=80',
      title: 'Sector Techado Preferencial',
      desc: 'Espacios protegidos para flotas y convenios corporativos',
    },
    {
      url: 'https://images.unsplash.com/photo-1555652736-e92021d28a10?auto=format&fit=crop&w=1000&q=80',
      title: 'CCTV y Seguridad Operativa 24/7',
      desc: 'Monitoreo de perímetro y control de gaveta blindada',
    },
    {
      url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80',
      title: 'Terminal de Cobro Rápido POS Transbank',
      desc: 'Emisión térmica inmediata y boletas DTE integradas',
    },
  ];

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
      onShowToast('Por favor, completa al menos tu nombre y teléfono', 'error');
      return;
    }

    setIsSubmittingContact(true);
    
    const selectedPlans = tariffConfig.subscriptionPlans?.filter(p => contactForm.plan.includes(p.id)) || [];
    const selectedServices = selectedPlans.map(p => p.title).join(", ") || "Ninguno seleccionado";
    
    const companyText = contactForm.company ? `*Empresa / Razón Social:* ${contactForm.company}%0A` : "";
    const emailText = contactForm.email ? `*Email:* ${contactForm.email}%0A` : "";
    const fleetText = `*Dimensión Flota:* ${contactForm.fleetSize}%0A`;
    const needText = `*Modalidad Requerida:* ${contactForm.parkingNeed === 'fijo_reservado' ? 'Plazas Fijas Reservadas' : contactForm.parkingNeed === 'flotante' ? 'Abono Flotante Rotativo' : contactForm.parkingNeed === 'techado' ? 'Espacios Techados Exclusivos' : 'Mixto'}%0A`;
    const scheduleText = `*Horario Operativo:* ${contactForm.schedule === '24_7' ? 'Continuo 24/7' : contactForm.schedule === 'oficina' ? 'Lunes a Viernes (Horario Oficina)' : contactForm.schedule === 'nocturno' ? 'Nocturno / Fin de semana' : 'Personalizado'}%0A`;
    const obs = contactForm.comments ? `*Observaciones / Requisitos:* ${contactForm.comments}` : "";
    
    const text = `*SOLICITUD DE CONVENIO CORPORATIVO - SERRANO 447*%0A%0A*Contacto:* ${contactForm.name}%0A*Teléfono / WhatsApp:* ${contactForm.phone}%0A${companyText}${emailText}${fleetText}${needText}${scheduleText}*Planes de Interés:* ${selectedServices}%0A%0A${obs}`;
    const waUrl = `https://wa.me/56900000000?text=${text}`; 

    setTimeout(() => {
      setIsSubmittingContact(false);
      setContactSuccess(true);
      onShowToast('Solicitud enviada correctamente', 'success');
      
      window.open(waUrl, '_blank');
      
      setTimeout(() => {
         setContactSuccess(false);
         setContactForm({
           name: '',
           company: '',
           phone: '',
           email: '',
           fleetSize: '1 a 3 vehículos',
           parkingNeed: 'fijo_reservado',
           schedule: '24_7',
           comments: '',
           plan: [],
         });
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
    <form onSubmit={handleContactSubmit} className="space-y-6 animate-fade-in-up font-sans">
      {/* Header del Formulario */}
      <div className="border-b border-slate-100 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5F8] border border-[#E2498A]/30 text-[#E2498A] text-xs font-bold mb-2">
          <span>PROGRAMA CORPORATIVO &amp; FLOTAS SERRANO 447</span>
        </div>
        <h4 className="font-extrabold text-2xl text-slate-900 tracking-tight">
          Formulario de Calificación Comercial
        </h4>
        <p className="text-slate-600 text-sm mt-1">
          Ingresa los antecedentes de tu empresa o flota para cotizar un convenio a medida con facturación mensual consolidada.
        </p>
      </div>

      {/* Bloque 1: Identificación y Contacto */}
      <div className="space-y-4">
        <h5 className="text-xs font-black uppercase tracking-wider text-[#E2498A] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E2498A]"></span>
          1. Datos de la Empresa y Contacto Directo
        </h5>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Nombre y Apellido del Encargado *
            </label>
            <input
              required
              type="text"
              placeholder="Ej. Rodrigo Tapia Valdés"
              value={contactForm.name}
              onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E2498A] focus:bg-white focus:ring-4 focus:ring-[#E2498A]/10 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Empresa / Razón Social o Institución
            </label>
            <input
              type="text"
              placeholder="Ej. Minera del Norte S.A. / Rent-a-Car"
              value={contactForm.company}
              onChange={e => setContactForm({ ...contactForm, company: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E2498A] focus:bg-white focus:ring-4 focus:ring-[#E2498A]/10 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Teléfono Celular / WhatsApp *
            </label>
            <input
              required
              type="text"
              placeholder="Ej. +56 9 8765 4321"
              value={contactForm.phone}
              onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E2498A] focus:bg-white focus:ring-4 focus:ring-[#E2498A]/10 transition-all font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Correo Electrónico Corporativo
            </label>
            <input
              type="email"
              placeholder="Ej. contacto@empresa.cl"
              value={contactForm.email}
              onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E2498A] focus:bg-white focus:ring-4 focus:ring-[#E2498A]/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Bloque 2: Perfil Operativo y Necesidades de Flota */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <h5 className="text-xs font-black uppercase tracking-wider text-[#E2498A] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E2498A]"></span>
          2. Requerimientos de Espacio y Uso
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Cantidad de Vehículos / Patentes
            </label>
            <select
              value={contactForm.fleetSize}
              onChange={e => setContactForm({ ...contactForm, fleetSize: e.target.value })}
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#E2498A] focus:bg-white focus:ring-4 focus:ring-[#E2498A]/10 transition-all"
            >
              <option value="1 a 3 vehículos">1 a 3 vehículos (Pequeña flota)</option>
              <option value="4 a 8 vehículos">4 a 8 vehículos (Empresa mediana)</option>
              <option value="9 a 15 vehículos">9 a 15 vehículos (Gran flota corporativa)</option>
              <option value="16+ vehículos">Más de 16 vehículos (Sector exclusivo)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Tipo de Asignación de Plazas
            </label>
            <select
              value={contactForm.parkingNeed}
              onChange={e => setContactForm({ ...contactForm, parkingNeed: e.target.value })}
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#E2498A] focus:bg-white focus:ring-4 focus:ring-[#E2498A]/10 transition-all"
            >
              <option value="fijo_reservado">Plazas Fijas Numeradas (A-01 a A-15)</option>
              <option value="flotante">Abono Flotante Rotativo (Disponibilidad)</option>
              <option value="techado">Sector Techado Preferencial</option>
              <option value="mixto">Mixto (Fijo + Rotativo)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Franja Horaria Operativa
            </label>
            <select
              value={contactForm.schedule}
              onChange={e => setContactForm({ ...contactForm, schedule: e.target.value })}
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#E2498A] focus:bg-white focus:ring-4 focus:ring-[#E2498A]/10 transition-all"
            >
              <option value="24_7">Acceso Continuo 24 Horas / 7 Días</option>
              <option value="oficina">Horario Comercial (08:00 a 20:00)</option>
              <option value="nocturno">Custodia Nocturna y Fin de Semana</option>
              <option value="rotativo_turnos">Turnos Rotativos Mineros / Industriales</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bloque 3: Selección de Planes */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-black uppercase tracking-wider text-[#E2498A] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E2498A]"></span>
            3. Planes de Referencia para Cotizar
          </h5>
          <span className="text-[11px] font-bold text-slate-500">
            {contactForm.plan.length > 0 ? `${contactForm.plan.length} plan(es) seleccionado(s)` : 'Selecciona al menos uno'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {dynamicPricingOptions.map(opt => {
            const isSelected = contactForm.plan.includes(opt.id);
            return (
              <div
                key={opt.id}
                onClick={() => togglePlan(opt.id)}
                className={`cursor-pointer border-2 rounded-2xl p-3.5 transition-all flex flex-col items-center text-center select-none ${
                  isSelected
                    ? 'border-[#E2498A] bg-[#FFF5F8] text-[#1E1E2F] shadow-sm ring-2 ring-[#E2498A]/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="font-extrabold text-sm mb-1">{opt.title}</span>
                <span className={`text-base font-black tabular-nums font-mono ${isSelected ? 'text-[#E2498A]' : 'text-slate-800'}`}>
                  {opt.price}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500 mt-1">
                  {opt.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bloque 4: Requerimientos especiales y facturación */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          Detalles Específicos de Operación, Facturación o RUT de Empresa
        </label>
        <textarea
          rows={3}
          placeholder="Indica si requieres factura con orden de compra, control de TAG/código de barra, fechas estimadas de inicio o requerimientos de seguridad..."
          value={contactForm.comments}
          onChange={e => setContactForm({ ...contactForm, comments: e.target.value })}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#E2498A] focus:bg-white focus:ring-4 focus:ring-[#E2498A]/10 transition-all resize-none"
        ></textarea>
      </div>

      {/* Botón de Envío */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmittingContact || contactForm.plan.length === 0}
          className="w-full h-14 bg-[#E2498A] text-white rounded-2xl text-base font-black shadow-xl hover:bg-[#C83472] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide cursor-pointer"
        >
          {isSubmittingContact ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span>Generando Ficha de Solicitud...</span>
            </>
          ) : (
            <>
              <span>Solicitar Cotización y Enviar Ficha por WhatsApp</span>
              <span className="text-xl">💬</span>
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-slate-500 font-semibold mt-2.5">
          Atención ejecutiva directa • Respuesta promedio en menos de 15 minutos en horario hábil
        </p>
      </div>
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
  
        {/* 2. CARRUSEL DE IMÁGENES DEL RECINTO SERRANO 447 (MOVIMIENTO CONTINUO) */}
        <section id="galeria" ref={addToRefs} className="py-16 bg-slate-900 text-white relative opacity-0 translate-y-10 transition-all duration-700 ease-out overflow-hidden border-y border-slate-800">
           <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#E2498A] text-xs font-black tracking-wider uppercase mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#E2498A] animate-ping" />
                    RECINTO OPERATIVO EN VIVO
                 </div>
                 <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                    Infraestructura &amp; Seguridad Serrano 447
                 </h2>
                 <p className="text-slate-400 text-sm mt-1">
                    Conoce las instalaciones físicas: garita de control, pavimentación, cámaras y áreas techadas.
                 </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400">
                 <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                 <span>Recinto 100% Operativo • Iquique Centro</span>
              </div>
           </div>

           {/* Track del Carrusel Animado Infinito */}
           <div className="relative w-full overflow-hidden">
              <div className="flex gap-6 animate-carousel-infinite hover:[animation-play-state:paused] w-max py-2">
                 {[...carouselImages, ...carouselImages].map((img, idx) => (
                    <div 
                      key={idx} 
                      className="w-[320px] sm:w-[420px] lg:w-[480px] shrink-0 bg-[#1E1E2F] rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl group transition-transform duration-300 hover:scale-[1.02]"
                    >
                       <div className="h-56 sm:h-64 relative overflow-hidden">
                          <img 
                            src={img.url} 
                            alt={img.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E2F] via-transparent to-transparent opacity-80" />
                          <span className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-mono font-bold text-white border border-white/20">
                             SECTOR {idx % 2 === 0 ? 'A' : 'B'} • CORDANO
                          </span>
                       </div>
                       <div className="p-5 space-y-1">
                          <h4 className="font-extrabold text-base text-white group-hover:text-[#E2498A] transition-colors">
                             {img.title}
                          </h4>
                          <p className="text-xs text-slate-400 font-medium">
                             {img.desc}
                          </p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* CONVENIOS */}
      <section id="convenios" ref={addToRefs} className="py-20 lg:py-28 bg-slate-50/60 relative opacity-0 translate-y-10 transition-all duration-700 ease-out border-b border-slate-100">
         <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
            <div className="bg-[#1E1E2F] rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 lg:p-14 shadow-2xl flex flex-col xl:flex-row gap-10 lg:gap-14 items-stretch text-white relative overflow-hidden border border-[#2D2D44]">
               {/* Gráfico decorativo de fondo */}
               <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 text-[#E2498A] opacity-15 pointer-events-none">
                  <svg viewBox="0 0 200 200" className="w-[600px] h-[600px]"><path fill="currentColor" d="M38.1,-48.9C49.9,-40.4,60.5,-28.5,65.4,-14.2C70.3,0.1,69.5,16.8,61.9,29.9C54.3,43,39.9,52.5,24.6,58.4C9.3,64.3,-6.9,66.6,-22.4,63.1C-37.9,59.6,-52.7,50.3,-61.7,37.1C-70.7,23.9,-73.9,6.8,-69.5,-8.3C-65.1,-23.4,-53.1,-36.5,-40,-44.8C-26.9,-53.1,-13.4,-56.6,0.3,-57.1C14.1,-57.5,26.3,-57.4,38.1,-48.9Z" transform="translate(100 100)"/></svg>
               </div>

               {/* Columna Izquierda: Información de Convenios con Alto Contraste */}
               <div className="xl:w-[38%] space-y-7 relative z-10 flex flex-col justify-between">
                  <div className="space-y-5">
                     <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white border border-white/20 text-xs font-black tracking-wide uppercase">
                        <span className="w-2 h-2 rounded-full bg-[#E2498A]"></span>
                        SOLUCIONES EMPRESARIALES & FLOTAS
                     </div>
                     
                     <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1]">
                        Convenios y Estacionamiento para <span className="text-[#E2498A]">Empresas</span>
                     </h2>
                     
                     <p className="text-slate-300 font-medium text-base sm:text-lg leading-relaxed">
                        Asegura plazas exclusivas para tu equipo, proveedores o clientes en Serrano 447, Iquique. Gestión simplificada con facturación mensual consolidada, control de patentes y seguridad 24/7.
                     </p>

                     {/* Beneficios clave con contraste nítido */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3.5 pt-2">
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                           <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-black text-sm">
                              ✓
                           </div>
                           <div>
                              <h4 className="text-sm font-extrabold text-white">Factura Exenta / Afecta Mensual</h4>
                              <p className="text-xs text-slate-400 mt-0.5">Un solo pago a fin de mes con detalle de ingresos por vehículo.</p>
                           </div>
                        </div>

                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                           <div className="w-8 h-8 rounded-xl bg-[#E2498A]/20 text-[#E2498A] flex items-center justify-center shrink-0 font-black text-sm">
                              🛡️
                           </div>
                           <div>
                              <h4 className="text-sm font-extrabold text-white">Plazas Numeradas y Techadas</h4>
                              <p className="text-xs text-slate-400 mt-0.5">Reserva garantizada Sector A o B sin esperas ni congestión.</p>
                           </div>
                        </div>

                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                           <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-black text-sm">
                              ⚡
                           </div>
                           <div>
                              <h4 className="text-sm font-extrabold text-white">Acceso Automatizado</h4>
                              <p className="text-xs text-slate-400 mt-0.5">Lectura rápida de patente en garita y validación en 3 segundos.</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Datos del recinto */}
                  <div className="p-4 rounded-2xl bg-white/[0.07] border border-white/10 flex items-center justify-between text-xs font-bold text-slate-300">
                     <span>📍 Serrano 447, Iquique</span>
                     <span className="text-[#E2498A]">Capacidad: 30 Plazas</span>
                  </div>
               </div>
               
               {/* Columna Derecha: Tarjeta Blanca del Formulario Completo */}
               <div className="xl:w-[62%] bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-9 lg:p-10 relative z-10 text-[#1E1E2F] shadow-2xl border border-slate-100 flex flex-col justify-center">
                  {contactSuccess ? (
                     <div className="min-h-[460px] bg-emerald-500 rounded-[2rem] flex flex-col items-center justify-center text-white p-8 text-center animate-fade-in">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-5 text-3xl font-black">
                           ✓
                        </div>
                        <h4 className="text-3xl font-black tracking-tight">¡Solicitud Generada Exitosamente!</h4>
                        <p className="mt-2 text-emerald-50 font-medium max-w-md text-base">
                           Se ha abierto el canal directo de WhatsApp con la ficha técnica detallada. Nuestro equipo ejecutivo te responderá a la brevedad.
                        </p>
                     </div>
                  ) : (
                     renderFormContent()
                  )}
               </div>
            </div>
         </div>
      </section>

        {/* 4. MÓDULOS DEL SISTEMA (UBICADO DEBAJO DE CONVENIOS CON POP-UP INTERACTIVO) */}
        <section id="funcionalidades" ref={addToRefs} className="py-20 bg-slate-50 relative opacity-0 translate-y-10 transition-all duration-700 ease-out border-b border-slate-200">
           <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
              <div className="text-center mb-12">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5F8] border border-[#E2498A]/30 text-[#E2498A] text-xs font-bold uppercase mb-2">
                    ARQUITECTURA DE SOFTWARE CORDANO PMS
                 </div>
                 <h2 className="text-3xl lg:text-4xl font-black text-[#1E1E2F]">
                    Módulos Operativos del Sistema
                 </h2>
                 <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-2xl mx-auto font-medium">
                    Haz clic en cualquiera de los módulos para conocer en detalle su flujo operativo, lógica de negocio y roles autorizados.
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* 1. POS Ágil */}
                 <div 
                   onClick={() => setActiveModuleModal({
                     title: 'Garita y Punto de Venta (POS)',
                     badge: 'Operación Diaria',
                     icon: '⚡',
                     desc: 'Terminal de garita keyboard-first para control de entrada y salida con atajos F1-F9.',
                     details: [
                       'Ingreso por patente con cálculo de dígito verificador y asignación de tarifas (Sedán, SUV, Moto).',
                       'Emisión inmediata de comprobante térmico en 80mm con código de barras Code 128 y QR dinámico.',
                       'Cálculo de cobro al egreso por tiempo efectivo y tolerancia de 15 minutos sin fricción.',
                       'Integración con pagos en efectivo, Transbank POS débito/crédito y transferencias bancarias.'
                     ],
                     role: 'Operador de Garita (Cajero)',
                   })}
                   className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-[#E2498A] transition-all cursor-pointer group flex flex-col justify-between"
                 >
                    <div>
                       <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 text-xl font-bold group-hover:scale-110 transition-transform">
                          ⚡
                       </div>
                       <div className="flex items-center justify-between mb-2">
                          <h4 className="font-extrabold text-lg text-[#1E1E2F] group-hover:text-[#E2498A] transition-colors">POS Garita</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Ver Ficha</span>
                       </div>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed">Atajos F1-F9, lector de patentes, impresión térmica 80mm y cálculo de cobro en 3 segundos.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#E2498A]">
                       <span>Explorar funcionalidad</span>
                       <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                 </div>

                 {/* 2. Control de Turnos & Arqueo Ciego */}
                 <div 
                   onClick={() => setActiveModuleModal({
                     title: 'Control de Turnos & Arqueo Ciego',
                     badge: 'Seguridad Contable',
                     icon: '🔒',
                     desc: 'Gestión estricta de fondos y arqueo ciego para evitar fugas de capital en garita.',
                     details: [
                       'Apertura obligatoria declarando fondo inicial de gaveta ($50.000 CLP) con checklist de arranque.',
                       'Bloqueo preventivo de la terminal POS cuando no existe turno abierto activo.',
                       'Cierre ciego definitivo: el cajero declara lo físico sin ver el balance esperado por el sistema.',
                       'Sellado inmutable con firma hash SHA-256 y reporte Z de dos copias estándar A4.'
                     ],
                     role: 'Operador y Supervisor de Garita',
                   })}
                   className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-[#E2498A] transition-all cursor-pointer group flex flex-col justify-between"
                 >
                    <div>
                       <div className="w-12 h-12 bg-blue-100 text-[#E2498A] rounded-2xl flex items-center justify-center mb-4 text-xl font-bold group-hover:scale-110 transition-transform">
                          🔒
                       </div>
                       <div className="flex items-center justify-between mb-2">
                          <h4 className="font-extrabold text-lg text-[#1E1E2F] group-hover:text-[#E2498A] transition-colors">Control de Turnos</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Ver Ficha</span>
                       </div>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed">Aperturas con fondo en efectivo, arqueo ciego sin bucle y cierre definitivo certificado con SHA-256.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#E2498A]">
                       <span>Explorar funcionalidad</span>
                       <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                 </div>

                 {/* 3. Reportes & Auditoría */}
                 <div 
                   onClick={() => setActiveModuleModal({
                     title: 'Auditoría & Reportes Financieros',
                     badge: 'Fiscal & DTE',
                     icon: '📊',
                     desc: 'Control y fiscalización en tiempo real de boletas, ingresos y trazabilidad de cajas.',
                     details: [
                       'Libro diario de cobros DTE por turno, fecha y medio de pago (Efectivo/POS/Transferencia).',
                       'Registro de excepciones y trazabilidad de tickets extraviados conforme a Ley 20.967.',
                       'Exportación de balances en hoja A4 corporativa con firmas físicas de cajero y supervisor.',
                       'Historial inalterable de auditoría para peritajes administrativos y control contable.'
                     ],
                     role: 'Administrador y Supervisor Contable',
                   })}
                   className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-[#E2498A] transition-all cursor-pointer group flex flex-col justify-between"
                 >
                    <div>
                       <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4 text-xl font-bold group-hover:scale-110 transition-transform">
                          📊
                       </div>
                       <div className="flex items-center justify-between mb-2">
                          <h4 className="font-extrabold text-lg text-[#1E1E2F] group-hover:text-[#E2498A] transition-colors">Auditoría &amp; Reportes</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Ver Ficha</span>
                       </div>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed">Libro de cobros, trazabilidad de excepciones PIN y emisión de Reporte Z corporativo A4.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#E2498A]">
                       <span>Explorar funcionalidad</span>
                       <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                 </div>

                 {/* 4. Convenios y Facturación de Flotas */}
                 <div 
                   onClick={() => setActiveModuleModal({
                     title: 'Convenios Comerciales & Flotas',
                     badge: 'B2B Recurrente',
                     icon: '🤝',
                     desc: 'Gestión integral de abonados mensuales, flotas corporativas y control de cobranza.',
                     details: [
                       'Diseño de tarjetas de convenio con edición rápida en ventana modal.',
                       'Registro multivehículo con facturación periódica y cobro individualizado por patente.',
                       'Historial detallado de entradas y salidas exclusivas de vehículos de convenios.',
                       'Panel de cobranza con estado de deuda, último pago y notificaciones directas.'
                     ],
                     role: 'Administración Comercial',
                   })}
                   className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-[#E2498A] transition-all cursor-pointer group flex flex-col justify-between"
                 >
                    <div>
                       <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4 text-xl font-bold group-hover:scale-110 transition-transform">
                          🤝
                       </div>
                       <div className="flex items-center justify-between mb-2">
                          <h4 className="font-extrabold text-lg text-[#1E1E2F] group-hover:text-[#E2498A] transition-colors">Convenios y Flotas</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Ver Ficha</span>
                       </div>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed">Gestión de abonados, facturación mensual consolidada, control de pagos y registro de flota.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#E2498A]">
                       <span>Explorar funcionalidad</span>
                       <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                 </div>

                 {/* 5. Matriz 2D y Ocupación */}
                 <div 
                   onClick={() => setActiveModuleModal({
                     title: 'Plano 2D & Matriz de Ocupación',
                     badge: 'Telemetría Patio',
                     icon: '🗺️',
                     desc: 'Monitoreo semaforizado en vivo de las 30 plazas de Serrano 447.',
                     details: [
                       'Distribución física: Sector A (plazas 01 a 15) y Sector B (plazas 16 a 30).',
                       'Indicador visual en verde distintivo para espacios libres y oscuro para ocupados.',
                       'Información instantánea al hacer clic en cada plaza: patente, tiempo transcurrido y tarifa acumulada.',
                       'Paso directo a cobro de salida con un solo clic sobre la plaza ocupada.'
                     ],
                     role: 'Operador y Supervisor en Vivo',
                   })}
                   className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-[#E2498A] transition-all cursor-pointer group flex flex-col justify-between"
                 >
                    <div>
                       <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center mb-4 text-xl font-bold group-hover:scale-110 transition-transform">
                          🗺️
                       </div>
                       <div className="flex items-center justify-between mb-2">
                          <h4 className="font-extrabold text-lg text-[#1E1E2F] group-hover:text-[#E2498A] transition-colors">Plano 2D Serrano 447</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Ver Ficha</span>
                       </div>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed">Matriz de ocupación con plazas libres en verde, duración en tiempo real y despacho directo a cobro.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#E2498A]">
                       <span>Explorar funcionalidad</span>
                       <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                 </div>

                 {/* 6. Aprobaciones TOTP Remotas */}
                 <div 
                   onClick={() => setActiveModuleModal({
                     title: 'Aprobaciones de Seguridad & PIN Supervisor',
                     badge: 'Antifraude',
                     icon: '🛡️',
                     desc: 'Control antifraude de anulaciones, descuentos y cobros de contingencia.',
                     details: [
                       'Aprobación express diferida: el cajero libera el vehículo con justificación sin trabar la fila.',
                       'Validación en bloque con PIN de supervisor o código TOTP al momento del cierre de turno.',
                       'Control de excepciones de caja: sangrías y gastos menores con clave de doble factor.',
                       'Auditoría criptográfica de cada anulación con fecha, hora y responsable.'
                     ],
                     role: 'Supervisor y Administrador Central',
                   })}
                   className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-[#E2498A] transition-all cursor-pointer group flex flex-col justify-between"
                 >
                    <div>
                       <div className="w-12 h-12 bg-[#E2498A]/10 text-[#E2498A] rounded-2xl flex items-center justify-center mb-4 text-xl font-bold group-hover:scale-110 transition-transform">
                          🛡️
                       </div>
                       <div className="flex items-center justify-between mb-2">
                          <h4 className="font-extrabold text-lg text-[#1E1E2F] group-hover:text-[#E2498A] transition-colors">Seguridad &amp; TOTP</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Ver Ficha</span>
                       </div>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed">Autorizaciones antifraude mediante códigos temporales de Google Authenticator y PIN supervisor.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#E2498A]">
                       <span>Explorar funcionalidad</span>
                       <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* MODAL POP-UP INFORMATIVO DE MÓDULOS */}
        {activeModuleModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-sans">
             <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-fade-in-up">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#FFF5F8] text-[#E2498A] flex items-center justify-center text-2xl font-black shrink-0">
                         {activeModuleModal.icon}
                      </div>
                      <div>
                         <span className="text-[10px] font-black uppercase tracking-wider text-[#E2498A]">
                            {activeModuleModal.badge} • PERFIL: {activeModuleModal.role}
                         </span>
                         <h3 className="text-xl font-black text-slate-900 tracking-tight">
                            {activeModuleModal.title}
                         </h3>
                      </div>
                   </div>
                   <button 
                     onClick={() => setActiveModuleModal(null)}
                     className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 font-bold flex items-center justify-center text-sm cursor-pointer transition"
                   >
                      ✕
                   </button>
                </div>

                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                   {activeModuleModal.desc}
                </p>

                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                      Capacidades y Lógica Operativa:
                   </h5>
                   <ul className="space-y-2">
                      {activeModuleModal.details.map((item, idx) => (
                         <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-700">
                            <span className="text-emerald-500 font-black">✓</span>
                            <span>{item}</span>
                         </li>
                      ))}
                   </ul>
                </div>

                <div className="pt-2 flex justify-end">
                   <button 
                     onClick={() => setActiveModuleModal(null)}
                     className="px-6 py-2.5 bg-[#1E1E2F] hover:bg-slate-900 text-white rounded-xl text-xs font-black transition cursor-pointer"
                   >
                      Entendido, Cerrar
                   </button>
                </div>
             </div>
          </div>
        )}

      {/* FAQ BUSCADOR */}
      <section id="faq" ref={addToRefs} className="py-24 bg-white relative overflow-hidden opacity-0 translate-y-10 transition-all duration-700 ease-out border-b border-slate-100">
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
