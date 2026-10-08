import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParking } from '../context/ParkingContext';
import { AppScreen, ChileanCashBreakdown, Ticket, ParkingSlot } from '../types';
import { ModalAperturaTurno } from '../components/ModalAperturaTurno';
import {
  Car,
  Receipt,
  MapPin,
  Lock,
  ArrowRight,
  Clock,
  Zap,
  Building2,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  CreditCard,
  ChevronRight,
  Tag,
  Sliders,
  Printer,
  QrCode,
  Layers
} from 'lucide-react';

interface InicioHubProps {
  onNavigate: (screen: AppScreen) => void;
  onSelectTicketForCheckout?: (ticket: Ticket) => void;
}

export const InicioHub: React.FC<InicioHubProps> = ({ onNavigate, onSelectTicketForCheckout }) => {
  const {
    user,
    slots,
    tickets,
    currentShift,
    openNewShift,
    setIsChecklistModalOpen,
    calculateFee
  } = useParking();

  const [isAperturaModalOpen, setIsAperturaModalOpen] = useState(false);
  const [activeVehicleFilter, setActiveVehicleFilter] = useState<'todos' | 'zonaA' | 'zonaB' | 'zonaC' | 'convenio'>('todos');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedSlotForDrawer, setSelectedSlotForDrawer] = useState<ParkingSlot | null>(null);

  const totalSlots = slots.length;
  const occupiedSlots = slots.filter((s) => s.status === 'ocupado').length;
  const availableSlots = totalSlots - occupiedSlots;
  const occupancyPercentage = Math.round((occupiedSlots / totalSlots) * 100);

  // Breakdown by zone
  const zoneA = slots.filter((s) => s.code.startsWith('A'));
  const zoneAOccupied = zoneA.filter((s) => s.status === 'ocupado').length;

  const zoneB = slots.filter((s) => s.code.startsWith('B'));
  const zoneBOccupied = zoneB.filter((s) => s.status === 'ocupado').length;

  const zoneC = slots.filter((s) => s.code.startsWith('C'));
  const zoneCOccupied = zoneC.filter((s) => s.status === 'ocupado').length;

  // Active & Paid tickets
  const activeTickets = tickets.filter((t) => t.status === 'activo');
  const paidTickets = tickets.filter((t) => t.status === 'pagado');

  const shiftCashTotal = paidTickets
    .filter((t) => t.paymentMethod === 'efectivo')
    .reduce((acc, t) => acc + (t.totalAmount || 0), 0);

  const shiftDigitalTotal = paidTickets
    .filter((t) => t.paymentMethod !== 'efectivo')
    .reduce((acc, t) => acc + (t.totalAmount || 0), 0);

  const totalShiftRevenue = shiftCashTotal + shiftDigitalTotal;

  // Overstay tickets (> 3 hours)
  const overstayTickets = activeTickets.filter((t) => {
    const elapsed = Date.now() - new Date(t.entryTime).getTime();
    return elapsed > 3 * 60 * 60 * 1000;
  });

  // Filtered active tickets table
  const filteredActiveTickets = useMemo(() => {
    return activeTickets.filter((t) => {
      if (activeVehicleFilter === 'zonaA' && !t.slotCode.startsWith('A')) return false;
      if (activeVehicleFilter === 'zonaB' && !t.slotCode.startsWith('B')) return false;
      if (activeVehicleFilter === 'zonaC' && !t.slotCode.startsWith('C')) return false;
      if (activeVehicleFilter === 'convenio' && t.tariffType !== 'especial') return false;

      if (searchFilter.trim()) {
        const clean = searchFilter.trim().toUpperCase();
        const matchesPlate = t.plateNumber.toUpperCase().replace('-', '').includes(clean.replace('-', ''));
        const matchesSlot = t.slotCode.toUpperCase().includes(clean);
        const matchesCode = t.ticketCode.toUpperCase().includes(clean);
        return matchesPlate || matchesSlot || matchesCode;
      }
      return true;
    });
  }, [activeTickets, activeVehicleFilter, searchFilter]);

  const handleConfirmShiftOpen = (totalCash: number, breakdown: ChileanCashBreakdown) => {
    openNewShift(totalCash, breakdown);
    setIsAperturaModalOpen(false);
    setIsChecklistModalOpen(true);
  };

  const isShiftOpen = currentShift.status === 'abierto';

  return (
    <div className="space-y-6 font-sans text-slate-900 animate-in fade-in duration-150">
      
      {/* 1. TOP HEADER BANNER (Wireframe Spec) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="tabular-nums text-xs font-bold text-slate-800 uppercase tracking-wider">
              [ PUESTO DE CONTROL GARITA · SERRANO 447 · IQUIQUE ]
            </span>
          </div>
          <p className="text-xs tabular-nums text-slate-500 mt-1">
            Gestión operacional de 30 cupos de estacionamiento en tiempo real · Tarificación activa
          </p>
        </div>

        {/* Shift status action */}
        <div className="flex items-center space-x-3">
          {isShiftOpen ? (
            <div className="flex items-center space-x-3 border border-slate-200 bg-slate-50 px-3.5 py-1.5 rounded-lg">
              <div>
                <span className="text-[10px] tabular-nums text-slate-500 block uppercase">Estado Turno</span>
                <span className="text-xs tabular-nums font-bold text-slate-800">
                  Turno #{currentShift.id.slice(-6)} · {currentShift.operatorName}
                </span>
              </div>
              <button
                onClick={() => onNavigate('operacion_cierre')}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-xs tabular-nums font-semibold transition cursor-pointer"
              >
                Arqueo Ciego [F4]
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAperturaModalOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white tabular-nums font-semibold text-xs rounded-lg shadow-xs flex items-center space-x-2 transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Abrir Nuevo Turno</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. OPERATIONAL KPI METRICS (Wireframe Cards with Dashed Internal Slots) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Ocupación */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50/60 flex flex-col items-center justify-center text-center">
            <span className="tabular-nums text-[10px] uppercase font-bold text-slate-600 tracking-wider">
              [ Slot: Ocupación Garita ]
            </span>
            <div className="text-2xl font-black tabular-nums text-slate-900 mt-1">
              {occupiedSlots} <span className="text-xs tabular-nums font-normal text-slate-500">/ 30</span>
            </div>
            <span className="tabular-nums text-[11px] text-slate-500 mt-0.5">
              {occupancyPercentage}% de capacidad
            </span>
          </div>
          <div>
            <div className="w-full bg-slate-100 rounded h-1.5 overflow-hidden">
              <div
                className="h-full bg-slate-800 transition-all duration-300"
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] tabular-nums text-slate-500 pt-1.5">
              <span>Zona A: {zoneAOccupied}/10</span>
              <span>Zona B: {zoneBOccupied}/10</span>
              <span>Zona C: {zoneCOccupied}/10</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Disponibilidad */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50/60 flex flex-col items-center justify-center text-center">
            <span className="tabular-nums text-[10px] uppercase font-bold text-slate-600 tracking-wider">
              [ Slot: Disponibilidad Inmediata ]
            </span>
            <div className="text-2xl font-black tabular-nums text-slate-900 mt-1">
              {availableSlots} <span className="text-xs tabular-nums font-normal text-slate-500">Libres</span>
            </div>
            <span className="tabular-nums text-[11px] text-slate-500 mt-0.5">
              Entrada y pistas expeditas
            </span>
          </div>
          <p className="text-[11px] tabular-nums text-slate-500 leading-normal text-center">
            Tolerancia de 15 min de gracia activa según tarifario local.
          </p>
        </div>

        {/* Metric 3: Recaudación */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50/60 flex flex-col items-center justify-center text-center">
            <span className="tabular-nums text-[10px] uppercase font-bold text-slate-600 tracking-wider">
              [ Slot: Recaudación Turno ]
            </span>
            <div className="text-2xl font-black tabular-nums text-slate-900 mt-1">
              ${totalShiftRevenue.toLocaleString('es-CL')}
            </div>
            <span className="tabular-nums text-[11px] text-slate-500 mt-0.5">
              Pesos Chilenos (CLP)
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] tabular-nums text-slate-600 px-1">
            <span>Efectivo: ${shiftCashTotal.toLocaleString('es-CL')}</span>
            <span>Digital: ${shiftDigitalTotal.toLocaleString('es-CL')}</span>
          </div>
        </div>

        {/* Metric 4: Alertas */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50/60 flex flex-col items-center justify-center text-center">
            <span className="tabular-nums text-[10px] uppercase font-bold text-slate-600 tracking-wider">
              [ Slot: Alertas de Estadía ]
            </span>
            <div className={`text-2xl font-black tabular-nums mt-1 ${overstayTickets.length > 0 ? 'text-slate-800' : 'text-slate-900'}`}>
              {overstayTickets.length} <span className="text-xs tabular-nums font-normal text-slate-500">&gt; 3 Horas</span>
            </div>
            <span className="tabular-nums text-[11px] text-slate-500 mt-0.5">
              {overstayTickets.length > 0 ? 'Requiere verificación' : 'Sin sobreestadías'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] tabular-nums text-slate-500 px-1">
            <span>Pagados hoy: {paidTickets.length}</span>
            <span>Activos: {activeTickets.length}</span>
          </div>
        </div>
      </div>

      {/* 3. OPERATOR QUICK-ACTION DOCK (Wireframes matching image reference) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="tabular-nums text-xs font-bold text-slate-800 uppercase tracking-wider">
            OPERACIONES & ACCIONES DE GARITA (WIREFRAMES)
          </span>
          <span className="tabular-nums text-xs text-slate-500">
            Atajos de Teclado F1 - F5
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Card 1: Ingreso */}
          <div
            onClick={() => onNavigate('operacion_ingreso')}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-400 transition cursor-pointer shadow-xs group"
          >
            <div className="border border-dashed border-slate-300 rounded-lg h-20 flex flex-col items-center justify-center bg-slate-50/60 group-hover:bg-slate-100/80 transition">
              <Car className="w-5 h-5 text-slate-600 mb-1" />
              <span className="tabular-nums text-[10px] text-slate-500">[ F1 ]</span>
            </div>
            <div className="mt-3 text-center">
              <span className="font-bold text-slate-900 text-xs block">
                Registrar Ingreso
              </span>
              <span className="tabular-nums text-[10px] text-slate-500 block mt-0.5">
                Entrada rápida &lt; 4 seg
              </span>
            </div>
          </div>

          {/* Card 2: Salida POS */}
          <div
            onClick={() => onNavigate('operacion_salida')}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-400 transition cursor-pointer shadow-xs group"
          >
            <div className="border border-dashed border-slate-300 rounded-lg h-20 flex flex-col items-center justify-center bg-slate-50/60 group-hover:bg-slate-100/80 transition">
              <Receipt className="w-5 h-5 text-slate-600 mb-1" />
              <span className="tabular-nums text-[10px] text-slate-500">[ F2 ]</span>
            </div>
            <div className="mt-3 text-center">
              <span className="font-bold text-slate-900 text-xs block">
                Punto de Venta POS
              </span>
              <span className="tabular-nums text-[10px] text-slate-500 block mt-0.5">
                Cálculo tarifa y vuelto
              </span>
            </div>
          </div>

          {/* Card 3: Layout */}
          <div
            onClick={() => onNavigate('operacion_layout')}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-400 transition cursor-pointer shadow-xs group"
          >
            <div className="border border-dashed border-slate-300 rounded-lg h-20 flex flex-col items-center justify-center bg-slate-50/60 group-hover:bg-slate-100/80 transition">
              <MapPin className="w-5 h-5 text-slate-600 mb-1" />
              <span className="tabular-nums text-[10px] text-slate-500">[ F3 ]</span>
            </div>
            <div className="mt-3 text-center">
              <span className="font-bold text-slate-900 text-xs block">
                Plano de 30 Cupos
              </span>
              <span className="tabular-nums text-[10px] text-slate-500 block mt-0.5">
                Matriz en tiempo real
              </span>
            </div>
          </div>

          {/* Card 4: Arqueo */}
          <div
            onClick={() => onNavigate('operacion_cierre')}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-400 transition cursor-pointer shadow-xs group"
          >
            <div className="border border-dashed border-slate-300 rounded-lg h-20 flex flex-col items-center justify-center bg-slate-50/60 group-hover:bg-slate-100/80 transition">
              <Lock className="w-5 h-5 text-slate-600 mb-1" />
              <span className="tabular-nums text-[10px] text-slate-500">[ F4 ]</span>
            </div>
            <div className="mt-3 text-center">
              <span className="font-bold text-slate-900 text-xs block">
                Arqueo Ciego
              </span>
              <span className="tabular-nums text-[10px] text-slate-500 block mt-0.5">
                Cuadratura sin sesgo
              </span>
            </div>
          </div>

          {/* Card 5: Convenios */}
          <div
            onClick={() => onNavigate('operacion_convenios')}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-400 transition cursor-pointer shadow-xs group"
          >
            <div className="border border-dashed border-slate-300 rounded-lg h-20 flex flex-col items-center justify-center bg-slate-50/60 group-hover:bg-slate-100/80 transition">
              <Building2 className="w-5 h-5 text-slate-600 mb-1" />
              <span className="tabular-nums text-[10px] text-slate-500">[ F5 ]</span>
            </div>
            <div className="mt-3 text-center">
              <span className="font-bold text-slate-900 text-xs block">
                Convenios & Flotas
              </span>
              <span className="tabular-nums text-[10px] text-slate-500 block mt-0.5">
                Convenios y tarifas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE 30-SLOT MATRIX (Architectural Wireframe Grid) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="tabular-nums text-xs font-bold text-slate-800 uppercase tracking-wider block">
              MATRIZ DE OCUPACIÓN EN TIEMPO REAL (30 PLAZAS)
            </span>
            <span className="text-[11px] tabular-nums text-slate-500 mt-0.5 block">
              Serrano 447, Iquique · Haga clic en cualquier slot para inspeccionar o gestionar
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs tabular-nums">
            <span className="flex items-center space-x-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded border border-dashed border-slate-400 bg-slate-50" />
              <span>Libre ({availableSlots})</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-800 font-semibold">
              <span className="w-2.5 h-2.5 rounded border border-slate-800 bg-slate-800" />
              <span>Ocupado ({occupiedSlots})</span>
            </span>
            <button
              onClick={() => onNavigate('operacion_layout')}
              className="text-xs tabular-nums text-slate-800 hover:text-black font-semibold flex items-center space-x-1 transition ml-2 border border-slate-300 px-2 py-0.5 rounded"
            >
              <span>Ver plano completo</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 30 Slots Wireframe Grid */}
        <div className="space-y-3">
          {/* Zone A */}
          <div>
            <div className="flex items-center justify-between text-[11px] tabular-nums font-semibold text-slate-600 mb-1.5">
              <span>Zona A (Rotación Rápida · A-01 a A-10)</span>
              <span className="tabular-nums">{zoneAOccupied} / 10 Ocupadas</span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {zoneA.map((slot) => {
                const isOccupied = slot.status === 'ocupado';
                const ticket = activeTickets.find((t) => t.slotCode === slot.code);
                return (
                  <button
                    key={slot.id}
                    onClick={() => {
                      if (isOccupied && ticket) {
                        setSelectedSlotForDrawer(slot);
                      } else {
                        onNavigate('operacion_ingreso');
                      }
                    }}
                    className={`p-2 rounded-lg text-center transition cursor-pointer border flex flex-col items-center justify-center min-h-[56px] ${
                      isOccupied
                        ? 'bg-white border-slate-900 shadow-xs hover:bg-slate-50'
                        : 'border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-400'
                    }`}
                  >
                    <span className="tabular-nums text-xs font-bold text-slate-900 block">
                      {slot.code}
                    </span>
                    {isOccupied && ticket ? (
                      <span className="tabular-nums text-[10px] font-bold text-slate-700 truncate w-full mt-0.5">
                        {ticket.plateNumber}
                      </span>
                    ) : (
                      <span className="tabular-nums text-[9px] text-slate-400 block mt-0.5">
                        [ Libre ]
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zone B */}
          <div>
            <div className="flex items-center justify-between text-[11px] tabular-nums font-semibold text-slate-600 mb-1.5">
              <span>Zona B (Techada Central · B-01 a B-10)</span>
              <span className="tabular-nums">{zoneBOccupied} / 10 Ocupadas</span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {zoneB.map((slot) => {
                const isOccupied = slot.status === 'ocupado';
                const ticket = activeTickets.find((t) => t.slotCode === slot.code);
                return (
                  <button
                    key={slot.id}
                    onClick={() => {
                      if (isOccupied && ticket) {
                        setSelectedSlotForDrawer(slot);
                      } else {
                        onNavigate('operacion_ingreso');
                      }
                    }}
                    className={`p-2 rounded-lg text-center transition cursor-pointer border flex flex-col items-center justify-center min-h-[56px] ${
                      isOccupied
                        ? 'bg-white border-slate-900 shadow-xs hover:bg-slate-50'
                        : 'border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-400'
                    }`}
                  >
                    <span className="tabular-nums text-xs font-bold text-slate-900 block">
                      {slot.code}
                    </span>
                    {isOccupied && ticket ? (
                      <span className="tabular-nums text-[10px] font-bold text-slate-700 truncate w-full mt-0.5">
                        {ticket.plateNumber}
                      </span>
                    ) : (
                      <span className="tabular-nums text-[9px] text-slate-400 block mt-0.5">
                        [ Libre ]
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zone C */}
          <div>
            <div className="flex items-center justify-between text-[11px] tabular-nums font-semibold text-slate-600 mb-1.5">
              <span>Zona C (Convenios & Flotas · C-01 a C-10)</span>
              <span className="tabular-nums">{zoneCOccupied} / 10 Ocupadas</span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {zoneC.map((slot) => {
                const isOccupied = slot.status === 'ocupado';
                const ticket = activeTickets.find((t) => t.slotCode === slot.code);
                return (
                  <button
                    key={slot.id}
                    onClick={() => {
                      if (isOccupied && ticket) {
                        setSelectedSlotForDrawer(slot);
                      } else {
                        onNavigate('operacion_ingreso');
                      }
                    }}
                    className={`p-2 rounded-lg text-center transition cursor-pointer border flex flex-col items-center justify-center min-h-[56px] ${
                      isOccupied
                        ? 'bg-white border-slate-900 shadow-xs hover:bg-slate-50'
                        : 'border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-400'
                    }`}
                  >
                    <span className="tabular-nums text-xs font-bold text-slate-900 block">
                      {slot.code}
                    </span>
                    {isOccupied && ticket ? (
                      <span className="tabular-nums text-[10px] font-bold text-slate-700 truncate w-full mt-0.5">
                        {ticket.plateNumber}
                      </span>
                    ) : (
                      <span className="tabular-nums text-[9px] text-slate-400 block mt-0.5">
                        [ Libre ]
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. ACTIVE VEHICLES MONITOR TABLE (Clean Wireframe Table) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Table Filter Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="tabular-nums text-xs font-bold text-slate-800 uppercase tracking-wider block">
              [ MONITOR DE VEHÍCULOS EN RECINTO: {filteredActiveTickets.length} ACTIVOS ]
            </span>
            <span className="text-xs tabular-nums text-slate-500 block mt-0.5">
              Cálculo de tarifas en tiempo real · Tolerancia de 15 minutos aplicada
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrar patente..."
                className="bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs tabular-nums text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 w-44"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center bg-slate-50 p-0.5 rounded-lg border border-slate-200 text-xs tabular-nums">
              <button
                onClick={() => setActiveVehicleFilter('todos')}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  activeVehicleFilter === 'todos' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveVehicleFilter('zonaA')}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  activeVehicleFilter === 'zonaA' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Zona A
              </button>
              <button
                onClick={() => setActiveVehicleFilter('zonaB')}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  activeVehicleFilter === 'zonaB' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Zona B
              </button>
              <button
                onClick={() => setActiveVehicleFilter('convenio')}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  activeVehicleFilter === 'convenio' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Especial
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredActiveTickets.length === 0 ? (
          <div className="py-12 text-center text-xs tabular-nums text-slate-500">
            {searchFilter ? 'No hay vehículos coincidentes con el filtro' : 'No hay vehículos estacionados actualmente en esta sección'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Patente</th>
                  <th className="py-3 px-4">Plaza</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Entrada</th>
                  <th className="py-3 px-4">Estadía</th>
                  <th className="py-3 px-4 text-right">Tarifa Est.</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActiveTickets.map((ticket) => {
                  const fee = calculateFee(ticket);
                  const entryDate = new Date(ticket.entryTime);
                  const timeFormatted = entryDate.toLocaleTimeString('es-CL', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  });
                  const isLongStay = fee.durationMinutes > 180;

                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50 transition">
                      {/* Plate */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900 tracking-wide">
                            {ticket.plateNumber}
                          </span>
                          {ticket.tariffType === 'especial' && (
                            <span className="text-[10px] text-slate-800 font-bold bg-slate-800 px-1 rounded border border-slate-300">
                              Especial
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 tabular-nums block">
                          #{ticket.ticketCode}
                        </span>
                      </td>

                      {/* Slot */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800">
                          {ticket.slotCode || 'Sin plaza'}
                        </span>
                      </td>

                      {/* Vehicle Type */}
                      <td className="py-3 px-4 text-slate-600">
                        {ticket.vehicleType}
                      </td>

                      {/* Entry Time */}
                      <td className="py-3 px-4 text-slate-600">
                        {timeFormatted}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <Clock className={`w-3.5 h-3.5 ${isLongStay ? 'text-slate-800' : 'text-slate-400'}`} />
                          <span className={`font-semibold ${isLongStay ? 'text-slate-800 font-bold' : 'text-slate-800'}`}>
                            {fee.durationMinutes} min
                          </span>
                          {fee.isGracePeriod && (
                            <span className="text-[10px] text-slate-800 font-bold ml-1">
                              (Gracia)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Accrued Fee */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-slate-900 text-sm">
                          ${fee.totalAmount.toLocaleString('es-CL')}
                        </span>
                        <span className="text-[10px] text-slate-400 block">CLP</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (onSelectTicketForCheckout) {
                              onSelectTicketForCheckout(ticket);
                            }
                            onNavigate('operacion_salida');
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white tabular-nums font-semibold text-xs rounded-lg shadow-xs transition inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Cobrar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. SLOT INSPECTION MODAL (Wireframe Drawing Box) */}
      <AnimatePresence>
        {selectedSlotForDrawer && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setSelectedSlotForDrawer(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white border border-slate-300 rounded-xl shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded border border-slate-800 bg-slate-900 text-white flex items-center justify-center tabular-nums font-bold text-xs">
                    {selectedSlotForDrawer.code}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tabular-nums">[ PLAZA {selectedSlotForDrawer.code} ]</h3>
                    <span className="text-xs text-slate-500 tabular-nums">{selectedSlotForDrawer.zone} · Serrano 447</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSlotForDrawer(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {(() => {
                const ticket = activeTickets.find((t) => t.slotCode === selectedSlotForDrawer.code);
                if (!ticket) {
                  return (
                    <div className="py-4 text-center text-xs tabular-nums text-slate-500 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                      Cupo actualmente disponible
                    </div>
                  );
                }
                const fee = calculateFee(ticket);
                const entryDate = new Date(ticket.entryTime);

                return (
                  <div className="space-y-3 text-xs tabular-nums">
                    <div className="border border-dashed border-slate-300 p-3 rounded-lg bg-slate-50/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Patente Vehículo</span>
                        <span className="text-base font-bold text-slate-900">{ticket.plateNumber}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block uppercase">Tipo</span>
                        <span className="font-semibold text-slate-700">{ticket.vehicleType}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                        <span className="text-[10px] text-slate-500 block">Hora de Entrada</span>
                        <span className="font-semibold text-slate-800">
                          {entryDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                      </div>
                      <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                        <span className="text-[10px] text-slate-500 block">Tiempo Transcurrido</span>
                        <span className="font-semibold text-slate-800">
                          {fee.durationMinutes} minutos
                        </span>
                      </div>
                    </div>

                    <div className="border border-slate-300 p-3 rounded-lg bg-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total a Cobrar</span>
                        <span className="text-lg font-bold text-slate-900">
                          ${fee.totalAmount.toLocaleString('es-CL')} CLP
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (onSelectTicketForCheckout) {
                            onSelectTicketForCheckout(ticket);
                          }
                          onNavigate('operacion_salida');
                          setSelectedSlotForDrawer(null);
                        }}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Cobrar Salida (F2)</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Apertura de Turno */}
      <ModalAperturaTurno
        isOpen={isAperturaModalOpen}
        onClose={() => setIsAperturaModalOpen(false)}
        onConfirm={handleConfirmShiftOpen}
        operatorName={user.name}
      />
    </div>
  );
};
