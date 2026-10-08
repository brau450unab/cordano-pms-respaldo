const fs = require('fs');

const content = `import React, { useState, useEffect, useRef } from 'react';
import { PaymentMethod } from '../../types';
import { AntifraudPinModal, PinModalType } from './AntifraudPinModal';

export interface PatioVehicle {
  slot: number;
  slotCode?: string;
  plate: string;
  cat: 'Sedán' | 'SUV' | 'Moto';
  rate: number;
  entry: string;
  durationMin: number;
  client?: string;
  phone?: string;
  obs?: string;
  ticketId?: string;
  discount?: number;
  surcharge?: number;
}

export interface CashHistoryLog {
  time: string;
  type: 'APERTURA' | 'INGRESO' | 'COBRO' | 'RETIRO' | 'INGRESO_MANUAL';
  desc: string;
  method: string;
  amount: number;
  plate: string;
  isEgreso: boolean;
}

interface PosViewProps {
  initialSubtab?: 'entry' | 'exit' | 'history';
  activeVehicles: PatioVehicle[];
  historyLogs: CashHistoryLog[];
  onOpenTicketPreview: (data: {
    plate: string;
    category: 'Sedán' | 'SUV' | 'Moto';
    rate: number;
    name: string;
    phone: string;
    obs: string;
    slot: number;
  }) => void;
  onProcessCheckout: (
    vehicle: PatioVehicle,
    method: PaymentMethod,
    total: number
  ) => void;
  onOpenManualTransaction: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PosView: React.FC<PosViewProps> = ({
  initialSubtab = 'entry',
  activeVehicles,
  historyLogs,
  onOpenTicketPreview,
  onProcessCheckout,
  onOpenManualTransaction,
  onShowToast,
}) => {
  // POS Tabs: 'entry' | 'exit' | 'history'
  const [posTab, setPosTab] = useState<'entry' | 'exit' | 'history'>(initialSubtab);

  // Entry State
  const [entryPlate, setEntryPlate] = useState('');
  const [entryCategory, setEntryCategory] = useState<'Sedán' | 'SUV' | 'Moto'>('Sedán');
  const [entryRate, setEntryRate] = useState(35);
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  const [entryName, setEntryName] = useState('');
  const [entryPhone, setEntryPhone] = useState('');
  const [entryObs, setEntryObs] = useState('');
  const plateInputRef = useRef<HTMLInputElement>(null);

  // Exit State
  const [exitSearchQuery, setExitSearchQuery] = useState('');
  const [selectedExitVehicle, setSelectedExitVehicle] = useState<PatioVehicle | null>(null);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('tarjeta');
  const [cashGiven, setCashGiven] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedSurcharge, setAppliedSurcharge] = useState(0);
  const [pinModalType, setPinModalType] = useState<PinModalType>(null);
  const exitSearchInputRef = useRef<HTMLInputElement>(null);

  // Focus Management
  useEffect(() => {
    if (posTab === 'entry' && plateInputRef.current) {
      plateInputRef.current.focus();
    } else if (posTab === 'exit' && exitSearchInputRef.current && !selectedExitVehicle) {
      exitSearchInputRef.current.focus();
    }
  }, [posTab, selectedExitVehicle]);

  // Entry Handlers
  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlate = entryPlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleanPlate.length < 5) {
      onShowToast('Patente inválida (mín. 5 caracteres)', 'error');
      return;
    }
    const isInside = activeVehicles.some((v) => v.plate === cleanPlate);
    if (isInside) {
      onShowToast(\`El vehículo \${cleanPlate} ya se encuentra dentro del recinto.\`, 'error');
      return;
    }

    const availableSlotIndex = Array.from({ length: 30 }, (_, i) => i + 1).find(
      (s) => !activeVehicles.some((v) => v.slot === s)
    );
    if (!availableSlotIndex) {
      onShowToast('Patio lleno, no hay cupos disponibles', 'error');
      return;
    }

    onOpenTicketPreview({
      plate: cleanPlate,
      category: entryCategory,
      rate: entryRate,
      name: entryName.trim() || 'Particular',
      phone: entryPhone.trim(),
      obs: entryObs.trim(),
      slot: availableSlotIndex,
    });

    setEntryPlate('');
    setEntryName('');
    setEntryPhone('');
    setEntryObs('');
    setShowEntryDetails(false);
  };

  // Exit Handlers
  const exitFilteredVehicles = exitSearchQuery.trim().length > 0
      ? activeVehicles.filter(
          (v) =>
            v.plate.toUpperCase().includes(exitSearchQuery.trim().toUpperCase()) ||
            (v.ticketId && v.ticketId.toUpperCase().includes(exitSearchQuery.trim().toUpperCase()))
        )
      : [];

  const loadVehicleIntoExit = (v: PatioVehicle) => {
    setSelectedExitVehicle(v);
    setAppliedDiscount(v.discount || 0);
    setAppliedSurcharge(v.surcharge || 0);
    const baseVal = v.durationMin * (v.rate || 25);
    const roundedCash = Math.max(2000, Math.ceil(baseVal / 1000) * 1000);
    setCashGiven(roundedCash.toString());
  };

  const baseTotal = selectedExitVehicle ? selectedExitVehicle.durationMin * (selectedExitVehicle.rate || 25) : 0;
  const finalTotal = Math.max(0, baseTotal - appliedDiscount + appliedSurcharge);
  const netSubtotal = Math.round(finalTotal / 1.19);
  const ivaAmount = finalTotal - netSubtotal;
  const cashChange = Math.max(0, (parseFloat(cashGiven) || 0) - finalTotal);

  const handleConfirmCheckout = () => {
    if (!selectedExitVehicle) {
      onShowToast('Seleccione un vehículo para liquidar su salida', 'error');
      return;
    }
    const methodMapping: Record<'efectivo' | 'tarjeta' | 'transferencia', PaymentMethod> = {
      efectivo: 'efectivo',
      tarjeta: 'tarjeta_debito',
      transferencia: 'transferencia',
    };
    onProcessCheckout(selectedExitVehicle, methodMapping[checkoutPaymentMethod], finalTotal);
    onShowToast(\`Cobro registrado: $\${finalTotal.toLocaleString('es-CL')} para \${selectedExitVehicle.plate}. Barrera abierta.\`, 'success');
    setSelectedExitVehicle(null);
    setExitSearchQuery('');
  };

  const handlePinConfirm = (payload: { type: 'DISCOUNT' | 'LOST_TICKET'; pin: string; reason: string; discountAmount?: number; }) => {
    if (payload.type === 'DISCOUNT') {
      const disc = payload.discountAmount || 0;
      setAppliedDiscount(disc);
      onShowToast(\`Descuento comercial autorizado ($\${disc.toLocaleString('es-CL')}).\`, 'success');
    } else {
      setAppliedSurcharge(8000);
      onShowToast('Multa por Ticket Extraviado (+$8.000 CLP) aplicada.', 'error');
    }
    setPinModalType(null);
  };

  const runningBalance = historyLogs.reduce((acc, item) => (item.isEgreso ? acc - item.amount : acc + item.amount), 0);

  // Layout Render
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1400px] mx-auto min-h-screen bg-[#F5F5F7] animate-fade-in-up font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* ── LEFT COLUMN: POS SYSTEM (50%) ── */}
        <div className="lg:col-span-6 bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          {/* POS TABS */}
          <div className="flex border-b border-gray-100 bg-gray-50/50 p-2 gap-2">
            <button onClick={() => setPosTab('entry')} className={\`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all \${posTab === 'entry' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-800'}\`}>Ingreso</button>
            <button onClick={() => setPosTab('exit')} className={\`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all \${posTab === 'exit' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-800'}\`}>Cobro (Salida)</button>
            <button onClick={() => setPosTab('history')} className={\`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all \${posTab === 'history' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-800'}\`}>Caja</button>
          </div>

          <div className="p-6">
            {/* INGRESO TAB */}
            {posTab === 'entry' && (
              <form onSubmit={handleEntrySubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Ingresar Patente</label>
                  <div className="flex bg-white rounded-2xl border-2 border-gray-200 focus-within:border-[#E2498A] focus-within:ring-4 focus-within:ring-[#E2498A]/10 transition-all overflow-hidden shadow-sm">
                    <input
                      ref={plateInputRef}
                      autoFocus
                      type="text"
                      placeholder="AAAABB o AABB11"
                      className="w-full text-center py-5 text-4xl font-extrabold uppercase bg-transparent outline-none tabular-nums tracking-widest text-gray-900 placeholder:text-gray-300"
                      value={entryPlate}
                      onChange={(e) => setEntryPlate(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(['Sedán', 'SUV', 'Moto'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setEntryCategory(cat);
                        setEntryRate(cat === 'Moto' ? 20 : 35);
                      }}
                      className={\`py-4 rounded-2xl text-sm font-bold border-2 transition-all \${entryCategory === cat ? 'border-[#E2498A] bg-[#FFF5F8] text-[#E2498A]' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}\`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button type="button" onClick={() => setShowEntryDetails(!showEntryDetails)} className="text-sm font-bold text-[#E2498A] hover:text-[#C83472] flex items-center justify-center gap-1 w-full p-2">
                  {showEntryDetails ? 'Ocultar Datos Adicionales' : 'Añadir Datos Adicionales'}
                </button>

                {showEntryDetails && (
                  <div className="space-y-4 animate-fade-in-up bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">Nombre</label><input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium" value={entryName} onChange={(e) => setEntryName(e.target.value)} /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">Teléfono</label><input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium" value={entryPhone} onChange={(e) => setEntryPhone(e.target.value)} /></div>
                    </div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Observaciones</label><input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium" value={entryObs} onChange={(e) => setEntryObs(e.target.value)} /></div>
                  </div>
                )}

                <button type="submit" disabled={!entryPlate || entryPlate.length < 5} className="w-full py-5 bg-gray-900 text-white rounded-2xl text-lg font-extrabold hover:bg-black transition-all hover:shadow-lg disabled:opacity-50 flex justify-center items-center gap-3">
                  Emitir Ticket
                </button>
              </form>
            )}

            {/* EXIT TAB */}
            {posTab === 'exit' && (
              <div className="space-y-6">
                {!selectedExitVehicle ? (
                  <>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Buscar Vehículo para Salida</label>
                       <input ref={exitSearchInputRef} autoFocus type="text" placeholder="Buscar por Patente..." className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xl font-bold uppercase tabular-nums focus:outline-none focus:border-[#2B9E78] focus:ring-4 focus:ring-[#2B9E78]/10 transition-all text-gray-900" value={exitSearchQuery} onChange={(e) => setExitSearchQuery(e.target.value)} />
                    </div>
                    {exitSearchQuery && (
                      <div className="space-y-3">
                        {exitFilteredVehicles.map((v) => (
                          <div key={v.plate} onClick={() => loadVehicleIntoExit(v)} className="p-4 bg-white border-2 border-gray-100 rounded-2xl flex justify-between items-center cursor-pointer hover:border-[#2B9E78] hover:shadow-sm transition-all group">
                             <div>
                               <div className="text-xl font-extrabold text-gray-900 tabular-nums">{v.plate}</div>
                               <div className="text-xs font-semibold text-gray-500">Cupo {v.slotCode || \`A-\${String(v.slot).padStart(2, '0')}\`} • {v.durationMin} min</div>
                             </div>
                             <button className="px-4 py-2 bg-[#E8F8F2] text-[#2B9E78] font-bold text-sm rounded-xl group-hover:bg-[#2B9E78] group-hover:text-white transition-colors">Cobrar</button>
                          </div>
                        ))}
                        {exitFilteredVehicles.length === 0 && (
                          <div className="p-8 text-center text-gray-500 font-medium">No se encontraron vehículos.</div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="flex justify-between items-start">
                       <div>
                          <div className="text-3xl font-black text-gray-900 tracking-tight tabular-nums">{selectedExitVehicle.plate}</div>
                          <div className="text-sm font-semibold text-gray-500 mt-1">Estadía: {selectedExitVehicle.durationMin} min (Ingreso: {selectedExitVehicle.entry})</div>
                       </div>
                       <button onClick={() => { setSelectedExitVehicle(null); setExitSearchQuery(''); setAppliedDiscount(0); setAppliedSurcharge(0); }} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                       </button>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-3">
                       <div className="flex justify-between text-sm font-medium text-gray-500"><span>Tarifa Base (\{selectedExitVehicle.rate}/min)</span><span className="tabular-nums font-bold text-gray-900">$\{(selectedExitVehicle.durationMin * selectedExitVehicle.rate).toLocaleString('es-CL')}</span></div>
                       {appliedDiscount > 0 && <div className="flex justify-between text-sm font-bold text-green-600"><span>Descuento Comercial</span><span className="tabular-nums">-$\{appliedDiscount.toLocaleString('es-CL')}</span></div>}
                       {appliedSurcharge > 0 && <div className="flex justify-between text-sm font-bold text-red-600"><span>Recargo (Multa)</span><span className="tabular-nums">+$\{appliedSurcharge.toLocaleString('es-CL')}</span></div>}
                       <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                          <span className="text-lg font-black text-gray-900">Total a Pagar</span>
                          <span className="text-4xl font-black text-[#2B9E78] tabular-nums tracking-tight">$\{finalTotal.toLocaleString('es-CL')}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {(['efectivo', 'tarjeta', 'transferencia'] as const).map((m) => (
                        <button key={m} onClick={() => setCheckoutPaymentMethod(m)} className={\`py-3 rounded-xl text-sm font-bold border-2 capitalize transition-all \${checkoutPaymentMethod === m ? 'border-[#2B9E78] bg-[#E8F8F2] text-[#2B9E78]' : 'border-gray-100 bg-gray-50 text-gray-500'}\`}>{m}</button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                       <button onClick={() => setPinModalType('DISCOUNT')} className="flex-1 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Aplicar Descuento</button>
                       <button onClick={() => setPinModalType('LOST_TICKET')} className="flex-1 py-2 text-xs font-bold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50">Multa Extravío</button>
                    </div>

                    <button onClick={handleConfirmCheckout} className="w-full py-5 bg-[#2B9E78] text-white rounded-2xl text-lg font-extrabold hover:bg-[#238262] transition-all hover:-translate-y-1 hover:shadow-lg flex justify-center items-center gap-3">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                       Confirmar Cobro
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* HISTORY TAB */}
            {posTab === 'history' && (
              <div className="space-y-4">
                 <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="font-extrabold text-gray-900">Total Efectivo en Caja</span>
                    <span className="text-2xl font-black text-gray-900 tabular-nums">$\{runningBalance.toLocaleString('es-CL')}</span>
                 </div>
                 <button onClick={onOpenManualTransaction} className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50">
                    + / - Movimiento Manual
                 </button>
                 <div className="mt-4 max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {historyLogs.map((log, idx) => (
                      <div key={idx} className="p-3 bg-white border border-gray-100 rounded-xl flex justify-between items-center hover:border-gray-200 transition-colors">
                         <div>
                            <div className="text-sm font-bold text-gray-900">{log.desc} {log.plate ? \`(\${log.plate})\` : ''}</div>
                            <div className="text-xs font-semibold text-gray-500">{log.time} • {log.method.toUpperCase()}</div>
                         </div>
                         <div className={\`text-sm font-black tabular-nums \${log.isEgreso ? 'text-red-500' : 'text-green-600'}\`}>
                            {log.isEgreso ? '-' : '+'}$\{log.amount.toLocaleString('es-CL')}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: 2D MAP MATRIX (50%) ── */}
        <div className="lg:col-span-6 space-y-6">
           <div className="bg-[#1C1C1E] text-white rounded-3xl p-6 shadow-sm border border-gray-800">
             <div className="flex justify-between items-center mb-6">
                <div>
                   <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                     <span className="w-2.5 h-2.5 rounded-full bg-[#32D74B] animate-pulse"></span>
                     Plano 2D Interactivo
                   </h2>
                   <p className="text-sm text-gray-400 font-medium mt-1">Serrano 447 • Ocupación en Tiempo Real</p>
                </div>
                <div className="bg-[#2C2C2E] px-4 py-2 rounded-xl border border-gray-700 text-center">
                   <div className="text-2xl font-black text-[#32D74B] tabular-nums leading-none tracking-tight">{Math.max(0, 30 - activeVehicles.length)}</div>
                   <div className="text-[10px] uppercase font-bold text-gray-400 mt-1">Libres</div>
                </div>
             </div>

             <div className="grid grid-cols-5 gap-3">
               {Array.from({ length: 30 }, (_, i) => i + 1).map((slotIndex) => {
                 const vehicle = activeVehicles.find((v) => v.slot === slotIndex);
                 const slotCode = \`A-\${String(slotIndex).padStart(2, '0')}\`;
                 const isOccupied = !!vehicle;

                 return (
                   <div 
                     key={slotIndex}
                     onClick={() => {
                        if (isOccupied) {
                           onShowToast(\`\${slotCode}: Ocupado por \${vehicle.plate} (\${vehicle.durationMin} min)\`, 'info');
                           // Optionally could route to Exit tab and load it automatically
                           loadVehicleIntoExit(vehicle);
                           setPosTab('exit');
                        } else {
                           // Route to entry and pre-fill slot? (UI only supports auto-finding right now, but it's cool)
                           onShowToast(\`Cupo \${slotCode} está libre.\`, 'success');
                           setPosTab('entry');
                        }
                     }}
                     className={\`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer overflow-hidden group 
                       \${isOccupied 
                         ? 'bg-[#2C2C2E] border-gray-700 hover:border-gray-500' 
                         : 'bg-[#1C1C1E] border-gray-800 hover:border-[#32D74B]/50'
                       }\`}
                   >
                     <span className="text-[10px] font-bold text-gray-500 mb-1 z-10">{slotCode}</span>
                     {isOccupied ? (
                       <div className="flex flex-col items-center z-10">
                          <span className="text-sm font-black text-white tabular-nums tracking-wide">{vehicle.plate}</span>
                          <span className="text-[10px] font-bold text-[#E2498A] bg-[#E2498A]/10 px-1.5 py-0.5 rounded mt-1">{vehicle.durationMin}m</span>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center opacity-30 group-hover:opacity-100 transition-opacity z-10">
                          <svg className="w-6 h-6 text-[#32D74B] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                          <span className="text-xs font-bold text-[#32D74B]">Libre</span>
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           </div>
        </div>
      </div>

      {pinModalType && (
        <AntifraudPinModal type={pinModalType} onConfirm={handlePinConfirm} onCancel={() => setPinModalType(null)} />
      )}
    </div>
  );
};
`
fs.writeFileSync('src/components/pms/PosView.tsx', content);
