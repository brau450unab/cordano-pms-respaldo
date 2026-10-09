import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParking } from '../context/ParkingContext';
import { AppScreen, Ticket } from '../types';
import {
  Search,
  Car,
  Receipt,
  MapPin,
  Clock,
  ArrowRight,
  X,
  Building2,
  Lock,
  Layers
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: AppScreen) => void;
  onSelectTicketForCheckout?: (ticket: Ticket) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectTicketForCheckout
}) => {
  const { tickets, calculateFee, agreements } = useParking();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeTickets = tickets.filter((t) => t.status === 'activo');
  const cleanQuery = query.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');

  const filteredAgreements = agreements.filter(a => {
    if (!cleanQuery) return true;
    return (a.contactName || '').toUpperCase().includes(cleanQuery) || 
           (a.companyName || '').toUpperCase().includes(cleanQuery) || 
           (a.rutCompany || '').toUpperCase().includes(cleanQuery) ||
           (a.plateNumber || '').toUpperCase().replace('-', '').includes(cleanQuery.replace('-', ''));
  });

  const filteredTickets = activeTickets.filter((t) => {
    if (!cleanQuery) return true;
    const plateMatch = t.plateNumber.toUpperCase().replace('-', '').includes(cleanQuery.replace('-', ''));
    const codeMatch = t.ticketCode.toUpperCase().includes(cleanQuery);
    const slotMatch = t.slotCode.toUpperCase().includes(cleanQuery);
    return plateMatch || codeMatch || slotMatch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#1E1E2F]/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white border border-slate-300 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50">
          <Search className="w-5 h-5 text-slate-500 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por patente, ticket o cupo (ej. BBCL10, A-04)..."
            className="w-full bg-transparent text-[#1E1E2F] placeholder-slate-400 text-sm focus:outline-none tabular-nums"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] tabular-nums text-slate-600 bg-white border border-slate-300 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-3 space-y-4 divide-y divide-slate-100">
          {/* Active Parking Vehicles Section */}
          <div>
            <div className="flex items-center justify-between px-2 pb-2 text-[11px] tabular-nums font-bold text-slate-700 uppercase tracking-wider">
              <span>[ VEHÍCULOS ESTACIONADOS: {filteredTickets.length} ]</span>
              <span className="text-[10px] text-slate-500 tabular-nums">En vivo</span>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="py-6 text-center text-xs tabular-nums text-slate-500 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                {query ? 'No se encontraron vehículos coincidentes' : 'No hay vehículos activos en este momento'}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {filteredTickets.slice(0, 8).map((ticket) => {
                  const fee = calculateFee(ticket);
                  const entryDate = new Date(ticket.entryTime);
                  const timeStr = entryDate.toLocaleTimeString('es-CL', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  });

                  return (
                    <div
                      key={ticket.id}
                      className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-slate-200 transition cursor-pointer"
                      onClick={() => {
                        if (onSelectTicketForCheckout) {
                          onSelectTicketForCheckout(ticket);
                        }
                        onNavigate('operacion_salida');
                        onClose();
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-md bg-slate-50 border border-dashed border-slate-300 text-[#2D2D44] flex items-center justify-center tabular-nums font-bold text-xs">
                          {ticket.slotCode || 'P'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="tabular-nums font-bold text-[#1E1E2F] text-sm tracking-wide">
                              {ticket.plateNumber}
                            </span>
                            <span className="text-[11px] tabular-nums text-slate-500">· {ticket.vehicleType}</span>
                            {ticket.tariffType === 'especial' && (
                              <span className="text-[10px] tabular-nums text-[#2D2D44] bg-[#2D2D44] px-1.5 py-0.2 rounded border border-slate-300">
                                Especial
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] tabular-nums text-slate-500 flex items-center space-x-2 mt-0.5">
                            <span>Entrada: {timeStr}</span>
                            <span>·</span>
                            <span>{fee.durationMinutes} min</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="text-xs tabular-nums font-bold text-[#1E1E2F] block">
                            ${fee.totalAmount.toLocaleString('es-CL')} CLP
                          </span>
                          <span className="text-[10px] tabular-nums text-slate-500">#{ticket.ticketCode}</span>
                        </div>
                        <button
                          className="px-2.5 py-1.5 rounded-lg bg-[#1E1E2F] hover:bg-[#2D2D44] text-white text-xs tabular-nums font-semibold flex items-center space-x-1 transition cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectTicketForCheckout) {
                              onSelectTicketForCheckout(ticket);
                            }
                            onNavigate('operacion_salida');
                            onClose();
                          }}
                        >
                          <span>Cobrar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-[11px] tabular-nums text-slate-600 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>Serrano 447, Iquique</span>
            <span>·</span>
            <span className="font-semibold text-[#2D2D44]">30 Cupos Activas</span>
          </div>
          <span>Atajos: F1 (Ingreso) · F2 (Cobro) · F3 (Plano)</span>
        </div>
      </div>
    </div>
  );
};
