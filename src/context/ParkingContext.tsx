import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, db, COLLECTIONS } from '../services/firebase';
import {
  User,
  ParkingSlot,
  Ticket,
  TariffConfig,
  Shift,
  AuditLog,
  VehicleType,
  PaymentMethod,
  SlotStatus,
  ChileanCashBreakdown,
  CashMovement,
  Customer,
  ChecklistItem,
  TariffType,
  Agreement
} from '../types';
import {
  INITIAL_OPERATOR,
  INITIAL_ADMIN,
  INITIAL_TARIFF_CONFIG,
  INITIAL_SLOTS,
  INITIAL_TICKETS,
  INITIAL_SHIFT,
  INITIAL_AUDIT_LOGS,
  INITIAL_CUSTOMERS,
  INITIAL_AGREEMENTS
} from '../data/mockData';

export const computeAgreementStatus = (validUntil: string): 'al_dia' | 'por_vencer' | 'vencido' => {
  const now = new Date();
  const until = new Date(validUntil);
  const diffMs = until.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'vencido';
  if (diffDays <= 7) return 'por_vencer';
  return 'al_dia';
};

interface StayCalculation {
  durationMinutes: number;
  subtotalAmount: number;
  totalAmount: number;
  isGracePeriod: boolean;
  nightSurcharge: number;
  weekendSurcharge: number;
}

const DEFAULT_CHECKLIST_TASKS: ChecklistItem[] = [
  { id: 'chk-1', label: 'Verificar el perímetro del recinto.', completed: false },
  { id: 'chk-2', label: 'Verificar los vehículos que están físicamente en el lugar (revisión de arrastre).', completed: false },
  { id: 'chk-3', label: 'Actualizar informaciones del sistema y estado de los vehículos.', completed: false },
  { id: 'chk-4', label: 'Revisar cámaras de seguridad.', completed: false },
  { id: 'chk-5', label: 'Verificar que el espacio de pago se encuentre limpio y ordenado para los clientes.', completed: false },
];

interface ParkingContextType {
  user: User;
  setUserRole: (role: 'operador' | 'administrador') => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  logout: () => void;
  firebaseUser: FirebaseUser | null;
  loginWithFirebase: (email: string, password: string) => Promise<User>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  slots: ParkingSlot[];
  tickets: Ticket[];
  customers: Customer[];
  currentShift: Shift;
  tariffConfig: TariffConfig;
  auditLogs: AuditLog[];
  isOffline: boolean;
  setIsOffline: React.Dispatch<React.SetStateAction<boolean>>;
  isFirebaseConnected: boolean;
  syncQueueCount: number;
  cashToleranceClp: number;
  
  // Checklist State & Actions
  checklistTasks: ChecklistItem[];
  isChecklistModalOpen: boolean;
  setIsChecklistModalOpen: (open: boolean) => void;
  toggleChecklistTask: (id: string) => void;
  completeChecklist: () => void;
  snoozeChecklist: () => void;
  checklistSnoozeRemainingSeconds: number;

  // Customer Actions
  saveCustomer: (customer: Customer) => void;
  findCustomerByPlate: (plate: string) => Customer | undefined;
  
  // Agreements (Convenios Mensuales & Convenios Comerciales)
  agreements: Agreement[];
  findAgreementByPlate: (plate: string) => Agreement | undefined;
  renewAgreement: (
    agreementId: string,
    renewalMonths: number,
    amountPaid: number,
    paymentMethod: string,
    voucherNumber: string,
    notes?: string
  ) => void;
  createAgreement: (agreementData: Omit<Agreement, 'id' | 'createdAt' | 'status'>) => Agreement;
  updateAgreement: (agreementId: string, updates: Partial<Agreement>) => void;
  deleteAgreement: (agreementId: string) => void;

  // Actions
  registerEntry: (
    paramsOrPlate:
      | {
          plateNumber: string;
          vehicleType: VehicleType;
          slotCode?: string;
          notes?: string;
          customerName?: string;
          customerPhone?: string;
          customerEmail?: string;
          tariffType?: TariffType;
        }
      | string,
    vehicleType?: VehicleType,
    slotCode?: string,
    notes?: string,
    customerData?: {
      name?: string;
      rut?: string;
      phone?: string;
      email?: string;
      agreementType?: TariffType;
    },
    tariffType?: TariffType
  ) => Ticket;
  assignSlotToTicket: (ticketId: string, slotCode: string) => void;
  calculateFee: (ticket: Ticket, customExitTime?: Date) => StayCalculation;
  processPayment: (params: {
    ticketId: string;
    paymentMethod: PaymentMethod;
    paidAmount: number;
    discountAmount?: number;
    discountReason?: string;
    isLostTicket?: boolean;
    authorizedByAdmin?: string;
    voucherNumber?: string;
    invoiceFolio?: string;
  }) => { ticket: Ticket; changeAmount: number };
  cancelTicket: (ticketId: string, reason: string, adminPass: string) => boolean;
  updateSlotStatus: (slotCode: string, newStatus: SlotStatus) => void;
  updateTariffConfig: (newConfig: TariffConfig) => void;
  registerCashMovement: (
    type: 'INGRESO_MANUAL' | 'RETIRO_SANGRIA' | 'GASTO_MENOR',
    amount: number,
    reason: string,
    supervisorPin?: string,
    requesterName?: string,
    authorizerName?: string
  ) => CashMovement;
  registerVehicleEscape: (ticketId: string, notes: string, supervisorPin: string) => boolean;
  performBlindClose: (
    declaredCash: number,
    declaredCard: number,
    declaredTransfer: number,
    justification?: string,
    breakdown?: ChileanCashBreakdown,
    supervisorPin?: string,
    handoverInfo?: { transferredVehiclesCount: number; forcedExitVehiclesCount: number },
    supervisorName?: string
  ) => Shift;
  signShiftCopy: (copyType: 'caja' | 'operador') => void;
  addAuditLog: (action: AuditLog['action'], details: string, severity?: AuditLog['severity'], authorizedBy?: string) => void;
  openNewShift: (initialCash: number, breakdown?: ChileanCashBreakdown) => void;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SLOTS: 'pms_matic_slots',
  TICKETS: 'pms_matic_tickets',
  SHIFT: 'pms_matic_shift',
  TARIFF: 'pms_matic_tariff',
  AUDIT: 'pms_matic_audit',
  CUSTOMERS: 'pms_matic_customers',
  CHECKLIST: 'pms_matic_checklist',
  AGREEMENTS: 'pms_matic_agreements',
};

