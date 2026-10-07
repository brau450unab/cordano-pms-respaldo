import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParking } from '../context/ParkingContext';
import { VehicleType, Ticket, Customer, TariffType, Agreement, AppScreen } from '../types';
import { TicketModal } from '../components/TicketModal';
import { ModalConvenioDetectado } from '../components/ModalConvenioDetectado';
import { CordanoLogo } from '../components/CordanoLogo';
import {
  ArrowLeft,
  Clock,
  Car,
  Bike,
  Truck,
  ShieldCheck,
  Printer,
  Share2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Tag,
  KeyRound,
  Info,
  CornerDownLeft,
  Check,
  Barcode,
  Layers,
  User,
  Building2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Zap,
  ListPlus
} from 'lucide-react';

interface IngresoVehiculosProps {
  onBack?: () => void;
  onNavigate?: (screen: AppScreen) => void;
}

export const IngresoVehiculos: React.FC<IngresoVehiculosProps> = ({ onBack, onNavigate }) => {
  const {
    slots,
    tickets,
    registerEntry,
    assignSlotToTicket,
    findCustomerByPlate,
    findAgreementByPlate,
    tariffConfig,
    user
  } = useParking();

  // Input states
  const [plateNumber, setPlateNumber] = useState('');
  const [phone, setPhone] = useState('+56 9 ');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Automóvil');
  const [selectedSlotCode, setSelectedSlotCode] = useState<string>('');
  
  // Customer & Agreement states
  const [showCustomerDrawer, setShowCustomerDrawer] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerRut, setCustomerRut] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [tariffType, setTariffType] = useState<TariffType>('estandar');
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [detectedAgreement, setDetectedAgreement] = useState<Agreement | null>(null);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [bypassAgreementPopup, setBypassAgreementPopup] = useState(false);

  // Options
  const [printPhysicalTicket, setPrintPhysicalTicket] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);

  // Validation / Warnings
  const [antiPassbackError, setAntiPassbackError] = useState<string | null>(null);
  const [showForcePlateModal, setShowForcePlateModal] = useState(false);
  const [pendingForcePlate, setPendingForcePlate] = useState('');
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  // Local Chile Clock state
  const [chileTime, setChileTime] = useState<string>('');

  const plateInputRef = useRef<HTMLInputElement>(null);

  // Live Chile Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleTimeString('es-CL', {
        timeZone: 'America/Santiago',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dateFormatted = now.toLocaleDateString('es-CL', {
        timeZone: 'America/Santiago',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      setChileTime(`${formatted} • ${dateFormatted}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Autofocus input on load
  useEffect(() => {
    plateInputRef.current?.focus();
  }, []);

  // Slots calculation
  const totalSlots = slots.length;
  const freeSlots = slots.filter((s) => s.status === 'disponible');
  const freeCount = freeSlots.length;
  const isHighOccupancy = freeCount <= 6;

  // Auto-suggestion: first available slot
  const suggestedSlot = freeSlots.length > 0 ? freeSlots[0] : null;

  // Unassigned tickets queue (if any)
  const unassignedTickets = tickets.filter(
    (t) => t.status === 'activo' && (!t.slotCode || t.slotCode === 'SIN_ASIGNAR' || t.slotCode === 'Sin Slot')
  );

  // Set default selected slot when available or suggested
  useEffect(() => {
    if (!selectedSlotCode || !slots.some(s => s.code === selectedSlotCode && s.status === 'disponible')) {
      if (suggestedSlot) {
        setSelectedSlotCode(suggestedSlot.code);
      }
    }
  }, [freeCount, suggestedSlot, selectedSlotCode, slots]);

  // Chilean plate format validation helper
  const validateChileanPlateFormat = (raw: string) => {
    const clean = raw.replace(/[^A-Z0-9]/g, '');
    const regexNuevo = /^[B-DF-HJ-NP-TV-Z]{4}[0-9]{2}$/;
    const regexAntiguo = /^[A-Z]{2}[0-9]{4}$/;
    const regexMoto = /^[A-Z]{3}[0-9]{2}$/;
    const regexFlexible = /^[A-Z0-9]{5,6}$/;

    return regexNuevo.test(clean) || regexAntiguo.test(clean) || regexMoto.test(clean) || regexFlexible.test(clean);
  };

  const handleFormatPlate = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let formatted = clean;

    if (clean.length === 6) {
      if (/^[A-Z]{4}[0-9]{2}$/.test(clean)) {
        formatted = `${clean.slice(0, 4)}-${clean.slice(4, 6)}`;
      } else if (/^[A-Z]{2}[0-9]{4}$/.test(clean)) {
        formatted = `${clean.slice(0, 2)}-${clean.slice(2, 6)}`;
      } else {
        formatted = `${clean.slice(0, 4)}-${clean.slice(4, 6)}`;
      }
    } else if (clean.length === 5) {
      if (/^[A-Z]{3}[0-9]{2}$/.test(clean)) {
        formatted = `${clean.slice(0, 3)}-${clean.slice(3, 5)}`;
      }
    }

    setPlateNumber(formatted);
    setAntiPassbackError(null);

    // Auto-detection of Agreements / Abonados
    if (clean.length >= 5 && !bypassAgreementPopup) {
      const agr = findAgreementByPlate(clean) || findAgreementByPlate(formatted);
      if (agr) {
        setDetectedAgreement(agr);
        setShowAgreementModal(true);
      }
    }

    // Check customer database for this plate
    if (clean.length >= 4) {
      const found = findCustomerByPlate(clean) || findCustomerByPlate(formatted);
      if (found) {
        setMatchedCustomer(found);
        setCustomerName(found.name);
        setCustomerRut(found.rut || '');
        setCustomerEmail(found.email || '');
        if (found.phone) setPhone(found.phone);
        if (found.agreementType) {
          if (found.agreementType === 'Convenio Empresa' || found.agreementType === 'convenio') {
            setTariffType('convenio');
          } else if (found.agreementType === 'Abonado Mensual' || found.agreementType === 'mensual') {
            setTariffType('mensual');
          } else if (found.agreementType === 'tarifa_plana') {
            setTariffType('tarifa_plana');
          } else {
            setTariffType('estandar');
          }
        }
      } else {
        setMatchedCustomer(null);
      }
    } else {
      setMatchedCustomer(null);
    }
  };

  const handleExecuteRegistration = (forcedPlate?: string) => {
    const targetPlate = (forcedPlate || plateNumber).trim().toUpperCase();
    if (!targetPlate) {
      plateInputRef.current?.focus();
      return;
    }

    // Auto-detection of Agreements / Abonados
    if (!bypassAgreementPopup) {
      const agr = findAgreementByPlate(targetPlate);
      if (agr) {
        setDetectedAgreement(agr);
        setShowAgreementModal(true);
        return;
      }
    }

    // Check standard plate structure if not forced
    if (!forcedPlate) {
      const isValid = validateChileanPlateFormat(targetPlate);
      if (!isValid && targetPlate.length > 0) {
        setPendingForcePlate(targetPlate);
        setShowForcePlateModal(true);
        return;
      }
    }

    const finalSlot = selectedSlotCode || (suggestedSlot ? suggestedSlot.code : 'A-01');

    try {
      const cleanPhone = phone.trim() !== '+56 9' && phone.trim() !== '+56 9 ' ? phone.trim() : undefined;
      const notes = cleanPhone ? `WhatsApp: ${cleanPhone}` : undefined;

      const customerData = (customerName.trim() || customerRut.trim() || cleanPhone) ? {
        name: customerName.trim() || `Cliente ${targetPlate}`,
        rut: customerRut.trim() || undefined,
        phone: cleanPhone,
        email: customerEmail.trim() || undefined,
        agreementType: tariffType
      } : undefined;

      const ticket = registerEntry(
        targetPlate,
        vehicleType,
        finalSlot,
        notes,
        customerData,
        tariffType
      );

      setCreatedTicket(ticket);
      
      // Auto print if checked
      if (printPhysicalTicket) {
        setTimeout(() => {
          window.print();
        }, 100);
      }

      // Auto WhatsApp open if checked and phone provided
      if (sendWhatsApp && cleanPhone) {
        const cleanDigits = cleanPhone.replace(/[^0-9]/g, '');
        const text = encodeURIComponent(
          `🅿️ *CORDANO PARKING OPS — COMPROBANTE DE INGRESO*\n\n` +
          `• N° Ticket: ${ticket.ticketCode}\n` +
          `• Patente: ${ticket.plateNumber}\n` +
          `• Tipo: ${ticket.vehicleType}\n` +
          `• Slot Asignado: ${ticket.slotCode}\n` +
          `• Hora Ingreso: ${new Date(ticket.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}\n` +
          `• Tarifa: $${tariffConfig.vehicleRates[vehicleType]?.minuteRate || 40}/min (${tariffConfig.gracePeriodMinutes} min de gracia gratis)\n\n` +
          `Conserve este mensaje para registrar su salida en caja.`
        );
        // In-app WhatsApp link or clipboard
        if (navigator.clipboard) {
          navigator.clipboard.writeText(`https://wa.me/${cleanDigits}?text=${text}`).catch(() => {});
        }
      }

      // Reset form fields
      setPlateNumber('');
      setPhone('+56 9 ');
      setCustomerName('');
      setCustomerRut('');
      setCustomerEmail('');
      setTariffType('estandar');
      setMatchedCustomer(null);
      setAntiPassbackError(null);
      setShowForcePlateModal(false);
      setBypassAgreementPopup(false);
      plateInputRef.current?.focus();
    } catch (err: any) {
      setAntiPassbackError(err.message || 'Error al procesar el ingreso');
    }
  };

  const handleConfirmAgreementEntry = () => {
    if (!detectedAgreement) return;
    const finalSlot = selectedSlotCode || (suggestedSlot ? suggestedSlot.code : 'A-01');
    try {
      const ticket = registerEntry(
        detectedAgreement.plateNumber,
        vehicleType,
        finalSlot,
        `CONVENIO_${detectedAgreement.agreementType.toUpperCase()} - ${detectedAgreement.companyName} (Sin cobro en caja)`,
        {
          name: `${detectedAgreement.contactName} (${detectedAgreement.companyName})`,
          phone: detectedAgreement.phone,
          agreementType: 'convenio',
          rut: detectedAgreement.rutCompany,
        },
        'convenio'
      );

      setShowAgreementModal(false);
      setCreatedTicket(ticket);
      setPlateNumber('');
      setPhone('+56 9 ');
      setCustomerName('');
      setCustomerRut('');
      setCustomerEmail('');
      setTariffType('estandar');
      setBypassAgreementPopup(false);
      setAntiPassbackError(null);
    } catch (err: any) {
      setAntiPassbackError(err.message || 'Error al registrar ingreso de convenio');
      setShowAgreementModal(false);
    }
  };

  const handleGoToAgreementsModule = () => {
    setShowAgreementModal(false);
    if (onNavigate) {
      onNavigate('operacion_convenios');
    }
  };

  const handleCancelAgreementPopup = () => {
    setShowAgreementModal(false);
    setBypassAgreementPopup(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecuteRegistration();
    }
  };

  const currentRate = tariffConfig.vehicleRates[vehicleType] || { minuteRate: 40 };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* 1. TOP BAR */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        {/* Left: Back button & Title */}
        <div className="flex items-center space-x-3.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
            </button>
          )}

          <div className="w-9 h-9 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
            <Car className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="font-bold text-slate-900">[ MÓDULO: INGRESO DE VEHÍCULOS ]</span>
              <span>·</span>
              <span>Validación Anti-passback</span>
            </div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
              Registro de Ingreso a Pista
            </h1>
          </div>
        </div>

        {/* Right: Availability Counter & Chile Local Clock */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Availability Counter */}
          <div className="bg-slate-50 border border-slate-300 px-3.5 py-1.5 rounded flex items-center space-x-3">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase">
                Plazas Disponibles
              </span>
              <div className="flex items-baseline space-x-1 font-mono">
                <span className="text-lg font-black text-slate-900">
                  {freeCount}
                </span>
                <span className="text-xs text-slate-500 font-normal">/ {totalSlots}</span>
              </div>
            </div>
          </div>

          {/* Local Chile Clock */}
          <div className="bg-slate-50 border border-slate-300 text-slate-900 px-3.5 py-1.5 rounded text-right hidden sm:block">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">
              Hora Entrada (Iquique)
            </span>
            <span className="font-mono text-xs font-bold text-slate-800">
              {chileTime || 'Cargando...'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Panel (Form) vs Right Panel (Slot Map & Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* =========================================
            LEFT PANEL: FORMULARIO ULTRA-RÁPIDO (5 cols)
            ========================================= */}
        <div className="lg:col-span-5 space-y-4 font-mono text-xs">
          <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-300 shadow-xs space-y-5">
            
            {/* Anti-Passback Error Notice */}
            {antiPassbackError && (
              <div className="p-3 bg-slate-100 border border-slate-400 rounded text-slate-800 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">[ BLOQUEO ANTI-PASSBACK ]</span>
                  <p className="mt-0.5 leading-relaxed font-sans">{antiPassbackError}</p>
                </div>
              </div>
            )}

            {/* 1. Input Patente Chilena con Autofocus */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-600" />
                  <span>[ PATENTE DEL VEHÍCULO ]</span>
                </label>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                  Enter ↵
                </span>
              </div>

              <div className="relative">
                <input
                  ref={plateInputRef}
                  type="text"
                  value={plateNumber}
                  onChange={(e) => handleFormatPlate(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ABCD-12"
                  maxLength={7}
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded px-4 py-3 text-2xl font-black font-mono tracking-widest text-slate-900 uppercase transition-all outline-none placeholder:text-slate-400"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 bg-white border border-slate-300 px-2 py-0.5 rounded">
                  <span className="text-[10px] font-black text-slate-900 font-mono">CHILE</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-sans flex items-center justify-between">
                <span>Formato: BBBB-11 o BB-1111</span>
                {plateNumber && (
                  <span className="text-slate-900 font-bold font-mono text-[10px]">
                    [ PATENTE DETECTADA ]
                  </span>
                )}
              </p>
            </div>

            {/* 2. Selector Tipo de Vehículo con Tarifas */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                [ TIPO DE VEHÍCULO & TARIFA ]
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    type: 'Automóvil' as VehicleType,
                    label: 'Auto',
                    rate: '$40/min',
                    icon: Car,
                  },
                  {
                    type: 'Motocicleta' as VehicleType,
                    label: 'Moto',
                    rate: '$25/min',
                    icon: Bike,
                  },
                  {
                    type: 'Camioneta' as VehicleType,
                    label: 'Camioneta/SUV',
                    rate: '$50/min',
                    icon: Truck,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = vehicleType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setVehicleType(item.type)}
                      className={`p-3 rounded border text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-bold block">{item.label}</span>
                      <span className="text-[10px] font-mono opacity-80">{item.rate}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Teléfono */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-600" />
                <span>[ TELÉFONO WHATSAPP (OPCIONAL) ]</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="+56 9 1234 5678"
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs font-mono font-bold text-slate-900 outline-none bg-white placeholder-slate-400"
              />
            </div>

            {/* Matched Customer Badge if recognized */}
            {matchedCustomer && (
              <div className="p-3 bg-slate-50 border border-slate-300 rounded flex items-center justify-between text-xs text-slate-800">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-slate-700 shrink-0" />
                  <div>
                    <span className="font-bold block text-slate-900">{matchedCustomer.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {matchedCustomer.agreementType?.toUpperCase() || 'CLIENTE REGISTRADO'} {matchedCustomer.rut ? `· ${matchedCustomer.rut}` : ''}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">
                  Reconocido
                </span>
              </div>
            )}

            {/* 3. Indicador de Minutos de Gracia */}
            <div className="p-3 border border-dashed border-slate-300 rounded bg-slate-50/80 flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-slate-800 shrink-0" />
                <span className="font-bold">Tolerancia de Gracia Activa:</span>
              </div>
              <span className="font-mono font-bold bg-white text-slate-900 border border-slate-300 px-2 py-0.5 rounded text-[11px]">
                {tariffConfig.gracePeriodMinutes} min sin costo
              </span>
            </div>

            {/* 4. Checkboxes de Emisión */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printPhysicalTicket}
                  onChange={(e) => setPrintPhysicalTicket(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900"
                />
                <span className="flex items-center space-x-1">
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Imprimir Ticket</span>
                </span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendWhatsApp}
                  onChange={(e) => setSendWhatsApp(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900"
                />
                <span className="flex items-center space-x-1">
                  <Share2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>WhatsApp</span>
                </span>
              </label>
            </div>

            {/* 5. BOTÓN PRINCIPAL DE ACCIÓN */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleExecuteRegistration()}
                className="w-full py-3.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded border border-slate-900 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>[ REGISTRAR ENTRADA Y EMITIR TICKET ]</span>
                <span className="text-[10px] font-mono bg-slate-700 px-1.5 py-0.2 rounded text-white ml-1">
                  Enter ↵
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================
            RIGHT PANEL: ASIGNACIÓN DE SLOT & PREVIEW TÉRMICO (7 cols)
            ========================================= */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Card 1: Slot Selection (Interactive Map / Suggestion) */}
          <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-300 shadow-xs space-y-4 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded inline-block">
                  [ MATRIZ DE PLAZAS: 30 SLOTS ]
                </span>
                <h3 className="text-xs font-bold text-slate-900 mt-1 uppercase">
                  Asignación de Estacionamiento
                </h3>
              </div>

              {suggestedSlot && (
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-slate-500">Slot Asignado:</span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                    {selectedSlotCode || suggestedSlot.code}
                  </span>
                </div>
              )}
            </div>

            {/* Interactive Grid of 30 Slots */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Haga clic en un slot libre para asignarlo:</span>
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded border border-dashed border-slate-400 bg-slate-50 inline-block"></span>
                    <span>Libre</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded bg-slate-900 inline-block"></span>
                    <span>Asignado</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded bg-slate-200 inline-block"></span>
                    <span>Ocupado</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
                {slots.map((s) => {
                  const isAvailable = s.status === 'disponible';
                  const isCurrentSelected = selectedSlotCode === s.code;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedSlotCode(s.code)}
                      className={`p-2 rounded text-center font-mono font-bold text-xs transition cursor-pointer flex flex-col items-center justify-center border ${
                        isCurrentSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : isAvailable
                          ? 'border-dashed border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 hover:border-slate-400'
                          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      }`}
                      title={`${s.code} • ${s.zone} (${s.status})`}
                    >
                      <span className="text-[11px] leading-tight">{s.code}</span>
                      <span className="text-[9px] font-normal block mt-0.5">
                        {isAvailable ? 'Libre' : 'Ocup'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 2: Live Thermal Ticket Preview */}
          <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-300 shadow-xs space-y-3.5 font-mono">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold uppercase text-slate-900 flex items-center space-x-1.5">
                <Barcode className="w-4 h-4 text-slate-700" />
                <span>[ VISTA PREVIA TICKET TÉRMICO ESC/POS 80mm ]</span>
              </span>
              <span className="text-[10px] text-slate-500">Impresión Garita</span>
            </div>

            <div className="bg-slate-50 border border-dashed border-slate-400 rounded p-5 text-slate-900 text-xs max-w-md mx-auto space-y-3">
              {/* Header */}
              <div className="text-center border-b border-dashed border-slate-300 pb-2 space-y-0.5">
                <p className="font-black text-sm tracking-wider uppercase">CORDANO PARKING OPS</p>
                <p className="text-[10px] text-slate-500">RUT: 76.892.110-3 · Serrano 447, Iquique</p>
                <p className="text-[10px] text-slate-600 font-bold">[ TICKET DE ENTRADA EXPRÉS ]</p>
              </div>

              {/* License Plate Display */}
              <div className="border border-slate-300 bg-white rounded p-2.5 text-center">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 block font-bold">
                  PATENTE VEHÍCULO
                </span>
                <span className="text-2xl font-black tracking-widest text-slate-900 block mt-0.5">
                  {plateNumber || 'XXXX-00'}
                </span>
                <span className="text-[10px] text-slate-600">
                  {vehicleType} · Slot: {selectedSlotCode || (suggestedSlot ? suggestedSlot.code : 'A-01')}
                </span>
              </div>

              {/* Ticket Details */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">FECHA/HORA:</span>
                  <span className="font-bold text-slate-900">{new Date().toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TARIFA:</span>
                  <span className="font-bold text-slate-900">${currentRate.minuteRate} CLP / min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GRACIA:</span>
                  <span className="font-bold text-slate-900">{tariffConfig.gracePeriodMinutes} min sin costo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">OPERADOR:</span>
                  <span className="font-bold text-slate-900">{user.name}</span>
                </div>
              </div>

              {/* Barcode Simulation */}
              <div className="pt-1 text-center">
                <div className="h-8 bg-slate-200 mx-auto w-40 flex items-center justify-center rounded border border-slate-300">
                  <div className="flex space-x-1 items-center h-full px-2">
                    {[3,1,4,2,3,1,5,2,3,1,4,2,3,1,4].map((w, i) => (
                      <div key={i} className="bg-slate-900 h-full" style={{ width: `${w}px` }}></div>
                    ))}
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 font-mono mt-1">* T-CHECKIN-PREVIEW *</p>
              </div>

              {/* Legal Responsibility Clause */}
              <div className="border-t border-dashed border-slate-300 pt-2 text-[9px] text-slate-500 text-center leading-tight">
                Conserve este comprobante para retirar el móvil.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN: FORZAR INGRESO PATENTE NO ESTÁNDAR */}
      <AnimatePresence>
        {showForcePlateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0B0F19]/95 w-full max-w-sm rounded-3xl border border-white/15 p-6 shadow-glass space-y-4 font-sans text-white"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800/20 text-amber-300 border border-amber-500/30 flex items-center justify-center mx-auto shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-base text-white">
                  ¿Desea forzar ingreso de patente?
                </h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  La patente <span className="font-mono font-bold text-pink-300 bg-white/10 px-2 py-0.5 rounded-md">{pendingForcePlate}</span> no coincide con la máscara estándar chilena (BBBB-11 o BB-1111).
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForcePlateModal(false)}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold text-[#CBD5E1] hover:bg-white/10 border border-white/10 transition cursor-pointer"
                >
                  Corregir Patente
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteRegistration(pendingForcePlate)}
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
                >
                  Forzar Ingreso
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE DETECCIÓN DE CONVENIO / ABONADO */}
      <ModalConvenioDetectado
        isOpen={showAgreementModal}
        agreement={detectedAgreement}
        onConfirmEntry={handleConfirmAgreementEntry}
        onGoToModule={handleGoToAgreementsModule}
        onCancel={handleCancelAgreementPopup}
      />

      {/* Ticket Modal Comprobante (si se generó) */}
      {createdTicket && (
        <TicketModal
          ticket={createdTicket}
          onClose={() => setCreatedTicket(null)}
          title="Ticket de Entrada Emitido"
        />
      )}
    </div>
  );
};
