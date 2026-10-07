import React, { useState, useEffect } from 'react';
import { useParking } from '../context/ParkingContext';
import { Ticket, PaymentMethod } from '../types';
import { AdminAuthModal } from '../components/AdminAuthModal';
import {
  DollarSign,
  X,
  Search,
  Clock,
  Car,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  CreditCard,
  Banknote,
  Send,
  HelpCircle,
  Tag
} from 'lucide-react';

interface ProcesoPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedTicketId?: string | null;
  onSuccessTicket: (ticket: Ticket) => void;
}

export const ProcesoPagoModal: React.FC<ProcesoPagoModalProps> = ({
  isOpen,
  onClose,
  preselectedTicketId,
  onSuccessTicket,
}) => {
  const { tickets, calculateFee, processPayment, tariffConfig } = useParking();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [isLostTicket, setIsLostTicket] = useState<boolean>(false);
  const [voucherNumber, setVoucherNumber] = useState<string>('');
  const [transferVerified, setTransferVerified] = useState<boolean>(false);
  
  // Courtesy / Discount panel state
  const [isDiscountPanelOpen, setIsDiscountPanelOpen] = useState<boolean>(false);
  const [selectedCourtesyType, setSelectedCourtesyType] = useState<'cortesia_100' | 'convenio_50' | 'personalizado'>('cortesia_100');
  const [customCourtesyReason, setCustomCourtesyReason] = useState<string>('Visita Proveedor / Técnico');
  const [customDiscountValue, setCustomDiscountValue] = useState<string>('');
  
  // Admin auth modal state
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<'discount' | 'lostTicket' | null>(null);
  const [authorizedAdmin, setAuthorizedAdmin] = useState<string | undefined>(undefined);

  const [error, setError] = useState('');

  // Handle preselected ticket or search
  useEffect(() => {
    if (preselectedTicketId) {
      const found = tickets.find((t) => t.id === preselectedTicketId && t.status === 'activo');
      if (found) {
        setSelectedTicket(found);
      }
    }
  }, [preselectedTicketId, tickets]);

  if (!isOpen) return null;

  const activeTickets = tickets.filter((t) => t.status === 'activo');

  const filteredTickets = searchQuery.trim()
    ? activeTickets.filter(
        (t) =>
          t.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.slotCode.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeTickets;

  // Fee calculation for current selected ticket
  const stayInfo = selectedTicket ? calculateFee(selectedTicket) : null;
  const rawTotal = isLostTicket
    ? tariffConfig.lostTicketFee
    : stayInfo
    ? stayInfo.totalAmount
    : 0;

  const finalTotal = Math.max(0, rawTotal - discountAmount);
  const numPaidAmount = parseFloat(paidAmount) || 0;
  const changeAmount = Math.max(0, numPaidAmount - finalTotal);

  const handleSelectTicket = (t: Ticket) => {
    setSelectedTicket(t);
    setDiscountAmount(0);
    setDiscountReason('');
    setIsLostTicket(false);
    setPaidAmount('');
    setVoucherNumber('');
    setTransferVerified(false);
    setIsDiscountPanelOpen(false);
    setError('');
  };

  const handleApplyCourtesyOrDiscount = (mode: 'pendiente' | 'pin_supervisor') => {
    let calculatedDiscount = 0;
    let calculatedReason = customCourtesyReason.trim() || 'Cortesía Operativa';

    if (selectedCourtesyType === 'cortesia_100') {
      calculatedDiscount = rawTotal;
      calculatedReason = `Cortesía 100%: ${customCourtesyReason.trim() || 'Proveedor / Técnico'}`;
    } else if (selectedCourtesyType === 'convenio_50') {
      calculatedDiscount = Math.round(rawTotal * 0.5);
      calculatedReason = `Convenio 50%: ${customCourtesyReason.trim() || 'Comercial'}`;
    } else {
      const parsed = parseInt(customDiscountValue, 10);
      calculatedDiscount = isNaN(parsed) ? 0 : Math.min(rawTotal, Math.max(0, parsed));
      calculatedReason = `Descuento Fijo: ${customCourtesyReason.trim() || 'Aprobación Especial'}`;
    }

    if (mode === 'pendiente') {
      setDiscountAmount(calculatedDiscount);
      setDiscountReason(`[Pendiente Aprobación] ${calculatedReason}`);
      setAuthorizedAdmin('PENDIENTE_SUPERVISOR');
      setIsDiscountPanelOpen(false);
    } else {
      // Trigger PIN modal
      setPendingAdminAction('discount');
      setIsAdminAuthOpen(true);
    }
  };

  const handleLostTicketClick = () => {
    setPendingAdminAction('lostTicket');
    setIsAdminAuthOpen(true);
  };

  const handleAdminSuccess = (adminName: string) => {
    setAuthorizedAdmin(adminName);
    if (pendingAdminAction === 'discount') {
      let calculatedDiscount = 0;
      let calculatedReason = customCourtesyReason.trim() || 'Cortesía Operativa';

      if (selectedCourtesyType === 'cortesia_100') {
        calculatedDiscount = rawTotal;
        calculatedReason = `Cortesía 100%: ${customCourtesyReason.trim() || 'Proveedor / Técnico'}`;
      } else if (selectedCourtesyType === 'convenio_50') {
        calculatedDiscount = Math.round(rawTotal * 0.5);
        calculatedReason = `Convenio 50%: ${customCourtesyReason.trim() || 'Comercial'}`;
      } else {
        const parsed = parseInt(customDiscountValue, 10);
        calculatedDiscount = isNaN(parsed) ? 0 : Math.min(rawTotal, Math.max(0, parsed));
        calculatedReason = `Descuento: ${customCourtesyReason.trim() || 'Especial'}`;
      }

      setDiscountAmount(calculatedDiscount);
      setDiscountReason(calculatedReason);
      setIsDiscountPanelOpen(false);
    } else if (pendingAdminAction === 'lostTicket') {
      setIsLostTicket(true);
    }
    setPendingAdminAction(null);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedTicket) {
      setError('Seleccione un ticket para cobrar');
      return;
    }

    if (paymentMethod === 'efectivo' && numPaidAmount < finalTotal) {
      setError(`Monto ingresado ($${numPaidAmount.toLocaleString('es-CL')}) insuficiente para cubrir el total ($${finalTotal.toLocaleString('es-CL')})`);
      return;
    }

    if (paymentMethod === 'transferencia') {
      if (!voucherNumber.trim()) {
        setError('Debe ingresar el N° de comprobante o código de la transferencia bancaria.');
        return;
      }
      if (!transferVerified) {
        setError('Debe marcar la casilla confirmando que verificó la recepción de la transferencia en la cuenta del estacionamiento.');
        return;
      }
    }

    try {
      const result = processPayment({
        ticketId: selectedTicket.id,
        paymentMethod,
        paidAmount: paymentMethod === 'efectivo' ? numPaidAmount : finalTotal,
        discountAmount,
        discountReason,
        isLostTicket,
        authorizedByAdmin: authorizedAdmin,
        voucherNumber: voucherNumber.trim() || undefined,
      });

      onClose();
      onSuccessTicket(result.ticket);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-['Manrope',sans-serif]">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#e2e2e4] flex flex-col">
          
          {/* Header */}
          <div className="bg-[#000722] p-5 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 p-2 rounded-xl">
                <Receipt className="w-6 h-6 text-[#0071e3]" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg leading-tight">Proceso de Pago & Salida (POS)</h3>
                <p className="text-white/70 text-xs mt-0.5 font-medium">Cálculo de Tarifas & Emisión de Vuelto</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1">
            
            {/* Step 1: Ticket Search if not selected */}
            {!selectedTicket ? (
              <div className="space-y-4">
                <label className="block text-xs font-extrabold text-[#1a1c1d] uppercase tracking-wider">
                  Buscar Ticket Activo por Patente o N° Ticket
                </label>
                <div className="relative">
                  <Search className="w-5 h-5 text-[#717785] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ej: LK8421, T-84920 o Slot A-01..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#c1c6d6] text-base font-bold text-[#1a1c1d] focus:border-[#0071e3] outline-none"
                    autoFocus
                  />
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredTickets.length === 0 ? (
                    <div className="p-8 text-center text-[#717785] text-sm font-medium bg-[#f9f9fb] rounded-xl border border-[#e2e2e4]">
                      No se encontraron vehículos activos con esta búsqueda.
                    </div>
                  ) : (
                    filteredTickets.map((t) => {
                      const stay = calculateFee(t);
                      return (
                        <button
                          key={t.id}
                          onClick={() => handleSelectTicket(t)}
                          className="w-full p-3.5 rounded-xl border border-[#e2e2e4] hover:border-[#0071e3] hover:bg-[#d7e2ff]/20 transition-all text-left flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="bg-[#000722] text-white font-mono font-bold text-sm px-2.5 py-1 rounded-lg">
                              {t.plateNumber}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-sm text-[#1a1c1d]">{t.ticketCode}</span>
                                <span className="text-xs bg-[#f3f3f5] text-[#414753] px-2 py-0.5 rounded font-bold">
                                  {t.vehicleType}
                                </span>
                              </div>
                              <p className="text-xs text-[#717785] mt-0.5 font-medium">
                                Slot {t.slotCode} • Entrada: {new Date(t.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-base text-[#0059b5] block">
                              ${stay.totalAmount.toLocaleString('es-CL')} CLP
                            </span>
                            <span className="text-[11px] text-[#717785] font-medium">
                              {stay.durationMinutes} min estadía
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* Step 2: Selected Ticket Billing Breakdown */
              <form onSubmit={handleSubmitPayment} className="space-y-6">
                
                {/* Vehicle Header Card */}
                <div className="bg-[#000722] text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#0071e3] text-white font-mono font-black text-xl px-3 py-1 rounded-xl">
                      {selectedTicket.plateNumber}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-base">{selectedTicket.ticketCode}</span>
                        <span className="text-xs bg-white/10 text-[#d7e2ff] px-2 py-0.5 rounded font-bold border border-white/10">
                          Slot {selectedTicket.slotCode}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 font-medium">
                        {selectedTicket.vehicleType} • Entrada: {new Date(selectedTicket.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="text-xs text-[#d7e2ff] hover:text-white underline font-bold cursor-pointer"
                  >
                    Cambiar vehículo
                  </button>
                </div>

                {/* Stay Breakdown Table */}
                <div className="bg-[#f9f9fb] rounded-xl p-4 border border-[#e2e2e4] space-y-2 text-xs">
                  <div className="flex justify-between text-[#414753] font-medium">
                    <span>Tiempo transcurrido:</span>
                    <span className="font-mono font-bold text-[#1a1c1d]">{stayInfo?.durationMinutes} minutos</span>
                  </div>

                  {stayInfo?.isGracePeriod ? (
                    <div className="bg-slate-900 text-slate-800 p-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 border border-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-slate-800" />
                      <span>Dentro del período de gracia ({tariffConfig.gracePeriodMinutes} min). Cobro $0 CLP.</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-[#414753] font-medium">
                        <span>Tarifa base ({selectedTicket.vehicleType}):</span>
                        <span className="font-mono text-[#1a1c1d]">${stayInfo?.subtotalAmount.toLocaleString('es-CL')} CLP</span>
                      </div>

                      {stayInfo && stayInfo.nightSurcharge > 0 && (
                        <div className="flex justify-between text-[#0059b5] font-semibold">
                          <span>Recargo Nocturno ({tariffConfig.nightSurchargePercent}%):</span>
                          <span className="font-mono">+${stayInfo.nightSurcharge.toLocaleString('es-CL')} CLP</span>
                        </div>
                      )}

                      {isLostTicket && (
                        <div className="flex justify-between text-[#ba1a1a] font-bold">
                          <span>Multa Ticket Perdido:</span>
                          <span className="font-mono">${tariffConfig.lostTicketFee.toLocaleString('es-CL')} CLP</span>
                        </div>
                      )}

                      {discountAmount > 0 && (
                        <div className="flex justify-between text-amber-800 font-bold bg-amber-50 p-1.5 rounded border border-amber-200">
                          <span>Descuento aplicado ({discountReason || 'Convenio'}):</span>
                          <span className="font-mono">-${discountAmount.toLocaleString('es-CL')} CLP</span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="border-t border-[#e2e2e4] pt-2 flex justify-between items-center">
                    <span className="font-extrabold text-[#1a1c1d] text-sm">TOTAL A COBRAR:</span>
                    <span className="font-mono font-black text-2xl text-[#0059b5]">
                      ${finalTotal.toLocaleString('es-CL')} CLP
                    </span>
                  </div>
                </div>

                {/* Discounts & Special Actions */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsDiscountPanelOpen(!isDiscountPanelOpen)}
                      className={`px-3.5 py-1.5 rounded-full font-bold flex items-center space-x-1.5 transition cursor-pointer border ${
                        discountAmount > 0
                          ? 'bg-amber-100 text-amber-900 border-slate-400'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-slate-300'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>{discountAmount > 0 ? `Descuento: -$${discountAmount.toLocaleString('es-CL')} (Editar)` : 'Aplicar Descuento / Cortesía ($0)'}</span>
                    </button>

                    {discountAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountAmount(0);
                          setDiscountReason('');
                          setAuthorizedAdmin(undefined);
                        }}
                        className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-800 underline font-semibold cursor-pointer"
                      >
                        Quitar descuento
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleLostTicketClick}
                      className="px-3.5 py-1.5 bg-[#ffdad6]/40 hover:bg-[#ffdad6] text-[#93000a] border border-[#ffdad6] rounded-full font-bold flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Marcar Ticket Perdido</span>
                    </button>
                  </div>

                  {/* Expandable Courtesy / Discount Selector */}
                  {isDiscountPanelOpen && (
                    <div className="bg-[#fff9eb] border border-slate-300/80 rounded-2xl p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                        <span className="font-extrabold text-amber-950 uppercase tracking-wide">
                          Gestión de Descuento & Tarifas de Cortesía
                        </span>
                        <span className="text-[11px] text-amber-800 font-medium">
                          Auditoría de Salida
                        </span>
                      </div>

                      {/* Presets */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourtesyType('cortesia_100');
                            setCustomCourtesyReason('Visita Proveedor / Técnico');
                          }}
                          className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer ${
                            selectedCourtesyType === 'cortesia_100'
                              ? 'bg-slate-800 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100/50'
                          }`}
                        >
                          <div className="text-xs">Cortesía 100% ($0)</div>
                          <div className="text-[10px] opacity-80 font-normal">Técnicos, Proveedores, Admin</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourtesyType('convenio_50');
                            setCustomCourtesyReason('Convenio Comercial');
                          }}
                          className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer ${
                            selectedCourtesyType === 'convenio_50'
                              ? 'bg-slate-800 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100/50'
                          }`}
                        >
                          <div className="text-xs">Convenio 50%</div>
                          <div className="text-[10px] opacity-80 font-normal">Mitad de tarifa estándar</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedCourtesyType('personalizado')}
                          className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer ${
                            selectedCourtesyType === 'personalizado'
                              ? 'bg-slate-800 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100/50'
                          }`}
                        >
                          <div className="text-xs">Monto Fijo ($)</div>
                          <div className="text-[10px] opacity-80 font-normal">Rebaja en pesos chilenos</div>
                        </button>
                      </div>

                      {/* Reason & Value */}
                      <div className="space-y-2 pt-1">
                        <div>
                          <label className="font-bold text-amber-950 block mb-1">
                            Motivo / Detalle de la Cortesía u Observación:
                          </label>
                          <input
                            type="text"
                            value={customCourtesyReason}
                            onChange={(e) => setCustomCourtesyReason(e.target.value)}
                            placeholder="Ej: Técnico de Telecomunicaciones, Visita Municipalidad..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        {selectedCourtesyType === 'personalizado' && (
                          <div>
                            <label className="font-bold text-amber-950 block mb-1">
                              Monto de Descuento ($ CLP):
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={rawTotal}
                              value={customDiscountValue}
                              onChange={(e) => setCustomDiscountValue(e.target.value)}
                              placeholder={`Máximo $${rawTotal}`}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        )}
                      </div>

                      {/* Approval Mode Choice */}
                      <div className="pt-2 border-t border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                        <span className="text-[11px] text-amber-900">
                          Seleccione la modalidad de validación:
                        </span>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleApplyCourtesyOrDiscount('pendiente')}
                            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                          >
                            Dejar Pendiente Aprobación
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyCourtesyOrDiscount('pin_supervisor')}
                            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
                          >
                            Autorizar con Clave Supervisor
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-extrabold text-[#1a1c1d] uppercase tracking-wider mb-2">
                    Medio de Pago
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'efectivo', label: 'Efectivo', icon: Banknote },
                      { id: 'tarjeta_debito', label: 'Débito', icon: CreditCard },
                      { id: 'tarjeta_credito', label: 'Crédito', icon: CreditCard },
                      { id: 'transferencia', label: 'Transferencia', icon: Send },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = paymentMethod === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPaymentMethod(item.id as PaymentMethod)}
                          className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#0071e3] bg-[#d7e2ff]/30 text-[#001b3f] shadow-xs'
                              : 'border-[#e2e2e4] bg-white text-[#414753] hover:border-[#c1c6d6]'
                          }`}
                        >
                          <Icon className="w-5 h-5 text-[#0071e3]" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Specific payment details per method */}
                {paymentMethod === 'transferencia' && (
                  <div className="bg-[#fbfbfc] p-4 rounded-2xl border border-slate-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                        Transferencia Bancaria Directa
                      </span>
                      <span className="text-[11px] text-slate-800 bg-slate-800 px-2 py-0.5 rounded-full font-bold">
                        Sin Monto Mínimo
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1D1D1F] block">
                        N° de Comprobante / Código de Transferencia <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={voucherNumber}
                        onChange={(e) => setVoucherNumber(e.target.value)}
                        placeholder="Ej: 19482019 / Transf. BancoEstado"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d6] text-xs font-mono font-bold bg-white focus:border-[#0F172A] outline-none"
                      />
                    </div>

                    <div className="p-3 bg-white border border-slate-300 rounded-xl flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="chk-transfer-verified"
                        checked={transferVerified}
                        onChange={(e) => setTransferVerified(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-slate-800 focus:ring-purple-700 cursor-pointer"
                      />
                      <label htmlFor="chk-transfer-verified" className="text-xs text-[#1D1D1F] cursor-pointer select-none">
                        <strong>Confirmación Obligatoria:</strong> Confirmo que el comprobante de transferencia bancaria es legítimo y ha sido verificado e ingresado en la cuenta corriente.
                      </label>
                    </div>
                  </div>
                )}

                {(paymentMethod === 'tarjeta_debito' || paymentMethod === 'tarjeta_credito') && (
                  <div className="bg-[#fbfbfc] p-4 rounded-2xl border border-blue-200 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-blue-950 uppercase tracking-wide">
                        Terminal POS Standalone (Débito / Crédito)
                      </span>
                      <span className="text-[10px] text-slate-800 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                        Control Operativo
                      </span>
                    </div>
                    <p className="text-[#515154] leading-relaxed">
                      El operador debe ingresar manualmente el monto de <strong>${finalTotal.toLocaleString('es-CL')} CLP</strong> en la máquina POS física. Dicha máquina emitirá el comprobante de pago y boleta electrónica ante el SII.
                    </p>
                    <div>
                      <label className="text-[11px] font-bold text-[#717785] block mb-1">
                        N° Operación / Código Voucher del POS (Opcional para cuadratura de caja):
                      </label>
                      <input
                        type="text"
                        value={voucherNumber}
                        onChange={(e) => setVoucherNumber(e.target.value)}
                        placeholder="Ej: OP-8492"
                        className="w-full px-3 py-2 rounded-xl border border-[#c1c6d6] text-xs font-mono bg-white focus:border-[#0F172A] outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Cash Change Calculator */}
                {paymentMethod === 'efectivo' && finalTotal > 0 && (
                  <div className="bg-[#f9f9fb] p-4 rounded-2xl border border-[#e2e2e4] space-y-3">
                    <label className="block text-xs font-extrabold text-[#1a1c1d] uppercase tracking-wider">
                      Monto Recibido de Cliente (Efectivo)
                    </label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#717785]">$</span>
                        <input
                          type="number"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          placeholder={finalTotal.toString()}
                          className="w-full pl-8 pr-4 py-2 rounded-xl border border-[#c1c6d6] text-lg font-bold font-mono focus:border-[#0071e3] outline-none bg-white"
                        />
                      </div>
                      
                      {/* Preset cash bills */}
                      <div className="flex space-x-1">
                        {[2000, 5000, 10000, 20000].map((bill) => (
                          <button
                            key={bill}
                            type="button"
                            onClick={() => setPaidAmount(bill.toString())}
                            className="px-2.5 py-1 bg-white border border-[#c1c6d6] hover:bg-[#f3f3f5] text-[#1a1c1d] font-mono text-xs font-bold rounded-lg cursor-pointer"
                          >
                            ${bill / 1000}k
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Vuelto / Change display */}
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#e2e2e4]">
                      <span className="text-xs font-bold text-[#414753] uppercase">Vuelto A Entregar:</span>
                      <span className={`font-mono font-black text-xl ${changeAmount > 0 ? 'text-slate-800' : 'text-[#717785]'}`}>
                        ${changeAmount.toLocaleString('es-CL')} CLP
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-[#ffdad6]/50 border border-[#ffdad6] text-[#93000a] p-3 rounded-xl text-xs font-bold">
                    {error}
                  </div>
                )}

                {/* Final Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#0071e3] hover:bg-[#0059b5] text-white font-bold rounded-full shadow-md transition text-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Procesar Pago & Liberar Slot</span>
                </button>

              </form>
            )}

          </div>
        </div>
      </div>

      {/* Admin Authorization Modal for sensitive overrides */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={handleAdminSuccess}
        title={pendingAdminAction === 'discount' ? 'Autorizar Descuento / Convenio' : 'Autorizar Ticket Perdido'}
      />
    </>
  );
};
