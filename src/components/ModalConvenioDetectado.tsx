import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Agreement } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  User,
  Phone,
  Calendar,
  DollarSign,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Car,
  X
} from 'lucide-react';

interface ModalConvenioDetectadoProps {
  isOpen: boolean;
  agreement: Agreement | null;
  onConfirmEntry: () => void;
  onGoToModule: () => void;
  onCancel: () => void;
}

export const ModalConvenioDetectado: React.FC<ModalConvenioDetectadoProps> = ({
  isOpen,
  agreement,
  onConfirmEntry,
  onGoToModule,
  onCancel
}) => {
  if (!isOpen || !agreement) return null;

  const validUntilDate = new Date(agreement.validUntil);
  const formattedDate = validUntilDate.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const now = new Date();
  const diffDays = Math.ceil((validUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Determine status color and copy
  let statusBadge = {
    bg: 'bg-slate-900 border-slate-400 text-slate-800',
    icon: <CheckCircle2 className="w-4 h-4 text-slate-800" />,
    label: 'Convenio Vigente • Al Día',
    desc: `Vence en ${diffDays} días (${formattedDate}). Registro sin cobro en caja.`
  };

  if (agreement.status === 'por_vencer' || (diffDays >= 0 && diffDays <= 7)) {
    statusBadge = {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-4 h-4 text-slate-800" />,
      label: 'Suscripción Por Vencer',
      desc: `Vence en ${diffDays} día(s) (${formattedDate}). Recordar renovación a administración.`
    };
  } else if (agreement.status === 'vencido' || diffDays < 0) {
    statusBadge = {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <XCircle className="w-4 h-4 text-rose-600" />,
      label: 'Convenio Vencido • En Mora',
      desc: `Venció hace ${Math.abs(diffDays)} día(s) (${formattedDate}). Se permite ingreso y salida excepcional sin PIN.`
    };
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Manrope',sans-serif]">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18 }}
          className="bg-white rounded-3xl shadow-2xl border border-[#e2e2e4] max-w-xl w-full overflow-hidden"
        >
          {/* Header Bar */}
          <div className="bg-[#1D1D1F] text-white p-5 sm:p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-900/20 text-slate-700 border border-slate-400/30 flex items-center justify-center shadow-xs">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 block">
                  Detección Automática de Convenio
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Vehículo Mensualidad / Convenio Comercial
                </h3>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-white/60 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Plate Display + Status Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#f8f9fa] p-4 rounded-2xl border border-[#e2e2e4]">
              {/* Chilean License Plate Graphic */}
              <div className="flex items-center">
                <div className="bg-white border-2 border-black rounded-lg px-4 py-1.5 shadow-xs flex flex-col items-center justify-center min-w-[140px]">
                  <div className="flex items-center space-x-1 -mb-1">
                    <span className="text-[8px] font-black text-blue-900 tracking-widest">CHILE</span>
                  </div>
                  <span className="tabular-nums text-2xl font-black tracking-wider text-black">
                    {agreement.plateNumber}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`w-full sm:w-auto flex-1 p-3 rounded-xl border ${statusBadge.bg}`}>
                <div className="flex items-center space-x-2 font-black text-xs">
                  {statusBadge.icon}
                  <span>{statusBadge.label}</span>
                </div>
                <p className="text-[11px] mt-1 font-medium opacity-90 leading-tight">
                  {statusBadge.desc}
                </p>
              </div>
            </div>

            {/* Agreement Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#fcfcfd] p-3.5 rounded-xl border border-[#eef0f2] flex items-start space-x-3">
                <Building2 className="w-4 h-4 text-[#0F172A] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#717785] block">Empresa / Convenio</span>
                  <span className="font-extrabold text-[#1a1c1d] block">{agreement.companyName}</span>
                  {agreement.rutCompany && (
                    <span className="text-[10px] text-[#717785]">RUT: {agreement.rutCompany}</span>
                  )}
                </div>
              </div>

              <div className="bg-[#fcfcfd] p-3.5 rounded-xl border border-[#eef0f2] flex items-start space-x-3">
                <User className="w-4 h-4 text-slate-800 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#717785] block">Conductor / Contacto</span>
                  <span className="font-extrabold text-[#1a1c1d] block">{agreement.contactName}</span>
                  <span className="text-[10px] text-[#717785] flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-800" />
                    {agreement.phone}
                  </span>
                </div>
              </div>

              <div className="bg-[#fcfcfd] p-3.5 rounded-xl border border-[#eef0f2] flex items-start space-x-3">
                <Calendar className="w-4 h-4 text-slate-800 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#717785] block">Modalidad & Vigencia</span>
                  <span className="font-extrabold text-[#1a1c1d] block">{agreement.agreementType}</span>
                  <span className="text-[10px] text-[#717785]">Vence: {formattedDate}</span>
                </div>
              </div>

              <div className="bg-[#fcfcfd] p-3.5 rounded-xl border border-[#eef0f2] flex items-start space-x-3">
                <DollarSign className="w-4 h-4 text-slate-800 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#717785] block">Cuota Mensual Pactada</span>
                  <span className="font-extrabold text-slate-800 block text-sm">
                    ${agreement.monthlyFeeClp.toLocaleString('es-CL')} CLP
                  </span>
                  <span className="text-[10px] text-[#717785]">Pago fuera de caja de turno</span>
                </div>
              </div>
            </div>

            {/* Operational Policy Note */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 text-xs text-blue-900 flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block">Política Operativa Cordano PMS:</span>
                Este vehículo <span className="font-bold">no cancela ticket de ingreso ni salida en caja</span>. 
                Se emite registro para control de estadía y consume <span className="font-bold">1 cupo general de aforo</span> (sin reserva fija de slot).
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-[#717785] hover:text-[#1a1c1d] hover:bg-black/5 rounded-xl transition cursor-pointer"
              >
                Cobrar como Particular
              </button>

              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={onGoToModule}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-[#f1f3f5] text-[#2c3e50] hover:bg-[#e2e6ea] transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver Ficha Convenio</span>
                </button>

                <button
                  type="button"
                  onClick={onConfirmEntry}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#0F172A] text-white hover:bg-[#9a0c47] shadow-md shadow-[#0F172A]/20 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Registrar Ingreso ($0)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
