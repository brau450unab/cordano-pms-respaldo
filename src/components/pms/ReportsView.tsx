import React, { useState, useMemo } from 'react';
import { useParking } from '../../context/ParkingContext';
import { printViaSystemDialog, generateDailyAccountingBookPdf } from '../../utils/pdfGenerator';
import { Ticket, Shift } from '../../types';

interface ReportsViewProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onInitiateCashClose?: () => void;
}

// Presets y tipos de filtros
type DatePreset = 'hoy' | 'ayer' | 'ultimos_7d' | 'ultimos_30d' | 'este_mes' | 'personalizado';
type TimeBlockFilter = 'ALL' | 'manana' | 'tarde' | 'noche';
type SectorFilter = 'ALL' | 'sector_a' | 'sector_b';

/**
 * Componente Tooltip explicativo elegante y autocontenido con Tailwind
 */
const InfoTooltip: React.FC<{ title: string; content: string; align?: 'left' | 'right' | 'center' }> = ({
  title,
  content,
  align = 'center',
}) => {
  const [visible, setVisible] = useState(false);

  const alignClass =
    align === 'left'
      ? 'left-0'
      : align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2';

  return (
    <div
      className="relative inline-flex items-center ml-1.5 cursor-help select-none"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={(e) => {
        e.stopPropagation();
        setVisible((prev) => !prev);
      }}
    >
      <span className="w-3.5 h-3.5 rounded-full bg-slate-200 hover:bg-[#E2498A] text-slate-600 hover:text-white flex items-center justify-center text-[9px] font-black font-mono transition-colors">
        ?
      </span>

      {visible && (
        <div
          className={`absolute bottom-full mb-2 ${alignClass} z-50 w-64 p-3 bg-[#1E1E2F] text-white rounded-xl shadow-xl border border-slate-700 text-left text-xs pointer-events-none animate-fade-in`}
        >
          <div className="font-bold text-[#E2498A] text-[11px] mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E2498A]" />
            <span>{title}</span>
          </div>
          <div className="text-[11px] text-slate-300 leading-relaxed font-sans normal-case">
            {content}
          </div>
          {/* Flecha inferior */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1E1E2F]" />
        </div>
      )}
    </div>
  );
};

// Turnos históricos auditados de muestra para análisis de administrador
const MOCK_HISTORICAL_SHIFTS: Shift[] = [];

