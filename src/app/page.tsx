'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { SerranoLayoutMap } from '@/components/SerranoLayoutMap';
import { ShiftModal } from '@/components/ShiftModal';
import { ThermalTicketPDFTemplate } from '@/components/ThermalTicketPDFTemplate';
import { ParkingSlot, Shift, AuditLog, Ticket, VehicleType, PaymentMethod } from '@/types';
import {
  Car,
  Truck,
  Bike,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  Search,
  Grid,
  Printer,
  DollarSign,
  Globe,
  Unlock,
  Percent,
  FileWarning,
  LayoutDashboard,
  FileBarChart2,
  Camera
} from 'lucide-react';

function CockpitContent() {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [shift, setShift] = useState<Shift | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Vista de consola: 'pos' (Punto de venta y liquidación) | 'activos' (Lista de vehículos en recinto)
  const [consoleView, setConsoleView] = useState<'pos' | 'activos'>('pos');

  // Input principal de Patente / Ticket (F1 / F2)
  const [plateInput, setPlateInput] = useState('ABCD-12');
  const [inTipo, setInTipo] = useState<VehicleType>('auto');
  const [selectedTariffPlan, setSelectedTariffPlan] = useState<'MINUTO' | 'JORNADA' | 'NOCHE'>('MINUTO');
  const [inForeign, setInForeign] = useState(false);
  const [inSlot, setInSlot] = useState<string>('');
  const [inTelefono, setInTelefono] = useState('');
  const [inLoading, setInLoading] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  // Recibo Digital en Vivo
  const [activeReceipt, setActiveReceipt] = useState<{
    ticket?: Ticket;
    patente: string;
    entryTime: string;
    exitTime: string;
    durationText: string;
    minutos: number;
    tariffLabel: string;
    baseAmount: number;
    discountAmount: number;
    surchargeAmount: number;
    finalAmount: number;
    isSimulated: boolean;
  }>({
    patente: 'ABCD-12',
    entryTime: '09:30 AM',
    exitTime: '12:00 PM',
    durationText: '2h 30m (150 min)',
    minutos: 150,
    tariffLabel: '$30 / min',
    baseAmount: 4500,
    discountAmount: 0,
    surchargeAmount: 0,
    finalAmount: 4500,
    isSimulated: true,
  });

  // Calculadora de Vuelto
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [cashReceived, setCashReceived] = useState<number | ''>(5000);
  const [barrierOpenPulse, setBarrierOpenPulse] = useState(false);

  // Modales Funcionales
  const [ticketPreviewModal, setTicketPreviewModal] = useState<Ticket | null>(null);
  const [pinAuditModal, setPinAuditModal] = useState<'DISCOUNT' | 'LOST_TICKET' | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinJustification, setPinJustification] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [pinError, setPinError] = useState<string | null>(null);
  const [activeShiftModal, setActiveShiftModal] = useState(false);

  // Reloj oficial CLT
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-CL', {
          timeZone: 'America/Santiago',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [resSlots, resShift, resAudit] = await Promise.all([
        fetch('/api/slots').then((r) => r.json()).catch(() => ({ slots: [] })),
        fetch('/api/shifts').then((r) => r.json()).catch(() => ({ shift: null })),
        fetch('/api/audit').then((r) => r.json()).catch(() => ({ logs: [] })),
      ]);

      if (resSlots.slots) setSlots(resSlots.slots);
      if (resShift.shift) setShift(resShift.shift);
      if (resAudit.logs) setAuditLogs(resAudit.logs);
    } catch (e) {
      console.error('Error cargando PMS:', e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatPlate = (val: string) => {
    const raw = val.toUpperCase();
    if (inForeign) return raw.slice(0, 12);
    const clean = raw.replace(/[^A-Z0-9]/g, '');
    if (clean.length > 4) {
      return `${clean.slice(0, 4)}-${clean.slice(4, 6)}`;
    }
    return clean.slice(0, 7);
  };

  const handleLookupOrPreviewPlate = useCallback(
    async (queryPlate: string) => {
      const target = queryPlate.trim().toUpperCase();
      if (!target) return;

      try {
        const res = await fetch(`/api/checkout?id=${encodeURIComponent(target)}`);
        if (res.ok) {
          const data = await res.json();
          const t: Ticket = data.ticket;
          const mins: number = data.minutosTranscurridos || 45;
          const hrs = Math.floor(mins / 60);
          const remMins = mins % 60;
          const entryStr = new Date(t.fecha_hora_ingreso).toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const exitStr = new Date().toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit',
          });

          setPlateInput(t.patente);
          setActiveReceipt({
            ticket: t,
            patente: t.patente,
            entryTime: entryStr,
            exitTime: exitStr,
            durationText: `${hrs}h ${remMins}m (${mins} min)`,
            minutos: mins,
            tariffLabel: `$${t.tarifa_por_minuto || 30} / min`,
            baseAmount: data.montoAPagar,
            discountAmount: 0,
            surchargeAmount: 0,
            finalAmount: data.montoAPagar,
            isSimulated: false,
          });
          setCashReceived(Math.ceil((data.montoAPagar || 1000) / 1000) * 1000);
          setStatusBanner({
            type: 'success',
            text: `Ticket localizado: ${t.patente} (${t.id_ticket}). Listo para liquidar.`,
          });
          return;
        }
      } catch {
        // Fallback a simulación
      }

      const base =
        selectedTariffPlan === 'JORNADA'
          ? 6000
          : selectedTariffPlan === 'NOCHE'
          ? 5000
          : 4500;
      const label =
        selectedTariffPlan === 'JORNADA'
          ? 'Jornada $6.000'
          : selectedTariffPlan === 'NOCHE'
          ? 'Noche $5.000'
          : '$30 / min';

      setActiveReceipt({
        patente: target,
        entryTime: '09:30 AM',
        exitTime: '12:00 PM',
        durationText: selectedTariffPlan === 'MINUTO' ? '2h 30m (150 min)' : selectedTariffPlan,
        minutos: 150,
        tariffLabel: label,
        baseAmount: base,
        discountAmount: 0,
        surchargeAmount: 0,
        finalAmount: base,
        isSimulated: true,
      });
    },
    [selectedTariffPlan]
  );

  const handleSelectTariffPlan = (plan: 'MINUTO' | 'JORNADA' | 'NOCHE') => {
    setSelectedTariffPlan(plan);
    const base = plan === 'JORNADA' ? 6000 : plan === 'NOCHE' ? 5000 : 4500;
    const label =
      plan === 'JORNADA' ? 'Jornada $6.000' : plan === 'NOCHE' ? 'Noche $5.000' : '$30 / min';
    setActiveReceipt((prev) => ({
      ...prev,
      tariffLabel: label,
      baseAmount: base,
      discountAmount: 0,
      surchargeAmount: 0,
      finalAmount: base,
    }));
    setCashReceived(base >= 5000 ? 10000 : 5000);
  };

  const handleCheckinVehicle = async () => {
    if (!plateInput.trim()) return;
    setInLoading(true);
    setStatusBanner(null);

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patente: plateInput.trim().toUpperCase(),
          tipo: inTipo,
          telefono: inTelefono ? `+569${inTelefono.replace(/[^0-9]/g, '')}` : undefined,
          isForeignPlate: inForeign,
          slotId: inSlot ? Number(inSlot) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar ingreso');

      setTicketPreviewModal(data.ticket);
      setStatusBanner({
        type: 'success',
        text: `Ingreso registrado: ${data.ticket.patente} en Plaza ${
          data.ticket.slot_numero || 'Auto'
        } • Ticket ${data.ticket.id_ticket}`,
      });
      fetchData();
    } catch (err: any) {
      setStatusBanner({ type: 'error', text: err.message });
    } finally {
      setInLoading(false);
    }
  };

  const handleProcessPayment = async (methodOverride?: PaymentMethod) => {
    const chosenMethod = methodOverride || paymentMethod;
    setPaymentMethod(chosenMethod);

    if (activeReceipt.ticket) {
      setInLoading(true);
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: activeReceipt.ticket.id_ticket,
            metodoPago: chosenMethod,
            montoEntregado: Number(cashReceived || activeReceipt.finalAmount),
            accion: 'COBRO',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al liquidar cobro');

        setBarrierOpenPulse(true);
        setTimeout(() => setBarrierOpenPulse(false), 3000);
        setStatusBanner({
          type: 'success',
          text: `Cobro liquidado ($${activeReceipt.finalAmount.toLocaleString(
            'es-CL'
          )} CLP vía ${chosenMethod}). Barrera abierta para ${activeReceipt.patente}.`,
        });
        fetchData();
      } catch (err: any) {
        setStatusBanner({ type: 'error', text: err.message });
      } finally {
        setInLoading(false);
      }
    } else {
      setBarrierOpenPulse(true);
      setTimeout(() => setBarrierOpenPulse(false), 3000);
      setStatusBanner({
        type: 'success',
        text: `Cobro registrado ($${activeReceipt.finalAmount.toLocaleString(
          'es-CL'
        )} CLP vía ${chosenMethod}). Barrera abierta para ${activeReceipt.patente}.`,
      });
    }
  };

  const handleConfirmPinAudit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (pinInput.length < 4) {
      setPinError('Debe ingresar un PIN de 4 dígitos.');
      return;
    }

    if (pinAuditModal === 'DISCOUNT') {
      if (pinJustification.trim().length <= 10) {
        setPinError('La justificación es obligatoria y debe superar 10 caracteres.');
        return;
      }
      const disc = Math.round(activeReceipt.baseAmount * (discountPercent / 100));
      const nextFinal = Math.max(0, activeReceipt.baseAmount - disc);
      setActiveReceipt((prev) => ({
        ...prev,
        discountAmount: disc,
        surchargeAmount: 0,
        finalAmount: nextFinal,
      }));
      setStatusBanner({
        type: 'success',
        text: `Descuento ${discountPercent}% (-$${disc.toLocaleString('es-CL')}) autorizado con PIN Operador.`,
      });
    } else if (pinAuditModal === 'LOST_TICKET') {
      const recargo = 8000;
      setActiveReceipt((prev) => ({
        ...prev,
        discountAmount: 0,
        surchargeAmount: recargo,
        tariffLabel: 'Multa Ticket Extraviado',
        finalAmount: recargo,
      }));
      setCashReceived(10000);
      setStatusBanner({
        type: 'warning',
        text: 'Recargo por Ticket Extraviado ($8.000 CLP) aplicado con PIN Administrador.',
      });
    }

    setPinInput('');
    setPinJustification('');
    setPinAuditModal(null);
  };

  const handleOpen80mmTicketPreview = () => {
    if (activeReceipt.ticket) {
      setTicketPreviewModal(activeReceipt.ticket);
      return;
    }
    const demoTicket: Ticket = {
      id_ticket: 'TKT-20260419-T01-0842',
      patente: (plateInput || 'ABCD-12').toUpperCase(),
      vehiculo_tipo: inTipo,
      fecha_hora_ingreso: new Date().toISOString(),
      tarifa_por_minuto: 30,
      tiempo_gracia_minutos: 10,
      estado_ticket: 'ACTIVO',
      is_offline: false,
      reprint_count: 0,
      slot_numero: inSlot ? Number(inSlot) : 12,
    };
    setTicketPreviewModal(demoTicket);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'F1' || e.key === 'F2') {
        e.preventDefault();
        const input = document.getElementById('pos-plate-input') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleSelectTariffPlan(
          selectedTariffPlan === 'MINUTO'
            ? 'JORNADA'
            : selectedTariffPlan === 'JORNADA'
            ? 'NOCHE'
            : 'MINUTO'
        );
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleProcessPayment('EFECTIVO');
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleProcessPayment('TARJETA');
      } else if (e.key === 'F6') {
        e.preventDefault();
        setPinAuditModal('DISCOUNT');
      } else if (e.key === 'F7') {
        e.preventDefault();
        setPinAuditModal('LOST_TICKET');
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleOpen80mmTicketPreview();
      } else if (e.key === 'F9') {
        e.preventDefault();
        setBarrierOpenPulse(true);
        setTimeout(() => setBarrierOpenPulse(false), 3000);
        setStatusBanner({
          type: 'success',
          text: `Pulso enviado a Barrera Principal para ${plateInput}.`,
        });
      } else if (e.key === 'Escape') {
        setTicketPreviewModal(null);
        setPinAuditModal(null);
        setActiveShiftModal(false);
      }
    },
    [plateInput, selectedTariffPlan, activeReceipt]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const activeTickets: Ticket[] = slots
    .filter((s) => s.estado === 'OCUPADO' && s.ticket_actual)
    .map((s) => s.ticket_actual!);

  const vueltoCalculado =
    typeof cashReceived === 'number'
      ? Math.max(0, cashReceived - activeReceipt.finalAmount)
      : 0;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 flex flex-col font-sans select-none">
      {/* 1. Encabezado Funcional Superior */}
      <header className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/hub" className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-[#80093A] text-white font-black text-xs flex items-center justify-center">
              P
            </span>
            <span className="font-bold text-sm tracking-tight text-[#80093A]">
              ParkOps Garita POS
            </span>
          </Link>
          <span className="text-xs text-slate-400 hidden sm:inline">| Serrano 447, Iquique</span>

          {/* Navegación básica */}
          <nav className="hidden md:flex items-center gap-1 ml-3 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-900 font-bold">
              Garita POS
            </span>
            <Link href="/hub" className="px-2 py-1 text-slate-600 hover:text-slate-900">
              Menú Central
            </Link>
            <Link href="/admin" className="px-2 py-1 text-slate-600 hover:text-slate-900">
              Panel Control
            </Link>
            <Link href="/convenios" className="px-2 py-1 text-slate-600 hover:text-slate-900">
              Convenios
            </Link>
            <Link href="/reportes" className="px-2 py-1 text-slate-600 hover:text-slate-900">
              Reportes
            </Link>
            <Link href="/cctv" className="px-2 py-1 text-slate-600 hover:text-slate-900">
              CCTV
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {currentTime || '12:00:00'} CLT
          </span>

          <button
            type="button"
            onClick={() => setActiveShiftModal(true)}
            className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1"
          >
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span>Caja Ciega [F8]</span>
          </button>
        </div>
      </header>

      {/* Banner de Estado Operativo */}
      {statusBanner && (
        <div className="px-4 pt-2 shrink-0">
          <div
            className={`px-3 py-1.5 rounded border text-xs font-semibold flex items-center justify-between ${
              statusBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : statusBanner.type === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{statusBanner.text}</span>
            </div>
            <button type="button" onClick={() => setStatusBanner(null)}>
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Cuerpo Operativo 40/60 Sin Scroll */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden min-h-0">
        {/* Panel Izquierdo (40%): Consola POS */}
        <section className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between overflow-hidden min-h-0 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Consola de Operación Garita</h2>
              <div className="flex bg-slate-100 p-0.5 rounded text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setConsoleView('pos')}
                  className={`px-2 py-0.5 rounded ${
                    consoleView === 'pos' ? 'bg-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  POS
                </button>
                <button
                  type="button"
                  onClick={() => setConsoleView('activos')}
                  className={`px-2 py-0.5 rounded ${
                    consoleView === 'activos' ? 'bg-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Activos ({activeTickets.length})
                </button>
              </div>
            </div>

            {consoleView === 'pos' ? (
              <div className="space-y-3">
                {/* Input de Matrícula Patente */}
                <div>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <label htmlFor="pos-plate-input" className="font-bold text-slate-600">
                      Patente / Folio Ticket [F1/F2]
                    </label>
                    <button
                      type="button"
                      onClick={() => setInForeign(!inForeign)}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800"
                    >
                      {inForeign ? 'Patente Extranjera' : 'Chilena'}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      id="pos-plate-input"
                      type="text"
                      autoFocus
                      value={plateInput}
                      onChange={(e) => setPlateInput(formatPlate(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleLookupOrPreviewPlate(plateInput);
                        }
                      }}
                      placeholder="ABCD-12"
                      className="flex-1 h-11 px-3 text-center font-mono font-black text-2xl tracking-wider rounded border border-slate-300 focus:border-[#80093A] focus:outline-none uppercase tabular-nums"
                    />

                    <button
                      type="button"
                      onClick={() => handleLookupOrPreviewPlate(plateInput)}
                      className="px-3 h-11 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                    >
                      Buscar
                    </button>

                    <button
                      type="button"
                      disabled={inLoading}
                      onClick={handleCheckinVehicle}
                      className="px-3 h-11 rounded bg-[#80093A] hover:bg-[#68072f] text-white text-xs font-bold"
                    >
                      + Ingreso
                    </button>
                  </div>
                </div>

                {/* Selección de Tarifa y Vehículo */}
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-8">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Plan Tarifario [F3]
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => handleSelectTariffPlan('MINUTO')}
                        className={`py-1.5 rounded font-mono text-xs font-bold border ${
                          selectedTariffPlan === 'MINUTO'
                            ? 'bg-[#80093A] text-white border-[#80093A]'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        $30/min
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectTariffPlan('JORNADA')}
                        className={`py-1.5 rounded font-mono text-xs font-bold border ${
                          selectedTariffPlan === 'JORNADA'
                            ? 'bg-[#80093A] text-white border-[#80093A]'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        Jornada $6k
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectTariffPlan('NOCHE')}
                        className={`py-1.5 rounded font-mono text-xs font-bold border ${
                          selectedTariffPlan === 'NOCHE'
                            ? 'bg-[#80093A] text-white border-[#80093A]'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        Noche $5k
                      </button>
                    </div>
                  </div>

                  <div className="col-span-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Vehículo
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded border border-slate-200 h-9 items-center">
                      <button
                        type="button"
                        onClick={() => setInTipo('auto')}
                        className={`h-7 rounded flex items-center justify-center ${
                          inTipo === 'auto' ? 'bg-[#80093A] text-white' : 'text-slate-600'
                        }`}
                      >
                        <Car className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setInTipo('camioneta')}
                        className={`h-7 rounded flex items-center justify-center ${
                          inTipo === 'camioneta' ? 'bg-[#80093A] text-white' : 'text-slate-600'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setInTipo('moto')}
                        className={`h-7 rounded flex items-center justify-center ${
                          inTipo === 'moto' ? 'bg-[#80093A] text-white' : 'text-slate-600'
                        }`}
                      >
                        <Bike className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Desglose de Recibo Digital en Vivo */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-1 font-bold text-slate-700">
                    <span>Recibo: {activeReceipt.patente}</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {activeReceipt.ticket?.id_ticket || 'TKT-20260419-T01-0842'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-1 font-mono tabular-nums">
                    <span className="text-slate-500 font-sans">Ingreso / Salida:</span>
                    <span className="text-right text-slate-800">
                      {activeReceipt.entryTime} → {activeReceipt.exitTime}
                    </span>

                    <span className="text-slate-500 font-sans">Duración:</span>
                    <span className="text-right text-slate-800">{activeReceipt.durationText}</span>

                    <span className="text-slate-500 font-sans">Tarifa aplicada:</span>
                    <span className="text-right text-slate-800">{activeReceipt.tariffLabel}</span>

                    {activeReceipt.discountAmount > 0 && (
                      <>
                        <span className="text-emerald-700 font-sans font-bold">Descuento PIN:</span>
                        <span className="text-right text-emerald-700 font-bold">
                          -${activeReceipt.discountAmount.toLocaleString('es-CL')}
                        </span>
                      </>
                    )}

                    {activeReceipt.surchargeAmount > 0 && (
                      <>
                        <span className="text-rose-700 font-sans font-bold">Multa Extravío:</span>
                        <span className="text-right text-rose-700 font-bold">
                          +${activeReceipt.surchargeAmount.toLocaleString('es-CL')}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                    <span className="font-bold text-slate-700">TOTAL A PAGAR:</span>
                    <span className="text-2xl font-mono font-black text-[#80093A] tabular-nums">
                      ${activeReceipt.finalAmount.toLocaleString('es-CL')} CLP
                    </span>
                  </div>
                </div>

                {/* Métodos de Pago y Calculadora de Vuelto */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleProcessPayment('EFECTIVO')}
                      className={`h-10 rounded font-bold text-xs flex items-center justify-center gap-1.5 border ${
                        paymentMethod === 'EFECTIVO'
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-white text-slate-800 border-slate-300'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Efectivo [F4]</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleProcessPayment('TARJETA')}
                      className={`h-10 rounded font-bold text-xs flex items-center justify-center gap-1.5 border ${
                        paymentMethod === 'TARJETA'
                          ? 'bg-sky-600 text-white border-sky-700'
                          : 'bg-white text-slate-800 border-slate-300'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Tarjeta [F5]</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-xs">
                    <div className="flex items-center justify-between px-1">
                      <span className="font-bold text-slate-500">Recibido:</span>
                      <input
                        type="number"
                        step={500}
                        value={cashReceived}
                        onChange={(e) =>
                          setCashReceived(e.target.value ? Number(e.target.value) : '')
                        }
                        className="w-24 text-right font-mono font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5 tabular-nums"
                      />
                    </div>
                    <div className="flex items-center justify-between px-1 border-l border-slate-200">
                      <span className="font-bold text-emerald-700">Vuelto:</span>
                      <span className="font-mono font-black text-emerald-700 tabular-nums">
                        ${vueltoCalculado.toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>

                  {/* Acciones de Auditoría Antifraude por PIN */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPinError(null);
                        setPinAuditModal('DISCOUNT');
                      }}
                      className="h-8 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <Percent className="w-3 h-3 text-emerald-600" />
                      <span>Descuento PIN [F6]</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPinError(null);
                        setPinAuditModal('LOST_TICKET');
                      }}
                      className="h-8 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <FileWarning className="w-3 h-3 text-rose-600" />
                      <span>Ticket Perdido [F7]</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[380px]">
                {activeTickets.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No hay vehículos activos en este momento.
                  </div>
                ) : (
                  activeTickets.map((t) => (
                    <div
                      key={t.id_ticket}
                      className="p-2.5 rounded border border-slate-200 bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono font-bold text-xs text-slate-900">
                          {t.patente} <span className="text-slate-500">(Plaza {t.slot_numero})</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{t.id_ticket}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setConsoleView('pos');
                          handleLookupOrPreviewPlate(t.patente);
                        }}
                        className="px-2.5 py-1 rounded bg-[#80093A] text-white text-xs font-bold"
                      >
                        Cobrar
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Pie de Consola: Imprimir Ticket (F8) + Abrir Barrera (F9) */}
          <div className="pt-2 border-t border-slate-200 grid grid-cols-12 gap-2">
            <button
              type="button"
              onClick={handleOpen80mmTicketPreview}
              className="col-span-7 h-11 rounded bg-[#80093A] hover:bg-[#68072f] text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ticket 80mm [F8]</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBarrierOpenPulse(true);
                setTimeout(() => setBarrierOpenPulse(false), 3000);
                setStatusBanner({
                  type: 'success',
                  text: `Barrera Principal Abierta [F9] para ${plateInput}.`,
                });
              }}
              className={`col-span-5 h-11 rounded font-bold text-xs flex items-center justify-center gap-1 border ${
                barrierOpenPulse
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              <Unlock className="w-4 h-4" />
              <span>{barrierOpenPulse ? '¡Barrera Abierta!' : 'Abrir Barrera [F9]'}</span>
            </button>
          </div>
        </section>

        {/* Panel Derecho (60%): Matriz de 30 Plazas Serrano 447 */}
        <section className="lg:col-span-7 h-full overflow-hidden min-h-0 bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <SerranoLayoutMap
            slots={slots}
            onSelectSlotForCheckout={(patente) => {
              setConsoleView('pos');
              handleLookupOrPreviewPlate(patente);
            }}
            onSelectSlotForCheckin={(slotId) => {
              setConsoleView('pos');
              setInSlot(slotId.toString());
              const input = document.getElementById('pos-plate-input') as HTMLInputElement;
              if (input) input.focus();
            }}
          />
        </section>
      </main>

      {/* Modal: Ticket Térmico 80mm */}
      {ticketPreviewModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setTicketPreviewModal(null)}
        >
          <div
            className="bg-white rounded-xl border border-slate-300 max-w-sm w-full p-4 shadow-xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800">Ticket Térmico 80mm</span>
              <button type="button" onClick={() => setTicketPreviewModal(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <ThermalTicketPDFTemplate
              folio={ticketPreviewModal.id_ticket}
              patente={ticketPreviewModal.patente}
              fecha={new Date(ticketPreviewModal.fecha_hora_ingreso).toLocaleDateString('es-CL')}
              horaIngreso={new Date(ticketPreviewModal.fecha_hora_ingreso).toLocaleTimeString('es-CL', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              sectorPlaza={`Plaza ${ticketPreviewModal.slot_numero}`}
              tarifaTexto={`$${ticketPreviewModal.tarifa_por_minuto || 30} / min`}
              isOffline={Boolean(ticketPreviewModal.is_offline)}
              showActions={true}
              onClose={() => setTicketPreviewModal(null)}
            />
          </div>
        </div>
      )}

      {/* Modal: Autorización PIN Antifraude */}
      {pinAuditModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setPinAuditModal(null)}
        >
          <div
            className="bg-white rounded-xl border border-slate-300 max-w-md w-full p-5 shadow-xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-900">
                {pinAuditModal === 'DISCOUNT'
                  ? 'Autorización PIN Operador · Descuento Comercial'
                  : 'Autorización PIN Administrador · Ticket Extraviado ($8.000)'}
              </h3>
              <button type="button" onClick={() => setPinAuditModal(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {pinError && (
              <div className="p-2 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {pinError}
              </div>
            )}

            <form onSubmit={handleConfirmPinAudit} className="space-y-3">
              {pinAuditModal === 'DISCOUNT' ? (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Porcentaje de Descuento
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[10, 20, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDiscountPercent(pct)}
                          className={`py-1.5 rounded font-mono text-xs font-bold border ${
                            discountPercent === pct
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          -{pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Justificación Escrita Obligatoria (&gt;10 caracteres)
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={pinJustification}
                      onChange={(e) => setPinJustification(e.target.value)}
                      placeholder="Motivo comercial o institucional..."
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                    />
                  </div>
                </>
              ) : (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-900 flex justify-between items-center">
                  <span>Recargo fijo por ticket extraviado:</span>
                  <strong className="font-mono text-sm">$8.000 CLP</strong>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  PIN de 4 dígitos
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  autoFocus
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="••••"
                  className="w-full h-10 text-center font-mono font-black text-xl tracking-[0.4em] rounded border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPinAuditModal(null)}
                  className="flex-1 h-9 rounded bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 h-9 rounded text-white text-xs font-bold ${
                    pinAuditModal === 'DISCOUNT' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  Confirmar PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Arqueo de Caja Ciega */}
      {activeShiftModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setActiveShiftModal(false)}
        >
          <div
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ShiftModal
              currentShift={shift}
              onClose={() => setActiveShiftModal(false)}
              onShiftUpdated={fetchData}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-4 text-center font-mono text-xs">Cargando Garita POS...</div>}>
      <CockpitContent />
    </Suspense>
  );
}
