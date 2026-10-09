import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParking } from '../context/ParkingContext';
import { Ticket, VehicleType } from '../types';
import { TicketModal } from './TicketModal';
import { ModalFugaVehiculo } from './ModalFugaVehiculo';
import {
  Clock,
  Car,
  Bike,
  Truck,
  AlertTriangle,
  Search,
  Filter,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  Receipt,
  Layers,
  ChevronRight,
  Sparkles,
  Zap,
  Tag
} from 'lucide-react';

interface TableroKanbanEstadiaProps {
  onGoToCheckout?: (ticket: Ticket) => void;
}

export const TableroKanbanEstadia: React.FC<TableroKanbanEstadiaProps> = ({ onGoToCheckout }) => {
  const { tickets, calculateFee, slots, registerVehicleEscape } = useParking();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('todos');
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<Ticket | null>(null);
  const [ticketForFugaModal, setTicketForFugaModal] = useState<Ticket | null>(null);

  // Active tickets
  const activeTickets = tickets.filter((t) => t.status === 'activo');

  // Filter by search and vehicle type
  const filteredActiveTickets = activeTickets.filter((t) => {
    const matchesSearch =
      !searchTerm ||
      t.plateNumber.toUpperCase().includes(searchTerm.toUpperCase().replace('-', '')) ||
      t.ticketCode.toUpperCase().includes(searchTerm.toUpperCase()) ||
      t.slotCode.toUpperCase().includes(searchTerm.toUpperCase());

    const matchesVehicle =
      selectedVehicleFilter === 'todos' || t.vehicleType === selectedVehicleFilter;

    return matchesSearch && matchesVehicle;
  });

  // Segment into the 4 mandatory operational columns:
  // 1. [0-30 min]
  // 2. [31-120 min]
  // 3. [2-4 horas] -> 121 to 240 min
  // 4. [>4 horas Alerta] -> > 240 min
  const group0to30 = filteredActiveTickets.filter((t) => {
    const stay = calculateFee(t);
    return stay.durationMinutes <= 30;
  });

  const group31to120 = filteredActiveTickets.filter((t) => {
    const stay = calculateFee(t);
    return stay.durationMinutes > 30 && stay.durationMinutes <= 120;
  });

  const group2to4h = filteredActiveTickets.filter((t) => {
    const stay = calculateFee(t);
    return stay.durationMinutes > 120 && stay.durationMinutes <= 240;
  });

  const groupOver4h = filteredActiveTickets.filter((t) => {
    const stay = calculateFee(t);
    return stay.durationMinutes > 240;
  });

  // KPI Calculations
  const totalOccupied = activeTickets.length;
  const criticalOver4hCount = activeTickets.filter((t) => calculateFee(t).durationMinutes > 240).length;
  const totalAccumulatedClp = activeTickets.reduce((sum, t) => sum + calculateFee(t).totalAmount, 0);
  const avgMinutes =
    totalOccupied > 0
      ? Math.round(
          activeTickets.reduce((sum, t) => sum + calculateFee(t).durationMinutes, 0) / totalOccupied
        )
      : 0;

  const renderVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case 'Motocicleta':
        return <Bike className="w-3.5 h-3.5" />;
      case 'Camioneta':
      case 'Furgón / SUV':
        return <Truck className="w-3.5 h-3.5" />;
      default:
        return <Car className="w-3.5 h-3.5" />;
    }
  };

  const columns = [
    {
      id: 'col_0_30',
      title: '0 - 30 min',
      subtitle: 'Rotación Rápida / Corto Plazo',
      count: group0to30.length,
      tickets: group0to30,
      badgeColor: 'bg-[#1E1E2F] text-[#2D2D44] border-slate-400',
      headerBorder: 'border-slate-400',
      tagColor: 'text-[#2D2D44] bg-[#1E1E2F]',
      cardBg: 'bg-white hover:border-slate-400',
    },
    {
      id: 'col_31_120',
      title: '31 - 120 min',
      subtitle: 'Estadía Estándar (Centro)',
      count: group31to120.length,
      tickets: group31to120,
      badgeColor: 'bg-blue-100 text-blue-900 border-slate-300',
      headerBorder: 'border-slate-400',
      tagColor: 'text-[#2D2D44] bg-[#FFF5F8]',
      cardBg: 'bg-white hover:border-slate-300',
    },
    {
      id: 'col_2_4h',
      title: '2 - 4 horas',
      subtitle: 'Estadía Prolongada',
      count: group2to4h.length,
      tickets: group2to4h,
      badgeColor: 'bg-amber-100 text-amber-900 border-slate-300',
      headerBorder: 'border-amber-500',
      tagColor: 'text-[#2D2D44] bg-amber-50',
      cardBg: 'bg-white hover:border-slate-300',
    },
    {
      id: 'col_over_4h',
      title: '> 4 horas',
      subtitle: 'Alerta Crítica / Sobrestadía',
      count: groupOver4h.length,
      tickets: groupOver4h,
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300 font-black animate-pulse',
      headerBorder: 'border-[#C83472]',
      tagColor: 'text-rose-700 bg-[#FFF5F8]',
      cardBg: 'bg-[#FFF5F8]/40 border-rose-200 hover:border-rose-400',
      isAlert: true,
    },
  ];

  return (
    <div className="space-y-5 font-['Manrope',sans-serif]">
      {/* 1. Header & Summary KPIs */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e2e2e4] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-xs shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold tracking-wider text-[#0F172A] uppercase bg-[#F8FAFC]/40 px-2.5 py-0.5 rounded-full inline-block">
                  FASE 3 • MONITOREO OPERACIONAL
                </span>
                <span className="text-[10px] tabular-nums text-[#515154] bg-[#f3f3f5] px-2 py-0.5 rounded-full font-bold">
                  Recinto Iquique (30 Cupos)
                </span>
              </div>
              <h2 className="text-xl font-black text-[#1D1D1F] tracking-tight mt-0.5">
                Tablero Kanban por Tiempos de Estadía
              </h2>
            </div>
          </div>

          {/* Quick Filter Search & Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[#717785] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar patente o slot..."
                className="pl-9 pr-3 py-1.5 rounded-xl bg-[#f9f9fb] border border-[#c1c6d6] text-xs tabular-nums font-bold text-[#1D1D1F] uppercase focus:bg-white focus:border-[#0F172A] outline-none w-48 sm:w-56 transition"
              />
            </div>

            <div className="flex items-center space-x-1">
              {(['todos', 'Automóvil', 'Camioneta', 'Motocicleta'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedVehicleFilter(type)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    selectedVehicleFilter === type
                      ? 'bg-[#0F172A] text-white shadow-2xs'
                      : 'bg-[#f3f3f5] text-[#515154] hover:bg-[#e2e2e4]'
                  }`}
                >
                  {type === 'todos' ? 'Todos' : type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Mini Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#f3f3f5]">
          <div className="p-3 bg-[#f9f9fb] rounded-2xl border border-[#e2e2e4]">
            <span className="text-[10px] font-bold text-[#717785] uppercase block">En Recinto</span>
            <span className="text-xl font-black tabular-nums text-[#1D1D1F] mt-0.5 block">
              {totalOccupied} <span className="text-xs font-sans text-[#717785] font-semibold">/ 30 cupos</span>
            </span>
          </div>

          <div className="p-3 bg-[#f9f9fb] rounded-2xl border border-[#e2e2e4]">
            <span className="text-[10px] font-bold text-[#717785] uppercase block">Promedio Permanencia</span>
            <span className="text-xl font-black tabular-nums text-[#1D1D1F] mt-0.5 block">
              {avgMinutes} <span className="text-xs font-sans text-[#717785] font-semibold">min ({Math.floor(avgMinutes / 60)}h {avgMinutes % 60}m)</span>
            </span>
          </div>

          <div className="p-3 bg-[#f9f9fb] rounded-2xl border border-[#e2e2e4]">
            <span className="text-[10px] font-bold text-[#717785] uppercase block">Acumulado en Pista</span>
            <span className="text-xl font-black tabular-nums text-[#2D2D44] mt-0.5 block">
              ${totalAccumulatedClp.toLocaleString('es-CL')} <span className="text-xs font-sans text-[#2D2D44] font-semibold">CLP</span>
            </span>
          </div>

          <div className={`p-3 rounded-2xl border ${criticalOver4hCount > 0 ? 'bg-[#FFF5F8] border-rose-200 text-rose-900' : 'bg-[#f9f9fb] border-[#e2e2e4]'}`}>
            <span className="text-[10px] font-bold uppercase block flex items-center justify-between">
              <span>Alerta &gt; 4 Horas</span>
              {criticalOver4hCount > 0 && <AlertTriangle className="w-3 h-3 text-[#C83472] animate-pulse" />}
            </span>
            <span className={`text-xl font-black tabular-nums mt-0.5 block ${criticalOver4hCount > 0 ? 'text-rose-700' : 'text-[#1D1D1F]'}`}>
              {criticalOver4hCount} <span className="text-xs font-sans font-semibold">vehículos</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. KANBAN 4 COLUMNS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className="bg-[#f9f9fb] rounded-3xl border border-[#e2e2e4] p-4 flex flex-col min-h-[480px] shadow-xs"
          >
            {/* Column Header */}
            <div className={`pb-3 border-b-2 ${col.headerBorder} flex items-center justify-between mb-3`}>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-black text-sm text-[#1D1D1F]">{col.title}</h3>
                  {col.isAlert && <AlertTriangle className="w-3.5 h-3.5 text-[#C83472]" />}
                </div>
                <p className="text-[10px] text-[#717785] font-semibold">{col.subtitle}</p>
              </div>

              <span className={`text-xs tabular-nums font-black px-2.5 py-0.5 rounded-full border ${col.badgeColor}`}>
                {col.count}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[620px] pr-1">
              {col.tickets.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#c1c6d6] rounded-2xl text-[#717785]">
                  <Clock className="w-6 h-6 text-[#c1c6d6] mb-1" />
                  <span className="text-xs font-bold text-[#717785]">Sin vehículos en este tramo</span>
                </div>
              ) : (
                col.tickets.map((t) => {
                  const stay = calculateFee(t);
                  const isGrace = stay.isGracePeriod;

                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 rounded-2xl border border-[#e2e2e4] transition-all shadow-xs space-y-3 ${col.cardBg}`}
                    >
                      {/* Top Row: Plate & Slot Code */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="tabular-nums text-sm font-black bg-[#1D1D1F] text-white px-2.5 py-0.5 rounded-lg tracking-wider">
                            {t.plateNumber}
                          </span>
                          <span className="text-[10px] font-bold text-[#0F172A] bg-[#F8FAFC]/40 px-2 py-0.5 rounded-md flex items-center space-x-1">
                            {renderVehicleIcon(t.vehicleType)}
                            <span className="hidden sm:inline">{t.vehicleType}</span>
                          </span>
                        </div>

                        <span className="tabular-nums text-xs font-extrabold text-[#0F172A] bg-[#F8FAFC]/30 px-2 py-0.5 rounded-lg border border-[#F1F5F9]">
                          Slot {t.slotCode}
                        </span>
                      </div>

                      {/* Middle Info: Duration & Fee */}
                      <div className="space-y-1 bg-[#f9f9fb] p-2.5 rounded-xl text-xs">
                        <div className="flex items-center justify-between text-[#515154]">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-[#717785]" />
                            <span>Permanencia:</span>
                          </span>
                          <span className="tabular-nums font-bold text-[#1D1D1F]">
                            {stay.durationMinutes} min ({Math.floor(stay.durationMinutes / 60)}h {stay.durationMinutes % 60}m)
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-[#717785] text-[11px]">Estimado acumulado:</span>
                          <span className="tabular-nums font-black text-sm text-[#0F172A]">
                            {isGrace ? (
                              <span className="text-[#2D2D44] text-xs font-bold bg-[#1E1E2F] px-1.5 py-0.5 rounded">
                                Gracia ($0)
                              </span>
                            ) : (
                              `$${stay.totalAmount.toLocaleString('es-CL')} CLP`
                            )}
                          </span>
                        </div>

                        <div className="text-[10px] text-[#717785] pt-1 border-t border-[#e2e2e4] flex items-center justify-between">
                          <span>Ingreso: {new Date(t.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>Op: {t.operatorEntryName.split(' ')[0]}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1.5 pt-1">
                        {/* 1. Quick Checkout */}
                        <button
                          type="button"
                          onClick={() => onGoToCheckout && onGoToCheckout(t)}
                          className="flex-1 py-1.5 px-2 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[11px] font-extrabold rounded-xl transition shadow-2xs flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Cobrar Salida</span>
                        </button>

                        {/* 2. View Ticket */}
                        <button
                          type="button"
                          onClick={() => setSelectedTicketForModal(t)}
                          title="Ver comprobante de entrada"
                          className="p-1.5 bg-[#f3f3f5] hover:bg-[#e2e2e4] text-[#1D1D1F] rounded-xl border border-[#e2e2e4] transition cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>

                        {/* 3. Exceptional Case: Fuga de Vehículo */}
                        <button
                          type="button"
                          onClick={() => setTicketForFugaModal(t)}
                          title="Reportar Caso Excepcional / Fuga"
                          className="p-1.5 bg-[#FFF5F8] hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 transition cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Ticket Modal */}
      {selectedTicketForModal && (
        <TicketModal
          ticket={selectedTicketForModal}
          onClose={() => setSelectedTicketForModal(null)}
          title="Ticket Activo en Recinto"
        />
      )}

      {/* Fuga Modal */}
      {ticketForFugaModal && (
        <ModalFugaVehiculo
          isOpen={!!ticketForFugaModal}
          ticket={ticketForFugaModal}
          onClose={() => setTicketForFugaModal(null)}
          onConfirmFuga={(tId, nts, pin) => {
            if (registerVehicleEscape) {
              registerVehicleEscape(tId, nts, pin);
            }
          }}
        />
      )}
    </div>
  );
};
