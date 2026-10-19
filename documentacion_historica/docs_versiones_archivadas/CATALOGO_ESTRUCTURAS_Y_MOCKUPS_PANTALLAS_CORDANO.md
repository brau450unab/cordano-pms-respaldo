# Catálogo Maestro de Recomendaciones Visuales, Wireframes y Código de Estructuras UI/UX por Pantalla
## ParkOps PMS & ERP — Cordano Inversiones Inmobiliarias Ltda. (Serrano 447, Iquique)
**Versión**: 2.0 Canónica  
**Estética Base**: macOS Sonoma / Sequoia Enterprise (`#F9F9FB` Surface + `#80093A` Cordano Burgundy + `backdrop-blur-xl` + `tabular-nums`)  
**Resoluciones Objetivo**: `1920×1080` (Full HD Garita sin Scroll) · `2560×1440` / `4K` (Administración) · `80mm` (`302px` Impresión Térmica / PDF)

---

## Galería de Láminas Visuales de Recomendación Generadas

Las siguientes láminas visuales de alta resolución se encuentran almacenadas en `docs/mockups/` dentro del repositorio:

1. **Punto de Venta (POS Garita) + Layout Interactivo del Estacionamiento (40/60 Sin Scroll)**:  
   `docs/mockups/ui_garita_pos_y_layout_estacionamiento.jpg`
2. **Menú Central (App Launcher Odoo/macOS) + Panel de Control Ejecutivo**:  
   `docs/mockups/ui_menu_central_launchpad_y_panel_control.jpg`
3. **Landing Page Interna + Login Corporativo + Módulo de Manuales y Soporte**:  
   `docs/mockups/ui_landing_login_manuales_soporte.jpg`
4. **Popups Flotantes (`backdrop-blur`) + Ticket en PDF/80mm + Reportes Z + Configuraciones**:  
   `docs/mockups/ui_popups_reportes_configuracion_ticket_pdf.jpg`
5. **Menú Lateral Colapsable + Convenios/Noche + Usuarios RBAC + Monitoreo CCTV LPR**:  
   `docs/mockups/ui_menu_lateral_convenios_usuarios_cctv.jpg`

---

## 1. Landing Page (`/landing` — Portal de Acceso Interno Minimalista)

### 1.1 Recomendaciones de Diseño UX/UI
- **Propósito**: Puerta de enlace institucional limpia y sin distracciones comerciales públicas. Pensada exclusivamente para el personal de **Cordano Inversiones Inmobiliarias Ltda.** en Serrano 447.
- **Jerarquía Visual**:
  1. Cabecera con isotipo **Cordano** en `#80093A` y badge de estado de conexión Cloud Run (`Online` / `Contingencia Offline`).
  2. Tarjeta heroica central con acceso directo a la **Consola Operativa de Garita (`/`)** y al **Menú Central Administrativo (`/admin`)**.
  3. Sección inferior de **Manuales Operativos SOP y Soporte Técnico (`/documentacion` y `/faq`)**, protegida por **PIN o contraseña** antes de desbloquear la lectura de reglamentos internos.

### 1.2 Wireframe Estructural
```text
+-----------------------------------------------------------------------------------+
| [● ● ●]  CORDANO INVERSIONES INMOBILIARIAS LTDA.          [● Cloud Run: En Línea] |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                     +---------------------------------------+                     |
|                     |       [Logo Institucional Cordano]    |                     |
|                     |     ParkOps PMS & ERP · Serrano 447   |                     |
|                     |   Sistema de Control de Estacionamiento|                    |
|                     |                                       |                     |
|                     |  [  INGRESAR A CONSOLA GARITA (F1) ]  |  <-- Botón #80093A  |
|                     |  [     MENÚ CENTRAL DE MÓDULOS     ]  |  <-- Botón Secund.  |
|                     +---------------------------------------+                     |
|                                                                                   |
|          +-------------------------------------------------------------+          |
|          | 🔒 MANUALES OPERATIVOS Y SOPORTE TÉCNICO (Protegido con PIN)|          |
|          | [ PIN / Clave: •••• ]  [ Desbloquear Manual SOP ] [ Soporte ]|          |
|          +-------------------------------------------------------------+          |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### 1.3 Código de Estructura Recomendada (`src/app/landing/page.tsx`)
```tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, BookOpen, LifeBuoy, ArrowRight, Terminal } from 'lucide-react';

