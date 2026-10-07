import React, { useState } from 'react';
import { useParking } from '../context/ParkingContext';
import { AdminAuthModal } from '../components/AdminAuthModal';
import { generateTicketPdf, generateTariffPdf, printViaSystemDialog } from '../utils/pdfGenerator';
import { VehicleType, Ticket } from '../types';
import {
  Sliders,
  ShieldCheck,
  Building,
  Users,
  Save,
  CheckCircle2,
  Lock,
  Printer,
  ShieldAlert,
  Eye,
  EyeOff,
  Database,
  BarChart3,
  Car,
  DollarSign,
  Building2,
  Volume2,
  KeyRound,
  Download
} from 'lucide-react';

export const ConfiguracionSistema: React.FC = () => {
  const { user, setUserRole, tariffConfig } = useParking();

  const [recintoName, setRecintoName] = useState('Cordano Parking Ops - Central');
  const [rutFiscal, setRutFiscal] = useState('76.892.110-3');
  const [address, setAddress] = useState('Tarapacá #421, Iquique, Chile');
  const [printerModel, setPrinterModel] = useState('Térmica 80mm ESC/POS (USB/Red)');
  const [autoPrintTicket, setAutoPrintTicket] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [cutPaperAfterPrint, setCutPaperAfterPrint] = useState(true);
  const [testPrintSuccess, setTestPrintSuccess] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [downloadingTicketPdf, setDownloadingTicketPdf] = useState(false);
  const [downloadingTariffPdf, setDownloadingTariffPdf] = useState(false);

  // Admin Auth Modal for elevating role
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);

  const isAdmin = user.role === 'administrador';

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const getMockTicket = (): Ticket => ({
    id: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
    ticketCode: 'T-84920',
    plateNumber: 'TEST-77',
    vehicleType: 'Automóvil' as VehicleType,
    slotCode: 'A-03',
    entryTime: new Date(Date.now() - 35 * 60000).toISOString(),
    exitTime: new Date().toISOString(),
    status: 'pagado',
    durationMinutes: 35,
    subtotalAmount: (tariffConfig?.vehicleRates?.['Automóvil']?.minuteRate || 35) * 35,
    totalAmount: (tariffConfig?.vehicleRates?.['Automóvil']?.minuteRate || 35) * 35,
    paidAmount: (tariffConfig?.vehicleRates?.['Automóvil']?.minuteRate || 35) * 35,
    paymentMethod: 'efectivo',
    operatorEntryName: user?.name || 'Operador de Turno',
    operatorExitName: user?.name || 'Operador de Turno',
    voucherNumber: 'REC-TEST-77',
  });

  const handleTestPrintSystem = () => {
    printViaSystemDialog('printable-system-test-ticket', `Ticket_Test`);
    setTestPrintSuccess(true);
    setTimeout(() => setTestPrintSuccess(false), 3000);
  };

  const handleTestPrintPdf = () => {
    setDownloadingTicketPdf(true);
    try {
      const paperSize = printerModel.includes('58mm') ? '58mm' : '80mm';
      generateTicketPdf(getMockTicket(), paperSize);
      setTestPrintSuccess(true);
      setTimeout(() => setTestPrintSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setDownloadingTicketPdf(false), 800);
    }
  };

  const handlePrintTariffSheet = (asPdf: boolean) => {
    if (asPdf) {
      setDownloadingTariffPdf(true);
      try {
        if (tariffConfig) {
          generateTariffPdf(tariffConfig, {
            name: recintoName,
            rut: rutFiscal,
            address,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setTimeout(() => setDownloadingTariffPdf(false), 800);
      }
    } else {
      printViaSystemDialog('printable-system-tariff', 'Tarifas_Sistema_Cordano');
    }
  };

  const handleRoleChangeRequest = (newRole: 'operador' | 'administrador') => {
    if (newRole === 'administrador' && !isAdmin) {
      setShowAdminAuthModal(true);
    } else {
      setUserRole(newRole);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-slate-900">
      
      {/* Title Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-slate-700 uppercase bg-slate-100 px-2 py-0.5 rounded inline-block border border-slate-300">
            CONFIGURACIÓN & SEGURIDAD RBAC
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1.5 flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-slate-800" />
            <span>Configuración de Terminal & Matriz de Permisos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Control de hardware de pista, perfil de impresión y visibilidad de módulos vinculada por rol
          </p>
        </div>

        <div>
          <span className="inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded border border-slate-300 bg-slate-50 text-slate-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Perfil: {isAdmin ? 'Administrador / Supervisor' : 'Operador de Pista'}</span>
          </span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-slate-100 border border-slate-300 text-slate-900 rounded-lg text-xs font-mono font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
          <span>Configuración guardada correctamente en el sistema.</span>
        </div>
      )}

      {testPrintSuccess && (
        <div className="p-3 bg-slate-100 border border-slate-300 text-slate-900 rounded-lg text-xs font-mono font-bold flex items-center space-x-2">
          <Printer className="w-4 h-4 text-slate-700 shrink-0" />
          <span>Ticket de prueba enviado a la impresora ({printerModel}).</span>
        </div>
      )}

      {/* Role Notice Banner for Operator */}
      {!isAdmin && (
        <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 flex items-start space-x-3 font-mono">
          <div className="w-7 h-7 rounded bg-slate-200 text-slate-800 flex items-center justify-center shrink-0 mt-0.5 border border-slate-300">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-1 font-sans">
            <div className="font-bold text-slate-900 font-mono text-xs">
              [ SEGURIDAD & AISLAMIENTO DE MÓDULOS ACTIVO ]
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Como <strong>Operador de Turno</strong>, su terminal tiene habilitadas exclusivamente las herramientas para ejecutar operaciones de pista, iniciar turno, revisar clientes y consultar el estado del estacionamiento.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveConfig} className="space-y-6 font-mono text-xs">
        
        {/* Card 1: Hardware & Impresora */}
        <div className="bg-white rounded-xl border border-slate-300 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center space-x-2">
              <Printer className="w-4 h-4 text-slate-800" />
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                [ Impresora Térmica & Periféricos ]
              </h3>
            </div>
            <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              Operador & Admin
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Perfil de Impresora</label>
              <select
                value={printerModel}
                onChange={(e) => setPrinterModel(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-xs text-slate-900 bg-white outline-none cursor-pointer"
              >
                <option value="Térmica 80mm ESC/POS (USB/Red)">Térmica 80mm ESC/POS (USB/Red)</option>
                <option value="Térmica 58mm POS">Térmica 58mm POS (Compacta)</option>
                <option value="PDF Virtual / Diálogo del Sistema">PDF Virtual / Navegador</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Acciones de Verificación</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleTestPrintSystem}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestPrintPdf}
                  disabled={downloadingTicketPdf}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-300"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF Ticket</span>
                </button>
              </div>

              {/* Hidden printable element */}
              <div id="printable-system-test-ticket" className="hidden print:block p-4 text-black font-mono text-[11px] max-w-[280px] mx-auto text-center">
                <p className="font-bold text-sm tracking-wider">CORDANO PARKING OPS</p>
                <p className="text-[9px]">{recintoName} - RUT: {rutFiscal}</p>
                <p className="text-[9px]">{address}</p>
                <div className="border-t border-b border-dashed border-black my-2 py-1">
                  <p className="font-bold">*** TICKET DE PRUEBA POS ***</p>
                  <p>FECHA: {new Date().toLocaleDateString('es-CL')} {new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p>PATENTE: TEST-77</p>
                  <p>TIPO: Automóvil • SLOT-03</p>
                </div>
                <div className="my-2">
                  <p>TARIFA: ${tariffConfig?.vehicleRates?.['Automóvil']?.minuteRate || 35}/min</p>
                  <p>TIEMPO: 35 min</p>
                  <p className="font-bold text-sm">TOTAL: ${((tariffConfig?.vehicleRates?.['Automóvil']?.minuteRate || 35) * 35).toLocaleString('es-CL')} CLP</p>
                </div>
                <div className="border-t border-dashed border-black pt-2">
                  <p className="text-[8px] text-gray-500">CORDANO PMS • PRUEBA HARDWARE POS</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1 font-sans text-xs">
              <label className="flex items-center space-x-2 text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPrintTicket}
                  onChange={(e) => setAutoPrintTicket(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900"
                />
                <span>Imprimir ticket automáticamente al registrar ingreso vehicular</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cutPaperAfterPrint}
                  onChange={(e) => setCutPaperAfterPrint(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900"
                />
                <span>Comando de corte automático de papel térmico (Autocutter)</span>
              </label>
            </div>

            <div className="space-y-2 pt-1 font-sans text-xs">
              <label className="flex items-center space-x-2 text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundAlerts}
                  onChange={(e) => setSoundAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900"
                />
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sonido de confirmación al registrar entrada o salida</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Card 2: Matriz RBAC */}
        <div className="bg-white rounded-xl border border-slate-300 shadow-xs p-5 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-slate-800" />
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                [ Matriz de Permisos & Seguridad RBAC ]
              </h3>
            </div>
            <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              Activa
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Módulo</th>
                  <th className="py-2 px-3 text-center">Rol Operador</th>
                  <th className="py-2 px-3 text-center">Rol Administrador</th>
                  <th className="py-2 px-3">Criterio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-900">Iniciar Turno & Caja</td>
                  <td className="py-2 px-3 text-center text-slate-900 font-bold">Habilitado</td>
                  <td className="py-2 px-3 text-center text-slate-900 font-bold">Habilitado</td>
                  <td className="py-2 px-3 text-[11px] text-slate-500 font-sans">Apertura con desglose CLP</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-900">Ingreso & Salida POS</td>
                  <td className="py-2 px-3 text-center text-slate-900 font-bold">Habilitado</td>
                  <td className="py-2 px-3 text-center text-slate-900 font-bold">Habilitado</td>
                  <td className="py-2 px-3 text-[11px] text-slate-500 font-sans">Cobro por minuto y tickets</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-900">Plano de 30 Plazas</td>
                  <td className="py-2 px-3 text-center text-slate-900 font-bold">Habilitado</td>
                  <td className="py-2 px-3 text-center text-slate-900 font-bold">Habilitado</td>
                  <td className="py-2 px-3 text-[11px] text-slate-500 font-sans">Visualización en tiempo real</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-900">Clientes & Convenios</td>
                  <td className="py-2 px-3 text-center text-slate-700">Consulta</td>
                  <td className="py-2 px-3 text-center text-slate-900 font-bold">Control Total</td>
                  <td className="py-2 px-3 text-[11px] text-slate-500 font-sans">Validación de tarifas abonadas</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-900">Base de Datos (11 Tablas)</td>
                  <td className="py-2 px-3 text-center text-slate-400">Bloqueado</td>
                  <td className="py-2 px-3 text-center text-slate-900 font-bold">Habilitado</td>
                  <td className="py-2 px-3 text-[11px] text-slate-500 font-sans">Confidencial de gestión</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-900">Bitácora de Auditoría</td>
                  <td className="py-2 px-3 text-center text-slate-400">Bloqueado</td>
                  <td className="py-2 px-3 text-center text-slate-900 font-bold">Habilitado</td>
                  <td className="py-2 px-3 text-[11px] text-slate-500 font-sans">Trazabilidad inmutable</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-900">Dashboard de Recaudación</td>
                  <td className="py-2 px-3 text-center text-slate-400">Bloqueado</td>
                  <td className="py-2 px-3 text-center text-slate-900 font-bold">Habilitado</td>
                  <td className="py-2 px-3 text-[11px] text-slate-500 font-sans">Ingresos acumulados globales</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Datos del Recinto */}
        <div className="bg-white rounded-xl border border-slate-300 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-slate-800" />
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                [ Datos del Recinto & Membrete de Ticket ]
              </h3>
            </div>
            {!isAdmin && (
              <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Solo Lectura
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre del Recinto</label>
              <input
                type="text"
                value={recintoName}
                onChange={(e) => setRecintoName(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-xs text-slate-900 bg-white disabled:bg-slate-50 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">RUT Fiscal</label>
              <input
                type="text"
                value={rutFiscal}
                onChange={(e) => setRutFiscal(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-xs text-slate-900 bg-white disabled:bg-slate-50 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Dirección & Ciudad</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-xs text-slate-900 bg-white disabled:bg-slate-50 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Control de Acceso & Perfil */}
        <div className="bg-white rounded-xl border border-slate-300 shadow-xs p-5 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-slate-800" />
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                [ Control de Acceso & Perfil de Sesión ]
              </h3>
            </div>
            <span className="text-[10px] text-slate-500">
              ID: {user.id}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-slate-700">
              Usuario conectado: <strong>{user.name}</strong> ({user.role.toUpperCase()})
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleRoleChangeRequest('operador')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center space-x-1.5 ${
                  user.role === 'operador'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Perfil Operador</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChangeRequest('administrador')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center space-x-1.5 ${
                  user.role === 'administrador'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Perfil Administrador {!isAdmin && '(Requiere PIN)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider"
        >
          <Save className="w-4 h-4" />
          <span>{isAdmin ? 'Guardar Parámetros de Configuración' : 'Guardar Preferencias de Terminal'}</span>
        </button>

      </form>

      {/* Admin Authorization Modal */}
      <AdminAuthModal
        isOpen={showAdminAuthModal}
        onClose={() => setShowAdminAuthModal(false)}
        onSuccess={() => {
          setUserRole('administrador');
        }}
        title="Validación de Supervisor Requerida"
        reasonText="Para acceder al perfil de Administrador, ingrese la clave administrativa."
      />

    </div>
  );
};
