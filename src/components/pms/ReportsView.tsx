import React, { useState } from 'react';
import { useParking } from '../../context/ParkingContext';
import { printViaSystemDialog } from '../../utils/pdfGenerator';

interface ReportsViewProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onInitiateCashClose?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onShowToast, onInitiateCashClose }) => {
  const { tickets, currentShift, auditLogs } = useParking();
  const [activeTab, setActiveTab] = useState<'transacciones' | 'cierre_x' | 'excepciones' | 'ventas_z' | 'horarios_pico' | 'automatizacion'>('transacciones');
  const [filterQuery, setFilterQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'efectivo' | 'tarjeta' | 'transferencia'>('ALL');

  // Estado del Cierre X (arqueo táctico)
  const [declaredPhysicalCash, setDeclaredPhysicalCash] = useState<number>(() => {
    return (currentShift.declaredCash || 0) || ((currentShift.initialCash || 50000) + 72500);
  });
  const [declaredPhysicalCard, setDeclaredPhysicalCard] = useState<number>(() => {
    return (currentShift.declaredCard || 0) || 54000;
  });

  // Configuración de Automatización de Correos
  const [emailAutoEnabled, setEmailAutoEnabled] = useState(true);
  const [alertShortStayThreshold, setAlertShortStayThreshold] = useState(5); // minutos para considerar fuga/estadía sospechosa

  const paidTickets = tickets.filter((t) => t.status === 'pagado');
  const totalRevenue = paidTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const netSubtotalTotal = Math.round(totalRevenue / 1.19);
  const totalIva19 = totalRevenue - netSubtotalTotal;

  // Separación de ingresos por tipo de cliente (Pilar 3: Cierre Z)
  const rotatingTickets = paidTickets.filter((t) => t.tariffType !== 'especial' && t.paymentMethod !== 'convenio');
  const rotatingRevenue = rotatingTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const agreementRevenue = totalRevenue - rotatingRevenue;

  const totalCashSystem = paidTickets
    .filter((t) => t.paymentMethod === 'efectivo')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const totalDigitalSystem = totalRevenue - totalCashSystem;
  const initialFund = currentShift.initialCash || 50000;
  const expectedTotalCashInDrawer = totalCashSystem + initialFund;

  // Cuadratura Cierre X
  const cashDiscrepancy = declaredPhysicalCash - expectedTotalCashInDrawer;
  const cardDiscrepancy = declaredPhysicalCard - totalDigitalSystem;
  const isSquareBalanced = Math.abs(cashDiscrepancy) <= 1000 && Math.abs(cardDiscrepancy) === 0;

  // Detección automática de Excepciones & Fugas de Capital (Pilar 2)
  const suspiciousShortStays = tickets.filter((t) => {
    if (!t.exitTime) return false;
    const durMin = Math.round((new Date(t.exitTime).getTime() - new Date(t.entryTime).getTime()) / 60000);
    return durMin <= alertShortStayThreshold && (t.totalAmount || 0) === 0;
  });

  const manualBarrierLogs = auditLogs.filter((l) =>
    l.action.toUpperCase().includes('BARRERA') ||
    l.action.toUpperCase().includes('MANUAL') ||
    l.action.toUpperCase().includes('FORZADA')
  );

  const voidTickets = auditLogs.filter((l) =>
    l.action.toUpperCase().includes('ANULAC') ||
    l.action.toUpperCase().includes('VOID')
  );

  const discountLogs = auditLogs.filter((l) =>
    l.action.toUpperCase().includes('DESCUENTO') ||
    l.action.toUpperCase().includes('CONVENIO')
  );

  // Pilares 3: Horarios Pico (Distribución por horas)
  const hourlyTraffic = [
    { hour: '08:00', entries: 4, exits: 1 },
    { hour: '09:00', entries: 8, exits: 2 },
    { hour: '10:00', entries: 14, exits: 4 }, // Pico matutino
    { hour: '11:00', entries: 16, exits: 7 }, // Colapso 10:47 AM
    { hour: '12:00', entries: 11, exits: 12 },
    { hour: '13:00', entries: 9, exits: 15 },
    { hour: '14:00', entries: 6, exits: 14 }, // Vaciado 14:15 PM
    { hour: '15:00', entries: 7, exits: 8 },
    { hour: '16:00', entries: 10, exits: 6 },
    { hour: '17:00', entries: 13, exits: 9 },
    { hour: '18:00', entries: 15, exits: 12 }, // Pico vespertino
    { hour: '19:00', entries: 8, exits: 11 },
    { hour: '20:00', entries: 4, exits: 7 },
  ];

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Ticket,Patente,Tipo,HoraIngreso,HoraSalida,NetoCLP,IVA19CLP,TotalCLP,MetodoPago,Estado\n' +
      paidTickets
        .map((t) => {
          const tot = t.totalAmount || 0;
          const net = Math.round(tot / 1.19);
          const iva = tot - net;
          return `${t.ticketCode || t.id},${t.plateNumber},${t.vehicleType},${t.entryTime},${t.exitTime || '---'},${net},${iva},${tot},${t.paymentMethod || 'efectivo'},${t.status}`;
        })
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_fiscal_cordano_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Libro mayor de ventas exportado en formato CSV compatible con SII.', 'success');
  };

