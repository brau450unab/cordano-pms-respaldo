import React, { useState } from 'react';
import { useParking } from '../../context/ParkingContext';
import { VehicleType } from '../../types';

interface PatioTestSimulatorProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PatioTestSimulator: React.FC<PatioTestSimulatorProps> = ({ onShowToast }) => {
  const {
    slots,
    registerEntry,
    addPendingApproval,
    currentShift,
    openNewShift,
    tickets,
  } = useParking();

  const [isOpen, setIsOpen] = useState(false);

  // Inyectar lote de 5 vehículos de prueba
  const handleInjectVehicles = () => {
    const testPlates: { plate: string; type: VehicleType; obs: string }[] = [
      { plate: 'KJ9921', type: 'Automóvil', obs: 'Cliente particular' },
      { plate: 'PW4412', type: 'Camioneta', obs: 'Proveedor Zofri' },
      { plate: 'MOTO09', type: 'Motocicleta', obs: 'Repartidor centro' },
      { plate: 'BBLL88', type: 'Furgón / SUV', obs: 'Trámites notariales' },
      { plate: 'OVER99', type: 'Automóvil', obs: 'Vehículo simulación larga estadía' },
    ];

    let count = 0;
    testPlates.forEach((v) => {
      const alreadyIn = tickets.some((t) => t.plateNumber === v.plate && t.status === 'activo');
      if (!alreadyIn) {
        const freeSlot = slots.find((s) => s.status === 'disponible');
        if (freeSlot) {
          registerEntry(v.plate, v.type, freeSlot.code, v.obs);
          count++;
        }
      }
    });

    onShowToast(`Simulación: ${count} vehículos inyectados en patio Serrano 447`, 'success');
  };

  // Inyectar vehículo con sobrestadía forzada (> 2 horas)
  const handleInjectOverstay = () => {
    const freeSlot = slots.find((s) => s.status === 'disponible');
    if (!freeSlot) {
      onShowToast('No hay cupos disponibles para simular sobrestadía', 'error');
      return;
    }

    const plate = `SOBR${Math.floor(10 + Math.random() * 89)}`;
    const tkt = registerEntry(plate, 'Automóvil', freeSlot.code, 'Simulación vehículo sobrestadía > 2.5 hrs');

    // Modificar hora de ingreso a 160 minutos atrás
    try {
      const savedTickets = localStorage.getItem('cordano_tickets');
      if (savedTickets) {
        const parsed = JSON.parse(savedTickets);
        const overstayIso = new Date(Date.now() - 160 * 60 * 1000).toISOString();
        const updated = parsed.map((t: any) => (t.id === tkt.id ? { ...t, entryTime: overstayIso } : t));
        localStorage.setItem('cordano_tickets', JSON.stringify(updated));
      }
    } catch (e) {
      // ignore
    }

    onShowToast(`Vehículo ${plate} generado con 160 min de sobrestadía en cupo ${freeSlot.code}`, 'info');
  };

  // Simular solicitud de excepción diferida pendiente de PIN de Supervisor
  const handleSimulateDeferredApproval = () => {
    addPendingApproval({
      type: 'DISCOUNT',
      description: 'Descuento comercial 50% solicitado por cajero (Convenio Especial Zofri)',
      amount: 1750,
      operatorId: 'operador-1',
    });
    onShowToast('Excepción diferida enviada a la bandeja del supervisor móvil.', 'info');
  };

  // Forzar apertura rápida de turno
  const handleQuickOpenShift = () => {
    if (currentShift?.status === 'abierto') {
      onShowToast('El turno ya se encuentra abierto.', 'info');
      return;
    }
    openNewShift(50000);
    onShowToast('Turno abierto con fondo estándar de $50.000 CLP.', 'success');
  };

  return (
    <>
      {/* Botón flotante para abrir el simulador de patio */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-4 left-4 z-40 px-3 py-1.5 rounded-full bg-[#1E1E2F] hover:bg-slate-800 text-white border border-slate-600 shadow-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer backdrop-blur-md active:scale-95 transition-all"
        title="Abrir Simulador de Supervisión y Patio"
      >
        <span>🧪</span>
        <span className="hidden sm:inline">Simulador</span>
      </button>

      {/* Modal / Panel del Simulador */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-fade-in-up text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧪</span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-tight">Simulador de Pruebas</h4>
                  <span className="text-[10px] text-slate-400 font-medium">Testeo de Supervisión &amp; Espacio</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Herramienta de desarrollo para contrastar el comportamiento de la garita física contra la supervisión en terreno (Serrano 447).
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleInjectVehicles}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>🚗</span>
                  <span>Inyectar 5 Vehículos en Patio</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">+5 cupos</span>
              </button>

              <button
                type="button"
                onClick={handleInjectOverstay}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Generar Sobrestadía (&gt; 2h)</span>
                </span>
                <span className="text-[10px] font-mono text-rose-600">Alerta Roja</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateDeferredApproval}
                className="w-full py-2.5 px-3 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#E2498A] border border-pink-200 font-bold text-xs flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>🔐</span>
                  <span>Simular Excepción para Supervisor</span>
                </span>
                <span className="text-[10px] font-mono text-[#E2498A]">PIN Req.</span>
              </button>

              <button
                type="button"
                onClick={handleQuickOpenShift}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>🚀</span>
                  <span>Apertura Rápida de Turno</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-600">$50.000</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
