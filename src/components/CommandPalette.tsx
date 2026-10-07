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
  const { tickets, calculateFee } = useParking();
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

  const filteredTickets = activeTickets.filter((t) => {
    if (!cleanQuery) return true;
    const plateMatch = t.plateNumber.toUpperCase().replace('-', '').includes(cleanQuery.replace('-', ''));
    const codeMatch = t.ticketCode.toUpperCase().includes(cleanQuery);
    const slotMatch = t.slotCode.toUpperCase().includes(cleanQuery);
    return plateMatch || codeMatch || slotMatch;
  });

  const quickActions: Array<{
    id: string;
    title: string;
    subtitle: string;
    screen: AppScreen;
    hotkey: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'ingreso',
      title: 'Registrar Ingreso de Vehículo',
      subtitle: 'Entrada rápida con asignación de plaza',
      screen: 'operacion_ingreso',
      hotkey: 'F1',
      icon: <Car className="w-4 h-4 text-slate-700" />
    },
    {
      id: 'salida',
      title: 'Garita de Cobro y Salida (POS)',
      subtitle: 'Procesar ticket, cobrar y liberar plaza',
      screen: 'operacion_salida',
      hotkey: 'F2',
      icon: <Receipt className="w-4 h-4 text-slate-700" />
    },
    {
      id: 'layout',
      title: 'Plano de 30 Plazas en Vivo',
      subtitle: 'Visualizar Zonas A, B y C en tiempo real',
      screen: 'operacion_layout',
      hotkey: 'F3',
      icon: <MapPin className="w-4 h-4 text-slate-700" />
    },
    {
      id: 'cierre',
      title: 'Arqueo y Cierre Ciego de Turno',
      subtitle: 'Conteo de caja física y cuadratura',
      screen: 'operacion_cierre',
      hotkey: 'F4',
      icon: <Lock className="w-4 h-4 text-slate-700" />
    },
    {
      id: 'convenios',
      title: 'Abonados & Convenios Especiales',
      subtitle: 'Empresas, mensualidades y flotas',
      screen: 'operacion_convenios',
      hotkey: 'F5',
      icon: <Building2 className="w-4 h-4 text-slate-700" />
    },
    {
      id: 'dashboard',
      title: 'Dashboard Ejecutivo y Métricas',
      subtitle: 'Recaudación, ocupación y KPI de gestión',
      screen: 'reportes_dashboard',
      hotkey: 'Admin',
      icon: <Layers className="w-4 h-4 text-slate-700" />
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
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
            placeholder="Buscar por patente, ticket o plaza (ej. BBCL10, A-04)..."
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none font-mono"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-mono text-slate-600 bg-white border border-slate-300 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-3 space-y-4 divide-y divide-slate-100">
          {/* Active Parking Vehicles Section */}
          <div>
            <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider">
              <span>[ VEHÍCULOS ESTACIONADOS: {filteredTickets.length} ]</span>
              <span className="text-[10px] text-slate-500 font-mono">En vivo</span>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
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
                        <div className="w-9 h-9 rounded-md bg-slate-50 border border-dashed border-slate-300 text-slate-800 flex items-center justify-center font-mono font-bold text-xs">
                          {ticket.slotCode || 'P'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-slate-900 text-sm tracking-wide">
                              {ticket.plateNumber}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">· {ticket.vehicleType}</span>
                            {ticket.tariffType === 'especial' && (
                              <span className="text-[10px] font-mono text-slate-800 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-300">
                                Especial
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-2 mt-0.5">
                            <span>Entrada: {timeStr}</span>
                            <span>·</span>
                            <span>{fee.durationMinutes} min</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-900 block">
                            ${fee.totalAmount.toLocaleString('es-CL')} CLP
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">#{ticket.ticketCode}</span>
                        </div>
                        <button
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-semibold flex items-center space-x-1 transition cursor-pointer"
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

          {/* Quick Actions / Jump to Screen */}
          <div className="pt-3">
            <div className="px-2 pb-2 text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider">
              [ ACCESO A MÓDULOS ]
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    onNavigate(action.screen);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-slate-200 text-left transition group cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-7 h-7 rounded border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center shrink-0">
                      {action.icon}
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-mono font-semibold text-slate-900 block truncate">
                        {action.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 truncate block">
                        {action.subtitle}
                      </span>
                    </div>
                  </div>
                  <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-300 rounded shrink-0">
                    {action.hotkey}
                  </kbd>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-600 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>Serrano 447, Iquique</span>
            <span>·</span>
            <span className="font-semibold text-slate-800">30 Plazas Activas</span>
          </div>
          <span>Atajos: F1 (Ingreso) · F2 (Cobro) · F3 (Plano)</span>
        </div>
      </div>
    </div>
  );
};
