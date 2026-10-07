import React, { useState } from 'react';
import { useParking } from '../context/ParkingContext';
import { VehicleType, Ticket } from '../types';
import { Car, X, AlertTriangle, CheckCircle2, Ticket as TicketIcon, MapPin, Tag } from 'lucide-react';

interface RegistroEntradaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessTicket: (ticket: Ticket) => void;
}

export const RegistroEntradaModal: React.FC<RegistroEntradaModalProps> = ({
  isOpen,
  onClose,
  onSuccessTicket,
}) => {
  const { slots, registerEntry, tariffConfig, tickets } = useParking();

  const [plate, setPlate] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Automóvil');
  const [selectedSlotCode, setSelectedSlotCode] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const availableSlots = slots.filter((s) => s.status === 'disponible');

  // Auto-select first available slot if none selected
  const effectiveSlotCode = selectedSlotCode || (availableSlots.length > 0 ? availableSlots[0].code : '');

  // Check if plate already active (Anti-passback warning)
  const formattedPlate = plate.trim().toUpperCase();
  const activeDuplicate = tickets.find((t) => t.plateNumber === formattedPlate && t.status === 'activo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formattedPlate || formattedPlate.length < 5) {
      setError('Ingrese una patente válida (mínimo 5 caracteres)');
      return;
    }

    if (!effectiveSlotCode) {
      setError('No hay slots disponibles en el estacionamiento');
      return;
    }

    try {
      const newTicket = registerEntry(formattedPlate, vehicleType, effectiveSlotCode, notes);
      setPlate('');
      setNotes('');
      setSelectedSlotCode('');
      onClose();
      onSuccessTicket(newTicket);
    } catch (err: any) {
      setError(err.message || 'Error al registrar la entrada');
    }
  };

  const vehicleTypes: { type: VehicleType; label: string; icon: string }[] = [
    { type: 'Automóvil', label: 'Automóvil', icon: '🚗' },
    { type: 'Camioneta', label: 'Camioneta / Pickup', icon: '🛻' },
    { type: 'Motocicleta', label: 'Motocicleta', icon: '🏍️' },
    { type: 'Furgón / SUV', label: 'Furgón / SUV', icon: '🚐' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-['Manrope',sans-serif]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#e2e2e4]">
        
        {/* Header */}
        <div className="bg-[#000722] p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-xl">
              <TicketIcon className="w-6 h-6 text-[#0071e3]" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">Registro de Entrada de Vehículo</h3>
              <p className="text-white/70 text-xs mt-0.5 font-medium">Control de Ingreso & Asignación de Slot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Plate Input with Chilean Plate Design */}
          <div>
            <label className="block text-xs font-extrabold text-[#1a1c1d] uppercase tracking-wider mb-2">
              Patente del Vehículo (Chile)
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#0059b5] text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                CL
              </div>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                placeholder="EJ: LK8421 O BC9210"
                maxLength={8}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-[#c1c6d6] focus:border-[#0071e3] text-2xl font-black font-mono tracking-widest uppercase text-[#1a1c1d] placeholder:text-[#717785]/40 outline-none transition bg-white"
                autoFocus
              />
            </div>

            {/* Anti-passback warning */}
            {activeDuplicate && (
              <div className="mt-2 bg-amber-50 border border-slate-300 text-amber-900 p-2.5 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-slate-800 shrink-0" />
                <span>
                  <strong>Atención [Anti-Passback]:</strong> Esta patente ya registra un ticket activo (<strong>{activeDuplicate.ticketCode}</strong>) en slot {activeDuplicate.slotCode}.
                </span>
              </div>
            )}
          </div>

          {/* Vehicle Type Selector */}
          <div>
            <label className="block text-xs font-extrabold text-[#1a1c1d] uppercase tracking-wider mb-2">
              Tipo de Vehículo & Tarifa
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {vehicleTypes.map((item) => {
                const isSelected = vehicleType === item.type;
                const rate = tariffConfig.vehicleRates[item.type];
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setVehicleType(item.type)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#0071e3] bg-[#d7e2ff]/30 text-[#001b3f] shadow-xs'
                        : 'border-[#e2e2e4] hover:border-[#c1c6d6] bg-white text-[#414753]'
                    }`}
                  >
                    <span className="text-2xl mb-1">{item.icon}</span>
                    <span className="font-bold text-xs block leading-tight">{item.label}</span>
                    <span className="text-[10px] text-[#717785] mt-1 font-mono font-bold">
                      ${rate?.minuteRate || 30}/min
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slot Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold text-[#1a1c1d] uppercase tracking-wider flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>Slot / Estacionamiento Asignado</span>
              </label>
              <span className="text-xs text-[#717785] font-bold">
                {availableSlots.length} de {slots.length} libres
              </span>
            </div>

            {availableSlots.length === 0 ? (
              <div className="bg-[#ffdad6]/50 border border-[#ffdad6] text-[#93000a] p-3 rounded-xl text-xs font-bold text-center">
                ⚠️ Estacionamiento completo (0 espacios disponibles)
              </div>
            ) : (
              <select
                value={effectiveSlotCode}
                onChange={(e) => setSelectedSlotCode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#c1c6d6] text-sm font-bold text-[#1a1c1d] bg-[#f9f9fb] focus:bg-white focus:border-[#0071e3] outline-none cursor-pointer"
              >
                {availableSlots.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.code} — {s.zone}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Notes Optional */}
          <div>
            <label className="block text-xs font-extrabold text-[#1a1c1d] uppercase tracking-wider mb-1">
              Notas u Observaciones (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Rayón en puerta derecha / Casco entregado"
              className="w-full px-3.5 py-2 rounded-xl border border-[#c1c6d6] text-xs text-[#1a1c1d] focus:border-[#0071e3] outline-none bg-white font-medium"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-[#ffdad6]/50 border border-[#ffdad6] text-[#93000a] p-3 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-full border border-[#c1c6d6] font-bold text-[#414753] hover:bg-[#f3f3f5] transition text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={availableSlots.length === 0 || !!activeDuplicate}
              className="flex-1 px-4 py-3 rounded-full bg-[#0071e3] hover:bg-[#0059b5] disabled:opacity-50 text-white font-bold shadow-md transition text-sm flex items-center justify-center space-x-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Emitir Ticket Entrada</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
