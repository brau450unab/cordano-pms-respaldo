import React, { useState, useEffect, useMemo } from 'react';
import { AppScreen } from '../../types';
import { useParking } from '../../context/ParkingContext';
import {
  Clock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Send,
  Calendar,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  Car,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  Building2,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Activity,
} from 'lucide-react';

interface MenuViewProps {
  occupiedCount: number;
  totalSlots: number;
  shiftRevenue: number;
  initialCash: number;
  activeAgreementsCount: number;
  totalAgreementsCount: number;
  onNavigate: (screen: AppScreen) => void;
  onOpenPosInSubtab: (subtab: 'entry' | 'exit' | 'history') => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onInitiateOpenShift?: () => void;
}

const CHECKLIST_ITEMS = [
  {
    title: '1. Verificar perímetro y accesos',
    desc: 'Portón operativo en Serrano 447, cerco libre de daños y señalética visible.',
  },
  {
    title: '2. Verificar cámaras de seguridad',
    desc: 'Transmisión activa de los canales CCTV NVR y cámara de acceso de garita.',
  },
  {
    title: '3. Revisar instalaciones físicas',
    desc: 'Alumbrado de garita y extintor con manómetro al día.',
  },
  {
    title: '4. Limpiar sector de clientes',
    desc: 'Zona de pago y calzada despejada de obstáculos.',
  },
  {
    title: '5. Conciliación en patio (30 cupos)',
    desc: 'Contraste visual físico Sector A (01–15) y Sector B (16–30) contra sistema.',
  },
  {
    title: '6. Fondo de caja y bobina 80mm',
    desc: 'Confirmar $50.000 de sencillo para vuelto y papel térmico de repuesto.',
  },
];

interface ShiftComment {
  id: string;
  time: string;
  author: string;
  role: 'operador' | 'supervisor' | 'administrador';
  text: string;
  reply?: {
    author: string;
    time: string;
    text: string;
  };
}

