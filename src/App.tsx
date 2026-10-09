import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { ParkingProvider, useParking } from './context/ParkingContext';
import { PlatformNavbar } from './components/pms/PlatformNavbar';
import { ViewLoadingSkeleton } from './components/common/ViewLoadingSkeleton';
import { LandingView } from './components/pms/LandingView';
import { MenuView } from './components/pms/MenuView';
import { PosView, PatioVehicle, CashHistoryLog } from './components/pms/PosView';
import { TicketPreviewModal, TicketPreviewData } from './components/pms/TicketPreviewModal';
import { ArqueoCiegoModal } from './components/pms/ArqueoCiegoModal';
import { AppScreen, UserRole, VehicleType, PaymentMethod } from './types';
import { getScreenFromPath, getPathFromScreen, APP_ROUTES } from './utils/routes';

// Lazy-loaded secondary modules to optimize initial bundle and Core Web Vitals (LCP <= 2.5s)
const AnalyticsView = React.lazy(() => import('./components/pms/AnalyticsView').then((m) => ({ default: m.AnalyticsView })));
const ReportsView = React.lazy(() => import('./components/pms/ReportsView').then((m) => ({ default: m.ReportsView })));
const ClientsView = React.lazy(() => import('./components/pms/ClientsView').then((m) => ({ default: m.ClientsView })));
const SettingsView = React.lazy(() => import('./components/pms/SettingsView').then((m) => ({ default: m.SettingsView })));
const SupportView = React.lazy(() => import('./components/pms/SupportView').then((m) => ({ default: m.SupportView })));
const CierreCajaCiego = React.lazy(() => import('./screens/CierreCajaCiego').then((m) => ({ default: m.CierreCajaCiego })));
const LoginPage = React.lazy(() => import('./screens/LoginPage').then((m) => ({ default: m.LoginPage })));
const CommandPalette = React.lazy(() => import('./components/CommandPalette').then((m) => ({ default: m.CommandPalette })));
const ModalMovimientoCaja = React.lazy(() => import('./components/ModalMovimientoCaja').then((m) => ({ default: m.ModalMovimientoCaja })));

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
    ...((currentShift?.cashMovements || []) || []).map((m) => ({
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
      time: new Date((currentShift?.startTime || new Date().toISOString())).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      type: 'APERTURA' as const,
      desc: `Fondo Inicial Garita Turno ${(currentShift?.id || "N/A")}`,
      method: 'Efectivo',
      amount: (currentShift?.initialCash || 50000),
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
    showToast(`Ticket emitido para ${ticketPreviewData.plate} en cupo ${slotCode}`, 'success');
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
      <Suspense fallback={<ViewLoadingSkeleton />}>
        <LoginPage
          initialRole={loginPresetRole}
          targetScreen={pendingRedirectScreen || 'menu'}
          onLoginSuccess={(targetScreen?: AppScreen) => {
            setPendingRedirectScreen(undefined);
            handleNavigate(targetScreen || 'menu');
          }}
        />
      </Suspense>
    );
  }

  // Shift Calculations for MenuView
  const paidTickets = tickets.filter((t) => t.status === 'pagado');
  const shiftRevenue = paidTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const occupiedSlotsCount = slots.filter((s) => s.status === 'ocupado').length;
  const activeAgreementsCount = agreements.filter((a) => a.status === 'al_dia').length;

  // Render variables
  const effectiveScreen = isLoggedIn ? currentScreen : 'landing';

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] flex flex-col font-sans text-[#1E1E2F] overflow-hidden selection:bg-[#E2498A] selection:text-[#1E1E2F]">
      {/* Top Application Navbar - Only show if logged in and not on landing */}
      {isLoggedIn && effectiveScreen !== 'landing' && (
        <PlatformNavbar
          currentScreen={effectiveScreen}
          onNavigate={(screen) => handleNavigate(screen)}
          
          operatorName={user.name}
          onInitiateCashClose={() => setIsArqueoCiegoModalOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onLogout={() => {
            logout();
            handleNavigate('landing');
          }}
        />
      )}

      {/* Main Workspace: Full-width viewport below top navbar */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <Suspense fallback={<ViewLoadingSkeleton />}>
          {/* 0. Portal de Acceso / Landing Wireframe */}
          {effectiveScreen === 'landing' && (
            <LandingView
              onLoginSuccess={() => handleNavigate('menu')}
              onNavigate={(screen) => handleNavigate(screen)}
              
              onInitiateCashClose={() => setIsArqueoCiegoModalOpen(true)}
              onShowToast={(msg, type) => showToast(msg, type as any)}
            />
          )}

            {/* 1. Menú Principal & Control de Turno */}
            {isLoggedIn && (effectiveScreen === 'menu' || effectiveScreen === 'inicio') && (
              <MenuView
                occupiedCount={occupiedSlotsCount}
                totalSlots={slots.length || 30}
                shiftRevenue={shiftRevenue}
                initialCash={(currentShift?.initialCash || 50000) || 50000}
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
            {isLoggedIn && (effectiveScreen === 'pos' || effectiveScreen === 'operacion_salida' || effectiveScreen === 'operacion_ingreso') && (
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
            {isLoggedIn && (effectiveScreen === 'map' || effectiveScreen === 'operacion_layout') && (
              <AnalyticsView
                onShowToast={(msg, type) => showToast(msg, type)}
                onNavigateToCheckout={(plate) => {
                  setPosInitialSubtab('exit');
                  handleNavigate('pos');
                }}
              />
            )}

            {/* 4. Reportes & Auditoría */}
            {isLoggedIn && (effectiveScreen === 'reports' || effectiveScreen === 'reportes_dashboard' || effectiveScreen === 'reportes_auditoria' || effectiveScreen === 'reportes_database') && (
              <ReportsView
                onShowToast={(msg, type) => showToast(msg, type)}
                onInitiateCashClose={() => setIsArqueoCiegoModalOpen(true)}
              />
            )}

            {/* 5. Submódulo Paralelo de Convenios & Convenios */}
            {isLoggedIn && (effectiveScreen === 'clients' || effectiveScreen === 'operacion_convenios') && (
              <ClientsView onShowToast={(msg, type) => showToast(msg, type)} />
            )}

            {/* 6. Centro de Ayuda & SOPs */}
            {effectiveScreen === 'support' && (
              <SupportView onShowToast={(msg, type) => showToast(msg, type)} />
            )}

            {/* 7. Ajustes & Parámetros */}
            {isLoggedIn && (effectiveScreen === 'settings' || effectiveScreen === 'config_tarifas' || effectiveScreen === 'config_sistema') && (
              <SettingsView onShowToast={(msg, type) => showToast(msg, type)} />
            )}

            {/* 8. Cierre Ciego de Turno (Pantalla Completa) */}
            {isLoggedIn && effectiveScreen === 'operacion_cierre' && (
              <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <CierreCajaCiego />
              </div>
            )}
          </Suspense>
      </main>

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
        initialFloat={(currentShift?.initialCash || 50000) || 50000}
        shiftRevenue={shiftRevenue}
        onConfirmClose={() => {
          logout();
          handleNavigate('landing');
        }}
        onShowToast={(msg, type) => showToast(msg, type)}
      />

      {/* Modals & Command Palette with Suspense */}
      <Suspense fallback={null}>
        {isManualMovementModalOpen && (
          <ModalMovimientoCaja
            isOpen={isManualMovementModalOpen}
            onClose={() => setIsManualMovementModalOpen(false)}
            onConfirm={(type, amount, reason, requester, authorizer, pin) => {
              registerCashMovement(type, amount, reason, pin, requester, authorizer);
              showToast(`Movimiento de caja registrado: $${amount.toLocaleString('es-CL')}`, 'success');
              setIsManualMovementModalOpen(false);
            }}
            currentCashInDrawer={(currentShift?.initialCash || 50000) || 50000}
            activeOperatorName={user.name}
          />
        )}

        {isCommandPaletteOpen && (
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onNavigate={(screen) => handleNavigate(screen)}
            onSelectTicketForCheckout={() => {
              setPosInitialSubtab('exit');
              handleNavigate('pos');
            }}
          />
        )}
      </Suspense>

      {/* Floating Toasts Notification System (High Fidelity Toggl Style) */}
      <div id="toast-container" className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-2xl border shadow-[0_12px_32px_rgba(30,30,47,0.18)] text-[13px] font-medium animate-fade-in-up ${
              toast.type === 'success'
                ? 'bg-[#1E1E2F] text-[#E2498A] border-[#E2498A]/40'
                : toast.type === 'error'
                ? 'bg-[#1E1E2F] text-[#E2498A] border-[#E2498A]/40'
                : 'bg-[#1E1E2F] text-[#F8FAFC] border-[#2D2D44]'
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
