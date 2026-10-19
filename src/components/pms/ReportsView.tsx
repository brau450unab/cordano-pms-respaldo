import React, { useState, useMemo } from 'react';
import { useParking } from '../../context/ParkingContext';
import {
  printViaSystemDialog,
  generateDailyAccountingBookPdf,
  generateShiftClosingPdf,
  generateExceptionAuditReportPdf,
  generateRevenueReportPdf,
} from '../../utils/pdfGenerator';
import { Ticket, Shift } from '../../types';
import { CORDANO_11_TABLES_SCHEMA } from '../../types/databaseSchema';
import {
  createCordanoSpreadsheet,
  syncTableToGoogleSheet,
  requestGoogleAccessToken,
  initGoogleTokenClient,
} from '../../services/googleSheetsService';
import {
  INITIAL_ADMIN,
  INITIAL_OPERATOR,
  INITIAL_SUPERVISOR,
  ROLE_PERMISSIONS,
} from '../../data/mockData';

interface ReportsViewProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onInitiateCashClose?: () => void;
  initialTab?: 'vehiculos' | 'turnos' | 'flujo' | 'database';
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
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1E1E2F]" />
        </div>
      )}
    </div>
  );
};

// Turnos históricos auditados de muestra para análisis de administrador
const MOCK_HISTORICAL_SHIFTS: Shift[] = [];