export const ParkingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const savedRole = localStorage.getItem('pms_matic_user_role');
    if (savedRole === 'administrador') return INITIAL_ADMIN;
    return INITIAL_OPERATOR;
  });
  const [isLoggedIn, setIsLoggedInState] = useState<boolean>(() => {
    return localStorage.getItem('pms_matic_is_logged_in') === 'true';
  });

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setIsLoggedInState(true);
      }
    });
    return () => unsub();
  }, []);

  const loginWithFirebase = async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    setFirebaseUser(userCredential.user);
    setIsLoggedIn(true);
    return user;
  };

  const setIsLoggedIn = (loggedIn: boolean) => {
    setIsLoggedInState(loggedIn);
    localStorage.setItem('pms_matic_is_logged_in', loggedIn ? 'true' : 'false');
  };

  const logout = () => {
    setIsLoggedInState(false);
    localStorage.setItem('pms_matic_is_logged_in', 'false');
    signOut(auth).catch(() => {});
  };

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [syncQueueCount, setSyncQueueCount] = useState<number>(0);
  const cashToleranceClp = 2000; // Tolerancia estricta de $2.000 CLP según requerimiento de Bloque 6

  // Load initial state or localStorage
  const [slots, setSlots] = useState<ParkingSlot[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SLOTS);
    return saved ? JSON.parse(saved) : INITIAL_SLOTS;
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return saved ? JSON.parse(saved) : INITIAL_TICKETS;
  });

  const [currentShift, setCurrentShift] = useState<Shift>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHIFT);
    return saved ? JSON.parse(saved) : INITIAL_SHIFT;
  });

  const [tariffConfig, setTariffConfig] = useState<TariffConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TARIFF);
    return saved ? JSON.parse(saved) : INITIAL_TARIFF_CONFIG;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [agreements, setAgreements] = useState<Agreement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AGREEMENTS);
    const rawList: Agreement[] = saved ? JSON.parse(saved) : INITIAL_AGREEMENTS;
    return rawList.map((agr) => ({
      ...agr,
      status: computeAgreementStatus(agr.validUntil),
    }));
  });

  const [checklistTasks, setChecklistTasks] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CHECKLIST);
    return saved ? JSON.parse(saved) : DEFAULT_CHECKLIST_TASKS;
  });

  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState<boolean>(false);
  const [checklistSnoozeRemainingSeconds, setChecklistSnoozeRemainingSeconds] = useState<number>(0);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHIFT, JSON.stringify(currentShift));
  }, [currentShift]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TARIFF, JSON.stringify(tariffConfig));
  }, [tariffConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AGREEMENTS, JSON.stringify(agreements));
  }, [agreements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(checklistTasks));
  }, [checklistTasks]);

  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Helper para persistencia asíncrona en Firestore
  const persistToFirestore = async (collectionName: string, docId: string, data: any) => {
    try {
      const cleanData = JSON.parse(JSON.stringify(data));
      await setDoc(doc(db, collectionName, docId), cleanData, { merge: true });
      setIsFirebaseConnected(true);
    } catch (err: any) {
      setIsFirebaseConnected(false);
    }
  };

  // Listeners en tiempo real para sincronización multidispotivo (tickets, slots, convenios)
  useEffect(() => {
    let unsubTickets: (() => void) | undefined;
    let unsubSlots: (() => void) | undefined;
    let unsubAgreements: (() => void) | undefined;

    try {
      unsubTickets = onSnapshot(
        collection(db, COLLECTIONS.TICKETS),
        (snapshot) => {
          setIsFirebaseConnected(true);
          if (!snapshot.empty) {
            const remote: Ticket[] = [];
            snapshot.forEach((d) => remote.push(d.data() as Ticket));
            if (remote.length > 0) {
              remote.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
              setTickets(remote);
            }
          }
        },
        () => {
          setIsFirebaseConnected(false);
        }
      );

      unsubSlots = onSnapshot(
        collection(db, COLLECTIONS.SLOTS),
        (snapshot) => {
          if (!snapshot.empty) {
            const remote: ParkingSlot[] = [];
            snapshot.forEach((d) => remote.push(d.data() as ParkingSlot));
            if (remote.length > 0) {
              remote.sort((a, b) => a.code.localeCompare(b.code));
              setSlots(remote);
            }
          }
        },
        () => {
          setIsFirebaseConnected(false);
        }
      );

      unsubAgreements = onSnapshot(
        collection(db, COLLECTIONS.AGREEMENTS),
        (snapshot) => {
          if (!snapshot.empty) {
            const remote: Agreement[] = [];
            snapshot.forEach((d) => {
              const item = d.data() as Agreement;
              remote.push({
                ...item,
                status: computeAgreementStatus(item.validUntil),
              });
            });
            if (remote.length > 0) {
              setAgreements(remote);
            }
          }
        },
        () => {
          setIsFirebaseConnected(false);
        }
      );
    } catch {
      setIsFirebaseConnected(false);
    }

    return () => {
      unsubTickets?.();
      unsubSlots?.();
      unsubAgreements?.();
    };
  }, []);

  // Recurring 15-minute checklist snooze timer countdown
  useEffect(() => {
    if (checklistSnoozeRemainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setChecklistSnoozeRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Time to trigger popup again if checklist is not completed
          if (!currentShift.checklistCompleted) {
            setIsChecklistModalOpen(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [checklistSnoozeRemainingSeconds, currentShift.checklistCompleted]);

  const setUserRole = (role: 'operador' | 'administrador') => {
    localStorage.setItem('pms_matic_user_role', role);
    if (role === 'administrador') {
      setUser(INITIAL_ADMIN);
    } else {
      setUser(INITIAL_OPERATOR);
    }
  };

  const addAuditLog = (
    action: AuditLog['action'],
    details: string,
    severity: AuditLog['severity'] = 'info',
    authorizedBy?: string
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      action,
      details,
      severity,
      authorizedBy,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    persistToFirestore(COLLECTIONS.AUDIT_LOGS, newLog.id, newLog);

    if (isOffline) {
      setSyncQueueCount((c) => c + 1);
    }
  };

  const saveCustomer = (customer: Customer) => {
    setCustomers((prev) => {
      const existsIndex = prev.findIndex(
        (c) => c.plateNumber.toUpperCase() === customer.plateNumber.toUpperCase()
      );
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = { ...customer, plateNumber: customer.plateNumber.toUpperCase() };
        return copy;
      }
      return [{ ...customer, id: `cust-${Date.now()}`, plateNumber: customer.plateNumber.toUpperCase() }, ...prev];
    });

    addAuditLog(
      'CLIENTE_REGISTRADO',
      `Ficha de cliente guardada/actualizada para patente ${customer.plateNumber.toUpperCase()} (${customer.name})`,
      'info'
    );
  };

  const findCustomerByPlate = (plate: string): Customer | undefined => {
    const clean = plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return customers.find(
      (c) => c.plateNumber.replace(/[^A-Z0-9]/g, '').toUpperCase() === clean
    );
  };

  const findAgreementByPlate = (plate: string): Agreement | undefined => {
    const clean = plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return agreements.find(
      (a) => a.plateNumber.replace(/[^A-Z0-9]/g, '').toUpperCase() === clean
    );
  };

  const renewAgreement = (
    agreementId: string,
    renewalMonths: number,
    amountPaid: number,
    paymentMethod: string,
    voucherNumber: string,
    notes?: string
  ) => {
    const target = agreements.find((a) => a.id === agreementId);
    if (!target) return;

    // Calcular nueva fecha de vigencia
    const currentValidUntil = new Date(target.validUntil);
    const baseDate = currentValidUntil.getTime() > Date.now() ? currentValidUntil : new Date();
    baseDate.setMonth(baseDate.getMonth() + renewalMonths);
    const newValidUntil = baseDate.toISOString();
    const newStatus = computeAgreementStatus(newValidUntil);

    setAgreements((prev) =>
      prev.map((a) =>
        a.id === agreementId
          ? {
              ...a,
              validUntil: newValidUntil,
              status: newStatus,
              lastPaymentDate: new Date().toISOString(),
              lastPaymentAmount: amountPaid,
              lastPaymentMethod: paymentMethod,
              lastPaymentVoucher: voucherNumber,
              notes: notes || a.notes,
            }
          : a
      )
    );

    persistToFirestore(COLLECTIONS.AGREEMENTS, target.id, {
      ...target,
      validUntil: newValidUntil,
      status: newStatus,
      lastPaymentDate: new Date().toISOString(),
      lastPaymentAmount: amountPaid,
      lastPaymentMethod: paymentMethod,
      lastPaymentVoucher: voucherNumber,
      notes: notes || target.notes,
    });

    addAuditLog(
      'CLIENTE_REGISTRADO',
      `Suscripción de convenio renovada para patente ${target.plateNumber} (${target.companyName}) por ${renewalMonths} mes(es). Monto: $${amountPaid.toLocaleString('es-CL')} CLP vía ${paymentMethod}. Comprobante: ${voucherNumber}`,
      'info'
    );
  };

  const createAgreement = (agreementData: Omit<Agreement, 'id' | 'createdAt' | 'status'>): Agreement => {
    const newAgreement: Agreement = {
      ...agreementData,
      id: `agr-${Date.now()}`,
      plateNumber: agreementData.plateNumber.trim().toUpperCase(),
      status: computeAgreementStatus(agreementData.validUntil),
      createdAt: new Date().toISOString(),
    };

    setAgreements((prev) => [newAgreement, ...prev]);
    persistToFirestore(COLLECTIONS.AGREEMENTS, newAgreement.id, newAgreement);

    // Asociar a clientes también para persistencia unificada
    saveCustomer({
      id: `cust-${Date.now()}`,
      plateNumber: newAgreement.plateNumber,
      name: `${newAgreement.contactName} (${newAgreement.companyName})`,
      phone: newAgreement.phone,
      email: newAgreement.email,
      rut: newAgreement.rutCompany,
      agreementType: newAgreement.agreementType,
      isSpecialRate: true,
      notes: newAgreement.notes,
    });

    addAuditLog(
      'CLIENTE_REGISTRADO',
      `Nuevo vehículo incorporado a convenio/mensualidad: Patente ${newAgreement.plateNumber} a nombre de ${newAgreement.companyName}. Cuota mensual: $${newAgreement.monthlyFeeClp.toLocaleString('es-CL')} CLP`,
      'info'
    );

    return newAgreement;
  };

  const updateAgreement = (agreementId: string, updates: Partial<Agreement>) => {
    setAgreements((prev) =>
      prev.map((a) => {
        if (a.id !== agreementId) return a;
        const updated = { ...a, ...updates };
        if (updates.validUntil) {
          updated.status = computeAgreementStatus(updates.validUntil);
        }
        return updated;
      })
    );
  };

  const deleteAgreement = (agreementId: string) => {
    const target = agreements.find((a) => a.id === agreementId);
    setAgreements((prev) => prev.filter((a) => a.id !== agreementId));
    if (target) {
      addAuditLog(
        'CLIENTE_REGISTRADO',
        `Vehículo de convenio ${target.plateNumber} (${target.companyName}) eliminado del registro`,
        'warning'
      );
    }
  };

  const toggleChecklistTask = (id: string) => {
    setChecklistTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const completeChecklist = () => {
    setChecklistTasks((prev) => prev.map((t) => ({ ...t, completed: true })));
    setCurrentShift((prev) => ({
      ...prev,
      checklistCompleted: true,
      checklistCompletedAt: new Date().toISOString(),
    }));
    setIsChecklistModalOpen(false);
    setChecklistSnoozeRemainingSeconds(0);

    addAuditLog(
      'CHECKLIST_APERTURA',
      `Chequeo de apertura completado exitosamente por ${user.name}. Las 5 verificaciones de perímetro, arrastre, cámaras y POS fueron auditadas.`,
      'info'
    );
  };

  const snoozeChecklist = () => {
    // 15 minutes = 900 seconds
    setChecklistSnoozeRemainingSeconds(900);
    setIsChecklistModalOpen(false);
    setCurrentShift((prev) => ({
      ...prev,
      lastChecklistSnoozeAt: new Date().toISOString(),
      checklistSnoozeMinutes: (prev.checklistSnoozeMinutes || 0) + 15,
    }));

    addAuditLog(
      'CHECKLIST_APERTURA',
      `Chequeo de apertura pospuesto por ${user.name}. Recordatorio programado automáticamente para 15 minutos.`,
      'warning'
    );
  };

  const registerEntry = (
    paramsOrPlate:
      | {
          plateNumber: string;
          vehicleType: VehicleType;
          slotCode?: string;
          notes?: string;
          customerName?: string;
          customerPhone?: string;
          customerEmail?: string;
          tariffType?: TariffType;
        }
      | string,
    posVehicleType?: VehicleType,
    posSlotCode?: string,
    posNotes?: string,
    posCustomerData?: {
      name?: string;
      rut?: string;
      phone?: string;
      email?: string;
      agreementType?: TariffType;
    },
    posTariffType?: TariffType
  ): Ticket => {
    let plateNumber: string;
    let vehicleType: VehicleType;
    let slotCode: string;
    let notes: string | undefined;
    let customerName: string | undefined;
    let customerPhone: string | undefined;
    let customerEmail: string | undefined;
    let customerRut: string | undefined;
    let tariffType: TariffType = 'estandar';

    if (typeof paramsOrPlate === 'object') {
      plateNumber = paramsOrPlate.plateNumber;
      vehicleType = paramsOrPlate.vehicleType;
      slotCode = paramsOrPlate.slotCode || 'SIN_ASIGNAR';
      notes = paramsOrPlate.notes;
      customerName = paramsOrPlate.customerName;
      customerPhone = paramsOrPlate.customerPhone;
      customerEmail = paramsOrPlate.customerEmail;
      tariffType = paramsOrPlate.tariffType || 'estandar';
    } else {
      plateNumber = paramsOrPlate;
      vehicleType = posVehicleType || 'Automóvil';
      slotCode = posSlotCode || 'SIN_ASIGNAR';
      notes = posNotes;
      customerName = posCustomerData?.name;
      customerPhone = posCustomerData?.phone;
      customerEmail = posCustomerData?.email;
      customerRut = posCustomerData?.rut;
      tariffType = posTariffType || posCustomerData?.agreementType || 'estandar';
    }

    const formattedPlate = plateNumber.trim().toUpperCase();

    // Check anti-passback: duplicate active plate
    const existingActive = tickets.find(
      (t) => t.plateNumber === formattedPlate && t.status === 'activo'
    );
    if (existingActive) {
      throw new Error(`[Anti-Passback] La patente ${formattedPlate} ya registra una entrada activa en el ticket ${existingActive.ticketCode}`);
    }

    const nowIso = new Date().toISOString();
    const ticketCode = `T-${Math.floor(10000 + Math.random() * 90000)}`;

    const newTicket: Ticket = {
      id: `t-${Date.now()}`,
      ticketCode,
      plateNumber: formattedPlate,
      vehicleType,
      entryTime: nowIso,
      slotCode: slotCode || 'SIN_ASIGNAR',
      status: 'activo',
      notes,
      customerName,
      customerPhone,
      customerEmail,
      tariffType: tariffType === 'convenio' || tariffType === 'especial' ? 'especial' : 'estandar',
      operatorEntryName: user.name,
    };

    setTickets((prev) => [newTicket, ...prev]);
    persistToFirestore(COLLECTIONS.TICKETS, newTicket.id, newTicket);

    // Update slot status if assigned directly
    if (slotCode && slotCode !== 'SIN_ASIGNAR') {
      const slotUpdate = {
        code: slotCode,
        status: 'ocupado' as SlotStatus,
        currentTicketId: newTicket.id,
        occupiedSince: nowIso,
        plateNumber: formattedPlate,
      };
      setSlots((prev) =>
        prev.map((s) =>
          s.code === slotCode ? { ...s, ...slotUpdate } : s
        )
      );
      persistToFirestore(COLLECTIONS.SLOTS, slotCode, slotUpdate);
    }

    // Auto-save customer if provided
    if (customerName || customerPhone || customerRut) {
      saveCustomer({
        id: `cust-${Date.now()}`,
        plateNumber: formattedPlate,
        name: customerName || `Cliente ${formattedPlate}`,
        rut: customerRut,
        phone: customerPhone || '+569',
        email: customerEmail,
        agreementType: tariffType,
        isSpecialRate: tariffType !== 'estandar',
      });
    }

    addAuditLog(
      'APERTURA_PASO',
      `Ingreso registrado de patente ${formattedPlate} (${vehicleType}) en ${slotCode === 'SIN_ASIGNAR' ? 'cola sin asignar' : `slot ${slotCode}`}. Ticket: ${ticketCode}`
    );

    if (isOffline) {
      setSyncQueueCount((c) => c + 1);
    }

    return newTicket;
  };

  const assignSlotToTicket = (ticketId: string, slotCode: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error('Ticket no encontrado');

    const targetSlot = slots.find((s) => s.code === slotCode);
    if (!targetSlot) throw new Error('Espacio / Slot no encontrado');
    if (targetSlot.status !== 'disponible') {
      throw new Error(`El slot ${slotCode} se encuentra ${targetSlot.status}`);
    }

    // Update ticket
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, slotCode } : t))
    );

    // Update slot
    setSlots((prev) =>
      prev.map((s) =>
        s.code === slotCode
          ? {
              ...s,
              status: 'ocupado',
              currentTicketId: ticket.id,
              occupiedSince: ticket.entryTime,
              plateNumber: ticket.plateNumber,
            }
          : s
      )
    );

    addAuditLog(
      'ASIGNACION_SLOT',
      `Vehículo ${ticket.plateNumber} asignado exitosamente al slot ${slotCode} por ${user.name}`
    );
  };

  const calculateFee = (ticket: Ticket, customExitTime?: Date): StayCalculation => {
    const entry = new Date(ticket.entryTime);
    const exit = customExitTime || new Date();
    const diffMs = exit.getTime() - entry.getTime();
    const durationMinutes = Math.max(1, Math.ceil(diffMs / (1000 * 60)));

    // Exención total de cobro por minuto para Convenios Mensuales o Convenios Comerciales
    const hasAgreement = ticket.notes?.includes('CONVENIO') || Boolean(findAgreementByPlate(ticket.plateNumber));
    if (hasAgreement) {
      return {
        durationMinutes,
        subtotalAmount: 0,
        totalAmount: 0,
        isGracePeriod: false,
        nightSurcharge: 0,
        weekendSurcharge: 0,
      };
    }

    let rate = tariffConfig.vehicleRates[ticket.vehicleType] || tariffConfig.vehicleRates['Automóvil'];

    // Special rate discount if applicable
    if (ticket.tariffType === 'especial') {
      rate = {
        minuteRate: Math.round(rate.minuteRate * 0.8), // 20% de descuento convenio
        hourlyRate: Math.round(rate.hourlyRate * 0.8),
        maxDailyRate: Math.round(rate.maxDailyRate * 0.8),
      };
    }

    // Check grace period
    if (durationMinutes <= tariffConfig.gracePeriodMinutes) {
      return {
        durationMinutes,
        subtotalAmount: 0,
        totalAmount: 0,
        isGracePeriod: true,
        nightSurcharge: 0,
        weekendSurcharge: 0,
      };
    }

    // Billable minutes
    let rawSubtotal = durationMinutes * rate.minuteRate;

    // Apply daily cap if applicable
    const days = Math.floor(durationMinutes / (24 * 60));
    const remainingMinutes = durationMinutes % (24 * 60);
    const dailyCappedAmount = (days * rate.maxDailyRate) + Math.min(remainingMinutes * rate.minuteRate, rate.maxDailyRate);
    rawSubtotal = Math.min(rawSubtotal, dailyCappedAmount);

    // Night surcharge check (between 22:00 and 06:00)
    const exitHour = exit.getHours();
    const isNight = exitHour >= 22 || exitHour < 6;
    const nightSurcharge = isNight ? Math.round(rawSubtotal * (tariffConfig.nightSurchargePercent / 100)) : 0;

    // Weekend surcharge
    const isWeekend = exit.getDay() === 0 || exit.getDay() === 6;
    const weekendSurcharge = isWeekend ? Math.round(rawSubtotal * (tariffConfig.weekendSurchargePercent / 100)) : 0;

    // Round total to nearest $100 CLP according to Chilean cash law and parking standard
    const rawTotal = rawSubtotal + nightSurcharge + weekendSurcharge;
    const totalAmount = Math.ceil(rawTotal / 100) * 100;

    return {
      durationMinutes,
      subtotalAmount: Math.round(rawSubtotal),
      totalAmount,
      isGracePeriod: false,
      nightSurcharge,
      weekendSurcharge,
    };
  };

  const processPayment = (params: {
    ticketId: string;
    paymentMethod: PaymentMethod;
    paidAmount: number;
    discountAmount?: number;
    discountReason?: string;
    isLostTicket?: boolean;
    authorizedByAdmin?: string;
    voucherNumber?: string;
    invoiceFolio?: string;
  }) => {
    const {
      ticketId,
      paymentMethod,
      paidAmount,
      discountAmount = 0,
      discountReason,
      isLostTicket = false,
      authorizedByAdmin,
      voucherNumber,
      invoiceFolio,
    } = params;

    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) {
      throw new Error('Ticket no encontrado');
    }

    const exitIso = new Date().toISOString();
    let { durationMinutes, totalAmount: computedAmount } = calculateFee(ticket, new Date(exitIso));

    if (isLostTicket) {
      computedAmount = tariffConfig.lostTicketFee;
    }

    const finalTotal = Math.max(0, computedAmount - discountAmount);
    const changeAmount = Math.max(0, paidAmount - finalTotal);

    if (paidAmount < finalTotal) {
      throw new Error(`El monto pagado ($${paidAmount.toLocaleString('es-CL')}) es inferior al total a cobrar ($${finalTotal.toLocaleString('es-CL')})`);
    }

    const updatedTicket: Ticket = {
      ...ticket,
      exitTime: exitIso,
      durationMinutes,
      subtotalAmount: computedAmount,
      discountAmount,
      discountReason,
      isLostTicket,
      totalAmount: finalTotal,
      paidAmount,
      changeAmount,
      paymentMethod,
      voucherNumber,
      invoiceFolio,
      status: 'pagado',
      operatorExitName: user.name,
    };

    // Update state
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? updatedTicket : t)));
    persistToFirestore(COLLECTIONS.TICKETS, updatedTicket.id, updatedTicket);

    // Free slot
    if (ticket.slotCode && ticket.slotCode !== 'SIN_ASIGNAR') {
      const slotRelease = {
        code: ticket.slotCode,
        status: 'disponible' as SlotStatus,
        currentTicketId: null,
        occupiedSince: null,
        plateNumber: null,
      };
      setSlots((prev) =>
        prev.map((s) =>
          s.code === ticket.slotCode || s.currentTicketId === ticketId
            ? { ...s, ...slotRelease, currentTicketId: undefined, occupiedSince: undefined, plateNumber: undefined }
            : s
        )
      );
      persistToFirestore(COLLECTIONS.SLOTS, ticket.slotCode, slotRelease);
    }

    // Audit log
    if (discountAmount > 0) {
      addAuditLog(
        'DESCUENTO_MANUAL',
        `Descuento de $${discountAmount.toLocaleString('es-CL')} CLP aplicado al Ticket ${ticket.ticketCode} (${ticket.plateNumber}). Motivo: ${discountReason || 'Convenio'}`,
        'warning',
        authorizedByAdmin || user.name
      );
    }

    if (isLostTicket) {
      addAuditLog(
        'SOBREESCRITURA_SALIDA',
        `Cobro de Ticket Perdido ($${tariffConfig.lostTicketFee.toLocaleString('es-CL')} CLP) aplicado a patente ${ticket.plateNumber}`,
        'warning',
        authorizedByAdmin || user.name
      );
    }

    addAuditLog(
      'APERTURA_PASO',
      `Cobro procesado exitosamente: Ticket ${ticket.ticketCode} ($${finalTotal.toLocaleString('es-CL')} CLP - ${paymentMethod}${voucherNumber ? ` Voucher ${voucherNumber}` : ''}). Slot ${ticket.slotCode} liberado.`
    );

    if (isOffline) {
      setSyncQueueCount((c) => c + 1);
    }

    return { ticket: updatedTicket, changeAmount };
  };

  const cancelTicket = (ticketId: string, reason: string, adminPass: string): boolean => {
    if (adminPass !== 'admin123' && adminPass !== '1234' && adminPass !== '2026') {
      throw new Error('Clave de administrador incorrecta para anulación');
    }

    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return false;

    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'anulado', notes: `Anulado: ${reason}` } : t))
    );

    // Free slot if occupied by this ticket
    setSlots((prev) =>
      prev.map((s) =>
        s.currentTicketId === ticketId
          ? { ...s, status: 'disponible', currentTicketId: undefined, occupiedSince: undefined, plateNumber: undefined }
          : s
      )
    );

    addAuditLog(
      'ANULACION_TICKET',
      `Ticket ${ticket.ticketCode} (${ticket.plateNumber}) ANULADO. Motivo: ${reason}`,
      'critical',
      'María González (Supervisor)'
    );

    return true;
  };

  const updateSlotStatus = (slotCode: string, newStatus: SlotStatus) => {
    setSlots((prev) =>
      prev.map((s) => (s.code === slotCode ? { ...s, status: newStatus } : s))
    );
  };

  const updateTariffConfig = (newConfig: TariffConfig) => {
    setTariffConfig(newConfig);
    addAuditLog(
      'CAMBIO_TARIFA',
      `Configuración de tarifas modificada por ${user.name}. Período de gracia: ${newConfig.gracePeriodMinutes}m, Multa ticket perdido: $${newConfig.lostTicketFee.toLocaleString('es-CL')}`,
      'warning'
    );
  };

  const registerCashMovement = (
    type: 'INGRESO_MANUAL' | 'RETIRO_SANGRIA' | 'GASTO_MENOR',
    amount: number,
    reason: string,
    supervisorPin?: string,
    requesterName?: string,
    authorizerName?: string
  ): CashMovement => {
    if (amount <= 0) {
      throw new Error('El monto del movimiento debe ser superior a $0 CLP');
    }

    const newMovement: CashMovement = {
      id: `mov-${Date.now()}`,
      shiftId: currentShift.id,
      timestamp: new Date().toISOString(),
      type,
      amount,
      reason,
      operatorId: user.id,
      operatorName: user.name,
      requesterName: requesterName || user.name,
      authorizerName: authorizerName || (supervisorPin ? 'Supervisor' : undefined),
      authorizedBySupervisor: supervisorPin ? `Supervisor (PIN ${supervisorPin})` : undefined,
      supervisorTotpPin: supervisorPin,
      voucherFolio: `VOUCHER-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    setCurrentShift((prev) => ({
      ...prev,
      cashMovements: [...(prev.cashMovements || []), newMovement],
    }));

    const typeLabel =
      type === 'INGRESO_MANUAL' ? 'INGRESO' : type === 'GASTO_MENOR' ? 'GASTO MENOR' : 'SANGRÍA/RETIRO';

    addAuditLog(
      type === 'INGRESO_MANUAL' ? 'MOVIMIENTO_CAJA_INGRESO' : 'MOVIMIENTO_CAJA_RETIRO',
      `Movimiento manual [${typeLabel}] por $${amount.toLocaleString('es-CL')} CLP. Solicitó: ${requesterName || user.name}. Motivo: ${reason}`,
      type === 'RETIRO_SANGRIA' || type === 'GASTO_MENOR' ? 'warning' : 'info',
      authorizerName || (supervisorPin ? 'Supervisor' : user.name)
    );

    persistToFirestore(COLLECTIONS.CASH_MOVEMENTS, newMovement.id, newMovement);

    return newMovement;
  };

  const registerVehicleEscape = (ticketId: string, notes: string, supervisorPin: string): boolean => {
    if (supervisorPin !== 'admin123' && supervisorPin !== '1234' && supervisorPin !== '2026') {
      throw new Error('PIN de supervisor incorrecto para registrar fuga');
    }

    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return false;

    const exitIso = new Date().toISOString();
    const stay = calculateFee(ticket, new Date(exitIso));

    const updatedTicket: Ticket = {
      ...ticket,
      exitTime: exitIso,
      durationMinutes: stay.durationMinutes,
      status: 'anulado',
      notes: `[FUGA REGISTRADA]: ${notes || 'Salida sin pago forzada'}. Monto no percibido: $${stay.totalAmount.toLocaleString('es-CL')} CLP`,
      operatorExitName: user.name,
    };

    setTickets((prev) => prev.map((t) => (t.id === ticketId ? updatedTicket : t)));
    persistToFirestore(COLLECTIONS.TICKETS, updatedTicket.id, updatedTicket);

    // Free slot if occupied by this ticket
    if (ticket.slotCode && ticket.slotCode !== 'SIN_ASIGNAR') {
      const slotRelease = {
        code: ticket.slotCode,
        status: 'disponible' as SlotStatus,
        currentTicketId: null,
        occupiedSince: null,
        plateNumber: null,
      };
      setSlots((prev) =>
        prev.map((s) =>
          s.code === ticket.slotCode || s.currentTicketId === ticketId
            ? { ...s, ...slotRelease, currentTicketId: undefined, occupiedSince: undefined, plateNumber: undefined }
            : s
        )
      );
      persistToFirestore(COLLECTIONS.SLOTS, ticket.slotCode, slotRelease);
    }

    addAuditLog(
      'SOBREESCRITURA_SALIDA',
      `ALERTA CRÍTICA: Fuga de vehículo reportada para patente ${ticket.plateNumber} (Slot ${ticket.slotCode}). Monto no recaudado: $${stay.totalAmount.toLocaleString('es-CL')} CLP. Observación: ${notes}`,
      'critical',
      `Supervisor (PIN ${supervisorPin})`
    );

    return true;
  };

  const performBlindClose = (
    declaredCash: number,
    declaredCard: number,
    declaredTransfer: number,
    justification?: string,
    breakdown?: ChileanCashBreakdown,
    supervisorPin?: string,
    handoverInfo?: { transferredVehiclesCount: number; forcedExitVehiclesCount: number },
    supervisorName?: string
  ): Shift => {
    // Calculate expected totals from paid tickets in current shift
    const paidTickets = tickets.filter((t) => t.status === 'pagado');
    const cashTickets = paidTickets
      .filter((t) => t.paymentMethod === 'efectivo')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    // Sum manual cash movements
    const movements = currentShift.cashMovements || [];
    const manualIngresos = movements
      .filter((m) => m.type === 'INGRESO_MANUAL')
      .reduce((sum, m) => sum + m.amount, 0);
    const manualSangrias = movements
      .filter((m) => m.type === 'RETIRO_SANGRIA' || m.type === 'GASTO_MENOR')
      .reduce((sum, m) => sum + m.amount, 0);

    const expectedCash = (currentShift.initialCash || 0) + cashTickets + manualIngresos - manualSangrias;

    const expectedCard = paidTickets
      .filter((t) => t.paymentMethod === 'tarjeta_debito' || t.paymentMethod === 'tarjeta_credito')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    const expectedTransfer = paidTickets
      .filter((t) => t.paymentMethod === 'transferencia')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    const discrepancyCash = declaredCash - expectedCash;
    const totalDeclared = declaredCash + declaredCard + declaredTransfer;
    const totalExpected = expectedCash + expectedCard + expectedTransfer;
    const discrepancyTotal = totalDeclared - totalExpected;
    const isDiscrepancyFlagged = Math.abs(discrepancyCash) > cashToleranceClp;

    const auditHash = `CPMS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const closedShift: Shift = {
      ...currentShift,
      endTime: new Date().toISOString(),
      declaredCash,
      declaredCard,
      declaredTransfer,
      declaredCashBreakdown: breakdown,
      expectedCash,
      expectedCard,
      expectedTransfer,
      discrepancyCash,
      discrepancyTotal,
      isDiscrepancyFlagged,
      closeJustification: justification,
      authorizedBySupervisorPin: supervisorPin,
      supervisorName: supervisorName || (supervisorPin ? 'Supervisor Autorizante' : undefined),
      transferredVehiclesCount: handoverInfo?.transferredVehiclesCount ?? 0,
      forcedExitVehiclesCount: handoverInfo?.forcedExitVehiclesCount ?? 0,
      status: 'cerrado',
      totalTicketsProcessed: paidTickets.length,
      signedCopy1Caja: true,
      signedCopy2Operador: false,
      offlineSyncStatus: isOffline ? 'pending_sync' : 'synced',
      hashAuditoria: auditHash,
    };

    setCurrentShift(closedShift);

    // Persist in local storage history array
    try {
      const historyRaw = localStorage.getItem('pms_matic_shift_history');
      const historyList: Shift[] = historyRaw ? JSON.parse(historyRaw) : [];
      const updatedHistory = [closedShift, ...historyList.filter((s) => s.id !== closedShift.id)];
      localStorage.setItem('pms_matic_shift_history', JSON.stringify(updatedHistory));

      if (isOffline) {
        const offlineRaw = localStorage.getItem('pms_matic_offline_shifts');
        const offlineList = offlineRaw ? JSON.parse(offlineRaw) : [];
        offlineList.push(closedShift);
        localStorage.setItem('pms_matic_offline_shifts', JSON.stringify(offlineList));
      }
    } catch (e) {
      console.error('Error saving shift history:', e);
    }

    persistToFirestore(COLLECTIONS.SHIFTS, closedShift.id, closedShift);

    addAuditLog(
      'CIERRE_CAJA_CIEGO',
      `Cierre de caja ciego procesado por ${user.name}. Declarado: $${totalDeclared.toLocaleString('es-CL')} | Esperado: $${totalExpected.toLocaleString('es-CL')} (Diferencia: $${discrepancyTotal.toLocaleString('es-CL')} CLP)${isDiscrepancyFlagged ? ' [DESCUADRADO > $2.000 CLP]' : ''}${justification ? ` - Justificación: ${justification}` : ''}`,
      isDiscrepancyFlagged ? 'critical' : discrepancyTotal !== 0 ? 'warning' : 'info',
      supervisorPin ? `Supervisor (${supervisorName || 'PIN Verificado'})` : undefined
    );

    return closedShift;
  };

  const signShiftCopy = (copyType: 'caja' | 'operador') => {
    setCurrentShift((prev) => {
      const updated: Shift = {
        ...prev,
        signedCopy1Caja: copyType === 'caja' ? true : prev.signedCopy1Caja,
        signedCopy2Operador: copyType === 'operador' ? true : prev.signedCopy2Operador,
      };
      persistToFirestore(COLLECTIONS.SHIFTS, updated.id, updated);
      return updated;
    });

    addAuditLog(
      'CIERRE_CAJA_CIEGO',
      `Acta de entrega de turno firmada digitalmente: ${copyType === 'caja' ? 'Copia 1 (Caja Recinto)' : 'Copia 2 (Respaldo Operador)'} por ${user.name}`,
      'info'
    );
  };

  const openNewShift = (initialCash: number, breakdown?: ChileanCashBreakdown) => {
    const newShift: Shift = {
      id: `SHIFT-${Math.floor(1000 + Math.random() * 9000)}`,
      operatorId: user.id,
      operatorName: user.name,
      startTime: new Date().toISOString(),
      initialCash,
      initialCashBreakdown: breakdown,
      cashMovements: [],
      status: 'abierto',
      totalTicketsProcessed: 0,
      signedCopy1Caja: false,
      signedCopy2Operador: false,
      isDiscrepancyFlagged: false,
      offlineSyncStatus: isOffline ? 'pending_sync' : 'synced',
    };

    setCurrentShift(newShift);
    persistToFirestore(COLLECTIONS.SHIFTS, newShift.id, newShift);

    addAuditLog(
      'APERTURA_TURNO',
      `Nuevo turno iniciado (${newShift.id}) por ${user.name} con fondo inicial de $${initialCash.toLocaleString('es-CL')} CLP`
    );
  };

  return (
    <ParkingContext.Provider
      value={{
        user,
        setUserRole,
        isLoggedIn,
        setIsLoggedIn,
        logout,
        firebaseUser,
        loginWithFirebase,
        activeTab,
        setActiveTab,
        slots,
        tickets,
        customers,
        currentShift,
        tariffConfig,
        auditLogs,
        isOffline,
        setIsOffline,
        isFirebaseConnected,
        syncQueueCount,
        cashToleranceClp,
        checklistTasks,
        isChecklistModalOpen,
        setIsChecklistModalOpen,
        toggleChecklistTask,
        completeChecklist,
        snoozeChecklist,
        checklistSnoozeRemainingSeconds,
        saveCustomer,
        findCustomerByPlate,
        agreements,
        findAgreementByPlate,
        renewAgreement,
        createAgreement,
        updateAgreement,
        deleteAgreement,
        registerEntry,
        assignSlotToTicket,
        calculateFee,
        processPayment,
        cancelTicket,
        updateSlotStatus,
        updateTariffConfig,
        registerCashMovement,
        registerVehicleEscape,
        performBlindClose,
        addAuditLog,
        openNewShift,
        signShiftCopy,
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
};

export const useParking = () => {
  const context = useContext(ParkingContext);
  if (!context) {
    throw new Error('useParking must be used within a ParkingProvider');
  }
  return context;
};
