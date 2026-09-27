'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MacOSNavigationShell } from '@/components/MacOSNavigationShell';
import { ParkingSlot, Shift, AuditLog } from '@/types';
import {
  ShieldCheck,
  Download,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Lock,
  Unlock,
  X,
  FileBarChart2,
  Users
} from 'lucide-react';

interface PendingException {
  id: string;
  ticketId: string;
  patente: string;
  operador: string;
  tipo: 'DESCUENTO' | 'TICKET_PERDIDO';
  montoOriginal: number;
  montoFinal: number;
  motivo: string;
  timestamp: string;
  estado: 'PENDIENTE' | 'APROBADA';
}

export default function AdminDashboardPage() {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'antifraud' | 'blindcash'>('overview');

  const [gates, setGates] = useState([
    { id: 1, name: 'Gate 1 (Entrada Principal)', status: 'OPEN' as 'OPEN' | 'CLOSED' },
    { id: 2, name: 'Gate 2 (Salida Principal)', status: 'CLOSED' as 'OPEN' | 'CLOSED' },
    { id: 3, name: 'Gate 3 (Emergencia)', status: 'CLOSED' as 'OPEN' | 'CLOSED' },
    { id: 4, name: 'Gate 4 (Zona VIP)', status: 'OPEN' as 'OPEN' | 'CLOSED' },
  ]);

  const [exceptions, setExceptions] = useState<PendingException[]>([
    {
      id: 'AUD-01',
      ticketId: 'TKT-20260419-T01-0839',
      patente: 'JK-LP-34',
      operador: 'Ana R. (OP-01)',
      tipo: 'DESCUENTO',
      montoOriginal: 4500,
      montoFinal: 3600,
      motivo: 'Convenio comercial Notaría Serrano con timbre validado en garita.',
      timestamp: '10:42:18 CLT',
      estado: 'APROBADA',
    },
    {
      id: 'AUD-02',
      ticketId: 'TKT-20260419-T01-0841',
      patente: 'ABCD-12',
      operador: 'Ana R. (OP-01)',
      tipo: 'TICKET_PERDIDO',
      montoOriginal: 3200,
      montoFinal: 8000,
      motivo: 'Extravío de ticket declarado por conductor; se aplica recargo $8.000 CLP.',
      timestamp: '11:15:04 CLT',
      estado: 'PENDIENTE',
    },
  ]);

  const [selectedException, setSelectedException] = useState<PendingException | null>(null);
  const [adminPin, setAdminPin] = useState('');
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/slots').then((r) => r.json()).catch(() => ({ slots: [] })),
      fetch('/api/shifts').then((r) => r.json()).catch(() => ({ shift: null })),
    ]).then(([resSlots, resShift]) => {
      if (resSlots.slots) setSlots(resSlots.slots);
      if (resShift.shift) setCurrentShift(resShift.shift);
    });
  }, []);

  const occupiedCount = slots.filter((s) => s.estado !== 'DISPONIBLE').length;
  const occupancyPct = Math.round((occupiedCount / 30) * 100);

  const toggleGate = (id: number, nextStatus: 'OPEN' | 'CLOSED') => {
    setGates((prev) => prev.map((g) => (g.id === id ? { ...g, status: nextStatus } : g)));
  };

  const handleApproveWithAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin.length < 4 || !selectedException) return;
    setExceptions((prev) =>
      prev.map((ex) => (ex.id === selectedException.id ? { ...ex, estado: 'APROBADA' } : ex))
    );
    setBannerMsg(`Excepción ${selectedException.id} autorizada con PIN Administrador.`);
    setSelectedException(null);
    setAdminPin('');
  };

  const handleExportCSV = () => {
    const headers = 'ID,Ticket,Patente,Operador,Tipo,Monto_Original,Monto_Final,Motivo,Estado\n';
    const rows = exceptions
      .map(
        (ex) =>
          `"${ex.id}","${ex.ticketId}","${ex.patente}","${ex.operador}","${ex.tipo}",${ex.montoOriginal},${ex.montoFinal},"${ex.motivo}","${ex.estado}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `auditoria_antifraude_cordano.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <MacOSNavigationShell
      title="Panel de Control & Auditoría"
      subtitle="Telemetría en tiempo real, control de barreras y conciliación de caja ciega"
      roleLabel="Administrador ERP"
      rightActions={
        <button
          type="button"
          onClick={handleExportCSV}
          className="px-3 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar CSV</span>
        </button>
      }
    >
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Regla 7: Segregación RBAC */}
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Segregación de Roles (Regla 7):</strong> El Administrador audita y visa excepciones por PIN, pero <strong>no abre turnos de caja directamente</strong>.
            </span>
          </div>
          <Link href="/admin/usuarios" className="font-bold text-[#80093A] hover:underline">
            Usuarios RBAC →
          </Link>
        </div>

        {bannerMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{bannerMsg}</span>
            </div>
            <button type="button" onClick={() => setBannerMsg(null)}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}

        {/* Fila de 4 KPIs Tabulares */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Ocupación (30 Plazas)</span>
            <div className="text-xl font-mono font-black text-slate-900 tabular-nums mt-1">
              {occupiedCount}/30 <span className="text-xs text-[#80093A]">({occupancyPct}%)</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Recaudación Rotativa</span>
            <div className="text-xl font-mono font-black text-emerald-700 tabular-nums mt-1">
              $185.000 <span className="text-xs text-slate-400">CLP</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Turnos Activos</span>
            <div className="text-xl font-mono font-black text-slate-900 tabular-nums mt-1">
              1 Turno <span className="text-xs text-emerald-600 font-semibold">● Mañana</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Alertas / Excepciones</span>
            <div className="text-xl font-mono font-black text-amber-700 tabular-nums mt-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>1 Pendiente</span>
            </div>
          </div>
        </div>

        {/* Conmutador de Pestañas del Panel */}
        <div className="flex border-b border-slate-200 pb-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded ${
              activeTab === 'overview' ? 'bg-[#80093A] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Control de Barreras
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('antifraud')}
            className={`px-3 py-1.5 rounded ${
              activeTab === 'antifraud' ? 'bg-[#80093A] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Auditoría Antifraude PIN
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blindcash')}
            className={`px-3 py-1.5 rounded ${
              activeTab === 'blindcash' ? 'bg-[#80093A] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cuadre de Caja Ciega
          </button>
        </div>

        {/* Sub-Pestaña 1: Control de Barreras */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase text-slate-700">Accionamiento de Barreras (Serrano 447)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {gates.map((gate) => (
                <div key={gate.id} className="p-3 rounded border border-slate-200 bg-slate-50 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{gate.name}</span>
                    <span className={`text-[10px] font-mono font-bold ${gate.status === 'OPEN' ? 'text-emerald-600' : 'text-slate-500'}`}>
                      Estado: {gate.status}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => toggleGate(gate.id, 'OPEN')}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                        gate.status === 'OPEN' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      OPEN
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleGate(gate.id, 'CLOSED')}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                        gate.status === 'CLOSED' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      CLOSE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Pestaña 2: Bitácora Antifraude */}
        {activeTab === 'antifraud' && (
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase text-slate-700">Excepciones y Autorizaciones por PIN</h2>
            <div className="space-y-2">
              {exceptions.map((ex) => (
                <div
                  key={ex.id}
                  className={`p-3 rounded border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${
                    ex.tipo === 'DESCUENTO' ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
                  }`}
                >
                  <div className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        ex.tipo === 'DESCUENTO' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}>
                        {ex.tipo}
                      </span>
                      <strong className="font-mono">{ex.patente}</strong>
                      <span className="text-slate-500">({ex.ticketId})</span>
                      <span className="text-slate-600">• {ex.operador}</span>
                    </div>
                    <p className="text-[11px] text-slate-700 mt-1">“{ex.motivo}”</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-xs tabular-nums">
                      ${ex.montoFinal.toLocaleString('es-CL')} CLP
                    </span>

                    {ex.estado === 'PENDIENTE' ? (
                      <button
                        type="button"
                        onClick={() => setSelectedException(ex)}
                        className="px-2.5 py-1 rounded bg-rose-700 text-white text-xs font-bold"
                      >
                        Visar con PIN
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700">✓ Aprobada</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Pestaña 3: Cuadre de Caja Ciega */}
        {activeTab === 'blindcash' && (
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase text-slate-700">Historial de Arqueos de Caja Ciega</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                    <th className="py-2.5 px-3">Turno</th>
                    <th className="py-2.5 px-3">Operador</th>
                    <th className="py-2.5 px-3 text-right">Efectivo Sistema</th>
                    <th className="py-2.5 px-3 text-right">Efectivo Recontado</th>
                    <th className="py-2.5 px-3 text-right">Diferencia</th>
                    <th className="py-2.5 px-3">Hash SHA-256</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-3 font-bold">TURNO-20260419-M01</td>
                    <td className="py-2.5 px-3 font-sans">Ana R. (OP-01)</td>
                    <td className="py-2.5 px-3 text-right">$142.500</td>
                    <td className="py-2.5 px-3 text-right">$142.500</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">$0 (Cuadre)</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[10px]">9f86d081...8b4c2a</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Visado con PIN Admin */}
      {selectedException && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelectedException(null)}
        >
          <div
            className="bg-white rounded-xl border border-slate-300 max-w-sm w-full p-4 shadow-xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-900">Visar Excepción con PIN Admin</span>
              <button type="button" onClick={() => setSelectedException(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-2.5 rounded bg-slate-50 text-xs font-mono">
              <div className="font-bold">{selectedException.patente} • {selectedException.ticketId}</div>
              <div className="text-slate-600 mt-0.5">{selectedException.motivo}</div>
            </div>

            <form onSubmit={handleApproveWithAdminPin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  PIN Administrador (4 dígitos)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  autoFocus
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="••••"
                  className="w-full h-10 text-center font-mono font-black text-xl tracking-[0.4em] rounded border border-slate-300"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedException(null)}
                  className="flex-1 h-9 rounded bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-9 rounded bg-[#80093A] text-white text-xs font-bold"
                >
                  Autorizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MacOSNavigationShell>
  );
}
