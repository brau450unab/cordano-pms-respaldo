import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Lock, ArrowRight, UserCheck, ArrowLeft, LogIn, Sparkles } from 'lucide-react';
import { CordanoLogo } from './CordanoLogo';
import { APP_ROUTES } from '../utils/routes';
import { AppScreen, User } from '../types';

interface AccessDeniedGateProps {
  reason: 'unauthenticated' | 'unauthorized_role';
  targetScreen: AppScreen;
  currentUser?: User;
  onLogin: (presetRole?: 'operador' | 'administrador') => void;
  onGoToInicio: () => void;
}

export const AccessDeniedGate: React.FC<AccessDeniedGateProps> = ({
  reason,
  targetScreen,
  currentUser,
  onLogin,
  onGoToInicio,
}) => {
  const route = APP_ROUTES[targetScreen] || APP_ROUTES.inicio;

  if (reason === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#f9f9fb] flex flex-col justify-between font-['Manrope',sans-serif] text-[#1a1c1d]">
        {/* Top Minimal Nav */}
        <header className="bg-white border-b border-[#e2e2e4] py-3.5 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={onGoToInicio}
              className="flex items-center space-x-2.5 cursor-pointer text-left group"
            >
              <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center group-hover:scale-105 transition">
                <CordanoLogo className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xs text-[#1a1c1d]">
                CORDANO PMS <span className="text-[#717785] font-normal">• Garita Serrano 447</span>
              </span>
            </button>
            <button
              onClick={() => onLogin('operador')}
              className="text-xs font-bold text-[#0F172A] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" /> Iniciar Sesión Operador
            </button>
          </div>
        </header>

        {/* Central Card */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#e2e2e4] shadow-xl text-center space-y-6"
          >
            {/* Lock Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9]/60 text-[#0F172A] flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-8 h-8" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-[#0F172A] uppercase tracking-wider bg-[#F1F5F9]/40 px-3 py-1 rounded-full inline-block">
                Área Privada • Autenticación Requerida
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#1D1D1F] tracking-tight">
                Acceso Protegido al Sistema
              </h2>
              <p className="text-xs sm:text-sm text-[#515154] leading-relaxed">
                Para acceder al módulo <strong>{route.title}</strong> (<code>{route.path}</code>), debes iniciar sesión con tus credenciales de operador o administrador.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-[#f9f9fb] p-4 rounded-2xl border border-[#e2e2e4] text-left text-xs space-y-2">
              <div className="flex items-center justify-between text-[#717785]">
                <span>Módulo Solicitado:</span>
                <span className="font-mono font-bold text-[#1D1D1F]">{route.title}</span>
              </div>
              <div className="flex items-center justify-between text-[#717785]">
                <span>Categoría:</span>
                <span className="font-bold text-[#0F172A]">{route.category}</span>
              </div>
              <div className="flex items-center justify-between text-[#717785]">
                <span>Ruta Protegida:</span>
                <span className="font-mono text-[#1D1D1F]">{route.path}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => onLogin(route.requiresAdmin ? 'administrador' : 'operador')}
                className="w-full py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-extrabold rounded-2xl transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión para Continuar</span>
              </button>

              <button
                onClick={onGoToInicio}
                className="w-full py-2.5 bg-[#f3f3f5] hover:bg-[#e8e8ec] text-[#515154] text-xs font-bold rounded-2xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Inicio</span>
              </button>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-[#717785] border-t border-[#e2e2e4] bg-white">
          CORDANO PMS • Sistema de Gestión de Estacionamiento Iquique
        </footer>
      </div>
    );
  }

  // Reason: unauthorized_role
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm max-w-xl mx-auto my-8 text-center space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#ba1a1a] flex items-center justify-center mx-auto">
        <ShieldAlert className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-extrabold text-[#ba1a1a] uppercase tracking-wider bg-rose-100 px-3 py-1 rounded-full inline-block">
          Privilegios Insuficientes
        </span>
        <h2 className="text-xl font-black text-[#1D1D1F]">
          Acceso Restringido a Administradores
        </h2>
        <p className="text-xs sm:text-sm text-[#515154] leading-relaxed">
          El módulo <strong>{route.title}</strong> (<code>{route.path}</code>) está reservado exclusivamente para cuentas con rol de <strong>Administrador</strong>.
        </p>
      </div>

      <div className="bg-[#f9f9fb] p-4 rounded-2xl border border-[#e2e2e4] text-left text-xs space-y-1.5">
        <div className="flex items-center justify-between text-[#717785]">
          <span>Usuario Autenticado:</span>
          <span className="font-bold text-[#1D1D1F]">{currentUser?.name || 'Operador'}</span>
        </div>
        <div className="flex items-center justify-between text-[#717785]">
          <span>Rol Actual:</span>
          <span className="font-extrabold uppercase text-[#0F172A]">{currentUser?.role || 'operador'}</span>
        </div>
        <div className="flex items-center justify-between text-[#717785]">
          <span>Permiso Requerido:</span>
          <span className="font-bold text-[#ba1a1a]">Administrador de Sistema</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
        <button
          onClick={onGoToInicio}
          className="flex-1 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-extrabold rounded-xl transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Inicio / Operación</span>
        </button>

        <button
          onClick={() => onLogin('administrador')}
          className="flex-1 py-2.5 bg-[#f3f3f5] hover:bg-[#e8e8ec] text-[#1D1D1F] text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Cambiar a Administrador</span>
        </button>
      </div>
    </div>
  );
};
