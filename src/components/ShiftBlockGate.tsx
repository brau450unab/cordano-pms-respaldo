import React from 'react';
import { motion } from 'motion/react';
import { Lock, AlertCircle, LayoutGrid, KeyRound, Sparkles, ArrowRight } from 'lucide-react';
import { AppScreen } from '../types';

interface ShiftBlockGateProps {
  targetScreen: AppScreen;
  onOpenShift: () => void;
  onGoToLayout: () => void;
  onGoToInicio: () => void;
}

export const ShiftBlockGate: React.FC<ShiftBlockGateProps> = ({
  targetScreen,
  onOpenShift,
  onGoToLayout,
  onGoToInicio,
}) => {
  const isIngreso = targetScreen === 'operacion_ingreso';
  const actionName = isIngreso ? 'Registro de Ingreso de Vehículos' : 'Punto de Venta y Cobro de Salida';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 font-['Manrope',sans-serif]">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#e2e2e4] shadow-xl text-center space-y-6"
      >
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-3xl bg-[#F1F5F9]/60 text-[#0F172A] flex items-center justify-center mx-auto shadow-inner border border-[#F1F5F9]">
          <Lock className="w-8 h-8" />
        </div>

        {/* Title & Explanation */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold tabular-nums">
            <AlertCircle className="w-3.5 h-3.5 text-slate-800" />
            <span>CONDICIÓN DE BLOQUEO ACTIVA</span>
          </div>
          <h2 className="text-2xl font-black text-[#1a1c1d] tracking-tight">
            Caja Cerrada — Se Requiere Apertura de Turno
          </h2>
          <p className="text-sm text-[#515154] max-w-md mx-auto leading-relaxed">
            Para acceder a <strong>{actionName}</strong> e ingresar patentes o cobrar tickets, el operador debe aperturar formalmente la caja y verificar el fondo de sencillo inicial ($30.000 CLP).
          </p>
        </div>

        {/* Permitted Views Callout */}
        <div className="p-3.5 bg-[#f9f9fb] border border-[#e2e2e4] rounded-2xl text-xs text-[#515154] text-left flex items-start gap-3">
          <LayoutGrid className="w-5 h-5 text-[#0F172A] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#1a1c1d] block">Visualización Permitida:</span>
            <span>
              Mientras la caja esté cerrada, puede monitorear en tiempo real el plano de slots y disponibilidad del recinto.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onOpenShift}
            id="btn-gate-open-shift"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] active:bg-[#68072f] text-white font-extrabold text-sm shadow-md shadow-[#0F172A]/25 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Aperturar Turno y Caja Ahora</span>
          </button>

          <button
            onClick={onGoToLayout}
            id="btn-gate-view-layout"
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-[#f3f3f5] hover:bg-[#e2e2e4] text-[#1a1c1d] font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4 text-[#717785]" />
            <span>Ver Mapa de Slots</span>
          </button>
        </div>

        {/* Return link */}
        <div className="pt-2 border-t border-[#f3f3f5]">
          <button
            onClick={onGoToInicio}
            className="text-xs font-semibold text-[#717785] hover:text-[#1a1c1d] transition cursor-pointer"
          >
            Volver al Menú Principal de Módulos
          </button>
        </div>
      </motion.div>
    </div>
  );
};
