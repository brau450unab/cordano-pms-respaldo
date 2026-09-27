'use client';

import React, { useState } from 'react';
import { MacOSNavigationShell } from '@/components/MacOSNavigationShell';
import { ShieldCheck, KeyRound, Lock, CheckCircle2 } from 'lucide-react';

interface StaffUser {
  id: string;
  nombre: string;
  rol: 'OPERADOR_GARITA' | 'SUPERVISOR' | 'ADMINISTRADOR';
  pinMasked: string;
  accesoCajaCiega: boolean;
  permisos: string;
}

const INITIAL_USERS: StaffUser[] = [
  {
    id: 'OP-01',
    nombre: 'Ana R. (Garita Mañana)',
    rol: 'OPERADOR_GARITA',
    pinMasked: '•••• (4821)',
    accesoCajaCiega: true,
    permisos: 'Check-in, Cobro, Arqueo Ciego, Descuento con PIN + Justificación >10 car.',
  },
  {
    id: 'OP-02',
    nombre: 'Carlos M. (Garita Tarde)',
    rol: 'OPERADOR_GARITA',
    pinMasked: '•••• (7390)',
    accesoCajaCiega: true,
    permisos: 'Check-in, Cobro, Arqueo Ciego, Descuento con PIN + Justificación >10 car.',
  },
  {
    id: 'SUP-01',
    nombre: 'Roberto V. (Supervisor)',
    rol: 'SUPERVISOR',
    pinMasked: '•••• (9104)',
    accesoCajaCiega: true,
    permisos: 'Visado Ticket Perdido ($8.000), Anulaciones, Fila Sobrecupo SC-01..05',
  },
  {
    id: 'ADM-01',
    nombre: 'Gerencia Cordano Inversiones',
    rol: 'ADMINISTRADOR',
    pinMasked: '•••• (0001)',
    accesoCajaCiega: false,
    permisos: 'Auditoría Cierres Z SHA-256, Motor de Tarifas, RBAC (Incompatibilidad de Caja)',
  },
];

export default function UsuariosPage() {
  const [users] = useState<StaffUser[]>(INITIAL_USERS);

  return (
    <MacOSNavigationShell
      title="Usuarios & Matriz RBAC"
      subtitle="Regla 7: Segregación de roles e incompatibilidad de caja para administradores"
      roleLabel="Seguridad RBAC"
    >
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Banner Regla 7 */}
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Incompatibilidad de Caja (Regla 7):</strong> El Administrador audita y visa excepciones, pero no puede abrir turnos de caja para resguardar la trazabilidad del arqueo.
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Funcionario</th>
                <th className="py-2.5 px-3">Rol RBAC</th>
                <th className="py-2.5 px-3">PIN</th>
                <th className="py-2.5 px-3">Caja Ciega</th>
                <th className="py-2.5 px-3">Permisos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-3 px-3 font-mono font-bold text-slate-500">{u.id}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{u.nombre}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-800">
                      {u.rol}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{u.pinMasked}</td>
                  <td className="py-3 px-3">
                    {u.accesoCajaCiega ? (
                      <span className="text-emerald-700 font-bold">Habilitado</span>
                    ) : (
                      <span className="text-rose-700 font-bold">Bloqueado (Admin)</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{u.permisos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MacOSNavigationShell>
  );
}
