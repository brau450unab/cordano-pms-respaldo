import React, { useState } from 'react';
import { useParking } from '../context/ParkingContext';
import { CORDANO_11_TABLES_SCHEMA } from '../types/databaseSchema';
import {
  requestGoogleAccessToken,
  createCordanoSpreadsheet,
  syncTableToGoogleSheet,
} from '../services/googleSheetsService';
import {
  Database,
  FileSpreadsheet,
  Download,
  Search,
  Layers,
  ExternalLink,
  Code,
  CloudUpload,
  Sparkles
} from 'lucide-react';

export const ExploradorBaseDatos: React.FC = () => {
  const { tickets, slots, currentShift, auditLogs, tariffConfig } = useParking();
  const [selectedTableKey, setSelectedTableKey] = useState<string>('Tickets');
  const [searchFilter, setSearchFilter] = useState('');

  // Google Sheets OAuth State
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [createdSpreadsheetUrl, setCreatedSpreadsheetUrl] = useState<string | null>(null);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  const selectedSchema = CORDANO_11_TABLES_SCHEMA[selectedTableKey];

  // Helper to generate dynamic table data based on current state
  const getTableRows = (key: string): Record<string, any>[] => {
    switch (key) {
      case 'Users':
        return [
          {
            id_usuario: 'USR-001',
            nombre_completo: 'María González',
            email: 'admin@cordano.cl',
            telefono: '+56987654321',
            rol: 'ADMINISTRADOR',
            pin_autorizacion: '****',
            estado_activo: true,
            fecha_creacion: '2026-01-15T08:00:00Z',
            ultimo_acceso_timestamp: new Date().toISOString(),
            location_id: 'Serrano 447 - Iquique',
          },
          {
            id_usuario: 'USR-002',
            nombre_completo: 'Juan Pérez',
            email: 'operador@cordano.cl',
            telefono: '+56912345678',
            rol: 'OPERADOR_VENDEDOR',
            pin_autorizacion: '****',
            estado_activo: true,
            fecha_creacion: '2026-02-01T08:00:00Z',
            ultimo_acceso_timestamp: new Date().toISOString(),
            location_id: 'Serrano 447 - Iquique',
          },
        ];

      case 'RolesPermissions':
        return [
          { id_permiso: 'PERM-01', rol: 'ADMIN', modulo_acceso: 'CONFIGURACION', nivel_acceso: 'Control Total', requiere_pin_admin: true },
          { id_permiso: 'PERM-02', rol: 'ADMIN', modulo_acceso: 'REPORTES', nivel_acceso: 'Control Total', requiere_pin_admin: false },
          { id_permiso: 'PERM-03', rol: 'OPERATOR', modulo_acceso: 'POS', nivel_acceso: 'Operación POS', requiere_pin_admin: false },
          { id_permiso: 'PERM-04', rol: 'OPERATOR', modulo_acceso: 'TURNO_CAJA', nivel_acceso: 'Operación POS', requiere_pin_admin: false },
          { id_permiso: 'PERM-05', rol: 'AUDITOR', modulo_acceso: 'AUDITORIA', nivel_acceso: 'Solo Lectura', requiere_pin_admin: false },
        ];

      case 'Customers':
        return [
          {
            id_cliente: 'CLI-101',
            nombre_cliente: 'Roberto Zúñiga',
            rut_dni: '14.521.890-K',
            telefono_contacto: '+56998761234',
            email_contacto: 'roberto@empresa.cl',
            consentimiento_whatsapp: true,
            tipo_cliente: 'Convenio_Mensual',
            patentes_asociadas: 'LK-84-21, BC-92-10',
            acumulado_visitas: 42,
            saldo_cuenta: 65000,
            ultima_visita_timestamp: '2026-08-31T18:45:00Z',
          },
          {
            id_cliente: 'CLI-102',
            nombre_cliente: 'Transportes Z-Mart Ltda',
            rut_dni: '76.432.100-2',
            telefono_contacto: '+56976543210',
            email_contacto: 'flotas@zmart.cl',
            consentimiento_whatsapp: false,
            tipo_cliente: 'Flota_Comercial',
            patentes_asociadas: 'HH-10-22, JK-99-44, LM-33-21',
            acumulado_visitas: 128,
            saldo_cuenta: 180000,
            ultima_visita_timestamp: '2026-08-31T20:10:00Z',
          },
        ];

      case 'Agreements':
        return [
          {
            id_convenio: 'CONV-01',
            id_cliente_asociado: 'CLI-101',
            nombre_convenio: 'Convenio Mensual Centro',
            patente_vehiculo: 'LK-84-21',
            tipo_descuento: 'TARIFA_PLANA_MENSUAL',
            cuota_mensual_clp: 45000,
            fecha_inicio_vigencia: '2026-08-01',
            fecha_fin_vigencia: '2026-09-30',
            estado_convenio: 'ACTIVO',
            permite_acceso_nocturno: true,
            limite_horas_dia: 24,
          },
        ];

      case 'Tariffs':
        return [
          {
            id_tarifa: 'TAR-01',
            nombre_tarifa: 'Tarifa Estándar Diurna 2026',
            tipo_vehiculo: 'Automóvil',
            valor_minuto_clp: tariffConfig.vehicleRates['Automóvil']?.minuteRate || 35,
            valor_hora_clp: 2100,
            minutos_tolerancia_gracia: tariffConfig.gracePeriodMinutes || 15,
            tope_maximo_dia_clp: tariffConfig.vehicleRates['Automóvil']?.maxDailyRate || 18000,
            recargo_nocturno_porcentaje: tariffConfig.nightSurchargePercent || 20,
            tarifa_perdida_ticket_clp: tariffConfig.lostTicketFee || 15000,
            vigente_desde: '2026-01-01',
            estado_activo: true,
          },
        ];

      case 'Slots':
        return slots.map((s) => ({
          id_slot: s.id,
          codigo_slot: s.code,
          zona: s.zone,
          estado_ocupacion: s.status,
          tipo_vehiculo_permitido: 'Automóvil / Camioneta',
          patente_actual: s.plateNumber || '',
          ticket_actual_id: s.currentTicketId || '',
          piso_nivel: 'Nivel 1 (Pista Central)',
          es_preferencial: s.zone.includes('Preferencial'),
          tiempo_ocupacion_minutos: s.status === 'ocupado' ? 45 : 0,
        }));

      case 'Tickets':
        return tickets.map((t) => ({
          id_ticket: t.id,
          codigo_ticket: t.ticketCode,
          patente: t.plateNumber,
          tipo_vehiculo: t.vehicleType,
          slot_asignado: t.slotCode,
          fecha_hora_ingreso: t.entryTime,
          fecha_hora_salida: t.exitTime || '',
          minutos_totales: t.durationMinutes || 0,
          tarifa_id_aplicada: 'TAR-01',
          monto_subtotal: t.subtotalAmount || 0,
          monto_descuento: t.discountAmount || 0,
          monto_total_pagado: t.totalAmount || 0,
          medio_pago: t.paymentMethod || '',
          operador_ingreso_id: t.operatorEntryName || 'USR-002',
          operador_salida_id: t.operatorExitName || '',
          estado_ticket: t.status,
          qr_code_hash: t.ticketCode + '-HASH',
          voucher_transbank_id: t.voucherNumber || '',
        }));

      case 'CashMovements':
        return [
          {
            id_movimiento_caja: 'MOV-001',
            id_turno_asociado: currentShift.id,
            timestamp: currentShift.startTime,
            tipo_movimiento: 'APERTURA_FONDO_INICIAL',
            monto_efectivo: currentShift.initialCash,
            id_usuario_responsable: currentShift.operatorId || 'USR-002',
            id_usuario_autorizador: 'ADMIN-01',
            motivo_detalle: 'Fondo de cambio inicial en monedas y billetes',
            voucher_respaldo_id: 'VOUCH-INIT',
          },
        ];

      case 'Shifts':
        return [
          {
            id_turno: currentShift.id,
            id_usuario_operador: currentShift.operatorId || 'USR-002',
            dispositivo_caja_id: 'POS-TERMINAL-01',
            fecha_hora_apertura: currentShift.startTime,
            fondo_inicial_efectivo: currentShift.initialCash,
            vouchers_heredados_tarjeta: 0,
            estado_turno: currentShift.status === 'abierto' ? 'Abierto' : 'Cerrado',
            fecha_hora_cierre: currentShift.endTime || '',
            declarado_efectivo_fisico: currentShift.declaredCash || 0,
            declarado_tarjetas_vouchers: currentShift.declaredCard || 0,
            declarado_transferencias: currentShift.declaredTransfer || 0,
            esperado_efectivo_sistema: currentShift.expectedCash || 0,
            esperado_tarjetas_sistema: currentShift.expectedCard || 0,
            esperado_transferencias_sistema: currentShift.expectedTransfer || 0,
            diferencia_efectivo: currentShift.discrepancyCash || 0,
            diferencia_total_caja: currentShift.discrepancyTotal || 0,
            estado_cuadratura: currentShift.discrepancyTotal === 0 ? 'CUADRADA' : 'DESCUADRE',
          },
        ];

      case 'AuditTrail':
        return auditLogs.map((log) => ({
          id_evento_auditoria: log.id,
          timestamp: log.timestamp,
          tipo_evento: log.action,
          nivel_criticidad: log.severity,
          id_usuario_solicitante: log.userId,
          id_admin_aprobador: log.authorizedBy || '',
          motivo_justificacion: log.details,
          entidad_afectada: log.action.includes('TICKET') ? 'TICKET' : 'CAJA',
          id_entidad_afectada: log.id,
        }));

      case 'SyncQueue':
        return [
          {
            id_local_sync: 'SYNC-001',
            idempotency_key: 'IDEMP-20260831-7781-TKT',
            tipo_operacion: 'CHECKIN_OFFLINE',
            payload_json: '{"patente": "JKLP34", "slot": "A-01"}',
            timestamp_creacion_local: '2026-08-31T21:15:00Z',
            estado_sincronizacion: 'SINCRONIZADO',
          },
        ];

      default:
        return [];
    }
  };

  const rows = getTableRows(selectedTableKey);

  const filteredRows = rows.filter((row) => {
    if (!searchFilter.trim()) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  const exportCurrentTableToCSV = () => {
    if (!selectedSchema) return;
    const headers = selectedSchema.columns.join(',');
    const csvRows = rows.map((r) =>
      selectedSchema.columns
        .map((col) => {
          const v = r[col] ?? '';
          const str = String(v).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    );

    const fullCsv = [headers, ...csvRows].join('\n');
    const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CORDANO_${selectedSchema.sheetName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAll11TablesAsJSON = () => {
    const allData: Record<string, any> = {};
    Object.keys(CORDANO_11_TABLES_SCHEMA).forEach((key) => {
      allData[key] = {
        meta: CORDANO_11_TABLES_SCHEMA[key],
        rows: getTableRows(key),
      };
    });

    const jsonStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'CORDANO_PMS_11_TABLAS_COMPLETAS.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConnectGoogleSheets = () => {
    setIsConnectingGoogle(true);
    setSyncStatusMessage('Abriendo autorización de Google...');
    try {
      requestGoogleAccessToken((tokenResponse) => {
        setIsConnectingGoogle(false);
        if (tokenResponse && tokenResponse.access_token) {
          setGoogleAccessToken(tokenResponse.access_token);
          setSyncStatusMessage('Conectado exitosamente con Google Sheets API');
          setTimeout(() => setSyncStatusMessage(null), 4000);
        } else {
          setSyncStatusMessage('No se concedieron permisos de acceso.');
        }
      });
    } catch (err: any) {
      setIsConnectingGoogle(false);
      setSyncStatusMessage('Error al inicializar Google Auth: ' + (err.message || 'Error'));
    }
  };

  const handleCreateAndSyncFullSpreadsheet = async () => {
    if (!googleAccessToken) {
      handleConnectGoogleSheets();
      return;
    }
    try {
      setIsConnectingGoogle(true);
      setSyncStatusMessage('Creando planilla en Google Drive con las 11 pestañas...');
      const created = await createCordanoSpreadsheet(googleAccessToken);
      setCreatedSpreadsheetUrl(created.spreadsheetUrl);

      setSyncStatusMessage('Poblando datos de las 11 tablas en Google Sheets...');
      for (const [key, schema] of Object.entries(CORDANO_11_TABLES_SCHEMA)) {
        const tableRows = getTableRows(key);
        await syncTableToGoogleSheet(
          googleAccessToken,
          created.spreadsheetId,
          schema.sheetName,
          tableRows,
          schema.columns
        );
      }

      setSyncStatusMessage('Sincronización completada exitosamente');
      setTimeout(() => setSyncStatusMessage(null), 6000);
    } catch (err: any) {
      setSyncStatusMessage('Error en la sincronización: ' + (err.message || 'Error'));
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 tabular-nums">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-700 uppercase bg-slate-100 border border-slate-300 px-2 py-0.5 rounded inline-block">
              ARQUITECTURA DE DATOS & GOOGLE SHEETS
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
              11 Tablas
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-1.5 flex items-center space-x-2">
            <Database className="w-5 h-5 text-slate-800" />
            <span>Base de Datos Operacional — CORDANO PMS</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Estructura alineada con el modelo relacional y hojas de cálculo para 30 cupos en Serrano 447, Iquique.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {createdSpreadsheetUrl ? (
            <a
              href={createdSpreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Abrir Google Sheet</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          ) : (
            <button
              onClick={handleCreateAndSyncFullSpreadsheet}
              disabled={isConnectingGoogle}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>{googleAccessToken ? 'Sincronizar Google Sheet' : 'Conectar Google Sheets'}</span>
            </button>
          )}

          <button
            onClick={exportCurrentTableToCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar CSV</span>
          </button>

          <button
            onClick={exportAll11TablesAsJSON}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Exportar JSON</span>
          </button>
        </div>
      </div>

      {/* Sync Status Alert Banner */}
      {syncStatusMessage && (
        <div className="bg-slate-100 text-slate-900 p-3 rounded-lg border border-slate-300 text-xs tabular-nums font-bold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-slate-700 animate-spin" />
            <span>{syncStatusMessage}</span>
          </div>
          {createdSpreadsheetUrl && (
            <a
              href={createdSpreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline flex items-center space-x-1"
            >
              <span>Ver Planilla</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 tabular-nums text-xs">
        
        {/* Left Col: 11 Tables Selector Menu */}
        <div className="lg:col-span-4 space-y-2 bg-white p-4 rounded-xl border border-slate-300 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-slate-700" />
              <span>[ 11 Tablas del Sistema ]</span>
            </h3>
            <span className="text-[10px] text-slate-500">PWA / Sheets</span>
          </div>

          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {Object.entries(CORDANO_11_TABLES_SCHEMA).map(([key, schema], idx) => {
              const isSelected = selectedTableKey === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedTableKey(key);
                    setSearchFilter('');
                  }}
                  className={`w-full text-left p-2 rounded-lg transition flex items-center justify-between group cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-700 border-transparent font-medium'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${isSelected ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                        {idx + 1}
                      </span>
                      <span className="text-xs">
                        {schema.title}
                      </span>
                    </div>
                    <p className={`text-[10px] line-clamp-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{schema.sheetName}</p>
                  </div>

                  <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {schema.columns.length} cols
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Col: Table Data Grid & Schema Inspector */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Active Table Header Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-700 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Hoja: {selectedSchema.sheetName}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  {selectedSchema.title}
                </h3>
                <p className="text-xs text-slate-500 font-sans">{selectedSchema.description}</p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-300">
                  {rows.length} registros
                </span>
              </div>
            </div>

            {/* Columns Pill List */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Columnas / Campos ({selectedSchema.columns.length}):
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedSchema.columns.map((col) => (
                  <span
                    key={col}
                    className="text-[10px] bg-slate-50 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative pt-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={`Buscar en ${selectedSchema.title}...`}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 outline-none focus:border-slate-800"
              />
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-300 z-10">
                  <tr>
                    {selectedSchema.columns.map((col) => (
                      <th
                        key={col}
                        className="py-2 px-3 text-slate-700 font-bold uppercase tracking-wider text-[10px] whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={selectedSchema.columns.length}
                        className="py-8 text-center text-slate-500"
                      >
                        No hay registros en esta tabla.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {selectedSchema.columns.map((col) => {
                          const val = row[col];
                          const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
                          return (
                            <td
                              key={col}
                              className="py-2 px-3 text-slate-800 whitespace-nowrap max-w-[200px] truncate"
                              title={strVal}
                            >
                              {strVal || '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