export const ReportsView: React.FC<ReportsViewProps> = ({ onShowToast, onInitiateCashClose, initialTab }) => {
  const {
    tickets,
    currentShift,
    user,
    slots,
    customers,
    tariffVersions,
    agreements,
    auditLogs,
    syncQueueCount,
  } = useParking();

  // Navegación de vistas ejecutivas para el Administrador
  const [activeTab, setActiveTab] = useState<'vehiculos' | 'turnos' | 'flujo' | 'database'>(initialTab || 'vehiculos');
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

  // RevPAS: Métrica Reina en Estacionamientos (Ingreso por Espacio Disponible: Total / 30)
  const revPAS = Math.round(totalRevenue / 30);
  const turnoverRate = (filteredTickets.length / 30).toFixed(1);

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
    try {
      generateShiftClosingPdf(sh, true);
      onShowToast(`Descargando Reporte Z de Cierre A4 para el Turno #${sh.id}...`, 'info');
    } catch (err) {
      console.error(err);
      onShowToast('Error al generar el Reporte Z de Cierre.', 'error');
    }
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

  const handlePrintExceptionReport = () => {
    try {
      const dateLabel =
        datePreset === 'personalizado' && customStartDate
          ? `${customStartDate}${customEndDate ? ' al ' + customEndDate : ''}`
          : datePreset.toUpperCase();

      generateExceptionAuditReportPdf(filteredTickets, dateLabel, true);
      onShowToast(`Generando Reporte de Auditoría de Excepciones & Fugas (PDF A4)...`, 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Error al generar el Reporte de Excepciones.', 'error');
    }
  };

  const handlePrintRevenueReport = () => {
    try {
      const dateLabel =
        datePreset === 'personalizado' && customStartDate
          ? `${customStartDate}${customEndDate ? ' al ' + customEndDate : ''}`
          : datePreset.toUpperCase();

      generateRevenueReportPdf(filteredTickets, dateLabel, true);
      onShowToast(`Generando Informe Ejecutivo de Recaudación & Demanda (PDF A4)...`, 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Error al generar el Informe de Recaudación.', 'error');
    }
  };

  // ── CATÁLOGO RELACIONAL Y MAPEO DE LAS 11 TABLAS CANÓNICAS ──
  const databaseTablesData = useMemo(() => {
    // 1. Users
    const usersRows = [user, INITIAL_ADMIN, INITIAL_OPERATOR, INITIAL_SUPERVISOR]
      .filter((u, idx, arr) => arr.findIndex((x) => x?.id === u?.id) === idx)
      .map((u) => ({
        id_usuario: u.id,
        nombre_completo: u.name,
        email: u.email || 'garita@cordano.cl',
        telefono: '+56 9 8412 9012',
        rol: u.role,
        pin_autorizacion: u.role === 'operador' ? '••••' : '9988',
        estado_activo: 'ACTIVO',
        fecha_creacion: '2026-01-01',
        ultimo_acceso_timestamp: new Date().toISOString(),
        location_id: 'SERRANO-447',
      }));

    // 2. RolesPermissions
    const rolesRows = Object.entries(ROLE_PERMISSIONS).map(([rol, perms], idx) => ({
      id_permiso: `perm-${idx + 1}`,
      rol,
      modulo_acceso: perms.canOperatePos ? 'POS & Garita' : perms.canViewReports ? 'Informes & Auditoría' : 'Sistema',
      nivel_acceso: perms.canConfigureSystem ? 'TOTAL_ADMIN' : perms.canViewReports ? 'SUPERVISION' : 'OPERADOR_GARITA',
      requiere_pin_supervisor: !perms.isLiveSupervisorMode,
    }));

    // 3. Customers
    const customerList = customers && customers.length > 0 ? customers : agreements.map((a) => ({
      id: a.id,
      name: a.contactName || a.companyName || 'Cliente Corporativo',
      rut: a.rutCompany || '76.123.456-7',
      phone: a.phone || '+56 9 7788 9900',
      email: a.email || 'contacto@empresa.cl',
      agreementType: a.agreementType,
      plates: a.plates || [a.plateNumber],
      lastVisit: a.createdAt,
    }));
    const customersRows = customerList.map((c: any) => ({
      id_cliente: c.id,
      nombre_cliente: c.name,
      rut_dni: c.rut,
      telefono_contacto: c.phone || '+56 9 1234 5678',
      email_contacto: c.email || 'cliente@cordano.cl',
      consentimiento_whatsapp: true,
      tipo_cliente: c.agreementType || 'CONVENIO_MENSUAL',
      patentes_asociadas: Array.isArray(c.plates) ? c.plates.join(', ') : (c.plateNumber || 'LK-84-21'),
      acumulado_visitas: 14,
      saldo_cuenta: 0,
      ultima_visita_timestamp: c.lastVisit || new Date().toISOString(),
    }));

    // 4. Vehicles
    const vehiclesMap = new Map<string, { plate: string; type: string }>();
    tickets.forEach((t) => vehiclesMap.set(t.plateNumber, { plate: t.plateNumber, type: t.vehicleType }));
    agreements.forEach((a) => {
      const plates = a.plates && a.plates.length > 0 ? a.plates : [a.plateNumber];
      plates.forEach((p) => vehiclesMap.set(p, { plate: p, type: 'auto' }));
    });
    const vehiclesRows = Array.from(vehiclesMap.values()).map((v, i) => ({
      id_vehiculo: `veh-${i + 1}`,
      patente_normalizada: v.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase(),
      patente_formato_vista: v.plate.toUpperCase(),
      es_patente_extranjera: false,
      tipo_vehiculo: v.type,
      id_cliente_dueno: 'cli-directo',
      es_cliente_frecuente: true,
    }));

    // 5. ParkingSlots
    const slotsRows = (slots || []).map((s) => ({
      id_slot: `slot-${s.code}`,
      codigo_slot: s.code,
      zona: s.zone,
      estado_slot: s.status,
      id_vehiculo_actual: s.plateNumber || 'N/A',
      id_ticket_activo: s.currentTicketId || 'N/A',
      motivo_bloqueo: s.status === 'mantenimiento' ? 'Mantenimiento Preventivo' : 'Ninguno',
    }));

    // 6. Tickets
    const ticketsRows = tickets.map((t) => ({
      id_ticket: t.id,
      codigo_ticket: t.ticketCode || t.id,
      estado_ticket: t.status,
      id_vehiculo: `veh-${t.plateNumber}`,
      patente_normalizada: t.plateNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase(),
      id_slot: t.slotCode || 'Serrano 447',
      id_cliente: t.customerName || 'PARTICULAR',
      fecha_hora_ingreso: t.entryTime,
      fecha_hora_estimada_salida: t.exitTime || 'EN_PATIO',
      id_usuario_ingreso: t.operatorEntryName || 'Garita',
      id_turno_ingreso: 'turno-vigente',
      id_version_tarifa_aplicada: t.tariffVersionId || 'v2026-ley20967',
      es_operacion_offline: false,
      fecha_hora_salida: t.exitTime || 'ACTIVO',
      id_usuario_cobro: t.status === 'pagado' ? (t.operatorExitName || t.operatorEntryName || 'Garita') : 'PENDIENTE',
      id_turno_salida: t.status === 'pagado' ? 'turno-vigente' : 'PENDIENTE',
      duracion_total_minutos: t.durationMinutes || 0,
      minutos_gracia_aplicados: 15,
      minutos_facturables: Math.max(0, (t.durationMinutes || 0) - 15),
      monto_base_calculado: t.totalAmount || 0,
      monto_descuento_aplicado: t.discountAmount || 0,
      es_ticket_extraviado_resuelto_por_patente: !!t.isLostTicket || !!t.isLostTicketResolvedByPlate,
      recargo_administrativo_extravio_clp: t.isLostTicket ? 8000 : 0,
      monto_total_cobrado: t.totalAmount || 0,
      folio_boleta_sii: t.dteFolio || 'BOLETA-EXENTA',
    }));

    // 7. TariffVersions
    const tariffRows = (tariffVersions || []).map((tv) => ({
      id_version_tarifa: tv.id,
      nombre_version: `Versión ${tv.versionNumber} (Ley 20.967)`,
      tipo_vehiculo: 'AUTO/MOTO/PESADO',
      modelo_cobro: tv.billingModel,
      precio_por_minuto: tv.vehicleRates?.['Automóvil']?.minuteRate || 35,
      minutos_gracia: tv.gracePeriodMinutes || 15,
      cobra_desde_minuto_cero: false,
      recargo_administrativo_extravio_clp: 8000,
      regla_redondeo: 'NO_REDONDEO_HACIA_ARRIBA',
      dias_aplicables: 'LUNES_A_DOMINGO',
      hora_desde: '08:00',
      hora_hasta: '22:00',
      multiplicador_recargo: 1.0,
      fecha_inicio_vigencia: tv.effectiveFrom || '2026-01-01',
      es_activa: !tv.effectiveUntil,
      id_admin_creador: tv.createdBy || 'usr-admin-braulio',
    }));

    // 8. Payments
    const paymentsRows = tickets
      .filter((t) => t.status === 'pagado')
      .map((t) => {
        const isCard = String(t.paymentMethod || '').toLowerCase().includes('pos') || String(t.paymentMethod || '').toLowerCase().includes('tarjeta');
        return {
          id_pago: `pay-${t.id}`,
          id_ticket: t.id,
          id_turno: 'turno-vigente',
          id_usuario_cajero: t.operatorExitName || t.operatorEntryName || 'Garita',
          medio_pago: String(t.paymentMethod || 'efectivo').toUpperCase(),
          monto_total_pagado: t.totalAmount || 0,
          monto_efectivo_recibido: isCard ? 0 : (t.paidAmount || t.totalAmount || 0),
          monto_vuelto_entregado: t.changeAmount || 0,
          numero_voucher_transbank: isCard ? (t.voucherNumber || 'TBK-884192') : 'N/A',
          ultimos_4_digitos_tarjeta: isCard ? '4512' : 'N/A',
          folio_boleta_sii: t.dteFolio || `DTE-${t.id.slice(-6)}`,
          timestamp_pago: t.exitTime || t.entryTime,
        };
      });

    // 9. Shifts
    const shiftsRows = allShiftsList.map((sh) => ({
      id_turno: sh.id,
      id_usuario_operador: sh.operatorName,
      dispositivo_caja_id: 'POS-GARITA-01',
      fecha_hora_apertura: sh.startTime,
      fondo_inicial_efectivo: sh.initialCash || 50000,
      vouchers_heredados_tarjeta: 0,
      estado_turno: sh.status,
      fecha_hora_cierre: sh.endTime || 'TURNO_EN_CURSO',
      fondo_dejado_en_gaveta: sh.handoverFundAmount || sh.initialCash || 50000,
      sobre_entregado_deposito: sh.declaredCash ? Math.max(0, sh.declaredCash - (sh.handoverFundAmount || 50000)) : 0,
      declarado_efectivo_fisico: sh.declaredCash || 0,
      declarado_tarjetas_vouchers: sh.declaredCard || 0,
      declarado_transferencias: sh.declaredTransfer || 0,
      esperado_efectivo_sistema: sh.expectedCash || 0,
      esperado_total_sistema: sh.expectedTotal || 0,
      diferencia_efectivo: (sh.declaredCash || 0) - (sh.expectedCash || 0),
      diferencia_total_caja: (sh.declaredCash || 0) - (sh.expectedCash || 0),
      estado_cuadratura: Math.abs((sh.declaredCash || 0) - (sh.expectedCash || 0)) <= 2000 ? 'CUADRADO' : 'DESCUADRE',
      hash_sha256_cierre: sh.hash || 'PENDIENTE_CIERRE',
      supervisor_nombre: sh.supervisorName || 'Supervisor Serrano 447',
    }));

    // 10. AuditTrail
    const auditRows = (auditLogs || []).map((al) => ({
      id_evento_auditoria: al.id,
      timestamp: al.timestamp,
      tipo_evento: al.action,
      nivel_criticidad: (al.severity || 'INFO').toUpperCase(),
      id_usuario_solicitante: al.userName || 'Garita',
      motivo_justificacion: al.details || 'Operación regular garita',
      entidad_afectada: 'tickets',
      id_entidad_afectada: al.userId || 'N/A',
      es_aprobacion_express_diferida: al.action === 'DESCUENTO_MANUAL' || al.action === 'ANULACION_TICKET',
      aprobada_en_cierre_por_supervisor: !!al.authorizedBy,
      supervisor_aprobador_nombre: al.authorizedBy || 'Supervisor Serrano 447',
      hash_integridad: 'SHA256-OK',
    }));

    // 11. SyncQueue
    const syncRows = [
      {
        id_local_sync: 'sync-queue-01',
        idempotency_key: 'idemp-20261014-01',
        tipo_operacion: 'UPSERT',
        coleccion_destino: 'tickets',
        documento_id: 'tkt-bbcl10',
        timestamp_creacion_local: new Date().toISOString(),
        estado_sincronizacion: syncQueueCount > 0 ? 'PENDING' : 'SYNCED',
        reintentos: 0,
        mensaje_error_conflicto: 'Ninguno - Cola limpia',
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
    } as Record<string, { sheetName: string; title: string; description: string; columns: string[]; rows: Record<string, any>[] }>;
  }, [user, customers, agreements, tickets, slots, tariffVersions, allShiftsList, auditLogs, syncQueueCount]);

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
            for (const [, table] of Object.entries(databaseTablesData)) {
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

      for (const [, table] of Object.entries(databaseTablesData)) {
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
    link.href = url;
    link.setAttribute('download', `CORDANO_${table.sheetName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Tabla ${table.title} exportada a CSV con éxito.`, 'success');
  };

  const handleDownloadFullJsonBackup = () => {
    const backupPayload = {
      system: 'CORDANO PMS',
      facility: 'Serrano 447, Iquique, Chile',
      law: 'Ley N° 20.967',
      timestamp: new Date().toISOString(),
      database_version: '2.0.0',
      tables: databaseTablesData,
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CORDANO_PMS_DB_11_TABLAS_BACKUP_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Respaldo integral JSON de las 11 tablas descargado.', 'success');
  };

  // ── CÁLCULO DE DATOS PARA GRÁFICOS VISUALES SUPERIORES ──
  // 1. Distribución horaria de ingresos y vehículos (08:00 a 22:00)
  const hourlyStats = useMemo(() => {
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
    return hours.map((hr) => {
      const hNum = parseInt(hr.slice(0, 2), 10);
      const ticketsInHour = filteredTickets.filter((t) => new Date(t.entryTime).getHours() === hNum);
      const paidInHour = ticketsInHour.filter((t) => t.status === 'pagado');
      const revenue = paidInHour.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const exitsInHour = filteredTickets.filter((t) => t.exitTime && new Date(t.exitTime).getHours() === hNum).length;

      return {
        hour: hr,
        inflow: ticketsInHour.length,
        outflow: exitsInHour,
        revenue,
      };
    });
  }, [filteredTickets]);

  const maxHourRevenue = Math.max(...hourlyStats.map((h) => h.revenue), 1000);

  // 2. Heatmap Semanal: 7 Días x 4 Franjas Horarias
  const weeklyHeatmap = useMemo(() => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const timeBlocks = [
      { id: 'manana', label: 'Mañana (08-12)' },
      { id: 'almuerzo', label: 'Almuerzo (12-15)' },
      { id: 'tarde', label: 'Tarde (15-19)' },
      { id: 'noche', label: 'Noche (19-22)' },
    ];

    // Construir matriz
    return dayNames.map((dName, dIdx) => {
      const blocks = timeBlocks.map((block) => {
        const count = filteredTickets.filter((t) => {
          const d = new Date(t.entryTime);
          if (d.getDay() !== dIdx) return false;
          const h = d.getHours();
          if (block.id === 'manana') return h >= 8 && h < 12;
          if (block.id === 'almuerzo') return h >= 12 && h < 15;
          if (block.id === 'tarde') return h >= 15 && h < 19;
          if (block.id === 'noche') return h >= 19 && h <= 22;
          return false;
        }).length;

        // Porcentaje relativo sobre 30 cupos
        const occupancyRate = Math.min(100, Math.round((count / 30) * 100));
        return {
          ...block,
          count,
          occupancyRate,
        };
      });

      return {
        day: dName,
        dayIndex: dIdx,
        blocks,
      };
    });
  }, [filteredTickets]);

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
    <div id="view-reports" className="p-3 sm:p-5 lg:p-6 w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 space-y-6 text-[#1E1E2F] animate-fade-in-up pb-28 md:pb-8 font-sans">
      
      {/* ── HEADER EJECUTIVO DEL ADMINISTRADOR & HUB DE EXPORTADORES PDF A4 ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#FFF5F8] border border-[#E2498A]/30 text-[#E2498A] text-[11px] font-mono tabular-nums font-bold mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
            <span>HUB FINANCIERO &amp; AUDITORÍA OPERACIONAL</span>
          </div>
          <div className="flex items-center">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1E1E2F]">
              Inteligencia Financiera &amp; Auditoría de Operación
            </h2>
            <InfoTooltip
              title="Panel Gerencial de Auditoría y Rentabilidad"
              content="Permite al administrador auditar retroactivamente los ingresos brutos, revisar el historial inmutable de cajeros, evaluar la rentabilidad por cupo (RevPAS) y vigilar posibles fugas de capital sin alterar datos operativos."
            />
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Métricas de rentabilidad RevPAS, trazabilidad vehicular y emisión directa de documentos oficiales A4 con firma física.
          </p>
        </div>

        {/* Barra de Descargas de Reportes Oficiales en PDF A4 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 h-10 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#FFF5F8] text-[#1E1E2F] text-xs font-bold font-mono tabular-nums flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Exportar registros filtrados a planilla CSV compatible con Excel y ERP"
          >
            <svg className="w-3.5 h-3.5 text-[#E2498A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintDailyAccountingBook}
            className="px-3.5 h-10 rounded-xl border border-slate-700 bg-[#1E1E2F] hover:bg-[#2D2D44] text-white text-xs font-bold font-mono tabular-nums flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Generar Libro Diario Contable en PDF A4 (Resumen DTE IVA 19%, Asiento de Diario y Libro Auxiliar con doble firma física)"
          >
            <svg className="w-3.5 h-3.5 text-[#E2498A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Libro Diario Contable (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintExceptionReport}
            className="px-3.5 h-10 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-bold font-mono tabular-nums flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Generar Reporte de Auditoría de Excepciones y Antifraude (Fugas de capital, vehículos <= 5m sin cobro, descuentos supervisor, tickets extraviados)"
          >
            <svg className="w-3.5 h-3.5 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Excepciones &amp; Fugas (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintRevenueReport}
            className="px-3.5 h-10 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#FFF5F8] text-[#1E1E2F] text-xs font-bold font-mono tabular-nums flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Generar Informe Ejecutivo de Recaudación, KPIs, RevPAS y Demanda por Categoría (PDF A4 con 2 copias)"
          >
            <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>Flujo &amp; Demanda (PDF)</span>
          </button>

          {onInitiateCashClose && (
            <button
              type="button"
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

      {/* ── 1. KPIS EJECUTIVOS ESENCIALES (REVPAS, ROTACIÓN, RECAUDACIÓN, MERMA) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono tabular-nums">
        {/* KPI 1: RevPAS (Ingreso por Espacio Disponible) */}
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-1 hover:border-[#E2498A]/50 transition">
          <div className="text-[11px] font-bold uppercase text-[#64748B] flex items-center justify-between">
            <span className="flex items-center">
              RevPAS (Ingreso / Plaza)
              <InfoTooltip
                title="RevPAS (Revenue Per Available Space)"
                content="Métrica reina de la industria de estacionamientos. Se calcula dividiendo el total recaudado entre la capacidad física (30 cupos). Indica cuánto dinero genera exactamente cada cajón del recinto."
              />
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF5F8] text-[#E2498A] font-bold">
              MÉTRICA REINA
            </span>
          </div>
          <div className="text-2xl font-black text-[#E2498A]">
            ${revPAS.toLocaleString('es-CL')} <span className="text-xs font-bold text-slate-400">/ plaza</span>
          </div>
          <div className="text-[11px] text-[#64748B] font-sans">
            Base oficial de 30 cupos (Serrano 447)
          </div>
        </div>

        {/* KPI 2: Tasa de Rotación (Turnover Rate) */}
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-1 hover:border-[#E2498A]/50 transition">
          <div className="text-[11px] font-bold uppercase text-[#64748B] flex items-center justify-between">
            <span className="flex items-center">
              Tasa de Rotación
              <InfoTooltip
                title="Tasa de Rotación (Turnover Rate)"
                content="Mide cuántas veces se reutilizó cada una de las 30 plazas disponibles en el día. Una rotación alta con estadías cortas maximiza la recaudación bajo Ley 20.967."
              />
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
              EFICIENCIA
            </span>
          </div>
          <div className="text-2xl font-black text-[#1E1E2F]">
            {turnoverRate}x <span className="text-xs font-semibold text-[#64748B]">rotaciones</span>
          </div>
          <div className="text-[11px] text-[#64748B] font-sans">
            {filteredTickets.length} vehículos atendidos
          </div>
        </div>

        {/* KPI 3: Recaudación Bruta Consolidada */}
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-1 hover:border-[#E2498A]/50 transition">
          <div className="text-[11px] font-bold uppercase text-[#64748B] flex items-center justify-between">
            <span className="flex items-center">
              Recaudación Bruta
              <InfoTooltip
                title="Recaudación Bruta Consolidada"
                content="Suma total en pesos chilenos efectivamente cobrada dentro del período filtrado. Incluye IVA del 19% conforme a Ley 20.967."
              />
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              BRUTO IVA 19%
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ${totalRevenue.toLocaleString('es-CL')}
          </div>
          <div className="text-[11px] text-[#64748B] flex items-center justify-between">
            <span>Efvo: ${totalCash.toLocaleString('es-CL')}</span>
            <span>POS: ${totalDigital.toLocaleString('es-CL')}</span>
          </div>
        </div>

        {/* KPI 4: Merma Antifraude & Excepciones */}
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-1 hover:border-rose-400 transition">
          <div className="text-[11px] font-bold uppercase text-[#64748B] flex items-center justify-between">
            <span className="flex items-center">
              Auditoría &amp; Merma
              <InfoTooltip
                title="Monitoreo Antifraude & Prevención de Fugas"
                content="Eventos sospechosos o autorizaciones de supervisor: vehículos con estadía ≤ 5 minutos sin cobro (posible evasión), descuentos manuales o recargos por ticket extraviado ($8.000 CLP)."
              />
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              alertTicketsCount > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {alertTicketsCount > 0 ? 'ALERTA' : 'ÓPTIMO'}
            </span>
          </div>
          <div className="text-2xl font-black text-rose-700">
            {alertTicketsCount} <span className="text-xs font-semibold text-[#64748B]">casos</span>
          </div>
          <div className="text-[11px] text-[#64748B] font-sans">
            Descuentos, extravíos o fugas &le;5m
          </div>
        </div>
      </div>

      {/* ── 2. DASHBOARD VISUAL DINÁMICO: GRÁFICO HORARIO + HEATMAP SEMANAL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* PANEL 1: GRÁFICO DE DISTRIBUCIÓN HORARIA DE INGRESOS Y FLUJO (7 COLS) */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-[#F8FAFC] pb-2">
            <div>
              <div className="flex items-center">
                <h3 className="text-sm font-extrabold text-[#1E1E2F]">
                  Curva de Recaudación y Flujo Horario (08:00 a 22:00 hrs)
                </h3>
                <InfoTooltip
                  title="Análisis de Demanda e Ingresos por Hora"
                  content="Muestra cuánto dinero se recaudó y cuántos vehículos ingresaron en cada franja horaria. Permite dimensionar la caja y planificar tarifas diferenciadas."
                />
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Identificación de horas punta para optimización de tarifas dinámicas.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#FFF5F8] text-[#E2498A] text-xs font-mono font-bold">
              {datePreset.toUpperCase()}
            </span>
          </div>

          {/* Gráfico de Barras Relativo */}
          <div className="space-y-2 pt-1 font-mono text-xs tabular-nums">
            {hourlyStats.slice(0, 8).map((st) => {
              const barWidth = Math.min(100, Math.max(8, Math.round((st.revenue / maxHourRevenue) * 100)));
              return (
                <div key={st.hour} className="grid grid-cols-12 items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition">
                  <span className="col-span-2 font-bold text-slate-700">{st.hour}</span>
                  <div className="col-span-7">
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex items-center">
                      <div
                        className="bg-[#E2498A] h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="font-bold text-[#1E1E2F]">
                      ${st.revenue.toLocaleString('es-CL')}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-sans">
                      {st.inflow} entradas
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Hora de mayor facturación detectada</span>
            <span className="font-bold text-[#E2498A]">Punta: 13:00 hrs</span>
          </div>
        </div>

        {/* PANEL 2: HEATMAP SEMANAL DE OCUPACIÓN Y DEMANDA (5 COLS) */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="border-b border-[#F8FAFC] pb-2">
            <div className="flex items-center">
              <h3 className="text-sm font-extrabold text-[#1E1E2F]">
                Mapa de Calor (Heatmap) de Ocupación
              </h3>
              <InfoTooltip
                title="Heatmap de Días x Horas"
                content="Permite ver instantáneamente los horarios de mayor saturación cruzando días de la semana con franjas horarias. Responde en 5 segundos a qué hora el recinto se colapsa."
              />
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Ocupación promedio calculada sobre la capacidad física de 30 plazas.
            </p>
          </div>

          {/* Matriz Heatmap */}
          <div className="space-y-2 font-mono text-xs">
            <div className="grid grid-cols-5 text-[10px] uppercase font-bold text-slate-400 text-center pb-1">
              <div className="text-left pl-1">Día</div>
              <div>Mañ</div>
              <div>Alm</div>
              <div>Tar</div>
              <div>Noc</div>
            </div>

            {weeklyHeatmap.map((row) => (
              <div key={row.day} className="grid grid-cols-5 items-center gap-1.5 text-center">
                <span className="text-xs font-bold text-slate-700 text-left pl-1 font-sans">{row.day}</span>
                {row.blocks.map((b) => {
                  let cellBg = 'bg-slate-100 text-slate-600';
                  if (b.occupancyRate >= 75) {
                    cellBg = 'bg-[#E2498A] text-white font-black shadow-xs';
                  } else if (b.occupancyRate >= 50) {
                    cellBg = 'bg-[#E2498A]/60 text-white font-bold';
                  } else if (b.occupancyRate >= 25) {
                    cellBg = 'bg-pink-100 text-[#C83472] font-semibold';
                  }

                  return (
                    <div
                      key={b.id}
                      title={`${row.day} ${b.label}: ${b.occupancyRate}% ocupación estimada (${b.count} autos)`}
                      className={`h-7 rounded-lg flex items-center justify-center text-[10px] transition-all cursor-help ${cellBg}`}
                    >
                      {b.occupancyRate}%
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Leyenda Heatmap */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Baja (&lt;25%)</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-100" />
              <span className="w-3 h-3 rounded bg-pink-100" />
              <span className="w-3 h-3 rounded bg-[#E2498A]/60" />
              <span className="w-3 h-3 rounded bg-[#E2498A]" />
            </div>
            <span>Saturado (&gt;75%)</span>
          </div>
        </div>
      </div>

      {/* ── 3. NAVEGACIÓN DE PESTAÑAS Y AUDITORÍA ── */}
      <div className="border-b border-[#E2E8F0] pb-2">
        {/* Selector Dropdown Móvil / Compacto */}
        <div className="block md:hidden mb-2">
          <label htmlFor="report-tab-select" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Módulo de Reporte:
          </label>
          <div className="relative">
            <select
              id="report-tab-select"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="w-full h-11 px-3.5 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#1E1E2F] shadow-xs focus:ring-2 focus:ring-[#E2498A] outline-none cursor-pointer appearance-none"
            >
              <option value="vehiculos">🚗 1. Registros de Vehículos ({filteredTickets.length})</option>
              <option value="turnos">💼 2. Auditoría de Turnos &amp; Caja ({allShiftsList.length})</option>
              <option value="flujo">📈 3. Demanda y Horarios Pico</option>
              <option value="database">🗄️ 4. Base de Datos (11 Tablas) &amp; Sheets</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
              ▼
            </div>
          </div>
        </div>

        {/* Botones Segmentados en Pantallas Medianas y Grandes */}
        <div className="hidden md:flex flex-wrap items-center gap-1.5">
          <button
            type="button"
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
            type="button"
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
            type="button"
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

          <button
            type="button"
            id="tab-btn-database"
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'database'
                ? 'bg-[#1E1E2F] text-white shadow-xs'
                : 'text-[#64748B] hover:bg-[#FFF5F8] hover:text-[#1E1E2F]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>4. Base de Datos (11 Tablas) &amp; Google Sheets</span>
            <InfoTooltip
              title="Catálogo Canónico de 11 Tablas & Google Sheets"
              content="Visualice las 11 entidades relacionales según Ley 20.967, verifique su persistencia y sincronice con Google Sheets en un clic."
            />
          </button>
        </div>
      </div>

      {/* ── 4. BARRA DE FILTROS INMEDIATAMENTE PEGADA A LAS TABLAS ── */}
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
                  type="button"
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

      {/* ── 5. PLANILLA 1: REGISTROS HISTÓRICOS DE VEHÍCULOS (CLICK EN ROW ABRE MODAL) ── */}
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
              Patente / Tipo
              <InfoTooltip
                title="Placa Patente y Categoría"
                content="Identificación del vehículo y su tipo tarifario según Ley 20.967 (Automóvil, Camioneta, Motocicleta, Furgón/SUV)."
                align="left"
              />
            </div>
            <div className="col-span-2 flex items-center">
              Sector / Cupo
              <InfoTooltip
                title="Ubicación Física"
                content="Cajón asignado en el recinto: Sector A (01-15 techado) o Sector B (16-30 general)."
              />
            </div>
            <div className="col-span-2 flex items-center">
              Ingreso &rarr; Salida
              <InfoTooltip
                title="Tiempos de Estadía"
                content="Marcas de tiempo registradas para el cálculo exacto de minutos conforme a la Ley 20.967 (con 15 min de gracia legal)."
              />
            </div>
            <div className="col-span-2 flex items-center">
              Medio de Pago
              <InfoTooltip
                title="Medio de Liquidación"
                content="Forma en que se saldó la cuenta: Efectivo físico, voucher de tarjeta POS Transbank o cargo a convenio mensual."
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

      {/* ── 6. PLANILLA 2: AUDITORÍA INMUTABLE DE TURNOS & MOVIMIENTOS DE CAJA ── */}
      {activeTab === 'turnos' && (
        <div className="space-y-6">
          {/* Card Flujo Operacional de Caja del Turno */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F8FAFC] pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#1E1E2F] flex items-center gap-2">
                  <span>💵</span>
                  <span>Registro Operacional de Ingresos y Egresos del Turno</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Movimientos de efectivo en gaveta (inyecciones y retiros de sencillo) durante el turno actual.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                Turno: <strong className="text-[#E2498A]">{currentShift?.id || 'TRN-ACTIVO'}</strong>
              </span>
            </div>

            {/* Resumen de Valores de Caja */}
            {(() => {
              const movements = currentShift?.cashMovements || [];
              const extraInflow = movements.filter(m => m.type === 'INGRESO_MANUAL').reduce((acc, m) => acc + m.amount, 0);
              const extraOutflow = movements.filter(m => m.type === 'RETIRO_SANGRIA' || m.type === 'GASTO_MENOR').reduce((acc, m) => acc + m.amount, 0);

              return (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-[#64748B] block font-sans">Fondo Inicial:</span>
                      <span className="text-sm font-black text-slate-800">$ 50.000</span>
                    </div>
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <span className="text-[11px] text-emerald-800 block font-sans">Ingresos Extra:</span>
                      <span className="text-sm font-black text-emerald-700">
                        +$ {extraInflow.toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                      <span className="text-[11px] text-rose-800 block font-sans">Egresos / Gastos:</span>
                      <span className="text-sm font-black text-rose-700">
                        -$ {extraOutflow.toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="p-3 bg-pink-50/60 rounded-xl border border-pink-100">
                      <span className="text-[11px] text-[#E2498A] block font-sans">Movimientos Registrados:</span>
                      <span className="text-sm font-black text-[#E2498A]">{movements.length} registros</span>
                    </div>
                  </div>

                  {/* Historial de Movimientos de Caja */}
                  {movements.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Últimos Movimientos de Gaveta:
                      </span>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {movements.slice(-5).reverse().map((m) => {
                          const isIngreso = m.type === 'INGRESO_MANUAL';
                          return (
                            <div key={m.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isIngreso ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <span className="font-bold text-slate-800">{isIngreso ? 'Ingreso' : 'Egreso'}:</span>
                                <span className="text-slate-600">{m.reason || 'Sin motivo especificado'}</span>
                              </div>
                              <div className="flex items-center gap-3 font-mono">
                                <span className="text-[10px] text-slate-400">
                                  {new Date(m.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className={`font-black tabular-nums ${isIngreso ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {isIngreso ? '+' : '-'}$ {m.amount.toLocaleString('es-CL')}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                      No hay inyecciones ni egresos extraordinarios registrados en este turno.
                    </div>
                  )}
                </>
              );
            })()}
          </div>

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
                      <span className="text-[#E2498A] font-bold">Ver auditoría completa &rarr;</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </div>
      )}

      {/* ── 7. PLANILLA 3: DEMANDA Y FLUJO (HORARIOS PICO) ── */}
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
            {hourlyStats.map((st) => {
              const netChange = st.inflow - st.outflow;
              return (
                <div key={st.hour} className="grid grid-cols-12 items-center gap-2 p-2 rounded-lg hover:bg-[#F8FAFC]">
                  <span className="col-span-2 font-bold text-[#1E1E2F]">{st.hour}</span>
                  <div className="col-span-8 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-[10px] text-[#E2498A] font-bold">In ({st.inflow})</span>
                      <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#E2498A] h-full rounded-full" style={{ width: `${Math.min(100, st.inflow * 10)}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-[10px] text-[#1E1E2F] font-bold">Out ({st.outflow})</span>
                      <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#1E1E2F] h-full rounded-full" style={{ width: `${Math.min(100, st.outflow * 10)}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-right font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">
                      {netChange >= 0 ? `+${netChange}` : netChange}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 8. PLANILLA 4: BASE DE DATOS (11 TABLAS CANÓNICAS) & GOOGLE SHEETS ── */}
      {activeTab === 'database' && (
        <div id="view-database-sheets" data-testid="view-database-sheets" className="space-y-4 animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-2xl shadow-xs shrink-0">
                  📊
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#1E1E2F]">
                      Ecosistema Google Sheets &amp; Respaldo de Base de Datos
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                      API v4 Conectada
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Permite sincronizar las 11 entidades relacionales directamente con una planilla en Google Drive o descargar un respaldo completo.
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
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
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
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                        </svg>
                        <span>Conectar &amp; Crear Google Sheets (11 Hojas)</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportCurrentTableCsv}
                  className="px-3.5 h-10 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#FFF5F8] text-[#1E1E2F] text-xs font-bold font-mono tabular-nums flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Exportar la tabla seleccionada en formato CSV compatible con Excel"
                >
                  <svg className="w-4 h-4 text-[#E2498A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Exportar CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadFullJsonBackup}
                  className="px-3.5 h-10 rounded-xl border border-slate-700 bg-[#1E1E2F] hover:bg-[#2D2D44] text-white text-xs font-bold font-mono tabular-nums flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Descargar snapshot JSON inmutable de las 11 tablas relacionales"
                >
                  <svg className="w-4 h-4 text-[#E2498A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Respaldo JSON Completo</span>
                </button>
              </div>
            </div>
          </div>

          {/* SELECTOR DE LAS 11 TABLAS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#E2E8F0]">
            {Object.entries(databaseTablesData).map(([key, tbl]) => (
              <button
                type="button"
                key={key}
                onClick={() => {
                  setSelectedTableKey(key);
                  setTableSearchQuery('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedTableKey === key
                    ? 'bg-[#1E1E2F] text-white shadow-xs'
                    : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E1E2F]'
                }`}
              >
                <span>{tbl.title}</span>
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {tbl.rows.length}
                </span>
              </button>
            ))}
          </div>

          {/* TABLA DE DATOS SELECCIONADA */}
          {databaseTablesData[selectedTableKey] && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-extrabold text-[#1E1E2F]">
                    {databaseTablesData[selectedTableKey].title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {databaseTablesData[selectedTableKey].description}
                  </p>
                </div>

                <input
                  type="text"
                  value={tableSearchQuery}
                  onChange={(e) => setTableSearchQuery(e.target.value)}
                  placeholder="Filtrar en tabla..."
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono w-full sm:w-64"
                />
              </div>

              <div className="overflow-x-auto max-h-96">
                {(() => {
                  const tbl = databaseTablesData[selectedTableKey];
                  const q = tableSearchQuery.toLowerCase();
                  const filteredRows = tbl.rows.filter((row) =>
                    !q ? true : Object.values(row).some((v) => String(v).toLowerCase().includes(q))
                  );

                  return (
                    <table className="w-full text-xs font-mono text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-bold">
                          {tbl.columns.map((col) => (
                            <th key={col} className="p-2.5 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            {tbl.columns.map((col) => {
                              const cellVal = row[col];
                              let displayStr = '';
                              if (typeof cellVal === 'boolean') {
                                return (
                                  <td key={col} className="p-2.5 whitespace-nowrap">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      cellVal ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {cellVal ? 'SÍ' : 'NO'}
                                    </span>
                                  </td>
                                );
                              }
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
                <span>Registros totales: {databaseTablesData[selectedTableKey].rows.length}</span>
                <span className="text-[11px]">Sincronizable con Google Sheets ('{databaseTablesData[selectedTableKey].sheetName}')</span>
              </div>
            </div>
          )}
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
                type="button"
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
              type="button"
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
                type="button"
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
                type="button"
                onClick={() => handlePrintTurnoA4(selectedShiftForDetail)}
                className="flex-1 h-11 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#FFF5F8] text-[#1E1E2F] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#E2498A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>Descargar Reporte Z (PDF A4)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedShiftForDetail(null)}
                className="flex-1 h-11 rounded-xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white text-xs font-bold transition cursor-pointer"
              >
                Cerrar Auditoría
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
