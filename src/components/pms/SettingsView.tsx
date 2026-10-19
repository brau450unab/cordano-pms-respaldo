import React, { useState, useEffect } from 'react';
import { useParking } from '../../context/ParkingContext';
import { BillingModel, TaxDocumentType, VehicleType } from '../../types';
import {
  generateTicketPdf,
  generatePublicTariffPosterPdf,
  generateInternalTariffDocumentationPdf,
  ThermalPaperSize,
} from '../../utils/pdfGenerator';
import {
  Moon,
  Sun,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Plus,
  Trash2,
  Printer,
  FileText,
  Download,
  Mail,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Tablet,
  Key,
  Shield,
  WifiOff,
  HelpCircle,
  ExternalLink,
  Palette,
  Edit3,
  Sliders,
  UserCheck,
} from 'lucide-react';

import { CORDANO_11_TABLES_SCHEMA } from '../../types/databaseSchema';
import {
  createCordanoSpreadsheet,
  syncTableToGoogleSheet,
  requestGoogleAccessToken,
} from '../../services/googleSheetsService';

interface CanonicalTableData {
  sheetName: string;
  title: string;
  description: string;
  columns: string[];
  rows: Record<string, any>[];
}

interface SettingsViewProps {
  initialSection?: SettingsSection;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export type SettingsSection =
  | 'tarifas'
  | 'politicas'
  | 'ticket'
  | 'usuarios'
  | 'horarios'
  | 'generales'
  | 'integraciones'
  | 'cuenta';

export interface GranularPermissions {
  canOperatePos: boolean; // Punto de Venta y tickets
  canOpenCloseShift: boolean; // Iniciar y cerrar turnos
  canViewReports: boolean; // Informes y Reporte Z
  canAuditCash: boolean; // Arqueo ciego de gaveta
  canOverrideRates: boolean; // Descuentos y cortesías
  canVoidTickets: boolean; // Anulación de tickets
  canConfigureTariffs: boolean; // Modificar tarifario
  canManageUsers: boolean; // Gestión de personal
  canViewSecurityAudit: boolean; // Bitácora SHA-256
  canManageClients?: boolean; // Submódulo de convenios y mensualidades
  isLiveSupervisorMode?: boolean; // Modo solo lectura cuando admin inspecciona garita
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'operador' | 'supervisor' | 'administrador';
  pin?: string;
  permissions: GranularPermissions;
  status: 'activo' | 'inactivo';
}

export interface PromotionItem {
  id: string;
  name: string;
  type: 'percent' | 'flat';
  value: number; // e.g. 20% o 15000 CLP
  active: boolean;
  description: string;
}

export type TicketTemplateType = 'estandar' | 'detallado' | 'compacto';

export interface DaySchedule {
  day: string;
  label: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  isHoliday?: boolean;
}

interface DynamicCategory {
  id: string;
  name: string;
  minuteRate: number;
  trancheRate: number;
  maxDailyRate: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialSection, onShowToast }) => {
  const {
    tariffConfig,
    tariffVersions,
    updateTariffConfig,
    isOffline,
    setIsOffline,
    user: activeUser,
    checklistTasks,
    keyboardShortcutsEnabled,
    setKeyboardShortcutsEnabled,
    tickets,
    slots,
    customers,
    agreements,
    auditLogs,
    syncQueueCount,
    currentShift,
    isShiftOpen,
    isShiftOwner,
    isViewerOnly,
  } = useParking();

  const isAdmin = activeUser?.role === 'administrador';

  // Navegación lateral activa
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection || (isAdmin ? 'tarifas' : 'cuenta'));
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Asegurar que usuarios no administradores solo accedan a 'cuenta' o 'generales'
  useEffect(() => {
    if (!isAdmin && activeSection !== 'cuenta' && activeSection !== 'generales') {
      setActiveSection('cuenta');
    }
  }, [isAdmin, activeSection]);

  // ── ESTADO BASE DE DATOS & GOOGLE SHEETS ──
  const [selectedTableKey, setSelectedTableKey] = useState<string>('Tickets');
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  const [googleSyncState, setGoogleSyncState] = useState<{
    isConnecting: boolean;
    isSyncing: boolean;
    spreadsheetId: string | null;
    spreadsheetUrl: string | null;
    lastSyncTime: string | null;
    accessToken: string | null;
  }>({
    isConnecting: false,
    isSyncing: false,
    spreadsheetId: null,
    spreadsheetUrl: null,
    lastSyncTime: null,
    accessToken: null,
  });

  // ── 1. AJUSTES GENERALES & ACCESIBILIDAD ──
  type AppTheme = 'light' | 'dark' | 'ocean';

  const userThemeKey = activeUser?.id ? `parking_ops_theme_${activeUser.id}` : `parking_ops_theme_${activeUser?.role || 'default'}`;

  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(userThemeKey) as AppTheme;
      if (saved && ['light', 'dark', 'ocean'].includes(saved)) return saved;
    }
    return 'light';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return selectedTheme === 'dark';
  });
  const [tabletMode, setTabletMode] = useState<boolean>(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('parking_ops_tablet_mode') === 'true'
      : false;
  });
  const [fontSize, setFontSize] = useState<'normal' | 'grande' | 'extragrande'>('normal');
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [preventAutoLogout, setPreventAutoLogout] = useState<boolean>(true);
  const [preventScreenOff, setPreventScreenOff] = useState<boolean>(true);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);

  // ── 2. AJUSTES DE CUENTA & SEGURIDAD (SIN AVATAR) ──
  const [accountName, setAccountName] = useState<string>(activeUser.name || 'Braulio Cordano');
  const [accountEmail, setAccountEmail] = useState<string>(activeUser.email || 'braulio@automatizable.cl');
  const [notificationEmail, setNotificationEmail] = useState<string>('braulio@automatizable.cl');
  // Cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // ── 3. PERSONAL & PERMISOS EXHAUSTIVOS ──
  const defaultAdminPermissions: GranularPermissions = {
    canOperatePos: true,
    canOpenCloseShift: true,
    canViewReports: true,
    canAuditCash: true,
    canOverrideRates: true,
    canVoidTickets: true,
    canConfigureTariffs: true,
    canManageUsers: true,
    canViewSecurityAudit: true,
  };

  const defaultOperatorPermissions: GranularPermissions = {
    canOperatePos: true,
    canOpenCloseShift: true,
    canViewReports: false,
    canAuditCash: true,
    canOverrideRates: false,
    canVoidTickets: false,
    canConfigureTariffs: false,
    canManageUsers: false,
    canViewSecurityAudit: false,
  };

  const [usersList, setUsersList] = useState<SystemUser[]>([
    {
      id: 'usr-admin-braulio',
      name: 'Braulio Cordano',
      email: 'braulio@automatizable.cl',
      role: 'administrador',
      pin: '9921',
      permissions: { ...defaultAdminPermissions, canManageClients: true, isLiveSupervisorMode: true },
      status: 'activo',
    },
    {
      id: 'usr-sup-andrea',
      name: 'Andrea Valdés (Supervisora)',
      email: 'andrea.valdes@cordano.cl',
      role: 'supervisor',
      pin: '4412',
      permissions: {
        ...defaultOperatorPermissions,
        canViewReports: true,
        canOverrideRates: true,
        canVoidTickets: true,
        canViewSecurityAudit: true,
        canManageClients: true,
        isLiveSupervisorMode: true,
      },
      status: 'activo',
    },
    {
      id: 'usr-op-cajero',
      name: 'Carlos Mendoza (Cajero Garita)',
      email: 'cajero@cordano.cl',
      role: 'operador',
      pin: '1234',
      permissions: { ...defaultOperatorPermissions, canManageClients: false, isLiveSupervisorMode: false },
      status: 'activo',
    },
  ]);

  const [selectedUserModal, setSelectedUserModal] = useState<SystemUser | null>(null);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'operador' | 'supervisor' | 'administrador'>('operador');
  const [newUserPin, setNewUserPin] = useState('1234');
  const [newUserPermissions, setNewUserPermissions] = useState<GranularPermissions>({ ...defaultOperatorPermissions });
  // Modal de Restablecer Contraseña por Correo
  const [resetEmailModalData, setResetEmailModalData] = useState<{ email: string; name: string; tokenUrl: string } | null>(null);
  const [isCopiedResetUrl, setIsCopiedResetUrl] = useState(false);

  // ── ESTADO OPERATIVO ACORDADO (/GRILL-ME) ──
  // 1. Promociones y Convenios
  const [promotionsList, setPromotionsList] = useState<PromotionItem[]>([
    { id: 'promo-1', name: 'Convenio Comercio Serrano 447', type: 'percent', value: 20, active: true, description: '20% dcto para clientes con ticket timbrado por comercio asociado de Serrano' },
    { id: 'promo-2', name: 'Convenio Hotel & Turismo Tarapacá', type: 'percent', value: 15, active: true, description: '15% dcto para turistas y huéspedes de hoteles en convenio' },
    { id: 'promo-3', name: 'Tarifa Plana Vecinos Centro Iquique', type: 'flat', value: 15000, active: true, description: '$ 15.000 CLP mensual para residentes acreditados del cuadrante' },
    { id: 'promo-4', name: 'Cortesía Institucional / Municipalidad', type: 'percent', value: 100, active: true, description: 'Costo cero ($0 CLP) para inspección municipal o vehículos de emergencia' },
  ]);
  const [isNewPromoModalOpen, setIsNewPromoModalOpen] = useState(false);
  const [newPromoName, setNewPromoName] = useState('');
  const [newPromoType, setNewPromoType] = useState<'percent' | 'flat'>('percent');
  const [newPromoValue, setNewPromoValue] = useState(15);
  const [newPromoDesc, setNewPromoDesc] = useState('');

  // 2. Políticas de Turno y Caja
  const [cashToleranceDiscrepancy, setCashToleranceDiscrepancy] = useState<number>(2000);
  const [overstayAlertMinutes, setOverstayAlertMinutes] = useState<number>(120);

  // 3. Plantillas de Ticket e Impresión
  const [selectedTicketTemplate, setSelectedTicketTemplate] = useState<TicketTemplateType>('estandar');
  const [autoPrintEntry, setAutoPrintEntry] = useState<boolean>(true);
  const [autoPrintExit, setAutoPrintExit] = useState<boolean>(true);

  // 5. Horarios del Recinto
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([
    { day: 'lunes', label: 'Lunes', isOpen: true, openTime: '08:00', closeTime: '22:00', isHoliday: false },
    { day: 'martes', label: 'Martes', isOpen: true, openTime: '08:00', closeTime: '22:00', isHoliday: false },
    { day: 'miercoles', label: 'Miércoles', isOpen: true, openTime: '08:00', closeTime: '22:00', isHoliday: false },
    { day: 'jueves', label: 'Jueves', isOpen: true, openTime: '08:00', closeTime: '22:00', isHoliday: false },
    { day: 'viernes', label: 'Viernes', isOpen: true, openTime: '08:00', closeTime: '23:00', isHoliday: false },
    { day: 'sabado', label: 'Sábado', isOpen: true, openTime: '09:00', closeTime: '23:00', isHoliday: false },
    { day: 'domingo', label: 'Domingo', isOpen: true, openTime: '09:00', closeTime: '20:00', isHoliday: false },
  ]);
  const [overnightFlatRate, setOvernightFlatRate] = useState<number>(15000);
  const [enableOvernightParking, setEnableOvernightParking] = useState<boolean>(true);

  // ── 4. POS, TICKET DE PRUEBA & TAREAS OBLIGATORIAS ──
  const [printerPaperSize, setPrinterPaperSize] = useState<ThermalPaperSize>('80mm');
  const [audioBeepAlerts, setAudioBeepAlerts] = useState<boolean>(true);
  const [posInitialCashFund, setPosInitialCashFund] = useState<number>(50000);
  const [tasksList, setTasksList] = useState<{ id: string; label: string; mandatory: boolean }[]>([
    { id: 't1', label: 'Verificar bobina de papel en impresora térmica', mandatory: true },
    { id: 't2', label: 'Reconteo de gaveta física ($50.000 CLP de sencillo)', mandatory: true },
    { id: 't3', label: 'Inspección de barrera de acceso y lector LPR', mandatory: true },
    { id: 't4', label: 'Revisión de cámaras y luminarias de Serrano 447', mandatory: false },
    { id: 't5', label: 'Limpieza de tótem y desinfección de garita', mandatory: false },
  ]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newTaskIsMandatory, setNewTaskIsMandatory] = useState(true);

  // ── 5. TARIFARIO & REGULACIÓN LEGAL (LEY 20.967) ──
  const [billingModel, setBillingModel] = useState<BillingModel>(tariffConfig.billingModel || 'PER_MINUTE');
  const [taxDocumentType, setTaxDocumentType] = useState<TaxDocumentType>(tariffConfig.taxDocumentType || 39);
  const [gracePeriod, setGracePeriod] = useState(tariffConfig.gracePeriodMinutes ?? 15);
  const [nightSurcharge, setNightSurcharge] = useState(tariffConfig.nightSurchargePercent || 20);
  const [weekendSurcharge, setWeekendSurcharge] = useState(tariffConfig.weekendSurchargePercent || 15);
  const [showAdvancedTariffs, setShowAdvancedTariffs] = useState<boolean>(false);
  const [isTicketVisualPreviewOpen, setIsTicketVisualPreviewOpen] = useState(false);

  // Categorías de Vehículos Dinámicas
  const [categories, setCategories] = useState<DynamicCategory[]>(() => {
    const rawRates = tariffConfig.vehicleRates || {};
    const rawTranches = tariffConfig.subsequentTrancheRates || {};
    const initialList: DynamicCategory[] = [
      {
        id: 'cat-auto',
        name: 'Automóvil',
        minuteRate: rawRates['Automóvil']?.minuteRate || 40,
        trancheRate: rawTranches['Automóvil'] || 400,
        maxDailyRate: rawRates['Automóvil']?.maxDailyRate || 18000,
      },
      {
        id: 'cat-camioneta',
        name: 'Camioneta',
        minuteRate: rawRates['Camioneta']?.minuteRate || 50,
        trancheRate: rawTranches['Camioneta'] || 500,
        maxDailyRate: rawRates['Camioneta']?.maxDailyRate || 22000,
      },
      {
        id: 'cat-moto',
        name: 'Motocicleta',
        minuteRate: rawRates['Motocicleta']?.minuteRate || 25,
        trancheRate: rawTranches['Motocicleta'] || 250,
        maxDailyRate: rawRates['Motocicleta']?.maxDailyRate || 10000,
      },
      {
        id: 'cat-furgon',
        name: 'Furgón / SUV',
        minuteRate: rawRates['Furgón / SUV']?.minuteRate || 50,
        trancheRate: rawTranches['Furgón / SUV'] || 500,
        maxDailyRate: rawRates['Furgón / SUV']?.maxDailyRate || 22000,
      },
    ];
    return initialList;
  });

  const [newCatName, setNewCatName] = useState('');
  const [newCatMinute, setNewCatMinute] = useState(45);
  const [newCatTranche, setNewCatTranche] = useState(450);
  const [newCatMaxDaily, setNewCatMaxDaily] = useState(20000);
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // ── EFECTO 1: WAKE LOCK REAL (PREVENCIÓN DE APAGADO DE PANTALLA) ──
  useEffect(() => {
    let sentinel: any = null;
    const requestLock = async () => {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && preventScreenOff) {
        try {
          sentinel = await (navigator as any).wakeLock.request('screen');
          setWakeLockActive(true);
        } catch (err) {
          console.warn('WakeLock denegado o no soportado:', err);
          setWakeLockActive(false);
        }
      } else {
        setWakeLockActive(false);
      }
    };

    if (preventScreenOff) {
      requestLock();
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && preventScreenOff) {
          requestLock();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (sentinel) {
          sentinel.release().catch(() => {});
        }
      };
    } else {
      setWakeLockActive(false);
    }
  }, [preventScreenOff]);

  // ── EFECTO 2: PREVENCIÓN DE CIERRE DE SESIÓN & BEFOREUNLOAD ──
  useEffect(() => {
    if (preventAutoLogout) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Turno de garita en curso. ¿Seguro que desea salir?';
        return e.returnValue;
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Heartbeat de sesión
      const heartbeat = setInterval(() => {
        try {
          localStorage.setItem('pms_session_heartbeat', Date.now().toString());
        } catch (e) {}
      }, 30000);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        clearInterval(heartbeat);
      };
    }
  }, [preventAutoLogout]);

  // ── MANEJADORES DE MONTO (CLP SIN CERO ADELANTE) ──
  const handleCashFundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const cleanNum = raw ? parseInt(raw, 10) : 0;
    setPosInitialCashFund(cleanNum);
    markDirty();
  };

  const handleCategoryFieldChange = (
    catId: string,
    field: 'name' | 'minuteRate' | 'trancheRate' | 'maxDailyRate',
    value: string
  ) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== catId) return c;
        if (field === 'name') {
          return { ...c, name: value };
        }
        const clean = value.replace(/\D/g, '');
        const num = clean ? parseInt(clean, 10) : 0;
        return { ...c, [field]: num };
      })
    );
    markDirty();
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      onShowToast('Ingrese un nombre para la categoría.', 'error');
      return;
    }
    const newCat: DynamicCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      minuteRate: newCatMinute,
      trancheRate: newCatTranche,
      maxDailyRate: newCatMaxDaily,
    };
    setCategories((prev) => [...prev, newCat]);
    setIsAddCatModalOpen(false);
    setNewCatName('');
    markDirty();
    onShowToast(`Categoría "${newCat.name}" agregada exitosamente.`, 'success');
  };

  const handleDeleteCategory = (catId: string) => {
    if (categories.length <= 1) {
      onShowToast('Debe existir al menos una categoría vehicular.', 'error');
      return;
    }
    const cat = categories.find((c) => c.id === catId);
    if (!confirm(`¿Desea eliminar la categoría "${cat?.name}"?`)) return;
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    markDirty();
    onShowToast(`Categoría eliminada.`, 'info');
  };

  // ── GESTIÓN DE TAREAS (CHECKLIST) ──
  const handleToggleTaskMandatory = (taskId: string) => {
    setTasksList((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, mandatory: !t.mandatory } : t))
    );
    markDirty();
  };

  const handleDeleteTask = (taskId: string) => {
    setTasksList((prev) => prev.filter((t) => t.id !== taskId));
    markDirty();
    onShowToast('Tarea eliminada del checklist.', 'info');
  };

  const handleAddTask = () => {
    if (!newTaskInput.trim()) return;
    const newTask = {
      id: `task-${Date.now()}`,
      label: newTaskInput.trim(),
      mandatory: newTaskIsMandatory,
    };
    setTasksList((prev) => [...prev, newTask]);
    setNewTaskInput('');
    markDirty();
    onShowToast('Nueva tarea añadida al checklist.', 'success');
  };

  // ── GESTIÓN DE PERMISOS INDIVIDUALES & PIN POR USUARIO ──
  const handleToggleUserPermission = (userId: string, permKey: keyof GranularPermissions) => {
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        return {
          ...u,
          permissions: {
            ...u.permissions,
            [permKey]: !u.permissions[permKey],
          },
        };
      })
    );
    markDirty();
  };

  const handleUserPinChange = (userId: string, newPin: string) => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, pin: newPin } : u))
    );
    markDirty();
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'activo' ? 'inactivo' : 'activo' }
          : u
      )
    );
    markDirty();
  };

  // ── GESTIÓN DE HORARIOS DEL RECINTO ──
  const handleToggleDayOpen = (dayKey: string) => {
    setWeeklySchedule((prev) =>
      prev.map((d) => (d.day === dayKey ? { ...d, isOpen: !d.isOpen } : d))
    );
    markDirty();
  };

  const handleDayTimeChange = (dayKey: string, field: 'openTime' | 'closeTime', val: string) => {
    setWeeklySchedule((prev) =>
      prev.map((d) => (d.day === dayKey ? { ...d, [field]: val } : d))
    );
    markDirty();
  };

  const handleToggleDayHoliday = (dayKey: string) => {
    setWeeklySchedule((prev) =>
      prev.map((d) => (d.day === dayKey ? { ...d, isHoliday: !d.isHoliday } : d))
    );
    markDirty();
  };

  // ── GESTIÓN DE CONVENIOS Y PROMOCIONES ──
  const handleTogglePromoActive = (promoId: string) => {
    setPromotionsList((prev) =>
      prev.map((p) => (p.id === promoId ? { ...p, active: !p.active } : p))
    );
    markDirty();
  };

  const handleDeletePromo = (promoId: string) => {
    setPromotionsList((prev) => prev.filter((p) => p.id !== promoId));
    markDirty();
    onShowToast('Convenio eliminado.', 'info');
  };

  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoName.trim()) return;
    const newP: PromotionItem = {
      id: `promo-${Date.now()}`,
      name: newPromoName.trim(),
      type: newPromoType,
      value: Number(newPromoValue) || 0,
      active: true,
      description: newPromoDesc.trim() || 'Convenio comercial para clientes',
    };
    setPromotionsList((prev) => [...prev, newP]);
    setIsNewPromoModalOpen(false);
    setNewPromoName('');
    setNewPromoDesc('');
    markDirty();
    onShowToast(`Convenio "${newP.name}" agregado exitosamente.`, 'success');
  };

  // ── IMPRESIÓN Y DESCARGA DE TICKET DE PRUEBA ──
  const handlePrintTestTicket = (download: boolean = false) => {
    const mockTicket = {
      ticketCode: `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-PRUEBA-01`,
      plateNumber: 'BBCL-10',
      vehicleType: 'Automóvil',
      slotCode: 'A-01',
      entryTime: new Date().toISOString(),
      rate: categories[0]?.minuteRate || 40,
      customerName: 'Cliente Prueba Garita',
      customerPhone: '+56 9 8765 4321',
      notes: 'Test de hardware, corte de papel y alineación de fuentes',
    };
    generateTicketPdf(mockTicket, printerPaperSize, download);
    if (download) {
      onShowToast('PDF del ticket de prueba descargado.', 'success');
    } else {
      onShowToast(`Enviando ticket a impresora (${printerPaperSize})...`, 'success');
    }
  };

  // ── EXPORTACIÓN DE CARTEL PÚBLICO & FICHA INTERNA ──
  const buildCurrentTariffConfigObj = () => {
    const vehicleRatesMap: Record<string, any> = {};
    const tranchesMap: Record<string, number> = {};
    categories.forEach((c) => {
      vehicleRatesMap[c.name] = {
        minuteRate: c.minuteRate,
        hourlyRate: c.minuteRate * 60,
        maxDailyRate: c.maxDailyRate,
      };
      tranchesMap[c.name] = c.trancheRate;
    });

    return {
      ...tariffConfig,
      billingModel,
      taxDocumentType,
      gracePeriodMinutes: gracePeriod,
      nightSurchargePercent: nightSurcharge,
      weekendSurchargePercent: weekendSurcharge,
      vehicleRates: vehicleRatesMap,
      subsequentTrancheRates: tranchesMap,
    };
  };

  const handleExportPublicPoster = (download: boolean = false) => {
    const cfg = buildCurrentTariffConfigObj();
    generatePublicTariffPosterPdf(cfg, { name: 'PARKING OPS — CORDANO IQUIQUE', address: 'Serrano 447' }, download);
    onShowToast(download ? 'Cartel público descargado en PDF.' : 'Imprimiendo cartel oficial para entrada...', 'success');
  };

  const handleExportInternalDoc = (download: boolean = false) => {
    const cfg = buildCurrentTariffConfigObj();
    generateInternalTariffDocumentationPdf(cfg, { name: 'PARKING OPS — CORDANO IQUIQUE', address: 'Serrano 447' }, download);
    onShowToast(download ? 'Ficha técnica interna descargada.' : 'Imprimiendo ficha operativa interna...', 'success');
  };

  // ── CAMBIO DE CONTRASEÑA DE CUENTA ──
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      onShowToast('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowToast('La nueva contraseña y su confirmación no coinciden.', 'error');
      return;
    }
    // Guarda de manera segura
    localStorage.setItem(`pms_pwd_${activeUser.id}`, newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordFields(false);
    onShowToast('Contraseña de usuario actualizada exitosamente.', 'success');
  };

  // ── RESTABLECIMIENTO DE CONTRASEÑA POR CORREO ──
  const handleTriggerResetEmail = (u: SystemUser) => {
    const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const resetUrl = `${window.location.origin}/reset-password?token=${token}&email=${encodeURIComponent(u.email)}`;
    setResetEmailModalData({
      email: u.email,
      name: u.name,
      tokenUrl: resetUrl,
    });
    setIsCopiedResetUrl(false);
    onShowToast(`Enlace de restablecimiento generado para ${u.email}`, 'info');
  };

  // ── 6. LÓGICA DE BASE DE DATOS (11 TABLAS CANÓNICAS) & GOOGLE SHEETS ──
  const databaseTablesData = React.useMemo(() => {
    // 1. Users
    const usersRows = usersList.map((u) => ({
      id_usuario: u.id,
      nombre_completo: u.name,
      email: u.email,
      rol: u.role,
      estado: u.status,
      pin_hash: 'SHA256-PROTECTED',
      ultimo_acceso: new Date().toISOString(),
    }));

    // 2. RolesPermissions
    const rolesRows = usersList.map((u) => ({
      id_rol_permiso: `perm-${u.id}`,
      id_usuario: u.id,
      nombre_usuario: u.name,
      rol: u.role,
      puede_operar_pos: u.permissions.canOperatePos,
      puede_iniciar_cerrar_turno: u.permissions.canOpenCloseShift,
      puede_ver_informes: u.permissions.canViewReports,
      puede_arqueo_ciego: u.permissions.canAuditCash,
      puede_descuentos_cortesias: u.permissions.canOverrideRates,
      puede_anular_tickets: u.permissions.canVoidTickets,
      puede_configurar_tarifas: u.permissions.canConfigureTariffs,
      puede_administrar_usuarios: u.permissions.canManageUsers,
      puede_auditoria_seguridad: u.permissions.canViewSecurityAudit,
    }));

    // 3. Customers
    const customersRows = (customers || []).map((c: any) => ({
      id_cliente: c.id,
      nombre_razon_social: c.name,
      rut_identificador: c.rut || 'RUT-NO-DECLARADO',
      telefono: c.phone || 'S/N',
      email: c.email || 'sin-correo@cordano.cl',
      tipo_cliente: c.agreementType || c.type || 'NATURAL',
      direccion: c.address || 'Iquique, Tarapacá',
      patentes_asociadas: Array.isArray(c.plates) ? c.plates.join(', ') : c.plateNumber || '',
      limite_credito_clp: 0,
      dias_gracia_pago: 5,
      es_empresa_flota: false,
      activo: true,
    }));

    // 4. Vehicles
    const vehiclesRows = (tickets || []).map((t) => ({
      patente_chile: t.plateNumber,
      tipo_vehiculo: t.vehicleType,
      marca: 'No declarada',
      modelo: 'Particular',
      color: 'Gris Plata',
      id_cliente_dueno: t.customerName || 'Cliente Garita',
      telefono_contacto: t.customerPhone || 'S/N',
      es_flota_empresa: false,
      total_visitas_historicas: 1,
      minutos_totales_acumulados: t.durationMinutes || 0,
      monto_total_historico_pagado: t.totalAmount || 0,
      ultima_fecha_ingreso: t.entryTime,
      bloqueado_por_fraude: false,
    }));

    // 5. ParkingSlots
    const slotsRows = (slots || []).map((s: any) => ({
      id_cajon: s.id,
      codigo_cajon: s.code,
      zona: s.zone,
      tipo_cajon: s.type || 'ESTANDAR',
      es_preferencial_pmr: s.isPMR || s.code === 'A-01' || s.code === 'A-02',
      es_carga_electrica: s.isEV || s.code === 'A-03',
      es_convenio_exclusivo: s.isAbonado || s.code === 'B-29' || s.code === 'B-30',
      estado_ocupacion: s.status,
      patente_actual: s.plateNumber || s.currentPlate || 'DISPONIBLE',
      ancho_metros: 2.5,
      largo_metros: 5.0,
      sensor_iot_id: `SENS-SERRANO-${s.code}`,
      piso_nivel: 'NIVEL_CALLE_SERRANO_447',
    }));

    // 6. Tickets
    const ticketsRows = (tickets || []).map((t: any) => ({
      id_ticket: t.id,
      codigo_ticket: t.ticketCode || t.id,
      patente_vehiculo: t.plateNumber,
      id_cajon_asignado: t.slotCode || 'PATIO',
      tipo_vehiculo: t.vehicleType,
      timestamp_ingreso: t.entryTime,
      timestamp_salida: t.exitTime || 'EN_CURSO',
      minutos_estadia_reales: t.durationMinutes || 0,
      minutos_gracia_aplicados: t.gracePeriodMinutes || 15,
      monto_base_subtotal: t.subtotalAmount || t.totalAmount || 0,
      monto_descuento_aplicado: t.discountAmount || 0,
      monto_total_cobrado: t.totalAmount || 0,
      folio_boleta_sii: t.dteFolio || 'BOLETA-MANUAL',
    }));

    // 7. TariffVersions
    const tariffRows = (tariffVersions || []).map((tv) => ({
      id_version_tarifa: tv.id,
      nombre_version: `Versión ${tv.versionNumber} (Ley 20.967)`,
      modelo_cobro: tv.billingModel,
      precio_por_minuto: tv.vehicleRates?.['Automóvil']?.minuteRate || 35,
      minutos_gracia: tv.gracePeriodMinutes || 15,
      recargo_administrativo_extravio_clp: 0,
      fecha_inicio_vigencia: tv.effectiveFrom || '2026-01-01',
      es_activa: !tv.effectiveUntil,
    }));

    // 8. Payments
    const paymentsRows = (tickets || [])
      .filter((t) => t.status === 'pagado')
      .map((t) => ({
        id_pago: `pay-${t.id}`,
        id_ticket: t.id,
        medio_pago: String(t.paymentMethod || 'efectivo').toUpperCase(),
        monto_total_pagado: t.totalAmount || 0,
        folio_boleta_sii: t.dteFolio || `DTE-${t.id.slice(-6)}`,
        timestamp_pago: t.exitTime || t.entryTime,
      }));

    // 9. Shifts
    const shiftsRows = currentShift ? [{
      id_turno: currentShift.id,
      id_usuario_operador: currentShift.operatorName,
      fecha_hora_apertura: currentShift.startTime,
      fondo_inicial_efectivo: currentShift.initialCash || 50000,
      estado_turno: currentShift.status,
      fecha_hora_cierre: currentShift.endTime || 'TURNO_EN_CURSO',
      fondo_dejado_en_gaveta: currentShift.handoverFundAmount || currentShift.initialCash || 50000,
      declarado_efectivo_fisico: currentShift.declaredCash || 0,
      declarado_tarjetas_vouchers: currentShift.declaredCard || 0,
      esperado_efectivo_sistema: currentShift.expectedCash || 0,
      hash_sha256_cierre: currentShift.hash || 'PENDIENTE_CIERRE',
    }] : [];

    // 10. AuditTrail
    const auditRows = (auditLogs || []).map((al) => ({
      id_evento_auditoria: al.id,
      timestamp: al.timestamp,
      tipo_evento: al.action,
      nivel_criticidad: (al.severity || 'INFO').toUpperCase(),
      id_usuario_solicitante: al.userName || 'Garita',
      motivo_justificacion: al.details || 'Operación regular garita',
    }));

    // 11. SyncQueue
    const syncRows = [
      {
        id_local_sync: 'sync-queue-01',
        tipo_operacion: 'UPSERT',
        coleccion_destino: 'tickets',
        timestamp_creacion_local: new Date().toISOString(),
        estado_sincronizacion: syncQueueCount > 0 ? 'PENDING' : 'SYNCED',
        reintentos: 0,
      },
    ];

    return {
      Users: { ...CORDANO_11_TABLES_SCHEMA.Users, rows: usersRows },
      RolesPermissions: { ...CORDANO_11_TABLES_SCHEMA.RolesPermissions, rows: rolesRows },
      Customers: { ...CORDANO_11_TABLES_SCHEMA.Customers, rows: customersRows },
      Vehicles: { ...CORDANO_11_TABLES_SCHEMA.Vehicles, rows: vehiclesRows },
      ParkingSlots: { ...CORDANO_11_TABLES_SCHEMA.ParkingSlots, rows: slotsRows },
      Tickets: { ...CORDANO_11_TABLES_SCHEMA.Tickets, rows: ticketsRows },
      TariffVersions: { ...CORDANO_11_TABLES_SCHEMA.TariffVersions, rows: tariffRows },
      Payments: { ...CORDANO_11_TABLES_SCHEMA.Payments, rows: paymentsRows },
      Shifts: { ...CORDANO_11_TABLES_SCHEMA.Shifts, rows: shiftsRows },
      AuditTrail: { ...CORDANO_11_TABLES_SCHEMA.AuditTrail, rows: auditRows },
      SyncQueue: { ...CORDANO_11_TABLES_SCHEMA.SyncQueue, rows: syncRows },
    } as Record<string, CanonicalTableData>;
  }, [usersList, customers, tickets, slots, tariffVersions, currentShift, auditLogs, syncQueueCount]);

  const handleConnectGoogleSheets = async () => {
    try {
      setGoogleSyncState((prev) => ({ ...prev, isConnecting: true }));
      onShowToast('Iniciando autenticación segura con Google Identity Services...', 'info');

      requestGoogleAccessToken(async (tokenResponse) => {
        if (tokenResponse?.access_token) {
          const token = tokenResponse.access_token;
          setGoogleSyncState((prev) => ({ ...prev, accessToken: token, isSyncing: true }));
          onShowToast('Autenticado con éxito. Creando planilla con las 11 pestañas canónicas...', 'info');

          try {
            const result = await createCordanoSpreadsheet(token);
            setGoogleSyncState((prev) => ({
              ...prev,
              spreadsheetId: result.spreadsheetId,
              spreadsheetUrl: result.spreadsheetUrl,
            }));

            // Sincronizar las 11 tablas
            for (const [, table] of Object.entries(databaseTablesData) as [string, CanonicalTableData][]) {
              await syncTableToGoogleSheet(
                token,
                result.spreadsheetId,
                table.sheetName,
                table.rows,
                table.columns
              );
            }

            setGoogleSyncState((prev) => ({
              ...prev,
              isConnecting: false,
              isSyncing: false,
              lastSyncTime: new Date().toLocaleTimeString('es-CL'),
            }));
            onShowToast('¡Planilla de Google Sheets sincronizada exitosamente con las 11 tablas!', 'success');
          } catch (syncErr: any) {
            console.error('Error sincronizando Google Sheets:', syncErr);
            setGoogleSyncState((prev) => ({ ...prev, isConnecting: false, isSyncing: false }));
            onShowToast(syncErr?.message || 'Error al crear la planilla en Google Drive', 'error');
          }
        } else {
          setGoogleSyncState((prev) => ({ ...prev, isConnecting: false, isSyncing: false }));
          onShowToast('No se completó la autorización de Google.', 'error');
        }
      });
    } catch (err: any) {
      setGoogleSyncState((prev) => ({ ...prev, isConnecting: false, isSyncing: false }));
      onShowToast('Google Identity SDK no disponible. Puede descargar los datos en CSV/JSON.', 'error');
    }
  };

  const handleSyncAllToGoogleSheets = async () => {
    if (!googleSyncState.accessToken || !googleSyncState.spreadsheetId) {
      handleConnectGoogleSheets();
      return;
    }

    try {
      setGoogleSyncState((prev) => ({ ...prev, isSyncing: true }));
      onShowToast('Sincronizando 11 tablas a Google Sheets...', 'info');

      for (const [, table] of Object.entries(databaseTablesData) as [string, CanonicalTableData][]) {
        await syncTableToGoogleSheet(
          googleSyncState.accessToken,
          googleSyncState.spreadsheetId,
          table.sheetName,
          table.rows,
          table.columns
        );
      }

      setGoogleSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date().toLocaleTimeString('es-CL'),
      }));
      onShowToast('Sincronización con Google Sheets completada.', 'success');
    } catch (err: any) {
      setGoogleSyncState((prev) => ({ ...prev, isSyncing: false }));
      onShowToast(err?.message || 'Error al actualizar Google Sheets', 'error');
    }
  };

  const handleExportCurrentTableCsv = () => {
    const table = databaseTablesData[selectedTableKey];
    if (!table) return;

    const headers = table.columns.join(',');
    const rows = table.rows.map((r) =>
      table.columns
        .map((col) => {
          const val = r[col];
          if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
          if (typeof val === 'object' && val !== null) return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          return val ?? '';
        })
        .join(',')
    );

    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Cordano_${table.sheetName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Tabla "${table.title}" exportada como CSV.`, 'success');
  };

  const handleDownloadFullJsonBackup = () => {
    const fullDump: Record<string, any> = {
      sistema: 'PARKING OPS CORDANO PMS',
      fecha_backup: new Date().toISOString(),
      recinto: 'Serrano 447, Iquique, Chile',
      tablas: {},
    };

    (Object.entries(databaseTablesData) as [string, CanonicalTableData][]).forEach(([key, table]) => {
      fullDump.tablas[key] = {
        sheetName: table.sheetName,
        title: table.title,
        columns: table.columns,
        totalRows: table.rows.length,
        rows: table.rows,
      };
    });

    const jsonStr = JSON.stringify(fullDump, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CordanoPMS_Backup_11Tablas_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Respaldo JSON inmutable descargado correctamente.', 'success');
  };

  // ── GUARDAR SECCIÓN ACTUAL ──
  const handleSaveCurrentSection = () => {
    if (activeSection === 'generales') {
      localStorage.setItem('parking_ops_dark_mode', darkMode ? 'true' : 'false');
      localStorage.setItem('parking_ops_tablet_mode', tabletMode ? 'true' : 'false');
      localStorage.setItem('parking_ops_reduce_motion', reduceMotion ? 'true' : 'false');

      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      if (tabletMode) {
        document.documentElement.classList.add('tablet-mode');
      } else {
        document.documentElement.classList.remove('tablet-mode');
      }

      setIsDirty(false);
      onShowToast('Ajustes generales guardados. Se actualizará la vista.', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 700);
      return;
    }

    if (activeSection === 'tarifas') {
      const cfg = buildCurrentTariffConfigObj();
      updateTariffConfig(cfg);
      localStorage.setItem('cordano_promotions_list', JSON.stringify(promotionsList));
    } else if (activeSection === 'politicas') {
      localStorage.setItem('cordano_cash_fund', posInitialCashFund.toString());
      localStorage.setItem('cordano_discrepancy_tolerance', cashToleranceDiscrepancy.toString());
      localStorage.setItem('cordano_overstay_alert_minutes', overstayAlertMinutes.toString());
      localStorage.setItem('cordano_tasks_list', JSON.stringify(tasksList));
    } else if (activeSection === 'ticket') {
      localStorage.setItem('cordano_ticket_template', selectedTicketTemplate);
      localStorage.setItem('cordano_paper_size', printerPaperSize);
      localStorage.setItem('cordano_autoprint_entry', autoPrintEntry ? 'true' : 'false');
      localStorage.setItem('cordano_autoprint_exit', autoPrintExit ? 'true' : 'false');
    } else if (activeSection === 'usuarios') {
      localStorage.setItem('cordano_users_list', JSON.stringify(usersList));
    } else if (activeSection === 'horarios') {
      localStorage.setItem('cordano_weekly_schedule', JSON.stringify(weeklySchedule));
      localStorage.setItem('cordano_overnight_flat_rate', overnightFlatRate.toString());
      localStorage.setItem('cordano_enable_overnight', enableOvernightParking ? 'true' : 'false');
    }

    setIsDirty(false);
    onShowToast(`Configuración de "${getSectionTitle(activeSection)}" guardada correctamente.`, 'success');
  };

  function getSectionTitle(section: SettingsSection): string {
    switch (section) {
      case 'tarifas':
        return isAdmin ? '1. Tarifario CLP & Convenios Comerciales (Ley N° 20.967)' : 'Tarifario Oficial Vigente (Solo Consulta)';
      case 'politicas':
        return '2. Políticas de Turno, Fondo de Caja & Arqueo Ciego';
      case 'ticket':
        return '3. Diseño de Ticket e Impresión Térmica';
      case 'usuarios':
        return '4. Gestión de Usuarios & Matriz de Permisos RBAC';
      case 'horarios':
        return '5. Horarios del Recinto Serrano 447 & Pernoctación';
      case 'generales':
        return '6. Preferencias de Pantalla & Garita (Offline / Modo Oscuro)';
      case 'integraciones':
        return '7. Base de Datos & Sincronización Google Sheets';
      case 'cuenta':
        return isAdmin ? 'Ajustes de Cuenta & Supervisión' : 'Mi Perfil de Operador';
    }
  }

  const availableSections: { id: SettingsSection; label: string; icon: string }[] = isAdmin
    ? [
        { id: 'tarifas', label: '1. Tarifas y Promociones', icon: '💰' },
        { id: 'politicas', label: '2. Políticas de Turno y Caja', icon: '🛡' },
        { id: 'ticket', label: '3. Diseño de Ticket e Impresión', icon: '🖨' },
        { id: 'usuarios', label: '4. Usuarios y Permisos', icon: '👥' },
        { id: 'horarios', label: '5. Horarios del Recinto', icon: '🕒' },
        { id: 'generales', label: '6. Pantalla & Garita Offline', icon: '⚙' },
        { id: 'integraciones', label: '7. Base de Datos & Sheets', icon: '📊' },
        { id: 'cuenta', label: 'Mi Cuenta & Credenciales', icon: '👤' },
      ]
    : [
        { id: 'cuenta', label: 'Mi Perfil & Contraseña', icon: '👤' },
        { id: 'generales', label: 'Tema & Accesibilidad Personal', icon: '🎨' },
      ];

  return (
    <div id="view-settings" className="p-4 sm:p-6 lg:p-8 w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 space-y-6 text-[#1E1E2F] animate-fade-in-up font-sans">
      {/* ── HEADER ROLE-ADAPTIVE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2E8F0] pb-4 gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1E2F]">
            {isAdmin ? 'Ajustes del Sistema' : 'Mi Perfil & Preferencias'}
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            {isAdmin ? 'Gestión central de tarifas, usuarios, seguridad e impresión térmica' : 'Gestión de credenciales personales, contraseña y accesibilidad visual'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold animate-pulse">
              <span>⚠ Cambios sin guardar</span>
            </div>
          )}
        </div>
      </div>

      {/* ── LAYOUT CENTRAL: SIDEBAR IZQUIERDO + PANEL DERECHO ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* LEFT VERTICAL SIDEBAR */}
        <aside className="md:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs p-3 space-y-1">
          {availableSections.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (isDirty) {
                    if (!confirm('Tiene cambios pendientes. ¿Desea continuar sin guardar?')) return;
                  }
                  setActiveSection(item.id);
                  setIsDirty(false);
                }}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  active
                    ? 'bg-[#1E1E2F] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {active && <span className="text-xs text-[#E2498A]">●</span>}
              </button>
            );
          })}
        </aside>

        {/* RIGHT CONTENT PANEL */}
        <div className="md:col-span-9 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-[#1E1E2F] tracking-tight">
              {getSectionTitle(activeSection)}
            </h3>

            {activeSection === 'tarifas' && !isAdmin ? (
              <span className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs flex items-center gap-1.5 border border-slate-200 select-none">
                <span>🔒</span>
                <span>Tarifas Protegidas (Solo Admin)</span>
              </span>
            ) : (activeSection === 'usuarios' || activeSection === 'politicas' || activeSection === 'horarios') && !isAdmin ? (
              <span className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs flex items-center gap-1.5 border border-slate-200 select-none">
                <span>🔒</span>
                <span>Módulo Restringido (Solo Administrador)</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSaveCurrentSection}
                className="px-5 py-2.5 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>💾</span>
                <span>Guardar Cambios</span>
              </button>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* 1. AJUSTES GENERALES & ACCESIBILIDAD & OFFLINE                     */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'generales' && (
            <div className="space-y-6 text-xs">
              {/* Selector de Temas Visuales Verificados (Ámbito por Usuario) */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-[#E2498A]" />
                      <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
                        Tema Visual Personal del Usuario
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Personalice la interfaz para su cuenta (<strong className="text-slate-700">{activeUser.name}</strong>). Los demás colaboradores y la landing page pública mantienen su aspecto estándar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem(userThemeKey, selectedTheme);
                      onShowToast(`Tema ${selectedTheme === 'dark' ? 'Oscuro' : selectedTheme === 'ocean' ? 'Océano' : 'Claro'} guardado para su cuenta.`, 'success');
                      window.location.reload();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition active:scale-95 shrink-0"
                  >
                    <span>💾</span>
                    <span>Guardar Mi Tema y Recargar</span>
                  </button>
                </div>

                {/* Grid de 3 Temas Limpios y Ergonómicos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Tema 1: Claro Predeterminado */}
                  <div
                    onClick={() => {
                      setSelectedTheme('light');
                      markDirty();
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative ${
                      selectedTheme === 'light'
                        ? 'border-[#E2498A] bg-pink-50/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-xs">Tema Claro (Predeterminado)</span>
                      {selectedTheme === 'light' && (
                        <span className="px-2 py-0.5 rounded-full bg-[#E2498A] text-white font-black text-[9px]">ACTIVO</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Fondo claro original de Cordano PMS, superficies blancas nítidas y textos de alta legibilidad.
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="w-6 h-6 rounded-lg bg-[#FEF9F5] border border-slate-300 shadow-2xs" title="Superficie Clara" />
                      <div className="w-6 h-6 rounded-lg bg-[#FFFFFF] border border-slate-300 shadow-2xs" title="Card Blanca" />
                      <div className="w-6 h-6 rounded-lg bg-[#E2498A] shadow-2xs" title="Acento Magenta" />
                      <div className="w-6 h-6 rounded-lg bg-[#2C1338] shadow-2xs" title="Texto Oscuro" />
                    </div>
                    <span className="inline-block text-[9px] font-mono font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      Estándar Institucional
                    </span>
                  </div>

                  {/* Tema 2: Dark Mode Garita */}
                  <div
                    onClick={() => {
                      setSelectedTheme('dark');
                      markDirty();
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative ${
                      selectedTheme === 'dark'
                        ? 'border-[#E2498A] bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-800 text-slate-100 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-xs">Tema Oscuro (Garita Nocturna)</span>
                      {selectedTheme === 'dark' && (
                        <span className="px-2 py-0.5 rounded-full bg-[#E2498A] text-white font-black text-[9px]">ACTIVO</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Pizarra oscura de alto contraste. Elimina reflejos y fatiga visual durante turnos de noche.
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="w-6 h-6 rounded-lg bg-[#1E1E2F] border border-slate-700 shadow-2xs" title="Fondo Pizarra" />
                      <div className="w-6 h-6 rounded-lg bg-[#2D2D44] border border-slate-600 shadow-2xs" title="Superficie Card" />
                      <div className="w-6 h-6 rounded-lg bg-[#E2498A] shadow-2xs" title="Acento Magenta" />
                      <div className="w-6 h-6 rounded-lg bg-[#F8FAFC] shadow-2xs" title="Texto Claro" />
                    </div>
                    <span className="inline-block text-[9px] font-mono font-bold text-pink-300 bg-pink-950/80 border border-pink-800 px-2 py-0.5 rounded-md">
                      Modo Noche
                    </span>
                  </div>

                  {/* Tema 3: Océano Slate */}
                  <div
                    onClick={() => {
                      setSelectedTheme('ocean');
                      markDirty();
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative ${
                      selectedTheme === 'ocean'
                        ? 'border-blue-600 bg-blue-50/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-xs">Tema Alternativo (Océano Slate)</span>
                      {selectedTheme === 'ocean' && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-black text-[9px]">ACTIVO</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Azul cobalto y superficies limpias slate. Enfoque sobrio para supervisión y administración.
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="w-6 h-6 rounded-lg bg-[#F0F4F8] border border-slate-300 shadow-2xs" title="Fondo Slate" />
                      <div className="w-6 h-6 rounded-lg bg-[#FFFFFF] border border-slate-300 shadow-2xs" title="Card Blanca" />
                      <div className="w-6 h-6 rounded-lg bg-[#2563EB] shadow-2xs" title="Azul Cobalto" />
                      <div className="w-6 h-6 rounded-lg bg-[#0F172A] shadow-2xs" title="Texto Navy" />
                    </div>
                    <span className="inline-block text-[9px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      Cobalto / Slate
                    </span>
                  </div>
                </div>
              </div>

              {/* Prevención de Cierre & Wake Lock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Prevenir Cierre de Sesión */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Prevenir Cierre Accidental de Sesión</span>
                      <span className="text-[11px] text-slate-500">
                        Intercepción con confirmación al cerrar pestaña y envío de latidos (heartbeat).
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preventAutoLogout}
                      onChange={(e) => {
                        setPreventAutoLogout(e.target.checked);
                        markDirty();
                      }}
                      className="w-5 h-5 accent-[#E2498A] cursor-pointer shrink-0"
                    />
                  </div>
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-700 font-bold">
                      {preventAutoLogout ? '✓ Protección de sesión armada' : '✕ Desactivado'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onShowToast('Prueba: La protección contra cierre accidental está activa en esta ventana.', 'info')}
                      className="text-[10px] font-bold text-[#E2498A] hover:underline cursor-pointer"
                    >
                      Probar Protección
                    </button>
                  </div>
                </div>

                {/* Prevenir Apagado de Pantalla (WakeLock) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Prevenir Apagado de Pantalla (WakeLock)</span>
                      <span className="text-[11px] text-slate-500">
                        Utiliza la API nativa de pantalla activa para evitar suspensión en tótems y garitas.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preventScreenOff}
                      onChange={(e) => {
                        setPreventScreenOff(e.target.checked);
                        markDirty();
                      }}
                      className="w-5 h-5 accent-[#E2498A] cursor-pointer shrink-0"
                    />
                  </div>
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-700 font-bold">
                      {wakeLockActive ? '⚡ WakeLock activo en hardware' : 'Inactivo / Esperando foco'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
                          onShowToast('Wake Lock API soportada y disponible en su navegador.', 'success');
                        } else {
                          onShowToast('Wake Lock no soportado en este navegador (se usará keepalive fallback).', 'info');
                        }
                      }}
                      className="text-[10px] font-bold text-[#E2498A] hover:underline cursor-pointer"
                    >
                      Verificar Soporte
                    </button>
                  </div>
                </div>
              </div>

              {/* Accesibilidad y Tablet Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Versión Tablet */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
                  <div className="flex items-center gap-2">
                    <Tablet className="w-4 h-4 text-[#E2498A]" />
                    <span className="font-bold text-slate-800 text-xs">Versión Tablet / Táctil</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Aumenta botones a 48px y espaciado para operación táctil en iPads o tablets Android.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold text-slate-600">{tabletMode ? 'Habilitado' : 'Estándar'}</span>
                    <input
                      type="checkbox"
                      checked={tabletMode}
                      onChange={(e) => {
                        setTabletMode(e.target.checked);
                        markDirty();
                      }}
                      className="w-5 h-5 accent-[#E2498A] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Tamaño de Tipografía */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 block text-xs uppercase">Tamaño de Fuente</span>
                  <p className="text-[11px] text-slate-500">Ajusta la escala tipográfica de botones e inputs.</p>
                  <select
                    value={fontSize}
                    onChange={(e) => {
                      setFontSize(e.target.value as any);
                      markDirty();
                    }}
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#E2498A] focus:outline-none cursor-pointer"
                  >
                    <option value="normal">Normal (14px base)</option>
                    <option value="grande">Grande (16px base)</option>
                    <option value="extragrande">Extra Grande (18px accesibilidad)</option>
                  </select>
                </div>

                {/* Alto Contraste y Reducción de Movimiento */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Alto Contraste</span>
                    <input
                      type="checkbox"
                      checked={highContrast}
                      onChange={(e) => {
                        setHighContrast(e.target.checked);
                        markDirty();
                      }}
                      className="w-4 h-4 accent-[#E2498A] cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Reducir Movimiento</span>
                    <input
                      type="checkbox"
                      checked={reduceMotion}
                      onChange={(e) => {
                        setReduceMotion(e.target.checked);
                        markDirty();
                      }}
                      className="w-4 h-4 accent-[#E2498A] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* ── MODO OFFLINE (MOVIDO A AJUSTES GENERALES) ── */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <WifiOff className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-amber-900 text-xs uppercase tracking-wide">
                      Modo Offline &amp; Respaldo Local (Habilitado por Defecto)
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Permite continuar operando la garita, registrar ingresos y liquidar salidas sin conexión a internet. Los datos se almacenan en la base local IndexedDB y se sincronizan automáticamente al reconectar.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOffline ? 'bg-amber-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                    {isOffline ? 'Contingencia Offline (-O) Forzada' : 'Conexión Normal'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOffline(!isOffline);
                      onShowToast(!isOffline ? 'Modo Offline forzado para pruebas.' : 'Modo en línea reanudado.', 'info');
                    }}
                    className="px-3 py-2 rounded-xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white font-bold text-xs cursor-pointer transition shadow-xs"
                  >
                    {isOffline ? 'Desactivar Forzado' : 'Forzar Modo Offline'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* 2. AJUSTES DE CUENTA & SEGURIDAD (SIN FOTO DE AVATAR)              */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'cuenta' && (
            <div className="space-y-6 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{accountName}</h4>
                    <p className="text-[11px] text-slate-500">
                      Rol: <strong>{activeUser.role.toUpperCase()}</strong> • Recinto Serrano 447, Iquique
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 font-bold text-[10px]">
                    Usuario Activo
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[11px]">Nombre de Cuenta</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => {
                      setAccountName(e.target.value);
                      markDirty();
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:border-[#E2498A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[11px]">Correo Electrónico</label>
                  <input
                    type="email"
                    value={accountEmail}
                    onChange={(e) => {
                      setAccountEmail(e.target.value);
                      markDirty();
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono focus:border-[#E2498A] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[11px]">
                    Correo de Notificaciones y Cierres Z
                  </label>
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => {
                      setNotificationEmail(e.target.value);
                      markDirty();
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono focus:border-[#E2498A] focus:outline-none"
                  />
                </div>
              </div>

              {/* SECCIÓN CAMBIO DE CONTRASEÑA */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Key className="w-4 h-4 text-[#E2498A]" />
                      <span>Cambio de Contraseña de Acceso</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">Actualice su clave de ingreso o PIN de garita.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                  >
                    {showPasswordFields ? 'Cancelar' : 'Cambiar Contraseña'}
                  </button>
                </div>

                {showPasswordFields && (
                  <form onSubmit={handleChangePassword} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-fade-in-up">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Contraseña Actual</label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs focus:border-[#E2498A] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Nueva Contraseña</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs focus:border-[#E2498A] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Confirmar Nueva Contraseña</label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita la clave"
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs focus:border-[#E2498A] focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Actualizar Contraseña Ahora
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* 2. POLÍTICAS DE TURNO, FONDO DE CAJA & ARQUEO CIEGO               */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'politicas' && (
            <div className="space-y-6 text-xs">
              {/* Información y Protocolo */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 border border-[#E2498A]/30 text-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛡️</span>
                  <span className="font-extrabold text-xs uppercase tracking-wide text-[#C83472]">
                    Políticas de Turno, Resguardo de Recaudación &amp; Arqueo Ciego
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Establezca las reglas para el ciclo operativo diario en garita. En el modelo de Arqueo Ciego, el cajero declara físicamente el efectivo sin conocer el saldo teórico calculado, asegurando transparencia y previniendo fraudes transaccionales.
                </p>
              </div>

              {/* Parámetros Operativos de Caja y Turno */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fondo Inicial de Gaveta */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Fondo de Caja Inicial ($ CLP)</span>
                    <span className="px-2 py-0.5 rounded-md bg-pink-100 text-[#C83472] font-black text-[10px]">OBLIGATORIO</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono text-sm">$</span>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={posInitialCashFund === 0 ? '' : posInitialCashFund.toLocaleString('es-CL')}
                      onChange={handleCashFundChange}
                      placeholder="50.000"
                      className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-black text-sm text-slate-800 focus:border-[#E2498A] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Monto base requerido para dar cambio en sencillo al abrir la jornada (estándar $50.000 CLP).
                  </p>
                </div>

                {/* Minutos de Gracia / Tolerancia Legal */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Minutos Libres de Gracia (Tolerancia)</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">LEY 20.967</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={gracePeriod}
                      disabled={!isAdmin}
                      onChange={(e) => {
                        setGracePeriod(Number(e.target.value));
                        markDirty();
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:border-[#E2498A] focus:bg-white focus:outline-none cursor-pointer"
                    >
                      <option value={15}>15 Minutos (Mínimo Legal Obligatorio)</option>
                      <option value={20}>20 Minutos (Cortesía Extendida)</option>
                      <option value={30}>30 Minutos (Máxima Tolerancia)</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Tiempo exento de cobro ($0 CLP) al ingresar y salir del recinto Serrano 447.
                  </p>
                </div>

                {/* Umbral de Alerta de Sobreestadía */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Alerta de Sobreestadía Prolongada</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">MONITOREO</span>
                  </div>
                  <select
                    value={overstayAlertMinutes}
                    disabled={!isAdmin}
                    onChange={(e) => {
                      setOverstayAlertMinutes(Number(e.target.value));
                      markDirty();
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:border-[#E2498A] focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value={60}>60 Minutos (1 Hora)</option>
                    <option value={120}>120 Minutos (2 Horas - Recomendado)</option>
                    <option value={180}>180 Minutos (3 Horas)</option>
                    <option value={240}>240 Minutos (4 Horas)</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Destaca en color ámbar en la garita los vehículos que excedan este tiempo sin registrar salida.
                  </p>
                </div>

                {/* Tolerancia de Descuadre en Arqueo Ciego */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Tolerancia Descuadre de Arqueo ($ CLP)</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">ANTIFRAUDE</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono text-sm">$</span>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={cashToleranceDiscrepancy === 0 ? '' : cashToleranceDiscrepancy.toLocaleString('es-CL')}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '');
                        setCashToleranceDiscrepancy(clean ? parseInt(clean, 10) : 0);
                        markDirty();
                      }}
                      placeholder="2.000"
                      className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-black text-sm text-slate-800 focus:border-[#E2498A] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Diferencia máxima permitida entre efectivo físico y teórico antes de exigir PIN de supervisor.
                  </p>
                </div>
              </div>

              {/* Checklist de Apertura de Turno */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Checklist Obligatorio de Apertura de Turno</h4>
                    <p className="text-slate-500 text-[11px]">Tareas físicas que el operador debe verificar antes de desbloquear el POS.</p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">{tasksList.length} tareas activas</span>
                </div>

                <div className="space-y-2">
                  {tasksList.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <span className="font-semibold text-slate-700 truncate">{task.label}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleTaskMandatory(task.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition ${
                            task.mandatory
                              ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {task.mandatory ? 'OBLIGATORIA' : 'OPCIONAL'}
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {isAdmin && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <input
                      type="text"
                      value={newTaskInput}
                      onChange={(e) => setNewTaskInput(e.target.value)}
                      placeholder="Nueva tarea de inspección o verificación..."
                      className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-white focus:border-[#E2498A] focus:outline-none text-xs font-medium"
                    />

                    <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newTaskIsMandatory}
                        onChange={(e) => setNewTaskIsMandatory(e.target.checked)}
                        className="w-4 h-4 accent-[#E2498A]"
                      />
                      <span className="text-[11px] font-bold text-slate-700">Obligatoria</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleAddTask}
                      className="px-4 py-2 rounded-xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      + Agregar Tarea
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* 3. DISEÑO DE TICKET E IMPRESIÓN TÉRMICA                            */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'ticket' && (
            <div className="space-y-6 text-xs">
              {/* Formato Estándar Oficial de Garita */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <span>🏷️</span>
                      <span>Formato Oficial de Ticket Térmico Garita</span>
                    </h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Estándar corporativo único con código QR de alta resolución, tarifa por minuto, tiempo de gracia y cláusula de responsabilidad del cliente.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#FFF5F8] text-[#E2498A] font-bold text-xs border border-pink-100 self-start sm:self-auto">
                    Estándar Único Cordano
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-800 block text-[11px] mb-0.5">Normativa Ley 20.967:</span>
                    <span>Cobro exacto por minuto efectivo, sin recargos ilegales por extravío.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-800 block text-[11px] mb-0.5">Código QR Funcional:</span>
                    <span>Lectura instantánea en tótem de salida o escáner óptico de garita.</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-800 block text-[11px] mb-0.5">Tolerancia Oficial:</span>
                    <span>15 minutos de gracia inicial sin cobro ante congestión o error.</span>
                  </div>
                </div>
              </div>

              {/* Hardware Térmico & Opciones de Emisión */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">Ancho de Bobina Térmica</span>
                    <span className="text-[11px] text-slate-500">Seleccione el estándar de la impresora conectada</span>
                  </div>
                  <select
                    value={printerPaperSize}
                    onChange={(e) => {
                      setPrinterPaperSize(e.target.value as any);
                      markDirty();
                    }}
                    className="h-9 px-3 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:border-[#E2498A] focus:outline-none cursor-pointer"
                  >
                    <option value="80mm">Bobina 80 mm (Estándar Garita USB / Auto-corte)</option>
                    <option value="58mm">Bobina 58 mm (Terminal Portátil Sunmi / Compacto)</option>
                    <option value="a4">Hoja A4 (Comprobante Estándar)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <label className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Auto-imprimir Ingreso</span>
                      <span className="text-[10px] text-slate-500">Imprime al registrar patente</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoPrintEntry}
                      onChange={(e) => {
                        setAutoPrintEntry(e.target.checked);
                        markDirty();
                      }}
                      className="w-4 h-4 accent-[#E2498A]"
                    />
                  </label>

                  <label className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Comprobante de Salida</span>
                      <span className="text-[10px] text-slate-500">Imprime al confirmar cobro</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoPrintExit}
                      onChange={(e) => {
                        setAutoPrintExit(e.target.checked);
                        markDirty();
                      }}
                      className="w-4 h-4 accent-[#E2498A]"
                    />
                  </label>

                  <label className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Alertas Sonoras (Beep)</span>
                      <span className="text-[10px] text-slate-500">Sonido de confirmación</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={audioBeepAlerts}
                      onChange={(e) => {
                        setAudioBeepAlerts(e.target.checked);
                        markDirty();
                      }}
                      className="w-4 h-4 accent-[#E2498A]"
                    />
                  </label>
                </div>

                {/* Acciones de Prueba de Impresión */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handlePrintTestTicket(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Printer className="w-4 h-4 text-[#E2498A]" />
                    <span>Imprimir Prueba Térmica ({printerPaperSize})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintTestTicket(true)}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Ticket en PDF</span>
                  </button>
                </div>
              </div>

              {/* Simulador Visual de Ticket Térmico en Vivo */}
              <div className="p-5 rounded-2xl bg-slate-100/70 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
                    Vista Previa Interactiva del Ticket ({selectedTicketTemplate.toUpperCase()} · {printerPaperSize})
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Render ESC/POS Térmico</span>
                </div>

                <div className="flex justify-center p-4 bg-slate-200/60 rounded-2xl">
                  <div
                    className={`bg-white text-slate-900 shadow-md p-5 rounded-xs font-mono text-[11px] leading-tight space-y-2 border-t-4 border-dashed border-[#E2498A] ${
                      printerPaperSize === '58mm' ? 'w-[230px]' : 'w-[310px]'
                    }`}
                  >
                    <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                      <p className="font-black text-xs">ESTACIONAMIENTO CORDANO</p>
                      <p className="text-[10px] text-slate-600">Serrano 447, Iquique</p>
                      <p className="text-[9px] text-slate-500">RUT: 76.840.123-K</p>
                      <p className="text-[9px] text-slate-500">Tel: +56 9 8765 4321</p>
                    </div>

                    <div className="space-y-1 py-1">
                      <div className="flex justify-between font-bold">
                        <span>TICKET:</span>
                        <span>#TKT-84920</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PATENTE:</span>
                        <span className="font-black text-xs text-[#E2498A]">BBCL-10</span>
                      </div>
                      <div className="flex justify-between">
                        <span>INGRESO:</span>
                        <span>15/10/2026 14:32</span>
                      </div>
                      <div className="flex justify-between">
                        <span>UBICACIÓN:</span>
                        <span className="font-bold">Sector A · Plaza 04</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TARIFA:</span>
                        <span>Automóvil ($ 40/min)</span>
                      </div>
                    </div>

                    {selectedTicketTemplate === 'detallado' && (
                      <div className="border-t border-dashed border-slate-300 pt-1 text-[9px] text-slate-600 space-y-0.5">
                        <p>• Gracia: 15 min libres de costo</p>
                        <p>• Tramo 10 min: $ 400 CLP</p>
                        <p>• Tope diario: $ 18.000 CLP</p>
                      </div>
                    )}

                    <div className="border-t border-dashed border-slate-300 pt-2 flex flex-col items-center space-y-1">
                      {/* Simulación de código de barras */}
                      <div className="tracking-[4px] font-black text-slate-800 text-sm">
                        ||| | |||| || | |||| |||
                      </div>
                      <span className="text-[8px] text-slate-400 font-mono">TKT-84920-BBCL10</span>
                    </div>

                    <div className="border-t border-dashed border-slate-300 pt-2 text-center text-[8px] text-slate-500 leading-tight">
                      {selectedTicketTemplate === 'compacto' ? (
                        <p>Conserve este ticket para su salida. Ley 20.967</p>
                      ) : (
                        <p>
                          Conserve este comprobante para su salida.<br />
                          En caso de pérdida, se liquidará según patente.<br />
                          ¡Gracias por su visita!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* 4. GESTIÓN DE USUARIOS & MATRIZ DE PERMISOS RBAC                  */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'usuarios' && (
            <div className="space-y-6 text-xs">
              {isViewerOnly && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-blue-900 shadow-xs animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">👁️</span>
                    <div>
                      <span className="font-extrabold text-xs block">
                        Modo Solo Visualización · Turno activo a cargo de {currentShift?.operatorName || 'otro operador'}
                      </span>
                      <span className="text-[11px] text-blue-700">
                        La administración y creación de usuarios está temporalmente restringida para resguardar la integridad del turno en curso.
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-300 uppercase shrink-0">
                    Solo Lectura
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Usuarios &amp; Matriz de Permisos Individuales</h4>
                  <p className="text-slate-500 text-[11px]">
                    Configure los permisos granulares y el PIN de supervisor para cada integrante del equipo.
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isViewerOnly) {
                        onShowToast(`Acción bloqueada: El turno activo está a cargo de ${currentShift?.operatorName || 'otro operador'}.`, 'error');
                        return;
                      }
                      setNewUserName('');
                      setNewUserEmail('');
                      setNewUserRole('operador');
                      setNewUserPin('1234');
                      setNewUserPermissions({ ...defaultOperatorPermissions });
                      setIsCreateUserModalOpen(true);
                    }}
                    disabled={isViewerOnly}
                    className={`px-4 py-2 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 self-start sm:self-auto transition ${
                      isViewerOnly
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-[#1E1E2F] hover:bg-[#2D2D44] text-white cursor-pointer'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crear Nuevo Usuario {isViewerOnly ? '(Bloqueado)' : ''}</span>
                  </button>
                )}
              </div>

              {/* Grid de Tarjetas de Usuarios (Cards Clicables) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {usersList.map((u) => {
                  const initials = u.name
                    ? u.name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')
                        .toUpperCase()
                    : 'U';

                  // Contar permisos activos
                  const activePermsCount = Object.values(u.permissions || {}).filter(Boolean).length;

                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUserModal({ ...u })}
                      className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-[#E2498A] shadow-xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between space-y-4 cursor-pointer text-left"
                    >
                      {/* Cabecera de Tarjeta: Avatar + Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm tracking-wider uppercase border shadow-2xs transition-transform group-hover:scale-105 ${
                              u.role === 'administrador'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : u.role === 'supervisor'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-pink-50 text-[#C83472] border-[#E2498A]/30'
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-black text-slate-900 text-sm truncate group-hover:text-[#E2498A] transition-colors">
                              {u.name}
                            </h5>
                            <p className="text-[11px] font-mono text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            u.status === 'activo'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {u.status === 'activo' ? '● ACTIVO' : '○ INACTIVO'}
                        </span>
                      </div>

                      {/* Información Intermedia: Rol & PIN */}
                      <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-500 uppercase tracking-wide">Rol en Sistema:</span>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              u.role === 'administrador'
                                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                : u.role === 'supervisor'
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : 'bg-pink-100 text-[#C83472] border border-[#E2498A]/30'
                            }`}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                            <Key className="w-3 h-3 text-[#E2498A]" /> PIN Acceso:
                          </span>
                          <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {u.pin ? '••••' : '1234'}
                          </span>
                        </div>
                      </div>

                      {/* Chips de Permisos Resumidos */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          <span>Permisos Granulares</span>
                          <span className="text-[#E2498A]">{activePermsCount} activos</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {u.permissions?.canOperatePos && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-bold">
                              POS
                            </span>
                          )}
                          {u.permissions?.canOpenCloseShift && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-bold">
                              Turnos Z
                            </span>
                          )}
                          {u.permissions?.canViewReports && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-bold">
                              Reportes
                            </span>
                          )}
                          {u.permissions?.canOverrideRates && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-bold">
                              Descuentos
                            </span>
                          )}
                          {u.permissions?.canVoidTickets && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-bold">
                              Anulaciones
                            </span>
                          )}
                          {u.permissions?.canConfigureTariffs && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-bold">
                              Tarifas
                            </span>
                          )}
                          {u.permissions?.canManageUsers && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-bold">
                              Usuarios
                            </span>
                          )}
                          {u.permissions?.canViewSecurityAudit && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-bold">
                              Auditoría
                            </span>
                          )}
                          {u.permissions?.isLiveSupervisorMode && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-bold">
                              En Vivo
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Acciones de Tarjeta */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserModal({ ...u });
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#E2498A] text-slate-700 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar Usuario</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTriggerResetEmail(u);
                          }}
                          title="Enviar enlace para restablecer clave"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#E2498A] transition cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleUserStatus(u.id);
                            }}
                            title={u.status === 'activo' ? 'Suspender usuario' : 'Activar usuario'}
                            className={`p-2 rounded-xl transition cursor-pointer ${
                              u.status === 'activo'
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* 5. HORARIOS DEL RECINTO SERRANO 447 & PERNOCTACIÓN                */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'horarios' && (
            <div className="space-y-6 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Calendario Semanal de Operación (Lunes a Domingo)</h4>
                  <p className="text-slate-500 text-[11px]">
                    Configure el horario de apertura y cierre día por día para el recinto Serrano 447.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                  Zona Horaria: America/Santiago (CLT)
                </span>
              </div>

              {/* Tabla de Horarios Día por Día */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Día de la Semana</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-center">Hora de Apertura</th>
                      <th className="py-3 px-4 text-center">Hora de Cierre</th>
                      <th className="py-3 px-4 text-center">Feriado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {weeklySchedule.map((item) => (
                      <tr key={item.day} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-bold text-slate-800 text-xs">
                          {item.label}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            disabled={!isAdmin}
                            onClick={() => handleToggleDayOpen(item.day)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition ${
                              item.isOpen
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {item.isOpen ? 'ABIERTO' : 'CERRADO'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="time"
                            disabled={!isAdmin || !item.isOpen}
                            value={item.openTime}
                            onChange={(e) => handleDayTimeChange(item.day, 'openTime', e.target.value)}
                            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-mono font-bold text-xs focus:border-[#E2498A] focus:outline-none disabled:opacity-40"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="time"
                            disabled={!isAdmin || !item.isOpen}
                            value={item.closeTime}
                            onChange={(e) => handleDayTimeChange(item.day, 'closeTime', e.target.value)}
                            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-mono font-bold text-xs focus:border-[#E2498A] focus:outline-none disabled:opacity-40"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={!!item.isHoliday}
                            onChange={() => handleToggleDayHoliday(item.day)}
                            className="w-4 h-4 accent-[#E2498A] cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reglas de Pernoctación Nocturna & Cierre del Recinto */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="font-extrabold text-slate-900 text-xs block">
                      Política de Pernoctación Nocturna (Vehículos que quedan tras el cierre)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Regula el cobro y resguardo para autos que permanecen durante la noche.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={enableOvernightParking}
                      onChange={(e) => {
                        setEnableOvernightParking(e.target.checked);
                        markDirty();
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E2498A]" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                      Tarifa Plana por Pernoctación ($ CLP por noche) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono text-sm">$</span>
                      <input
                        type="text"
                        disabled={!isAdmin || !enableOvernightParking}
                        value={overnightFlatRate === 0 ? '' : overnightFlatRate.toLocaleString('es-CL')}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '');
                          setOvernightFlatRate(clean ? parseInt(clean, 10) : 0);
                          markDirty();
                        }}
                        placeholder="15.000"
                        className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-black text-sm text-slate-800 focus:border-[#E2498A] focus:bg-white focus:outline-none disabled:opacity-40"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex flex-col justify-center">
                    <span className="font-bold text-slate-800 block mb-0.5">Protocolo Operativo al Cierre</span>
                    <span>Al cerrar el turno nocturno, los vehículos rezagados se registran en el Arqueo Ciego como &quot;En Custodia Nocturna&quot; y se transfieren al turno matutino.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* 5. TARIFARIO & REGULACIÓN LEGAL (LEY 20.967)                      */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'tarifas' && (
            <div className="space-y-6 text-xs">
              {/* Información de Contexto según Ley N° 20.967 */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-950 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚖️</span>
                  <span className="font-extrabold text-xs uppercase tracking-wide">
                    Marco Regulatorio Ley N° 20.967 (Estacionamientos &amp; Parquímetros)
                  </span>
                </div>
                <ul className="text-[11px] text-blue-900 space-y-1 list-disc pl-4 leading-relaxed">
                  <li>
                    <strong>Prohibición de Redondeo al Alza:</strong> El cobro debe ser estrictamente por minuto efectivo lineal o por tramos legales (primer tramo &ge; 30 min y siguientes &le; 10 min).
                  </li>
                  <li>
                    <strong>Prohibición de Multas por Ticket Extraviado:</strong> Está prohibido fijar sanciones o tarifas prefijadas. Ante pérdida de comprobante, se debe liquidar únicamente el tiempo efectivo acreditado según patente.
                  </li>
                  <li>
                    <strong>Exhibición Pública Obligatoria:</strong> Las tarifas deben exhibirse de forma visible en el acceso exterior del estacionamiento.
                  </li>
                </ul>
              </div>

              {/* Acciones de Exportación e Impresión Oficial */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <span className="font-bold text-slate-800 text-xs block">Documentos Oficiales Imprimibles</span>
                  <span className="text-[11px] text-slate-500">
                    Genere los carteles para exhibición al público o la ficha de control interno.
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportPublicPoster(false)}
                    className="px-3 py-2 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cartel Público para Entrada (A4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportInternalDoc(false)}
                    className="px-3 py-2 rounded-xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ficha de Uso Interno (A4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTicketVisualPreviewOpen(true)}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>👁️</span>
                    <span>Previsualizar Ticket PDF</span>
                  </button>
                </div>
              </div>

              {/* Matriz y Modalidad Legal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[11px]">
                    Modalidad Legal de Liquidación *
                  </label>
                  <select
                    value={billingModel}
                    disabled={!isAdmin}
                    onChange={(e) => {
                      setBillingModel(e.target.value as BillingModel);
                      markDirty();
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs focus:border-[#E2498A] focus:outline-none"
                  >
                    <option value="PER_MINUTE">1. Cobro por Minuto Efectivo (Lineal)</option>
                    <option value="TRANCHE_30_10">2. Cobro por Tramos Vencidos (30 min base + 10 min)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[11px]">
                    Minutos Libres de Gracia (Tolerancia) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={gracePeriod}
                      disabled={!isAdmin}
                      onChange={(e) => {
                        setGracePeriod(parseInt(e.target.value, 10) || 0);
                        markDirty();
                      }}
                      className="w-24 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-xs focus:border-[#E2498A] focus:outline-none text-right"
                    />
                    <span className="text-slate-500 font-bold">minutos ($0 CLP inicial)</span>
                  </div>
                </div>
              </div>

              {/* TABLA DE CATEGORÍAS VEHICULARES DINÁMICA (PERMITE AGREGAR, MODIFICAR Y ELIMINAR) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs space-y-0">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
                      Categorías de Vehículos &amp; Topes Máximos
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Edite tarifas por minuto, valores por tramo y el tope diario máximo de cada categoría.
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsAddCatModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white font-bold text-[11px] cursor-pointer"
                    >
                      + Añadir Categoría
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Categoría</th>
                        <th className="py-2.5 px-3 text-right">Tarifa Minuto ($ CLP)</th>
                        {billingModel === 'TRANCHE_30_10' && (
                          <th className="py-2.5 px-3 text-right">Tramo 10 min ($ CLP)</th>
                        )}
                        <th className="py-2.5 px-3 text-right">Hora Referencial</th>
                        <th className="py-2.5 px-3 text-right">Tope Máximo Diario ($ CLP)</th>
                        {isAdmin && <th className="py-2.5 px-3 text-center">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              disabled={!isAdmin}
                              value={cat.name}
                              onChange={(e) => handleCategoryFieldChange(cat.id, 'name', e.target.value)}
                              className="w-36 h-8 px-2 rounded-lg border border-slate-200 font-bold text-xs focus:border-[#E2498A] focus:outline-none disabled:bg-transparent disabled:border-none"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1 justify-end">
                              <span className="text-slate-400 font-mono">$</span>
                              <input
                                type="text"
                                disabled={!isAdmin}
                                value={cat.minuteRate === 0 ? '' : cat.minuteRate.toLocaleString('es-CL')}
                                onChange={(e) => handleCategoryFieldChange(cat.id, 'minuteRate', e.target.value)}
                                className="w-20 h-8 px-2 rounded-lg border border-slate-200 font-mono font-bold text-right text-xs focus:border-[#E2498A] focus:outline-none"
                              />
                            </div>
                          </td>
                          {billingModel === 'TRANCHE_30_10' && (
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center gap-1 justify-end">
                                <span className="text-slate-400 font-mono">$</span>
                                <input
                                  type="text"
                                  disabled={!isAdmin}
                                  value={cat.trancheRate === 0 ? '' : cat.trancheRate.toLocaleString('es-CL')}
                                  onChange={(e) => handleCategoryFieldChange(cat.id, 'trancheRate', e.target.value)}
                                  className="w-20 h-8 px-2 rounded-lg border border-slate-200 font-mono font-bold text-right text-xs focus:border-[#E2498A] focus:outline-none"
                                />
                              </div>
                            </td>
                          )}
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500 font-semibold">
                            $ {(cat.minuteRate * 60).toLocaleString('es-CL')}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1 justify-end">
                              <span className="text-slate-400 font-mono">$</span>
                              <input
                                type="text"
                                disabled={!isAdmin}
                                value={cat.maxDailyRate === 0 ? '' : cat.maxDailyRate.toLocaleString('es-CL')}
                                onChange={(e) => handleCategoryFieldChange(cat.id, 'maxDailyRate', e.target.value)}
                                className="w-24 h-8 px-2 rounded-lg border border-slate-200 font-mono font-bold text-right text-xs focus:border-[#E2498A] focus:outline-none"
                              />
                            </div>
                          </td>
                          {isAdmin && (
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition"
                                title="Eliminar categoría"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── CONVENIOS COMERCIALES & PROMOCIONES ── */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs space-y-0">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <span>🏷️</span>
                      <span>Convenios Comerciales &amp; Promociones Especiales</span>
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Configure tarifas preferentes con descuento porcentual (%) o valor plano ($ CLP) para convenios y abonados.
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewPromoName('');
                        setNewPromoDesc('');
                        setNewPromoType('percent');
                        setNewPromoValue(15);
                        setIsNewPromoModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-[11px] cursor-pointer shadow-xs self-start sm:self-auto"
                    >
                      + Añadir Convenio
                    </button>
                  )}
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {promotionsList.map((promo) => (
                    <div
                      key={promo.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#E2498A]/50 transition flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h6 className="font-bold text-slate-900 text-xs">{promo.name}</h6>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                promo.type === 'percent'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {promo.type === 'percent' ? `${promo.value}% DCTO` : `$ ${promo.value.toLocaleString('es-CL')} TARIFA PLANA`}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{promo.description}</p>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleTogglePromoActive(promo.id)}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition ${
                                promo.active
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              }`}
                            >
                              {promo.active ? 'ACTIVO' : 'PAUSADO'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePromo(promo.id)}
                              className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Eliminar convenio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── CUMPLIMIENTO TRIBUTARIO (SECCIÓN SIMPLIFICADA CON NOTA OPERATIVA DETALLADA) ── */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <span>🏛️</span>
                  <span>Cumplimiento Tributario &amp; Emisión de Boletas</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                      Modalidad Tributaria de Referencia
                    </span>
                    <select
                      value={taxDocumentType}
                      disabled={!isAdmin}
                      onChange={(e) => {
                        setTaxDocumentType(parseInt(e.target.value, 10) as TaxDocumentType);
                        markDirty();
                      }}
                      className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white font-bold text-xs focus:border-[#E2498A] focus:outline-none cursor-pointer"
                    >
                      <option value={39}>Tipo 39 - Boleta Electrónica Afecta (19% IVA)</option>
                      <option value={41}>Tipo 41 - Boleta Electrónica Exenta</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                      Razón Social Recinto Serrano 447
                    </span>
                    <div className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs flex items-center text-slate-800">
                      76.840.123-K (Estacionamientos Cordano SpA)
                    </div>
                  </div>
                </div>

                {/* NOTA OPERATIVA OBLIGATORIA (REQUERIMIENTO 10) */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Instrucción Operativa para Garita y Administración</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Esta plataforma es un sistema de gestión y control operacional interno. La emisión formal de las <strong>Boletas Electrónicas de Servicios</strong> (DTE Tipo 39 o 41) debe realizarse manualmente por el operador en el punto de cobro mediante el terminal POS bancario (tarjeta) o a través de la aplicación oficial <strong>e-Boleta del Servicio de Impuestos Internos (SII)</strong>, entregando el comprobante tributario correspondiente al cliente junto con el ticket de salida.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* 6. BASE DE DATOS & GOOGLE SHEETS (11 TABLAS CANÓNICAS)             */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'integraciones' && (
            <div className="space-y-6 animate-fade-in text-xs">
              {/* HEADER DE INTEGRACIÓN GOOGLE DRIVE / SHEETS */}
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-2xl shadow-xs shrink-0">
                    📊
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-[#1E1E2F]">
                        Ecosistema Google Sheets &amp; Respaldo de Base de Datos
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                        API v4 Conectada
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Sincronice las 11 entidades relacionales directamente con una planilla en Google Drive o descargue respaldos en CSV y JSON inmutable.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {googleSyncState.spreadsheetUrl ? (
                    <>
                      <a
                        href={googleSyncState.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono tabular-nums flex items-center gap-2 shadow-xs transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Abrir en Google Sheets</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleSyncAllToGoogleSheets}
                        disabled={googleSyncState.isSyncing}
                        className="px-3.5 h-10 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#FFF5F8] text-[#1E1E2F] text-xs font-bold font-mono tabular-nums flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <span className={googleSyncState.isSyncing ? 'animate-spin' : ''}>🔄</span>
                        <span>{googleSyncState.isSyncing ? 'Sincronizando...' : 'Actualizar Sheets'}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectGoogleSheets}
                      disabled={googleSyncState.isConnecting}
                      className="px-4 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      {googleSyncState.isConnecting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Creando Planilla (11 Hojas)...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          <span>Conectar &amp; Crear Google Sheets (11 Hojas)</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleExportCurrentTableCsv}
                    className="px-3.5 h-10 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#FFF5F8] text-[#1E1E2F] text-xs font-bold font-mono tabular-nums flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    title="Exportar la tabla seleccionada en formato CSV"
                  >
                    <Download className="w-4 h-4 text-[#E2498A]" />
                    <span>Exportar CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadFullJsonBackup}
                    className="px-3.5 h-10 rounded-xl border border-slate-700 bg-[#1E1E2F] hover:bg-[#2D2D44] text-white text-xs font-bold font-mono tabular-nums flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    title="Descargar snapshot JSON de las 11 tablas"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Respaldo JSON Completo</span>
                  </button>
                </div>
              </div>

              {/* INFO DE PERSISTENCIA Y SINCRONIZACIÓN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase font-bold block">Persistencia Cloud</span>
                    <span className="text-xs font-bold text-[#1E1E2F]">Cloud Firestore (Persistent)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase font-bold block">Persistencia Local Garita</span>
                    <span className="text-xs font-bold text-[#1E1E2F]">IndexedDB v2 (CordanoPMS_OfflineDB)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase font-bold block">Cola Outbox Offline</span>
                    <span className="text-xs font-bold text-[#1E1E2F]">{syncQueueCount} transacciones pendientes</span>
                  </div>
                </div>
              </div>

              {/* SELECTOR DE 11 TABLAS RELACIONALES */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#F8FAFC] pb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                    <span>Catálogo Canónico de Datos (11 Entidades Normalizadas):</span>
                  </span>
                  <span className="text-xs font-mono text-[#64748B]">
                    Seleccione una entidad para auditar su estructura y registros en vivo
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {(Object.entries(databaseTablesData) as [string, CanonicalTableData][]).map(([key, tbl]) => {
                    const isSelected = selectedTableKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedTableKey(key);
                          setTableSearchQuery('');
                        }}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-[#FFF5F8] border-[#E2498A] shadow-xs ring-1 ring-[#E2498A]'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-mono font-black ${isSelected ? 'text-[#E2498A]' : 'text-slate-500'}`}>
                            {tbl.sheetName}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono ${
                            isSelected ? 'bg-[#E2498A] text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {tbl.rows.length}
                          </span>
                        </div>
                        <div className={`text-xs font-bold truncate ${isSelected ? 'text-[#1E1E2F]' : 'text-slate-700'}`}>
                          {tbl.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VISOR DE TABLA SELECCIONADA CON BUSCADOR Y DATA GRID */}
              {databaseTablesData[selectedTableKey] && (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F8FAFC] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2498A] bg-[#FFF5F8] px-2 py-0.5 rounded-full font-mono">
                          HOJA: {databaseTablesData[selectedTableKey].sheetName}
                        </span>
                        <h4 className="text-base font-extrabold text-[#1E1E2F]">
                          {databaseTablesData[selectedTableKey].title}
                        </h4>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {databaseTablesData[selectedTableKey].description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={tableSearchQuery}
                          onChange={(e) => setTableSearchQuery(e.target.value)}
                          placeholder="Filtrar en tabla..."
                          className="w-48 sm:w-64 h-8 px-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-mono focus:border-[#E2498A] focus:outline-none"
                        />
                        {tableSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setTableSearchQuery('')}
                            className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-[#1E1E2F] bg-slate-100 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0]">
                        {databaseTablesData[selectedTableKey].columns.length} columnas
                      </span>
                    </div>
                  </div>

                  {/* COLUMNAS / DICCIONARIO DE DATOS */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="text-[10px] font-bold uppercase text-[#64748B] mr-1">Campos:</span>
                    {databaseTablesData[selectedTableKey].columns.map((col) => (
                      <span key={col} className="px-2 py-0.5 bg-white border border-[#E2E8F0] rounded-md text-[10px] font-mono text-slate-700">
                        {col}
                      </span>
                    ))}
                  </div>

                  {/* GRID DE DATOS */}
                  <div className="overflow-x-auto max-h-[500px] rounded-xl border border-[#E2E8F0]">
                    {(() => {
                      const currentTable = databaseTablesData[selectedTableKey];
                      const queryLower = tableSearchQuery.toLowerCase().trim();
                      const filteredRows = queryLower
                        ? currentTable.rows.filter((r) =>
                            Object.values(r).some((val) =>
                              String(val).toLowerCase().includes(queryLower)
                            )
                          )
                        : currentTable.rows;

                      if (filteredRows.length === 0) {
                        return (
                          <div className="p-8 text-center text-xs text-[#64748B] bg-[#F8FAFC]">
                            {currentTable.rows.length === 0
                              ? 'No hay registros cargados aún en esta tabla.'
                              : 'No se encontraron filas que coincidan con la búsqueda.'}
                          </div>
                        );
                      }

                      return (
                        <table className="w-full text-left border-collapse font-mono text-xs">
                          <thead className="bg-[#1E1E2F] text-white text-[10px] uppercase sticky top-0 z-10">
                            <tr>
                              <th className="p-2.5 border-b border-slate-700 w-10 text-center font-bold">#</th>
                              {currentTable.columns.map((col) => (
                                <th key={col} className="p-2.5 border-b border-slate-700 font-bold whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E2E8F0] bg-white text-slate-800">
                            {filteredRows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-[#FFF5F8]/50 transition-colors">
                                <td className="p-2.5 text-center text-[10px] font-bold text-slate-400 bg-slate-50">
                                  {rIdx + 1}
                                </td>
                                {currentTable.columns.map((col) => {
                                  const cellVal = row[col];
                                  if (typeof cellVal === 'boolean') {
                                    return (
                                      <td key={col} className="p-2.5 whitespace-nowrap">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                          cellVal ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                          {cellVal ? 'TRUE' : 'FALSE'}
                                        </span>
                                      </td>
                                    );
                                  }
                                  let displayStr = '';
                                  if (typeof cellVal === 'object' && cellVal !== null) {
                                    displayStr = JSON.stringify(cellVal);
                                  } else {
                                    displayStr = cellVal !== undefined && cellVal !== null ? String(cellVal) : '-';
                                  }

                                  const isMoney = typeof cellVal === 'number' && (col.includes('monto') || col.includes('fondo') || col.includes('precio') || col.includes('declarado') || col.includes('esperado') || col.includes('diferencia'));

                                  return (
                                    <td key={col} className="p-2.5 whitespace-nowrap">
                                      {isMoney ? (
                                        <span className="font-bold text-[#1E1E2F]">
                                          ${cellVal.toLocaleString('es-CL')}
                                        </span>
                                      ) : (
                                        <span title={displayStr} className="truncate max-w-xs block">
                                          {displayStr}
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#64748B] font-mono pt-1">
                    <span>Registros totales en memoria/almacenamiento: {databaseTablesData[selectedTableKey].rows.length}</span>
                    <span className="text-[11px]">Sincronizable con hoja '{databaseTablesData[selectedTableKey].sheetName}' de Google Sheets</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: PREVISUALIZADOR DE TICKET TÉRMICO ── */}
      {isTicketVisualPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-fade-in-up text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-extrabold text-sm text-slate-900">Previsualizador de Ticket Térmico</span>
              <button
                type="button"
                onClick={() => setIsTicketVisualPreviewOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Simulación visual de rollo térmico */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 font-mono text-[11px] space-y-2 text-center text-slate-800">
              <div className="font-black text-sm text-[#1E1E2F]">PARKING OPS</div>
              <div className="text-[10px] text-slate-500">Recinto Serrano 447, Iquique</div>
              <div className="border-b border-slate-200 my-2" />
              <div className="font-bold text-xs">TICKET DE ENTRADA</div>
              <div>Folio: TKT-20261013-0001</div>
              <div className="text-base font-black tracking-widest text-[#E2498A] my-1">ABCD-12</div>
              <div>Categoría: {categories[0]?.name || 'Automóvil'}</div>
              <div>Tarifa: $ {categories[0]?.minuteRate || 40} CLP/minuto</div>
              <div>Gracia: {gracePeriod} min libres ($0 CLP)</div>
              <div className="border-b border-slate-200 my-2" />
              <div className="text-[9px] text-slate-400">
                Conserve este comprobante. En caso de extravío se liquidará el tiempo efectivo por patente.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handlePrintTestTicket(false)}
                className="px-4 py-2 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: AÑADIR CATEGORÍA VEHICULAR ── */}
      {isAddCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in-up text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-slate-900 text-sm">Nueva Categoría Vehicular</h4>
              <button
                type="button"
                onClick={() => setIsAddCatModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre de Categoría *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ej. Furgón Escolar / Mini Bus"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarifa Minuto ($ CLP)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCatMinute}
                    onChange={(e) => setNewCatMinute(parseInt(e.target.value, 10) || 0)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tramo 10 min ($ CLP)</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={newCatTranche}
                    onChange={(e) => setNewCatTranche(parseInt(e.target.value, 10) || 0)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tope Máximo Diario ($ CLP)</label>
                <input
                  type="number"
                  min="1000"
                  required
                  value={newCatMaxDaily}
                  onChange={(e) => setNewCatMaxDaily(parseInt(e.target.value, 10) || 0)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E2498A] text-white font-bold"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR USUARIO & PERMISOS ── */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-fade-in-up text-xs max-h-[92vh] overflow-y-auto">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-100 text-[#C83472] flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Editar Ficha de Usuario</h4>
                  <p className="text-[11px] text-slate-500">
                    Modifique credenciales, rol y matriz granular de accesos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Formulario de Datos Principales */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={selectedUserModal.name}
                    onChange={(e) => setSelectedUserModal({ ...selectedUserModal, name: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:border-[#E2498A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={selectedUserModal.email}
                    onChange={(e) => setSelectedUserModal({ ...selectedUserModal, email: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono focus:border-[#E2498A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rol en Sistema</label>
                  <select
                    value={selectedUserModal.role}
                    onChange={(e) => {
                      const newRole = e.target.value as 'operador' | 'supervisor' | 'administrador';
                      setSelectedUserModal({
                        ...selectedUserModal,
                        role: newRole,
                        permissions:
                          newRole === 'administrador'
                            ? { ...defaultAdminPermissions, canManageClients: true, isLiveSupervisorMode: true }
                            : newRole === 'supervisor'
                            ? {
                                ...defaultOperatorPermissions,
                                canViewReports: true,
                                canOverrideRates: true,
                                canVoidTickets: true,
                                canViewSecurityAudit: true,
                                canManageClients: true,
                                isLiveSupervisorMode: true,
                              }
                            : { ...defaultOperatorPermissions, canManageClients: false, isLiveSupervisorMode: false },
                      });
                    }}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:border-[#E2498A] focus:outline-none"
                  >
                    <option value="operador">Operador (Cajero)</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado de Cuenta</label>
                  <select
                    value={selectedUserModal.status}
                    onChange={(e) => setSelectedUserModal({ ...selectedUserModal, status: e.target.value as any })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:border-[#E2498A] focus:outline-none"
                  >
                    <option value="activo">● Activo en Garita</option>
                    <option value="inactivo">○ Inactivo / Suspendido</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Key className="w-3 h-3 text-[#E2498A]" /> PIN Acceso (4 dígitos)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={selectedUserModal.pin || '1234'}
                    onChange={(e) => setSelectedUserModal({ ...selectedUserModal, pin: e.target.value })}
                    className="w-full h-9 px-3 text-center font-mono font-black text-sm rounded-xl border border-slate-200 bg-slate-50 focus:border-[#E2498A] focus:outline-none"
                  />
                </div>
              </div>

              {/* LISTA COMPLETA DE PERMISOS GRANULARES */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 block text-xs uppercase tracking-wide">
                    Matriz de Permisos Granulares RBAC:
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Active o revoque privilegios puntuales
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-[#E2498A]/50 transition">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Punto de Venta (POS)</span>
                      <span className="text-[9px] text-slate-500">Cobro de estadías e ingresos</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedUserModal.permissions?.canOperatePos}
                      onChange={(e) =>
                        setSelectedUserModal({
                          ...selectedUserModal,
                          permissions: { ...selectedUserModal.permissions, canOperatePos: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-[#E2498A] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-[#E2498A]/50 transition">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Abrir / Cerrar Turnos</span>
                      <span className="text-[9px] text-slate-500">Fondo inicial y Arqueo Ciego</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedUserModal.permissions?.canOpenCloseShift}
                      onChange={(e) =>
                        setSelectedUserModal({
                          ...selectedUserModal,
                          permissions: { ...selectedUserModal.permissions, canOpenCloseShift: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-[#E2498A] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-[#E2498A]/50 transition">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Reportes &amp; Reporte Z</span>
                      <span className="text-[9px] text-slate-500">Recaudación y balance</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedUserModal.permissions?.canViewReports}
                      onChange={(e) =>
                        setSelectedUserModal({
                          ...selectedUserModal,
                          permissions: { ...selectedUserModal.permissions, canViewReports: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-[#E2498A] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-[#E2498A]/50 transition">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Arqueo de Gaveta</span>
                      <span className="text-[9px] text-slate-500">Contabilizar sobres y efectivo</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedUserModal.permissions?.canAuditCash}
                      onChange={(e) =>
                        setSelectedUserModal({
                          ...selectedUserModal,
                          permissions: { ...selectedUserModal.permissions, canAuditCash: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-[#E2498A] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-[#E2498A]/50 transition">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Descuentos y Cortesías</span>
                      <span className="text-[9px] text-slate-500">Liberar cobros justificados</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedUserModal.permissions?.canOverrideRates}
                      onChange={(e) =>
                        setSelectedUserModal({
                          ...selectedUserModal,
                          permissions: { ...selectedUserModal.permissions, canOverrideRates: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-[#E2498A] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-[#E2498A]/50 transition">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Anulación de Tickets</span>
                      <span className="text-[9px] text-slate-500">Revertir estadías por error</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedUserModal.permissions?.canVoidTickets}
                      onChange={(e) =>
                        setSelectedUserModal({
                          ...selectedUserModal,
                          permissions: { ...selectedUserModal.permissions, canVoidTickets: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-[#E2498A] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-[#E2498A]/50 transition">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Configurar Tarifas</span>
                      <span className="text-[9px] text-slate-500">Modificar precios Ley 20.967</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedUserModal.permissions?.canConfigureTariffs}
                      onChange={(e) =>
                        setSelectedUserModal({
                          ...selectedUserModal,
                          permissions: { ...selectedUserModal.permissions, canConfigureTariffs: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-[#E2498A] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-[#E2498A]/50 transition">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Gestión de Personal</span>
                      <span className="text-[9px] text-slate-500">Crear usuarios y asignar roles</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedUserModal.permissions?.canManageUsers}
                      onChange={(e) =>
                        setSelectedUserModal({
                          ...selectedUserModal,
                          permissions: { ...selectedUserModal.permissions, canManageUsers: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-[#E2498A] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-[#E2498A]/50 transition">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Auditoría SHA-256</span>
                      <span className="text-[9px] text-slate-500">Bitácora de seguridad</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedUserModal.permissions?.canViewSecurityAudit}
                      onChange={(e) =>
                        setSelectedUserModal({
                          ...selectedUserModal,
                          permissions: { ...selectedUserModal.permissions, canViewSecurityAudit: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-[#E2498A] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-[#E2498A]/50 transition">
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Supervisión en Vivo</span>
                      <span className="text-[9px] text-slate-500">Modo espejo solo lectura</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!selectedUserModal.permissions?.isLiveSupervisorMode}
                      onChange={(e) =>
                        setSelectedUserModal({
                          ...selectedUserModal,
                          permissions: { ...selectedUserModal.permissions, isLiveSupervisorMode: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-[#E2498A] cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Acciones al Pie */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleTriggerResetEmail(selectedUserModal)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <Mail className="w-3.5 h-3.5 text-[#E2498A]" />
                <span>Enviar Enlace de Clave</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedUserModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsersList((prev) =>
                      prev.map((u) => (u.id === selectedUserModal.id ? selectedUserModal : u))
                    );
                    setSelectedUserModal(null);
                    markDirty();
                    onShowToast(`Ficha de ${selectedUserModal.name} actualizada correctamente.`, 'success');
                  }}
                  className="px-5 py-2 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold cursor-pointer shadow-xs transition"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREAR NUEVO USUARIO ── */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-fade-in-up text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-slate-900 text-sm">Crear Nuevo Usuario</h4>
              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newUserName.trim() || !newUserEmail.trim()) {
                  onShowToast('Complete el nombre y correo del usuario.', 'error');
                  return;
                }
                const created: SystemUser = {
                  id: `usr-${Date.now()}`,
                  name: newUserName.trim(),
                  email: newUserEmail.trim(),
                  role: newUserRole,
                  permissions: { ...newUserPermissions },
                  status: 'activo',
                };
                setUsersList((prev) => [...prev, created]);
                setIsCreateUserModalOpen(false);
                onShowToast(`Usuario ${created.name} creado exitosamente.`, 'success');
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Ej. Rodrigo Tapia"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="operador@cordano.cl"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rol Inicial</label>
                <select
                  value={newUserRole}
                  onChange={(e) => {
                    const r = e.target.value as 'operador' | 'supervisor' | 'administrador';
                    setNewUserRole(r);
                    if (r === 'administrador') {
                      setNewUserPermissions({ ...defaultAdminPermissions });
                    } else if (r === 'supervisor') {
                      setNewUserPermissions({
                        ...defaultOperatorPermissions,
                        canViewReports: true,
                        canOverrideRates: true,
                        canVoidTickets: true,
                        canViewSecurityAudit: true,
                        canManageClients: true,
                        isLiveSupervisorMode: true,
                      });
                    } else {
                      setNewUserPermissions({ ...defaultOperatorPermissions });
                    }
                  }}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="operador">Operador de Garita (Cajero)</option>
                  <option value="supervisor">Supervisor de Turno</option>
                  <option value="administrador">Administrador Total</option>
                </select>
              </div>

              {/* LISTA COMPLETA DE PERMISOS */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wide">
                  Permisos Asignados:
                </span>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <span className="font-semibold text-slate-800">Acceso a Punto de Venta (POS)</span>
                    <input
                      type="checkbox"
                      checked={newUserPermissions.canOperatePos}
                      onChange={(e) => setNewUserPermissions({ ...newUserPermissions, canOperatePos: e.target.checked })}
                      className="accent-[#E2498A]"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <span className="font-semibold text-slate-800">Iniciar &amp; Cerrar Turno</span>
                    <input
                      type="checkbox"
                      checked={newUserPermissions.canOpenCloseShift}
                      onChange={(e) => setNewUserPermissions({ ...newUserPermissions, canOpenCloseShift: e.target.checked })}
                      className="accent-[#E2498A]"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <span className="font-semibold text-slate-800">Acceso a Informes &amp; Reporte Z</span>
                    <input
                      type="checkbox"
                      checked={newUserPermissions.canViewReports}
                      onChange={(e) => setNewUserPermissions({ ...newUserPermissions, canViewReports: e.target.checked })}
                      className="accent-[#E2498A]"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <span className="font-semibold text-slate-800">Autorizar Descuentos y Cortesías</span>
                    <input
                      type="checkbox"
                      checked={newUserPermissions.canOverrideRates}
                      onChange={(e) => setNewUserPermissions({ ...newUserPermissions, canOverrideRates: e.target.checked })}
                      className="accent-[#E2498A]"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E2498A] text-white font-bold cursor-pointer"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ENLACE PARA RESTABLECER CONTRASEÑA POR CORREO ── */}
      {resetEmailModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in-up text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#E2498A]" />
                <span className="font-extrabold text-sm text-slate-900">Restablecimiento de Contraseña</span>
              </div>
              <button
                type="button"
                onClick={() => setResetEmailModalData(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Se ha generado la solicitud de restablecimiento para <strong>{resetEmailModalData.name}</strong> ({resetEmailModalData.email}).
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                Enlace Seguro Temporal (Válido 24 horas)
              </span>
              <div className="p-2 bg-white rounded-xl border border-slate-200 font-mono text-[10px] text-slate-700 break-all select-all">
                {resetEmailModalData.tokenUrl}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <a
                href={`mailto:${resetEmailModalData.email}?subject=Restablecer%20Contrasena%20-%20Parking%20Ops&body=Hola%20${encodeURIComponent(resetEmailModalData.name)},%0D%0A%0D%0AUsa%20este%20enlace%20para%20crear%20tu%20nueva%20contrase%C3%B1a:%0D%0A${encodeURIComponent(resetEmailModalData.tokenUrl)}`}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-[#E2498A]" />
                <span>Abrir en Cliente de Correo</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(resetEmailModalData.tokenUrl);
                  setIsCopiedResetUrl(true);
                  onShowToast('Enlace copiado al portapapeles.', 'success');
                }}
                className="px-4 py-2 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isCopiedResetUrl ? '¡Copiado!' : 'Copiar Enlace'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREAR NUEVO CONVENIO / PROMOCIÓN ── */}
      {isNewPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in-up text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🏷️</span>
                <span className="font-extrabold text-sm text-slate-900">Nuevo Convenio / Promoción</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPromoModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPromo} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Convenio o Promoción *</label>
                <input
                  type="text"
                  required
                  value={newPromoName}
                  onChange={(e) => setNewPromoName(e.target.value)}
                  placeholder="Ej. Convenio Gimnasio Serrano"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción / Regla de Aplicación</label>
                <input
                  type="text"
                  value={newPromoDesc}
                  onChange={(e) => setNewPromoDesc(e.target.value)}
                  placeholder="Ej. Válido para clientes con voucher timbrado"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Beneficio</label>
                  <select
                    value={newPromoType}
                    onChange={(e) => setNewPromoType(e.target.value as 'percent' | 'flat')}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="percent">Porcentaje de Descuento (%)</option>
                    <option value="flat">Tarifa Plana Fija ($ CLP)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {newPromoType === 'percent' ? 'Porcentaje (%)' : 'Monto Fijo ($ CLP)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min={newPromoType === 'percent' ? 1 : 100}
                    max={newPromoType === 'percent' ? 100 : 1000000}
                    value={newPromoValue}
                    onChange={(e) => setNewPromoValue(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-right"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPromoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold cursor-pointer shadow-xs"
                >
                  Guardar Convenio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