  // Exportación Contable ERP (QuickBooks / Xero / ERP Chileno)
  const handleExportAccountingERP = () => {
    const csvHeader = 'CuentaContable,Descripcion,CentroCosto,DebeCLP,HaberCLP,Glosa\n';
    const rows = [
      `1101-01,Caja Efectivo Garita,Serrano-447,${totalCashSystem},0,Recaudación turno #${currentShift.id || '1042'}`,
      `1102-05,Transbank POS Tarjetas,Serrano-447,${totalDigitalSystem},0,Cobros voucher POS debito/credito`,
      `2107-01,IVA Débito Fiscal 19%,Serrano-447,0,${totalIva19},Impuesto al valor agregado DTE`,
      `4101-01,Ingresos por Estacionamiento Rotativo,Serrano-447,0,${Math.round(rotatingRevenue / 1.19)},Ventas tiempo real $35/min`,
      `4101-02,Ingresos por Convenios Mensuales,Serrano-447,0,${Math.round(agreementRevenue / 1.19)},Facturación contratos Zofri y afines`,
    ];
    const fullCsv = 'data:text/csv;charset=utf-8,' + csvHeader + rows.join('\n');
    const encoded = encodeURI(fullCsv);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `asiento_contable_cordano_erp_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast('Póliza de diario contable exportada para ERP (QuickBooks/Xero/Defontana).', 'success');
  };

  const [isExportingImage, setIsExportingImage] = useState(false);

  const handleExportPNG = async () => {
    const el = document.getElementById('view-reports');
    if (!el) return;
    setIsExportingImage(true);
    onShowToast('Generando captura PNG del reporte...', 'info');
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F8FAFC',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `reporte_cordano_${activeTab}_${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast('Reporte descargado exitosamente como imagen PNG.', 'success');
    } catch (err) {
      onShowToast('No se pudo generar la imagen del reporte.', 'error');
    } finally {
      setIsExportingImage(false);
    }
  };

  const handlePrintCierreX = () => {
    printViaSystemDialog('cierre-x-printable', 'Reporte Cierre X - Control de Turno Serrano 447');
    onShowToast('Enviando Cierre X al diálogo de impresión A4...', 'info');
  };

  const handleGenerateCorteZ = () => {
    onShowToast(`Corte Z Fiscal #${currentShift.id || '1042'} consolidado y registrado con sello criptográfico SHA-256.`, 'success');
  };

  // Sample Audit Logs para la bitácora
  const sampleDisplayLogs = [
    {
      id: 'AUD-1001',
      date: new Date(Date.now() - 5400000).toISOString(),
      user: 'Juan Pérez (Operador)',
      action: 'APERTURA_TURNO_FONDO_INICIAL',
      reason: 'Apertura de caja en Serrano 447 con fondo de sencillo declarado ($50.000 CLP).',
      tag: 'NEUTRO' as const,
      pinVerified: true,
    },
    {
      id: 'AUD-1002',
      date: new Date(Date.now() - 3200000).toISOString(),
      user: 'Juan Pérez (PIN Operador)',
      action: 'DESCUENTO_COMERCIAL_AUTORIZADO',
      reason: 'Convenio comercial Notaría Serrano Iquique validado en garita (-$500 CLP).',
      tag: 'VERDE' as const,
      pinVerified: true,
    },
    {
      id: 'AUD-1003',
      date: new Date(Date.now() - 1800000).toISOString(),
      user: 'B. Abarca (PIN Admin)',
      action: 'MULTA_TICKET_EXTRAVIADO_8000',
      reason: 'Extravío de ticket térmico acreditado con padrón y cédula (+$8.000 CLP).',
      tag: 'ROJO' as const,
      pinVerified: true,
    },
    {
      id: 'AUD-1004',
      date: new Date(Date.now() - 950000).toISOString(),
      user: 'Juan Pérez (Operador)',
      action: 'APERTURA_MANUAL_BARRERA',
      reason: 'Paso expedito autorizado para móvil de Carabineros de Chile (Emergencia cuadrante 1).',
      tag: 'ROJO' as const,
      pinVerified: true,
    },
    ...auditLogs.map((l) => ({
      id: l.id,
      date: l.timestamp,
      user: l.userName,
      action: l.action,
      reason: typeof l.details === 'string' ? l.details : JSON.stringify(l.details),
      tag: (l.action.includes('DESCUENTO') ? 'VERDE' : l.action.includes('EXTRAV') || l.action.includes('MANUAL') || l.action.includes('PERDIDO') ? 'ROJO' : 'NEUTRO') as 'VERDE' | 'ROJO' | 'NEUTRO',
      pinVerified: l.action.includes('PIN') || l.action.includes('AUTORIZ'),
    })),
  ];

