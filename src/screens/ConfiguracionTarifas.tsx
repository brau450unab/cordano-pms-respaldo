import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParking } from '../context/ParkingContext';
import { TariffConfig, VehicleType, Ticket } from '../types';
import { CordanoLogo } from '../components/CordanoLogo';
import { generateTariffPdf, printViaSystemDialog, generateTicketPdf } from '../utils/pdfGenerator';
import {
  Building2,
  Sliders,
  Printer,
  ShieldCheck,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  Sparkles,
  MapPin,
  RefreshCw,
  Download
} from 'lucide-react';

type SettingsTab = 'general' | 'tarifas' | 'impresora' | 'seguridad' | 'integraciones';

export const ConfiguracionTarifas: React.FC = () => {
  const { user, tariffConfig, updateTariffConfig } = useParking();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 1. General & Recinto
  const [companyName, setCompanyName] = useState('CORDANO PMS (ParkOps Iquique)');
  const [rutEmpresa, setRutEmpresa] = useState('76.892.340-K');
  const [address, setAddress] = useState('Serrano 447, Iquique, Tarapacá (Frente a Consulado Italiano)');
  const [totalCapacity, setTotalCapacity] = useState(30);
  const [autoAssignThreshold, setAutoAssignThreshold] = useState(6);
  const [stayWarningMinutes, setStayWarningMinutes] = useState(5);

  // 2. Motor de Tarifas
  const [formConfig, setFormConfig] = useState<TariffConfig>(tariffConfig);

  // 3. Impresora & POS
  const [printerPaperSize, setPrinterPaperSize] = useState<'58mm' | '80mm'>('58mm');
  const [ticketHeaderTitle, setTicketHeaderTitle] = useState('ESTACIONAMIENTO CORDANO');
  const [ticketFooterMessage, setTicketFooterMessage] = useState('Custodia vehicular asegurada. Conserve este comprobante.');
  const [autoPrintCheckin, setAutoPrintCheckin] = useState(true);
  const [enableBarcodeOnReceipt, setEnableBarcodeOnReceipt] = useState(true);

  // 4. Seguridad & PINs
  const [supervisorPin, setSupervisorPin] = useState('2026');
  const [forceBlindShiftClose, setForceBlindShiftClose] = useState(true);
  const [cashDifferenceTolerance, setCashDifferenceTolerance] = useState(1000);
  const [requirePinOnLostTicket, setRequirePinOnLostTicket] = useState(true);
  const [requirePinOnManualDiscount, setRequirePinOnManualDiscount] = useState(true);

  // 5. Integraciones
  const [googleSheetsSyncActive, setGoogleSheetsSyncActive] = useState(true);
  const [googleCloudProject, setGoogleCloudProject] = useState('gen-lang-client-0862587160');
  const [syncIntervalSeconds, setSyncIntervalSeconds] = useState(30);
  const [enableWhatsAppDigitalTicket, setEnableWhatsAppDigitalTicket] = useState(true);

  // Download states
  const [downloadingTariffPdf, setDownloadingTariffPdf] = useState(false);
  const [testingTicketPrint, setTestingTicketPrint] = useState(false);
  const [testTicketMessage, setTestTicketMessage] = useState('');

  const handleVehicleRateChange = (
    vType: VehicleType,
    field: 'minuteRate' | 'hourlyRate' | 'maxDailyRate',
    val: number
  ) => {
    setFormConfig((prev) => ({
      ...prev,
      vehicleRates: {
        ...prev.vehicleRates,
        [vType]: {
          ...prev.vehicleRates[vType],
          [field]: Math.max(0, val),
        },
      },
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      updateTariffConfig(formConfig);
      setIsSaving(false);
      setSuccessMessage('Parámetros actualizados y sincronizados.');
      setTimeout(() => setSuccessMessage(''), 3500);
    }, 500);
  };

  const handlePrintTariff = () => {
    printViaSystemDialog('printable-tariff-sheet', 'Tarifario_Oficial_Cordano');
  };

  const handleDownloadTariffPdf = () => {
    setDownloadingTariffPdf(true);
    try {
      generateTariffPdf(formConfig, {
        name: companyName,
        rut: rutEmpresa,
        address,
      });
      setSuccessMessage('PDF oficial generado exitosamente.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setDownloadingTariffPdf(false), 800);
    }
  };

  const handleTestPrintTicket = (asPdf: boolean) => {
    const mockTicket: Ticket = {
      id: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
      ticketCode: 'T-TEST-88',
      plateNumber: 'TEST-88',
      vehicleType: 'Automóvil',
      slotCode: 'A-01',
      entryTime: new Date(Date.now() - 45 * 60000).toISOString(),
      exitTime: new Date().toISOString(),
      status: 'pagado',
      durationMinutes: 45,
      subtotalAmount: (formConfig.vehicleRates['Automóvil']?.minuteRate || 35) * 45,
      totalAmount: (formConfig.vehicleRates['Automóvil']?.minuteRate || 35) * 45,
      paidAmount: (formConfig.vehicleRates['Automóvil']?.minuteRate || 35) * 45,
      paymentMethod: 'efectivo',
      operatorEntryName: user?.name || 'Operador de Turno',
      operatorExitName: user?.name || 'Operador de Turno',
      voucherNumber: 'REC-TEST-88',
    };

    if (asPdf) {
      setTestingTicketPrint(true);
      try {
        generateTicketPdf(mockTicket, printerPaperSize);
        setTestTicketMessage('PDF de ticket de prueba generado');
        setTimeout(() => setTestTicketMessage(''), 3000);
      } catch (e) {
        console.error(e);
      } finally {
        setTimeout(() => setTestingTicketPrint(false), 800);
      }
    } else {
      printViaSystemDialog('printable-test-ticket', `Ticket_Test_${mockTicket.id}`);
      setTestTicketMessage('Comprobante enviado al cuadro de impresión');
      setTimeout(() => setTestTicketMessage(''), 3000);
    }
  };

  const isSupervisor = user.role === 'administrador';

  if (!isSupervisor) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border border-slate-300 text-center space-y-4 tabular-nums">
        <div className="w-12 h-12 bg-slate-100 text-slate-900 rounded-lg flex items-center justify-center mx-auto border border-slate-300">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">[ ACCESO RESTRINGIDO ]</h2>
        <p className="text-xs text-slate-500 leading-relaxed font-sans">
          El panel de ajustes de sistema y reglas de negocio sólo puede ser configurado por usuarios con privilegios de Administrador.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Empresa & Recinto', icon: Building2 },
    { id: 'tarifas', label: 'Tarifas & Cobros', icon: Sliders },
    { id: 'impresora', label: 'Impresora & POS', icon: Printer },
    { id: 'seguridad', label: 'Seguridad & PINs', icon: ShieldCheck },
    { id: 'integraciones', label: 'Integraciones & Cloud', icon: FileSpreadsheet },
  ] as const;

  const vehicleTypesList: VehicleType[] = ['Automóvil', 'Camioneta', 'Motocicleta', 'Furgón / SUV'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 tabular-nums">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center border border-slate-900 shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-700 uppercase bg-slate-100 border border-slate-300 px-2 py-0.5 rounded inline-block">
                ERP GLOBAL SETTINGS
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                Serrano 447
              </span>
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
              Ajustes & Parámetros del Sistema
            </h1>
            <p className="text-xs text-slate-500">
              Centralización de recinto, motor tarifario, hardware POS y reglas de negocio
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrintTariff}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Tarifas</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadTariffPdf}
            disabled={downloadingTariffPdf}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer transition flex items-center space-x-2"
          >
            {downloadingTariffPdf ? (
              <Sparkles className="w-4 h-4 text-slate-500 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-slate-700" />
            )}
            <span>PDF Tarifario</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition flex items-center space-x-2 disabled:opacity-50 border border-slate-900"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Guardando...' : 'Guardar Parámetros'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-slate-100 border border-slate-300 rounded-lg flex items-center space-x-2.5 text-slate-900 text-xs tabular-nums font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs Navigation (Wireframe Tabs) */}
      <div className="flex flex-wrap gap-2 tabular-nums text-xs">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>[ {t.label} ]</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <form onSubmit={handleSave} className="space-y-6 tabular-nums text-xs">
        {/* 1. EMPRESA & RECINTO */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-slate-800" />
                <span>[ Identidad de Empresa & Configuración de Capacidad ]</span>
              </h3>
              <p className="text-slate-500 mt-0.5">Parámetros del recinto físico y umbrales de alerta logística</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Razón Social / Nombre Comercial</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:border-slate-800 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">RUT Empresa</label>
                <input
                  type="text"
                  value={rutEmpresa}
                  onChange={(e) => setRutEmpresa(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:border-slate-800 outline-none"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-slate-700 font-bold block">Dirección del Recinto</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:border-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <label className="text-slate-800 font-bold block">Capacidad Total de Cupos</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={totalCapacity}
                  onChange={(e) => setTotalCapacity(parseInt(e.target.value) || 30)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 font-bold text-sm bg-white text-slate-900 outline-none"
                />
                <span className="text-[10px] text-slate-500 block">30 cupos en Zonas A, B y C</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <label className="text-slate-800 font-bold block">Umbral de Auto-Asignación</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={autoAssignThreshold}
                  onChange={(e) => setAutoAssignThreshold(parseInt(e.target.value) || 6)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 font-bold text-sm bg-white text-slate-900 outline-none"
                />
                <span className="text-[10px] text-slate-500 block">Sugiere slot si quedan ≤ 6 cupos</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <label className="text-slate-800 font-bold block">Alerta Estadía Corta (Min)</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={stayWarningMinutes}
                  onChange={(e) => setStayWarningMinutes(parseInt(e.target.value) || 5)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 font-bold text-sm bg-white text-slate-900 outline-none"
                />
                <span className="text-[10px] text-slate-500 block">Advertencia visual ante &lt; 5 min</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. MOTOR DE TARIFAS */}
        {activeTab === 'tarifas' && (
          <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-slate-800" />
                <span>[ Tarifas por Minuto, Tolerancia y Penalizaciones ]</span>
              </h3>
              <p className="text-slate-500 mt-0.5">Las tarifas se congelan en cada ticket al momento del check-in</p>
            </div>

            {/* Global Policies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <label className="text-slate-800 font-bold block">Tiempo de Gracia (Minutos)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={formConfig.gracePeriodMinutes}
                    onChange={(e) =>
                      setFormConfig({ ...formConfig, gracePeriodMinutes: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 font-bold text-sm bg-white text-slate-900 outline-none"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">min</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Estadías &le; este tiempo no pagan</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <label className="text-slate-800 font-bold block">Multa Ticket Perdido ($ CLP)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    min="0"
                    value={formConfig.lostTicketFee}
                    onChange={(e) =>
                      setFormConfig({ ...formConfig, lostTicketFee: parseInt(e.target.value) || 0 })
                    }
                    className="w-full pl-6 pr-2.5 py-1.5 rounded-md border border-slate-300 font-bold text-sm bg-white text-slate-900 outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">Cargo por pérdida de ticket</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <label className="text-slate-800 font-bold block">Recargo Nocturno (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formConfig.nightSurchargePercent}
                    onChange={(e) =>
                      setFormConfig({ ...formConfig, nightSurchargePercent: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 font-bold text-sm bg-white text-slate-900 outline-none"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Aplica entre 22:00 y 07:00 hrs</span>
              </div>
            </div>

            {/* Vehicle Rates Grid */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                [ Tarifas por Categoría de Vehículo ]
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicleTypesList.map((vType) => (
                  <div key={vType} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-bold text-xs text-slate-900">{vType}</span>
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                        ${formConfig.vehicleRates[vType].minuteRate}/min
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-600 block mb-1">Valor Minuto ($)</label>
                        <input
                          type="number"
                          min="1"
                          value={formConfig.vehicleRates[vType].minuteRate}
                          onChange={(e) =>
                            handleVehicleRateChange(vType, 'minuteRate', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-2.5 py-1 rounded border border-slate-300 font-bold text-xs bg-white text-slate-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-600 block mb-1">Tope Diario ($)</label>
                        <input
                          type="number"
                          min="0"
                          value={formConfig.vehicleRates[vType].maxDailyRate}
                          onChange={(e) =>
                            handleVehicleRateChange(vType, 'maxDailyRate', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-2.5 py-1 rounded border border-slate-300 font-bold text-xs bg-white text-slate-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Printable Tariff Preview */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200 px-2 py-0.5 rounded inline-block">
                    DOCUMENTO VIGENTE LEY 20.956
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">
                    Tarifario Oficial del Día por Tramos (Vitrina & Recepción)
                  </h4>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Valores calculados en tiempo real para exhibición obligatoria al público y respaldo contable.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintTariff}
                    className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Tarifario</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTariffPdf}
                    disabled={downloadingTariffPdf}
                    className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar PDF</span>
                  </button>
                </div>
              </div>

              {/* Printable Format Container */}
              <div
                id="printable-tariff-sheet"
                className="p-5 bg-white rounded-lg border-2 border-slate-900 text-slate-900 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between pb-3 border-b-2 border-slate-900 gap-3">
                  <div className="flex items-center space-x-3">
                    <CordanoLogo size="md" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {companyName}
                      </h3>
                      <p className="text-xs text-slate-600">
                        RUT: <strong>{rutEmpresa}</strong> • Recinto: <strong>{address}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right tabular-nums">
                    <span className="inline-block px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded">
                      VIGENCIA: {new Date().toLocaleDateString('es-CL')}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Horario: 24/7 Continuo
                    </p>
                  </div>
                </div>

                {/* Table of Tramos */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-y-2 border-slate-900 text-slate-900 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2 px-2.5">Categoría</th>
                        <th className="py-2 px-2 text-center">Gracia ({formConfig.gracePeriodMinutes} min)</th>
                        <th className="py-2 px-2 text-right">Tarifa / Min</th>
                        <th className="py-2 px-2 text-right">Tramo 30m</th>
                        <th className="py-2 px-2 text-right">Tramo 1h</th>
                        <th className="py-2 px-2 text-right">Tramo 2h</th>
                        <th className="py-2 px-2 text-right">Tramo 3h</th>
                        <th className="py-2 px-2 text-right">Tramo 4h</th>
                        <th className="py-2 px-2.5 text-right bg-slate-200">Tope Día</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 tabular-nums">
                      {vehicleTypesList.map((vType) => {
                        const rate = formConfig.vehicleRates[vType];
                        const mRate = rate?.minuteRate || 0;
                        const maxDay = rate?.maxDailyRate || 0;
                        return (
                          <tr key={vType} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5 font-bold text-slate-900">
                              {vType}
                            </td>
                            <td className="py-2 px-2 text-center text-slate-700">
                              $0 (Gratis)
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-slate-900">
                              ${mRate.toLocaleString('es-CL')}
                            </td>
                            <td className="py-2 px-2 text-right text-slate-700">
                              ${(mRate * 30).toLocaleString('es-CL')}
                            </td>
                            <td className="py-2 px-2 text-right text-slate-700">
                              ${(mRate * 60).toLocaleString('es-CL')}
                            </td>
                            <td className="py-2 px-2 text-right text-slate-700">
                              ${(mRate * 120).toLocaleString('es-CL')}
                            </td>
                            <td className="py-2 px-2 text-right text-slate-700">
                              ${(mRate * 180).toLocaleString('es-CL')}
                            </td>
                            <td className="py-2 px-2 text-right text-slate-700">
                              ${(mRate * 240).toLocaleString('es-CL')}
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold bg-slate-100 text-slate-900">
                              ${maxDay.toLocaleString('es-CL')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Additional Policies & Conditions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-300 text-[11px] font-sans">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">
                      Condiciones & Recargos:
                    </span>
                    <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                      <li>Tolerancia de salida tras cobro: <strong>{formConfig.gracePeriodMinutes} minutos</strong> de cortesía.</li>
                      <li>Recargo Nocturno: <strong>{formConfig.nightSurchargePercent}%</strong> entre 22:00 y 07:00 hrs.</li>
                      <li>Ticket Perdido: <strong>${formConfig.lostTicketFee.toLocaleString('es-CL')} CLP</strong>.</li>
                    </ul>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">
                      Normativa Legal:
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      Tarifas calculadas al minuto efectivo sin redondeo al alza en tiempo, Ley N° 20.956. Valores incluyen IVA (19%).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. IMPRESORA & POS */}
        {activeTab === 'impresora' && (
          <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Printer className="w-4 h-4 text-slate-800" />
                <span>[ Impresión Térmica & Comprobantes Físicos ]</span>
              </h3>
              <p className="text-slate-500 mt-0.5">Formato de papel térmico, encabezados y emisión automática</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Ancho de Papel Térmico</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrinterPaperSize('58mm')}
                    className={`py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${
                      printerPaperSize === '58mm'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    58 mm (Estándar POS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrinterPaperSize('80mm')}
                    className={`py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${
                      printerPaperSize === '80mm'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    80 mm (Gran Formato)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Encabezado del Ticket</label>
                <input
                  type="text"
                  value={ticketHeaderTitle}
                  onChange={(e) => setTicketHeaderTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 outline-none"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-slate-700 font-bold block">Mensaje de Pie de Ticket (Garantía / Legal)</label>
                <input
                  type="text"
                  value={ticketFooterMessage}
                  onChange={(e) => setTicketFooterMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-2.5">
              <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPrintCheckin}
                  onChange={(e) => setAutoPrintCheckin(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Impresión Automática en Check-in</span>
                  <span className="text-[11px] text-slate-500">Dispara el diálogo de impresión al confirmar el ingreso vehicular</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableBarcodeOnReceipt}
                  onChange={(e) => setEnableBarcodeOnReceipt(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Código de Barras / QR en Comprobante</span>
                  <span className="text-[11px] text-slate-500">Incluye el identificador de ticket para lectura óptica</span>
                </div>
              </label>
            </div>

            {/* Test Print Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-slate-700" />
                    <span>Prueba de Impresión ({printerPaperSize})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Valida alineación térmica, salto de línea y legibilidad.
                  </p>
                </div>

                {testTicketMessage && (
                  <span className="text-[10px] font-bold text-slate-800 bg-slate-200 border border-slate-300 px-2 py-0.5 rounded">
                    ✓ {testTicketMessage}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTestPrintTicket(false)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Ticket de Prueba</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestPrintTicket(true)}
                  disabled={testingTicketPrint}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5 border border-slate-300"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Ticket en PDF</span>
                </button>
              </div>

              {/* Hidden printable test ticket element */}
              <div id="printable-test-ticket" className="hidden print:block p-4 text-black tabular-nums text-[11px] max-w-[280px] mx-auto text-center">
                <p className="font-bold text-sm tracking-wider">{ticketHeaderTitle}</p>
                <p className="text-[9px]">{companyName} - RUT: {rutEmpresa}</p>
                <p className="text-[9px]">{address}</p>
                <div className="border-t border-b border-dashed border-black my-2 py-1">
                  <p className="font-bold">*** TICKET DE PRUEBA ***</p>
                  <p>FECHA: {new Date().toLocaleDateString('es-CL')} {new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p>PATENTE: TEST-88</p>
                  <p>TIPO: Automóvil • SLOT-01</p>
                </div>
                <div className="my-2">
                  <p>TARIFA: ${formConfig.vehicleRates['Automóvil']?.minuteRate || 35}/min</p>
                  <p>TOTAL MINUTOS: 45 min</p>
                  <p className="font-bold text-sm">TOTAL COBRADO: ${((formConfig.vehicleRates['Automóvil']?.minuteRate || 35) * 45).toLocaleString('es-CL')} CLP</p>
                </div>
                <div className="border-t border-dashed border-black pt-2">
                  <p className="text-[9px]">{ticketFooterMessage}</p>
                  <p className="text-[8px] text-gray-500 mt-1">CORDANO PMS • PRUEBA HARDWARE POS</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. SEGURIDAD & PINS */}
        {activeTab === 'seguridad' && (
          <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-slate-800" />
                <span>[ Seguridad, PIN de Supervisor & Control de Arqueo ]</span>
              </h3>
              <p className="text-slate-500 mt-0.5">Parámetros de autorización para excepciones y reglas de cierre ciego</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">PIN Maestro de Supervisor (4 Dígitos)</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={4}
                    value={supervisorPin}
                    onChange={(e) => setSupervisorPin(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">Utilizado para anular tickets o aplicar descuentos</span>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Tolerancia Máxima Descuadre de Caja ($ CLP)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    min="0"
                    value={cashDifferenceTolerance}
                    onChange={(e) => setCashDifferenceTolerance(parseInt(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">Exige justificación obligatoria si se supera este monto</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-2.5">
              <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceBlindShiftClose}
                  onChange={(e) => setForceBlindShiftClose(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Forzar Cierre de Caja Ciego</span>
                  <span className="text-[11px] text-slate-500">Oculta el saldo esperado hasta declarar el conteo físico</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePinOnLostTicket}
                  onChange={(e) => setRequirePinOnLostTicket(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Exigir PIN para Ticket Perdido</span>
                  <span className="text-[11px] text-slate-500">Requiere validación de supervisor para cobrar con multa</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePinOnManualDiscount}
                  onChange={(e) => setRequirePinOnManualDiscount(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Exigir PIN para Descuentos Manuales</span>
                  <span className="text-[11px] text-slate-500">Registra en el Audit Trail el supervisor que autorizó la rebaja</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* 5. INTEGRACIONES & CLOUD */}
        {activeTab === 'integraciones' && (
          <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-slate-800" />
                <span>[ Integraciones con Google Cloud, Sheets & WhatsApp ]</span>
              </h3>
              <p className="text-slate-500 mt-0.5">Sincronización en la nube y servicios de mensajería al conductor</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Google Cloud Project ID</label>
                <input
                  type="text"
                  value={googleCloudProject}
                  onChange={(e) => setGoogleCloudProject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Intervalo de Sincronización (Segundos)</label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={syncIntervalSeconds}
                  onChange={(e) => setSyncIntervalSeconds(parseInt(e.target.value) || 30)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-2.5">
              <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={googleSheetsSyncActive}
                  onChange={(e) => setGoogleSheetsSyncActive(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Sincronización Activa con Google Sheets (11 Tablas)</span>
                  <span className="text-[11px] text-slate-500">Registra en tiempo real en la cuenta automatizable@gmail.com</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableWhatsAppDigitalTicket}
                  onChange={(e) => setEnableWhatsAppDigitalTicket(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Comprobante Digital vía WhatsApp (+569)</span>
                  <span className="text-[11px] text-slate-500">Envío del ticket QR al teléfono móvil registrado</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Footer Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition flex items-center space-x-2 disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Guardando...' : 'GUARDAR TODOS LOS PARÁMETROS'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
