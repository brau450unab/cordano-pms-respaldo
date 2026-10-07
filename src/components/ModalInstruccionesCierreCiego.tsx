import React from 'react';
import { motion } from 'motion/react';
import {
  X,
  EyeOff,
  Car,
  Coins,
  ShieldAlert,
  FileCheck,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface ModalInstruccionesCierreCiegoProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalInstruccionesCierreCiego: React.FC<ModalInstruccionesCierreCiegoProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const STEPS = [
    {
      step: 1,
      title: 'Revisión y Vaciado de Vehículos en Recinto',
      icon: Car,
      color: 'bg-blue-50 text-slate-800 border-blue-200',
      description:
        'Revise uno a uno los vehículos que permanecen adentro. Ningún vehículo queda en el aire: determine si se traspasa su custodia al siguiente turno o si se cobra de inmediato.',
    },
    {
      step: 2,
      title: 'Conteo Físico Ciego (Sin Pistas del Sistema)',
      icon: EyeOff,
      color: 'bg-slate-800 text-slate-800 border-slate-300',
      description:
        'Cuente físicamente el dinero en la gaveta. Puede usar el Total Directo o el Desglose por denominación (monedas de $50, $100, $500 y billetes). Luego sume los vouchers del POS y las transferencias confirmadas.',
    },
    {
      step: 3,
      title: 'Validación de Cuadratura y Tolerancia ($2.000 CLP)',
      icon: ShieldAlert,
      color: 'bg-amber-50 text-slate-800 border-amber-200',
      description:
        'El sistema compara su declaración con las transacciones registradas. Si la diferencia es menor o igual a $2.000 CLP, se cierra directamente. Si supera los $2.000 CLP, se exige redactar una observación obligatoria y solicitar el PIN temporal del supervisor.',
    },
    {
      step: 4,
      title: 'Emisión de Reportes y Firma en Dos Copias',
      icon: FileCheck,
      color: 'bg-slate-900 text-slate-800 border-slate-400',
      description:
        'Se genera el Reporte Financiero Z. Copia 1 va a la caja del recinto y Copia 2 queda como respaldo firmado del operador (mostrando solo sus montos ingresados para protegerlo legalmente). Se envía respaldo automático a WhatsApp y correo.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-['Manrope',sans-serif]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="bg-white w-full max-w-lg rounded-3xl border border-[#e2e2e4] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#e2e2e4] flex items-center justify-between bg-[#fbfbfc]">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-xs">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-[#0F172A] uppercase bg-[#F1F5F9]/60 px-2.5 py-0.5 rounded-full inline-block">
                GUÍA OPERACIONAL
              </span>
              <h3 className="text-lg font-black text-[#1D1D1F] tracking-tight mt-0.5">
                Instrucciones Paso a Paso: Cierre Ciego
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f3f3f5] text-[#717785] hover:text-[#1D1D1F] flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {STEPS.map((s) => {
            const IconComponent = s.icon;
            return (
              <div
                key={s.step}
                className="p-4 rounded-2xl border border-[#e2e2e4] bg-[#f9f9fb] flex items-start gap-3.5"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${s.color}`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[10px] text-[#0F172A] bg-[#F1F5F9]/40 px-2 py-0.5 rounded">
                      PASO {s.step}
                    </span>
                    <h4 className="font-extrabold text-[#1D1D1F] text-xs sm:text-sm">
                      {s.title}
                    </h4>
                  </div>
                  <p className="text-[#515154] text-xs leading-relaxed font-medium">
                    {s.description}
                  </p>
                </div>
              </div>
            );
          })}

          <div className="p-3.5 bg-slate-900 border border-slate-400 rounded-2xl flex items-center gap-2.5 text-slate-800 text-xs">
            <Smartphone className="w-4 h-4 text-slate-800 shrink-0" />
            <span>
              <strong>Notificación Instantánea:</strong> Al confirmar el cierre, puede abrir directamente WhatsApp para avisar al Administrador con el arqueo exacto.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e2e2e4] bg-[#fbfbfc] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-xs transition shadow-xs cursor-pointer"
          >
            Entendido, Proceder con el Cierre
          </button>
        </div>
      </motion.div>
    </div>
  );
};
