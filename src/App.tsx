import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { ParkingProvider, useParking } from './context/ParkingContext';
import { PlatformNavbar } from './components/pms/PlatformNavbar';
import { ViewLoadingSkeleton } from './components/common/ViewLoadingSkeleton';
import { LandingView } from './components/pms/LandingView';
import { MenuView } from './components/pms/MenuView';
import { PosView, PatioVehicle, CashHistoryLog } from './components/pms/PosView';
import { TicketPreviewModal, TicketPreviewData } from './components/pms/TicketPreviewModal';
import { CheckoutReceiptModal, CheckoutReceiptData } from './components/pms/CheckoutReceiptModal';
import { ArqueoCiegoModal } from './components/pms/ArqueoCiegoModal';
import { ModalAperturaTurno } from './components/pms/ModalAperturaTurno';
import { ShiftNotificationPill } from './components/pms/ShiftNotificationPill';
import { SupervisorMobileView, SupervisorMobileTab } from './components/pms/SupervisorMobileView';
import { AppScreen, UserRole, VehicleType, PaymentMethod } from './types';
import { getScreenFromPath, getPathFromScreen, APP_ROUTES } from './utils/routes';
import { PatioTestSimulator } from './components/common/PatioTestSimulator';

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
    keyboardShortcutsEnabled,
    registerEntry,
    processPayment,
    registerCashMovement,
    performBlindClose,
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
  const [isAperturaTurnoModalOpen, setIsAperturaTurnoModalOpen] = useState(false);
  const [posInitialSubtab, setPosInitialSubtab] = useState<'entry' | 'exit' | 'history'>('entry');
  const [mobileSupervisorTab, setMobileSupervisorTab] = useState<SupervisorMobileTab>('supervision');

  // Ticket Preview Modal state
  const [ticketPreviewData, setTicketPreviewData] = useState<TicketPreviewData | null>(null);
  const [isTicketPreviewConfirmed, setIsTicketPreviewConfirmed] = useState(false);

  // Checkout Receipt Modal state (Boleta 80mm + WhatsApp + QR de Salida)
  const [checkoutReceiptData, setCheckoutReceiptData] = useState<CheckoutReceiptData | null>(null);

  // Mobile device simulation state (activates mobile phone frame)
  const [forceMobileFrame, setForceMobileFrame] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mobile') === '0' || params.get('desktop') === '1') return false;
    if (params.get('mobile') === '1' || params.get('mobile') === 'true') return true;
    const stored = localStorage.getItem('cordano_mobile_frame');
    if (stored !== null) return stored === 'true';
    return false;
  });

  // Dynamic viewport detection for real mobile devices (< 768px)
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  // Tema individual por usuario (Default: 'light', guardado por user.id/user.role)
  const userThemeStorageKey = user?.id ? `parking_ops_theme_${user.id}` : `parking_ops_theme_${user?.role || 'default'}`;
  const [currentUserTheme, setCurrentUserTheme] = useState<'light' | 'dark' | 'ocean'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(userThemeStorageKey);
      if (saved && ['light', 'dark', 'ocean'].includes(saved)) {
        return saved as 'light' | 'dark' | 'ocean';
      }
    }
    return 'light';
  });

  // Sincronizar tema al cambiar de usuario
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(userThemeStorageKey);
      if (saved && ['light', 'dark', 'ocean'].includes(saved)) {
        setCurrentUserTheme(saved as 'light' | 'dark' | 'ocean');
      } else {
        setCurrentUserTheme('light');
      }
    }
  }, [userThemeStorageKey]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileMode = forceMobileFrame || isMobileViewport;

  const toggleMobileFrame = () => {
    setForceMobileFrame((prev) => {
      const next = !prev;
      localStorage.setItem('cordano_mobile_frame', String(next));
      return next;
    });
  };


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

    // Sincronizar tab móvil de supervisión
    if (screen === 'menu' || screen === 'inicio') setMobileSupervisorTab('supervision');
    else if (screen === 'map' || screen === 'operacion_layout') setMobileSupervisorTab('patio');
    else if (screen === 'pos' || screen === 'operacion_ingreso' || screen === 'operacion_salida') setMobileSupervisorTab('flujo');
    else if (screen === 'reports' || screen === 'reportes_dashboard' || screen === 'reportes_auditoria') setMobileSupervisorTab('reportes');
    else if (screen === 'settings' || screen === 'config_tarifas' || screen === 'config_sistema' || screen === 'reportes_database') setMobileSupervisorTab('ajustes');

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
      document.title = `${routeInfo.title} | Cordano Parking Ops — Serrano 447`;
    }
  }, []);

  // RBAC Route Guard: Si un operador intenta entrar a vistas administrativas, redirigir a garita POS
  useEffect(() => {
    const adminOnlyScreens: AppScreen[] = [
      'reports',
      'reportes_dashboard',
      'reportes_auditoria',
      'reportes_database',
      'config_tarifas',
      'config_sistema',
    ];
    if (isLoggedIn && user?.role === 'operador' && adminOnlyScreens.includes(currentScreen)) {
      showToast('Acceso restringido: Módulo exclusivo para el perfil de Administrador.', 'error');
      handleNavigate('pos', true);
    }
  }, [isLoggedIn, user?.role, currentScreen, handleNavigate, showToast]);

  // Global Keyboard Shortcuts (Regla de Dominio #1: Ergonomía de Garita)
  useEffect(() => {
    const handlePopState = () => {
      const detectedScreen = getScreenFromPath(window.location.pathname);
      setCurrentScreen(detectedScreen);

      // Sincronizar tab móvil de supervisión en historial
      if (detectedScreen === 'menu' || detectedScreen === 'inicio') setMobileSupervisorTab('supervision');
      else if (detectedScreen === 'map' || detectedScreen === 'operacion_layout') setMobileSupervisorTab('patio');
      else if (detectedScreen === 'pos' || detectedScreen === 'operacion_ingreso' || detectedScreen === 'operacion_salida') setMobileSupervisorTab('flujo');
      else if (detectedScreen === 'reports' || detectedScreen === 'reportes_dashboard' || detectedScreen === 'reportes_auditoria') setMobileSupervisorTab('reportes');
      else if (detectedScreen === 'settings' || detectedScreen === 'config_tarifas' || detectedScreen === 'config_sistema' || detectedScreen === 'reportes_database') setMobileSupervisorTab('ajustes');
    };

    window.addEventListener('popstate', handlePopState);

    const initialRoute = APP_ROUTES[currentScreen];
    if (initialRoute) {
      document.title = `${initialRoute.title} | Cordano Parking Ops — Serrano 447`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape siempre funciona para descartar modales por accesibilidad
      if (e.key === 'Escape') {
        setTicketPreviewData(null);
        setIsManualMovementModalOpen(false);
        setIsArqueoCiegoModalOpen(false);
        setIsAperturaTurnoModalOpen(false);
        setIsCommandPaletteOpen(false);
        return;
      }

      // Si los atajos están desactivados desde Ajustes, se ignora la captura
      if (!keyboardShortcutsEnabled) {
        return;
      }

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentScreen, handleNavigate, showToast, keyboardShortcutsEnabled]);

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
    const slotCode = ticketPreviewData.slot
      ? (ticketPreviewData.slot <= 15
          ? `A-${String(ticketPreviewData.slot).padStart(2, '0')}`
          : `B-${String(ticketPreviewData.slot).padStart(2, '0')}`)
      : (availableSlot ? availableSlot.code : 'A-01');
    const createdTicket = registerEntry(
      ticketPreviewData.plate,
      vehicleType,
      slotCode,
      ticketPreviewData.obs,
      {
        name: ticketPreviewData.name,
        phone: ticketPreviewData.phone,
      }
    );
    setTicketPreviewData((prev) =>
      prev
        ? {
            ...prev,
            ticketId: createdTicket?.ticketCode || createdTicket?.id || prev.ticketId,
            dateStr: new Date(createdTicket?.entryTime || Date.now()).toLocaleDateString('es-CL'),
            timeStr:
              new Date(createdTicket?.entryTime || Date.now()).toLocaleTimeString('es-CL', {
                hour: '2-digit',
                minute: '2-digit',
              }) + ' hrs',
          }
        : null
    );
    setIsTicketPreviewConfirmed(true);
    showToast(`Ticket emitido para ${ticketPreviewData.plate} en cupo ${slotCode}`, 'success');
  };

  // Handler: Process Checkout in POS with Thermal 80mm Exit Receipt
  const handleProcessCheckout = (
    vehicle: PatioVehicle,
    method: PaymentMethod,
    total: number,
    cashGiven?: number,
    change?: number,
    discount?: number,
    discountReason?: string
  ) => {
    const targetTicket = tickets.find((t) => t.plateNumber === vehicle.plate && t.status === 'activo');
    const exitTimestamp = new Date().toISOString();
    const invoiceFolio = `DTE-${Math.floor(100000 + Math.random() * 900000)}`;

    if (targetTicket) {
      processPayment({
        ticketId: targetTicket.id,
        paymentMethod: method,
        paidAmount: total,
        discountAmount: discount,
        discountReason: discountReason,
        invoiceFolio,
      });
      showToast(`Vehículo ${vehicle.plate} liquidado exitosamente. Generando comprobante de salida...`, 'success');
    } else {
      showToast(`Pago registrado para ${vehicle.plate}: $${total.toLocaleString('es-CL')}`, 'success');
    }

    const durationMinutes = vehicle.durationMin || (targetTicket ? Math.max(1, Math.floor((Date.now() - new Date(targetTicket.entryTime).getTime()) / 60000)) : 1);
    const ratePerMinute = vehicle.rate || (targetTicket ? (targetTicket.frozenRate?.minuteRate || 35) : 35);
    const subtotal = durationMinutes * ratePerMinute;
    const netSubtotal = Math.round(total / 1.19);
    const ivaAmount = total - netSubtotal;

    const receipt: CheckoutReceiptData = {
      ticketId: targetTicket?.ticketCode || targetTicket?.id || vehicle.ticketId || `T-${Date.now()}`,
      invoiceFolio,
      plate: vehicle.plate,
      category: vehicle.cat,
      slotCode: vehicle.slotCode || (vehicle.slot <= 15 ? `A-${String(vehicle.slot).padStart(2, '0')}` : `B-${String(vehicle.slot).padStart(2, '0')}`),
      entryTime: targetTicket?.entryTime || new Date(Date.now() - durationMinutes * 60000).toISOString(),
      exitTime: exitTimestamp,
      durationMinutes,
      ratePerMinute,
      subtotalAmount: subtotal,
      discountAmount: discount || 0,
      discountReason: discountReason,
      surchargeAmount: vehicle.surcharge || 0,
      netSubtotal,
      ivaAmount,
      totalAmount: total,
      paidAmount: cashGiven !== undefined ? cashGiven : total,
      changeAmount: change !== undefined ? change : 0,
      paymentMethod: method,
      operatorName: user?.name || currentShift?.operatorName || 'Operador en Garita',
      shiftId: currentShift?.id,
      customerName: vehicle.client || targetTicket?.customerName || 'Particular',
      customerPhone: vehicle.phone || targetTicket?.customerPhone || '',
    };

    setCheckoutReceiptData(receipt);
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
  const isSupervisorOrAdmin = user?.role === 'supervisor' || user?.role === 'administrador';
  const isSupervisorMobileCoreScreen = [
    'menu',
    'inicio',
    'pos',
    'operacion_ingreso',
    'operacion_salida',
    'map',
    'operacion_layout',
    'reports',
    'reportes_dashboard',
    'reportes_auditoria',
    'settings',
    'config_tarifas',
    'config_sistema',
    'reportes_database',
  ].includes(effectiveScreen);

  const shouldRenderSupervisorMobile =
    isLoggedIn && effectiveScreen !== 'landing' && isMobileMode && isSupervisorOrAdmin && isSupervisorMobileCoreScreen;

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${
      forceMobileFrame 
        ? 'bg-slate-950 flex flex-col items-center justify-center p-0 sm:py-6' 
        : (isLoggedIn && effectiveScreen !== 'landing' && currentUserTheme === 'dark')
        ? 'bg-[#1E1E2F]'
        : (isLoggedIn && effectiveScreen !== 'landing' && currentUserTheme === 'ocean')
        ? 'bg-[#F0F4F8]'
        : 'bg-[#F8FAFC]'
    }`}>
      <div
        data-user-theme={isLoggedIn && effectiveScreen !== 'landing' ? currentUserTheme : 'light'}
        className={`w-full flex flex-col font-sans overflow-x-hidden selection:bg-[#E2498A] selection:text-white transition-all ${
          (isLoggedIn && effectiveScreen !== 'landing' && currentUserTheme === 'dark')
            ? 'bg-[#1E1E2F] text-[#F8FAFC]'
            : (isLoggedIn && effectiveScreen !== 'landing' && currentUserTheme === 'ocean')
            ? 'bg-[#F0F4F8] text-[#0F172A]'
            : 'bg-[#F8FAFC] text-[#1E1E2F]'
        } ${
        forceMobileFrame 
          ? 'max-w-[412px] h-screen sm:h-[880px] sm:rounded-[44px] sm:border-[10px] sm:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col' 
          : 'min-h-screen h-screen max-w-full'
      }`}>
        {forceMobileFrame && (
          <div className="hidden sm:flex h-5 w-full bg-slate-900 items-center justify-center shrink-0 z-50">
            <div className="w-24 h-3.5 bg-black rounded-full" />
          </div>
        )}
      {/* Top Application Navbar - Only show if logged in and not on landing */}
      {isLoggedIn && effectiveScreen !== 'landing' && (
        <PlatformNavbar
          currentScreen={effectiveScreen}
          onNavigate={(screen) => handleNavigate(screen)}
          operatorName={user.name}
          onInitiateCashClose={() => setIsArqueoCiegoModalOpen(true)}
          onInitiateOpenShift={() => setIsAperturaTurnoModalOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          activeMobileTab={mobileSupervisorTab}
          onSelectMobileTab={(tab) => {
            setMobileSupervisorTab(tab);
            if (tab === 'supervision') handleNavigate('menu');
            else if (tab === 'patio') handleNavigate('map');
            else if (tab === 'flujo') handleNavigate('pos');
            else if (tab === 'reportes') handleNavigate('reports');
            else if (tab === 'ajustes') handleNavigate('settings');
          }}
          onLogout={() => {
            logout();
            handleNavigate('landing');
          }}
        />
      )}

      {/* Main Workspace: Full-width viewport below top navbar */}
      <main className="flex-1 overflow-y-auto relative z-10 pb-16 md:pb-0">
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

          {/* 0.1 Centro de Mando Ejecutivo Móvil para Supervisor Remoto */}
          {shouldRenderSupervisorMobile && (
            <SupervisorMobileView
              activeTab={mobileSupervisorTab}
              onSelectTab={(tab) => {
                setMobileSupervisorTab(tab);
                if (tab === 'supervision') handleNavigate('menu');
                else if (tab === 'patio') handleNavigate('map');
                else if (tab === 'flujo') handleNavigate('pos');
                else if (tab === 'reportes') handleNavigate('reports');
                else if (tab === 'ajustes') handleNavigate('settings');
              }}
              activeVehicles={activeVehicles}
              historyLogs={historyLogs}
              onNavigate={(screen) => handleNavigate(screen)}
              onShowToast={(msg, type) => showToast(msg, type)}
              onInitiateOpenShift={() => setIsAperturaTurnoModalOpen(true)}
              onInitiateCashClose={() => setIsArqueoCiegoModalOpen(true)}
            />
          )}

            {/* 1. Menú Principal & Control de Turno (Escritorio / Garita) */}
            {!shouldRenderSupervisorMobile && isLoggedIn && (effectiveScreen === 'menu' || effectiveScreen === 'inicio') && (
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
                onInitiateOpenShift={() => setIsAperturaTurnoModalOpen(true)}
              />
            )}

            {/* 2. Punto de Venta Garita (POS - Solo Garita Física / Cajero) */}
            {!shouldRenderSupervisorMobile && isLoggedIn && (effectiveScreen === 'pos' || effectiveScreen === 'operacion_salida' || effectiveScreen === 'operacion_ingreso') && (
              <PosView
                initialSubtab={posInitialSubtab}
                activeMobileTab={mobileSupervisorTab}
                onMobileTabChange={setMobileSupervisorTab}
                activeVehicles={activeVehicles}
                historyLogs={historyLogs}
                onOpenTicketPreview={handleOpenTicketPreview}
                onProcessCheckout={handleProcessCheckout}
                onOpenManualTransaction={() => setIsManualMovementModalOpen(true)}
                onShowToast={(msg, type) => showToast(msg, type)}
                onNavigate={(screen) => handleNavigate(screen as any)}
                onInitiateOpenShift={() => setIsAperturaTurnoModalOpen(true)}
              />
            )}

            {/* 3. Plano de Slots & Analítica Global (Desktop) */}
            {!shouldRenderSupervisorMobile && isLoggedIn && (effectiveScreen === 'map' || effectiveScreen === 'operacion_layout') && (
              <AnalyticsView
                onShowToast={(msg, type) => showToast(msg, type)}
                onNavigateToCheckout={(plate) => {
                  setPosInitialSubtab('exit');
                  handleNavigate('pos');
                }}
              />
            )}

            {/* 4. Reportes & Auditoría (Restringido para Administrador / Supervisor en Desktop) */}
            {!shouldRenderSupervisorMobile && isLoggedIn && (effectiveScreen === 'reports' || effectiveScreen === 'reportes_dashboard' || effectiveScreen === 'reportes_auditoria') && (
              (user?.role === 'administrador' || user?.role === 'supervisor' || user?.permissions?.canViewReports) ? (
                <ReportsView
                  initialTab={effectiveScreen === 'reportes_auditoria' ? 'turnos' : 'vehiculos'}
                  onShowToast={(msg, type) => showToast(msg, type)}
                  onInitiateCashClose={() => setIsArqueoCiegoModalOpen(true)}
                />
              ) : (
                <div className="p-4 sm:p-6 lg:p-8 w-full max-w-2xl mx-auto space-y-6 text-[#1E1E2F] animate-fade-in-up mt-8">
                  <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-5">
                    <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 text-3xl flex items-center justify-center mx-auto shadow-xs">
                      🔒
                    </div>
                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300 text-xs font-black">
                        MÓDULO EXCLUSIVO PARA ADMINISTRACIÓN
                      </span>
                      <h3 className="text-xl font-extrabold text-[#1E1E2F]">
                        Acceso a Informes &amp; Auditoría Restringido
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        El perfil actual <strong>({user?.name || 'Cajero Operador'})</strong> no cuenta con privilegios para consultar el libro diario contable, cortes Z ni métricas financieras de otros turnos.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
                      <span className="font-bold flex items-center gap-1.5">
                        <span>ℹ️</span> Política de Arqueo Ciego &amp; Seguridad:
                      </span>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Para preservar la integridad del arqueo ciego, los informes de recaudación global y bitácoras antifraude están reservados para supervisión. Al finalizar su jornada, declare el efectivo físico en <strong>Arqueo Ciego</strong>.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleNavigate('pos')}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        ← Volver a Garita POS
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavigate('menu')}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                      >
                        Ir al Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* 5. Submódulo Paralelo de Convenios & Convenios */}
            {isLoggedIn && (effectiveScreen === 'clients' || effectiveScreen === 'operacion_convenios') && (
              <ClientsView onShowToast={(msg, type) => showToast(msg, type)} />
            )}

            {/* 6. Centro de Ayuda & SOPs */}
            {effectiveScreen === 'support' && (
              <SupportView onShowToast={(msg, type) => showToast(msg, type)} />
            )}

            {/* 7. Ajustes & Parámetros (Desktop) */}
            {!shouldRenderSupervisorMobile && isLoggedIn && (effectiveScreen === 'settings' || effectiveScreen === 'config_tarifas' || effectiveScreen === 'config_sistema' || effectiveScreen === 'reportes_database') && (
              <SettingsView
                initialSection={effectiveScreen === 'reportes_database' ? 'integraciones' : effectiveScreen === 'config_tarifas' ? 'tarifas' : undefined}
                onShowToast={(msg, type) => showToast(msg, type)}
              />
            )}

            {/* 8. Cierre Ciego de Turno (Pantalla Completa) */}
            {isLoggedIn && effectiveScreen === 'operacion_cierre' && (
              <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
                <CierreCajaCiego />
              </div>
            )}
          </Suspense>
      </main>

      {/* Ticket Preview Modal (80mm Dual QR + Code 128 + PDF + WhatsApp) */}
      <TicketPreviewModal
        data={ticketPreviewData}
        onClose={() => setTicketPreviewData(null)}
        onConfirmEntry={handleConfirmTicketEntry}
        isConfirmed={isTicketPreviewConfirmed}
        onPrintTicket={() => {
          showToast('Ticket 80mm enviado a impresión térmica / diálogo.', 'success');
        }}
        onExportPdf={() => {
          showToast('Ticket PDF descargado exitosamente.', 'success');
        }}
        onSendWhatsApp={(phone) => {
          showToast(`Comprobante digital enviado vía WhatsApp ${phone ? `(+${phone})` : ''}`, 'success');
        }}
        onUpdateTicketPhone={(phone) => {
          setTicketPreviewData((prev) => (prev ? { ...prev, phone } : null));
        }}
      />

      {/* Comprobante de Pago y Salida (80mm Térmico DTE SII + WhatsApp + QR de Salida) */}
      <CheckoutReceiptModal
        data={checkoutReceiptData}
        onClose={() => setCheckoutReceiptData(null)}
        onFinalizeCheckout={() => {
          setCheckoutReceiptData(null);
          showToast('Salida finalizada. Barrera de garita abierta y cupo liberado.', 'success');
        }}
        onPrintReceipt={() => {
          showToast('Comprobante térmico 80mm enviado a impresión.', 'success');
        }}
        onExportPdf={() => {
          showToast('Comprobante PDF descargado exitosamente.', 'success');
        }}
        onSendWhatsApp={(phone) => {
          showToast(`Comprobante digital enviado vía WhatsApp ${phone ? `(+${phone})` : ''}`, 'success');
        }}
      />

      {/* Apertura de Turno Modal (Fondo de Gaveta + Checklist Calidad + Acta A4) */}
      <ModalAperturaTurno
        isOpen={isAperturaTurnoModalOpen}
        onClose={() => setIsAperturaTurnoModalOpen(false)}
        onSuccess={(initialCash) => {
          showToast(`Turno iniciado con fondo de $${initialCash.toLocaleString('es-CL')} CLP. Garita y POS habilitados.`, 'success');
          setIsAperturaTurnoModalOpen(false);
          handleNavigate('pos');
        }}
        onShowToast={(msg, type) => showToast(msg, type)}
      />

      {/* Arqueo de Caja Ciega Modal (3 Pasos + SHA-256) */}
      <ArqueoCiegoModal
        isOpen={isArqueoCiegoModalOpen}
        onClose={() => setIsArqueoCiegoModalOpen(false)}
        initialFloat={(currentShift?.initialCash || 50000) || 50000}
        shiftRevenue={shiftRevenue}
        onConfirmClose={(cash, pos, transfer) => {
          performBlindClose(cash, pos, transfer);
          showToast('Turno cerrado definitivamente. Punto de venta bloqueado.', 'success');
          setIsArqueoCiegoModalOpen(false);
          handleNavigate('pos');
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

      {/* Floating Toasts Notification System (Posicionado en esquina inferior izquierda) */}
      <div id="toast-container" className="fixed bottom-4 left-4 z-50 flex flex-col-reverse gap-2.5 pointer-events-none max-w-sm w-full">
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

      {/* Notificación de Turno No Iniciado: Píldora Ergonómica Flotante & No Invasiva */}
      {isLoggedIn && effectiveScreen !== 'landing' && (
        <ShiftNotificationPill
          currentShift={currentShift}
          currentScreen={effectiveScreen}
          onOpenAperturaModal={() => setIsAperturaTurnoModalOpen(true)}
          onShowToast={(msg, type) => showToast(msg, type)}
        />
      )}

      {/* Interactive Mobile Supervisor & Space Simulator Harness */}
      {isLoggedIn && effectiveScreen !== 'landing' && (
        <PatioTestSimulator onShowToast={(msg, type) => showToast(msg, type)} />
      )}
      </div>

      {/* Floating Device Mode Switcher (visible on desktop displays) */}
      <div className="hidden sm:flex fixed bottom-5 right-5 z-50 items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={toggleMobileFrame}
          className="px-4 py-2.5 rounded-full bg-[#1E1E2F] hover:bg-[#2D2D44] text-white text-xs font-extrabold shadow-xl border border-slate-700 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          title="Alternar entre simulación de pantalla de teléfono móvil (390px) y pantalla completa"
        >
          <span>{forceMobileFrame ? '💻' : '📱'}</span>
          <span>{forceMobileFrame ? 'Ver en Pantalla Completa' : 'Simular Móvil (390px)'}</span>
        </button>
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
