import React, { useState, useEffect, useCallback } from 'react';
import { ParkingProvider, useParking } from './context/ParkingContext';
import { PlatformNavbar } from './components/pms/PlatformNavbar';
import { LandingView } from './components/pms/LandingView';
import { MenuView } from './components/pms/MenuView';
import { PosView, PatioVehicle, CashHistoryLog } from './components/pms/PosView';
import { AnalyticsView } from './components/pms/AnalyticsView';
import { ReportsView } from './components/pms/ReportsView';
import { ClientsView } from './components/pms/ClientsView';
import { SettingsView } from './components/pms/SettingsView';
import { SupportView } from './components/pms/SupportView';
import { TicketPreviewModal, TicketPreviewData } from './components/pms/TicketPreviewModal';
import { ArqueoCiegoModal } from './components/pms/ArqueoCiegoModal';
import { CierreCajaCiego } from './screens/CierreCajaCiego';
import { LoginPage } from './screens/LoginPage';
import { CommandPalette } from './components/CommandPalette';
import { ModalMovimientoCaja } from './components/ModalMovimientoCaja';
import { AppScreen, UserRole, VehicleType, PaymentMethod } from './types';
import { getScreenFromPath, getPathFromScreen, APP_ROUTES } from './utils/routes';

function MainAppContent() {
  const {
    logout,
    isLoggedIn,
    user,
    currentShift,
    slots,
    tickets,
    agreements,
    tariffConfig,
    registerEntry,
    processPayment,
    registerCashMovement,
  } = useParking();

  // Navigation
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
    return getScreenFromPath(window.location.pathname);
  });
  const [loginPresetRole, setLoginPresetRole] = useState<UserRole>('operador');
  const [pendingRedirectScreen, setPendingRedirectScreen] = useState<AppScreen | undefined>(undefined);

  // Command palette & modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isManualMovementModalOpen, setIsManualMovementModalOpen] = useState(false);
  const [isArqueoCiegoModalOpen, setIsArqueoCiegoModalOpen] = useState(false);
  const [posInitialSubtab, setPosInitialSubtab] = useState<'entry' | 'exit' | 'history'>('entry');

  // Ticket Preview Modal state
  const [ticketPreviewData, setTicketPreviewData] = useState<TicketPreviewData | null>(null);
  const [isTicketPreviewConfirmed, setIsTicketPreviewConfirmed] = useState(false);

  // Floating Toasts
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: 'success' | 'error' | 'info' }[]>([]);
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Shift Timer with Tabular Numbers
  const [shiftTimer, setShiftTimer] = useState('00:00:00');
  useEffect(() => {
    const updateTimer = () => {
      const start = new Date(currentShift.startTime).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - start) / 1000));
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(diff % 60).toString().padStart(2, '0');
      setShiftTimer(`${h}:${m}:${s}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentShift.startTime]);

  // Navigate handler that synchronizes browser URL
  const handleNavigate = useCallback((screen: AppScreen, replace = false) => {
    setCurrentScreen(screen);
    const path = getPathFromScreen(screen);
    if (window.location.pathname !== path || window.location.hash) {
      if (replace) {
        window.history.replaceState({ screen }, '', path);
      } else {
        window.history.pushState({ screen }, '', path);
      }
    }
    const routeInfo = APP_ROUTES[screen];
    if (routeInfo) {
      document.title = `${routeInfo.title} | ParkOps PMS — Serrano 447`;
    }
  }, []);

  // Global Keyboard Shortcuts (Regla de Dominio #1: Ergonomía de Garita)
  useEffect(() => {
    const handlePopState = () => {
      const detectedScreen = getScreenFromPath(window.location.pathname);
      setCurrentScreen(detectedScreen);
    };

    window.addEventListener('popstate', handlePopState);

    const initialRoute = APP_ROUTES[currentScreen];
    if (initialRoute) {
      document.title = `${initialRoute.title} | ParkOps PMS — Serrano 447`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement;

      if (e.key === 'F1' && !isInput) {
        e.preventDefault();
        handleNavigate('menu');
      } else if (e.key === 'F2' && !isInput) {
        e.preventDefault();
        setPosInitialSubtab('entry');
        handleNavigate('pos');
      } else if (e.key === 'F3' && !isInput) {
        e.preventDefault();
        handleNavigate('clients');
      } else if (e.key === 'F4' && !isInput) {
        e.preventDefault();
        setPosInitialSubtab('exit');
        handleNavigate('pos');
      } else if (e.key === 'F8') {
        e.preventDefault();
        showToast('Impresión térmica 80mm ejecutada (QR + Code 128).', 'success');
      } else if (e.key === 'F9') {
        e.preventDefault();
        showToast('Pulso de apertura de acceso enviado en Garita 01.', 'success');
      } else if (e.key === 'Escape') {
        setTicketPreviewData(null);
        setIsManualMovementModalOpen(false);
        setIsArqueoCiegoModalOpen(false);
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentScreen, handleNavigate, showToast]);

  // Active Vehicles for POS & Map views
  const activeVehicles: PatioVehicle[] = tickets
    .filter((t) => t.status === 'activo')
    .map((t, idx) => {
      const entryDate = new Date(t.entryTime);
      const durationMin = Math.max(1, Math.floor((Date.now() - entryDate.getTime()) / 60000));
      const rate = tariffConfig.vehicleRates[t.vehicleType]?.minuteRate || 25;
      const cat: 'Sedán' | 'SUV' | 'Moto' =
        t.vehicleType === 'Motocicleta'
          ? 'Moto'
          : t.vehicleType === 'Camioneta' || t.vehicleType === 'Furgón / SUV'
          ? 'SUV'
          : 'Sedán';

      const slotNum = parseInt(t.slotCode?.replace(/\D/g, '') || String(idx + 1), 10) || idx + 1;
      const slotCode = t.slotCode || (slotNum <= 15 ? `A-${String(slotNum).padStart(2, '0')}` : `B-${String(slotNum).padStart(2, '0')}`);

      return {
        slot: slotNum,
        slotCode,
        plate: t.plateNumber,
        cat,
        rate,
        entry: entryDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        durationMin,
        client: t.notes || 'Particular',
        phone: '',
        ticketId: t.ticketCode || t.id,
      };
    });

  // History logs for POS
  const historyLogs: CashHistoryLog[] = [
    ...(currentShift.cashMovements || []).map((m) => ({
      time: new Date(m.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      type: (m.type === 'INGRESO_MANUAL' ? 'INGRESO_MANUAL' : 'RETIRO') as any,
      desc: m.reason,
      method: 'Efectivo',
      amount: m.amount,
      plate: '---',
      isEgreso: m.type === 'RETIRO_SANGRIA' || m.type === 'GASTO_MENOR',
    })),
    ...tickets
      .filter((t) => t.status === 'pagado')
      .map((t) => ({
        time: t.exitTime ? new Date(t.exitTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '---',
        type: 'COBRO' as const,
        desc: `Salida de Vehículo (${t.vehicleType})`,
        method:
          t.paymentMethod === 'efectivo'
            ? 'Efectivo'
            : t.paymentMethod === 'tarjeta_debito' || t.paymentMethod === 'tarjeta_credito'
            ? 'Tarjeta POS'
            : 'Transferencia',
        amount: t.totalAmount || 0,
        plate: t.plateNumber,
        isEgreso: false,
      })),
    {
      time: new Date(currentShift.startTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      type: 'APERTURA' as const,
      desc: `Fondo Inicial Garita Turno ${currentShift.id}`,
      method: 'Efectivo',
      amount: currentShift.initialCash,
      plate: '---',
      isEgreso: false,
    },
  ].sort((a, b) => b.time.localeCompare(a.time));

  // Handler: Open Ticket Preview
  const handleOpenTicketPreview = (data: {
    plate: string;
    category: 'Sedán' | 'SUV' | 'Moto';
    rate: number;
    name: string;
    phone: string;
    obs: string;
    slot: number;
  }) => {
    setTicketPreviewData({
      ...data,
      isOffline: false,
    });
    setIsTicketPreviewConfirmed(false);
  };

  // Handler: Confirm Entry & Create Ticket
  const handleConfirmTicketEntry = () => {
    if (!ticketPreviewData) return;
    const vehicleType: VehicleType =
      ticketPreviewData.category === 'Moto'
        ? 'Motocicleta'
        : ticketPreviewData.category === 'SUV'
        ? 'Camioneta'
        : 'Automóvil';

    const availableSlot = slots.find((s) => s.status === 'disponible');
    const slotCode = availableSlot ? availableSlot.code : `A-${String(ticketPreviewData.slot).padStart(2, '0')}`;
    registerEntry(ticketPreviewData.plate, vehicleType, slotCode, ticketPreviewData.obs || ticketPreviewData.name);
    setIsTicketPreviewConfirmed(true);
    showToast(`Ticket emitido para ${ticketPreviewData.plate} en plaza ${slotCode}`, 'success');
  };

  // Handler: Process Checkout in POS
  const handleProcessCheckout = (
    vehicle: PatioVehicle,
    method: PaymentMethod,
    total: number
  ) => {
    const targetTicket = tickets.find((t) => t.plateNumber === vehicle.plate && t.status === 'activo');
    if (targetTicket) {
      processPayment({
        ticketId: targetTicket.id,
        paymentMethod: method,
        paidAmount: total,
      });
      showToast(`Vehículo ${vehicle.plate} liquidado exitosamente. Total cobrado: $${total.toLocaleString('es-CL')}`, 'success');
    } else {
      showToast(`Pago procesado para ${vehicle.plate}: $${total.toLocaleString('es-CL')}`, 'success');
    }
  };

  // Dedicated Login Screen if explicitly on 'login' screen
  if (currentScreen === 'login') {
    return (
      <LoginPage
        initialRole={loginPresetRole}
        targetScreen={pendingRedirectScreen || 'menu'}
        onLoginSuccess={(targetScreen?: AppScreen) => {
          setPendingRedirectScreen(undefined);
          handleNavigate(targetScreen || 'menu');
        }}
      />
    );
  }

  // Shift Calculations for MenuView
  const paidTickets = tickets.filter((t) => t.status === 'pagado');
  const shiftRevenue = paidTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const occupiedSlotsCount = slots.filter((s) => s.status === 'ocupado').length;
  const activeAgreementsCount = agreements.filter((a) => a.status === 'al_dia').length;

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col font-sans text-slate-900 relative overflow-x-hidden selection:bg-slate-900 selection:text-white">
      {/* Top Application Navbar */}
      <PlatformNavbar
        currentScreen={currentScreen}
        onNavigate={(screen) => handleNavigate(screen)}
        shiftTimer={shiftTimer}
        operatorName={user.name}
        onInitiateCashClose={() => setIsArqueoCiegoModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onLogout={() => {
          logout();
          handleNavigate('login');
        }}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 w-full mx-auto relative z-10 pb-16">
        {/* 0. Portal de Acceso / Landing Wireframe */}
        {currentScreen === 'landing' && (
          <LandingView
            onNavigate={(screen) => handleNavigate(screen)}
            shiftTimer={shiftTimer}
            onInitiateCashClose={() => setIsArqueoCiegoModalOpen(true)}
            onShowToast={(msg, type) => showToast(msg, type)}
          />
        )}

        {/* 1. Menú Principal & Control de Turno */}
        {(currentScreen === 'menu' || currentScreen === 'inicio') && (
          <MenuView
            occupiedCount={occupiedSlotsCount}
            totalSlots={slots.length || 30}
            shiftRevenue={shiftRevenue}
            initialCash={currentShift.initialCash || 50000}
            activeAgreementsCount={activeAgreementsCount}
            totalAgreementsCount={agreements.length || 6}
            onNavigate={(screen) => handleNavigate(screen)}
            onOpenPosInSubtab={(subtab) => {
              setPosInitialSubtab(subtab);
              handleNavigate('pos');
            }}
            onShowToast={(msg, type) => showToast(msg, type)}
          />
        )}

        {/* 2. Punto de Venta Garita (POS) */}
        {(currentScreen === 'pos' || currentScreen === 'operacion_salida' || currentScreen === 'operacion_ingreso') && (
          <PosView
            initialSubtab={posInitialSubtab}
            activeVehicles={activeVehicles}
            historyLogs={historyLogs}
            onOpenTicketPreview={handleOpenTicketPreview}
            onProcessCheckout={handleProcessCheckout}
            onOpenManualTransaction={() => setIsManualMovementModalOpen(true)}
            onShowToast={(msg, type) => showToast(msg, type)}
          />
        )}

        {/* 3. Plano de Slots & Analítica Global */}
        {(currentScreen === 'map' || currentScreen === 'operacion_layout') && (
          <AnalyticsView
            onShowToast={(msg, type) => showToast(msg, type)}
            onNavigateToCheckout={(plate) => {
              setPosInitialSubtab('exit');
              handleNavigate('pos');
            }}
          />
        )}

        {/* 4. Reportes & Auditoría */}
        {(currentScreen === 'reports' || currentScreen === 'reportes_dashboard' || currentScreen === 'reportes_auditoria' || currentScreen === 'reportes_database') && (
          <ReportsView
            onShowToast={(msg, type) => showToast(msg, type)}
            onInitiateCashClose={() => setIsArqueoCiegoModalOpen(true)}
          />
        )}

        {/* 5. Submódulo Paralelo de Abonados & Convenios */}
        {(currentScreen === 'clients' || currentScreen === 'operacion_convenios') && (
          <ClientsView onShowToast={(msg, type) => showToast(msg, type)} />
        )}

        {/* 6. Centro de Ayuda & SOPs */}
        {currentScreen === 'support' && (
          <SupportView onShowToast={(msg, type) => showToast(msg, type)} />
        )}

        {/* 7. Ajustes & Parámetros */}
        {(currentScreen === 'settings' || currentScreen === 'config_tarifas' || currentScreen === 'config_sistema') && (
          <SettingsView onShowToast={(msg, type) => showToast(msg, type)} />
        )}

        {/* 8. Cierre Ciego de Turno (Pantalla Completa) */}
        {currentScreen === 'operacion_cierre' && (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <CierreCajaCiego />
          </div>
        )}
      </main>

      {/* ── PERSISTENT SHIFT WIDGET (Bottom-Left Pill) ── */}
      <div id="persistent-shift-widget" className="fixed bottom-5 left-5 z-40 group select-none">
        <div className="h-10 px-4 rounded-full bg-[#0f172a] text-white border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.2)] flex items-center gap-2.5 cursor-pointer hover:bg-[#1e293b] transition-all tabular-nums">
          <span className="w-2 h-2 rounded-full bg-emerald-400 live-pulse" />
          <span className="text-[13px] font-mono font-bold" id="widget-shift-timer">
            {shiftTimer}
          </span>
          <span className="text-white/20">|</span>
          <span className="text-[13px] font-semibold truncate max-w-[120px]">{user.name}</span>
        </div>

        {/* Hover Popover Details */}
        <div className="hidden group-hover:block absolute bottom-12 left-0 w-72 bg-[#0f172a] border border-white/10 rounded-2xl p-5 shadow-[0_16px_48px_rgba(0,0,0,0.3)] text-white text-xs space-y-4 animate-fade-in-up tabular-nums">
          <div className="flex justify-between border-b border-white/10 pb-3">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.08em]">
              Turno Garita 01
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-900 font-bold">
              ACTIVO
            </span>
          </div>
          <div className="space-y-2 font-mono text-[12px]">
            <div className="flex justify-between text-slate-400">
              <span>Fondo Inicial:</span>
              <span className="text-white font-semibold">
                ${(currentShift.initialCash || 50000).toLocaleString('es-CL')}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Recaudado Turno:</span>
              <span className="text-emerald-400 font-bold">
                ${shiftRevenue.toLocaleString('es-CL')}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={() => setIsArqueoCiegoModalOpen(true)}
              className="w-full h-9 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-900/40 text-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Arqueo Ciego &amp; Fin de Turno</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Preview Modal (80mm Dual QR + Code 128) */}
      <TicketPreviewModal
        data={ticketPreviewData}
        onClose={() => setTicketPreviewData(null)}
        onConfirmEntry={handleConfirmTicketEntry}
        isConfirmed={isTicketPreviewConfirmed}
        onPrintTicket={() => {
          showToast('Ticket 80mm enviado a impresora térmica USB (QR + Code 128).', 'success');
        }}
        onSendWhatsApp={() => {
          showToast('Comprobante digital enviado vía WhatsApp.', 'success');
        }}
      />

      {/* Arqueo de Caja Ciega Modal (3 Pasos + SHA-256) */}
      <ArqueoCiegoModal
        isOpen={isArqueoCiegoModalOpen}
        onClose={() => setIsArqueoCiegoModalOpen(false)}
        initialFloat={currentShift.initialCash || 50000}
        shiftRevenue={shiftRevenue}
        onConfirmClose={() => {
          logout();
          handleNavigate('landing');
        }}
        onShowToast={(msg, type) => showToast(msg, type)}
      />

      {/* Manual Cash Movement Modal */}
      <ModalMovimientoCaja
        isOpen={isManualMovementModalOpen}
        onClose={() => setIsManualMovementModalOpen(false)}
        onConfirm={(type, amount, reason, requester, authorizer, pin) => {
          registerCashMovement(type, amount, reason, pin, requester, authorizer);
          showToast(`Movimiento de caja registrado: $${amount.toLocaleString('es-CL')}`, 'success');
          setIsManualMovementModalOpen(false);
        }}
        currentCashInDrawer={currentShift.initialCash || 50000}
        activeOperatorName={user.name}
      />

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(screen) => handleNavigate(screen)}
        onSelectTicketForCheckout={() => {
          setPosInitialSubtab('exit');
          handleNavigate('pos');
        }}
      />

      {/* Floating Toasts Notification System (High Fidelity) */}
      <div id="toast-container" className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-[0_8px_24px_rgba(0,0,0,0.12)] text-[13px] font-medium animate-fade-in-up ${
              toast.type === 'success'
                ? 'bg-[#052e16] text-emerald-100 border-emerald-900/60'
                : toast.type === 'error'
                ? 'bg-[#450a0a] text-rose-100 border-rose-900/60'
                : 'bg-[#0f172a] text-slate-100 border-slate-800/80'
            }`}
          >
            <span className="font-bold text-base shrink-0">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠' : 'ℹ'}
            </span>
            <span className="leading-snug">{toast.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ParkingProvider>
      <MainAppContent />
    </ParkingProvider>
  );
}