export const MenuView: React.FC<MenuViewProps> = ({
  occupiedCount,
  totalSlots: _unusedTotalSlots,
  shiftRevenue,
  initialCash: _unusedInitialCash,
  activeAgreementsCount,
  totalAgreementsCount,
  onNavigate,
  onOpenPosInSubtab,
  onShowToast,
  onInitiateOpenShift,
}) => {
  const { user, currentShift, isShiftOpen, isShiftOwner, isViewerOnly, tickets, slots } = useParking();

  // Regla de Dominio Canónica: Capacidad oficial Serrano 447 es de 30 cupos
  const TOTAL_FACILITY_SLOTS = 30;

  // 1. Reloj en Vivo del Sistema
  const [currentTime, setCurrentTime] = useState<string>(() =>
    new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Checklist: inicializa en false para cada nuevo turno
  const shiftIdKey = currentShift?.id || 'turno_activo';
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    return new Array(CHECKLIST_ITEMS.length).fill(false);
  });

  const [isChecklistCompleted, setIsChecklistCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`pms_checklist_completed_${shiftIdKey}`) === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      const isDone = localStorage.getItem(`pms_checklist_completed_${shiftIdKey}`) === 'true';
      setIsChecklistCompleted(isDone);
      if (!isDone) {
        setChecklist(new Array(CHECKLIST_ITEMS.length).fill(false));
      }
    } catch (e) {
      setIsChecklistCompleted(false);
    }
  }, [shiftIdKey]);

  const toggleChecklistItem = (index: number) => {
    setChecklist((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const markAll = (status: boolean) => {
    setChecklist(new Array(CHECKLIST_ITEMS.length).fill(status));
  };

  const checkedCount = checklist.filter(Boolean).length;
  const isAllChecked = checkedCount === CHECKLIST_ITEMS.length;
  const checklistPercent = Math.round((checkedCount / CHECKLIST_ITEMS.length) * 100);
  const occupancyPercent = Math.round((occupiedCount / TOTAL_FACILITY_SLOTS) * 100);
  const freeCount = Math.max(0, TOTAL_FACILITY_SLOTS - occupiedCount);

  // 3. Comentarios del Turno (Bitácora)
  const [comments, setComments] = useState<ShiftComment[]>(() => {
    try {
      const saved = localStorage.getItem(`pms_shift_comments_${shiftIdKey}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'comm-1',
        time: '08:15 hrs',
        author: currentShift?.operatorName || 'Cajero Garita',
        role: 'operador',
        text: 'Apertura de turno realizada con fondo de $ 50.000 CLP. Portón y barrera LPR operativos en Serrano 447.',
        reply: {
          author: 'Braulio Cordano (Supervisor)',
          time: '08:35 hrs',
          text: 'Conforme. Se recuerda mantener atención a las salidas en hora punta y registrar patentes con exactitud.',
        },
      },
    ];
  });

  const [newCommentInput, setNewCommentInput] = useState('');

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentInput.trim()) return;

    const newComm: ShiftComment = {
      id: `comm-${Date.now()}`,
      time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) + ' hrs',
      author: user?.name || 'Cajero Garita',
      role: (user?.role as any) || 'operador',
      text: newCommentInput.trim(),
    };

    const updated = [...comments, newComm];
    setComments(updated);
    setNewCommentInput('');
    try {
      localStorage.setItem(`pms_shift_comments_${shiftIdKey}`, JSON.stringify(updated));
    } catch (e) {}
    onShowToast('Comentario del turno publicado.', 'success');
  };

  const handleFinalizeChecklist = () => {
    setIsChecklistCompleted(true);
    try {
      localStorage.setItem(`pms_checklist_completed_${shiftIdKey}`, 'true');
    } catch (e) {}
    onShowToast('¡Checklist de calidad completado con éxito! Bitácora de comentarios del turno habilitada.', 'success');
  };

  // 4. Cálculos para los 4 indicadores superiores
  const getShiftDurationStr = (): string => {
    if (currentShift?.status !== 'abierto' || !currentShift?.startTime) {
      return 'Sin turno activo';
    }
    const start = new Date(currentShift.startTime).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - start);
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${String(diffHours).padStart(2, '0')}h ${String(diffMins).padStart(2, '0')}m`;
  };

  // Tickets activos en patio
  const activeTickets = useMemo(() => {
    return (tickets || []).filter((t) => t.status === 'activo');
  }, [tickets]);

  // Transacciones liquidadas durante el turno actual
  const shiftPaidTickets = useMemo(() => {
    return (tickets || []).filter((t) => {
      if (t.status !== 'pagado') return false;
      if (!currentShift?.startTime) return true;
      const paymentDate = new Date(t.exitTime || t.entryTime).getTime();
      const shiftStartDate = new Date(currentShift.startTime).getTime();
      return paymentDate >= shiftStartDate;
    });
  }, [tickets, currentShift]);

  // Desglose de ingresos operacionales del turno en curso (Sin exponer saldo total de gaveta por Arqueo Ciego)
  const shiftCashIncome = useMemo(() => {
    return shiftPaidTickets
      .filter((t) => t.paymentMethod === 'efectivo')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  }, [shiftPaidTickets]);

  const shiftCardIncome = useMemo(() => {
    return shiftPaidTickets
      .filter((t) => t.paymentMethod && t.paymentMethod !== 'efectivo')
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  }, [shiftPaidTickets]);

  const totalShiftOperationalRevenue = shiftCashIncome + shiftCardIncome;

  // Total entradas y salidas de hoy
  const todayPrefix = new Date().toISOString().slice(0, 10);
  const entriesTodayCount = useMemo(() => {
    return (tickets || []).filter((t) => t.entryTime?.startsWith(todayPrefix)).length;
  }, [tickets, todayPrefix]);

  const exitsTodayCount = useMemo(() => {
    return (tickets || []).filter((t) => t.exitTime?.startsWith(todayPrefix)).length;
  }, [tickets, todayPrefix]);

  // Horario con más vehículos (Rango horario punta)
  const getPeakHours = (): string => {
    if (!tickets || tickets.length === 0) return '12:00 — 14:00 hrs';
    const hourCounts: Record<number, number> = {};
    tickets.forEach((t) => {
      const d = new Date(t.entryTime);
      const h = d.getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });

    let topHour = 13;
    let maxC = 0;
    Object.entries(hourCounts).forEach(([hStr, count]) => {
      const h = parseInt(hStr, 10);
      if (count > maxC) {
        maxC = count;
        topHour = h;
      }
    });

    const startH = Math.max(8, topHour - 1);
    const endH = Math.min(22, topHour + 1);
    return `${String(startH).padStart(2, '0')}:00 — ${String(endH).padStart(2, '0')}:00 hrs`;
  };

  // Ventas centralizadas del día de hoy
  const salesToday = useMemo(() => {
    return (tickets || [])
      .filter((t) => t.status === 'pagado' && (t.exitTime?.startsWith(todayPrefix) || t.entryTime?.startsWith(todayPrefix)))
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  }, [tickets, todayPrefix]);

  const paidTicketsTodayCount = useMemo(() => {
    return (tickets || []).filter(
      (t) => t.status === 'pagado' && (t.exitTime?.startsWith(todayPrefix) || t.entryTime?.startsWith(todayPrefix))
    ).length;
  }, [tickets, todayPrefix]);

  const isOperator = user?.role === 'operador';

  return (
    <div id="view-menu" className="p-3 sm:p-6 lg:p-8 2xl:px-12 w-full max-w-[1850px] mx-auto space-y-5 sm:space-y-6 text-[#1E1E2F] animate-fade-in-up pb-20 md:pb-8 font-sans">
      
      {/* ── BARRA SUPERIOR DE BIENVENIDA Y ESTADO DEL TURNO ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#1E1E2F] text-white border border-[#2D2D44] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#E2498A] flex items-center justify-center text-white font-black text-base shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                {user?.name || 'Cajero Garita'}
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono ${
                user?.role === 'administrador' ? 'bg-[#E2498A] text-white' : user?.role === 'supervisor' ? 'bg-purple-600 text-white' : 'bg-[#2D2D44] text-pink-300'
              }`}>
                {user?.role || 'operador'}
              </span>
            </div>
            <span className="text-xs text-pink-300 font-mono font-semibold">
              Recinto Físico: Serrano 447, Iquique · Capacidad Oficial: 30 Plazas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {currentShift?.status === 'abierto' ? (
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-black bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                TURNO ACTIVO · {getShiftDurationStr()}
              </span>
              <button
                type="button"
                onClick={() => onNavigate('operacion_cierre')}
                className="hidden sm:flex px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer items-center gap-1.5"
                title="Proceder al Arqueo Ciego de Turno"
              >
                <span>🔒</span>
                <span>Cerrar Turno</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1.5 rounded-full text-xs font-mono font-black bg-amber-950 text-amber-300 border border-amber-800">
                🔒 TURNO CERRADO
              </span>
              <button
                type="button"
                onClick={() => onInitiateOpenShift && onInitiateOpenShift()}
                className="hidden sm:flex px-4 py-1.5 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer items-center gap-1.5"
                title="Iniciar turno formalmente en Garita"
              >
                <span>🚀</span>
                <span>Iniciar Turno</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 4 KPI BANNER CARDS SUPERIORES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Control de Turno */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-[#E2498A]/50 transition-all flex flex-col justify-between space-y-2.5">
          <div className="text-xs font-bold uppercase text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#E2498A]" />
              <span>Control de Turno</span>
            </span>
            <span className={`w-2 h-2 rounded-full ${currentShift?.status === 'abierto' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm font-extrabold text-[#1E1E2F] truncate">
                {currentShift?.status === 'abierto'
                  ? (currentShift?.operatorName || user?.name || 'Cajero en Turno')
                  : (currentShift?.operatorName ? `Último: ${currentShift.operatorName}` : 'Sin turnos previos')}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-[#E2498A] font-mono tabular-nums">
                {currentShift?.status === 'abierto' ? getShiftDurationStr() : 'Cerrado'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                • {currentTime}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">
              {currentShift?.status === 'abierto' ? 'Checklist:' : 'Estado:'}
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full ${
                currentShift?.status === 'abierto'
                  ? isChecklistCompleted
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {currentShift?.status === 'abierto'
                ? isChecklistCompleted
                  ? '✓ Completado'
                  : `⚠ ${checkedCount}/${checklist.length} Verificado`
                : 'Turno no iniciado'}
            </span>
          </div>
        </div>

        {/* KPI 2: Ocupación Actual (/ 30 Plazas) */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-[#E2498A]/50 transition-all flex flex-col justify-between space-y-2.5">
          <div className="text-xs font-bold uppercase text-slate-500 flex items-center justify-between">
            <span>Ocupación Actual</span>
            <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
          </div>

          <div>
            <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className="text-3xl font-extrabold tracking-tight text-[#1E1E2F]">
                {occupiedCount}
              </span>
              <span className="text-sm font-bold text-slate-400">/ 30 Plazas</span>
            </div>

            <div className="mt-2 w-full h-2 bg-[#F8FAFC] rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-[#E2498A] rounded-full transition-all duration-500"
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>{occupancyPercent}% ocupado</span>
            <span className="text-emerald-600 font-bold">{freeCount} disponibles</span>
          </div>
        </div>

        {/* KPI 3: Ventas del Día */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-2.5">
          <div className="text-xs font-bold uppercase text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ventas del Día</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-black tracking-tight text-emerald-700 font-mono tabular-nums">
              $ {salesToday.toLocaleString('es-CL')}
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              Recaudación centralizada de hoy en garita
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono tabular-nums">
            <span className="text-slate-500 font-sans">Cobros procesados:</span>
            <span className="font-bold text-slate-800">{paidTicketsTodayCount} tickets</span>
          </div>
        </div>

        {/* KPI 4: Horario Punta de Afluencia */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-purple-500/50 transition-all flex flex-col justify-between space-y-2.5">
          <div className="text-xs font-bold uppercase text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span>Horario Punta Detectado</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-purple-500" />
          </div>

          <div className="space-y-1">
            <div className="text-xl font-black tracking-tight text-purple-900 font-mono">
              {getPeakHours()}
            </div>
            <p className="text-[11px] text-slate-500">Rango con mayor afluencia de vehículos</p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-purple-700 font-bold">Patio Serrano 447</span>
            <span className="text-slate-400 font-mono">Flujo crítico hoy</span>
          </div>
        </div>
      </div>

      {/* ── ACCESOS A LA PLATAFORMA PARA MÓVIL (COMPLEMENTARIOS SIN REDUNDANCIA) ── */}
      <div className="block md:hidden space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-extrabold text-[#1E1E2F] flex items-center gap-2">
            <span>Accesos a la Plataforma</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Serrano 447</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* 1. Convenios & Flotas Corporativas */}
          <div
            onClick={() => onNavigate('clients')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-[#E2498A] shadow-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#E2498A] flex items-center justify-center font-bold text-lg shrink-0">
                🏢
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-[#1E1E2F]">Convenios &amp; Clientes Mensuales</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {activeAgreementsCount} activos · Tarifa plana mensual
                </p>
              </div>
            </div>
            <span className="text-slate-400 font-bold text-sm">→</span>
          </div>

          {/* 2. Ajustes & Mi Perfil */}
          <div
            onClick={() => onNavigate('settings')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-purple-500 shadow-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-lg shrink-0">
                ⚙️
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-[#1E1E2F]">
                  {user?.role === 'administrador' || user?.role === 'supervisor' ? 'Ajustes Globales del Sistema' : 'Mi Perfil & Preferencias'}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {user?.role === 'administrador' || user?.role === 'supervisor' ? 'Tarifas Ley 20.967, atajos y configuración' : 'Tema visual, contraseña y accesibilidad'}
                </p>
              </div>
            </div>
            <span className="text-slate-400 font-bold text-sm">→</span>
          </div>

          {/* 3. Centro de Ayuda & SOPs */}
          <div
            onClick={() => onNavigate('support')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-[#E2498A] shadow-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
                📘
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-[#1E1E2F]">Centro de Ayuda &amp; SOPs Garita</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Manual de contingencias y procedimientos
                </p>
              </div>
            </div>
            <span className="text-slate-400 font-bold text-sm">→</span>
          </div>
        </div>
      </div>



      {/* ── 2 COLUMNAS: GARITA POS & MÓDULOS (IZQ) + CHECKLIST / COMENTARIOS (DER) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA: HERO POS & ACCESOS RÁPIDOS */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* HERO POS CARD & ACCESOS RÁPIDOS */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#1E1E2F] border border-[#2D2D44] text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-[#CBD5E1] font-mono">
                  {occupiedCount} Ocupadas · {freeCount} Libres · Serrano 447 (30 Plazas)
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  currentShift?.status === 'abierto'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {currentShift?.status === 'abierto' ? '🟢 Garita Habilitada' : '🔒 Garita Bloqueada'}
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-extrabold tracking-tight text-white">
                  Punto de Venta Garita (POS)
                </h3>
                <p className="text-xs sm:text-sm text-[#E5DBDF] max-w-xl leading-relaxed">
                  Registro rápido de entradas vehiculares, liquidación de salidas conforme a la Ley N° 20.967,
                  emisión de tickets térmicos con código QR y consulta de patentes.
                </p>
              </div>

              {!isShiftOpen ? (
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onInitiateOpenShift && onInitiateOpenShift()}
                    className="py-3 px-6 rounded-full bg-[#E2498A] hover:bg-[#C83472] text-white font-black text-xs shadow-lg shadow-[#E2498A]/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>🚀 Iniciar Turno en Garita</span>
                  </button>
                  <span className="text-xs text-amber-300 font-mono bg-amber-950/60 border border-amber-800 px-3 py-1.5 rounded-xl">
                    ⚠ POS bloqueado: Inicie turno declarando fondo de $50.000 CLP para operar.
                  </span>
                </div>
              ) : isViewerOnly ? (
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenPosInSubtab('entry')}
                    title="Ver Garita en Modo Espectador"
                    className="py-2.5 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>👁️ Ver Garita POS (Solo Lectura)</span>
                  </button>
                  <span className="text-xs text-blue-200 font-medium bg-blue-950/70 border border-blue-800 px-3 py-1.5 rounded-xl">
                    Turno abierto por {currentShift?.operatorName || 'otro operador'}. Estás en modo visualizador.
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenPosInSubtab('entry')}
                    title="Registrar Entrada Vehicular"
                    className="py-2.5 px-6 rounded-full bg-[#E2498A] hover:bg-[#C83472] text-white font-extrabold text-xs tracking-tight shadow-[0_2px_12px_rgba(226,73,138,0.35)] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Registrar Entrada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenPosInSubtab('exit')}
                    title="Liquidar Cobro y Salida"
                    className="py-2.5 px-6 rounded-full bg-[#2D2D44] hover:bg-[#563560] border border-[#563560] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Cobrar Salida</span>
                  </button>

                  {!isOperator && (
                    <button
                      type="button"
                      onClick={() => onNavigate('reports')}
                      title="Panel Financiero y Auditoría de Turnos"
                      className="py-2.5 px-5 rounded-full bg-purple-900/60 hover:bg-purple-800 border border-purple-500/50 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-purple-300" />
                      <span>Hub Financiero &amp; Auditoría</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* MÓDULOS SECUNDARIOS DE ACCESO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => onNavigate('map')}
              className="bg-white border border-slate-200 hover:border-[#E2498A] rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
                  <span className="text-sm font-bold text-[#1E1E2F] group-hover:text-[#E2498A] transition-colors">
                    Plano 2D Serrano 447
                  </span>
                </div>
                <span className="text-slate-400 group-hover:text-[#E2498A] transition-colors">→</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Visualización espacial de las 30 plazas: Sector A (01–15 techado) y Sector B (16–30 general).
              </p>
            </div>

            {isOperator ? (
              <div
                onClick={() => onNavigate('operacion_cierre')}
                className="bg-white border border-slate-200 hover:border-rose-500 rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-sm font-bold text-[#1E1E2F] group-hover:text-rose-600 transition-colors">
                      Arqueo Ciego de Caja
                    </span>
                  </div>
                  <span className="text-slate-400 group-hover:text-rose-500 transition-colors">→</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Cierre de turno, declaración física de gaveta y emisión del Reporte Z en PDF A4.
                </p>
              </div>
            ) : (
              <div
                onClick={() => onNavigate('reports')}
                className="bg-white border border-slate-200 hover:border-[#E2498A] rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
                    <span className="text-sm font-bold text-[#1E1E2F] group-hover:text-[#E2498A] transition-colors">
                      Reportes &amp; Auditoría PIN
                    </span>
                  </div>
                  <span className="text-slate-400 group-hover:text-[#E2498A] transition-colors">→</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Cortes de caja Z, conciliación de recaudación y bitácora antifraude con firma SHA-256.
                </p>
              </div>
            )}

            <div
              onClick={() => onNavigate('clients')}
              className="bg-white border border-slate-200 hover:border-[#C83472] rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C83472]" />
                  <span className="text-sm font-bold text-[#1E1E2F] group-hover:text-[#C83472] transition-colors">
                    Convenios &amp; Abonados Mensuales
                  </span>
                </div>
                <span className="text-slate-400 group-hover:text-[#C83472] transition-colors">→</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Contratos mensuales ($ 75.000) y servicio nocturno ($ 8.000) con control de pagos al día.
              </p>
            </div>

            <div
              onClick={() => onNavigate('support')}
              className="bg-white border border-slate-200 hover:border-[#E2498A] rounded-2xl shadow-xs p-5 cursor-pointer group transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
                  <span className="text-sm font-bold text-[#1E1E2F] group-hover:text-[#E2498A] transition-colors">
                    Centro de Ayuda &amp; SOPs
                  </span>
                </div>
                <span className="text-slate-400 group-hover:text-[#E2498A] transition-colors">→</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Manuales operativos de garita, protocolo de contingencia offline (-O) y bobinas de 80mm.
              </p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: CHECKLIST DE CALIDAD O BITÁCORA DE COMENTARIOS */}
        <div className="lg:col-span-4 space-y-4">
          {!isChecklistCompleted ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="text-xs font-bold uppercase text-[#E2498A]">
                    Apertura de Turno
                  </div>
                  <h3 className="text-base font-extrabold tracking-tight text-[#1E1E2F] mt-0.5">
                    Checklist de Calidad
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Supervisión obligatoria de garita</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F8FAFC] text-[#1E1E2F] border border-slate-200 tabular-nums shrink-0 mt-0.5">
                  {checkedCount}/{CHECKLIST_ITEMS.length} REV.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 tabular-nums">
                  <span>Progreso de Verificación</span>
                  <span className="font-bold text-[#1E1E2F]">{checklistPercent}%</span>
                </div>
                <div className="w-full h-2 bg-[#F8FAFC] rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-[#E2498A] rounded-full transition-all duration-300"
                    style={{ width: `${checklistPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                {CHECKLIST_ITEMS.map((item, idx) => (
                  <label
                    key={item.title}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checklist[idx]}
                      onChange={() => toggleChecklistItem(idx)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-200 text-[#E2498A] focus:ring-0 cursor-pointer accent-[#E2498A] shrink-0"
                    />
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-bold leading-snug ${
                          checklist[idx] ? 'text-slate-400 line-through' : 'text-[#1E1E2F]'
                        }`}
                      >
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => markAll(true)}
                  className="text-xs font-bold text-slate-500 hover:text-[#1E1E2F] transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Marcar todas
                </button>

                {currentShift?.status === 'abierto' ? (
                  <button
                    type="button"
                    onClick={handleFinalizeChecklist}
                    disabled={!isAllChecked}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                      isAllChecked
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>✓</span>
                    <span>Completar Checklist</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onInitiateOpenShift) onInitiateOpenShift();
                    }}
                    className="px-4 py-2 rounded-full bg-[#E2498A] hover:bg-[#C83472] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer active:scale-[0.98] flex items-center gap-1.5"
                  >
                    <span>🚀 Iniciar Turno con Fondo</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-4 animate-fade-in-up">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Checklist 100% Validado</span>
                  </div>
                  <h3 className="text-base font-extrabold tracking-tight text-[#1E1E2F] mt-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#E2498A]" />
                    <span>Comentarios del Turno</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Bitácora de novedades y comunicación en vivo</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsChecklistCompleted(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                  title="Reabrir checklist"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {comments.map((comm) => (
                  <div key={comm.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{comm.author}</span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            comm.role === 'operador' ? 'bg-pink-100 text-[#C83472]' : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {comm.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{comm.time}</span>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed">{comm.text}</p>

                    {comm.reply && (
                      <div className="mt-2 pl-3 border-l-2 border-[#E2498A] bg-white p-2 rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-purple-900">{comm.reply.author}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{comm.reply.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{comm.reply.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="pt-2 border-t border-slate-100 space-y-2">
                <textarea
                  rows={2}
                  value={newCommentInput}
                  onChange={(e) => setNewCommentInput(e.target.value)}
                  placeholder="Escriba un reporte o comentario del turno..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-[#E2498A] focus:outline-none resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newCommentInput.trim()}
                    className="px-4 py-2 rounded-xl bg-[#E2498A] hover:bg-[#C83472] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publicar Comentario</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
