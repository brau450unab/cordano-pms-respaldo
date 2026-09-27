'use client';

import React, { useState } from 'react';
import { MacOSNavigationShell } from '@/components/MacOSNavigationShell';
import { Moon, Building2, Plus, Search, ShieldCheck, X } from 'lucide-react';

interface ParallelServiceRecord {
  id: string;
  patente: string;
  titular: string;
  empresa: string;
  modalidad: 'CONVENIO_MENSUAL' | 'PERNOCTA_NOCHE';
  plazaBloqueada: string;
  tarifaFija: number;
  vigencia: string;
  estado: 'ACTIVO' | 'POR_VENCER';
}

const INITIAL_CONVENIOS: ParallelServiceRecord[] = [
  {
    id: 'CNV-01',
    patente: 'JK-LP-34',
    titular: 'Rodrigo Poblete',
    empresa: 'Notaría Serrano 447',
    modalidad: 'CONVENIO_MENSUAL',
    plazaBloqueada: 'A-03 (VIP)',
    tarifaFija: 85000,
    vigencia: '01/04/2026 – 30/04/2026',
    estado: 'ACTIVO',
  },
  {
    id: 'CNV-02',
    patente: 'CD-AB-89',
    titular: 'Consulado de Italia',
    empresa: 'Cuerpo Consular Iquique',
    modalidad: 'CONVENIO_MENSUAL',
    plazaBloqueada: 'B-18 (VIP)',
    tarifaFija: 90000,
    vigencia: '01/04/2026 – 30/04/2026',
    estado: 'ACTIVO',
  },
  {
    id: 'PRN-03',
    patente: 'WX-YZ-19',
    titular: 'Transportes Tarapacá',
    empresa: 'Hotel Gavina Express',
    modalidad: 'PERNOCTA_NOCHE',
    plazaBloqueada: 'B-22 (Reservada)',
    tarifaFija: 5000,
    vigencia: '21:00 PM – 08:00 AM',
    estado: 'ACTIVO',
  },
];

