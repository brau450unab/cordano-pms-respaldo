import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParking } from '../context/ParkingContext';
import { Agreement, AgreementType, AgreementStatus, AppScreen } from '../types';
import {
  Users,
  Building2,
  Car,
  Search,
  Plus,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Trash2,
  Phone,
  Check,
  X,
  MessageCircle
} from 'lucide-react';

interface ModuloConveniosAbonadosProps {
  onNavigate?: (screen: AppScreen) => void;
}

export const ModuloConveniosAbonados: React.FC<ModuloConveniosAbonadosProps> = () => {
  const {
    agreements,
    renewAgreement,
    createAgreement,
    deleteAgreement
  } = useParking();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | AgreementStatus>('todos');
  const [typeFilter] = useState<'todos' | AgreementType>('todos');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [renewTarget, setRenewTarget] = useState<Agreement | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<Agreement | null>(null);

  // Renewal form state
  const [renewMonths, setRenewMonths] = useState<number>(1);
  const [renewAmount, setRenewAmount] = useState<number>(0);
  const [renewMethod, setRenewMethod] = useState<string>('Transferencia Bancaria');
  const [renewVoucher, setRenewVoucher] = useState<string>('');
  const [renewNotes, setRenewNotes] = useState<string>('');

  // New agreement form state
  const [newPlate, setNewPlate] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newRut, setNewRut] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newPhone, setNewPhone] = useState('+56 9 ');
  const [newType, setNewType] = useState<AgreementType>('Abonado Mensual');
  const [newFee, setNewFee] = useState<number>(45000);
  const [newDurationMonths, setNewDurationMonths] = useState<number>(1);
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Statistics calculation
  const totalCount = agreements.length;
  const alDiaCount = agreements.filter((a) => a.status === 'al_dia').length;
  const porVencerCount = agreements.filter((a) => a.status === 'por_vencer').length;
  const vencidosCount = agreements.filter((a) => a.status === 'vencido').length;
  const monthlyRevenueTotal = agreements.reduce((acc, a) => acc + (a.monthlyFeeClp || 0), 0);

  // Filtered list
  const filteredAgreements = agreements.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.plateNumber.toLowerCase().includes(q) ||
      item.companyName.toLowerCase().includes(q) ||
      item.contactName.toLowerCase().includes(q) ||
      (item.rutCompany && item.rutCompany.toLowerCase().includes(q)) ||
      item.phone.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'todos' || item.status === statusFilter;
    const matchType = typeFilter === 'todos' || item.agreementType === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  const handleOpenRenew = (agr: Agreement) => {
    setRenewTarget(agr);
    setRenewMonths(1);
    setRenewAmount(agr.monthlyFeeClp || 45000);
    setRenewMethod('Transferencia Bancaria');
    setRenewVoucher('');
    setRenewNotes('');
  };

  const handleMonthsChange = (months: number) => {
    setRenewMonths(months);
    if (renewTarget) {
      setRenewAmount((renewTarget.monthlyFeeClp || 45000) * months);
    }
  };

  const handleExecuteRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewTarget) return;

    renewAgreement(
      renewTarget.id,
      renewMonths,
      renewAmount,
      renewMethod,
      renewVoucher,
      renewNotes
    );

    setRenewTarget(null);
  };

  const handleCreateAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlate = newPlate.trim().toUpperCase();

    if (!cleanPlate) {
      setFormError('Debe ingresar la patente del vehículo');
      return;
    }
    if (!newCompany.trim()) {
      setFormError('Debe ingresar la empresa o razón social');
      return;
    }
    if (!newContact.trim()) {
      setFormError('Debe ingresar el nombre del conductor o contacto');
      return;
    }

    const exists = agreements.some(
      (a) => a.plateNumber.replace(/-/g, '') === cleanPlate.replace(/-/g, '')
    );
    if (exists) {
      setFormError(`La patente ${cleanPlate} ya está registrada en un convenio existente`);
      return;
    }

    const validUntilDate = new Date();
    validUntilDate.setMonth(validUntilDate.getMonth() + newDurationMonths);

    createAgreement({
      plateNumber: cleanPlate,
      companyName: newCompany.trim(),
      rutCompany: newRut.trim() || undefined,
      contactName: newContact.trim(),
      phone: newPhone.trim(),
      agreementType: newType,
      monthlyFeeClp: Number(newFee) || 45000,
      validUntil: validUntilDate.toISOString(),
      notes: newNotes.trim() || undefined
    });

    // Reset Form
    setNewPlate('');
    setNewCompany('');
    setNewRut('');
    setNewContact('');
    setNewPhone('+56 9 ');
    setNewType('Abonado Mensual');
    setNewFee(45000);
    setNewDurationMonths(1);
    setNewNotes('');
    setFormError(null);
    setIsNewModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Top Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Convenios & Abonados Mensuales
              </h1>
              <span className="bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                Serrano 447
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Gestión de vehículos corporativos con cuota mensual fuera de caja y control de vigencia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center space-x-2 cursor-pointer border border-slate-900"
          >
            <Plus className="w-4 h-4" />
            <span>NUEVO VEHÍCULO EN CONVENIO</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>[ Total ]</span>
            <Car className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
          <div className="text-[10px] text-slate-500">Vehículos activos</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>[ Al Día ]</span>
            <CheckCircle2 className="w-4 h-4 text-slate-800" />
          </div>
          <div className="text-2xl font-black text-slate-900">{alDiaCount}</div>
          <div className="text-[10px] text-slate-500">Vigentes</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>[ Por Vencer ]</span>
            <AlertTriangle className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">{porVencerCount}</div>
          <div className="text-[10px] text-slate-500">≤ 7 días</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>[ Vencidos ]</span>
            <XCircle className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">{vencidosCount}</div>
          <div className="text-[10px] text-slate-500">Morosos</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>[ Recaudación ]</span>
            <DollarSign className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-xl font-black text-slate-900">
            ${monthlyRevenueTotal.toLocaleString('es-CL')}
          </div>
          <div className="text-[10px] text-slate-500">Facturación mensual</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-300 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-xs">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por patente, empresa..."
            className="w-full pl-9 pr-4 py-2 bg-white text-slate-900 rounded-lg text-xs border border-slate-300 outline-none focus:border-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center flex-wrap gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border ${
              statusFilter === 'todos'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('al_dia')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border ${
              statusFilter === 'al_dia'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Al Día ({alDiaCount})
          </button>
          <button
            onClick={() => setStatusFilter('por_vencer')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border ${
              statusFilter === 'por_vencer'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Por Vencer ({porVencerCount})
          </button>
          <button
            onClick={() => setStatusFilter('vencido')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer border ${
              statusFilter === 'vencido'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Vencidos ({vencidosCount})
          </button>
        </div>
      </div>

      {/* Agreements Cards & Table View */}
      {filteredAgreements.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-300 shadow-xs font-mono">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
          <h3 className="font-bold text-sm text-slate-800">[ No se encontraron convenios ]</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-sans">
            No hay vehículos que coincidan con la búsqueda o filtro seleccionado.
          </p>
        </div>
      ) : (
        <div className="space-y-3 font-mono">
          {filteredAgreements.map((agr) => {
            const validUntil = new Date(agr.validUntil);
            const formattedValidUntil = validUntil.toLocaleDateString('es-CL', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });

            const diffDays = Math.ceil(
              (validUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            let statusLabel = `Al Día (${diffDays}d)`;
            if (agr.status === 'por_vencer' || (diffDays >= 0 && diffDays <= 7)) {
              statusLabel = `Por Vencer (${diffDays}d)`;
            } else if (agr.status === 'vencido' || diffDays < 0) {
              statusLabel = `Vencido (${Math.abs(diffDays)}d)`;
            }

            return (
              <motion.div
                key={agr.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl p-4 border border-slate-300 shadow-xs hover:border-slate-500 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Left: Plate Box + Vehicle Info */}
                <div className="flex items-start sm:items-center space-x-3.5">
                  {/* Chilean Plate Box */}
                  <div className="bg-slate-100 border border-slate-400 rounded px-3 py-1 flex flex-col items-center justify-center shrink-0 min-w-[95px]">
                    <span className="text-[8px] font-bold text-slate-500 tracking-widest leading-none">CHILE</span>
                    <span className="font-bold text-sm text-slate-900 tracking-wider">
                      {agr.plateNumber}
                    </span>
                  </div>

                  {/* Company and Contact */}
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900">{agr.companyName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700">
                        {agr.agreementType}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500 font-sans">
                      <span className="flex items-center gap-1 font-mono">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{agr.contactName}</span>
                      </span>
                      {agr.rutCompany && <span className="font-mono">RUT: {agr.rutCompany}</span>}
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{agr.phone}</span>
                        <a
                          href={`https://wa.me/${agr.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-600 hover:text-slate-900"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </a>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle: Vigencia, Cuota y Estado */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  {/* Status Badge */}
                  <div className="px-2.5 py-1 rounded border border-slate-300 bg-slate-100 text-slate-800 text-[11px] font-bold">
                    {statusLabel}
                  </div>

                  {/* Vencimiento */}
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] uppercase text-slate-500 font-bold">Vence</div>
                    <div className="font-bold text-slate-900">{formattedValidUntil}</div>
                  </div>

                  {/* Cuota */}
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] uppercase text-slate-500 font-bold">Cuota Mensual</div>
                    <div className="font-bold text-slate-900">
                      ${agr.monthlyFeeClp.toLocaleString('es-CL')} CLP
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                  <button
                    onClick={() => handleOpenRenew(agr)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Renovar</span>
                  </button>

                  <button
                    onClick={() => setDeleteConfirmTarget(agr)}
                    className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: RENOVAR SUSCRIPCIÓN */}
      <AnimatePresence>
        {renewTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white text-slate-900 rounded-xl shadow-xl border border-slate-400 max-w-lg w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-slate-100 p-4 flex items-center justify-between border-b border-slate-300">
                <div className="flex items-center space-x-2.5">
                  <RefreshCw className="w-4 h-4 text-slate-700" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">[ Renovar Suscripción de Convenio ]</h3>
                  </div>
                </div>
                <button
                  onClick={() => setRenewTarget(null)}
                  className="text-slate-500 hover:text-slate-900 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleExecuteRenewal} className="p-5 space-y-4 text-xs font-mono">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-300 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Empresa</span>
                    <span className="font-bold text-sm text-slate-900">{renewTarget.companyName}</span>
                  </div>
                  <div className="bg-white border border-slate-400 rounded px-2.5 py-1 text-center">
                    <span className="text-[8px] font-bold text-slate-500 block">CHILE</span>
                    <span className="font-bold text-sm text-slate-900">{renewTarget.plateNumber}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Meses a Renovar
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 6].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleMonthsChange(m)}
                        className={`py-1.5 rounded font-bold text-xs border ${
                          renewMonths === m
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {m} {m === 1 ? 'Mes' : 'Meses'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Monto a Cobrar ($ CLP)
                    </label>
                    <input
                      type="number"
                      value={renewAmount}
                      onChange={(e) => setRenewAmount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white rounded border border-slate-300 font-bold text-sm text-slate-900 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Método de Pago
                    </label>
                    <select
                      value={renewMethod}
                      onChange={(e) => setRenewMethod(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white text-slate-900 rounded border border-slate-300 font-bold text-xs outline-none"
                    >
                      <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                      <option value="POS Tarjeta Débito">POS Tarjeta Débito</option>
                      <option value="POS Tarjeta Crédito">POS Tarjeta Crédito</option>
                      <option value="Efectivo Central">Efectivo Central</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    N° de Comprobante / Voucher *
                  </label>
                  <input
                    type="text"
                    value={renewVoucher}
                    onChange={(e) => setRenewVoucher(e.target.value)}
                    placeholder="Ej: TR-894210"
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 rounded border border-slate-300 text-xs outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Notas u Observaciones
                  </label>
                  <input
                    type="text"
                    value={renewNotes}
                    onChange={(e) => setRenewNotes(e.target.value)}
                    placeholder="Opcional..."
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 rounded border border-slate-300 text-xs outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setRenewTarget(null)}
                    className="px-3 py-1.5 rounded font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirmar Renovación (${renewAmount.toLocaleString('es-CL')})</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CREAR NUEVO VEHÍCULO */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white text-slate-900 rounded-xl shadow-xl border border-slate-400 max-w-xl w-full overflow-hidden"
            >
              <div className="bg-slate-100 p-4 flex items-center justify-between border-b border-slate-300">
                <div className="flex items-center space-x-2.5">
                  <Plus className="w-4 h-4 text-slate-800" />
                  <h3 className="text-sm font-bold text-slate-900">[ Nuevo Vehículo en Convenio ]</h3>
                </div>
                <button
                  onClick={() => setIsNewModalOpen(false)}
                  className="text-slate-500 hover:text-slate-900 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAgreement} className="p-5 space-y-3.5 text-xs font-mono">
                {formError && (
                  <div className="bg-slate-100 border border-slate-400 text-slate-900 p-2.5 rounded flex items-center space-x-2 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Patente *
                    </label>
                    <input
                      type="text"
                      value={newPlate}
                      onChange={(e) => {
                        setNewPlate(e.target.value.toUpperCase());
                        setFormError(null);
                      }}
                      placeholder="Ej: LK-84-21"
                      maxLength={8}
                      className="w-full px-2.5 py-1.5 bg-white rounded border border-slate-300 font-bold text-sm text-slate-900 outline-none uppercase"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Modalidad
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as AgreementType)}
                      className="w-full px-2.5 py-1.5 bg-white text-slate-900 rounded border border-slate-300 font-bold outline-none"
                    >
                      <option value="Abonado Mensual">Abonado Mensual</option>
                      <option value="Convenio Comercial">Convenio Comercial</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Empresa / Razón Social *
                    </label>
                    <input
                      type="text"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      placeholder="Ej: Empresa Zofri Ltda."
                      className="w-full px-2.5 py-1.5 bg-white text-slate-900 rounded border border-slate-300 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      RUT Empresa (Opcional)
                    </label>
                    <input
                      type="text"
                      value={newRut}
                      onChange={(e) => setNewRut(e.target.value)}
                      placeholder="76.840.123-K"
                      className="w-full px-2.5 py-1.5 bg-white text-slate-900 rounded border border-slate-300 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nombre Contacto *
                    </label>
                    <input
                      type="text"
                      value={newContact}
                      onChange={(e) => setNewContact(e.target.value)}
                      placeholder="Ej: Patricio Almonte"
                      className="w-full px-2.5 py-1.5 bg-white text-slate-900 rounded border border-slate-300 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Teléfono WhatsApp *
                    </label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="w-full px-2.5 py-1.5 bg-white text-slate-900 rounded border border-slate-300 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Cuota Mensual ($ CLP)
                    </label>
                    <input
                      type="number"
                      value={newFee}
                      onChange={(e) => setNewFee(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white rounded border border-slate-300 font-bold text-sm text-slate-900 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Vigencia Inicial
                    </label>
                    <select
                      value={newDurationMonths}
                      onChange={(e) => setNewDurationMonths(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white text-slate-900 rounded border border-slate-300 font-bold outline-none"
                    >
                      <option value={1}>1 Mes</option>
                      <option value={2}>2 Meses</option>
                      <option value={3}>3 Meses</option>
                      <option value={6}>6 Meses</option>
                      <option value={12}>1 Año</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Notas u Observaciones
                  </label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Acceso libre 24/7 sin cobro en caja..."
                    className="w-full px-2.5 py-1.5 bg-white text-slate-900 rounded border border-slate-300 outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-3 py-1.5 rounded font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Vehículo</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: CONFIRMAR BAJA */}
      <AnimatePresence>
        {deleteConfirmTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white text-slate-900 rounded-xl shadow-xl border border-slate-400 max-w-sm w-full p-5 space-y-4 text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">[ ¿Dar de baja convenio? ]</h3>
                <p className="text-xs text-slate-500 mt-1 font-sans">
                  Se removerá el vehículo <strong>{deleteConfirmTarget.plateNumber}</strong> ({deleteConfirmTarget.companyName}).
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="px-3.5 py-1.5 rounded text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteAgreement(deleteConfirmTarget.id);
                    setDeleteConfirmTarget(null);
                  }}
                  className="px-3.5 py-1.5 rounded text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white"
                >
                  Confirmar Baja
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
