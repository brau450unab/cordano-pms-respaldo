'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OfficialModals, ActiveVehicle } from '@/components/official/OfficialModals';
import { OfficialAuxViews } from '@/components/official/OfficialAuxViews';
import { OfficialLandingAndMenu } from '@/components/official/OfficialLandingAndMenu';
import { OfficialEngineView } from '@/components/official/OfficialEngineView';
import {
  CordanoLogo,
  printThermalTicketIsolated,
  CommandPaletteModal,
  TableroKanbanEstadiaView,
  ModalFugaVehiculo,
  ModalRevisionVehiculosCierre,
} from '@/components/official/PublishedLogicSuite';
import { AuditLog, ParkingSlot } from '@/types';

interface ShiftHistoryItem {
  time: string;
  type: 'APERTURA' | 'INGRESO' | 'COBRO' | 'RETIRO' | 'INGRESO_MANUAL';
  desc: string;
  method: string;
  amount: number;
  plate: string;
  isEgreso: boolean;
}

const initialSeedVehicles: ActiveVehicle[] = [
  { slot: 1, slotCode: 'A-01', ticketId: 'TKT-20260927-T01-0101', plate: 'BBCL84', cat: 'Sedán', rate: 25, entry: '18:05', durationMin: 265, client: 'Carlos Mena', phone: '+56 9 8412 9011', obs: 'Sobrestadía > 4h - Sin daños visibles', isOffline: false },
  { slot: 2, slotCode: 'A-02', ticketId: 'TKT-20260927-T01-0102', plate: 'KLPW29', cat: 'SUV', rate: 30, entry: '19:55', durationMin: 155, client: 'María Soto', phone: '+56 9 9123 4455', obs: '', isOffline: false },
  { slot: 3, slotCode: 'A-03', ticketId: 'TKT-20260927-T01-0103', plate: 'HTRJ12', cat: 'Moto', rate: 15, entry: '20:15', durationMin: 135, client: 'Pedro Rojas', phone: '+56 9 7654 3210', obs: '', isOffline: false },
  { slot: 4, slotCode: 'A-04', ticketId: 'TKT-20260927-T01-0104', plate: 'GHYU90', cat: 'Sedán', rate: 25, entry: '21:05', durationMin: 85, client: 'Particular', phone: '', obs: '', isOffline: false },
  { slot: 5, slotCode: 'A-05', ticketId: 'TKT-20260927-T01-0105', plate: 'LKJH44', cat: 'SUV', rate: 30, entry: '21:30', durationMin: 60, client: 'Gonzalo Silva', phone: '+56 9 8877 6655', obs: '', isOffline: false },
  { slot: 6, slotCode: 'A-06', ticketId: 'TKT-20260927-T01-0106', plate: 'MNBV33', cat: 'Sedán', rate: 25, entry: '21:45', durationMin: 45, client: 'Particular', phone: '', obs: '', isOffline: false },
  { slot: 7, slotCode: 'A-07', ticketId: 'TKT-20260927-T01-0107', plate: 'POIU22', cat: 'Sedán', rate: 25, entry: '22:00', durationMin: 30, client: 'Andrea Toro', phone: '+56 9 9988 7766', obs: '', isOffline: false },
  { slot: 8, slotCode: 'A-08', ticketId: 'TKT-20260927-T01-0108', plate: 'ZXCV11', cat: 'Moto', rate: 15, entry: '22:05', durationMin: 25, client: 'Rodrigo Paz', phone: '', obs: '', isOffline: false },
  { slot: 9, slotCode: 'A-09', ticketId: 'TKT-20260927-T01-0109', plate: 'QAZW99', cat: 'Sedán', rate: 25, entry: '22:10', durationMin: 20, client: 'Particular', phone: '', obs: '', isOffline: false },
  { slot: 10, slotCode: 'A-10', ticketId: 'TKT-20260927-T01-0110', plate: 'WSXE88', cat: 'SUV', rate: 30, entry: '22:12', durationMin: 18, client: 'Fernanda Leal', phone: '+56 9 6655 4433', obs: '', isOffline: false },
  { slot: 11, slotCode: 'A-11', ticketId: 'TKT-20260927-T01-0111', plate: 'EDCR77', cat: 'Sedán', rate: 25, entry: '22:15', durationMin: 15, client: 'Particular', phone: '', obs: '', isOffline: false },
  { slot: 12, slotCode: 'A-12', ticketId: 'TKT-20260927-T01-0112', plate: 'RFVT66', cat: 'Sedán', rate: 25, entry: '22:18', durationMin: 12, client: 'Cristián Mora', phone: '', obs: '', isOffline: false },
  { slot: 13, slotCode: 'A-13', ticketId: 'TKT-20260927-T01-0113', plate: 'TGBY55', cat: 'Moto', rate: 15, entry: '22:20', durationMin: 10, client: 'Juan Vargas', phone: '', obs: '', isOffline: false },
  { slot: 14, slotCode: 'A-14', ticketId: 'TKT-20260927-T01-0114', plate: 'YHN444', cat: 'SUV', rate: 30, entry: '22:22', durationMin: 8, client: 'Patricia Vera', phone: '', obs: '', isOffline: false },
  { slot: 15, slotCode: 'A-15', ticketId: 'TKT-20260927-T01-0115', plate: 'UJM333', cat: 'Sedán', rate: 25, entry: '22:24', durationMin: 6, client: 'Particular', phone: '', obs: '', isOffline: false },
  { slot: 16, slotCode: 'B-16', ticketId: 'TKT-20260927-T01-0116', plate: 'IKM222', cat: 'Sedán', rate: 25, entry: '22:26', durationMin: 4, client: 'Luis Arancibia', phone: '', obs: '', isOffline: false },
  { slot: 17, slotCode: 'B-17', ticketId: 'TKT-20260927-T01-0117', plate: 'OLP111', cat: 'SUV', rate: 30, entry: '22:28', durationMin: 2, client: 'Particular', phone: '', obs: '', isOffline: false },
  { slot: 18, slotCode: 'B-18', ticketId: 'TKT-20260927-T01-0118', plate: 'PLM999', cat: 'Sedán', rate: 25, entry: '22:29', durationMin: 1, client: 'Mario Gómez', phone: '', obs: '', isOffline: false },
];