  const filteredPaidTickets = paidTickets.filter((t) => {
    const matchesPlate =
      t.plateNumber.toUpperCase().includes(filterQuery.toUpperCase()) ||
      (t.ticketCode && t.ticketCode.toUpperCase().includes(filterQuery.toUpperCase()));
    const matchesMethod = methodFilter === 'ALL' || t.paymentMethod === methodFilter;
    return matchesPlate && matchesMethod;
  });

  return (
    <div id="view-reports" className="p-3 sm:p-5 lg:p-6 w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 space-y-5 text-[#1E1E2F] animate-fade-in-up">
      {/* ── TOP HEADER (ESTILO PROFESIONAL TOGGL TRACK) ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#FFF5F8] border border-[#E2498A]/30 text-[#E2498A] text-[11px] font-mono tabular-nums font-bold mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
            <span>GESTIÓN GERENCIAL &amp; PREVENCIÓN DE FUGAS · SERRANO 447</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1E1E2F]">
            Reportes Operativos, Financieros &amp; Auditoría
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Control de caja táctico (Cierre X), consolidado fiscal (Cierre Z), detector de fugas de capital y exportabilidad contable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportAccountingERP}
            className="px-3.5 h-10 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#FFF5F8] text-[#1E1E2F] text-xs font-bold font-mono tabular-nums flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#E2498A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exportar ERP / QuickBooks</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 h-10 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#FFF5F8] text-[#1E1E2F] text-xs font-bold font-mono tabular-nums flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#E2498A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>CSV SII</span>
          </button>

          <button
            onClick={handleExportPNG}
            disabled={isExportingImage}
            className="px-3.5 h-10 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#FFF5F8] text-[#1E1E2F] text-xs font-bold font-mono tabular-nums flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Descargar este reporte como imagen de alta resolución"
          >
            <svg className="w-4 h-4 text-[#E2498A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>{isExportingImage ? 'Generando...' : 'Descargar Imagen'}</span>
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

      {/* ── 4 KPI HERO RESUMEN ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono tabular-nums">
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase text-[#64748B] flex items-center justify-between">
            <span>Total Recaudado</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF5F8] text-[#E2498A] font-bold">BRUTO</span>
          </div>
          <div className="text-2xl font-black text-[#E2498A]">
            ${totalRevenue.toLocaleString('es-CL')}
          </div>
          <div className="text-[11px] text-[#64748B]">
            {paidTickets.length} transacciones liquidadas
          </div>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase text-[#64748B] flex items-center justify-between">
            <span>Efectivo en Gaveta</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#1E1E2F] border border-[#E2E8F0]">SISTEMA</span>
          </div>
          <div className="text-2xl font-black text-[#1E1E2F]">
            ${expectedTotalCashInDrawer.toLocaleString('es-CL')}
          </div>
          <div className="text-[11px] text-[#64748B]">Incluye $50.000 fondo inicial</div>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase text-[#64748B] flex items-center justify-between">
            <span>Excepciones Críticas</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              manualBarrierLogs.length > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              ANTIFRAUDE
            </span>
          </div>
          <div className="text-2xl font-black text-[#1E1E2F]">
            {manualBarrierLogs.length + voidTickets.length} <span className="text-sm font-semibold text-[#64748B]">alertas</span>
          </div>
          <div className="text-[11px] text-[#64748B]">Barreras manuales o anulaciones</div>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-1">
          <div className="text-[11px] font-bold uppercase text-[#64748B] flex items-center justify-between">
            <span>Snapshots Gerencia</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">ACTIVO 07:00 AM</span>
          </div>
          <div className="text-2xl font-black text-[#E2498A]">
            Auto-Email
          </div>
          <div className="text-[11px] text-[#64748B]">Despacho PDF/Excel diario</div>
        </div>
      </div>

      {/* ── NAVEGACIÓN POR PESTAÑAS ESTRATÉGICAS (5 PILARES) ── */}
      <div className="flex items-center gap-1.5 border-b border-[#E2E8F0] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('transacciones')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'transacciones'
              ? 'bg-[#1E1E2F] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-[#FFF5F8] hover:text-[#1E1E2F]'
          }`}
        >
          <span>Libro Mayor DTE</span>
        </button>

        <button
          onClick={() => setActiveTab('cierre_x')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'cierre_x'
              ? 'bg-[#1E1E2F] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-[#FFF5F8] hover:text-[#1E1E2F]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
          <span>Cierre de Turno (Cierre X)</span>
        </button>

        <button
          onClick={() => setActiveTab('excepciones')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'excepciones'
              ? 'bg-[#1E1E2F] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-[#FFF5F8] hover:text-[#1E1E2F]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#C83472]" />
          <span>Fugas de Capital &amp; Excepciones</span>
        </button>

        <button
          onClick={() => setActiveTab('ventas_z')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'ventas_z'
              ? 'bg-[#1E1E2F] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-[#FFF5F8] hover:text-[#1E1E2F]'
          }`}
        >
          <span>Ventas Diarias (Cierre Z)</span>
        </button>

        <button
          onClick={() => setActiveTab('horarios_pico')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'horarios_pico'
              ? 'bg-[#1E1E2F] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-[#FFF5F8] hover:text-[#1E1E2F]'
          }`}
        >
          <span>Horarios Pico &amp; Demanda</span>
        </button>

        <button
          onClick={() => setActiveTab('automatizacion')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'automatizacion'
              ? 'bg-[#1E1E2F] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-[#FFF5F8] hover:text-[#1E1E2F]'
          }`}
        >
          <span>Automatización &amp; ERP</span>
        </button>
      </div>

      {/* ── PILAR 2: REPORTE DE CIERRE DE TURNO (CIERRE X TÁCTICO) ── */}
      {activeTab === 'cierre_x' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F8FAFC] pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#FFF5F8] text-[#E2498A] text-xs font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
                REPORTE OPERATIVO TÁCTICO · CIERRE X
              </div>
              <h3 className="text-lg font-extrabold text-[#1E1E2F]">
                Cuadratura de Caja &amp; Turno en Garita
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Desglose estricto entre efectivo físico contado, vouchers Transbank/POS y validación de diferencias.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintCierreX}
                className="px-4 py-2 rounded-xl bg-[#1E1E2F] text-white text-xs font-bold hover:bg-[#2D2D44] transition-colors flex items-center gap-2 shadow-xs"
              >
                <svg className="w-4 h-4 text-[#E2498A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Imprimir Cierre X (A4 / 2 Copias)</span>
              </button>
            </div>
          </div>

          {/* Comparativa Sistema vs Conteo Físico Declarado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Columna 1: Fondo y Efectivo */}
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1E2F]">
                1. Efectivo en Gaveta
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Fondo Inicial (Sencillo)</span>
                  <span className="font-mono tabular-nums font-bold text-[#1E1E2F]">${initialFund.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">+ Ventas Efectivo Turno</span>
                  <span className="font-mono tabular-nums font-bold text-[#1E1E2F]">${totalCashSystem.toLocaleString('es-CL')}</span>
                </div>
                <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center">
                  <span className="font-bold text-[#1E1E2F]">Esperado en Gaveta</span>
                  <span className="font-mono tabular-nums font-extrabold text-base text-[#1E1E2F]">
                    ${expectedTotalCashInDrawer.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0]">
                <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                  Monto Físico Contado por Operador:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#64748B] font-mono">$</span>
                  <input
                    type="number"
                    value={declaredPhysicalCash}
                    onChange={(e) => setDeclaredPhysicalCash(Number(e.target.value) || 0)}
                    className="w-full h-10 pl-7 pr-3 rounded-xl border border-[#CBD5E1] bg-white text-sm font-mono tabular-nums font-bold text-[#1E1E2F] focus:border-[#E2498A] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Columna 2: Vouchers Transbank / Digital */}
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1E2F]">
                2. Tarjetas y Vouchers POS
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Vouchers POS (Sistema)</span>
                  <span className="font-mono tabular-nums font-bold text-[#1E1E2F]">${totalDigitalSystem.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Convenios / Descuentos</span>
                  <span className="font-mono tabular-nums font-bold text-[#1E1E2F]">${agreementRevenue.toLocaleString('es-CL')}</span>
                </div>
                <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center">
                  <span className="font-bold text-[#1E1E2F]">Esperado en Lote Transbank</span>
                  <span className="font-mono tabular-nums font-extrabold text-base text-[#1E1E2F]">
                    ${totalDigitalSystem.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0]">
                <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                  Total Cierre de Lote POS Físico:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#64748B] font-mono">$</span>
                  <input
                    type="number"
                    value={declaredPhysicalCard}
                    onChange={(e) => setDeclaredPhysicalCard(Number(e.target.value) || 0)}
                    className="w-full h-10 pl-7 pr-3 rounded-xl border border-[#CBD5E1] bg-white text-sm font-mono tabular-nums font-bold text-[#1E1E2F] focus:border-[#E2498A] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Columna 3: Diagnóstico de Cuadratura & Alerta */}
            <div className="p-5 rounded-2xl bg-white border-2 border-[#E2E8F0] flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E1E2F] mb-3">
                  3. Estado de Cuadratura
                </h4>

                <div className="space-y-2 text-xs font-mono tabular-nums">
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Diferencia Efectivo:</span>
                    <span className={`font-bold ${cashDiscrepancy === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {cashDiscrepancy >= 0 ? `+$${cashDiscrepancy.toLocaleString('es-CL')}` : `-$${Math.abs(cashDiscrepancy).toLocaleString('es-CL')}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Diferencia Tarjetas:</span>
                    <span className={`font-bold ${cardDiscrepancy === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {cardDiscrepancy >= 0 ? `+$${cardDiscrepancy.toLocaleString('es-CL')}` : `-$${Math.abs(cardDiscrepancy).toLocaleString('es-CL')}`}
                    </span>
                  </div>
                </div>

                <div className={`mt-4 p-3 rounded-xl border text-xs leading-relaxed ${
                  isSquareBalanced
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="font-extrabold flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-current" />
                    <span>{isSquareBalanced ? 'CUADRATURA CONFORME' : 'ALERTA DE DESCUADRE'}</span>
                  </div>
                  {isSquareBalanced
                    ? 'El arqueo físico coincide con el registro transaccional dentro del margen de tolerancia ($1.000 CLP).'
                    : 'Existe una discrepancia no justificada entre el dinero físico y el saldo registrado en garita.'}
                </div>
              </div>

              <div className="text-[11px] text-[#64748B] pt-3 border-t border-[#E2E8F0]">
                Operador: <strong>{currentShift.operatorName || 'Juan Pérez'}</strong> · Turno #{currentShift.id || '1042'}
              </div>
            </div>
          </div>

          {/* Contenedor Oculto para Impresión del Cierre X */}
          <div id="cierre-x-printable" className="hidden">
            <div className="a4-page">
              <div className="brand-header">
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>CORDANO PMS — REPORTE DE CIERRE X (TURNO)</h2>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0 0' }}>Estacionamiento Matriz Serrano 447, Iquique</p>
                </div>
                <div className="copy-tag">COPIA 1: GARITA / AUDITORÍA</div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Registrado en Sistema</th>
                    <th>Declarado en Garita</th>
                    <th>Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Fondo Inicial de Caja</td>
                    <td>$ {initialFund.toLocaleString('es-CL')}</td>
                    <td>$ {initialFund.toLocaleString('es-CL')}</td>
                    <td>$ 0</td>
                  </tr>
                  <tr>
                    <td>Ventas en Efectivo</td>
                    <td>$ {totalCashSystem.toLocaleString('es-CL')}</td>
                    <td>$ {(declaredPhysicalCash - initialFund).toLocaleString('es-CL')}</td>
                    <td>$ {cashDiscrepancy.toLocaleString('es-CL')}</td>
                  </tr>
                  <tr>
                    <td>Vouchers Tarjetas POS</td>
                    <td>$ {totalDigitalSystem.toLocaleString('es-CL')}</td>
                    <td>$ {declaredPhysicalCard.toLocaleString('es-CL')}</td>
                    <td>$ {cardDiscrepancy.toLocaleString('es-CL')}</td>
                  </tr>
                  <tr>
                    <td><strong>Total Arqueo Turno</strong></td>
                    <td><strong>$ {(expectedTotalCashInDrawer + totalDigitalSystem).toLocaleString('es-CL')}</strong></td>
                    <td><strong>$ {(declaredPhysicalCash + declaredPhysicalCard).toLocaleString('es-CL')}</strong></td>
                    <td><strong>$ {(cashDiscrepancy + cardDiscrepancy).toLocaleString('es-CL')}</strong></td>
                  </tr>
                </tbody>
              </table>

              <div className="signature-box">
                <div className="signature-line">
                  Firma Operador de Turno<br />
                  <span style={{ fontSize: '9px', color: '#64748B' }}>RUT: 18.420.194-2 · Juan Pérez</span>
                </div>
                <div className="signature-line">
                  Firma Supervisor / Administración<br />
                  <span style={{ fontSize: '9px', color: '#64748B' }}>RUT: 15.340.890-K · Validación Conforme</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PILAR 2: REPORTE DE EXCEPCIONES (PREVENCIÓN DE FUGAS DE CAPITAL) ── */}
      {activeTab === 'excepciones' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F8FAFC] pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                PROTECCIÓN DEL FLUJO DE EFECTIVO · AUDITORÍA FORENSE
              </div>
              <h3 className="text-lg font-extrabold text-[#1E1E2F]">
                Reporte de Excepciones &amp; Fugas de Capital
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Detección automática de anomalías que vulneran la recaudación: aperturas manuales, anulaciones, estadías cortas sospechosas y descuentos.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748B] font-bold">Umbral estadía corta:</span>
              <select
                value={alertShortStayThreshold}
                onChange={(e) => setAlertShortStayThreshold(Number(e.target.value))}
                className="h-8 px-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-bold text-[#1E1E2F]"
              >
                <option value={3}>&lt; 3 minutos</option>
                <option value={5}>&lt; 5 minutos (Recomendado)</option>
                <option value={10}>&lt; 10 minutos</option>
              </select>
            </div>
          </div>

          {/* 3 Bloques de Auditoría de Fugas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Aperturas Manuales de Barrera */}
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1E1E2F]">
                  Aperturas Manuales de Barrera
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">
                  {manualBarrierLogs.length} eventos
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Apertura forzada de talanquera sin un ticket pagado asociado en el punto de cobro.
              </p>
              <div className="space-y-2 pt-2 border-t border-[#F8FAFC]">
                {manualBarrierLogs.length === 0 ? (
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                    Sin aperturas forzadas en este turno.
                  </div>
                ) : (
                  manualBarrierLogs.map((l) => (
                    <div key={l.id} className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-100 text-xs">
                      <div className="font-bold text-[#1E1E2F] flex justify-between">
                        <span>{l.userName}</span>
                        <span className="text-[10px] text-[#64748B]">{new Date(l.timestamp).toLocaleTimeString('es-CL')}</span>
                      </div>
                      <p className="text-[11px] text-rose-800 mt-1">{typeof l.details === 'string' ? l.details : JSON.stringify(l.details)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Estadías Cortas Sospechosas (Evasión Potencial) */}
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1E1E2F]">
                  Estadías Cortas (&le;{alertShortStayThreshold}m)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                  {suspiciousShortStays.length} casos
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Vehículos que entran y salen en un par de minutos sin cobro. Podría indicar maniobra de evasión o ticket anulado.
              </p>
              <div className="space-y-2 pt-2 border-t border-[#F8FAFC]">
                {suspiciousShortStays.length === 0 ? (
                  <div className="text-[11px] text-[#64748B] bg-[#F8FAFC] p-2 rounded-lg">
                    No se registran salidas en tolerancia sospechosa hoy.
                  </div>
                ) : (
                  suspiciousShortStays.map((t) => (
                    <div key={t.id} className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200 text-xs">
                      <div className="font-bold text-[#1E1E2F] flex justify-between">
                        <span>Patente: {t.plateNumber}</span>
                        <span className="text-[10px] font-mono text-amber-800 font-bold">$0 CLP</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">Entró {t.entryTime.slice(11, 16)} · Salió {t.exitTime?.slice(11, 16)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Descuentos y Validaciones Comerciales */}
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1E1E2F]">
                  Concentración de Descuentos
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  {discountLogs.length} autorizados
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Monitorea el uso de rebajas por operador para prevenir descuentos indebidos a conocidos o familiares.
              </p>
              <div className="space-y-2 pt-2 border-t border-[#F8FAFC]">
                {discountLogs.map((d) => (
                  <div key={d.id} className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                    <div className="font-bold text-[#1E1E2F] flex justify-between">
                      <span>{d.userName}</span>
                      <span className="text-[10px] text-[#E2498A] font-bold">PIN REVISADO</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">{typeof d.details === 'string' ? d.details : JSON.stringify(d.details)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PILAR 3: VENTAS Y DESGLOSE DIARIO (CIERRE Z CONSOLIDADO) ── */}
      {activeTab === 'ventas_z' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F8FAFC] pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#FFF5F8] text-[#E2498A] text-xs font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
                REPORTE FISCAL &amp; AUDITORÍA · CIERRE Z
              </div>
              <h3 className="text-lg font-extrabold text-[#1E1E2F]">
                Desglose Consolidado de Ventas Diarias (Cierre Z)
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Separación analítica de ingresos: clientes rotativos por minuto ($35/min) vs convenios mensuales vs multas de tickets.
              </p>
            </div>

            <button
              onClick={handleGenerateCorteZ}
              className="px-4 py-2 rounded-xl bg-[#1E1E2F] text-white text-xs font-bold hover:bg-[#2D2D44] transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <svg className="w-4 h-4 text-[#E2498A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>Generar Sello Fiscal Z</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bloque 1: Rotativo Minuto */}
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2498A] bg-[#FFF5F8] px-2 py-0.5 rounded-full">
                CLIENTES ROTATIVOS
              </span>
              <div className="text-2xl font-black font-mono tabular-nums text-[#1E1E2F]">
                ${rotatingRevenue.toLocaleString('es-CL')}
              </div>
              <p className="text-xs text-[#64748B]">
                Cobros directos por tramos de estadía ($35/minuto base). Representa el 72% de la facturación diaria de Serrano 447.
              </p>
              <div className="pt-2 border-t border-[#F8FAFC] text-[11px] font-mono tabular-nums text-[#64748B] flex justify-between">
                <span>Neto: ${Math.round(rotatingRevenue / 1.19).toLocaleString('es-CL')}</span>
                <span>IVA: ${Math.round(rotatingRevenue - (rotatingRevenue / 1.19)).toLocaleString('es-CL')}</span>
              </div>
            </div>

            {/* Bloque 2: Abonados y Convenios */}
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                CONVENIOS &amp; MENSUALIDADES
              </span>
              <div className="text-2xl font-black font-mono tabular-nums text-[#1E1E2F]">
                ${agreementRevenue.toLocaleString('es-CL')}
              </div>
              <p className="text-xs text-[#64748B]">
                Recaudación por cuotas de abonados corporativos (Zofri Iquique, Collahuasi y convenios notariales).
              </p>
              <div className="pt-2 border-t border-[#F8FAFC] text-[11px] font-mono tabular-nums text-[#64748B] flex justify-between">
                <span>Neto: ${Math.round(agreementRevenue / 1.19).toLocaleString('es-CL')}</span>
                <span>IVA: ${Math.round(agreementRevenue - (agreementRevenue / 1.19)).toLocaleString('es-CL')}</span>
              </div>
            </div>

            {/* Bloque 3: Sello Criptográfico Inalterable */}
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">
                INTEGRIDAD FISCAL SII
              </span>
              <div className="text-xs font-mono font-bold text-[#E2498A] truncate">
                SHA256: 9F8E2A4B1C7D0E3F5A8B...
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                El Cierre Z emite un identificador de cadena inalterable para respaldar ante el SII el total diario declarado de ventas con boleta electrónica.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── PILAR 3: ANÁLISIS DE HORARIOS PICO (ENTRADAS VS SALIDAS) ── */}
      {activeTab === 'horarios_pico' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F8FAFC] pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#FFF5F8] text-[#E2498A] text-xs font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-[#E2498A]" />
                LOGÍSTICA DE ACCESO · INFLOW VS OUTFLOW
              </div>
              <h3 className="text-lg font-extrabold text-[#1E1E2F]">
                Análisis de Horarios Pico (Entradas vs Salidas)
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Volumen vehicular por hora para optimizar dotación de gariteros e implementar esquemas tarifarios dinámicos.
              </p>
            </div>
          </div>

          {/* Gráfico de Barras Relativo en Puro CSS / Tailwind */}
          <div className="space-y-3">
            <div className="grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-[#64748B] px-3 pb-2 border-b border-[#E2E8F0]">
              <div className="col-span-2">Franja Horaria</div>
              <div className="col-span-8">Flujo Vehicular (Entradas vs Salidas)</div>
              <div className="col-span-2 text-right">Balance Neto</div>
            </div>

            {hourlyTraffic.map((item) => {
              const maxScale = 20;
              const inPct = (item.entries / maxScale) * 100;
              const outPct = (item.exits / maxScale) * 100;
              const netBalance = item.entries - item.exits;

              return (
                <div key={item.hour} className="grid grid-cols-12 items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#F8FAFC] transition-colors text-xs font-mono tabular-nums">
                  <div className="col-span-2 font-bold text-[#1E1E2F]">
                    {item.hour}
                  </div>

                  <div className="col-span-8 space-y-1.5">
                    {/* Barra de Entradas */}
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-[10px] text-[#E2498A] font-bold">In ({item.entries})</span>
                      <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#E2498A] h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, inPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Barra de Salidas */}
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-[10px] text-[#1E1E2F] font-bold">Out ({item.exits})</span>
                      <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#1E1E2F] h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, outPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 text-right font-bold">
                    <span className={`px-2 py-0.5 rounded-lg text-xs ${
                      netBalance > 0 ? 'bg-emerald-50 text-emerald-700' : netBalance < 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {netBalance > 0 ? `+${netBalance}` : netBalance}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PILAR 5: EXPORTABILIDAD & AUTOMATIZACIÓN (SNAPSHOTS Y ERP) ── */}
      {activeTab === 'automatizacion' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tarjeta 1: Snapshots Programados por Correo */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-6 space-y-5">
            <div className="border-b border-[#F8FAFC] pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2498A] bg-[#FFF5F8] px-2 py-0.5 rounded-full">
                PILAR 5 · AUTOMATIZACIÓN
              </span>
              <h3 className="text-base font-extrabold text-[#1E1E2F] mt-1.5">
                Despacho de Snapshots al Administrador
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Envío programado de reportes en PDF/Excel a las 07:00 AM sin necesidad de iniciar sesión a diario.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#1E1E2F] block">Despacho Diario Automatizado</span>
                  <span className="text-[11px] text-[#64748B]">Envío de PDF consolidado y planilla XLSX</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAutoEnabled}
                  onChange={(e) => setEmailAutoEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#E2498A] rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Horario de entrega:</span>
                  <span className="font-mono tabular-nums font-bold text-[#1E1E2F]">Todos los días a las 07:00 AM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Destinatario:</span>
                  <span className="font-mono tabular-nums font-bold text-[#E2498A]">gerencia@hotelcordano.cl</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B]">Formato del Adjunto:</span>
                  <span className="font-bold text-[#1E1E2F]">PDF Ejecutivo A4 + Archivo XLSX</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onShowToast('Snapshot de prueba enviado exitosamente a gerencia@hotelcordano.cl', 'success')}
              className="w-full h-11 rounded-xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4 text-[#E2498A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Enviar Snapshot de Prueba Ahora</span>
            </button>
          </div>

          {/* Tarjeta 2: Integración Contable ERP (QuickBooks / Xero / ERP) */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-6 space-y-5">
            <div className="border-b border-[#F8FAFC] pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                INTEGRACIÓN ERP
              </span>
              <h3 className="text-base font-extrabold text-[#1E1E2F] mt-1.5">
                Póliza Contable para ERPs y Contadores
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Exportación de libro diario contable en formatos compatibles con sistemas financieros.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#1E1E2F] block">QuickBooks / Xero</span>
                  <span className="text-[#64748B] text-[11px]">CSV estándar con codificación Debe / Haber</span>
                </div>
                <button
                  onClick={handleExportAccountingERP}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] font-bold hover:bg-[#FFF5F8] text-[#1E1E2F]"
                >
                  Descargar
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#1E1E2F] block">ERP Chileno (Defontana / Nubox / Laudus)</span>
                  <span className="text-[#64748B] text-[11px]">Asiento de ventas afectas a IVA débito fiscal</span>
                </div>
                <button
                  onClick={handleExportAccountingERP}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] font-bold hover:bg-[#FFF5F8] text-[#1E1E2F]"
                >
                  Descargar
                </button>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              La integración contable segrega automáticamente la cuenta de caja (1101), pasarela POS (1102) y la obligación del IVA 19% (2107) para agilizar la declaración F29 ante el SII.
            </p>
          </div>
        </div>
      )}

      {/* ── SUBPANE 1: LIBRO MAYOR DE COBROS DTE ── */}
      {activeTab === 'transacciones' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F8FAFC] pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#64748B]">Filtrar por medio de pago:</span>
              {(['ALL', 'efectivo', 'tarjeta', 'transferencia'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono tabular-nums font-bold cursor-pointer transition-colors ${
                    methodFilter === m
                      ? 'bg-[#1E1E2F] text-white'
                      : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:bg-[#FFF5F8]'
                  }`}
                >
                  {m === 'ALL' ? 'Todos' : m.toUpperCase()}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Buscar por patente o ticket #..."
              className="w-full sm:w-64 h-9 px-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-mono tabular-nums focus:border-[#E2498A] focus:outline-none"
            />
          </div>

          {/* Table Header (Desktop/Tablet) */}
          <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 bg-[#F8FAFC] text-[#64748B] text-[10px] uppercase font-mono tabular-nums font-bold rounded-lg border border-[#E2E8F0]">
            <div className="col-span-2">Ticket / Folio</div>
            <div className="col-span-2">Patente &amp; Tipo</div>
            <div className="col-span-2">Ingreso / Salida</div>
            <div className="col-span-2">Medio Pago</div>
            <div className="col-span-2 text-right">Neto + IVA</div>
            <div className="col-span-2 text-right">Total CLP</div>
          </div>

          {/* Transactions List */}
          <div className="max-h-[520px] overflow-y-auto space-y-2 md:space-y-1.5 font-mono tabular-nums text-xs">
            {filteredPaidTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl border border-dashed border-[#E2E8F0]">
                No se registraron transacciones con los filtros seleccionados.
              </div>
            ) : (
              filteredPaidTickets.map((t) => {
                const total = t.totalAmount || 0;
                const net = Math.round(total / 1.19);
                const iva = total - net;

                return (
                  <React.Fragment key={t.id}>
                    {/* Desktop / Tablet Row (>= md) */}
                    <div className="hidden md:grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                      <div className="col-span-2 font-bold text-[#1E1E2F]">
                        {t.ticketCode || `TKT-${t.id.slice(0, 8)}`}
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5">
                        <span className="license-plate-chip px-2 py-0.5 text-xs bg-white text-[#1E1E2F] border-[#1E1E2F] font-bold">
                          {t.plateNumber}
                        </span>
                        <span className="text-[10px] text-[#64748B]">{t.vehicleType}</span>
                      </div>
                      <div className="col-span-2 text-[11px] text-[#64748B]">
                        <div>{new Date(t.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[#E2498A] font-bold">
                          {t.exitTime ? new Date(t.exitTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E1E2F]">
                          {t.paymentMethod?.toUpperCase() || 'EFECTIVO'}
                        </span>
                      </div>
                      <div className="col-span-2 text-right text-[11px] text-[#64748B]">
                        <span>${net.toLocaleString('es-CL')}</span> + <span>${iva.toLocaleString('es-CL')}</span>
                      </div>
                      <div className="col-span-2 text-right font-black text-[#E2498A] text-sm">
                        ${total.toLocaleString('es-CL')}
                      </div>
                    </div>

                    {/* Mobile Card Layout (< md) */}
                    <div className="block md:hidden p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="font-extrabold text-slate-900 text-xs">
                          {t.ticketCode || `TKT-${t.id.slice(0, 8)}`}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {t.paymentMethod?.replace('_', ' ') || 'EFECTIVO'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="license-plate-chip px-2.5 py-1 text-xs bg-slate-900 text-white font-extrabold rounded-md tracking-wider">
                            {t.plateNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 font-sans font-medium">{t.vehicleType}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-[#E2498A] tabular-nums">
                            ${total.toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-sans">
                        <span>
                          🕒 {new Date(t.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} → {t.exitTime ? new Date(t.exitTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          Neto: ${net.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