export function LandingPortalStructure() {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234' || pin === '9999') setUnlocked(true);
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] text-[#1D1D1F] flex flex-col justify-between p-6 select-none">
      {/* Top Institutional Bar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#80093A] flex items-center justify-center text-white font-bold">
            C
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Cordano Inversiones Inmobiliarias Ltda.</h1>
            <p className="text-xs text-slate-500">Serrano 447, Iquique · Nodo Local + Cloud Run us-west1</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Servicio Activo · 30 Plazas
        </span>
      </header>

      {/* Center Access Card */}
      <main className="max-w-md w-full mx-auto my-auto space-y-5">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm text-center space-y-6">
          <div className="inline-flex p-3 rounded-2xl bg-[#80093A]/10 text-[#80093A]">
            <Terminal className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">ParkOps PMS & ERP</h2>
            <p className="text-sm text-slate-500">Portal Interno de Operación de Garita y Control de Caja</p>
          </div>

          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full h-12 rounded-xl bg-[#80093A] hover:bg-[#60062B] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition"
            >
              Ingresar a Consola Operativa
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/admin"
              className="w-full h-12 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-medium text-sm flex items-center justify-center gap-2 transition"
            >
              Menú Central de Módulos (Admin)
            </Link>
          </div>
        </div>

        {/* PIN-Protected Manuals & Support Card */}
        <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 mb-3">
            <Lock className="w-4 h-4 text-[#80093A]" />
            <span>Manuales SOP y Soporte (Acceso con PIN)</span>
          </div>

          {!unlocked ? (
            <form onSubmit={handleUnlock} className="flex gap-2">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN (ej. 1234)"
                className="flex-1 h-10 px-3 rounded-xl border border-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#80093A]"
              />
              <button
                type="submit"
                className="px-4 h-10 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Desbloquear
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/documentacion"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200"
              >
                <BookOpen className="w-4 h-4" /> Manual SOP Garita
              </Link>
              <Link
                href="/faq"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
              >
                <LifeBuoy className="w-4 h-4" /> Soporte y FAQ
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 font-mono">
        ParkOps v2.0 · Cordano Inversiones Inmobiliarias Ltda. · Uso Exclusivo Interno
      </footer>
    </div>
  );
}
```

---

## 2. Manuales y Soporte (`/documentacion` y `/faq`)

### 2.1 Recomendaciones de Diseño UX/UI
- **Navegación por Pestañas (3 Capas)**:
  1. **Flujo Operativo SOP (6 Fases)**: Paso a paso interactivo del día del operador (Inicio de turno, Ingreso vehicular, Servicios paralelos, Salida y cobro, Excepciones PIN y Cierre de caja ciega).
  2. **Repositorio de Documentación Canónica V2.0 + Archivo Histórico**: Conectado a `/api/docs` para leer en vivo los `.md` vigentes (`PRD_SISTEMA_DE_PARKING.md`, `DESIGN.md`, etc.) y los documentos con prefijo `[ARCHIVADO]_`.
  3. **Mesa de Ayuda y Solución de Problemas (FAQ)**: Guías rápidas ante atasco de impresora térmica 80mm, caída de internet (modo Offline `O`) o fallo de barrera.

### 2.2 Código de Estructura Recomendada (`src/app/documentacion/page.tsx`)
```tsx
import React, { useState } from 'react';
import { BookOpen, FileText, Archive, HelpCircle, CheckCircle2, Printer, WifiOff, ShieldAlert } from 'lucide-react';

export function ManualesYSoporteStructure() {
  const [activeTab, setActiveTab] = useState<'sop' | 'repo' | 'faq'>('sop');

  const sopPhases = [
    { step: '01', title: 'Apertura de Turno y Fondo Inicial', desc: 'Declarar sencillo en CLP ($50.000). El rol Admin tiene bloqueada la apertura de caja.' },
    { step: '02', title: 'Ingreso y Emisión de Ticket 80mm', desc: 'Digitar patente (F2), asignar plaza en matriz 7x5 e imprimir ticket con Code 128 + QR.' },
    { step: '03', title: 'Servicios Paralelos (Noche / Convenios)', desc: 'Registrar en submódulo F3. Bloquea la plaza en azul/ámbar sin mezclar con caja por minuto.' },
    { step: '04', title: 'Salida, Regla de Gracia (10 min) y Cobro', desc: 'Escanear barcode/QR. Si estadía <= 10 min cobra $0; si supera, aplica tarifa completa.' },
    { step: '05', title: 'Excepciones Antifraude con PIN', desc: 'Verde (PIN Operador + motivo >10 car.) para descuentos. Rojo (PIN Admin) para ticket perdido ($8.000).' },
    { step: '06', title: 'Cierre de Turno y Arqueo Ciego (Reporte Z)', desc: 'Declarar efectivo físico recontado sin ver el monto esperado. Emite hash SHA-256.' },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9FB] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Tabs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Manual Operativo SOP, Documentación y Soporte</h1>
            <p className="text-xs text-slate-500">Guía interactiva de garita y repositorio documental V2.0</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab('sop')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'sop' ? 'bg-[#80093A] text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              Flujo Operativo (6 Fases)
            </button>
            <button
              onClick={() => setActiveTab('repo')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'repo' ? 'bg-[#80093A] text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              Repositorio Docs & Archivo
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'faq' ? 'bg-[#80093A] text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              Soporte Rápido & Contingencia
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'sop' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sopPhases.map((p) => (
              <div key={p.step} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#80093A]/10 text-[#80093A]">
                    FASE {p.step}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{p.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 3. Login Corporativo (`/login`)

### 3.1 Recomendaciones de Diseño UX/UI
- **Selector de Perfil Explicito**: Pestañas superiores para elegir **Operador de Garita**, **Supervisor** o **Administrador**.
- **Aviso de Segregación de Funciones**: Cuando se selecciona **Administrador**, se muestra un badge preventivo indicando que el Administrador audita y configura pero **no puede abrir turnos de caja**.
- **Teclado Numérico / PIN Rápido**: Campo PIN de 4 dígitos en fuente monoespaciada (`font-mono tabular-nums`) con soporte para `Enter` directo.

### 3.2 Código de Estructura Recomendada (`src/app/login/page.tsx`)
```tsx
import React, { useState } from 'react';
import { KeyRound, UserCheck, ShieldAlert, ArrowRight } from 'lucide-react';

export function LoginScreenStructure() {
  const [role, setRole] = useState<'OPERADOR' | 'SUPERVISOR' | 'ADMIN'>('OPERADOR');
  const [pin, setPin] = useState('');

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 shadow-lg space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-[#80093A] text-white font-bold text-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            C
          </div>
          <h1 className="text-xl font-bold text-slate-900">Control de Acceso ParkOps</h1>
          <p className="text-xs text-slate-500">Seleccione perfil operativo e ingrese su PIN personal</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl gap-1">
          {(['OPERADOR', 'SUPERVISOR', 'ADMIN'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                role === r ? 'bg-white text-[#80093A] shadow-sm' : 'text-slate-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* RBAC Warning for Admin */}
        {role === 'ADMIN' && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>Regla de Caja Ciega:</strong> El perfil Administrador tiene acceso a Auditoría y Configuración, pero no puede abrir turnos de caja operativa.
            </span>
          </div>
        )}

        {/* PIN Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 block">PIN de Seguridad (4 dígitos)</label>
          <input
            type="password"
            maxLength={4}
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            className="w-full h-12 px-4 rounded-xl border border-slate-300 text-center font-mono text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#80093A]"
          />
        </div>

        <button
          type="button"
          className="w-full h-12 rounded-xl bg-[#80093A] hover:bg-[#60062B] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition"
        >
          Iniciar Sesión en {role === 'OPERADOR' ? 'Consola de Garita' : 'Panel Central'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

---

## 4. Menú Central (App Launcher Odoo / macOS Launchpad — `/admin`)

### 4.1 Recomendaciones de Diseño UX/UI
- **Patrón de Navegación Despejado**: En lugar de saturar la pantalla inicial del administrador con tablas densas, el **Menú Central** presenta una grilla `4×2` de **8 tarjetas modulares grandes** estilo Odoo / macOS Launchpad.
- **Indicadores en Tiempo Real por Módulo**: Cada tarjeta incluye ícono semántico, título, descripción breve, atajo de teclado o ruta, y un badge con el estado actual (ej. `22/30 Plazas`, `Turno Activo`, `14 Docs Vigentes`).

### 4.2 Wireframe Estructural
```text
+-----------------------------------------------------------------------------------+
| [● ● ●]  PARKOPS PMS · MENÚ CENTRAL DE MÓDULOS          [Buscar módulo...] [Admin]|
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  +-----------------+  +-----------------+  +-----------------+  +---------------+ |
|  | [🚗] GARITA POS |  | [🗺️] MAPA VIVO  |  | [🌙] CONVENIOS  |  | [🔐] CAJA CIEGA| |
|  | Consola 40/60   |  | Matriz 7x5 (35) |  | Mensuales/Noche |  | Arqueo y PINs | |
|  | [F1 · Activo]   |  | [22/30 Ocupadas]|  | [6 Bloqueadas]  |  | [Sin Alertas] | |
|  +-----------------+  +-----------------+  +-----------------+  +---------------+ |
|                                                                                   |
|  +-----------------+  +-----------------+  +-----------------+  +---------------+ |
|  | [📊] REPORTES Z |  | [⚙️] CONFIGURAC.|  | [👥] USUARIOS   |  | [📘] MANUALES | |
|  | SHA-256 & KPIs  |  | Tarifas & 80mm  |  | Roles RBAC/PIN  |  | SOP & Archivo | |
|  | [Exportar PDF]  |  | [$30/min · 10m] |  | [3 Perfiles]    |  | [V2.0 Canónico| |
|  +-----------------+  +-----------------+  +-----------------+  +---------------+ |
+-----------------------------------------------------------------------------------+
```

### 4.3 Código de Estructura Recomendada (`src/app/admin/page.tsx` — Vista Launchpad)
```tsx
import React from 'react';
import Link from 'next/link';
import { Car, LayoutGrid, Moon, Vault, BarChart3, Settings, Users, BookOpen } from 'lucide-react';

export function CentralAppLauncherStructure() {
  const modules = [
    { id: 'pos', title: 'Consola Garita POS', desc: 'Ingreso, salida y cobro sin scroll (40/60)', href: '/', badge: 'F1 · Operativo', icon: Car, color: 'bg-[#80093A]' },
    { id: 'map', title: 'Mapa de Plazas 7×5', desc: 'Matriz en tiempo real Serrano 447 (30 plazas)', href: '/?view=map', badge: '22/30 Ocupadas', icon: LayoutGrid, color: 'bg-emerald-600' },
    { id: 'conv', title: 'Convenios y Noche', desc: 'Registro paralelo sin alterar flujo por minuto', href: '/convenios', badge: 'F3 · 6 Activos', icon: Moon, color: 'bg-blue-600' },
    { id: 'cash', title: 'Arqueo de Caja Ciega', desc: 'Conciliación Efectivo Sistema vs Físico', href: '/admin?tab=caja', badge: 'F4 · Auditado', icon: Vault, color: 'bg-amber-600' },
    { id: 'rep', title: 'Reportes Z y Analítica', desc: 'Curva horaria, cierres Z y sello SHA-256', href: '/reportes', badge: 'SHA-256 Activo', icon: BarChart3, color: 'bg-purple-600' },
    { id: 'cfg', title: 'Configuración y Tarifas', desc: 'Motor tarifario ($30/min), gracia (10m) e impresora', href: '/configuracion', badge: '$30/min · 10m', icon: Settings, color: 'bg-slate-700' },
    { id: 'usr', title: 'Usuarios y Roles PIN', desc: 'Perfiles RBAC y PINs individuales de autorización', href: '/admin/usuarios', badge: 'RBAC Estricto', icon: Users, color: 'bg-cyan-600' },
    { id: 'doc', title: 'Manuales SOP y Soporte', desc: 'Flujo de 6 fases, repositorio V2.0 y archivo', href: '/documentacion', badge: 'V2.0 Canónico', icon: BookOpen, color: 'bg-rose-700' },
  ];

  return (
    <section className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Menú Central de Módulos</h2>
          <p className="text-sm text-slate-500">Seleccione un módulo operativo o administrativo (Estilo Launchpad)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.id}
              href={m.href}
              className="group bg-white border border-slate-200/90 hover:border-[#80093A]/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between h-48"
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl ${m.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {m.badge}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#80093A] transition">{m.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
```

---

## 5. Panel de Control Ejecutivo (`/hub` y Vista Resumen de `/admin`)

### 5.1 Recomendaciones de Diseño UX/UI
- **4 Tarjetas KPI Superiores con `tabular-nums`**:
  1. Recaudación del Día en CLP (`$412.500`).
  2. Ocupación en Tiempo Real (`25 / 30 Plazas · 83.3%`).
  3. Excepciones Auditadas (`2 Descuentos Verde / 1 Ticket Perdido Rojo`).
  4. Estado de Sincronización Cloud Run (`cordano-pms-v1` · `0 Pendientes en IndexedDB`).
- **Control Remoto de Barreras y Telemetría de Hardware**: Botones de acción rápida para destrabar Barrera de Entrada o Salida con registro en bitácora.

### 5.2 Código de Estructura Recomendada (`src/app/hub/page.tsx`)
```tsx
import React from 'react';
import { DollarSign, CarFront, ShieldAlert, Cloud, Unlock, Sparkles } from 'lucide-react';

export function ControlPanelDashboardStructure() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Ingresos del Día</span>
          <p className="text-3xl font-bold font-mono tabular-nums text-slate-900 mt-2">$412.500</p>
          <span className="text-xs text-emerald-600 font-medium">+14.2% vs ayer · CLP</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Ocupación Serrano 447</span>
          <p className="text-3xl font-bold font-mono tabular-nums text-slate-900 mt-2">25 / 30</p>
          <span className="text-xs text-blue-600 font-mono tabular-nums">83.3% · 5 Disponibles</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Auditoría Antifraude</span>
          <div className="flex items-baseline gap-3 mt-2 font-mono tabular-nums">
            <span className="text-lg font-bold text-emerald-600">2 Desc.</span>
            <span className="text-lg font-bold text-red-600">1 Extravío</span>
          </div>
          <span className="text-xs text-slate-500">Todos validados con PIN</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Cloud Run Sync</span>
          <p className="text-xl font-bold font-mono text-emerald-600 mt-2">us-west1 OK</p>
          <span className="text-xs text-slate-500 font-mono tabular-nums">Cola Offline: 0 tickets</span>
        </div>
      </div>

      {/* Gate Controls + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Control Manual de Barreras y Periféricos</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Barrera Acceso #1 (Serrano)</p>
                <p className="text-xs text-emerald-600 font-mono">Estado: CERRADA · Sensor OK</p>
              </div>
              <button className="px-3.5 py-2 rounded-xl bg-[#80093A] text-white text-xs font-semibold flex items-center gap-1.5">
                <Unlock className="w-3.5 h-3.5" /> Pulso F9
              </button>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Impresora Térmica 80mm</p>
                <p className="text-xs text-emerald-600 font-mono">ESC/POS · Papel OK · 203 DPI</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-mono font-bold">
                LISTA
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#80093A]">
            <Sparkles className="w-4 h-4" />
            <span>Copiloto Operativo Gemini IA</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hora punta detectada en Sector A (93% ocupación). Se recomienda asignar próximos ingresos transitorios a las plazas <strong>B-18 a B-24</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Punto de Venta — Consola Operativa de Garita (`/` — Columna Izquierda 40%)

### 6.1 Recomendaciones de Diseño UX/UI
- **Regla Cero Scroll (`h-[calc(100vh-3.5rem)] overflow-hidden`)**: Todo el proceso de ingreso, lectura de código de barras/QR, liquidación de tarifa y cobro vive en el **40% izquierdo** de la pantalla de garita.
- **Autofoco Permanente (`F2`)**: El input de patente o folio `TKT-...` captura inmediatamente el lector láser Code 128 o el teclado en mayúsculas (`font-mono uppercase tracking-widest`).
- **Liquidación Transparente con Regla de Gracia (10 min)**: Muestra hora de entrada, minutos transcurridos, indica si aplica gracia (`<= 10 min = $0`) y desglosa el total en `tabular-nums`.

### 6.2 Código de Estructura Recomendada (`POSBoothConsoleColumn.tsx`)
```tsx
import React from 'react';
import { QrCode, Banknote, CreditCard, Printer, Unlock, Percent, AlertTriangle } from 'lucide-react';

export function POSBoothConsoleColumn() {
  return (
    <aside className="w-full lg:w-[40%] h-full bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm flex flex-col justify-between overflow-hidden">
      {/* 1. Search / Plate Input with F2 Autofocus */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Matrícula / Lector Barcode o QR
          </label>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
            Atajo F2
          </span>
        </div>
        <div className="relative">
          <input
            type="text"
            autoFocus
            defaultValue="ABCD-12"
            placeholder="ABCD-12 o TKT-..."
            className="w-full h-14 pl-4 pr-12 rounded-2xl border-2 border-[#80093A] bg-[#F9F9FB] font-mono text-2xl font-bold uppercase tracking-widest text-slate-900 tabular-nums focus:outline-none"
          />
          <QrCode className="w-6 h-6 text-[#80093A] absolute right-4 top-4" />
        </div>

        {/* 2. Tariff Selector Pills */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button className="h-10 rounded-xl bg-[#80093A] text-white text-xs font-bold font-mono tabular-nums shadow-sm">
            Minuto $30/m
          </button>
          <button className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold font-mono tabular-nums">
            Jornada $6.000
          </button>
          <button className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold font-mono tabular-nums">
            Noche $5.000
          </button>
        </div>
      </div>

      {/* 3. Live Digital Receipt Calculation */}
      <div className="my-3 bg-[#F9F9FB] border border-dashed border-slate-300 rounded-2xl p-4 space-y-2.5 font-mono text-xs tabular-nums">
        <div className="flex justify-between text-slate-500">
          <span>FOLIO TICKET:</span>
          <span className="font-bold text-slate-800">TKT-20260925-T01-0042</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>PLAZA ASIGNADA:</span>
          <span className="font-bold text-slate-800">SECTOR A · PLAZA A-03</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>TIEMPO ESTADÍA:</span>
          <span className="font-bold text-slate-800">02h 00m (120 min &gt; 10m gracia)</span>
        </div>
        <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
          <span className="text-sm font-bold text-slate-900">TOTAL A COBRAR:</span>
          <span className="text-3xl font-extrabold text-[#80093A]">$3.600 CLP</span>
        </div>
      </div>

      {/* 4. Primary Payment & Hardware Action Buttons (48px-52px height) */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <button className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm">
            <Banknote className="w-4 h-4" /> Cobrar Efectivo (Enter)
          </button>
          <button className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm">
            <CreditCard className="w-4 h-4" /> Tarjeta / Débito (F4)
          </button>
        </div>

        {/* Anti-Fraud PIN Exceptions Row */}
        <div className="grid grid-cols-2 gap-2.5">
          <button className="h-11 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold text-xs flex items-center justify-center gap-1.5">
            <Percent className="w-3.5 h-3.5" /> Descuento PIN (F6)
          </button>
          <button className="h-11 rounded-xl bg-red-50 border border-red-300 text-red-800 font-semibold text-xs flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Ticket Perdido $8.000 (F7)
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button className="h-12 rounded-xl bg-[#80093A] hover:bg-[#60062B] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm">
            <Printer className="w-4 h-4" /> Imprimir Ticket 80mm (F8)
          </button>
          <button className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm">
            <Unlock className="w-4 h-4" /> Abrir Barrera (F9)
          </button>
        </div>
      </div>
    </aside>
  );
}
```

---

## 7. Layout del Estacionamiento (`SerranoLayoutMap.tsx` — Columna Derecha 60%, Matriz 7×5)

### 7.1 Recomendaciones de Diseño UX/UI
- **Geometría Exacta `7×5 = 35 Casillas` (30 Plazas Operativas + 5 Casillas de Infraestructura/Acceso)**:
  - **Sector A (`A-01` a `A-15`)**: Costado Norte / Izquierdo.
  - **Carril Central de Circulación Bidireccional**: Con flechas de flujo vehicular hacia salida Serrano 447.
  - **Sector B (`B-16` a `B-30`)**: Costado Sur / Derecho, incluyendo plazas **VIP (`#3B82F6`)**, **PMR (`#06B6D4`)** y **Carga EV (`#8B5CF6`)**.
- **Regla de Interacción Limpia**: Hacer clic en una plaza abre únicamente el **Popup Informativo de Solo Lectura** con el botón *"Ir a Cobro en Garita"*, evitando cobros accidentales fuera de la consola POS.

### 7.2 Wireframe Estructural de la Matriz 7×5 (Serrano 447)
```text
+-----------------------------------------------------------------------------------+
| MATRIZ EN TIEMPO REAL · SERRANO 447 (30 PLAZAS)   [🟢 8 Disp] [⚪ 16 Ocup] [🔵 6] |
+-----------------------------------------------------------------------------------+
| [GARITA]  [A-01 🟢]  [A-02 ⚪]  [A-03 ⚪]  [A-04 🟢]  [A-05 🟢]  [BARRERA ENT.] |
| [ACCESO]  [A-06 🟢]  [A-07 ⚪]  [A-08 🔴]  [A-09 ⚪]  [A-10 🟢]  [SERRANO 447 ] |
| [ ====>   CARRIL CENTRAL DE CIRCULACIÓN VEHICULAR (700 m²)        ====> SALIDA ] |
| [A-11 🔵] [A-12 🔵]  [A-13 ⚪]  [A-14 🟡]  [A-15 🟢]  [B-16 🔵]  [B-17 🔵 VIP ] |
| [B-18 💠] [B-19 🟣]  [B-20 ⚪]  [B-21 ⚪]  [B-22 🟢]  [B-23 🟢]  [B-24 ⚪     ] |
| [B-25 ⚪] [B-26 ⚪]  [B-27 🟢]  [B-28 ⚪]  [B-29 🔴]  [B-30 🟢]  [BARRERA SAL.] |
+-----------------------------------------------------------------------------------+
```

### 7.3 Código de Estructura Recomendada (`src/components/SerranoLayoutMap.tsx`)
```tsx
import React from 'react';

export type SpotStatus = 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 'VIP' | 'PMR' | 'EV' | 'SOBRESTADIA';

const STATUS_STYLES: Record<SpotStatus, { bg: string; border: string; label: string }> = {
  DISPONIBLE:  { bg: 'bg-[#10B981]/15 text-[#065F46]', border: 'border-[#10B981]', label: 'Libre' },
  OCUPADA:     { bg: 'bg-[#64748B]/20 text-[#1E293B]', border: 'border-[#64748B]', label: 'Ocupada' },
  RESERVADA:   { bg: 'bg-[#F59E0B]/20 text-[#92400E]', border: 'border-[#F59E0B]', label: 'Convenio' },
  VIP:         { bg: 'bg-[#3B82F6]/20 text-[#1E40AF]', border: 'border-[#3B82F6]', label: 'Abonado' },
  PMR:         { bg: 'bg-[#06B6D4]/20 text-[#155E75]', border: 'border-[#06B6D4]', label: 'PMR' },
  EV:          { bg: 'bg-[#8B5CF6]/20 text-[#5B21B6]', border: 'border-[#8B5CF6]', label: 'Carga EV' },
  SOBRESTADIA: { bg: 'bg-[#EF4444]/20 text-[#991B1B]', border: 'border-[#EF4444]', label: 'Alerta >4h' },
};

export function SerranoLayoutMapStructure({
  spots,
  onSelectSpot,
}: {
  spots: Array<{ code: string; status: SpotStatus; plate?: string; elapsed?: string }>;
  onSelectSpot: (code: string) => void;
}) {
  return (
    <section className="w-full lg:w-[60%] h-full bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm flex flex-col justify-between overflow-hidden">
      {/* Top Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">Matriz Espacial Serrano 447 (Grilla 7×5)</h2>
          <p className="text-xs text-slate-500">Clic en cualquier plaza para abrir ficha informativa</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded-md bg-[#10B981]/15 text-[#065F46] border border-[#10B981]">● Libre</span>
          <span className="px-2 py-0.5 rounded-md bg-[#64748B]/20 text-[#1E293B] border border-[#64748B]">● Ocupada</span>
          <span className="px-2 py-0.5 rounded-md bg-[#F59E0B]/20 text-[#92400E] border border-[#F59E0B]">● Noche/Conv.</span>
          <span className="px-2 py-0.5 rounded-md bg-[#3B82F6]/20 text-[#1E40AF] border border-[#3B82F6]">● VIP</span>
          <span className="px-2 py-0.5 rounded-md bg-[#06B6D4]/20 text-[#155E75] border border-[#06B6D4]">● PMR</span>
          <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#5B21B6] border border-[#8B5CF6]">● EV</span>
          <span className="px-2 py-0.5 rounded-md bg-[#EF4444]/20 text-[#991B1B] border border-[#EF4444]">● Alerta</span>
        </div>
      </div>

      {/* 7x5 Grid Container */}
      <div className="grid grid-cols-7 grid-rows-5 gap-2.5 my-auto py-2">
        {spots.map((spot) => {
          const st = STATUS_STYLES[spot.status];
          return (
            <button
              key={spot.code}
              type="button"
              onClick={() => onSelectSpot(spot.code)}
              className={`h-20 rounded-2xl border-2 ${st.bg} ${st.border} p-2 flex flex-col justify-between text-left transition hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#80093A]`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-xs font-extrabold">{spot.code}</span>
                <span className="text-[10px] font-semibold uppercase">{st.label}</span>
              </div>
              {spot.plate ? (
                <div className="w-full">
                  <div className="font-mono text-xs font-bold bg-white/90 text-slate-900 px-1.5 py-0.5 rounded text-center tabular-nums truncate">
                    {spot.plate}
                  </div>
                  <div className="font-mono text-[10px] text-right mt-0.5 tabular-nums opacity-80">
                    {spot.elapsed}
                  </div>
                </div>
              ) : (
                <span className="font-mono text-[11px] opacity-70">Disponible</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

---

## 8. Menú Lateral y Menubar Superior Estilo macOS (`Sidebar` + `TopMenubar`)

### 8.1 Recomendaciones de Diseño UX/UI
- **Menubar Superior Fija (`h-12`)**: Con los 3 puntos semáforo estilo macOS, reloj en tiempo real (`tabular-nums`), estado de red (`Online` / `Offline Sufijo O`), turno activo y operador en sesión.
- **Menú Lateral Colapsable (`Sidebar`)**: Para navegación rápida en módulos administrativos o conmutación mediante teclas rápidas `F1` a `F9`.

### 8.2 Código de Estructura Recomendada (`NavigationShell.tsx`)
```tsx
import React from 'react';
import Link from 'next/link';
import { Car, LayoutGrid, Moon, Vault, FileBarChart, Settings, Users, BookOpen, Wifi } from 'lucide-react';

export function MacOSNavigationShell({ children }: { children: React.ReactNode }) {
  const navItems = [
    { label: 'Garita POS', href: '/', shortcut: 'F1', icon: Car, active: true },
    { label: 'Mapa Plazas', href: '/?view=map', shortcut: 'F2', icon: LayoutGrid },
    { label: 'Convenios y Noche', href: '/convenios', shortcut: 'F3', icon: Moon },
    { label: 'Arqueo Caja Ciega', href: '/admin?tab=caja', shortcut: 'F4', icon: Vault },
    { label: 'Reportes Z', href: '/reportes', shortcut: 'F5', icon: FileBarChart },
    { label: 'Configuración', href: '/configuracion', shortcut: 'F6', icon: Settings },
    { label: 'Usuarios y PIN', href: '/admin/usuarios', shortcut: 'F7', icon: Users },
    { label: 'Manuales SOP', href: '/documentacion', shortcut: 'F8', icon: BookOpen },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F9F9FB] flex flex-col">
      {/* Top macOS Menubar */}
      <header className="h-12 px-4 bg-white/85 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
          </div>
          <span className="text-xs font-bold tracking-tight text-slate-900">
            ParkOps PMS · Cordano Serrano 447
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" /> Online · Sync OK
          </span>
          <span className="px-2.5 py-1 rounded-full bg-[#80093A]/10 text-[#80093A] font-semibold">
            Turno Mañana · Op: Ana R. (Fondo: $50.000)
          </span>
        </div>
      </header>

      {/* Main Body with Lateral Menu */}
      <div className="flex-1 flex overflow-hidden">
        <nav className="w-60 bg-white border-r border-slate-200/80 p-3 flex flex-col justify-between shrink-0">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    item.active
                      ? 'bg-[#80093A] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </span>
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                    item.active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.shortcut}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-500">
            Cloud Run: cordano-pms-v1
          </div>
        </nav>

        <main className="flex-1 overflow-hidden p-4">{children}</main>
      </div>
    </div>
  );
}
```

---

## 9. Popups / Modales Flotantes Centrales (`backdrop-blur`)

Siguiendo la **Regla #6 (Baja Densidad, Divulgación Progresiva y Estética macOS)**, toda acción secundaria o autorización sensible se despliega en un **Popup Flotante Central** con `bg-black/30 backdrop-blur-md`:

### 9.1 Popup Informativo de Plaza (Solo Lectura + Botón *"Ir a Cobro en Garita"*)
```tsx
export function SpotInfoModal({
  spotCode = 'A-03',
  plate = 'ABCD-12',
  folio = 'TKT-20260925-T01-0042',
  entryTime = '13:15 hrs',
  elapsed = '02h 00m',
  accrued = '$3.600 CLP',
  onGoToPOS,
  onClose,
}: {
  spotCode?: string;
  plate?: string;
  folio?: string;
  entryTime?: string;
  elapsed?: string;
  accrued?: string;
  onGoToPOS: (plate: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Detalle de Plaza</span>
            <h3 className="text-xl font-bold font-mono text-slate-900">Plaza {spotCode}</h3>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 font-mono">
            OCUPADA
          </span>
        </div>

        <div className="space-y-2.5 font-mono text-xs tabular-nums">
          <div className="flex justify-between"><span className="text-slate-500">Patente:</span><strong className="text-base text-slate-900">{plate}</strong></div>
          <div className="flex justify-between"><span className="text-slate-500">Folio Ticket:</span><strong>{folio}</strong></div>
          <div className="flex justify-between"><span className="text-slate-500">Hora Ingreso:</span><strong>{entryTime}</strong></div>
          <div className="flex justify-between"><span className="text-slate-500">Tiempo Transcurrido:</span><strong>{elapsed}</strong></div>
          <div className="flex justify-between pt-2 border-t border-slate-100"><span className="text-slate-500">Monto Acumulado:</span><strong className="text-base text-[#80093A]">{accrued}</strong></div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
            Cerrar (Esc)
          </button>
          <button
            onClick={() => onGoToPOS(plate)}
            className="flex-1 h-11 rounded-xl bg-[#80093A] text-white text-xs font-semibold shadow-sm"
          >
            Ir a Cobro en Garita
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 9.2 Popup Antifraude con PIN (Verde para Descuento Operador / Rojo para Ticket Perdido Admin)
```tsx
export function AntiFraudPinModal({
  mode = 'DESCUENTO', // 'DESCUENTO' (Verde - PIN Operador) | 'TICKET_PERDIDO' (Rojo - PIN Admin)
  onClose,
}: {
  mode: 'DESCUENTO' | 'TICKET_PERDIDO';
  onClose: () => void;
}) {
  const isDiscount = mode === 'DESCUENTO';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border-2 rounded-3xl p-6 shadow-2xl space-y-4 border-slate-200">
        <div className={`p-3 rounded-2xl border ${
          isDiscount ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <span className="text-[11px] font-mono font-bold uppercase">
            {isDiscount ? '🟢 Autorización de Descuento (PIN Operador)' : '🔴 Recargo por Ticket Extraviado / Anulación (PIN Admin)'}
          </span>
          <h3 className="text-base font-bold mt-0.5">
            {isDiscount ? 'Aplicar Descuento Comercial Auditado' : 'Cobro por Pérdida de Ticket ($8.000 CLP)'}
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Justificación Obligatoria (Mínimo 10 caracteres)
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Cliente convenio Notaría exhibe timbre..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#80093A]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {isDiscount ? 'PIN Individual del Operador' : 'PIN de Administrador / Supervisor'}
            </label>
            <input
              type="password"
              maxLength={4}
              placeholder="••••"
              className="w-full h-11 px-4 rounded-xl border border-slate-300 font-mono text-center text-xl tracking-[0.5em]"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
            Cancelar
          </button>
          <button
            className={`flex-1 h-11 rounded-xl text-white text-xs font-semibold shadow-sm ${
              isDiscount ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            Autorizar y Registrar en Auditoría
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 9.3 Popup de Arqueo de Caja Ciega (`Efectivo Sistema` vs `Efectivo Recontado Físico` = `Diferencia`)
```tsx
export function BlindCashReconciliationModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5">
        <div>
          <span className="text-xs font-mono font-bold text-[#80093A] uppercase">Fase 6 · Cierre de Turno</span>
          <h3 className="text-xl font-bold text-slate-900">Arqueo de Caja Ciega (Reporte Z)</h3>
          <p className="text-xs text-slate-500 mt-1">
            Ingrese el efectivo físico recontado en gaveta. El monto esperado del sistema se revelará tras confirmar.
          </p>
        </div>

        <div className="space-y-3 font-mono text-xs tabular-nums">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
            <span className="text-slate-500">Fondo Inicial Declarado (Apertura):</span>
            <strong className="text-slate-900">$50.000 CLP</strong>
          </div>

          <div>
            <label className="text-xs font-sans font-semibold text-slate-700 block mb-1">
              Efectivo Recontado Físico en Gaveta (CLP)
            </label>
            <input
              type="number"
              placeholder="Ej: 284500"
              className="w-full h-12 px-4 rounded-xl border-2 border-[#80093A] font-mono text-lg font-bold tabular-nums"
            />
          </div>

          {/* Post-Declaration Reconciliation Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Efectivo Sistema (Esperado):</span>
              <span>$284.500 CLP</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Efectivo Recontado Físico:</span>
              <span>$284.500 CLP</span>
            </div>
            <div className="border-t border-slate-700 pt-1.5 flex justify-between text-emerald-400 font-bold">
              <span>Diferencia / Cuadre:</span>
              <span>$0 CLP (CUADRE EXACTO)</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
            Volver
          </button>
          <button className="flex-1 h-11 rounded-xl bg-[#80093A] text-white text-xs font-semibold shadow-sm">
            Emitir Cierre Z + Sello SHA-256
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 10. Módulo de Configuraciones (`/configuracion`)

### 10.1 Recomendaciones de Diseño UX/UI
- **3 Bloques de Parametrización**:
  1. **Motor Tarifario y Regla de Gracia**: Valor por minuto (`$30/min`), minutos de gracia (`10 min` no acumulables), Jornada Diurna (`$6.000`), Tarifa Noche (`$5.000`), y Multa por Ticket Extraviado (`$8.000`).
  2. **Periféricos de Garita**: Impresora térmica `80mm` (`ESC/POS`), lector láser `Code 128` / `QR 2D` y pulso de barrera.
  3. **Sincronización Cloud Run & Contingencia Offline**: Endpoint `https://cordano-pms-v1-349577440002.us-west1.run.app` y activación automática del sufijo **`O`** en tickets offline.

### 10.2 Código de Estructura Recomendada (`src/app/configuracion/page.tsx`)
```tsx
import React from 'react';
import { Save, DollarSign, Printer, CloudCog } from 'lucide-react';

export function ConfigurationsModuleStructure() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Configuración del Sistema y Motor Tarifario</h1>
          <p className="text-xs text-slate-500">Parámetros oficiales de Serrano 447 · Requiere rol ADMIN</p>
        </div>
        <button className="px-5 h-11 rounded-xl bg-[#80093A] text-white text-xs font-semibold flex items-center gap-2 shadow-sm">
          <Save className="w-4 h-4" /> Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tariff Engine Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <DollarSign className="w-4 h-4 text-[#80093A]" />
            <span>Motor de Tarifas y Tolerancia (CLP)</span>
          </div>
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div>
              <label className="text-slate-500 block mb-1">Valor por Minuto ($)</label>
              <input type="number" defaultValue={30} className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold tabular-nums" />
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Gracia Inicial (min)</label>
              <input type="number" defaultValue={10} className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold tabular-nums" />
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Jornada Diurna ($)</label>
              <input type="number" defaultValue={6000} className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold tabular-nums" />
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Multa Ticket Perdido ($)</label>
              <input type="number" defaultValue={8000} className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-red-600 tabular-nums" />
            </div>
          </div>
        </div>

        {/* Thermal Printer & Cloud Run Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Printer className="w-4 h-4 text-[#80093A]" />
            <span>Impresión Térmica 80mm y Contingencia Offline</span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span>Formato Dual (Code 128 Lineal + QR 2D)</span>
              <span className="font-mono font-bold text-emerald-600">ACTIVO</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span>Sufijo de Contingencia Offline (`-XXXXO`)</span>
              <span className="font-mono font-bold text-emerald-600">AUTOMÁTICO</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span>Microservicio Cloud Run (`us-west1`)</span>
              <span className="font-mono text-[11px] text-slate-600">cordano-pms-v1:8080</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 11. Módulo de Reportes y Auditoría Z (`/reportes`)

### 11.1 Recomendaciones de Diseño UX/UI
- **Visualización Ejecutiva**:
  1. Gráfico de barras de **Ocupación Horaria e Ingresos por Turno**.
  2. **Tabla de Auditoría de Excepciones** con resaltado semántico estricto: **Verde** para descuentos autorizados con PIN de Operador y **Rojo** para recargos de ticket perdido / anulaciones con PIN de Administrador.
  3. **Historial de Cierres Z** con hash de integridad inmutable `SHA-256` y botones de exportación a PDF/CSV.

### 11.2 Código de Estructura Recomendada (`src/app/reportes/page.tsx`)
```tsx
import React from 'react';
import { Download, ShieldCheck, FileSpreadsheet } from 'lucide-react';

export function ReportsModuleStructure() {
  const auditLogs = [
    { id: 'AUD-01', time: '10:42', plate: 'KJWL-89', type: 'DESCUENTO', amount: '-$1.000', pinBy: 'Op. Ana R.', reason: 'Convenio Notaría Serrano sellado', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { id: 'AUD-02', time: '12:18', plate: 'PPRT-44', type: 'TICKET PERDIDO', amount: '+$8.000', pinBy: 'Admin C. Cordano', reason: 'Extravío físico declarado en salida', color: 'bg-red-50 text-red-800 border-red-200' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reportes Financieros, Arqueos Z y Auditoría PIN</h1>
          <p className="text-xs text-slate-500">Trazabilidad antifraude y cierres de caja con sello SHA-256</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 h-10 rounded-xl bg-white border border-slate-200 text-xs font-semibold flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Exportar CSV
          </button>
          <button className="px-4 h-10 rounded-xl bg-[#80093A] text-white text-xs font-semibold flex items-center gap-2">
            <Download className="w-4 h-4" /> Descargar Reporte Z (PDF)
          </button>
        </div>
      </div>

      {/* Anti-Fraud Audit Table (Green = Discounts, Red = Lost Ticket / Void) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Bitácora de Excepciones Autorizadas con PIN</h2>
        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div key={log.id} className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono tabular-nums ${log.color}`}>
              <div className="flex items-center gap-4">
                <span className="font-bold">{log.time}</span>
                <span className="px-2 py-0.5 rounded bg-white/80 font-extrabold">{log.plate}</span>
                <span className="font-bold">{log.type}</span>
                <span className="font-sans">{log.reason}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>PIN: {log.pinBy}</span>
                <strong className="text-sm">{log.amount}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 12. Ticket en PDF / Voucher Térmico de 80mm (`TicketPrintTemplate.tsx`)

### 12.1 Recomendaciones de Diseño de Impresión (`80mm` / PDF)
- **Ancho Físico Estándar (`80mm` ≈ `302px`)**: Compatible con impresoras térmicas `ESC/POS` y exportación directa a PDF mediante `@media print`.
- **Identificación Dual Obligatoria (Regla #4)**:
  1. **Correlativo Alfanumérico**: `TKT-AAAAMMDD-T0X-XXXX` (y sufijo **`O`** al final si fue emitido en modo Offline: `TKT-20260925-T01-0042O`).
  2. **Código de Barras Lineal (`Code 128`)**: Para pistolas láser de garita.
  3. **Código QR Bidimensional**: Para lectura óptica 2D o cámara móvil.
  4. **Leyenda Legal de Extravío**: Advertencia impresa en el pie sobre el recargo oficial de `$8.000 CLP` por pérdida de ticket.

### 12.2 Wireframe Estructural del Ticket 80mm / PDF
```text
+------------------------------------------+
|   CORDANO INVERSIONES INMOBILIARIAS      |
|       Serrano 447, Iquique - Chile       |
|------------------------------------------|
| FOLIO: TKT-20260925-T01-0042             |
| FECHA: 25/09/2026        HORA: 13:15:08  |
|------------------------------------------|
|              PATENTE VEHÍCULO            |
|               [ ABCD-12 ]                |
|         PLAZA: A-03  |  TARIFA: $30/min  |
|------------------------------------------|
|   ||||||||||||||||||||||||||||||||||||   |
|         TKT-20260925-T01-0042            |
|                 +------+                 |
|                 | [QR] |                 |
|                 +------+                 |
|------------------------------------------|
| ADVERTENCIA LEGAL: Conserve este ticket. |
| El extravío del comprobante tiene un     |
| recargo fijo de $8.000 CLP (PIN Admin).  |
+------------------------------------------+
```

### 12.3 Código de Estructura Recomendada (`TicketPrintTemplate.tsx`)
```tsx
import React from 'react';

export interface ThermalTicketProps {
  folio: string; // Ej: 'TKT-20260925-T01-0042' o 'TKT-20260925-T01-0042O'
  isOffline?: boolean;
  plate: string;
  spotCode: string;
  entryDate: string;
  entryTime: string;
  tariffLabel: string;
}

export function ThermalTicketPDFTemplate({
  folio = 'TKT-20260925-T01-0042',
  isOffline = false,
  plate = 'ABCD-12',
  spotCode = 'A-03',
  entryDate = '25/09/2026',
  entryTime = '13:15:08',
  tariffLabel = '$30 / min (10m gracia)',
}: ThermalTicketProps) {
  const finalFolio = isOffline && !folio.endsWith('O') ? `${folio}O` : folio;

  return (
    <div className="w-[302px] bg-white text-black p-4 font-mono text-xs border border-slate-300 shadow-sm mx-auto print:shadow-none print:border-none">
      {/* Header */}
      <div className="text-center border-b border-dashed border-black pb-2 space-y-0.5">
        <p className="font-extrabold text-sm tracking-tight">CORDANO INVERSIONES</p>
        <p className="text-[11px]">INMOBILIARIAS LTDA.</p>
        <p className="text-[10px]">Serrano 447, Iquique · Estacionamiento</p>
      </div>

      {/* Folio & Timestamp */}
      <div className="py-2 border-b border-dashed border-black space-y-1 tabular-nums text-[11px]">
        <div className="flex justify-between">
          <span>FOLIO:</span>
          <strong className="font-bold">{finalFolio}</strong>
        </div>
        {isOffline && (
          <div className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 text-center">
            EMITIDO EN CONTINGENCIA OFFLINE (O)
          </div>
        )}
        <div className="flex justify-between">
          <span>INGRESO:</span>
          <span>{entryDate} {entryTime}</span>
        </div>
      </div>

      {/* License Plate Highlight */}
      <div className="py-3 text-center border-b border-dashed border-black">
        <span className="text-[10px] uppercase tracking-widest block">Matrícula Registrada</span>
        <div className="text-3xl font-extrabold tracking-widest my-1 tabular-nums">
          {plate}
        </div>
        <div className="flex justify-center gap-3 text-[11px] font-bold">
          <span>PLAZA: {spotCode}</span>
          <span>•</span>
          <span>{tariffLabel}</span>
        </div>
      </div>

      {/* Dual Identification: Code 128 Barcode + 2D QR */}
      <div className="py-3 flex flex-col items-center gap-2 border-b border-dashed border-black">
        {/* Simulated Code 128 SVG */}
        <div className="w-full h-12 bg-[repeating-linear-gradient(90deg,#000,#000_2px,#fff_2px,#fff_4px,#000_4px,#000_5px,#fff_5px,#fff_8px)]" />
        <span className="text-[10px] tracking-widest font-bold tabular-nums">{finalFolio}</span>

        {/* 2D QR Placeholder Box */}
        <div className="w-24 h-24 border-2 border-black flex items-center justify-center text-[10px] font-bold mt-1">
          [QR 2D {plate}]
        </div>
      </div>

      {/* Legal Warning Footer */}
      <div className="pt-2 text-[10px] leading-tight text-center space-y-1">
        <p className="font-bold uppercase">Advertencia por Extravío de Ticket</p>
        <p>
          Conserve este comprobante para su salida. La pérdida o extravío del ticket genera un recargo fijo de <strong>$8.000 CLP</strong> y verificación de identidad.
        </p>
      </div>
    </div>
  );
}
```

---

## 13. Módulos Complementarios ("Etc": Convenios/Noche, Usuarios RBAC y Monitoreo CCTV LPR)

### 13.1 Submódulo Paralelo de Convenios y Clientes Noche (`/convenios`)
- **Regla #7 (Servicios Paralelos)**: Los vehículos que pernoctan o pertenecen a convenios mensuales se registran en este submódulo mediante popup, bloqueando su plaza en la matriz (`#F59E0B` Ámbar o `#3B82F6` Azul) sin ingresar a la lista de transitorios por minuto.

```tsx
import React from 'react';
import { Moon, Building2, Plus, Lock } from 'lucide-react';

export function ParallelAgreementsModuleStructure() {
  const agreements = [
    { plate: 'BBCD-90', client: 'Notaría Serrano (Mensual)', type: 'ABONADO VIP', spot: 'A-11', fee: '$65.000/mes', color: 'bg-blue-50 text-blue-800 border-blue-200' },
    { plate: 'TXYZ-11', client: 'Huésped Hotel Gavina (Pernocta)', type: 'TARIFA NOCHE', spot: 'A-14', fee: '$5.000/noche', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Submódulo Paralelo: Convenios Mensuales y Noche (F3)</h1>
          <p className="text-xs text-slate-500">Bloquea plazas en la matriz sin alterar la contabilidad rotativa por minuto</p>
        </div>
        <button className="px-4 h-11 rounded-xl bg-[#80093A] text-white text-xs font-semibold flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Registrar Noche / Convenio
        </button>
      </div>

      <div className="space-y-2.5">
        {agreements.map((a) => (
          <div key={a.plate} className={`p-4 rounded-2xl border flex items-center justify-between font-mono text-xs tabular-nums ${a.color}`}>
            <div className="flex items-center gap-4">
              <span className="px-2.5 py-1 rounded-lg bg-white font-extrabold text-sm">{a.plate}</span>
              <span className="font-sans font-bold">{a.client}</span>
              <span className="px-2 py-0.5 rounded bg-white/70 font-bold">{a.type}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 font-bold"><Lock className="w-3.5 h-3.5" /> Plaza {a.spot}</span>
              <strong className="text-sm">{a.fee}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 13.2 Gestión de Usuarios, Roles RBAC y PINs (`/admin/usuarios`)
- **Regla #7 (Segregación de Roles)**: El rol `ADMIN` muestra explícitamente el candado de **Incompatibilidad de Apertura de Caja**, obligando a utilizar un perfil `OPERADOR` para iniciar turnos de recaudación.

```tsx
import React from 'react';
import { Shield, KeyRound, Ban, CheckCircle } from 'lucide-react';

export function UsersRBACStructure() {
  const users = [
    { name: 'Ana Rojas', role: 'OPERADOR', pin: '••12', canOpenCash: true, canVoidTicket: false },
    { name: 'Marco Soto', role: 'SUPERVISOR', pin: '••45', canOpenCash: true, canVoidTicket: true },
    { name: 'Carlos Cordano', role: 'ADMIN', pin: '••99', canOpenCash: false, canVoidTicket: true },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Usuarios, Perfiles RBAC y PINs Antifraude</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {users.map((u) => (
          <div key={u.name} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{u.name}</h3>
              <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#80093A]/10 text-[#80093A]">
                {u.role}
              </span>
            </div>
            <div className="text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">PIN Individual:</span>
                <strong>{u.pin}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Apertura de Caja:</span>
                {u.canOpenCash ? (
                  <span className="text-emerald-600 font-bold">HABILITADO</span>
                ) : (
                  <span className="text-red-600 font-bold">BLOQUEADO (RBAC)</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 13.3 Centro de Monitoreo CCTV LPR (`/cctv`)
- Grilla 2×2 de cámaras IP con reconocimiento óptico de patentes chilenas (LPR) y nivel de confianza en `tabular-nums`.

```tsx
import React from 'react';
import { Camera } from 'lucide-react';

export function CCTVLPRGridStructure() {
  const feeds = [
    { id: 'CAM-01', zone: 'Acceso Serrano 447 (Barrera #1)', plate: 'ABCD-12', conf: '99.4%' },
    { id: 'CAM-02', zone: 'Pasillo Sector A (Plazas 01-15)', plate: 'KJWL-89', conf: '98.8%' },
    { id: 'CAM-03', zone: 'Pasillo Sector B (Plazas 16-30)', plate: 'PPRT-44', conf: '99.1%' },
    { id: 'CAM-04', zone: 'Garita de Cobro y Gaveta POS', plate: 'SIN VEHÍCULO', conf: '100%' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Centro de Monitoreo CCTV y Lectura LPR</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {feeds.map((c) => (
          <div key={c.id} className="bg-slate-900 text-white rounded-2xl p-4 h-52 flex flex-col justify-between border border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {c.id} · {c.zone}
              </span>
              <span className="text-slate-400">RTSP 1080p</span>
            </div>
            <div className="flex items-center justify-between bg-black/60 backdrop-blur-sm px-3 py-2 rounded-xl font-mono text-xs tabular-nums">
              <span>LPR Detectado: <strong className="text-amber-300">{c.plate}</strong></span>
              <span className="text-emerald-400">Confianza: {c.conf}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

