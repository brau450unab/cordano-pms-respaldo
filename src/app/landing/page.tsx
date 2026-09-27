'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Car, LayoutGrid, ShieldCheck, BookOpen } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Encabezado Simple */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded bg-[#80093A] text-white font-bold text-sm flex items-center justify-center">
            P
          </span>
          <div>
            <span className="font-bold text-sm text-slate-900 block leading-tight">
              Cordano Inversiones Inmobiliarias Ltda.
            </span>
            <span className="text-[11px] text-slate-500">
              Serrano 447, Iquique — Portal Operativo
            </span>
          </div>
        </div>

        <Link
          href="/login"
          className="px-3.5 py-1.5 rounded bg-[#80093A] hover:bg-[#68072f] text-white text-xs font-bold"
        >
          Iniciar Sesión
        </Link>
      </header>

      {/* Contenido Central */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#80093A]/10 text-[#80093A] text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>ParkOps PMS &amp; ERP · Serrano 447</span>
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Control de Estacionamiento &amp; Módulos ERP
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Plataforma operativa con matriz de 30 plazas, control de tarifas por minuto, emisión de tickets térmicos 80mm duales (Code 128 + QR), arqueo de caja ciega y auditoría antifraude por PIN.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="h-10 px-5 rounded bg-[#80093A] hover:bg-[#68072f] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <span>Acceder al Sistema (Login)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="h-10 px-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5"
            >
              <Car className="w-4 h-4 text-[#80093A]" />
              <span>Garita POS Directo</span>
            </Link>

            <Link
              href="/documentacion"
              className="h-10 px-4 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Manuales SOP</span>
            </Link>
          </div>
        </div>

        {/* Resumen Estructural de Módulos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <strong className="font-bold text-slate-900 block mb-1">Garita &amp; POS (40/60)</strong>
            <p className="text-slate-500">Check-in rápido, emisión térmica y liquidación fraccionada sin scroll.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <strong className="font-bold text-slate-900 block mb-1">Caja Ciega &amp; Auditoría</strong>
            <p className="text-slate-500">Declaración física de valores, firma SHA-256 y visado PIN antifraude.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <strong className="font-bold text-slate-900 block mb-1">Servicios en Paralelo</strong>
            <p className="text-slate-500">Convenios y pernoctas nocturnas sin alterar la caja rotativa diaria.</p>
          </div>
        </div>
      </main>

      <footer className="py-4 border-t border-slate-200 text-center text-xs text-slate-400 bg-white">
        © 2026 Cordano Inversiones Inmobiliarias Ltda. • Serrano 447, Iquique
      </footer>
    </div>
  );
}