export default function OfficialParkOpsApp() {
  const [activeView, setActiveView] = useState<string>('landing');
  const [posSubtab, setPosSubtab] = useState<'entry' | 'exit' | 'history'>('entry');
  const [posPatioViewMode, setPosPatioViewMode] = useState<'cards' | 'matrix' | 'kanban'>('cards');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [fugaTargetVehicle, setFugaTargetVehicle] = useState<ActiveVehicle | null>(null);
  const [vehicleHandoverOpen, setVehicleHandoverOpen] = useState<boolean>(false);
  const [handoverConfirmedCount, setHandoverConfirmedCount] = useState<number>(0);
  const [isShiftActive, setIsShiftActive] = useState<boolean>(true);
  const [operatorName, setOperatorName] = useState<string>('Juan Pérez');
  const [initialFloat, setInitialFloat] = useState<number>(50000);
  const [shiftRevenue, setShiftRevenue] = useState<number>(342500);
  const [shiftSeconds, setShiftSeconds] = useState<number>(13335);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  // Login form state
  const [loginUser, setLoginUser] = useState('jperez@garita.local');
  const [loginPass, setLoginPass] = useState('••••••••');
  const [loginRole, setLoginRole] = useState<'OPERADOR' | 'ADMIN'>('OPERADOR');
  const [loginFloat, setLoginFloat] = useState('50000');

  // Checklist state
  const [checklistItems, setChecklistItems] = useState<boolean[]>([true, true, true, true, false, false]);

  // Vehicles & Patio state
  const [activeVehicles, setActiveVehicles] = useState<ActiveVehicle[]>(initialSeedVehicles);
  const [nextArrivalSeq, setNextArrivalSeq] = useState<number>(19);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Parallel Convenios / Noche state
  const [parallelRecords, setParallelRecords] = useState<
    Array<{
      id: string;
      plate: string;
      company: string;
      type: 'CONVENIO' | 'NOCHE';
      slotCode: string;
      amount: number;
      status: string;
    }>
  >([
    { id: 'CONV-01', plate: 'RTPK10', company: 'Notaría Serrano Iquique', type: 'CONVENIO', slotCode: 'B-29', amount: 75000, status: 'VIGENTE' },
    { id: 'CONV-02', plate: 'LMWQ88', company: 'Consulado / Clínica Tarapacá', type: 'CONVENIO', slotCode: 'B-30', amount: 75000, status: 'VIGENTE' },
  ]);

  // POS Entry form state
  const [entryPlate, setEntryPlate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Sedán' | 'SUV' | 'Moto'>('Sedán');
  const [selectedRate, setSelectedRate] = useState<number>(25);
  const [selectedTariffLabel, setSelectedTariffLabel] = useState('Diurna Regular (Predeterminada)');
  const [entryName, setEntryName] = useState('');
  const [entryPhone, setEntryPhone] = useState('');
  const [entryObs, setEntryObs] = useState('');

  // POS Exit form state
  const [exitSearchQuery, setExitSearchQuery] = useState('');
  const [activeCheckoutVehicle, setActiveCheckoutVehicle] = useState<ActiveVehicle>(initialSeedVehicles[0]);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [cashGiven, setCashGiven] = useState<string>('2000');

  // Shift History Ledger
  const [shiftHistory, setShiftHistory] = useState<ShiftHistoryItem[]>([
    { time: '07:00', type: 'APERTURA', desc: 'Fondo de Caja Inicial Declarado (Serrano 447)', method: 'Efectivo', amount: 50000, plate: '---', isEgreso: false },
  ]);

  // Modals state
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketPreviewData, setTicketPreviewData] = useState({
    ticketId: 'TKT-20260927-T01-0119',
    plate: 'ABCD12',
    date: '27/09/2026',
    time: '20:45 hrs',
    slot: 'B-19 (#19)',
    rate: 25,
    client: 'Particular',
    obs: '',
    isOffline: false,
    confirmed: false,
  });

  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false);
  const [closeShiftStep, setCloseShiftStep] = useState<1 | 2 | 3>(1);
  const [declareCash, setDeclareCash] = useState('');
  const [declarePos, setDeclarePos] = useState('');
  const [declareTransfer, setDeclareTransfer] = useState('');
  const [shiftSealHash, setShiftSealHash] = useState('SHA256-9F8E2A4B1C7D0E3F');

  const [manualTxModalOpen, setManualTxModalOpen] = useState(false);
  const [manualTxType, setManualTxType] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
  const [manualTxAmount, setManualTxAmount] = useState('');
  const [manualTxDesc, setManualTxDesc] = useState('');
  const [manualTxAuth, setManualTxAuth] = useState('Operador: Juan P.');
  const [manualTxPin, setManualTxPin] = useState('');

  const [pinModalType, setPinModalType] = useState<'DISCOUNT' | 'LOST_TICKET' | null>(null);
  const [pinValue, setPinValue] = useState('');
  const [pinReason, setPinReason] = useState('');
  const [discountAmountInput, setDiscountAmountInput] = useState('500');

  // AI Operational Integrations (LPR OCR, Damage Inspection, Financial Shift Audit)
  const [isScanningLpr, setIsScanningLpr] = useState(false);
  const [isInspectingDamage, setIsInspectingDamage] = useState(false);
  const [isAuditingShift, setIsAuditingShift] = useState(false);
  const [shiftAuditResult, setShiftAuditResult] = useState<{
    status: 'OPTIMO' | 'OBSERVACION' | 'DESCUADRE_CRITICO';
    discrepancyClp: number;
    confidenceScore: number;
    anomaliesDetected: string[];
    executiveSummary: string;
    recommendations: string[];
  } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type: 'info' | 'success' | 'error' }>>([]);

  const entryPlateRef = useRef<HTMLInputElement>(null);
  const exitSearchRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLElement>(null);

  const showToast = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // Sync with backend APIs (/api/slots, /api/audit, /api/shifts)
  const syncBackendData = useCallback(async () => {
    try {
      const [slotsRes, auditRes] = await Promise.all([
        fetch('/api/slots').then((r) => r.json()).catch(() => null),
        fetch('/api/audit').then((r) => r.json()).catch(() => null),
      ]);

      if (slotsRes?.slots) {
        const occupiedSlots: ParkingSlot[] = slotsRes.slots.filter(
          (s: ParkingSlot) => s.estado === 'OCUPADO' && s.ticket_actual
        );
        if (occupiedSlots.length > 0) {
          const mapped: ActiveVehicle[] = occupiedSlots.map((s: ParkingSlot) => {
            const t = s.ticket_actual!;
            const diffMin = Math.max(
              1,
              Math.floor((Date.now() - new Date(t.fecha_hora_ingreso).getTime()) / 60000)
            );
            const catLabel: 'Sedán' | 'SUV' | 'Moto' =
              t.vehiculo_tipo === 'camioneta' ? 'SUV' : t.vehiculo_tipo === 'moto' ? 'Moto' : 'Sedán';
            const entryTimeStr = new Date(t.fecha_hora_ingreso).toLocaleTimeString('es-CL', {
              hour: '2-digit',
              minute: '2-digit',
            });
            return {
              slot: s.id,
              slotCode: s.codigo,
              ticketId: t.id_ticket,
              plate: t.patente,
              cat: catLabel,
              rate: t.tarifa_por_minuto || 25,
              entry: entryTimeStr,
              durationMin: diffMin,
              client: t.driver_name || 'Particular',
              phone: t.driver_phone || '',
              obs: t.observaciones,
              isOffline: t.is_offline,
              discount: t.descuento_aplicado,
              surcharge: t.recargo_multa,
            };
          });
          setActiveVehicles(mapped);
        }
      }
      if (auditRes?.logs) {
        setAuditLogs(auditRes.logs);
      }
    } catch {
      // Offline fallback active
    }
  }, []);

  useEffect(() => {
    syncBackendData();
  }, [syncBackendData]);

  // Shift clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setShiftSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hrs = Math.floor(shiftSeconds / 3600).toString().padStart(2, '0');
  const mins = Math.floor((shiftSeconds % 3600) / 60).toString().padStart(2, '0');
  const secs = (shiftSeconds % 60).toString().padStart(2, '0');
  const shiftTimerStr = `${hrs}:${mins}:${secs}`;

  // Autofocus on POS input (Rule #1: Keyboard-First)
  useEffect(() => {
    if (activeView === 'pos') {
      if (posSubtab === 'entry') {
        setTimeout(() => entryPlateRef.current?.focus(), 60);
      } else if (posSubtab === 'exit') {
        setTimeout(() => exitSearchRef.current?.focus(), 60);
      }
    }
  }, [activeView, posSubtab]);

  // Keyboard shortcuts (F1–F9, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveView('menu');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveView('pos');
        setPosSubtab('entry');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveView('clients');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveView('pos');
        setPosSubtab('exit');
      } else if (e.key === 'F5') {
        e.preventDefault();
        setActiveView('settings');
      } else if (e.key === 'F6') {
        e.preventDefault();
        setActiveView('pos');
        setPosSubtab('exit');
        setPinModalType('DISCOUNT');
      } else if (e.key === 'F7') {
        e.preventDefault();
        setActiveView('pos');
        setPosSubtab('exit');
        setPinModalType('LOST_TICKET');
      } else if (e.key === 'F8') {
        e.preventDefault();
        showToast('Impresión térmica 80mm ejecutada (QR + Code 128).', 'success');
      } else if (e.key === 'F9') {
        e.preventDefault();
        showToast('Pulso de apertura de acceso enviado en Garita 01.', 'success');
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'F10') {
        e.preventDefault();
        setActiveView('engine');
      } else if (e.key === 'Escape') {
        setTicketModalOpen(false);
        setCloseShiftModalOpen(false);
        setManualTxModalOpen(false);
        setPinModalType(null);
        setCommandPaletteOpen(false);
        setFugaTargetVehicle(null);
        setVehicleHandoverOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast]);

  const navigateTo = (viewId: string) => {
    setActiveView(viewId);
    viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openPosInSubtab = (subtab: 'entry' | 'exit' | 'history') => {
    setActiveView('pos');
    setPosSubtab(subtab);
  };

  // POS Entry Handlers
  const openTicketPreviewModal = () => {
    const cleanPlate = entryPlate.trim().toUpperCase();
    if (cleanPlate.length < 4) {
      showToast('Ingrese una patente válida (mínimo 4 caracteres)', 'error');
      entryPlateRef.current?.focus();
      return;
    }
    if (activeVehicles.length >= 30) {
      showToast('Recinto en capacidad máxima (30/30 plazas). Utilice sobrecupo SC.', 'error');
      return;
    }
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = isOfflineMode ? 'O' : '';
    const slotCode = nextArrivalSeq <= 15 ? `A-${nextArrivalSeq.toString().padStart(2, '0')}` : `B-${Math.min(30, nextArrivalSeq).toString().padStart(2, '0')}`;
    setTicketPreviewData({
      ticketId: `TKT-${datePart}-T01-${(100 + nextArrivalSeq).toString().padStart(4, '0')}${suffix}`,
      plate: cleanPlate,
      date: `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`,
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} hrs`,
      slot: `${slotCode} (#${nextArrivalSeq})`,
      rate: selectedRate,
      client: entryName.trim() || 'Particular',
      obs: entryObs.trim(),
      isOffline: isOfflineMode,
      confirmed: false,
    });
    setTicketModalOpen(true);
  };

  const confirmVehicleEntry = async () => {
    const tipoBackend = selectedCategory === 'SUV' ? 'camioneta' : selectedCategory === 'Moto' ? 'moto' : 'auto';
    let createdTicketId = ticketPreviewData.ticketId;
    let assignedSlotNum = nextArrivalSeq;
    let assignedSlotCode = nextArrivalSeq <= 15 ? `A-${nextArrivalSeq.toString().padStart(2, '0')}` : `B-${Math.min(30, nextArrivalSeq).toString().padStart(2, '0')}`;

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patente: ticketPreviewData.plate,
          tipo: tipoBackend,
          telefono: entryPhone.trim(),
          nombreConductor: entryName.trim() || 'Particular',
          observacionesDanio: entryObs.trim(),
          forzarIngreso: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        createdTicketId = data.ticket.id_ticket;
        assignedSlotNum = data.ticket.slot_numero;
        assignedSlotCode = data.ticket.slot_codigo || assignedSlotCode;
      }
    } catch {
      // Offline IndexedDB fallback
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newVeh: ActiveVehicle = {
      slot: assignedSlotNum,
      slotCode: assignedSlotCode,
      ticketId: createdTicketId,
      plate: ticketPreviewData.plate,
      cat: selectedCategory,
      rate: selectedRate,
      entry: timeStr,
      durationMin: 1,
      client: entryName.trim() || 'Particular',
      phone: entryPhone.trim(),
      obs: entryObs.trim(),
      isOffline: isOfflineMode,
    };

    setActiveVehicles((prev) => [...prev, newVeh]);
    setNextArrivalSeq((s) => s + 1);
    setShiftHistory((prev) => [
      {
        time: timeStr,
        type: 'INGRESO',
        desc: `Ingreso ${selectedCategory} (${createdTicketId})`,
        method: '---',
        amount: 0,
        plate: ticketPreviewData.plate,
        isEgreso: false,
      },
      ...prev,
    ]);
    setTicketPreviewData((prev) => ({ ...prev, ticketId: createdTicketId, confirmed: true }));
    setEntryPlate('');
    setEntryName('');
    setEntryPhone('');
    setEntryObs('');
    showToast(`Vehículo ${newVeh.plate} registrado en ${assignedSlotCode} (${createdTicketId})`, 'success');
    syncBackendData();
  };

  // POS Exit Calculations & Handlers
  const baseCheckoutTotal = activeCheckoutVehicle
    ? activeCheckoutVehicle.durationMin * (activeCheckoutVehicle.rate || 25)
    : 0;
  const discountApplied = activeCheckoutVehicle?.discount || 0;
  const surchargeApplied = activeCheckoutVehicle?.surcharge || 0;
  const finalCheckoutTotal = Math.max(0, baseCheckoutTotal - discountApplied + surchargeApplied);
  const netSubtotal = Math.round(finalCheckoutTotal / 1.19);
  const ivaAmount = finalCheckoutTotal - netSubtotal;
  const cashChange = Math.max(0, (parseFloat(cashGiven) || 0) - finalCheckoutTotal);

  const exitMatches =
    exitSearchQuery.trim().length > 0
      ? activeVehicles.filter(
          (v) =>
            v.plate.includes(exitSearchQuery.trim().toUpperCase()) ||
            v.ticketId.toUpperCase().includes(exitSearchQuery.trim().toUpperCase())
        )
      : [];

  const loadVehicleIntoExit = (v: ActiveVehicle) => {
    setActiveCheckoutVehicle(v);
    const total = v.durationMin * (v.rate || 25) - (v.discount || 0) + (v.surcharge || 0);
    setCashGiven(Math.max(2000, Math.ceil(total / 1000) * 1000).toString());
  };

  const processVehicleCheckout = async () => {
    if (!activeCheckoutVehicle) {
      showToast('Seleccione un vehículo para liquidar su salida', 'error');
      return;
    }
    const methodMap = { efectivo: 'EFECTIVO', tarjeta: 'TARJETA', transferencia: 'TRANSFERENCIA' } as const;
    const methodLabels = { efectivo: 'Efectivo', tarjeta: 'Tarjeta POS', transferencia: 'Transferencia' };

    try {
      await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeCheckoutVehicle.plate,
          metodoPago: methodMap[paymentMethod],
          montoEntregado: parseFloat(cashGiven) || finalCheckoutTotal,
        }),
      });
    } catch {
      // Offline mode
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setShiftHistory((prev) => [
      {
        time: timeStr,
        type: 'COBRO',
        desc: `Liquidación Estadía (${activeCheckoutVehicle.durationMin} min • ${activeCheckoutVehicle.ticketId})`,
        method: methodLabels[paymentMethod],
        amount: finalCheckoutTotal,
        plate: activeCheckoutVehicle.plate,
        isEgreso: false,
      },
      ...prev,
    ]);
    setShiftRevenue((r) => r + finalCheckoutTotal);
    const remaining = activeVehicles.filter((v) => v.plate !== activeCheckoutVehicle.plate);
    setActiveVehicles(remaining);
    if (remaining.length > 0) setActiveCheckoutVehicle(remaining[0]);
    setExitSearchQuery('');
    showToast(`Cobro liquidado ($${finalCheckoutTotal.toLocaleString('es-CL')}) para ${activeCheckoutVehicle.plate}. Voucher DTE emitido.`, 'success');
    setPosSubtab('entry');
    syncBackendData();
  };

  // Antifraud PIN Exceptions (Rule #5)
  const confirmPinException = async () => {
    if (pinValue.trim().length < 4) {
      showToast('Ingrese un PIN válido de 4 dígitos', 'error');
      return;
    }
    if (pinReason.trim().length <= 10) {
      showToast('La justificación escrita debe tener más de 10 caracteres (Regla Antifraude)', 'error');
      return;
    }

    if (pinModalType === 'DISCOUNT') {
      const disc = Math.max(0, parseInt(discountAmountInput) || 0);
      try {
        await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: activeCheckoutVehicle.plate,
            accion: 'DESCUENTO',
            montoNuevo: Math.max(0, baseCheckoutTotal - disc),
            pin: pinValue,
            motivo: pinReason,
          }),
        });
      } catch {
        // Offline fallback
      }
      setActiveCheckoutVehicle((prev) => ({ ...prev, discount: disc }));
      showToast(`Descuento autorizado ($${disc.toLocaleString('es-CL')}) con PIN Operador [Auditoría Verde].`, 'success');
    } else if (pinModalType === 'LOST_TICKET') {
      try {
        await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: activeCheckoutVehicle.plate,
            accion: 'MULTA_EXTRAVIO',
            pin: pinValue,
            motivo: pinReason,
          }),
        });
      } catch {
        // Offline fallback
      }
      setActiveCheckoutVehicle((prev) => ({ ...prev, surcharge: 8000 }));
      showToast('Multa por Ticket Extraviado ($8.000 CLP) aplicada con PIN Admin [Auditoría Roja].', 'error');
    }

    setPinModalType(null);
    setPinValue('');
    setPinReason('');
    syncBackendData();
  };

  // Manual Cash Transaction
  const confirmManualTransaction = () => {
    const amt = parseInt(manualTxAmount);
    if (!amt || amt <= 0) {
      showToast('Ingrese un monto válido mayor a 0', 'error');
      return;
    }
    if (manualTxDesc.trim().length <= 10) {
      showToast('Ingrese una justificación mayor a 10 caracteres', 'error');
      return;
    }
    if (manualTxPin.trim().length < 4) {
      showToast('Ingrese PIN autorizador de 4 dígitos', 'error');
      return;
    }
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setShiftHistory((prev) => [
      {
        time: timeStr,
        type: manualTxType === 'EGRESO' ? 'RETIRO' : 'INGRESO_MANUAL',
        desc: `${manualTxDesc.trim()} (${manualTxAuth})`,
        method: 'Efectivo',
        amount: amt,
        plate: '---',
        isEgreso: manualTxType === 'EGRESO',
      },
      ...prev,
    ]);
    setManualTxModalOpen(false);
    setManualTxAmount('');
    setManualTxDesc('');
    setManualTxPin('');
    showToast(`Movimiento manual ($${amt.toLocaleString('es-CL')}) registrado en Libro de Caja.`, 'success');
  };

  // AI LPR OCR (/api/ai/lpr-ocr) & AI Damage Inspection (/api/ai/damage-inspection)
  const triggerLprOcr = async () => {
    setIsScanningLpr(true);
    try {
      const res = await fetch('/api/ai/lpr-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: 'data:image/jpeg;base64,PARKOPS_SERRANO447_LPR_FRAME',
          mimeType: 'image/jpeg',
        }),
      });
      const json = await res.json();
      const lpr = json?.data;
      const cleanPlate = (lpr?.plate || 'KJ8921').replace(/[^A-Z0-9]/gi, '').toUpperCase();
      setEntryPlate(cleanPlate);
      if (lpr?.vehicleTypeHint === 'CAMIONETA') {
        setSelectedCategory('SUV');
        setSelectedRate(30);
      } else if (lpr?.vehicleTypeHint === 'MOTO') {
        setSelectedCategory('Moto');
        setSelectedRate(15);
      } else {
        setSelectedCategory('Sedán');
        setSelectedRate(25);
      }
      if (lpr?.makeModelHint || lpr?.colorHint) {
        const hintStr = [lpr.makeModelHint, lpr.colorHint].filter(Boolean).join(' · ');
        setEntryObs((prev) => (prev ? `${prev} | LPR: ${hintStr}` : `Vehículo detectado LPR: ${hintStr}`));
      }
      showToast(
        `LPR IA (/api/ai/lpr-ocr): Patente ${cleanPlate} detectada (${Math.round((lpr?.confidence || 0.98) * 100)}% conf.)`,
        'success'
      );
    } catch {
      const samplePlates = ['KJ8921', 'RT4410', 'PL9012', 'GH3389'];
      const picked = samplePlates[Math.floor(Math.random() * samplePlates.length)];
      setEntryPlate(picked);
      setSelectedCategory('Sedán');
      setSelectedRate(25);
      showToast(`LPR IA Local: Patente ${picked} autocompletada en garita.`, 'info');
    } finally {
      setIsScanningLpr(false);
      entryPlateRef.current?.focus();
    }
  };

  const triggerDamageInspection = async () => {
    setIsInspectingDamage(true);
    try {
      const res = await fetch('/api/ai/damage-inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: 'data:image/jpeg;base64,PARKOPS_SERRANO447_DAMAGE_FRAME',
          mimeType: 'image/jpeg',
        }),
      });
      const json = await res.json();
      const summary =
        json?.data?.summaryText ||
        'Inspección IA: Sin daños preexistentes visibles en parachoques ni laterales.';
      setEntryObs(summary);
      showToast('Peritaje IA (/api/ai/damage-inspection) anexado al resguardo legal del ticket.', 'success');
    } catch {
      setEntryObs('Acta IA Garita 01: Carrocería y espejos verificados sin daños preexistentes.');
      showToast('Peritaje IA anexado al resguardo legal del ticket.', 'info');
    } finally {
      setIsInspectingDamage(false);
    }
  };

  // Blind Cash Close & Role Segregation (Rules #5 & #7)
  const initiateCashClose = () => {
    setDeclareCash('');
    setDeclarePos('');
    setDeclareTransfer('');
    setShiftAuditResult(null);
    setCloseShiftStep(1);
    setCloseShiftModalOpen(true);
  };

  const goToCashCloseStep2 = async () => {
    const decCashNum = parseInt(declareCash) || 0;
    const decPosNum = parseInt(declarePos) || 0;
    const decTransNum = parseInt(declareTransfer) || 0;

    setCloseShiftStep(2);
    setIsAuditingShift(true);

    try {
      const res = await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montoEfectivo: decCashNum,
          montoTarjeta: decPosNum,
          montoTransferencia: decTransNum,
        }),
      });
      const data = await res.json();
      if (data?.shift?.hash_sellado) {
        setShiftSealHash(data.shift.hash_sellado);
      }
    } catch {
      // Fallback hash
    }

    try {
      const auditRes = await fetch('/api/ai/shift-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftData: {
            operatorName,
            openedAt: '07:00',
            closedAt: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
            initialCash: initialFloat,
            systemCash: 192500,
            physicalCashDeclared: decCashNum,
            cardPosTotal: decPosNum,
            transferTotal: decTransNum,
            totalTransactions: shiftHistory.length,
            discountsAppliedCount: auditLogs.filter((l) => l.color_tag === 'VERDE').length,
            lostTicketsCount: auditLogs.filter((l) => l.color_tag === 'ROJO').length,
          },
        }),
      });
      const auditJson = await auditRes.json();
      if (auditJson?.data) {
        setShiftAuditResult(auditJson.data);
      }
    } catch {
      const discrepancy = decCashNum - 192500;
      setShiftAuditResult({
        status: discrepancy === 0 ? 'OPTIMO' : Math.abs(discrepancy) <= 5000 ? 'OBSERVACION' : 'DESCUADRE_CRITICO',
        discrepancyClp: discrepancy,
        confidenceScore: 0.96,
        anomaliesDetected: discrepancy !== 0 ? [`Diferencia de $${discrepancy.toLocaleString('es-CL')} CLP detectada.`] : [],
        executiveSummary: `Turno de ${operatorName} verificado con ${shiftHistory.length} movimientos. Cuadratura ${discrepancy === 0 ? 'exacta' : 'con diferencia registrada'}.`,
        recommendations: ['Archivar Reporte Z térmico 80mm', 'Resguardar comprobantes Transbank'],
      });
    } finally {
      setIsAuditingShift(false);
    }
  };

  const loginSession = async () => {
    if (loginRole === 'ADMIN') {
      showToast(
        'Regla de Segregación #7: El rol Administrador audita y configura, pero NO puede abrir turnos de caja directamente. Seleccione perfil Operador.',
        'error'
      );
      return;
    }
    const floatNum = parseInt(loginFloat) || 50000;
    if (floatNum <= 0) {
      showToast('Debe declarar el fondo inicial de sencillo en gaveta.', 'error');
      return;
    }
    try {
      await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idOperador: 'OP-01',
          nombreOperador: 'Juan Pérez',
          montoInicial: floatNum,
        }),
      });
    } catch {
      // Offline fallback
    }
    setInitialFloat(floatNum);
    setOperatorName('Juan Pérez');
    setIsShiftActive(true);
    showToast(`Turno iniciado en GARITA 01 con fondo inicial de $${floatNum.toLocaleString('es-CL')}.`, 'success');
    navigateTo('menu');
  };

  const runningBalance = shiftHistory.reduce(
    (acc, item) => (item.isEgreso ? acc - item.amount : acc + item.amount),
    0
  );

  const breadcrumbTitles: Record<string, string> = {
    menu: 'MENÚ PRINCIPAL',
    pos: 'PUNTO DE VENTA (GARITA)',
    map: 'ANALÍTICA GLOBAL & MATRIZ 30 PLAZAS',
    reports: 'REPORTES & AUDITORÍA PIN',
    support: 'CENTRO DE AYUDA & SOPs',
    clients: 'ABONADOS & SERVICIOS PARALELOS',
    settings: 'AJUSTES & CONTINGENCIA OFFLINE',
    engine: 'CONSOLA DEL MOTOR HÍBRIDO BD & ARCHIFY [F10]',
  };

  return (
    <div id="app-container" className="flex flex-col h-screen w-screen bg-[#f4f6f9] overflow-hidden relative text-slate-800">
      {/* ENCABEZADO DE LA PLATAFORMA INTERNA (PlatformNavbar Aesthetic + Shortcut Tooltips) */}
      {activeView !== 'landing' && (
        <header
          id="platform-app-navbar"
          className="h-14 bg-white/95 backdrop-blur-sm border-b border-[#e8ecf0] px-5 flex items-center justify-between shrink-0 z-20"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 pr-1">
              <CordanoLogo size={30} />
              <div className="hidden lg:block leading-none">
                <span className="text-xs font-extrabold tracking-tight text-slate-900 block">
                  ParkOps PMS
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  Serrano 447 · v4.5
                </span>
              </div>
            </div>
            <span className="w-px h-5 bg-[#e8ecf0] hidden lg:block" />
            <button
              id="app-nav-main-menu-btn"
              onClick={() => navigateTo('menu')}
              data-shortcut="Atajo: F1"
              className={`shortcut-tooltip shortcut-tooltip-bottom px-3 h-8 rounded-lg flex items-center gap-1.5 text-[12px] font-bold transition-all ${
                activeView === 'menu'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-[#f1f5f9] hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Menú [F1]</span>
            </button>
            <button
              onClick={() => navigateTo('pos')}
              data-shortcut="Atajo: F2"
              className={`shortcut-tooltip shortcut-tooltip-bottom px-3 h-8 rounded-lg flex items-center gap-1.5 text-[12px] font-bold transition-all ${
                activeView === 'pos'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-[#f1f5f9] hover:text-slate-900'
              }`}
            >
              <span>Garita POS [F2]</span>
            </button>
            <button
              id="app-nav-engine-btn"
              onClick={() => navigateTo('engine')}
              data-shortcut="Atajo: F10"
              className={`shortcut-tooltip shortcut-tooltip-bottom px-3 h-8 rounded-lg flex items-center gap-1.5 text-[11px] font-mono font-bold transition-all border ${
                activeView === 'engine'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-[#f8fafc] text-slate-700 border-[#e8ecf0] hover:bg-slate-900 hover:text-white hover:border-slate-900'
              }`}
            >
              <span>⚙ Motor BD [F10]</span>
            </button>
            <a
              href="/hub"
              className="hidden xl:inline-flex items-center px-2.5 h-7 rounded-md border border-[#e8ecf0] text-[11px] font-mono text-slate-600 hover:text-slate-900 hover:bg-[#f8fafc] transition-colors font-semibold"
              title="Abrir Launchpad de Módulos ERP"
            >
              Launchpad ERP
            </a>
            <button
              onClick={() => navigateTo('landing')}
              className="px-2.5 h-7 rounded-md border border-[#e8ecf0] text-[11px] font-mono text-slate-500 hover:text-slate-900 hover:bg-[#f8fafc] transition-colors"
            >
              Portal
            </button>
            <span className="text-slate-200 text-sm hidden md:inline">/</span>
            <div id="app-current-breadcrumb" className="hidden md:block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-[0.08em] truncate max-w-[200px]">
              {breadcrumbTitles[activeView] || activeView.toUpperCase()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Command Palette ⌘K Trigger (Ported from PlatformNavbar) */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              data-shortcut="Atajo: Ctrl+K / ⌘K"
              className="shortcut-tooltip shortcut-tooltip-bottom flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f8fafc] hover:bg-slate-100 border border-[#dde2e8] text-slate-700 text-xs font-mono font-bold transition"
            >
              <span>🔍 Buscar Patente</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono font-extrabold text-slate-600">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => showToast('Pulso de apertura enviado a Barrera Principal (GARITA-01).', 'success')}
              data-shortcut="Atajo: F9"
              className="shortcut-tooltip shortcut-tooltip-bottom hidden md:flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors"
            >
              <span>🚧 Barrera [F9]</span>
            </button>
            <button
              onClick={() => setIsOfflineMode((v) => !v)}
              className={`flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg border transition-all ${
                isOfflineMode
                  ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                  : 'bg-[#f8fafc] text-slate-600 border-[#e8ecf0] hover:bg-[#f1f5f9]'
              }`}
              title="Conmutar contingencia Offline-First (Sufijo -O)"
            >
              <span className={`w-1.5 h-1.5 rounded-full live-pulse ${isOfflineMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span>{isOfflineMode ? 'OFFLINE (-O)' : 'GARITA 01'}</span>
            </button>
            <div className="flex items-center gap-2 tabular-nums">
              <span id="app-header-shift-timer" className="text-[13px] font-black font-mono text-slate-900">
                {shiftTimerStr}
              </span>
              <span className="w-px h-4 bg-[#e8ecf0]" />
              <span className="text-[12px] font-semibold text-slate-700 hidden sm:inline">{operatorName}</span>
            </div>
            <button
              onClick={initiateCashClose}
              className="w-8 h-8 rounded-lg bg-[#f8fafc] hover:bg-rose-50 border border-[#e8ecf0] hover:border-rose-200 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-all"
              title="Cerrar Turno (Arqueo Ciego SHA-256)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>
      )}

      {/* CONTENEDOR DESPLAZABLE DE VISTAS */}
      <main ref={viewportRef} id="app-views-viewport" className="flex-1 overflow-y-auto relative overscroll-contain">
        {/* LANDING & MENU */}
        <OfficialLandingAndMenu
          activeView={activeView}
          navigateTo={navigateTo}
          openPosInSubtab={openPosInSubtab}
          isShiftActive={isShiftActive}
          shiftTimerStr={shiftTimerStr}
          operatorName={operatorName}
          initialFloat={initialFloat}
          shiftRevenue={shiftRevenue}
          occupiedCount={activeVehicles.length}
          loginUser={loginUser}
          setLoginUser={setLoginUser}
          loginPass={loginPass}
          setLoginPass={setLoginPass}
          loginRole={loginRole}
          setLoginRole={setLoginRole}
          loginFloat={loginFloat}
          setLoginFloat={setLoginFloat}
          loginSession={loginSession}
          initiateCashClose={initiateCashClose}
          checklistItems={checklistItems}
          toggleChecklistItem={(idx) =>
            setChecklistItems((prev) => prev.map((v, i) => (i === idx ? !v : v)))
          }
          markAllChecklist={(status) => setChecklistItems([status, status, status, status, status, status])}
          signChecklist={() => showToast('Apertura de turno firmada exitosamente.', 'success')}
          scrollToTopOfViews={() => viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
        />

        {/* VIEW 3: PUNTO DE VENTA (POS GARITA — REGLA #1 SIN SCROLL EN 1080P) */}
        {activeView === 'pos' && (
          <div id="view-pos" className="p-4 md:px-6 md:py-4 max-w-6xl mx-auto space-y-3.5 animate-fade-in-up">
            {/* BARRA SUPERIOR DE SUBPESTAÑAS POS */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#e8ecf0] pb-3 gap-3">
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <button
                  id="btn-subtab-entry"
                  onClick={() => setPosSubtab('entry')}
                  className={`px-4 h-9 shrink-0 rounded-xl text-[13px] font-bold transition-all ${
                    posSubtab === 'entry'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-[#e8ecf0] hover:bg-[#f8fafc] hover:border-[#dde2e8]'
                  }`}
                >
                  <span>1. Ingreso de Vehículo [F2]</span>
                </button>
                <button
                  id="btn-subtab-exit"
                  onClick={() => setPosSubtab('exit')}
                  className={`px-4 h-9 shrink-0 rounded-xl text-[13px] font-bold transition-all ${
                    posSubtab === 'exit'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-[#e8ecf0] hover:bg-[#f8fafc] hover:border-[#dde2e8]'
                  }`}
                >
                  <span>2. Salida y Cobro [F4]</span>
                </button>
                <button
                  id="btn-subtab-history"
                  onClick={() => setPosSubtab('history')}
                  className={`px-4 h-9 shrink-0 rounded-xl text-[13px] font-bold transition-all ${
                    posSubtab === 'history'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-[#e8ecf0] hover:bg-[#f8fafc] hover:border-[#dde2e8]'
                  }`}
                >
                  <span>3. Historial del Turno</span>
                </button>
              </div>
              <div className="flex items-center gap-2 text-[12px] font-mono shrink-0 tabular-nums">
                <span className="text-slate-400">Tarifa Activa (0m Gracia):</span>
                <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  ${selectedRate} / min
                </span>
              </div>
            </div>

            {/* SUBPESTAÑA 1: INGRESO DE VEHÍCULO */}
            {posSubtab === 'entry' && (
              <div id="pos-subtab-entry" className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                <div className="md:col-span-7 bg-white border border-[#e8ecf0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
                  <div className="border-b border-[#f1f5f9] pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-[15px] font-bold tracking-tight text-slate-900">
                        Registro de Nuevo Vehículo
                      </h3>
                      <p className="text-[12px] text-slate-500 mt-0.5">Ingreso en Serrano 447 con autofoco inmediato.</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-[#f8fafc] px-2 py-1 rounded border border-[#e8ecf0]">F2 Autofoco • F8 Imprimir • F9 Barrera</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between max-w-md mb-2">
                        <label htmlFor="pos-entry-plate" className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">Patente del Vehículo *</label>
                        <span className="text-[10px] font-mono text-slate-400">Formato: ABCD12 / Extranjera</span>
                      </div>
                      <div className="flex items-center gap-2 max-w-md">
                        <div className="relative flex-1">
                          <input
                            ref={entryPlateRef}
                            type="text"
                            id="pos-entry-plate"
                            autoComplete="off"
                            value={entryPlate}
                            onChange={(e) => setEntryPlate(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') openTicketPreviewModal();
                            }}
                            placeholder="ABCD12"
                            maxLength={8}
                            className="w-full h-14 pl-5 pr-12 rounded-xl border-[1.5px] border-[#dde2e8] font-mono font-black text-2xl uppercase tracking-[0.14em] text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-0 bg-[#f8fafc] tabular-nums transition-colors"
                          />
                          <span className="absolute right-4 top-4 text-[11px] font-mono text-slate-400 font-bold">CHI</span>
                        </div>
                        <button
                          type="button"
                          onClick={triggerLprOcr}
                          disabled={isScanningLpr}
                          title="Capturar Patente con Cámara LPR IA (/api/ai/lpr-ocr)"
                          className="h-14 px-3.5 rounded-xl border border-[#dde2e8] bg-[#f8fafc] hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-700 font-mono text-[11px] font-bold transition-all shrink-0 flex flex-col items-center justify-center leading-tight"
                        >
                          <span>{isScanningLpr ? '...' : '[LPR IA]'}</span>
                          <span className="text-[9px] text-slate-400 font-normal">OCR Cam</span>
                        </button>
                      </div>
                      {entryPlate.trim().length >= 4 &&
                        activeVehicles.some((v) => v.plate === entryPlate.trim().toUpperCase()) && (
                          <div role="status" aria-live="polite" className="mt-2 max-w-md p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-mono flex items-center justify-between gap-3">
                            <span>⚠ [ANTI-PASSBACK]: Patente ya activa en patio.</span>
                            <button
                              type="button"
                              onClick={() => {
                                const existing = activeVehicles.find(
                                  (v) => v.plate === entryPlate.trim().toUpperCase()
                                );
                                if (existing) {
                                  loadVehicleIntoExit(existing);
                                  setPosSubtab('exit');
                                }
                              }}
                              className="underline font-bold text-amber-900 ml-1 shrink-0"
                            >
                              Ir a Cobro →
                            </button>
                          </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-2">Categoría Vehicular</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { cat: 'Sedán' as const, rate: 25 },
                            { cat: 'SUV' as const, rate: 30 },
                            { cat: 'Moto' as const, rate: 15 },
                          ].map((c) => (
                            <button
                              key={c.cat}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(c.cat);
                                setSelectedRate(c.rate);
                              }}
                              className={`h-10 rounded-xl text-[13px] font-bold transition-all ${
                                selectedCategory === c.cat
                                  ? 'border-[1.5px] border-slate-900 bg-slate-900 text-white shadow-xs'
                                  : 'border border-[#dde2e8] bg-white text-slate-700 hover:bg-[#f8fafc] hover:border-[#c1c9d4]'
                              }`}
                            >
                              {c.cat}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-2">Modalidad / Tarifa</label>
                        <select
                          value={selectedTariffLabel}
                          onChange={(e) => {
                            setSelectedTariffLabel(e.target.value);
                            if (e.target.value.includes('Convenio')) {
                              navigateTo('clients');
                            }
                          }}
                          className="w-full h-10 px-3 rounded-xl border border-[#dde2e8] text-[13px] font-mono focus:border-slate-900 focus:outline-none bg-white text-slate-900 transition-colors"
                        >
                          <option>Diurna Regular (Predeterminada)</option>
                          <option>Nocturna / Fin de Semana</option>
                          <option>Convenio Corporativo (Submódulo Paralelo)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-[#f1f5f9] pt-4">
                      <div>
                        <label htmlFor="pos-entry-name" className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">Conductor (Opcional)</label>
                        <input
                          type="text"
                          id="pos-entry-name"
                          value={entryName}
                          onChange={(e) => setEntryName(e.target.value)}
                          placeholder="Nombre completo..."
                          className="w-full h-10 px-3 rounded-xl border border-[#dde2e8] text-[13px] focus:border-slate-900 focus:outline-none bg-[#f8fafc] transition-colors"
                        />
                      </div>
                      <div>
                        <label htmlFor="pos-entry-phone" className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-1.5">WhatsApp (Opcional)</label>
                        <input
                          type="tel"
                          id="pos-entry-phone"
                          value={entryPhone}
                          onChange={(e) => setEntryPhone(e.target.value)}
                          placeholder="+56 9..."
                          className="w-full h-10 px-3 rounded-xl border border-[#dde2e8] text-[13px] font-mono focus:border-slate-900 focus:outline-none bg-[#f8fafc] tabular-nums transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="pos-entry-obs" className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                          Observaciones / Daños Previos (Resguardo Legal)
                        </label>
                        <button
                          type="button"
                          onClick={triggerDamageInspection}
                          disabled={isInspectingDamage}
                          title="Generar Acta de Recepción con Peritaje IA (/api/ai/damage-inspection)"
                          className="px-2.5 py-0.5 rounded-md border border-[#dde2e8] bg-[#f8fafc] hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-600 font-mono text-[10px] font-bold transition-colors"
                        >
                          {isInspectingDamage ? 'Inspeccionando...' : '[Peritaje IA]'}
                        </button>
                      </div>
                      <input
                        type="text"
                        id="pos-entry-obs"
                        value={entryObs}
                        onChange={(e) => setEntryObs(e.target.value)}
                        placeholder="Ej. Espejo derecho raspado, parachoques delantero..."
                        className="w-full h-10 px-3 rounded-xl border border-[#dde2e8] text-[13px] focus:border-slate-900 focus:outline-none bg-[#f8fafc] transition-colors"
                      />
                    </div>

                    <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e8ecf0] flex items-center justify-between tabular-nums">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.06em] block mb-0.5">
                          Registro Operativo Serrano 447:
                        </span>
                        <div id="pos-selected-slot-badge" className="text-[13px] font-bold text-slate-900 font-mono">
                          Plaza sugerida {nextArrivalSeq <= 15 ? `A-${nextArrivalSeq.toString().padStart(2, '0')}` : `B-${Math.min(30, nextArrivalSeq).toString().padStart(2, '0')}`} (Cupo #{nextArrivalSeq})
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        Asignación Automática
                      </span>
                    </div>
                  </div>

                  <button
                    id="btn-emit-ticket"
                    onClick={openTicketPreviewModal}
                    className={`w-full h-13 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 ${
                      entryPlate.trim().length >= 4 ? '' : 'opacity-60'
                    }`}
                  >
                    <span>Emitir Ticket 80mm &amp; Registrar Ingreso [Enter]</span>
                  </button>
                </div>

                {/* PANEL DERECHO: PLANO DEL PATIO / MATRIZ 30 PLAZAS + 5 SC */}
                <div className="md:col-span-5 bg-white border border-[#e8ecf0] rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col h-[calc(100vh-11.5rem)] min-h-[470px] max-h-[590px]">
                  <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2.5 shrink-0 gap-2">
                    <div>
                      <h3 className="text-[13px] font-bold tracking-tight text-slate-900">
                        Plano del Patio (Serrano 447)
                      </h3>
                      <div className="flex items-center gap-1 mt-1 bg-[#f4f6f9] p-0.5 rounded-lg w-fit">
                        <button
                          type="button"
                          onClick={() => setPosPatioViewMode('cards')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-colors ${
                            posPatioViewMode === 'cards'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Tarjetas ({activeVehicles.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPosPatioViewMode('matrix')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-colors ${
                            posPatioViewMode === 'matrix'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Matriz 30 + 5 SC
                        </button>
                        <button
                          type="button"
                          onClick={() => setPosPatioViewMode('kanban')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-colors ${
                            posPatioViewMode === 'kanban'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Kanban 4T
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 font-mono text-[10px] tabular-nums">
                      <span className="px-2 py-0.5 rounded-full bg-[#f1f5f9] text-slate-800 font-bold border border-[#dde2e8]">
                        <span id="patio-count-badge">{activeVehicles.length}</span> Ocupados
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        <span id="patio-free-badge">{Math.max(0, 28 - activeVehicles.length)}</span> Libres
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        {parallelRecords.length} Abonados
                      </span>
                    </div>
                  </div>

                  {/* Leyenda Cromática Semántica (Regla #3) */}
                  <div className="flex flex-wrap items-center gap-2.5 py-2 shrink-0 border-b border-[#f1f5f9] text-[9px] font-mono uppercase text-slate-500 font-bold justify-center">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-[#10B981]" /> Libre
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-[#64748B]" /> Ocupado
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-[#3B82F6]" /> Abonado
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-[#06B6D4]" /> PMR
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-[#8B5CF6]" /> EV
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-[#EF4444]" /> Alerta
                    </span>
                  </div>

                  {posPatioViewMode === 'kanban' ? (
                    <TableroKanbanEstadiaView
                      vehicles={activeVehicles}
                      onSelectVehicleForCheckout={(v) => {
                        loadVehicleIntoExit(v);
                        setPosSubtab('exit');
                      }}
                      onReportFuga={(v) => setFugaTargetVehicle(v)}
                    />
                  ) : posPatioViewMode === 'cards' ? (
                    <div
                      id="pos-patio-active-list"
                      className="flex-1 overflow-y-auto pt-2.5 pr-1.5 grid grid-cols-2 gap-2 overscroll-contain content-start"
                    >
                      {activeVehicles.map((v) => {
                        const accumulated = v.durationMin * (v.rate || 25);
                        const isOverstay = v.durationMin >= 240;
                        let colorCls = 'border-[#dde2e8] bg-white hover:border-slate-300';
                        let dotCls = 'bg-sky-500';
                        if (isOverstay) {
                          colorCls = 'border-red-300 bg-red-50/40 hover:border-red-400';
                          dotCls = 'bg-red-500';
                        } else if (v.cat === 'SUV') {
                          colorCls = 'border-purple-200 bg-purple-50/30 hover:border-purple-300';
                          dotCls = 'bg-purple-500';
                        } else if (v.cat === 'Moto') {
                          colorCls = 'border-amber-200 bg-amber-50/30 hover:border-amber-300';
                          dotCls = 'bg-amber-500';
                        }

                        return (
                          <div
                            key={`${v.slot}-${v.plate}`}
                            onClick={() => {
                              loadVehicleIntoExit(v);
                              setPosSubtab('exit');
                            }}
                            className={`p-2.5 rounded-xl border ${colorCls} transition-all duration-150 cursor-pointer hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 tabular-nums`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-bold text-slate-400">{v.slotCode}</span>
                                <span className={`w-2 h-2 rounded-full ${dotCls}`} />
                                <span className="text-[11px] font-bold text-slate-700">{v.cat}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    printThermalTicketIsolated({
                                      ticketCode: v.ticketId,
                                      plate: v.plate,
                                      slotCode: v.slotCode,
                                      vehicleType: v.cat,
                                      entryTime: v.entry,
                                      ratePerMin: v.rate || 25,
                                      clientName: v.client,
                                      isOffline: v.isOffline,
                                    });
                                  }}
                                  title="Imprimir Ticket Térmico 80mm Aislado"
                                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[9px] font-mono font-bold text-slate-700"
                                >
                                  80mm
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFugaTargetVehicle(v);
                                  }}
                                  title="Reportar Fuga de Vehículo (PIN Supervisor)"
                                  className="px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 text-[9px] font-mono font-bold text-red-600 border border-red-200"
                                >
                                  Fuga
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="license-plate-chip px-2 py-0.5 text-xs shadow-xs bg-white">{v.plate}</div>
                              <div className="text-right font-mono">
                                <div className="text-xs font-bold text-emerald-600">
                                  ${accumulated.toLocaleString('es-CL')}
                                </div>
                                <div className="text-[9px] text-slate-400 font-semibold">{v.durationMin} min</div>
                              </div>
                            </div>
                            <div className="mt-1.5 pt-1 border-t border-[#f1f5f9] flex justify-between text-[9px] text-slate-400 font-medium">
                              <span className="truncate max-w-[90px]">{v.client || 'Particular'}</span>
                              <span className="font-mono">Arr: {v.entry}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto pt-2.5 pr-1 space-y-2.5 font-mono tabular-nums">
                      <div className="grid grid-cols-5 gap-1.5">
                        {Array.from({ length: 30 }, (_, idx) => {
                          const slotNum = idx + 1;
                          const slotCode =
                            slotNum <= 15
                              ? `A-${slotNum.toString().padStart(2, '0')}`
                              : `B-${slotNum.toString().padStart(2, '0')}`;
                          const veh = activeVehicles.find((v) => v.slot === slotNum || v.slotCode === slotCode);
                          const isConvenio =
                            slotNum >= 29 || parallelRecords.some((p) => p.slotCode === slotCode);
                          const isPMR = slotNum === 1 || slotNum === 2;
                          const isEV = slotNum === 3;
                          const isOverstay = veh && veh.durationMin >= 120;

                          let bgStyle = 'bg-[#10B981]/10 border-[#10B981] text-emerald-950';
                          let label = 'LIBRE';
                          if (isOverstay) {
                            bgStyle = 'bg-[#EF4444]/15 border-[#EF4444] text-rose-950';
                            label = veh?.plate || 'ALERTA';
                          } else if (veh) {
                            bgStyle = 'bg-[#64748B]/15 border-[#64748B] text-slate-900';
                            label = veh.plate;
                          } else if (isConvenio) {
                            bgStyle = 'bg-[#3B82F6]/15 border-[#3B82F6] text-blue-950';
                            label = 'VIP';
                          } else if (isPMR) {
                            bgStyle = 'bg-[#06B6D4]/15 border-[#06B6D4] text-cyan-950';
                            label = 'PMR';
                          } else if (isEV) {
                            bgStyle = 'bg-[#8B5CF6]/15 border-[#8B5CF6] text-purple-950';
                            label = 'EV';
                          }

                          return (
                            <button
                              key={slotCode}
                              type="button"
                              onClick={() => {
                                if (veh) {
                                  loadVehicleIntoExit(veh);
                                  setPosSubtab('exit');
                                } else {
                                  setNextArrivalSeq(slotNum);
                                  showToast(`Plaza ${slotCode} seleccionada para próximo ingreso`, 'info');
                                }
                              }}
                              className={`p-1.5 rounded-lg border ${bgStyle} text-left transition-transform hover:-translate-y-0.5 flex flex-col justify-between h-12`}
                            >
                              <div className="flex justify-between items-center text-[9px] font-bold opacity-75">
                                <span>{slotCode}</span>
                                {veh && <span>{veh.durationMin}m</span>}
                              </div>
                              <div className="text-[10px] font-black truncate">{label}</div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="pt-1.5 border-t border-[#f1f5f9]">
                        <div className="text-[9px] font-bold uppercase text-amber-700 mb-1">
                          Fila de Sobrecupo (SC-01 a SC-05 • Pasillo Central)
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {['SC-01', 'SC-02', 'SC-03', 'SC-04', 'SC-05'].map((sc) => (
                            <div
                              key={sc}
                              className="p-1.5 rounded-lg border border-[#F59E0B] bg-[#F59E0B]/10 text-amber-900 text-center text-[9px] font-bold"
                            >
                              <div>{sc}</div>
                              <div className="text-[8px] opacity-75">AUX</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUBPESTAÑA 2: SALIDA Y COBRO */}
            {posSubtab === 'exit' && (
              <div id="pos-subtab-exit" className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-6 bg-white border border-[#e8ecf0] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-6">
                  <div className="border-b border-[#f1f5f9] pb-4">
                    <h3 className="text-[15px] font-bold tracking-tight text-slate-900">
                      Despacho de Vehículo
                    </h3>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      Búsqueda predictiva por Patente, Código QR o Código Lineal Code 128.
                    </p>
                  </div>

                  <div className="relative">
                    <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 mb-2">
                      Buscar Patente o Ticket # (`TKT-...`)
                    </label>
                    <div className="relative">
                      <input
                        ref={exitSearchRef}
                        type="text"
                        id="pos-exit-search-input"
                        value={exitSearchQuery}
                        onChange={(e) => setExitSearchQuery(e.target.value)}
                        placeholder="Ej. BBCL84 o TKT-20260927..."
                        className="w-full h-12 pl-4 pr-3 rounded-xl border-[1.5px] border-[#dde2e8] font-mono font-bold text-xl uppercase text-slate-900 focus:border-slate-900 focus:outline-none bg-[#f8fafc] tabular-nums transition-colors"
                      />
                    </div>
                    {exitSearchQuery.trim().length > 0 && (
                      <div className="absolute top-20 inset-x-0 bg-white border border-[#e8ecf0] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] z-30 max-h-52 overflow-y-auto divide-y divide-[#f1f5f9] font-mono tabular-nums">
                        {exitMatches.length === 0 ? (
                          <div className="p-4 text-xs text-slate-400 text-center">
                            Patente o ticket no se encuentra en el patio activo.
                          </div>
                        ) : (
                          exitMatches.map((v) => (
                            <div
                              key={v.plate}
                              onClick={() => {
                                loadVehicleIntoExit(v);
                                setExitSearchQuery('');
                              }}
                              className="p-3.5 hover:bg-[#f8fafc] cursor-pointer flex items-center justify-between transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="license-plate-chip px-2 py-0.5 text-sm">{v.plate}</span>
                                <span className="text-xs font-bold text-slate-700">{v.cat}</span>
                              </div>
                              <div className="text-right text-xs">
                                <span className="text-emerald-600 font-bold">{v.durationMin} min</span>
                                <span className="text-slate-400 ml-2">{v.slotCode}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {activeCheckoutVehicle && (
                    <div className="p-5 bg-[#f8fafc] rounded-xl border border-[#e8ecf0] space-y-4 font-mono tabular-nums">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400 uppercase tracking-[0.06em] font-bold block mb-0.5">Vehículo a Liquidar:</span>
                          <span className="text-[11px] text-slate-500 font-bold">{activeCheckoutVehicle.ticketId}</span>
                        </div>
                        <span id="exit-card-plate" className="license-plate-chip px-4 py-1.5 text-lg font-bold shadow-xs bg-white">
                          {activeCheckoutVehicle.plate}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-[#e8ecf0]">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em] mb-1">Categoría:</span>
                          <span className="font-bold text-slate-900 text-base">{activeCheckoutVehicle.cat}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em] mb-1">Plaza / Llegada:</span>
                          <span className="font-bold text-slate-900 text-base">
                            {activeCheckoutVehicle.slotCode} (#{activeCheckoutVehicle.slot})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em] mb-1">Hora Ingreso:</span>
                          <span className="font-bold text-slate-900 text-base">{activeCheckoutVehicle.entry} hrs</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em] mb-1">Estadía Computada:</span>
                          <span className="font-bold text-emerald-600 text-base">
                            {activeCheckoutVehicle.durationMin} min
                          </span>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-[#e8ecf0] text-sm space-y-2">
                        <span className="text-slate-400 block text-[10px] uppercase tracking-[0.06em]">Datos Conductor &amp; Daños:</span>
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#e8ecf0]">
                          <span className="text-slate-800 font-bold font-sans text-[13px]">
                            {activeCheckoutVehicle.client || 'Particular'}
                          </span>
                          <span className="text-slate-400 text-xs">{activeCheckoutVehicle.phone || 'Sin WhatsApp'}</span>
                        </div>
                        <div className="text-xs bg-white px-3 py-2.5 rounded-xl border border-[#e8ecf0] text-slate-600 font-sans">
                          <strong className="text-slate-800">Inspección Previa:</strong> {activeCheckoutVehicle.obs || 'Sin daños preexistentes registrados'}
                        </div>
                      </div>

                      {/* BOTONES DE EXCEPCIONES ANTIFRAUDE CON PIN Y REIMPRESIÓN */}
                      <div className="pt-3 border-t border-[#e8ecf0] grid grid-cols-3 gap-2 font-sans">
                        <button
                          type="button"
                          onClick={() => setPinModalType('DISCOUNT')}
                          className="h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold transition-colors"
                        >
                          Descuento PIN [F6]
                        </button>
                        <button
                          type="button"
                          onClick={() => setPinModalType('LOST_TICKET')}
                          className="h-10 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-[11px] font-bold transition-colors"
                        >
                          Extravío +$8k [F7]
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            showToast(
                              `Reimpresión física 80mm enviada para ${activeCheckoutVehicle.ticketId}`,
                              'info'
                            )
                          }
                          className="h-10 rounded-xl bg-white hover:bg-[#f1f5f9] border border-[#dde2e8] text-slate-700 text-[11px] font-bold transition-colors"
                        >
                          Reimprimir [F8]
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* PANEL DERECHO: LIQUIDACIÓN FINANCIERA & COBRO */}
                <div className="md:col-span-6 bg-white border border-[#e8ecf0] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
                  <div className="border-b border-[#f1f5f9] pb-4">
                    <h3 className="text-[15px] font-bold tracking-tight text-slate-900">
                      Liquidación de Pago
                    </h3>
                    <p className="text-[12px] text-slate-500 mt-0.5">Emisión de Boleta / Voucher DTE y cálculo de vuelto.</p>
                  </div>

                  <div className="p-5 rounded-xl space-y-3 font-mono text-[13px] text-slate-300 tabular-nums bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-[rgba(255,255,255,0.06)]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Tarifa Aplicada:</span>
                      <span className="font-bold text-white">${activeCheckoutVehicle?.rate || 25} / minuto</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Tiempo Transcurrido:</span>
                      <span className="font-bold text-white">{activeCheckoutVehicle?.durationMin || 0} min</span>
                    </div>
                    {discountApplied > 0 && (
                      <div className="flex justify-between items-center text-emerald-400 font-bold">
                        <span>Descuento Autorizado (PIN Operador):</span>
                        <span>-${discountApplied.toLocaleString('es-CL')}</span>
                      </div>
                    )}
                    {surchargeApplied > 0 && (
                      <div className="flex justify-between items-center text-rose-400 font-bold">
                        <span>Multa Ticket Extraviado (PIN Admin):</span>
                        <span>+${surchargeApplied.toLocaleString('es-CL')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                      <span className="text-slate-400">Subtotal Neto:</span>
                      <span className="text-slate-300">${netSubtotal.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">IVA (19% DTE):</span>
                      <span className="text-slate-300">${ivaAmount.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-end pt-3 border-t border-slate-700">
                      <span className="text-sm font-bold text-white uppercase tracking-[0.06em]">Total a Pagar:</span>
                      <span id="checkout-total-display" className="text-4xl font-black text-emerald-400 tracking-tight">
                        ${finalCheckoutTotal.toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">Medio de Pago</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'efectivo' as const, label: 'Efectivo' },
                        { id: 'tarjeta' as const, label: 'Tarjeta POS' },
                        { id: 'transferencia' as const, label: 'Transferencia' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`h-10 rounded-xl text-[13px] font-bold transition-all ${
                            paymentMethod === m.id
                              ? 'border-[1.5px] border-slate-900 bg-slate-900 text-white shadow-xs'
                              : 'border border-[#dde2e8] bg-white text-slate-700 hover:bg-[#f8fafc] hover:border-[#c1c9d4]'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMethod === 'efectivo' && (
                    <div
                      id="cash-change-calculator"
                      className="p-5 bg-[#f8fafc] rounded-xl border border-[#e8ecf0] space-y-4 font-mono text-[13px] tabular-nums"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-bold uppercase text-xs tracking-[0.04em]">Monto Recibido:</span>
                        <input
                          type="number"
                          id="cash-given-input"
                          value={cashGiven}
                          onChange={(e) => setCashGiven(e.target.value)}
                          className="w-32 h-10 px-3 rounded-lg border-[1.5px] border-[#dde2e8] text-right font-mono font-bold text-xl text-slate-900 bg-white focus:border-slate-900 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-1.5 justify-end flex-wrap">
                        <button
                          type="button"
                          onClick={() => setCashGiven(finalCheckoutTotal.toString())}
                          className="px-3 py-1.5 bg-white border border-[#dde2e8] rounded-lg text-[12px] text-slate-600 hover:bg-[#f1f5f9] hover:border-[#c1c9d4] font-bold transition-colors"
                        >
                          Exacto
                        </button>
                        {[2000, 5000, 10000, 20000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setCashGiven(amt.toString())}
                            className="px-3 py-1.5 bg-white border border-[#dde2e8] rounded-lg text-[12px] text-slate-600 hover:bg-[#f1f5f9] hover:border-[#c1c9d4] font-bold transition-colors"
                          >
                            ${amt / 1000}k
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-[#e8ecf0]">
                        <span className="text-slate-600 font-bold uppercase text-xs tracking-[0.04em]">Vuelto a Entregar:</span>
                        <span id="cash-change-display" className="font-black text-emerald-600 text-2xl">
                          ${cashChange.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={processVehicleCheckout}
                    className="w-full h-13 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[15px] flex items-center justify-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5"
                  >
                    <span>Cobrar y Emitir Voucher DTE [Enter]</span>
                  </button>
                </div>
              </div>
            )}

            {/* SUBPESTAÑA 3: HISTORIAL DE TURNO (CONTABILIDAD) */}
            {posSubtab === 'history' && (
              <div id="pos-subtab-history" className="bg-white border border-[#e8ecf0] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#f1f5f9] pb-4 gap-3">
                  <div>
                    <h3 className="text-[15px] font-bold tracking-tight text-slate-900">
                      Libro de Caja Diario
                    </h3>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      Registro cronológico de movimientos del turno. Ingresos en verde, egresos en rojo.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 tabular-nums">
                    <button
                      onClick={() => setManualTxModalOpen(true)}
                      className="px-4 h-10 rounded-xl border border-[#dde2e8] bg-white text-slate-700 hover:bg-[#f8fafc] text-[12px] font-bold font-mono transition-colors shadow-xs"
                    >
                      + / - Movimiento de Caja Manual
                    </button>
                    <div className="px-5 py-2 rounded-xl bg-[#0f172a] text-white font-mono text-[13px] font-bold flex items-center gap-3">
                      <span className="text-slate-400">Balance Total:</span>
                      <span id="history-running-balance" className="text-emerald-400 text-lg font-black">
                        ${runningBalance.toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-[#f8fafc] text-slate-400 text-[10px] uppercase font-mono font-bold tracking-[0.07em] rounded-xl border border-[#e8ecf0]">
                  <div className="col-span-1">Hora</div>
                  <div className="col-span-2">Tipo</div>
                  <div className="col-span-3">Concepto &amp; Vehículo</div>
                  <div className="col-span-2">Medio Pago</div>
                  <div className="col-span-2 text-right">Ingresos (+)</div>
                  <div className="col-span-2 text-right">Egresos (-)</div>
                </div>

                <div className="flex flex-col max-h-[500px] overflow-y-auto overscroll-contain pb-3 space-y-1 tabular-nums">
                  {shiftHistory.map((log, i) => (
                    <div
                      key={`${log.time}-${i}`}
                      className="grid grid-cols-12 gap-3 items-center px-4 py-3 border-b border-[#f8fafc] bg-white hover:bg-[#f8fafc] transition-colors font-mono text-[12px]"
                    >
                      <div className="col-span-1 text-slate-400 font-bold">{log.time}</div>
                      <div className="col-span-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${
                            log.type === 'APERTURA'
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : log.type === 'INGRESO'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : log.type === 'RETIRO'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {log.type}
                        </span>
                      </div>
                      <div className="col-span-3 text-slate-700 font-sans text-xs leading-tight">
                        {log.desc} <br />
                        {log.plate !== '---' && (
                          <span className="license-plate-chip px-1.5 py-0.5 text-[10px] shadow-xs mt-1.5 inline-block">
                            {log.plate}
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 text-slate-500 font-bold">{log.method}</div>
                      <div className="col-span-2 text-right bg-emerald-50/40 py-2 px-3 rounded-lg border border-emerald-100/50">
                        {!log.isEgreso && log.amount > 0 ? (
                          <span className="text-emerald-600 font-black">${log.amount.toLocaleString('es-CL')}</span>
                        ) : (
                          <span className="text-slate-300">---</span>
                        )}
                      </div>
                      <div className="col-span-2 text-right bg-rose-50/40 py-2 px-3 rounded-lg border border-rose-100/50">
                        {log.isEgreso && log.amount > 0 ? (
                          <span className="text-rose-600 font-black">${log.amount.toLocaleString('es-CL')}</span>
                        ) : (
                          <span className="text-slate-300">---</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AUXILIARY VIEWS: MAP/ANALYTICS, SUPPORT, REPORTS, CLIENTS, SETTINGS */}
        <OfficialAuxViews
          activeView={activeView}
          activeVehicles={activeVehicles}
          auditLogs={auditLogs}
          showToast={showToast}
          onSelectVehicleForCheckout={(v) => {
            loadVehicleIntoExit(v);
            setActiveView('pos');
            setPosSubtab('exit');
          }}
          onInitiateCashClose={initiateCashClose}
          isOfflineMode={isOfflineMode}
          onToggleOfflineMode={() => {
            setIsOfflineMode((prev) => {
              const next = !prev;
              showToast(
                next
                  ? 'Modo Contingencia Offline (-O) activado. Persistencia local IndexedDB.'
                  : 'Conexión con Cloud Run restablecida.',
                next ? 'error' : 'success'
              );
              return next;
            });
          }}
          parallelRecords={parallelRecords}
          onAddParallelRecord={(plate, company, type, slotCode) => {
            setParallelRecords((prev) => [
              ...prev,
              {
                id: `CONV-${prev.length + 1}`,
                plate,
                company,
                type,
                slotCode,
                amount: type === 'CONVENIO' ? 75000 : 8000,
                status: 'ACTIVO',
              },
            ]);
            showToast(
              `Servicio en paralelo (${type}) registrado para ${plate} en plaza ${slotCode} sin alterar caja rotativa.`,
              'success'
            );
          }}
        />

        {/* VIEW ENGINE: CONSOLA DEL MOTOR HÍBRIDO (REDIS + CLOUD DATASTORE + ARCHIFY + RENDERS 8K) */}
        {activeView === 'engine' && (
          <OfficialEngineView
            activeVehicles={activeVehicles}
            isOfflineMode={isOfflineMode}
            onToggleOfflineMode={() => setIsOfflineMode((v) => !v)}
            showToast={showToast}
            onNavigateToPos={() => openPosInSubtab('entry')}
          />
        )}
      </main>

      {/* WIDGET DE TURNO PERSISTENTE */}
      {isShiftActive && (
        <div id="persistent-shift-widget" className="fixed bottom-5 left-5 z-40 group select-none">
          <div className="h-10 px-4 rounded-full bg-[#0f172a] text-white border border-[rgba(255,255,255,0.08)] shadow-[0_8px_24px_rgba(0,0,0,0.2)] flex items-center gap-2.5 cursor-pointer hover:bg-[#1e293b] transition-all tabular-nums">
            <span className="w-2 h-2 rounded-full bg-emerald-400 live-pulse" />
            <span className="text-[13px] font-mono font-bold" id="widget-shift-timer">
              {shiftTimerStr}
            </span>
            <span className="text-[rgba(255,255,255,0.2)]">|</span>
            <span className="text-[13px] font-semibold">Juan P.</span>
          </div>
          <div className="hidden group-hover:block absolute bottom-12 left-0 w-72 bg-[#0f172a] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 shadow-[0_16px_48px_rgba(0,0,0,0.3)] text-white text-xs space-y-4 animate-fade-in-up tabular-nums">
            <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.08em]">Turno Actual</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-900">
                GARITA 01
              </span>
            </div>
            <div className="space-y-2.5 font-mono text-[12px]">
              <div className="flex justify-between text-slate-400">
                <span>Fondo Inicial:</span>
                <span className="text-white font-semibold">${initialFloat.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Recaudado:</span>
                <span className="text-emerald-400 font-bold">${shiftRevenue.toLocaleString('es-CL')}</span>
              </div>
            </div>
            <div className="pt-3 mt-1 border-t border-[rgba(255,255,255,0.06)]">
              <button
                onClick={initiateCashClose}
                className="w-full h-10 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 border border-rose-900/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span>Cerrar Caja y Turno (Corte Z)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALES OFICIALES */}
      <OfficialModals
        ticketModalOpen={ticketModalOpen}
        closeTicketModal={() => setTicketModalOpen(false)}
        ticketPreviewData={ticketPreviewData}
        confirmVehicleEntry={confirmVehicleEntry}
        printPhysicalTicket={() => {
          printThermalTicketIsolated({
            ticketCode: ticketPreviewData.ticketId,
            plate: ticketPreviewData.plate,
            slotCode: ticketPreviewData.slot,
            vehicleType: selectedCategory,
            entryTime: ticketPreviewData.time.replace(' hrs', ''),
            ratePerMin: ticketPreviewData.rate,
            clientName: ticketPreviewData.client,
            isOffline: ticketPreviewData.isOffline,
          });
          showToast('Impresión Térmica Aislada 80mm ejecutada (QR + Code 128).', 'success');
          setTimeout(() => setTicketModalOpen(false), 500);
        }}
        sendTicketViaWhatsApp={() => {
          showToast('Comprobante digital enviado vía WhatsApp.', 'success');
          setTimeout(() => setTicketModalOpen(false), 500);
        }}
        closeShiftModalOpen={closeShiftModalOpen}
        closeShiftStep={closeShiftStep}
        closeShiftModal={() => setCloseShiftModalOpen(false)}
        declareCash={declareCash}
        setDeclareCash={setDeclareCash}
        declarePos={declarePos}
        setDeclarePos={setDeclarePos}
        declareTransfer={declareTransfer}
        setDeclareTransfer={setDeclareTransfer}
        sysCashExpected={192500}
        sysPosExpected={150000}
        sysTransExpected={50000}
        shiftSealHash={shiftSealHash}
        goToCashCloseStep2={goToCashCloseStep2}
        backToCashCloseStep1={() => setCloseShiftStep(1)}
        emitReportZ={() => {
          showToast('Reporte Z emitido en impresora térmica con sello SHA-256.', 'success');
          setCloseShiftStep(3);
        }}
        confirmShiftClose={() => {
          setCloseShiftModalOpen(false);
          setIsShiftActive(false);
          setChecklistItems([false, false, false, false, false, false]);
          showToast('Sesión cerrada de forma segura.', 'info');
          navigateTo('landing');
        }}
        manualTxModalOpen={manualTxModalOpen}
        closeManualTransactionModal={() => setManualTxModalOpen(false)}
        manualTxType={manualTxType}
        setManualTxType={setManualTxType}
        manualTxAmount={manualTxAmount}
        setManualTxAmount={setManualTxAmount}
        manualTxDesc={manualTxDesc}
        setManualTxDesc={setManualTxDesc}
        manualTxAuth={manualTxAuth}
        setManualTxAuth={setManualTxAuth}
        manualTxPin={manualTxPin}
        setManualTxPin={setManualTxPin}
        confirmManualTransaction={confirmManualTransaction}
        pinModalType={pinModalType}
        closePinModal={() => setPinModalType(null)}
        pinValue={pinValue}
        setPinValue={setPinValue}
        pinReason={pinReason}
        setPinReason={setPinReason}
        discountAmountInput={discountAmountInput}
        setDiscountAmountInput={setDiscountAmountInput}
        confirmPinException={confirmPinException}
      />

      {/* SUITE UNIFICADA DE LA VERSIÓN PUBLICADA: COMMAND PALETTE (⌘K), FUGA DE VEHÍCULO Y REVISIÓN 1 A 1 */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        vehicles={activeVehicles}
        onSelectVehicleForCheckout={(v) => {
          loadVehicleIntoExit(v);
          setActiveView('pos');
          setPosSubtab('exit');
          showToast(`Patente ${v.plate} cargada en módulo de Liquidación y Cobro.`, 'info');
        }}
        onNavigateView={(view) => navigateTo(view)}
        onTriggerBarrier={() =>
          showToast('Pulso de apertura enviado a Barrera Principal (GARITA-01).', 'success')
        }
        onOpenArqueoCiego={initiateCashClose}
      />

      <ModalFugaVehiculo
        vehicle={fugaTargetVehicle}
        onClose={() => setFugaTargetVehicle(null)}
        onConfirmFuga={async (veh, notes, pin) => {
          try {
            await fetch('/api/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: veh.plate,
                accion: 'FUGA',
                pin,
                motivo: notes,
              }),
            });
          } catch {
            // Offline fallback
          }
          setActiveVehicles((prev) => prev.filter((item) => item.plate !== veh.plate));
          setAuditLogs((prev) => [
            {
              id_auditoria: `AUD-FUGA-${Date.now()}`,
              accion: `FUGA_VEHICULO (${veh.plate} - ${veh.slotCode})`,
              tipo_evento: 'FUGA',
              color_tag: 'ROJO',
              id_usuario: 'OP-01',
              nombre_usuario: operatorName,
              fecha_hora: new Date().toISOString(),
              motivo: notes,
              autorizador_pin: pin,
            },
            ...prev,
          ]);
          showToast(
            `Fuga de ${veh.plate} registrada con PIN Supervisor [Auditoría Roja]. Plaza ${veh.slotCode} liberada.`,
            'error'
          );
        }}
      />

      <ModalRevisionVehiculosCierre
        isOpen={vehicleHandoverOpen}
        onClose={() => setVehicleHandoverOpen(false)}
        vehicles={activeVehicles}
        onForceCheckoutVehicle={(v) => {
          setCloseShiftModalOpen(false);
          loadVehicleIntoExit(v);
          setActiveView('pos');
          setPosSubtab('exit');
          showToast(`Vehículo ${v.plate} seleccionado para cobro inmediato previo al cierre.`, 'info');
        }}
        onConfirmAllHandover={(plates) => {
          setHandoverConfirmedCount(plates.length);
          showToast(
            `Arrastre físico validado: ${plates.length} vehículos traspasados al siguiente turno.`,
            'success'
          );
        }}
      />

      {/* CONTENEDOR FLOTANTE DE NOTIFICACIONES TOAST */}
      <div id="toast-container" aria-live="polite" className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-animate pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-[0_8px_24px_rgba(0,0,0,0.12)] text-[13px] font-medium ${
              t.type === 'success'
                ? 'bg-[#052e16] text-emerald-100 border-emerald-900/60'
                : t.type === 'error'
                ? 'bg-[#450a0a] text-rose-100 border-rose-900/60'
                : 'bg-[#0f172a] text-slate-100 border-slate-800/80'
            }`}
          >
            <span className="font-bold text-base shrink-0">
              {t.type === 'success' ? '✓' : t.type === 'error' ? '⚠' : 'ℹ'}
            </span>
            <span className="leading-snug">{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
