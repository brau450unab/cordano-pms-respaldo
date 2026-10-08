const fs = require('fs');

const content = `import React, { useState, useEffect, useRef } from 'react';
import { AppScreen } from '../../types';
import { useParking } from '../../context/ParkingContext';

interface PlatformNavbarProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  shiftTimer: string;
  operatorName: string;
  onInitiateCashClose: () => void;
  onOpenCommandPalette?: () => void;
  onLogout?: () => void;
}

export const PlatformNavbar: React.FC<PlatformNavbarProps> = ({
  currentScreen,
  onNavigate,
  shiftTimer,
  operatorName,
  onInitiateCashClose,
  onOpenCommandPalette,
  onLogout,
}) => {
  const { user, isOffline, currentShift } = useParking();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const primaryNavItems: { id: AppScreen; label: string; icon: string }[] = [
    { id: 'menu',    label: 'Dashboard',  icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'pos',     label: 'Garita POS', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'map',     label: 'Plano 2D',   icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
    { id: 'clients', label: 'Convenios',  icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'reports', label: 'Auditoría',  icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'support', label: 'Soporte',    icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
  ];

  const isActive = (id: AppScreen) =>
    currentScreen === id ||
    (id === 'menu'    && currentScreen === 'inicio') ||
    (id === 'pos'     && ['operacion_salida','operacion_ingreso'].includes(currentScreen)) ||
    (id === 'map'     && currentScreen === 'operacion_layout') ||
    (id === 'reports' && ['reportes_dashboard','reportes_auditoria','reportes_database'].includes(currentScreen));

  const initials = operatorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-[#2A2B2C] text-[#D1D5DB] sticky top-0 z-50 font-sans border-b border-[#3E3F40]">
      {/* LEFT: BRAND */}
      <div className="flex items-center gap-3 shrink-0 mr-6">
        <button onClick={() => onNavigate('menu')} className="w-9 h-9 rounded-xl bg-[#E2498A] flex items-center justify-center shadow-sm transition-transform hover:scale-105">
           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
           </svg>
        </button>
        <div className="flex flex-col">
           <span className="font-extrabold text-white text-base tracking-tight leading-none">ParkOps</span>
           <span className="text-[10px] text-gray-400 font-semibold mt-1 tracking-wide">Serrano 447</span>
        </div>
      </div>

      {/* CENTER: PILL NAVIGATION */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center p-1 bg-[#1E1E1E] rounded-xl border border-[#3E3F40]">
          {primaryNavItems.map((item) => {
            const active = isActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`h-9 px-4 flex items-center gap-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  active 
                    ? 'bg-[#3E3F40] text-white shadow-sm' 
                    : 'text-[#9CA3AF] hover:text-white hover:bg-[#3E3F40]/50'
                }`}
              >
                <svg className={`w-4 h-4 ${active ? 'text-white' : 'text-[#6B7280]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: TOOLS & PROFILE */}
      <div className="flex items-center gap-4 shrink-0 ml-6">
        
        {/* Search */}
        <button 
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 h-9 px-3 bg-[#1E1E1E] hover:bg-[#3E3F40] border border-[#3E3F40] rounded-lg text-sm font-semibold text-[#9CA3AF] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Buscar
          <div className="hidden sm:flex items-center justify-center w-5 h-5 ml-2 rounded bg-[#2A2B2C] border border-[#3E3F40] text-[10px] font-bold text-gray-500">
            K
          </div>
        </button>

        {/* Timer */}
        {currentShift && (
          <div className="flex items-center gap-1.5 h-9 px-3 bg-[#1E1E1E] border border-[#3E3F40] rounded-lg">
            <svg className="w-4 h-4 text-[#E2498A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[#E2498A] text-sm font-bold tabular-nums tracking-wide">{shiftTimer}</span>
          </div>
        )}

        {/* Clock */}
        <div className="text-sm font-semibold text-[#9CA3AF] tabular-nums hidden md:block">
          {currentTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* Avatar Dropdown */}
        <div className="relative" ref={avatarRef}>
          <button 
            onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
            className="w-9 h-9 rounded-full bg-[#E2498A] text-white flex items-center justify-center font-bold text-xs shadow-sm hover:ring-2 hover:ring-[#E2498A]/50 transition-all focus:outline-none"
          >
            {initials}
          </button>
          
          {isAvatarMenuOpen && (
            <div className="absolute top-12 right-0 w-64 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100 py-2 z-50 animate-fade-in-up">
              
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-[#E2498A] text-white flex items-center justify-center font-bold text-sm">
                   {initials}
                 </div>
                 <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-gray-900">{operatorName}</span>
                    <span className="text-xs font-semibold text-gray-500">Operador</span>
                 </div>
              </div>

              <div className="p-2 space-y-1">
                <button onClick={() => { onNavigate('settings'); setIsAvatarMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Ajustes de Plataforma
                </button>
                <button onClick={() => { onNavigate('support'); setIsAvatarMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  Centro de Soporte
                </button>
              </div>

              <div className="p-2 border-t border-gray-100">
                {currentShift ? (
                  <button 
                    onClick={() => { onInitiateCashClose(); setIsAvatarMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 text-sm font-bold transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Cerrar Turno (Arqueo)
                  </button>
                ) : (
                  <button 
                    onClick={() => { onNavigate('menu'); setIsAvatarMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm font-bold transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    Abrir Turno
                  </button>
                )}
                
                <button 
                  onClick={() => { if(onLogout) onLogout(); setIsAvatarMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-600 text-sm font-bold transition-colors mt-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
`
fs.writeFileSync('src/components/pms/PlatformNavbar.tsx', content);
