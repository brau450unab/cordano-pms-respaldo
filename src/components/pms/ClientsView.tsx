import React, { useState } from 'react';
import { useParking } from '../../context/ParkingContext';
import { AgreementType } from '../../types';

interface ClientsViewProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface ParallelRecord {
  id: string;
  plate: string;
  company: string;
  type: 'CONVENIO' | 'NOCHE';
  slotCode: string;
  amount: number;
  status: 'ACTIVO' | 'VIGENTE';
}

export const ClientsView: React.FC<ClientsViewProps> = ({ onShowToast }) => {
  const { agreements, createAgreement, renewAgreement } = useParking();

  // Search and registration form state
  const [searchQuery, setSearchQuery] = useState('');
  const [newConvPlate, setNewConvPlate] = useState('');
  const [newConvCompany, setNewConvCompany] = useState('');
  const [newConvType, setNewConvType] = useState<'CONVENIO' | 'NOCHE'>('CONVENIO');
  const [newConvSlot, setNewConvSlot] = useState('B-28');

  // Parallel local records (preloaded with sample records)
  const [parallelRecords, setParallelRecords] = useState<ParallelRecord[]>([
    {
      id: 'CONV-01',
      plate: 'RTPK10',
      company: 'Notaría Serrano Iquique',
      type: 'CONVENIO',
      slotCode: 'B-29',
      amount: 75000,
      status: 'VIGENTE',
    },
    {
      id: 'CONV-02',
      plate: 'LMWQ88',
      company: 'Consulado / Clínica Tarapacá',
      type: 'CONVENIO',
      slotCode: 'B-30',
      amount: 75000,
      status: 'VIGENTE',
    },
  ]);

  const handleAddParallel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConvPlate.trim() || !newConvCompany.trim()) {
      onShowToast('Complete la patente y la empresa/titular', 'error');
      return;
    }

    const fee = newConvType === 'CONVENIO' ? 75000 : 8000;
    const cleanPlate = newConvPlate.trim().toUpperCase();

    // Add to parallel records
    const newRecord: ParallelRecord = {
      id: `CONV-0${parallelRecords.length + 1}`,
      plate: cleanPlate,
      company: newConvCompany.trim(),
      type: newConvType,
      slotCode: newConvSlot.toUpperCase(),
      amount: fee,
      status: 'ACTIVO',
    };

    setParallelRecords((prev) => [newRecord, ...prev]);

    // Also register in ParkingContext agreements
    const validUntilDate = new Date();
    validUntilDate.setMonth(validUntilDate.getMonth() + 1);

    createAgreement({
      plateNumber: cleanPlate,
      companyName: newConvCompany.trim(),
      contactName: 'Titular Registrado',
      phone: '+56 9 9000 0000',
      agreementType: (newConvType === 'CONVENIO' ? 'Convenio Empresa' : 'Abonado Mensual') as AgreementType,
      monthlyFeeClp: fee,
      validUntil: validUntilDate.toISOString(),
    });

    onShowToast(
      `Servicio en paralelo (${newConvType}) para ${cleanPlate} en plaza ${newConvSlot.toUpperCase()} registrado sin alterar caja rotativa.`,
      'success'
    );

    setNewConvPlate('');
    setNewConvCompany('');
  };

  const filteredAgreements = parallelRecords.filter(
    (p) =>
      p.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slotCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="view-clients" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* ── SECTION HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e8ecf0] pb-4 gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-mono font-bold mb-2">
            <span>SUBMÓDULO EN PARALELO · SERRANO 447</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Abonados Mensuales &amp; Servicio Pernocta Noche
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Regla de Dominio #7: Bloquea plaza en la matriz Serrano 447 sin ingresar a la lista de transitorios ni alterar la contabilidad de caja rotativa del turno.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por patente, titular, plaza..."
            className="w-64 h-10 px-3 rounded-xl border border-[#dde2e8] bg-white text-xs font-mono focus:border-slate-900 focus:outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ── TWO COLUMNS: REGISTRATION FORM (LEFT) + ROSTER LIST (RIGHT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Registration Form */}
        <div className="lg:col-span-5 bg-white border border-[#e8ecf0] rounded-2xl shadow-xs p-6 space-y-5">
          <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-500 border-b border-[#f1f5f9] pb-3">
            Registrar Servicio en Paralelo [F3]
          </h3>

          <form onSubmit={handleAddParallel} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-[0.05em]">
                Patente Vehículo *
              </label>
              <input
                type="text"
                value={newConvPlate}
                onChange={(e) => setNewConvPlate(e.target.value.toUpperCase())}
                placeholder="Ej. KJWP92"
                maxLength={8}
                className="w-full h-11 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] font-mono font-bold uppercase text-slate-900 text-[13px] focus:outline-none focus:border-slate-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-[0.05em]">
                Empresa / Titular *
              </label>
              <input
                type="text"
                value={newConvCompany}
                onChange={(e) => setNewConvCompany(e.target.value)}
                placeholder="Ej. Notaría Iquique / Clínica Tarapacá"
                className="w-full h-11 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] text-slate-700 text-[13px] focus:outline-none focus:border-slate-400 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-[0.05em]">
                  Modalidad
                </label>
                <select
                  value={newConvType}
                  onChange={(e) => setNewConvType(e.target.value as 'CONVENIO' | 'NOCHE')}
                  className="w-full h-11 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] text-[12px] font-mono font-bold text-slate-800 focus:outline-none focus:border-slate-400 transition-colors"
                >
                  <option value="CONVENIO">Convenio Mensual ($75.000)</option>
                  <option value="NOCHE">Pernocta Noche ($8.000)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-[0.05em]">
                  Plaza Bloqueada
                </label>
                <input
                  type="text"
                  value={newConvSlot}
                  onChange={(e) => setNewConvSlot(e.target.value.toUpperCase())}
                  className="w-full h-11 px-3 rounded-[10px] border-[1.5px] border-[#dde2e8] bg-[#f8fafc] text-[12px] font-mono font-bold text-slate-800 focus:outline-none focus:border-slate-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-slate-900 text-white text-[12px] font-bold hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
            >
              Bloquear Plaza en Paralelo
            </button>
          </form>
        </div>

        {/* Parallel Roster List */}
        <div className="lg:col-span-7 bg-white border border-[#e8ecf0] rounded-2xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
            <h3 className="text-[11px] font-mono font-bold uppercase tracking-[0.07em] text-slate-500">
              Nómina Activa en Paralelo ({filteredAgreements.length} Plazas Reservadas)
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Serrano 447</span>
          </div>

          <div className="divide-y divide-[#f1f5f9] font-mono text-xs tabular-nums">
            {filteredAgreements.map((rec) => (
              <div key={rec.id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="license-plate-chip px-2.5 py-0.5 text-xs bg-white">
                    {rec.plate}
                  </span>
                  <div>
                    <div className="font-sans font-bold text-slate-900 text-[13px]">{rec.company}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Plaza {rec.slotCode}</span>
                      <span>·</span>
                      {rec.type === 'CONVENIO' ? (
                        <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.2 text-[10px] font-mono font-bold">
                          CONVENIO MENSUAL
                        </span>
                      ) : (
                        <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.2 text-[10px] font-mono font-bold">
                          PERNOCTA NOCHE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-slate-900 font-mono tabular-nums text-[14px]">
                    ${rec.amount.toLocaleString('es-CL')}
                  </div>
                  <span className="inline-block mt-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.2 text-[10px] font-mono font-bold">
                    {rec.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
