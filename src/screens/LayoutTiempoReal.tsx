import React, { useState } from 'react';
import { useParking } from '../context/ParkingContext';
import { ParkingSlot, SlotStatus, Ticket } from '../types';
import { ProcesoPagoModal } from './ProcesoPagoModal';
import { RegistroEntradaModal } from './RegistroEntradaModal';
import { TicketModal } from '../components/TicketModal';
import { TableroKanbanEstadia } from '../components/TableroKanbanEstadia';
import {
  MapPin,
  Car,
  Wrench,
  BookmarkCheck,
  X,
  DollarSign,
  PlusCircle,
  Layers,
  LayoutGrid
} from 'lucide-react';

export const LayoutTiempoReal: React.FC = () => {
  const { slots, tickets, updateSlotStatus, calculateFee } = useParking();

  const [activeViewMode, setActiveViewMode] = useState<'mapa' | 'kanban'>('mapa');
  const [selectedZone, setSelectedZone] = useState<string>('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [activeSlotModal, setActiveSlotModal] = useState<ParkingSlot | null>(null);

  // Flow Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentTicketId, setPaymentTicketId] = useState<string | null>(null);
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);

  const zones = ['Zona A (Techado)', 'Zona B (General)', 'Zona C (Preferencial)'];

  const filteredSlots = slots.filter((s) => {
    const matchZone = selectedZone === 'todos' || s.zone === selectedZone;
    const matchStatus = selectedStatusFilter === 'todos' || s.status === selectedStatusFilter;
    return matchZone && matchStatus;
  });

  const countByStatus = (status: SlotStatus) => slots.filter((s) => s.status === status).length;

  const handleSlotClick = (slot: ParkingSlot) => {
    setActiveSlotModal(slot);
  };

  const handleActionPay = (ticketId: string) => {
    setActiveSlotModal(null);
    setPaymentTicketId(ticketId);
    setIsPaymentOpen(true);
  };

  const handleActionEntry = () => {
    setActiveSlotModal(null);
    setIsEntryOpen(true);
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      
      {/* Top View Selector: Mapa vs Kanban */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-xl p-3 border border-slate-300 shadow-xs gap-3">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveViewMode('mapa')}
            className={`px-3.5 py-1.5 rounded-lg text-xs tabular-nums font-bold transition flex items-center space-x-2 cursor-pointer border ${
              activeViewMode === 'mapa'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>[ MAPA DE 30 SLOTS ]</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewMode('kanban')}
            className={`px-3.5 py-1.5 rounded-lg text-xs tabular-nums font-bold transition flex items-center space-x-2 cursor-pointer border ${
              activeViewMode === 'kanban'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>[ TABLERO KANBAN ]</span>
          </button>
        </div>

        <div className="text-right">
          <span className="text-[11px] tabular-nums font-bold text-slate-700 bg-slate-100 border border-slate-300 px-3 py-1 rounded-md uppercase tracking-wider">
            Serrano 447 • Wireframe Mode
          </span>
        </div>
      </div>

      {/* RENDER KANBAN OR MAP */}
      {activeViewMode === 'kanban' ? (
        <TableroKanbanEstadia
          onGoToCheckout={(ticket) => {
            setPaymentTicketId(ticket.id);
            setIsPaymentOpen(true);
          }}
        />
      ) : (
        <>
          {/* Page Title & Legend Header */}
          <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 tabular-nums">
            <div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-slate-800" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Layout de Cupos · Recinto Serrano 447
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Visualización gráfica estructural con código de cupos y estado de ocupación (30 Cupos)
              </p>
            </div>

            {/* Status Legend Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs tabular-nums">
              <button
                onClick={() => setSelectedStatusFilter('todos')}
                className={`px-2.5 py-1 rounded-md border text-xs cursor-pointer ${
                  selectedStatusFilter === 'todos'
                    ? 'bg-slate-900 text-white border-slate-900 font-bold'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Todos ({slots.length})
              </button>
              <button
                onClick={() => setSelectedStatusFilter('disponible')}
                className={`px-2.5 py-1 rounded-md border text-xs flex items-center space-x-1.5 cursor-pointer ${
                  selectedStatusFilter === 'disponible'
                    ? 'bg-slate-900 text-white border-slate-900 font-bold'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full border border-slate-700 bg-white"></span>
                <span>Libres ({countByStatus('disponible')})</span>
              </button>
              <button
                onClick={() => setSelectedStatusFilter('ocupado')}
                className={`px-2.5 py-1 rounded-md border text-xs flex items-center space-x-1.5 cursor-pointer ${
                  selectedStatusFilter === 'ocupado'
                    ? 'bg-slate-900 text-white border-slate-900 font-bold'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                <span>Ocupados ({countByStatus('ocupado')})</span>
              </button>
              <button
                onClick={() => setSelectedStatusFilter('mantenimiento')}
                className={`px-2.5 py-1 rounded-md border text-xs flex items-center space-x-1.5 cursor-pointer ${
                  selectedStatusFilter === 'mantenimiento'
                    ? 'bg-slate-900 text-white border-slate-900 font-bold'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 bg-slate-400"></span>
                <span>Mantención ({countByStatus('mantenimiento')})</span>
              </button>
            </div>
          </div>

          {/* Zone Tabs */}
          <div className="flex border-b border-slate-300 space-x-2 tabular-nums text-xs">
            <button
              onClick={() => setSelectedZone('todos')}
              className={`pb-2 px-3 font-bold border-b-2 transition-all cursor-pointer ${
                selectedZone === 'todos'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              [ Todas las Zonas ]
            </button>
            {zones.map((zone) => (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className={`pb-2 px-3 font-bold border-b-2 transition-all cursor-pointer ${
                  selectedZone === zone
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                [ {zone} ]
              </button>
            ))}
          </div>

          {/* Grid Layout of Slots (Pure Architectural Wireframe Blueprint) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredSlots.map((slot) => {
              const isOccupied = slot.status === 'ocupado';
              const isFree = slot.status === 'disponible';
              const isMaintenance = slot.status === 'mantenimiento';

              const ticket = isOccupied ? tickets.find((t) => t.id === slot.currentTicketId) : null;
              const stay = ticket ? calculateFee(ticket) : null;
              const isOverstay = stay ? stay.durationMinutes > 240 : false;

              return (
                <div
                  key={slot.id}
                  onClick={() => handleSlotClick(slot)}
                  className={`relative cursor-pointer rounded-xl p-3 border transition-all duration-150 flex flex-col justify-between h-32 select-none ${
                    isOccupied
                      ? 'bg-slate-50 border-slate-400 hover:border-slate-900 shadow-xs'
                      : isFree
                      ? 'bg-white border-dashed border-slate-300 hover:border-slate-600 hover:bg-slate-50/50'
                      : 'bg-slate-100 border-dotted border-slate-400'
                  }`}
                >
                  {/* Top Slot Header */}
                  <div className="flex items-center justify-between tabular-nums">
                    <span className="font-bold text-xs tracking-wider text-slate-900 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded">
                      {slot.code}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full border ${
                        isOccupied
                          ? isOverstay
                            ? 'bg-slate-900 border-slate-900 ring-2 ring-slate-400'
                            : 'bg-slate-800 border-slate-800'
                          : isFree
                          ? 'bg-white border-slate-400'
                          : 'bg-slate-400 border-slate-500'
                      }`}
                    ></span>
                  </div>

                  {/* Middle Content */}
                  <div className="my-auto tabular-nums">
                    {isOccupied ? (
                      <div className="space-y-1">
                        <span className="bg-white border border-slate-400 text-slate-900 font-bold text-[11px] px-1.5 py-0.5 rounded block text-center truncate tracking-wider">
                          {slot.plateNumber || 'PATENTE'}
                        </span>
                        <p className={`text-[10px] text-center font-bold ${isOverstay ? 'text-slate-900 underline' : 'text-slate-600'}`}>
                          {stay ? `${stay.durationMinutes} min` : 'Ocupado'}
                        </p>
                      </div>
                    ) : isFree ? (
                      <div className="text-center text-slate-400">
                        <Car className="w-5 h-5 mx-auto opacity-40 text-slate-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider block mt-1">
                          LIBRE
                        </span>
                      </div>
                    ) : isMaintenance ? (
                      <div className="text-center text-slate-600">
                        <Wrench className="w-4 h-4 mx-auto text-slate-500" />
                        <span className="text-[9px] font-bold block mt-1">MANTENCIÓN</span>
                      </div>
                    ) : (
                      <div className="text-center text-slate-600">
                        <BookmarkCheck className="w-4 h-4 mx-auto text-slate-500" />
                        <span className="text-[9px] font-bold block mt-1">RESERVADO</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Zone Subtext */}
                  <div className="text-[9px] font-bold text-slate-500 truncate tabular-nums">
                    {slot.zone.replace('Zona ', '')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Slot Interactive Detail Popover Modal */}
          {activeSlotModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 tabular-nums">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-400 text-slate-900">
                
                {/* Modal Header */}
                <div className="bg-slate-100 p-4 border-b border-slate-300 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="bg-white px-2.5 py-1 rounded border border-slate-400 font-bold text-xs text-slate-900">
                      {activeSlotModal.code}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-tight">Cupo {activeSlotModal.code}</h3>
                      <p className="text-slate-500 text-[11px]">{activeSlotModal.zone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSlotModal(null)}
                    className="text-slate-500 hover:text-slate-900 p-1 rounded hover:bg-slate-200 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4 text-xs">
                  
                  {activeSlotModal.status === 'ocupado' ? (
                    (() => {
                      const ticket = tickets.find((t) => t.id === activeSlotModal.currentTicketId);
                      const stay = ticket ? calculateFee(ticket) : null;
                      return (
                        <div className="space-y-4">
                          <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 space-y-2.5">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Patente</span>
                              <span className="font-bold text-base text-slate-900 tracking-wider">{activeSlotModal.plateNumber}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600">
                              <span>Ticket:</span>
                              <span className="font-bold text-slate-900">{ticket?.ticketCode}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600">
                              <span>Tipo Vehículo:</span>
                              <span className="font-bold text-slate-900">{ticket?.vehicleType}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600">
                              <span>Estadía Actual:</span>
                              <span className="font-bold text-slate-900">{stay?.durationMinutes} min</span>
                            </div>
                            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                              <span className="font-bold text-slate-700">Total Acumulado:</span>
                              <span className="font-bold text-base text-slate-900">
                                ${stay?.totalAmount.toLocaleString('es-CL')} CLP
                              </span>
                            </div>
                          </div>

                          {ticket && (
                            <button
                              onClick={() => handleActionPay(ticket.id)}
                              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center space-x-2 text-xs font-bold cursor-pointer transition"
                            >
                              <DollarSign className="w-4 h-4" />
                              <span>PROCESAR PAGO & LIBERAR PLAZA</span>
                            </button>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="p-3 bg-slate-50 text-slate-700 rounded-lg border border-slate-300 text-xs">
                        Cupo disponible para asignación vehicular inmediata.
                      </div>

                      <button
                        onClick={handleActionEntry}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center space-x-2 text-xs font-bold cursor-pointer transition"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>REGISTRAR INGRESO EN ESTE SLOT</span>
                      </button>
                    </div>
                  )}

                  {/* Actions for manual state toggle */}
                  <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Estado Manual:</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          updateSlotStatus(activeSlotModal.code, 'disponible');
                          setActiveSlotModal(null);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded text-slate-800 font-bold border border-slate-300 cursor-pointer"
                      >
                        Liberar
                      </button>
                      <button
                        onClick={() => {
                          updateSlotStatus(activeSlotModal.code, 'mantenimiento');
                          setActiveSlotModal(null);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded text-slate-800 font-bold border border-slate-300 cursor-pointer"
                      >
                        Mantención
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Modal from Layout */}
          {isPaymentOpen && (
            <ProcesoPagoModal
              isOpen={isPaymentOpen}
              preselectedTicketId={paymentTicketId}
              onClose={() => {
                setIsPaymentOpen(false);
                setPaymentTicketId(null);
              }}
              onSuccessTicket={(ticket: Ticket) => {
                setViewTicket(ticket);
              }}
            />
          )}

          {/* Direct Entry Modal from Layout */}
          {isEntryOpen && (
            <RegistroEntradaModal
              isOpen={isEntryOpen}
              onClose={() => setIsEntryOpen(false)}
              onSuccessTicket={(ticket: Ticket) => {
                setViewTicket(ticket);
              }}
            />
          )}

          {/* Ticket preview on print/completion */}
          {viewTicket && (
            <TicketModal
              ticket={viewTicket}
              onClose={() => setViewTicket(null)}
              title="Ticket de Estacionamiento"
            />
          )}
        </>
      )}
    </div>
  );
};
