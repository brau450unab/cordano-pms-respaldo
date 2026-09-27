'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

type RoleOption = 'operador' | 'supervisor' | 'admin';

const OPERATORS_BY_ROLE: Record<RoleOption, { id: string; name: string }[]> = {
  operador: [
    { id: 'OP-01', name: 'Ana R. (Turno Mañana)' },
    { id: 'OP-02', name: 'Carlos M. (Turno Tarde)' },
  ],
  supervisor: [
    { id: 'SUP-01', name: 'Roberto V. (Supervisor Recinto)' },
  ],
  admin: [
    { id: 'ADM-01', name: 'Gerencia Cordano Inversiones Ltda.' },
  ],
};

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleOption>('operador');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('OP-01');
  const [pin, setPin] = useState('1234');
  const [initialCash, setInitialCash] = useState<number>(50000);

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role);
    setSelectedProfileId(OPERATORS_BY_ROLE[role][0].id);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('parkops_active_role', selectedRole);
    }
    if (selectedRole === 'operador') {
      router.push('/');
    } else {
      router.push('/hub');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <Link href="/landing" className="text-xs font-bold text-slate-600 hover:text-slate-900">
          ← Volver a Inicio
        </Link>
        <span className="font-mono text-xs text-slate-500">Serrano 447, Iquique</span>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-sm">
          <div className="text-center space-y-1">
            <span className="w-10 h-10 rounded bg-[#80093A] text-white font-bold text-base flex items-center justify-center mx-auto">
              P
            </span>
            <h1 className="text-base font-bold text-slate-900">Acceso al Sistema</h1>
            <p className="text-xs text-slate-500">ParkOps PMS · Cordano Inversiones</p>
          </div>

          {/* Selector de Rol */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-slate-500 block">
              Rol de Usuario
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded text-xs font-bold">
              <button
                type="button"
                onClick={() => handleRoleSelect('operador')}
                className={`py-1.5 rounded ${
                  selectedRole === 'operador' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Operador
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('supervisor')}
                className={`py-1.5 rounded ${
                  selectedRole === 'supervisor' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Supervisor
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('admin')}
                className={`py-1.5 rounded ${
                  selectedRole === 'admin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Advertencia Regla 7 */}
          {selectedRole === 'admin' ? (
            <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Incompatibilidad de Caja (Regla 7):</strong> El rol Administrador audita y configura, pero no abre turnos de caja directamente.
              </span>
            </div>
          ) : (
            <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Turno de Caja Ciega</span>
              </span>
              <span className="font-mono font-bold tabular-nums">Base: ${initialCash.toLocaleString('es-CL')}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Funcionario Asignado
              </label>
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="w-full h-9 px-2.5 rounded border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[#80093A]"
              >
                {OPERATORS_BY_ROLE[selectedRole].map((op) => (
                  <option key={op.id} value={op.id}>
                    [{op.id}] {op.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedRole === 'operador' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Fondo Inicial de Caja (CLP)
                </label>
                <input
                  type="number"
                  step={5000}
                  value={initialCash}
                  onChange={(e) => setInitialCash(Number(e.target.value || 0))}
                  className="w-full h-9 px-2.5 rounded border border-slate-300 font-mono font-bold text-xs tabular-nums focus:outline-none focus:border-[#80093A]"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                PIN de Seguridad (4 dígitos)
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full h-10 pl-8 pr-3 text-center font-mono font-black text-xl tracking-[0.3em] rounded border border-slate-300 focus:outline-none focus:border-[#80093A]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 rounded bg-[#80093A] hover:bg-[#68072f] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>{selectedRole === 'operador' ? 'Abrir Turno en Garita POS' : 'Ingresar a Menú Central'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