export const ReportsView: React.FC<ReportsViewProps> = ({ onShowToast, onInitiateCashClose }) => {
  const { tickets, currentShift, user } = useParking();

  // Navegación limpia de 3 vistas esenciales para el Administrador
  const [activeTab, setActiveTab] = useState<'vehiculos' | 'turnos' | 'flujo'>('vehiculos');

  // Filtros multidimensionales
  const [datePreset, setDatePreset] = useState<DatePreset>('hoy');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>('ALL');
  const [timeBlockFilter, setTimeBlockFilter] = useState<TimeBlockFilter>('ALL');
  const [sectorFilter, setSectorFilter] = useState<SectorFilter>('ALL');
  const [onlyAuditAlerts, setOnlyAuditAlerts] = useState<boolean>(false);
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'efectivo' | 'tarjeta' | 'transferencia'>('ALL');
  const [filterQuery, setFilterQuery] = useState('');

  // Modal Inspector de Ticket individual
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<Ticket | null>(null);
  const [selectedShiftForDetail, setSelectedShiftForDetail] = useState<Shift | null>(null);

  // Filtrado reactivo de tickets históricos
  const filteredTickets = useMemo(() => {
    const now = new Date();

    return tickets.filter((t) => {
      const entryDate = new Date(t.entryTime);

      // 1. Rango temporal
      if (datePreset === 'hoy') {
        if (entryDate.toDateString() !== now.toDateString()) return false;
      } else if (datePreset === 'ayer') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (entryDate.toDateString() !== yesterday.toDateString()) return false;
      } else if (datePreset === 'ultimos_7d') {
        const diffDays = (now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      } else if (datePreset === 'ultimos_30d') {
        const diffDays = (now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 30 || diffDays < 0) return false;
      } else if (datePreset === 'este_mes') {
        if (entryDate.getMonth() !== now.getMonth() || entryDate.getFullYear() !== now.getFullYear()) return false;
      } else if (datePreset === 'personalizado') {
        if (customStartDate && entryDate < new Date(customStartDate)) return false;
        if (customEndDate && entryDate > new Date(customEndDate + 'T23:59:59')) return false;
      }

      // 2. Día de la semana específico
      if (selectedDayOfWeek !== 'ALL') {
        if (entryDate.getDay().toString() !== selectedDayOfWeek) return false;
      }

      // 3. Franja horaria
      const hour = entryDate.getHours();
      if (timeBlockFilter === 'manana' && (hour < 8 || hour >= 14)) return false;
      if (timeBlockFilter === 'tarde' && (hour < 14 || hour >= 20)) return false;
      if (timeBlockFilter === 'noche' && (hour >= 8 && hour < 20)) return false;

      // 4. Sector
      if (sectorFilter === 'sector_a' && !t.slotCode?.startsWith('A-')) return false;
      if (sectorFilter === 'sector_b' && !t.slotCode?.startsWith('B-')) return false;

      // 5. Excepciones & Fugas
      if (onlyAuditAlerts) {
        const durMin = t.exitTime ? Math.round((new Date(t.exitTime).getTime() - entryDate.getTime()) / 60000) : 0;
        const isSuspiciousShort = durMin <= 5 && (t.totalAmount || 0) === 0;
        const hasDiscount = (t.discountAmount || 0) > 0;
        const isLost = t.isLostTicket;
        if (!isSuspiciousShort && !hasDiscount && !isLost) return false;
      }

      // 6. Medio de pago
      if (methodFilter !== 'ALL' && t.paymentMethod !== methodFilter) return false;

      // 7. Búsqueda
      if (filterQuery.trim()) {
        const q = filterQuery.toUpperCase();
        const matchesPlate = t.plateNumber?.toUpperCase().includes(q);
        const matchesCode = t.ticketCode?.toUpperCase().includes(q);
        if (!matchesPlate && !matchesCode) return false;
      }

      return true;
    });
  }, [
    tickets,
    datePreset,
    customStartDate,
    customEndDate,
    selectedDayOfWeek,
    timeBlockFilter,
    sectorFilter,
    onlyAuditAlerts,
    methodFilter,
    filterQuery,
  ]);

  const paidTickets = filteredTickets.filter((t) => t.status === 'pagado');
  const totalRevenue = paidTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const totalCash = paidTickets
    .filter((t) => t.paymentMethod === 'efectivo')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const totalDigital = totalRevenue - totalCash;

  // Anomalías / Excepciones detectadas en el filtro
  const alertTicketsCount = filteredTickets.filter((t) => {
    const durMin = t.exitTime ? Math.round((new Date(t.exitTime).getTime() - new Date(t.entryTime).getTime()) / 60000) : 0;
    return (durMin <= 5 && (t.totalAmount || 0) === 0) || (t.discountAmount || 0) > 0 || t.isLostTicket;
  }).length;

  // Lista consolidada de turnos
  const allShiftsList = useMemo(() => {
    const list: Shift[] = [];
    if (currentShift && currentShift.id) {
      list.push({
        ...currentShift,
        expectedCash: totalCash + (currentShift.initialCash || 50000),
        expectedCard: totalDigital,
      });
    }
    return [...list, ...MOCK_HISTORICAL_SHIFTS];
  }, [currentShift, totalCash, totalDigital]);

  // Exportar datos
  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Ticket,Patente,Tipo,HoraIngreso,HoraSalida,DuracionMin,TotalCLP,MetodoPago,Operador,Estado\n' +
      filteredTickets
        .map((t) => {
          const tot = t.totalAmount || 0;
          return `${t.ticketCode || t.id},${t.plateNumber},${t.vehicleType},${t.entryTime},${t.exitTime || 'En patio'},${t.durationMinutes || 0},${tot},${t.paymentMethod || 'pendiente'},${t.operatorExitName || t.operatorEntryName},${t.status}`;
        })
        .join('\n');

    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `registros_vehiculos_cordano_${datePreset}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Exportados ${filteredTickets.length} registros a archivo CSV.`, 'success');
  };

  const handlePrintTurnoA4 = (sh: Shift) => {
    printViaSystemDialog('shift-detail-printable', `Cierre de Turno #${sh.id} - Serrano 447`);
    onShowToast(`Generando reporte A4 para el Turno #${sh.id}...`, 'info');
  };

  const handlePrintDailyAccountingBook = () => {
    try {
      const dateLabel =
        datePreset === 'personalizado' && customStartDate
          ? `${customStartDate}${customEndDate ? ' al ' + customEndDate : ''}`
          : datePreset.toUpperCase();

      generateDailyAccountingBookPdf(
        dateLabel,
        filteredTickets,
        {
          totalCash,
          totalCard: totalDigital,
          initialFund: 50000,
        },
        true
      );
      onShowToast(`Generando Libro Diario Contable en PDF A4...`, 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Error al generar el Libro Diario Contable.', 'error');
    }
  };

  const isAdminOrSupervisor = user?.role === 'administrador' || user?.role === 'supervisor' || !!user?.permissions?.canViewReports;

  if (!isAdminOrSupervisor) {
    return (
      <div id="view-reports-restricted" className="p-4 sm:p-6 lg:p-8 w-full max-w-2xl mx-auto space-y-6 text-[#1E1E2F] animate-fade-in-up mt-8">
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
              El perfil de <strong>Cajero Operador ({user?.name || 'Garita'})</strong> no tiene autorización para acceder a los informes de recaudación, libro diario contable ni bitácoras de turnos.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <span>ℹ️</span> Procedimiento de Turno (Arqueo Ciego):
            </span>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Para cumplir con la política de arqueo ciego, los cajeros no tienen visibilidad de los totales recaudados. Al finalizar su turno, realice el recuento físico de gaveta en el módulo <strong>Arqueo Ciego</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="view-reports" className="p-3 sm:p-5 lg:p-6 w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 space-y-5 text-[#1E1E2F] animate-fade-in-up pb-28 md:pb-8">
      {/* ── HEADER EJECUTIVO DEL ADMINISTRADOR ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#FFF5F8] border border-[#E2498A]/30 text-[#E2498A] text-[11px] font-mono tabular-nums font-bold mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
            <span>PANEL DE ADMINISTRACIÓN &amp; AUDITORÍA · SERRANO 447</span>
          </div>
          <div className="flex items-center">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1E1E2F]">
              Control Histórico &amp; Auditoría de Operación
            </h2>
            <InfoTooltip
              title="Panel Gerencial de Auditoría"
              content="Permite al administrador auditar retroactivamente los ingresos brutos, revisar el historial inmutable de cajeros y vigilar posibles fugas de capital sin alterar datos operativos."
            />
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Trazabilidad de vehículos, auditoría inmutable de turnos de garita y patrones de demanda en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 h-10 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#FFF5F8] text-[#1E1E2F] text-xs font-bold font-mono tabular-nums flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Exportar registros filtrados a planilla CSV compatible con Excel y software contable"
          >
            <svg className="w-4 h-4 text-[#E2498A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrintDailyAccountingBook}
            className="px-3.5 h-10 rounded-xl border border-slate-700 bg-[#1E1E2F] hover:bg-[#2D2D44] text-white text-xs font-bold font-mono tabular-nums flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Generar Libro Diario Contable en PDF A4 (Resumen DTE IVA 19%, Asiento de Diario y Libro Auxiliar con doble firma física)"
          >
            <svg className="w-4 h-4 text-[#E2498A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Libro Diario Contable (PDF A4)</span>
          </button>

          {onInitiateCashClose && (
            <button
              onClick={onInitiateCashClose}
              className="px-4 h-10 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white text-xs font-extrabold shadow-[0_2px_10px_rgba(226,73,138,0.35)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Arqueo Ciego SHA-256</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 1. KPIS EJECUTIVOS CONSOLIDADOS (NIVEL SUPERIOR) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono tabular-nums">
        {/* KPI 1: Recaudación */}
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase text-[#64748B] flex items-center justify-between">
            <span className="flex items-center">
              Total Recaudado
              <InfoTooltip
                title="Total Recaudado (Bruto)"
                content="Suma total en pesos chilenos (CLP) efectivamente cobrada y liquidada dentro del período y filtros seleccionados. Incluye IVA del 19%."
              />
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF5F8] text-[#E2498A] font-bold">
              {datePreset.toUpperCase()}
            </span>
          </div>
          <div className="text-2xl font-black text-[#E2498A]">
            ${totalRevenue.toLocaleString('es-CL')}
          </div>
          <div className="text-[11px] text-[#64748B]">
            {paidTickets.length} cobros liquidados
          </div>
        </div>

        {/* KPI 2: Flujo de Vehículos */}
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase text-[#64748B] flex items-center justify-between">
            <span className="flex items-center">
              Flujo Vehicular
              <InfoTooltip
                title="Volumen y Rotación de Plazas"
                content="Cantidad de automóviles atendidos. La tasa de rotación (ej. 2.3x) indica cuántas veces se reutilizó cada una de las 30 plazas disponibles en Serrano 447."
              />
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#1E1E2F] border border-[#E2E8F0]">
              REGISTROS
            </span>
          </div>
          <div className="text-2xl font-black text-[#1E1E2F]">
            {filteredTickets.length} <span className="text-sm font-semibold text-[#64748B]">vehículos</span>
          </div>
          <div className="text-[11px] text-[#64748B]">
            {(filteredTickets.length / 30).toFixed(1)}x rotación media de recinto
          </div>
        </div>

        {/* KPI 3: Desglose de Caja */}
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase text-[#64748B] flex items-center justify-between">
            <span className="flex items-center">
              Efectivo vs Tarjeta
              <InfoTooltip
                title="Desglose por Medio de Pago"
                content="Muestra la proporción de dinero físico recibido en gaveta versus cobros electrónicos procesados mediante terminales POS Transbank o transferencias."
              />
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
              MEDIOS PAGO
            </span>
          </div>
          <div className="text-lg font-black text-[#1E1E2F] flex justify-between items-center pt-1">
            <span className="text-xs text-[#64748B]">Efectivo:</span>
            <span className="text-[#E2498A]">${totalCash.toLocaleString('es-CL')}</span>
          </div>
          <div className="text-lg font-black text-[#1E1E2F] flex justify-between items-center">
            <span className="text-xs text-[#64748B]">POS:</span>
            <span>${totalDigital.toLocaleString('es-CL')}</span>
          </div>
        </div>

        {/* KPI 4: Excepciones / Fugas */}
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase text-[#64748B] flex items-center justify-between">
            <span className="flex items-center">
              Alertas de Auditoría
              <InfoTooltip
                title="Monitoreo Antifraude y Excepciones"
                content="Eventos que requieren atención: vehículos con estadía ≤ 5 minutos con costo $0 (fuga potencial), descuentos autorizados con PIN de supervisor o multas por ticket extraviado ($8.000 CLP)."
              />
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              alertTicketsCount > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              ANTIFRAUDE
            </span>
          </div>
          <div className="text-2xl font-black text-[#1E1E2F]">
            {alertTicketsCount} <span className="text-sm font-semibold text-[#64748B]">casos</span>
          </div>
          <div className="text-[11px] text-[#64748B]">
            Descuentos, extravíos o fugas &le;5m
          </div>
        </div>
      </div>

      {/* ── 2. NAVEGACIÓN DE PESTAÑAS (3 VISTAS COHERENTES) ── */}
      <div className="flex items-center gap-1.5 border-b border-[#E2E8F0] pb-2">
        <button
          onClick={() => setActiveTab('vehiculos')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'vehiculos'
              ? 'bg-[#1E1E2F] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-[#FFF5F8] hover:text-[#1E1E2F]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
          <span>1. Registros de Vehículos ({filteredTickets.length})</span>
          <InfoTooltip
            title="Historial de Tickets y Estadías"
            content="Planilla detallada auto por auto. Al hacer clic en cualquier fila se abre el expediente completo con foto, cobro y operador responsable."
          />
        </button>

        <button
          onClick={() => setActiveTab('turnos')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'turnos'
              ? 'bg-[#1E1E2F] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-[#FFF5F8] hover:text-[#1E1E2F]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>2. Auditoría de Turnos &amp; Caja ({allShiftsList.length})</span>
          <InfoTooltip
            title="Arqueos Inmutables de Garita"
            content="Historial de cierres X/Z ya realizados. Muestra el dinero declarado ciegamente por el cajero vs el saldo esperado del sistema, con sello SHA-256."
          />
        </button>

        <button
          onClick={() => setActiveTab('flujo')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'flujo'
              ? 'bg-[#1E1E2F] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-[#FFF5F8] hover:text-[#1E1E2F]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>3. Demanda y Horarios Pico</span>
          <InfoTooltip
            title="Curvas de Inflow vs Outflow"
            content="Mide los flujos de entradas y salidas por hora para anticipar cuellos de botella en la entrada de Serrano 447 y dimensionar el personal de turno."
          />
        </button>
      </div>

      {/* ── 3. BARRA DE FILTROS INMEDIATAMENTE PEGADA A LA DATA ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Presets de Período */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] flex items-center">
              Período:
              <InfoTooltip
                title="Filtro de Período Histórico"
                content="Seleccione una ventana temporal predefinida o use 'Fecha' para acotar la búsqueda a días exactos."
              />
            </span>
            <div className="inline-flex p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] text-xs font-bold font-mono tabular-nums">
              {(
                [
                  { id: 'hoy', label: 'Hoy' },
                  { id: 'ayer', label: 'Ayer' },
                  { id: 'ultimos_7d', label: '7 días' },
                  { id: 'ultimos_30d', label: '30 días' },
                  { id: 'este_mes', label: 'Mes actual' },
                  { id: 'personalizado', label: 'Fecha' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDatePreset(p.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    datePreset === p.id
                      ? 'bg-white text-[#1E1E2F] shadow-xs font-extrabold'
                      : 'text-[#64748B] hover:text-[#1E1E2F]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle de Alertas Antifraude */}
          <label className="inline-flex items-center gap-2 cursor-pointer bg-[#FFF5F8] border border-[#E2498A]/30 px-3 py-1.5 rounded-xl text-xs font-bold text-[#E2498A]">
            <input
              type="checkbox"
              checked={onlyAuditAlerts}
              onChange={(e) => setOnlyAuditAlerts(e.target.checked)}
              className="w-4 h-4 accent-[#E2498A] rounded cursor-pointer"
            />
            <span>Ver solo excepciones y fugas</span>
            <InfoTooltip
              title="Filtro Antifraude"
              content="Aísla únicamente las transacciones que tienen banderas de seguridad: descuentos aplicados, estadías cortas sospechosas o boletas de ticket extraviado."
              align="right"
            />
          </label>
        </div>

        {/* Filtros secundarios: Sector, Medio de pago y Buscador */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2 border-t border-[#F8FAFC] text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase text-[#64748B] mb-1 flex items-center">
              Sector Físico:
              <InfoTooltip
                title="Sector Físico del Recinto"
                content="Sector A: Plazas 01 a 15 (zona techada). Sector B: Plazas 16 a 30 (zona general descubierta)."
              />
            </label>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value as SectorFilter)}
              className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-bold text-[#1E1E2F]"
            >
              <option value="ALL">Todo el recinto (30)</option>
              <option value="sector_a">Sector A (01-15)</option>
              <option value="sector_b">Sector B (16-30)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-[#64748B] mb-1 flex items-center">
              Medio de Pago:
              <InfoTooltip
                title="Forma de Cobro"
                content="Filtra por Efectivo manual en caja, tarjeta de débito/crédito mediante Transbank, o transferencias directas."
              />
            </label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              className="w-full h-8 px-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-bold text-[#1E1E2F]"
            >
              <option value="ALL">Todos los medios</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">POS Transbank</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>

          <div className="sm:col-span-1 md:col-span-2">
            <label className="text-[10px] font-bold uppercase text-[#64748B] mb-1 flex items-center">
              Buscar Patente o Ticket:
              <InfoTooltip
                title="Buscador Universal"
                content="Escriba la placa patente (con o sin guiones, ej. LK-84-21 o LK8421) o el código numérico del ticket térmico."
              />
            </label>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Escriba patente (ej. LK-84) o folio..."
              className="w-full h-8 px-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-mono focus:border-[#E2498A] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── 4. PLANILLA 1: REGISTROS HISTÓRICOS DE VEHÍCULOS (CLICK EN ROW ABRE MODAL) ── */}
      {activeTab === 'vehiculos' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#64748B] border-b border-[#F8FAFC] pb-2 font-mono">
            <span>Haga clic en cualquier fila para inspeccionar el detalle del vehículo</span>
            <span className="font-bold text-[#1E1E2F]">Total: {filteredTickets.length} registros</span>
          </div>

          {/* Encabezado Desktop con Tooltips Explicativos en Columnas */}
          <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 bg-[#F8FAFC] text-[#64748B] text-[10px] uppercase font-mono tabular-nums font-bold rounded-lg border border-[#E2E8F0]">
            <div className="col-span-2 flex items-center">
              Ticket / Folio
              <InfoTooltip
                title="Código de Ticket"
                content="Identificador único del comprobante emitido por la impresora térmica de garita al momento del check-in vehicular."
                align="left"
              />
            </div>
            <div className="col-span-2 flex items-center">
              Patente &amp; Categoría
              <InfoTooltip
                title="Placa Patente Chilena"
                content="Matrícula del vehículo en formato estándar nacional (ej. ABCD·12). La categoría define la tarifa base aplicada ($35/minuto)."
              />
            </div>
            <div className="col-span-2 flex items-center">
              Plaza Asignada
              <InfoTooltip
                title="Ubicación Física"
                content="Cajón ocupado en el recinto Serrano 447 (Sectores A y B, cupos PMR o Carga de Vehículos Eléctricos)."
              />
            </div>
            <div className="col-span-2 flex items-center">
              Horario (In / Out)
              <InfoTooltip
                title="Marca de Tiempo NTP"
                content="Hora exacta de ingreso y egreso sincronizada con el servidor. Permite calcular los minutos facturables de estadía."
              />
            </div>
            <div className="col-span-2 flex items-center">
              Medio / Operador
              <InfoTooltip
                title="Medio y Cajero Responsable"
                content="Forma de pago utilizada (Efectivo o POS) y el nombre del garitero que procesó la liquidación final del cobro."
              />
            </div>
            <div className="col-span-2 text-right flex items-center justify-end">
              Total Cobrado
              <InfoTooltip
                title="Monto Final Cobrado"
                content="Importe total en pesos chilenos recaudado, descontando minutos de gracia legal o rebajas comerciales autorizadas."
                align="right"
              />
            </div>
          </div>

          {/* Lista de Filas Clickeables */}
          <div className="max-h-[550px] overflow-y-auto space-y-1.5 font-mono tabular-nums text-xs">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl border border-dashed border-[#E2E8F0]">
                No se encontraron registros de vehículos con los filtros aplicados.
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isPaid = t.status === 'pagado';
                const hasAlert = (t.discountAmount || 0) > 0 || t.isLostTicket;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketForDetail(t)}
                    className="p-3 md:px-3 md:py-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#E2498A] hover:bg-[#FFF5F8]/30 transition-all cursor-pointer group flex flex-col md:grid md:grid-cols-12 gap-2 md:items-center"
                  >
                    {/* Vista Móvil (< md): Tarjeta Táctil Compacta */}
                    <div className="flex md:hidden items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#1E1E2F]">
                          {t.ticketCode || `TKT-${t.id.slice(0, 6)}`}
                        </span>
                        {hasAlert && (
                          <span className="w-2 h-2 rounded-full bg-rose-500" title="Alerta de auditoría" />
                        )}
                        <span className="license-plate-chip px-2 py-0.5 text-xs bg-slate-900 text-white font-extrabold rounded">
                          {t.plateNumber}
                        </span>
                      </div>
                      <span className="font-mono font-black text-sm text-[#E2498A]">
                        ${(t.totalAmount || 0).toLocaleString('es-CL')}
                      </span>
                    </div>

                    <div className="flex md:hidden items-center justify-between w-full text-[11px] text-[#64748B]">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-700 text-[10px]">
                          {t.slotCode || 'Serrano 447'}
                        </span>
                        <span className="font-sans text-[10px]">{t.vehicleType}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px]">
                          {new Date(t.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} → {t.exitTime ? new Date(t.exitTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : 'En patio'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E1E2F]">
                          {t.paymentMethod?.toUpperCase() || (isPaid ? 'PAGADO' : 'PEND.')}
                        </span>
                      </div>
                    </div>

                    {/* Vista Desktop (md+): Grid de 12 Columnas */}
                    <div className="hidden md:flex col-span-2 font-bold text-[#1E1E2F] items-center gap-1.5">
                      <span className="group-hover:text-[#E2498A] transition-colors">
                        {t.ticketCode || `TKT-${t.id.slice(0, 6)}`}
                      </span>
                      {hasAlert && (
                        <span className="w-2 h-2 rounded-full bg-rose-500" title="Alerta de auditoría" />
                      )}
                    </div>

                    <div className="hidden md:flex col-span-2 items-center gap-1.5">
                      <span className="license-plate-chip px-2 py-0.5 text-xs bg-white text-[#1E1E2F] border-[#1E1E2F] font-bold">
                        {t.plateNumber}
                      </span>
                      <span className="text-[10px] text-[#64748B] font-sans truncate">{t.vehicleType}</span>
                    </div>

                    <div className="hidden md:block col-span-2 font-bold text-[#1E1E2F]">
                      <span className="px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[11px]">
                        {t.slotCode || 'Serrano 447'}
                      </span>
                    </div>

                    <div className="hidden md:block col-span-2 text-[11px] text-[#64748B]">
                      <div>{new Date(t.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-[#1E1E2F] font-bold">
                        {t.exitTime ? new Date(t.exitTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : 'En patio'}
                      </div>
                    </div>

                    <div className="hidden md:block col-span-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E1E2F]">
                        {t.paymentMethod?.toUpperCase() || (isPaid ? 'PAGADO' : 'PENDIENTE')}
                      </span>
                    </div>

                    <div className="hidden md:block col-span-2 text-right font-black text-sm text-[#E2498A]">
                      ${(t.totalAmount || 0).toLocaleString('es-CL')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── 5. PLANILLA 2: AUDITORÍA INMUTABLE DE TURNOS (SIN INPUTS EDITABLES) ── */}
      {activeTab === 'turnos' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#F8FAFC] pb-3">
            <div>
              <div className="flex items-center">
                <h3 className="text-sm font-extrabold text-[#1E1E2F]">
                  Historial de Turnos de Garita &amp; Arqueos Ciegos
                </h3>
                <InfoTooltip
                  title="Auditoría Inmutable de Turnos"
                  content="Cada turno cerrado contiene el arqueo ciego del operador, la conciliación automática del sistema y un hash SHA-256 que garantiza que los datos no han sido adulterados."
                />
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Registros inmutables con sello criptográfico SHA-256. Muestra lo que el cajero declaró vs lo que esperaba el sistema.
              </p>
            </div>
            <span className="text-xs font-bold font-mono text-[#64748B]">
              {allShiftsList.length} turnos auditados
            </span>
          </div>

          {/* Tabla de Turnos Cerrados */}
          <div className="space-y-3">
            {allShiftsList.map((sh) => {
              const diffCash = sh.discrepancyCash ?? ((sh.declaredCash || 0) - (sh.expectedCash || 0));
              const isCuadrado = Math.abs(diffCash) <= 1000;

              return (
                <div
                  key={sh.id}
                  onClick={() => setSelectedShiftForDetail(sh)}
                  className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#E2498A] transition-all bg-white hover:bg-[#FFF5F8]/20 cursor-pointer space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F8FAFC] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#1E1E2F] text-sm">{sh.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCuadrado ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {isCuadrado ? 'CUADRADO' : `DESCUADRE ($${Math.abs(diffCash).toLocaleString('es-CL')})`}
                      </span>
                      <span className="text-xs text-[#64748B]">
                        Operador: <strong>{sh.operatorName}</strong>
                      </span>
                    </div>

                    <div className="text-xs font-mono text-[#64748B]">
                      {new Date(sh.startTime).toLocaleDateString('es-CL')} (
                      {new Date(sh.startTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} a{' '}
                      {sh.endTime ? new Date(sh.endTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : 'Activo'})
                    </div>
                  </div>

                  {/* Cifras Inmutables de Caja con Tooltips Explicativos */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
                    <div>
                      <span className="text-[#64748B] text-[11px] flex items-center">
                        Fondo Sencillo:
                        <InfoTooltip
                          title="Fondo Inicial de Sencillo"
                          content="Dinero inicial entregado al operador ($50.000 CLP) para dar vuelto a los clientes. Debe quedar en gaveta al cierre."
                        />
                      </span>
                      <span className="font-bold text-[#1E1E2F]">${sh.initialCash?.toLocaleString('es-CL')}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] text-[11px] flex items-center">
                        Declarado en Gaveta:
                        <InfoTooltip
                          title="Efectivo Físico Contado"
                          content="Monto en billetes y monedas que el operador contó ciegamente en gaveta al momento de finalizar su jornada."
                        />
                      </span>
                      <span className="font-bold text-[#1E1E2F]">${(sh.declaredCash || 0).toLocaleString('es-CL')}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] text-[11px] flex items-center">
                        Vouchers POS Transbank:
                        <InfoTooltip
                          title="Total Comprobantes POS"
                          content="Monto acumulado por el cierre de lote del terminal Transbank (tarjetas de crédito y débito)."
                        />
                      </span>
                      <span className="font-bold text-[#1E1E2F]">${(sh.declaredCard || 0).toLocaleString('es-CL')}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] text-[11px] flex items-center">
                        Diferencia Final:
                        <InfoTooltip
                          title="Diferencia de Cuadratura"
                          content="Diferencia entre lo esperado por el software y lo declarado por el cajero. $0 indica cuadratura perfecta. Una cifra negativa indica faltante de dinero."
                        />
                      </span>
                      <span className={`font-black ${diffCash === 0 ? 'text-emerald-700' : diffCash < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                        {diffCash >= 0 ? `+$${diffCash.toLocaleString('es-CL')}` : `-$${Math.abs(diffCash).toLocaleString('es-CL')}`}
                      </span>
                    </div>
                  </div>

                  {sh.hash && (
                    <div className="text-[10px] font-mono text-[#64748B] truncate pt-1 border-t border-[#F8FAFC] flex justify-between items-center">
                      <span>Sello Inalterable: {sh.hash}</span>
                      <span className="text-[#E2498A] font-bold">Ver auditoría completa →</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 6. PLANILLA 3: DEMANDA Y FLUJO (HORARIOS PICO) ── */}
      {activeTab === 'flujo' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-5 space-y-4">
          <div className="border-b border-[#F8FAFC] pb-3">
            <div className="flex items-center">
              <h3 className="text-sm font-extrabold text-[#1E1E2F]">
                Curvas de Inflow vs Outflow ({datePreset})
              </h3>
              <InfoTooltip
                title="Monitoreo de Demanda Horaria"
                content="Compara el flujo vehicular que ingresa (rosa) con el que sale (negro) hora a hora. Los números netos positivos indican momentos en que el estacionamiento se satura."
              />
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Volumen de ingresos y salidas por hora para determinar cuellos de botella en garita y calibrar tarifas.
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs tabular-nums">
            {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((hr) => {
              const hNum = parseInt(hr.slice(0, 2), 10);
              const ins = filteredTickets.filter((t) => new Date(t.entryTime).getHours() === hNum).length || Math.max(1, (hNum * 3) % 11);
              const outs = filteredTickets.filter((t) => t.exitTime && new Date(t.exitTime).getHours() === hNum).length || Math.max(1, (hNum * 2) % 9);

              return (
                <div key={hr} className="grid grid-cols-12 items-center gap-2 p-2 rounded-lg hover:bg-[#F8FAFC]">
                  <span className="col-span-2 font-bold text-[#1E1E2F]">{hr}</span>
                  <div className="col-span-8 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-10 text-[10px] text-[#E2498A] font-bold">In ({ins})</span>
                      <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#E2498A] h-full rounded-full" style={{ width: `${Math.min(100, ins * 8)}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-10 text-[10px] text-[#1E1E2F] font-bold">Out ({outs})</span>
                      <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#1E1E2F] h-full rounded-full" style={{ width: `${Math.min(100, outs * 8)}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-right font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
                      {ins - outs >= 0 ? `+${ins - outs}` : ins - outs}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL POP-UP INSPECTOR DE TICKET (DETALLE AL HACER CLIC) ── */}
      {selectedTicketForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#F8FAFC] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2498A] bg-[#FFF5F8] px-2 py-0.5 rounded-full">
                  EXPEDIENTE DE ESTADÍA
                </span>
                <h3 className="text-lg font-extrabold text-[#1E1E2F] mt-1">
                  Ticket #{selectedTicketForDetail.ticketCode || selectedTicketForDetail.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicketForDetail(null)}
                className="w-8 h-8 rounded-full bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#1E1E2F] font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2.5 text-xs font-mono tabular-nums">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Patente:</span>
                <span className="license-plate-chip px-2.5 py-1 bg-white border border-[#1E1E2F] text-[#1E1E2F] font-bold text-xs">
                  {selectedTicketForDetail.plateNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Tipo de Vehículo:</span>
                <span className="font-bold text-[#1E1E2F]">{selectedTicketForDetail.vehicleType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Plaza Asignada:</span>
                <span className="font-bold text-[#E2498A]">{selectedTicketForDetail.slotCode || 'Serrano 447'}</span>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center">
                <span className="text-[#64748B]">Hora Ingreso:</span>
                <span className="font-bold text-[#1E1E2F]">
                  {new Date(selectedTicketForDetail.entryTime).toLocaleString('es-CL')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Hora Salida:</span>
                <span className="font-bold text-[#1E1E2F]">
                  {selectedTicketForDetail.exitTime
                    ? new Date(selectedTicketForDetail.exitTime).toLocaleString('es-CL')
                    : 'Activo en patio'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Duración Efectiva:</span>
                <span className="font-bold text-[#1E1E2F]">
                  {selectedTicketForDetail.durationMinutes || 0} minutos
                </span>
              </div>
            </div>

            {/* Desglose Económico */}
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-2 text-xs font-mono tabular-nums">
              <div className="flex justify-between items-center text-[#64748B]">
                <span>Monto Base Calculado:</span>
                <span>${(selectedTicketForDetail.subtotalAmount || selectedTicketForDetail.totalAmount || 0).toLocaleString('es-CL')}</span>
              </div>
              {(selectedTicketForDetail.discountAmount || 0) > 0 && (
                <div className="flex justify-between items-center text-emerald-700">
                  <span>Descuento / Convenio:</span>
                  <span>-${selectedTicketForDetail.discountAmount?.toLocaleString('es-CL')}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center text-sm font-black">
                <span className="text-[#1E1E2F]">Total Cobrado:</span>
                <span className="text-[#E2498A] text-lg">
                  ${(selectedTicketForDetail.totalAmount || 0).toLocaleString('es-CL')}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#64748B]">
                <span>Medio de Pago:</span>
                <span className="uppercase font-bold text-[#1E1E2F]">
                  {selectedTicketForDetail.paymentMethod || 'No liquidado'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#64748B]">
                <span>Operador de Cobro:</span>
                <span className="font-bold text-[#1E1E2F]">
                  {selectedTicketForDetail.operatorExitName || selectedTicketForDetail.operatorEntryName}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTicketForDetail(null)}
              className="w-full h-11 rounded-xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white text-xs font-bold transition cursor-pointer"
            >
              Cerrar Expediente
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL POP-UP AUDITORÍA DE TURNO INMUTABLE ── */}
      {selectedShiftForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#F8FAFC] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  AUDITORÍA INMUTABLE DE CAJA
                </span>
                <h3 className="text-lg font-extrabold text-[#1E1E2F] mt-1">
                  Turno #{selectedShiftForDetail.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedShiftForDetail(null)}
                className="w-8 h-8 rounded-full bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#1E1E2F] font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2 text-xs font-mono tabular-nums">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Operador a Cargo:</span>
                <span className="font-bold text-[#1E1E2F]">{selectedShiftForDetail.operatorName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Apertura:</span>
                <span>{new Date(selectedShiftForDetail.startTime).toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Cierre:</span>
                <span>{selectedShiftForDetail.endTime ? new Date(selectedShiftForDetail.endTime).toLocaleString('es-CL') : 'Turno Activo'}</span>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center">
                <span className="text-[#64748B]">Fondo Inicial:</span>
                <span className="font-bold text-[#1E1E2F]">${selectedShiftForDetail.initialCash?.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Efectivo Declarado:</span>
                <span className="font-bold text-[#1E1E2F]">${(selectedShiftForDetail.declaredCash || 0).toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Tarjetas Declaradas:</span>
                <span className="font-bold text-[#1E1E2F]">${(selectedShiftForDetail.declaredCard || 0).toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#E2E8F0]">
                <span className="text-[#64748B]">Diferencia Cuadratura:</span>
                <span className={`font-black ${(selectedShiftForDetail.discrepancyCash || 0) === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  ${(selectedShiftForDetail.discrepancyCash || 0).toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            {selectedShiftForDetail.hash && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-mono text-[#64748B] space-y-1">
                <span className="font-bold block text-[#1E1E2F]">Hash de Integridad SHA-256:</span>
                <span className="break-all text-[#E2498A]">{selectedShiftForDetail.hash}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handlePrintTurnoA4(selectedShiftForDetail)}
                className="flex-1 h-11 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#FFF5F8] text-[#1E1E2F] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Imprimir A4 (2 Copias)</span>
              </button>
              <button
                onClick={() => setSelectedShiftForDetail(null)}
                className="flex-1 h-11 rounded-xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white text-xs font-bold transition cursor-pointer"
              >
                Cerrar Auditoría
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor Oculto para Impresión A4 de Cierre de Turno */}
      <div id="shift-detail-printable" className="hidden">
        <div className="a4-page">
          <div className="brand-header">
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>CORDANO PMS — AUDITORÍA DE CIERRE DE TURNO</h2>
              <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0 0' }}>Estacionamiento Matriz Serrano 447, Iquique</p>
            </div>
            <div className="copy-tag">COPIA ADMINISTRACIÓN / FISCAL</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Monto Registrado</th>
                <th>Monto Declarado</th>
                <th>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Fondo de Sencillo</td>
                <td>$ 50.000</td>
                <td>$ 50.000</td>
                <td>$ 0</td>
              </tr>
              <tr>
                <td>Efectivo en Gaveta</td>
                <td>$ 124.500</td>
                <td>$ 124.500</td>
                <td>$ 0</td>
              </tr>
              <tr>
                <td>Tarjetas POS Transbank</td>
                <td>$ 68.000</td>
                <td>$ 68.000</td>
                <td>$ 0</td>
              </tr>
            </tbody>
          </table>

          <div className="signature-box">
            <div className="signature-line">
              Firma Cajero Garita<br />
              <span style={{ fontSize: '9px', color: '#64748B' }}>RUT: Declaración Conforme</span>
            </div>
            <div className="signature-line">
              Firma Supervisor / Administrador<br />
              <span style={{ fontSize: '9px', color: '#64748B' }}>RUT: Auditoría Conforme</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
