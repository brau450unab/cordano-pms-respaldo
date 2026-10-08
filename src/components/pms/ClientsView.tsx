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
      agreementType: (newConvType === 'CONVENIO' ? 'Convenio Empresa' : 'Convenio Mensual') as AgreementType,
      monthlyFeeClp: fee,
      validUntil: validUntilDate.toISOString(),
    });

    onShowToast(
      `Servicio en paralelo (${newConvType}) para ${cleanPlate} en cupo ${newConvSlot.toUpperCase()} registrado sin alterar caja rotativa.`,
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
    <div id="view-clients" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-[#2C1338] animate-fade-in-up">
      {/* ── SECTION HEADER (TOGGL TRACK STYLE) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EDE4E2] pb-4 gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7EEFA] border border-[#9E59C7]/30 text-[#9E59C7] text-xs tabular-nums font-bold mb-2">
            <span>SUBMÓDULO EN PARALELO · SERRANO 447</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2C1338]">
            Convenios Mensuales &amp; Servicio Nocturno
          </h2>
          <p className="text-xs sm:text-sm text-[#65546C] mt-0.5">
            Bloquea cupo en la matriz Serrano 447 sin ingresar a transitorios ni alterar la contabilidad rotativa del turno.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por patente, titular, plaza..."
            className="w-64 h-10 px-3 rounded-full border border-[#EDE4E2] bg-white text-xs tabular-nums focus:border-[#E2498A] focus:outline-none placeholder:text-[#96859B] shadow-xs"
          />
        </div>
      </div>

      {/* ── TWO COLUMNS: REGISTRATION FORM (LEFT) + ROSTER LIST (RIGHT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Registration Form */}
        <div className="lg:col-span-5 bg-white border border-[#EDE4E2] rounded-2xl shadow-xs p-6 space-y-5">
          <h3 className="text-xs tabular-nums font-bold uppercase tracking-wider text-[#2C1338] border-b border-[#F7EFE9] pb-3">
            Registrar Servicio en Paralelo 
          </h3>

          <form onSubmit={handleAddParallel} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#65546C] mb-1.5 uppercase">
                Patente Vehículo *
              </label>
              <input
                type="text"
                value={newConvPlate}
                onChange={(e) => setNewConvPlate(e.target.value.toUpperCase())}
                placeholder="Ej. KJWP92"
                maxLength={8}
                className="w-full h-11 px-3 rounded-xl border border-[#EDE4E2] bg-[#FEF9F5] tabular-nums font-bold uppercase text-[#2C1338] text-xs focus:outline-none focus:border-[#E2498A] focus:ring-2 focus:ring-[#E2498A]/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#65546C] mb-1.5 uppercase">
                Empresa / Titular *
              </label>
              <input
                type="text"
                value={newConvCompany}
                onChange={(e) => setNewConvCompany(e.target.value)}
                placeholder="Ej. Notaría Iquique / Clínica Tarapacá"
                className="w-full h-11 px-3 rounded-xl border border-[#EDE4E2] bg-[#FEF9F5] text-[#2C1338] text-xs focus:outline-none focus:border-[#E2498A] focus:ring-2 focus:ring-[#E2498A]/20 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#65546C] mb-1.5 uppercase">
                  Modalidad
                </label>
                <select
                  value={newConvType}
                  onChange={(e) => setNewConvType(e.target.value as 'CONVENIO' | 'NOCHE')}
                  className="w-full h-11 px-3 rounded-xl border border-[#EDE4E2] bg-[#FEF9F5] text-xs tabular-nums font-bold text-[#2C1338] focus:outline-none focus:border-[#E2498A] transition-colors cursor-pointer"
                >
                  <option value="CONVENIO">Convenio Mensual ($75.000)</option>
                  <option value="NOCHE">Pernocta Noche ($8.000)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#65546C] mb-1.5 uppercase">
                  Cupo Bloqueada
                </label>
                <input
                  type="text"
                  value={newConvSlot}
                  onChange={(e) => setNewConvSlot(e.target.value.toUpperCase())}
                  className="w-full h-11 px-3 rounded-xl border border-[#EDE4E2] bg-[#FEF9F5] text-xs tabular-nums font-bold text-[#2C1338] focus:outline-none focus:border-[#E2498A] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-[#E2498A] hover:bg-[#E57CD8] text-white text-xs font-extrabold shadow-[0_2px_10px_rgba(226,73,138,0.35)] transition-all cursor-pointer active:scale-[0.98]"
            >
              Bloquear Cupo en Paralelo
            </button>
          </form>
        </div>

        {/* Parallel Roster List */}
        <div className="lg:col-span-7 bg-white border border-[#EDE4E2] rounded-2xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#F7EFE9] pb-3">
            <h3 className="text-xs tabular-nums font-bold uppercase tracking-wider text-[#2C1338]">
              Nómina Activa en Paralelo ({filteredAgreements.length} Cupos Reservadas)
            </h3>
            <span className="text-[10px] tabular-nums text-[#96859B]">Serrano 447</span>
          </div>

          <div className="divide-y divide-[#F7EFE9] tabular-nums text-xs tabular-nums">
            {filteredAgreements.map((rec) => (
              <div key={rec.id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="license-plate-chip px-2.5 py-0.5 text-xs bg-white text-[#2C1338] border-[#2C1338]">
                    {rec.plate}
                  </span>
                  <div>
                    <div className="font-sans font-bold text-[#2C1338] text-xs">{rec.company}</div>
                    <div className="text-[11px] text-[#65546C] mt-0.5 flex items-center gap-2">
                      <span>Cupo {rec.slotCode}</span>
                      <span>·</span>
                      {rec.type === 'CONVENIO' ? (
                        <span className="inline-block bg-[#EAF6FB] text-[#2DA8D8] border border-[#2DA8D8]/30 rounded-full px-2 py-0.2 text-[10px] tabular-nums font-bold">
                          CONVENIO MENSUAL
                        </span>
                      ) : (
                        <span className="inline-block bg-[#FEF6E6] text-[#EAA023] border border-[#EAA023]/30 rounded-full px-2 py-0.2 text-[10px] tabular-nums font-bold">
                          PERNOCTA NOCHE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-[#2C1338] tabular-nums tabular-nums text-sm">
                    ${rec.amount.toLocaleString('es-CL')}
                  </div>
                  <span className="inline-block mt-0.5 bg-[#E8F8F2] text-[#2B9E78] border border-[#2B9E78]/30 rounded-full px-2 py-0.2 text-[10px] tabular-nums font-bold">
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