export default function ConveniosPage() {
  const [records, setRecords] = useState<ParallelServiceRecord[]>(INITIAL_CONVENIOS);
  const [filterMode, setFilterMode] = useState<'ALL' | 'CONVENIO_MENSUAL' | 'PERNOCTA_NOCHE'>('ALL');
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  const [newPatente, setNewPatente] = useState('');
  const [newTitular, setNewTitular] = useState('');
  const [newEmpresa, setNewEmpresa] = useState('');
  const [newModalidad, setNewModalidad] = useState<'CONVENIO_MENSUAL' | 'PERNOCTA_NOCHE'>('PERNOCTA_NOCHE');
  const [newPlaza, setNewPlaza] = useState('A-09');

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatente.trim() || !newTitular.trim()) return;

    const item: ParallelServiceRecord = {
      id: `${newModalidad === 'CONVENIO_MENSUAL' ? 'CNV' : 'PRN'}-0${records.length + 1}`,
      patente: newPatente.toUpperCase(),
      titular: newTitular,
      empresa: newEmpresa || 'Particular Serrano 447',
      modalidad: newModalidad,
      plazaBloqueada: `${newPlaza} (${newModalidad === 'CONVENIO_MENSUAL' ? 'VIP' : 'Reservada'})`,
      tarifaFija: newModalidad === 'CONVENIO_MENSUAL' ? 85000 : 5000,
      vigencia: newModalidad === 'CONVENIO_MENSUAL' ? 'Mensual Vigente' : '21:00 PM – 08:00 AM',
      estado: 'ACTIVO',
    };

    setRecords([item, ...records]);
    setNewPatente('');
    setNewTitular('');
    setNewEmpresa('');
    setShowNewModal(false);
  };

  const filtered = records.filter((r) => {
    const matchesMode = filterMode === 'ALL' || r.modalidad === filterMode;
    const matchesSearch =
      r.patente.toLowerCase().includes(search.toLowerCase()) ||
      r.titular.toLowerCase().includes(search.toLowerCase()) ||
      r.empresa.toLowerCase().includes(search.toLowerCase());
    return matchesMode && matchesSearch;
  });

  return (
    <MacOSNavigationShell
      title="Convenios & Pernocta (Servicios en Paralelo)"
      subtitle="Regla 7: Bloquea plaza en la matriz sin alterar la contabilidad rotativa del día"
      roleLabel="Gestión Comercial"
      rightActions={
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="px-3 py-1.5 rounded bg-[#80093A] hover:bg-[#68072f] text-white text-xs font-bold flex items-center gap-1 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Nuevo Registro</span>
        </button>
      }
    >
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Banner Regla 7 */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <strong>Aislamiento Contable (Regla 7):</strong> Las plazas asignadas a convenios o pernoctas nocturnas se bloquean en la matriz en color Azul (VIP) o Ámbar (Reservada), sin ingresar al flujo de caja rotativo de garita.
          </div>
        </div>

        {/* Filtro y Búsqueda */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex bg-slate-100 p-0.5 rounded text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1 rounded ${filterMode === 'ALL' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'}`}
            >
              Todos ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('CONVENIO_MENSUAL')}
              className={`px-3 py-1 rounded ${filterMode === 'CONVENIO_MENSUAL' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600'}`}
            >
              Convenios Mensuales
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('PERNOCTA_NOCHE')}
              className={`px-3 py-1 rounded ${filterMode === 'PERNOCTA_NOCHE' ? 'bg-white shadow-xs text-amber-700' : 'text-slate-600'}`}
            >
              Pernocta Noche ($5.000)
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar patente o titular..."
              className="w-full h-8 pl-8 pr-2.5 rounded border border-slate-300 text-xs focus:outline-none focus:border-[#80093A]"
            />
          </div>
        </div>

        {/* Tabla Limpia de Registros */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-2.5 px-3">Folio</th>
                <th className="py-2.5 px-3">Patente</th>
                <th className="py-2.5 px-3">Titular / Empresa</th>
                <th className="py-2.5 px-3">Modalidad</th>
                <th className="py-2.5 px-3">Plaza Bloqueada</th>
                <th className="py-2.5 px-3">Vigencia</th>
                <th className="py-2.5 px-3 text-right">Tarifa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 px-3 font-mono font-bold text-slate-500">{r.id}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{r.patente}</td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-800 block">{r.titular}</span>
                    <span className="text-[11px] text-slate-500">{r.empresa}</span>
                  </td>
                  <td className="py-3 px-3">
                    {r.modalidad === 'CONVENIO_MENSUAL' ? (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px]">
                        Convenio Mensual
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold text-[11px]">
                        Pernocta Noche
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-700">{r.plazaBloqueada}</td>
                  <td className="py-3 px-3 text-slate-600">{r.vigencia}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#80093A]">
                    ${r.tarifaFija.toLocaleString('es-CL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Registro */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowNewModal(false)}
        >
          <div
            className="bg-white rounded-xl border border-slate-300 max-w-sm w-full p-4 shadow-xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-900">Registrar Convenio o Pernocta</h3>
              <button type="button" onClick={() => setShowNewModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Modalidad</label>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setNewModalidad('PERNOCTA_NOCHE')}
                    className={`py-1.5 rounded border ${
                      newModalidad === 'PERNOCTA_NOCHE' ? 'bg-[#80093A] text-white border-[#80093A]' : 'bg-slate-50'
                    }`}
                  >
                    Pernocta ($5.000)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewModalidad('CONVENIO_MENSUAL')}
                    className={`py-1.5 rounded border ${
                      newModalidad === 'CONVENIO_MENSUAL' ? 'bg-[#80093A] text-white border-[#80093A]' : 'bg-slate-50'
                    }`}
                  >
                    Convenio ($85.000)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Patente</label>
                  <input
                    type="text"
                    required
                    value={newPatente}
                    onChange={(e) => setNewPatente(e.target.value.toUpperCase())}
                    placeholder="ABCD-12"
                    className="w-full h-8 px-2 rounded border border-slate-300 font-mono text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Plaza</label>
                  <select
                    value={newPlaza}
                    onChange={(e) => setNewPlaza(e.target.value)}
                    className="w-full h-8 px-2 rounded border border-slate-300 text-xs font-mono"
                  >
                    <option value="A-09">Plaza A-09</option>
                    <option value="A-15">Plaza A-15</option>
                    <option value="B-21">Plaza B-21</option>
                    <option value="B-28">Plaza B-28</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Titular</label>
                <input
                  type="text"
                  required
                  value={newTitular}
                  onChange={(e) => setNewTitular(e.target.value)}
                  placeholder="Nombre y Apellido"
                  className="w-full h-8 px-2 rounded border border-slate-300 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 h-8 rounded bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-8 rounded bg-[#80093A] text-white text-xs font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MacOSNavigationShell>
  );
}
