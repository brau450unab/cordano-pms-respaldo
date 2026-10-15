import React, { useState } from 'react';
import { useParking } from '../../context/ParkingContext';
import { Agreement, AgreementType } from '../../types';

interface ClientsViewProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ onShowToast }) => {
  const { user, agreements, createAgreement, updateAgreement, deleteAgreement, tickets } = useParking();

  // Role check: Operador/cajero only has permission to view, not create or edit
  const isOperator = user?.role === 'operador';

  // Active view tab: 'cards' | 'history' | 'billing'
  const [activeTab, setActiveTab] = useState<'cards' | 'history' | 'billing'>('cards');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Create / Edit / View
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(null);

  // Form Fields
  const [formCompany, setFormCompany] = useState('');
  const [formRut, setFormRut] = useState('');
  const [formManager, setFormManager] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPlatesInput, setFormPlatesInput] = useState(''); // Comma or space separated
  const [formFeePerVehicle, setFormFeePerVehicle] = useState(45000);
  const [formExtraCharges, setFormExtraCharges] = useState(0);
  const [formBillingDay, setFormBillingDay] = useState(5);
  const [formAgreementType, setFormAgreementType] = useState<AgreementType>('Convenio Empresa');

  // Open modal in CREATE mode (restringido para operador)
  const handleOpenCreateModal = () => {
    if (isOperator) {
      onShowToast('El perfil de operador cajero solo tiene permisos para visualizar convenios.', 'info');
      return;
    }
    setEditingAgreement(null);
    setFormCompany('');
    setFormRut('');
    setFormManager('');
    setFormPhone('+56 9 ');
    setFormEmail('');
    setFormPlatesInput('');
    setFormFeePerVehicle(45000);
    setFormExtraCharges(0);
    setFormBillingDay(5);
    setFormAgreementType('Convenio Empresa');
    setIsModalOpen(true);
  };

  // Open modal in EDIT mode
  const handleOpenEditModal = (agreement: Agreement) => {
    setEditingAgreement(agreement);
    setFormCompany(agreement.companyName || '');
    setFormRut(agreement.rutCompany || '');
    setFormManager(agreement.contactName || '');
    setFormPhone(agreement.phone || '');
    setFormEmail(agreement.email || '');
    const platesList = agreement.plates && agreement.plates.length > 0 
      ? agreement.plates.join(', ') 
      : agreement.plateNumber;
    setFormPlatesInput(platesList);
    const vehicleCount = (agreement.plates && agreement.plates.length > 0) ? agreement.plates.length : 1;
    setFormFeePerVehicle(Math.round(agreement.monthlyFeeClp / vehicleCount) || 45000);
    setFormExtraCharges(agreement.extraCharges || 0);
    setFormBillingDay(agreement.billingDay || 5);
    setFormAgreementType(agreement.agreementType || 'Convenio Empresa');
    setIsModalOpen(true);
  };

  // Parse plates from string
  const parsedPlates = formPlatesInput
    .split(/[\s,;]+/)
    .map((p) => p.trim().toUpperCase())
    .filter((p) => p.length >= 4);

  const vehicleCount = Math.max(1, parsedPlates.length);
  const calculatedTotalMonthly = vehicleCount * formFeePerVehicle + formExtraCharges;

  // Save Agreement (Create or Edit)
  const handleSaveAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOperator) {
      onShowToast('El perfil de operador cajero solo tiene permisos para visualizar convenios.', 'error');
      setIsModalOpen(false);
      return;
    }
    if (!formCompany.trim()) {
      onShowToast('El nombre de la empresa es obligatorio.', 'error');
      return;
    }
    if (parsedPlates.length === 0) {
      onShowToast('Debe ingresar al menos una patente de vehículo.', 'error');
      return;
    }

    const validUntilDate = new Date();
    validUntilDate.setMonth(validUntilDate.getMonth() + 1);

    if (editingAgreement) {
      // Update existing agreement
      updateAgreement(editingAgreement.id, {
        companyName: formCompany.trim(),
        rutCompany: formRut.trim() || undefined,
        contactName: formManager.trim() || 'Encargado de Flota',
        phone: formPhone.trim() || '+56 9 9000 0000',
        email: formEmail.trim() || undefined,
        plateNumber: parsedPlates[0],
        plates: parsedPlates,
        agreementType: formAgreementType,
        monthlyFeeClp: calculatedTotalMonthly,
        extraCharges: formExtraCharges,
        billingDay: formBillingDay,
      });
      onShowToast(`Convenio de ${formCompany} actualizado exitosamente (${parsedPlates.length} vehículos).`, 'success');
    } else {
      // Create new agreement
      const created = createAgreement({
        companyName: formCompany.trim(),
        rutCompany: formRut.trim() || undefined,
        contactName: formManager.trim() || 'Encargado de Flota',
        phone: formPhone.trim() || '+56 9 9000 0000',
        email: formEmail.trim() || undefined,
        plateNumber: parsedPlates[0],
        plates: parsedPlates,
        agreementType: formAgreementType,
        monthlyFeeClp: calculatedTotalMonthly,
        extraCharges: formExtraCharges,
        billingDay: formBillingDay,
        validUntil: validUntilDate.toISOString(),
      });

      // Initialize default debt and sample payment history for billing dashboard
      if (created) {
        updateAgreement(created.id, {
          debtBalance: calculatedTotalMonthly,
          paymentHistory: [
            {
              id: `PAY-${Date.now()}`,
              date: new Date(Date.now() - 30 * 86400000).toISOString(),
              amount: calculatedTotalMonthly,
              method: 'Transferencia Bancaria',
              voucher: `TRF-${Math.floor(100000 + Math.random() * 900000)}`,
            }
          ]
        });
      }

      onShowToast(`Nuevo convenio "${formCompany}" creado con éxito (${parsedPlates.length} vehículos).`, 'success');
    }

    setIsModalOpen(false);
  };

  // Quick Action: Send Payment Notification
  const handleSendBillingNotification = (agreement: Agreement) => {
    const platesList = agreement.plates ? agreement.plates.join(', ') : agreement.plateNumber;
    const balance = agreement.debtBalance ?? agreement.monthlyFeeClp;
    const msg = `Estimado(a) ${agreement.contactName || agreement.companyName}: Recordamos que el convenio de estacionamiento Cordano PMS (Serrano 447) para los vehículos [${platesList}] tiene un cobro mensual de $${(agreement.monthlyFeeClp || 0).toLocaleString('es-CL')} CLP, con saldo pendiente de $${balance.toLocaleString('es-CL')} CLP. Fecha de pago: día ${agreement.billingDay || 5} de cada mes.`;
    
    // Copy to clipboard or trigger notification simulation
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(msg).catch(() => {});
    }
    onShowToast(`Notificación de cobro enviada a ${agreement.phone || agreement.companyName} vía WhatsApp/Email. Mensaje copiado al portapapeles.`, 'success');
  };

  // Record a payment directly from Billing Dashboard
  const handleRecordPayment = (agreement: Agreement) => {
    if (isOperator) {
      onShowToast('El perfil de operador cajero solo tiene permisos para visualizar convenios y cobranzas.', 'info');
      return;
    }
    const payAmount = agreement.debtBalance && agreement.debtBalance > 0 ? agreement.debtBalance : agreement.monthlyFeeClp;
    const newPayment = {
      id: `PAY-${Date.now()}`,
      date: new Date().toISOString(),
      amount: payAmount,
      method: 'Transferencia Bancaria',
      voucher: `TRF-${Math.floor(100000 + Math.random() * 900000)}`,
    };
    const currentHist = agreement.paymentHistory || [];
    updateAgreement(agreement.id, {
      debtBalance: 0,
      status: 'al_dia',
      lastPaymentDate: newPayment.date,
      lastPaymentAmount: newPayment.amount,
      lastPaymentMethod: newPayment.method,
      lastPaymentVoucher: newPayment.voucher,
      paymentHistory: [newPayment, ...currentHist],
    });
    onShowToast(`Pago de $${payAmount.toLocaleString('es-CL')} CLP registrado para ${agreement.companyName}. Saldo al día.`, 'success');
  };

  // Filter agreements by search query
  const filteredAgreements = agreements.filter((a) => {
    const q = searchQuery.toLowerCase();
    const platesJoined = (a.plates || [a.plateNumber]).join(' ').toLowerCase();
    return (
      a.companyName.toLowerCase().includes(q) ||
      (a.contactName && a.contactName.toLowerCase().includes(q)) ||
      platesJoined.includes(q) ||
      (a.rutCompany && a.rutCompany.toLowerCase().includes(q))
    );
  });

  // Calculate access movements related to agreements
  const agreementPlatesSet = new Set(
    agreements.flatMap((a) => (a.plates && a.plates.length > 0 ? a.plates : [a.plateNumber]))
  );

  const agreementAccessLogs = tickets
    .filter((t) => agreementPlatesSet.has(t.plateNumber.toUpperCase()))
    .map((t) => {
      const agr = agreements.find((a) => 
        (a.plates && a.plates.includes(t.plateNumber.toUpperCase())) || a.plateNumber === t.plateNumber.toUpperCase()
      );
      return {
        id: t.id,
        plate: t.plateNumber,
        company: agr?.companyName || 'Convenio Registrado',
        entryTime: t.entryTime,
        exitTime: t.exitTime,
        status: t.status,
        slotCode: t.slotCode,
        operator: t.operatorEntryName,
      };
    })
    .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());

  return (
    <div id="view-clients" className="p-4 sm:p-6 lg:p-8 w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 space-y-6 text-[#1E1E2F] animate-fade-in-up font-sans">
      {/* ── HEADER & PRIMARY ACTIONS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#E2E8F0] pb-5 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5F8] border border-[#E2498A]/30 text-[#E2498A] text-xs font-bold mb-2">
            <span>MÓDULO DE CONVENIOS COMERCIALES & EMPRESAS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1E2F]">
            Gestión de Convenios & Facturación
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Tarifas corporativas, vehículos registrados, historial de accesos y control de cobranza mensual.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar empresa, patente, encargado..."
            className="w-64 h-10 px-3 rounded-xl border border-[#CBD5E1] bg-white text-xs tabular-nums focus:border-[#E2498A] focus:outline-none placeholder:text-[#94A3B8] shadow-xs"
          />
          {isOperator ? (
            <div className="h-10 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-2 select-none shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Modo Consulta Garita (Solo Lectura)</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="h-10 px-4 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="text-base font-extrabold">+</span>
              <span>Crear Nuevo Convenio</span>
            </button>
          )}
        </div>
      </div>

      {/* ── SUB-NAVIGATION TABS ── */}
      <div className="flex border-b border-[#E2E8F0] gap-2 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('cards')}
          className={`py-2.5 px-4 rounded-t-xl transition cursor-pointer border-t-2 border-x ${
            activeTab === 'cards'
              ? 'border-t-[#E2498A] border-x-[#E2E8F0] bg-white text-[#1E1E2F] shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tarjetas de Convenios ({filteredAgreements.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`py-2.5 px-4 rounded-t-xl transition cursor-pointer border-t-2 border-x ${
            activeTab === 'history'
              ? 'border-t-[#E2498A] border-x-[#E2E8F0] bg-white text-[#1E1E2F] shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Historial de Accesos ({agreementAccessLogs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('billing')}
          className={`py-2.5 px-4 rounded-t-xl transition cursor-pointer border-t-2 border-x ${
            activeTab === 'billing'
              ? 'border-t-[#E2498A] border-x-[#E2E8F0] bg-white text-[#1E1E2F] shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Dashboard de Cobranza & Pagos
        </button>
      </div>

      {/* ── TAB 1: CARDS VIEW ── */}
      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgreements.map((agreement) => {
            const plates = agreement.plates && agreement.plates.length > 0 
              ? agreement.plates 
              : [agreement.plateNumber];
            const vCount = plates.length;
            const balance = agreement.debtBalance ?? 0;
            const isDebt = balance > 0;

            return (
              <div
                key={agreement.id}
                onClick={() => handleOpenEditModal(agreement)}
                className="bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#E2498A]/60 shadow-xs hover:shadow-md transition-all p-5 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {agreement.agreementType}
                      </span>
                      <h3 className="text-base font-extrabold text-[#1E1E2F] group-hover:text-[#E2498A] transition-colors leading-tight">
                        {agreement.companyName}
                      </h3>
                      {agreement.rutCompany && (
                        <span className="text-[11px] font-mono text-slate-500">RUT: {agreement.rutCompany}</span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        isDebt
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}
                    >
                      {isDebt ? `Deuda $${balance.toLocaleString('es-CL')}` : 'Al Día'}
                    </span>
                  </div>

                  {/* Encargado & Contacto */}
                  <div className="text-xs space-y-1 text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">Encargado:</span>
                      <span>{agreement.contactName || 'No asignado'}</span>
                    </p>
                    <p className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="font-semibold text-slate-700 font-sans">Teléfono:</span>
                      <span>{agreement.phone || 'S/N'}</span>
                    </p>
                  </div>

                  {/* Vehículos Registrados */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                      Vehículos Asociados ({vCount}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {plates.map((pl) => (
                        <span
                          key={pl}
                          className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold text-xs"
                        >
                          {pl}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Financials & Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Cobro Mensual</span>
                    <span className="text-base font-black font-mono text-[#1E1E2F]">
                      $ {(agreement.monthlyFeeClp || 0).toLocaleString('es-CL')} CLP
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Corte: día {agreement.billingDay || 5} de cada mes
                    </span>
                  </div>

                  <span className="text-xs font-bold text-[#E2498A] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    {isOperator ? 'Ver Detalle ➔' : 'Editar ➔'}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredAgreements.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-sm font-semibold">No se encontraron convenios registrados con ese criterio.</p>
              {!isOperator ? (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="mt-3 px-4 py-2 bg-[#E2498A] hover:bg-[#C83472] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Crear el primer convenio
                </button>
              ) : (
                <p className="mt-2 text-xs text-slate-400">
                  Acceso de garita en modo consulta. Para dar de alta convenios, solicítelo a supervisión o administración.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: HISTORIAL DE ACCESOS ── */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Registro de Ingresos y Egresos de Flotas por Convenio
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Total movimientos: {agreementAccessLogs.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Patente</th>
                  <th className="py-3 px-4">Empresa / Convenio</th>
                  <th className="py-3 px-4">Plaza Asignada</th>
                  <th className="py-3 px-4">Hora de Ingreso</th>
                  <th className="py-3 px-4">Hora de Salida</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Operador Garita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {agreementAccessLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-black text-[#1E1E2F]">{log.plate}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-700">{log.company}</td>
                    <td className="py-3 px-4 font-sans text-slate-600">{log.slotCode}</td>
                    <td className="py-3 px-4 text-slate-600">{new Date(log.entryTime).toLocaleString('es-CL')}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {log.exitTime ? new Date(log.exitTime).toLocaleString('es-CL') : '— Dentro del Recinto —'}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'activo'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.status === 'activo' ? 'DENTRO' : 'SALIDA'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-500">{log.operator}</td>
                  </tr>
                ))}
                {agreementAccessLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                      No hay registros de ingresos para vehículos asociados a convenios aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: DASHBOARD DE COBRANZA ── */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Facturación Mensual Total</span>
              <p className="text-2xl font-black font-mono text-[#1E1E2F] mt-1">
                $ {agreements.reduce((sum, a) => sum + (a.monthlyFeeClp || 0), 0).toLocaleString('es-CL')} CLP
              </p>
              <span className="text-[11px] text-slate-500">{agreements.length} convenios activos</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Saldo Pendiente de Cobro</span>
              <p className="text-2xl font-black font-mono text-rose-600 mt-1">
                $ {agreements.reduce((sum, a) => sum + (a.debtBalance || 0), 0).toLocaleString('es-CL')} CLP
              </p>
              <span className="text-[11px] text-rose-500 font-semibold">Cuentas por cobrar este ciclo</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Vehículos Totales Bajo Convenio</span>
              <p className="text-2xl font-black font-mono text-emerald-600 mt-1">
                {agreements.reduce((sum, a) => sum + (a.plates?.length || 1), 0)} autos
              </p>
              <span className="text-[11px] text-slate-500">Capacidad garantizada Serrano 447</span>
            </div>
          </div>

          {/* Tabla de Cobranza y Acciones Rápidas */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Estado Financiero & Acciones de Cobro por Empresa
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Empresa</th>
                    <th className="py-3 px-4">Encargado / Teléfono</th>
                    <th className="py-3 px-4">Vehículos</th>
                    <th className="py-3 px-4">Cuota Mensual</th>
                    <th className="py-3 px-4">Saldo Deuda</th>
                    <th className="py-3 px-4">Último Pago</th>
                    <th className="py-3 px-4 text-right">Acciones Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredAgreements.map((agreement) => {
                    const balance = agreement.debtBalance ?? 0;
                    const plates = agreement.plates || [agreement.plateNumber];
                    const lastPay = agreement.paymentHistory?.[0];

                    return (
                      <tr key={agreement.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-sans font-bold text-[#1E1E2F]">
                          {agreement.companyName}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-600">
                          <div>{agreement.contactName}</div>
                          <div className="text-[11px] font-mono text-slate-400">{agreement.phone}</div>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-700">
                          {plates.length} ({plates.slice(0, 2).join(', ')}{plates.length > 2 ? '...' : ''})
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          $ {(agreement.monthlyFeeClp || 0).toLocaleString('es-CL')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              balance > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            $ {balance.toLocaleString('es-CL')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-500">
                          {lastPay ? (
                            <div>
                              <div>${lastPay.amount.toLocaleString('es-CL')} ({new Date(lastPay.date).toLocaleDateString('es-CL')})</div>
                              <div className="text-[10px] font-mono text-slate-400">{lastPay.voucher}</div>
                            </div>
                          ) : (
                            'Sin registro'
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 font-sans">
                          {balance > 0 && !isOperator && (
                            <button
                              type="button"
                              onClick={() => handleRecordPayment(agreement)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs cursor-pointer"
                            >
                              Registrar Pago
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSendBillingNotification(agreement)}
                            className="px-2.5 py-1 rounded-lg bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-[11px] transition shadow-xs cursor-pointer"
                          >
                            Enviar Notificación
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREAR / EDITAR CONVENIO ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-fade-in-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-extrabold text-[#1E1E2F]">
                  {isOperator
                    ? `Detalle de Convenio: ${editingAgreement?.companyName || 'Sin datos'}`
                    : editingAgreement
                      ? `Editar Convenio: ${editingAgreement.companyName}`
                      : 'Crear Nuevo Convenio Comercial'}
                </h3>
                {isOperator && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Solo Lectura (Garita)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAgreement} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nombre de la Empresa *</label>
                  <input
                    type="text"
                    required
                    disabled={isOperator}
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="Ej. Clínica Tarapacá / Notaría Serrano"
                    className={`w-full h-10 px-3 rounded-xl border border-slate-200 font-semibold focus:border-[#E2498A] focus:outline-none ${isOperator ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-slate-50'}`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">RUT Empresa (Opcional)</label>
                  <input
                    type="text"
                    disabled={isOperator}
                    value={formRut}
                    onChange={(e) => setFormRut(e.target.value)}
                    placeholder="76.123.456-7"
                    className={`w-full h-10 px-3 rounded-xl border border-slate-200 font-mono focus:border-[#E2498A] focus:outline-none ${isOperator ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-slate-50'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Datos del Encargado</label>
                  <input
                    type="text"
                    disabled={isOperator}
                    value={formManager}
                    onChange={(e) => setFormManager(e.target.value)}
                    placeholder="Nombre Contacto"
                    className={`w-full h-10 px-3 rounded-xl border border-slate-200 focus:border-[#E2498A] focus:outline-none ${isOperator ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-slate-50'}`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    disabled={isOperator}
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className={`w-full h-10 px-3 rounded-xl border border-slate-200 font-mono focus:border-[#E2498A] focus:outline-none ${isOperator ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-slate-50'}`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    disabled={isOperator}
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="contacto@empresa.cl"
                    className={`w-full h-10 px-3 rounded-xl border border-slate-200 focus:border-[#E2498A] focus:outline-none ${isOperator ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-slate-50'}`}
                  />
                </div>
              </div>

              {/* Registro de Vehículos Asociados (Cobro por cada uno) */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Vehículos Asociados (Patentes separadas por coma o espacio) *
                </label>
                <textarea
                  rows={2}
                  required
                  disabled={isOperator}
                  value={formPlatesInput}
                  onChange={(e) => setFormPlatesInput(e.target.value.toUpperCase())}
                  placeholder="Ej. RTPK10, LMWQ88, BBCC22, DDFF44"
                  className={`w-full p-3 rounded-xl border border-slate-200 font-mono uppercase font-bold focus:border-[#E2498A] focus:outline-none ${isOperator ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-slate-50'}`}
                />
                <span className="text-[11px] text-slate-500">
                  {parsedPlates.length} vehículos identificados: {parsedPlates.join(', ') || 'Ninguno'}
                </span>
              </div>

              {/* Parámetros Financieros */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Monto por Vehículo ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    disabled={isOperator}
                    value={formFeePerVehicle}
                    onChange={(e) => setFormFeePerVehicle(parseInt(e.target.value) || 0)}
                    className={`w-full h-10 px-3 rounded-xl border border-slate-200 font-mono font-bold focus:border-[#E2498A] focus:outline-none ${isOperator ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-slate-50'}`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Cargos Adicionales ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    disabled={isOperator}
                    value={formExtraCharges}
                    onChange={(e) => setFormExtraCharges(parseInt(e.target.value) || 0)}
                    className={`w-full h-10 px-3 rounded-xl border border-slate-200 font-mono focus:border-[#E2498A] focus:outline-none ${isOperator ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-slate-50'}`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Día de Pago (Corte)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    disabled={isOperator}
                    value={formBillingDay}
                    onChange={(e) => setFormBillingDay(parseInt(e.target.value) || 5)}
                    className={`w-full h-10 px-3 rounded-xl border border-slate-200 font-mono focus:border-[#E2498A] focus:outline-none ${isOperator ? 'bg-slate-100 text-slate-700 cursor-not-allowed' : 'bg-slate-50'}`}
                  />
                </div>
              </div>

              {/* Total Calculado Automático */}
              <div className="p-3.5 bg-slate-100 rounded-xl flex items-center justify-between border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Mensual Proyectado</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {vehicleCount} vehículo(s) × ${formFeePerVehicle.toLocaleString('es-CL')} + ${formExtraCharges.toLocaleString('es-CL')} extra
                  </span>
                </div>
                <span className="text-lg font-black font-mono text-[#E2498A]">
                  $ {calculatedTotalMonthly.toLocaleString('es-CL')} CLP
                </span>
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {isOperator ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] text-slate-500 italic">
                      Perfil de operador cajero en modo visualización. Acciones de creación y edición restringidas.
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
                    >
                      Cerrar Consulta
                    </button>
                  </div>
                ) : (
                  <>
                    {editingAgreement ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar convenio "${editingAgreement.companyName}"?`)) {
                            deleteAgreement(editingAgreement.id);
                            setIsModalOpen(false);
                            onShowToast('Convenio eliminado.', 'info');
                          }
                        }}
                        className="px-3 py-2 text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer"
                      >
                        Eliminar Convenio
                      </button>
                    ) : <div />}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs shadow-sm cursor-pointer"
                      >
                        Guardar Convenio
                      </button>
                    </div>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
