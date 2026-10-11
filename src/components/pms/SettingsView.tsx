import React, { useState } from 'react';
import { useParking } from '../../context/ParkingContext';
import { BillingModel, TaxDocumentType } from '../../types';

interface SettingsViewProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type SettingsSection = 'generales' | 'cuenta' | 'personal' | 'pos' | 'tarifas';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'operador' | 'administrador';
  canViewReports: boolean;
  canOverrideRates: boolean;
  canManageUsers: boolean;
  avatarUrl?: string;
  status: 'activo' | 'inactivo';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onShowToast }) => {
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
  } = useParking();

  // Active section on left sidebar
  const [activeSection, setActiveSection] = useState<SettingsSection>('generales');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // 1. Ajustes Generales State
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [themeColor, setThemeColor] = useState<'cordano-pink' | 'slate' | 'emerald'>('cordano-pink');
  const [fontSize, setFontSize] = useState<'normal' | 'grande' | 'compacta'>('normal');
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [preventAutoLogout, setPreventAutoLogout] = useState<boolean>(true);
  const [preventScreenOff, setPreventScreenOff] = useState<boolean>(true);

  // 2. Ajustes de Cuenta State
  const [accountName, setAccountName] = useState<string>(activeUser.name || 'Braulio AM');
  const [accountAvatar, setAccountAvatar] = useState<string>('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  const [accountEmail, setAccountEmail] = useState<string>(activeUser.email || 'operaciones@cordano.cl');
  const [notificationEmail, setNotificationEmail] = useState<string>('reportes@cordano.cl');

  // 3. Personal (Usuarios) State
  const [usersList, setUsersList] = useState<SystemUser[]>([
    {
      id: 'usr-1',
      name: 'Braulio AM',
      email: 'operaciones@cordano.cl',
      role: 'administrador',
      canViewReports: true,
      canOverrideRates: true,
      canManageUsers: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      status: 'activo',
    },
    {
      id: 'usr-2',
      name: 'Operador Garita 01',
      email: 'garita1@cordano.cl',
      role: 'operador',
      canViewReports: false,
      canOverrideRates: false,
      canManageUsers: false,
      status: 'activo',
    },
    {
      id: 'usr-3',
      name: 'Supervisor Serrano 447',
      email: 'supervisor@cordano.cl',
      role: 'administrador',
      canViewReports: true,
      canOverrideRates: true,
      canManageUsers: false,
      status: 'activo',
    },
  ]);

  const [selectedUserModal, setSelectedUserModal] = useState<SystemUser | null>(null);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'operador' | 'administrador'>('operador');
  const [newUserReports, setNewUserReports] = useState(false);
  const [newUserOverride, setNewUserOverride] = useState(false);

  // 4. POS & Parámetros de Turnos State
  const [posShiftStartMandatory, setPosShiftStartMandatory] = useState<string>('08:00');
  const [posShiftEndMandatory, setPosShiftEndMandatory] = useState<string>('20:00');
  const [posInitialCashFund, setPosInitialCashFund] = useState<number>(50000);
  const [tasksList, setTasksList] = useState<{ id: string; label: string; mandatory: boolean }[]>([
    { id: 't1', label: 'Verificar papel en impresora térmica 80mm', mandatory: true },
    { id: 't2', label: 'Reconteo de gaveta ($50.000 CLP)', mandatory: true },
    { id: 't3', label: 'Inspección de barrera de acceso vehicular', mandatory: true },
    { id: 't4', label: 'Revisión de cámaras y luminarias Serrano 447', mandatory: false },
  ]);
  const [newTaskInput, setNewTaskInput] = useState('');

  // 5. Tarifas CLP & Regulación Legal (Ley 20.967 / SII)
  const [billingModel, setBillingModel] = useState<BillingModel>(tariffConfig.billingModel || 'PER_MINUTE');
  const [taxDocumentType, setTaxDocumentType] = useState<TaxDocumentType>(tariffConfig.taxDocumentType || 39);
  const [rateSedan, setRateSedan] = useState(tariffConfig.vehicleRates['Automóvil']?.minuteRate || 40);
  const [rateSuv, setRateSuv] = useState(tariffConfig.vehicleRates['Camioneta']?.minuteRate || 50);
  const [rateMoto, setRateMoto] = useState(tariffConfig.vehicleRates['Motocicleta']?.minuteRate || 25);
  const [gracePeriod, setGracePeriod] = useState(tariffConfig.gracePeriodMinutes ?? 15);
  const [trancheSedan, setTrancheSedan] = useState(tariffConfig.subsequentTrancheRates?.['Automóvil'] || 400);
  const [trancheSuv, setTrancheSuv] = useState(tariffConfig.subsequentTrancheRates?.['Camioneta'] || 500);
  const [trancheMoto, setTrancheMoto] = useState(tariffConfig.subsequentTrancheRates?.['Motocicleta'] || 250);
  const [nightSurcharge, setNightSurcharge] = useState(tariffConfig.nightSurchargePercent || 20);
  const [weekendSurcharge, setWeekendSurcharge] = useState(tariffConfig.weekendSurchargePercent || 15);
  const [showAdvancedTariffs, setShowAdvancedTariffs] = useState<boolean>(false);

  // Navigation Guard: Check if unsaved changes exist before switching section
  const handleSelectSection = (section: SettingsSection) => {
    if (isDirty) {
      if (!confirm('Tiene cambios pendientes sin guardar. ¿Desea descartarlos y continuar? Pulse "Aceptar" para descartar o "Cancelar" para guardar primero.')) {
        return;
      }
    }
    setActiveSection(section);
    setIsDirty(false);
  };

  // Mark form as dirty when an input changes
  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // Save current settings section
  const handleSaveCurrentSection = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (activeSection === 'tarifas') {
      updateTariffConfig({
        ...tariffConfig,
        billingModel,
        taxDocumentType,
        gracePeriodMinutes: gracePeriod,
        nightSurchargePercent: nightSurcharge,
        weekendSurchargePercent: weekendSurcharge,
        vehicleRates: {
          'Automóvil': { minuteRate: rateSedan, hourlyRate: rateSedan * 60, maxDailyRate: 18000 },
          'Camioneta': { minuteRate: rateSuv, hourlyRate: rateSuv * 60, maxDailyRate: 22000 },
          'Motocicleta': { minuteRate: rateMoto, hourlyRate: rateMoto * 60, maxDailyRate: 10000 },
          'Furgón / SUV': { minuteRate: rateSuv, hourlyRate: rateSuv * 60, maxDailyRate: 22000 },
        },
        subsequentTrancheRates: {
          'Automóvil': trancheSedan,
          'Camioneta': trancheSuv,
          'Motocicleta': trancheMoto,
          'Furgón / SUV': trancheSuv,
        },
      });
    }

    setIsDirty(false);
    onShowToast(`Configuración de "${getSectionTitle(activeSection)}" guardada exitosamente conforme a Ley 20.967 y SII.`, 'success');
  };

  function getSectionTitle(section: SettingsSection): string {
    switch (section) {
      case 'generales': return 'Ajustes Generales';
      case 'cuenta': return 'Ajustes de Cuenta';
      case 'personal': return 'Personal & Usuarios';
      case 'pos': return 'Punto de Venta (POS) & Turnos';
      case 'tarifas': return 'Tarifario CLP & Operación';
    }
  }

  // Handle User Modal Save
  const handleSaveUserEdits = () => {
    if (!selectedUserModal) return;
    setUsersList((prev) =>
      prev.map((u) => (u.id === selectedUserModal.id ? selectedUserModal : u))
    );
    setSelectedUserModal(null);
    onShowToast(`Permisos del usuario ${selectedUserModal.name} actualizados.`, 'success');
  };

  // Handle Create User
  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      onShowToast('Complete el nombre y correo del usuario.', 'error');
      return;
    }
    const newUser: SystemUser = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      canViewReports: newUserReports,
      canOverrideRates: newUserOverride,
      canManageUsers: newUserRole === 'administrador',
      status: 'activo',
    };
    setUsersList((prev) => [...prev, newUser]);
    setIsCreateUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    onShowToast(`Usuario ${newUser.name} creado correctamente.`, 'success');
  };

  // ── RBAC GUARD: Bloqueo de acceso para Operadores (Principio de Menor Privilegio) ──
  if (activeUser?.role !== 'administrador') {
    return (
      <div id="view-settings-restricted" className="p-4 sm:p-8 max-w-4xl mx-auto min-h-[70vh] flex items-center justify-center font-sans">
        <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 text-center space-y-6 animate-fade-in-up">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-4xl shadow-xs">
            🛡️
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
              <span>RBAC CONTROL • NIVEL: OPERADOR</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1E2F] tracking-tight">
              Módulo Restringido a Administradores
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              El panel de configuraciones, alteración de matrices tarifarias y credenciales tributarias del SII exige credenciales con rol de <strong>Supervisor o Administrador</strong> para prevenir descalces operativos.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-400">Usuario Activo:</span>
              <span className="font-bold text-slate-800">{activeUser?.name || 'Operador'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-400">Rol Detectado:</span>
              <span className="font-mono font-bold text-amber-600 uppercase">OPERADOR (GARITA POS)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-400">Recinto Operativo:</span>
              <span className="font-medium text-slate-700">Serrano 447, Iquique</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Si requiere modificar las tarifas legales o usuarios, solicite el relevo o autentíquese con una cuenta administradora desde el menú de usuario.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="view-settings" className="p-4 sm:p-6 lg:p-8 w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 space-y-6 text-[#1E1E2F] animate-fade-in-up font-sans">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2E8F0] pb-4 gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5F8] border border-[#E2498A]/30 text-[#E2498A] text-xs font-bold mb-2">
            <span>PANEL CENTRALIZADO DE CONFIGURACIÓN</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1E2F]">
            Ajustes del Sistema &amp; Parámetros
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Recinto Serrano 447, Iquique • Infraestructura Cloud Run `us-west1`
          </p>
        </div>

        {isDirty && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold animate-pulse">
            <span>⚠ Cambios sin guardar</span>
          </div>
        )}
      </div>

      {/* ── CENTRALIZED SINGLE-VIEW LAYOUT: LEFT SIDEBAR + RIGHT CONTENT ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* LEFT VERTICAL SIDEBAR */}
        <aside className="md:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs p-3 space-y-1">
          {[
            { id: 'generales', label: 'Ajustes Generales', icon: '⚙' },
            { id: 'cuenta', label: 'Ajustes de Cuenta', icon: '👤' },
            { id: 'personal', label: 'Personal & Usuarios', icon: '👥' },
            { id: 'pos', label: 'Punto de Venta (POS)', icon: '🖥' },
            { id: 'tarifas', label: 'Tarifario CLP & Reglas', icon: '💰' },
          ].map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSection(item.id as SettingsSection)}
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

          <div className="pt-4 mt-4 border-t border-slate-100 px-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Modo Offline</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-slate-600">Forzar Contingencia (-O)</span>
              <button
                type="button"
                onClick={() => {
                  setIsOffline(!isOffline);
                  onShowToast(!isOffline ? 'Modo Offline (-O) activado.' : 'Conexión en línea reanudada.', 'info');
                }}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isOffline ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    isOffline ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT CONTENT PANEL (Loads in the same view) */}
        <div className="md:col-span-9 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-[#1E1E2F] tracking-tight">
              {getSectionTitle(activeSection)}
            </h3>

            <button
              type="button"
              onClick={() => handleSaveCurrentSection()}
              className="px-5 py-2.5 rounded-xl bg-[#E2498A] hover:bg-[#C83472] text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>💾</span>
              <span>Guardar Cambios</span>
            </button>
          </div>

          {/* ── 1. AJUSTES GENERALES ── */}
          {activeSection === 'generales' && (
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dark Mode */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Modo Oscuro (Dark Theme)</span>
                    <span className="text-[11px] text-slate-500">Ajusta la paleta de la interfaz para garita nocturna</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => { setDarkMode(e.target.checked); markDirty(); }}
                    className="w-5 h-5 accent-[#E2498A] cursor-pointer"
                  />
                </div>

                {/* High Contrast */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Modo de Alto Contraste</span>
                    <span className="text-[11px] text-slate-500">Maximiza visibilidad bajo luz solar directa</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={(e) => { setHighContrast(e.target.checked); markDirty(); }}
                    className="w-5 h-5 accent-[#E2498A] cursor-pointer"
                  />
                </div>

                {/* Keep-alive */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Prevenir Cierre de Sesión</span>
                    <span className="text-[11px] text-slate-500">Evita logout automático por inactividad del operador</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preventAutoLogout}
                    onChange={(e) => { setPreventAutoLogout(e.target.checked); markDirty(); }}
                    className="w-5 h-5 accent-[#E2498A] cursor-pointer"
                  />
                </div>

                {/* Wake Lock */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Prevenir Apagado de Pantalla (WakeLock)</span>
                    <span className="text-[11px] text-slate-500">Mantiene la pantalla del tótem y POS siempre activa</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preventScreenOff}
                    onChange={(e) => { setPreventScreenOff(e.target.checked); markDirty(); }}
                    className="w-5 h-5 accent-[#E2498A] cursor-pointer"
                  />
                </div>

                {/* Atajos de Teclado Físico (F1 - F10 / Ctrl+K) con Tooltip */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between sm:col-span-2">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs">Atajos de Teclado Físico (F1 - F10 / Ctrl+K)</span>
                      <div className="relative group inline-block">
                        <button
                          type="button"
                          className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 hover:bg-[#E2498A] hover:text-white flex items-center justify-center text-[10px] font-bold cursor-help transition-colors"
                          aria-label="Explicación de atajos de teclado"
                        >
                          ?
                        </button>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-3 bg-slate-900 text-white text-[11px] rounded-2xl shadow-2xl pointer-events-none z-30 font-sans leading-relaxed">
                          <div className="font-black text-pink-300 mb-1 flex items-center gap-1">
                            <span>⌨️</span> Atajos Globales de Garita
                          </div>
                          Habilita la captura rápida de teclas: <strong>F1</strong> (Dashboard), <strong>F2</strong> (Ingreso POS), <strong>F3</strong> (Convenios), <strong>F4</strong> (Cobro Salida), <strong>F8</strong> (Impresión térmica), <strong>F9</strong> (Pulso barrera) y <strong>Ctrl+K</strong> (Buscar).<br/><br/>
                          <span className="text-slate-300">💡 <strong>Recomendación</strong>: Desactívalo si utilizas notebooks o laptops donde las teclas de función colisionan con el brillo, volumen o atajos del navegador.</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {keyboardShortcutsEnabled
                        ? 'Activado: Las teclas de función operan directamente la garita.'
                        : 'Desactivado: Teclas de función liberadas para el sistema operativo y navegador.'}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${keyboardShortcutsEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {keyboardShortcutsEnabled ? 'Activo' : 'Inactivo'}
                    </span>
                    <input
                      type="checkbox"
                      checked={keyboardShortcutsEnabled}
                      onChange={(e) => {
                        setKeyboardShortcutsEnabled(e.target.checked);
                        markDirty();
                        onShowToast(
                          e.target.checked
                            ? 'Atajos de teclado activados (F1-F10).'
                            : 'Atajos de teclado desactivados.',
                          'info'
                        );
                      }}
                      className="w-5 h-5 accent-[#E2498A] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Theme & Font Size Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px]">Tema Corporativo</label>
                  <select
                    value={themeColor}
                    onChange={(e) => { setThemeColor(e.target.value as any); markDirty(); }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:border-[#E2498A] focus:outline-none cursor-pointer"
                  >
                    <option value="cordano-pink">Rosa Cordano Oficial (#E2498A)</option>
                    <option value="slate">Gris Corporativo Slate (#1E1E2F)</option>
                    <option value="emerald">Verde Operativo Emerald (#059669)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px]">Tamaño de Tipografía</label>
                  <select
                    value={fontSize}
                    onChange={(e) => { setFontSize(e.target.value as any); markDirty(); }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:border-[#E2498A] focus:outline-none cursor-pointer"
                  >
                    <option value="normal">Normal (Estándar 14px/16px)</option>
                    <option value="grande">Grande (Accesibilidad 16px/18px)</option>
                    <option value="compacta">Compacta (Tótem táctil 12px/14px)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. AJUSTES DE CUENTA ── */}
          {activeSection === 'cuenta' && (
            <div className="space-y-5 text-xs">
              <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <img
                  src={accountAvatar}
                  alt="Avatar"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#E2498A]"
                />
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 text-sm">{accountName}</span>
                  <p className="text-slate-500 text-[11px]">Rol actual: {activeUser.role.toUpperCase()} (Serrano 447)</p>
                  <input
                    type="text"
                    value={accountAvatar}
                    onChange={(e) => { setAccountAvatar(e.target.value); markDirty(); }}
                    placeholder="URL de foto de perfil"
                    className="w-72 h-8 px-2 rounded-lg border border-slate-200 bg-white text-[11px] font-mono focus:outline-none focus:border-[#E2498A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[11px]">Nombre de la Cuenta</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => { setAccountName(e.target.value); markDirty(); }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:border-[#E2498A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[11px]">Correo Electrónico Asociado</label>
                  <input
                    type="email"
                    value={accountEmail}
                    onChange={(e) => { setAccountEmail(e.target.value); markDirty(); }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono focus:border-[#E2498A] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[11px]">
                    Correo para Recepción de Notificaciones y Cierres Z
                  </label>
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => { setNotificationEmail(e.target.value); markDirty(); }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono focus:border-[#E2498A] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── 3. PERSONAL & USUARIOS ── */}
          {activeSection === 'personal' && (
            <div className="space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Usuarios con Acceso al Sistema</h4>
                  <p className="text-slate-500 text-[11px]">Gestione roles de cajero/operario y permisos especiales de administración</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>+</span>
                  <span>Crear Nuevo Usuario</span>
                </button>
              </div>

              {/* Lista en formato Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {usersList.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUserModal(u)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-[#E2498A]/60 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {u.role.toUpperCase()}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <h5 className="font-black text-slate-900 group-hover:text-[#E2498A] transition-colors">
                        {u.name}
                      </h5>
                      <p className="text-[11px] font-mono text-slate-500 truncate">{u.email}</p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span>Reportes Z: {u.canViewReports ? 'Habilitado' : 'Bloqueado'}</span>
                      <span className="text-[#E2498A] font-bold">Editar ➔</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 4. PUNTO DE VENTA (POS) & TURNOS ── */}
          {activeSection === 'pos' && (
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[11px]">
                    Fondo de Caja Inicial ($ CLP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={posInitialCashFund}
                    onChange={(e) => { setPosInitialCashFund(parseInt(e.target.value) || 0); markDirty(); }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold focus:border-[#E2498A] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Monto predeterminado al abrir turno</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[11px]">
                    Horario Entrada Turno Diurno
                  </label>
                  <input
                    type="time"
                    value={posShiftStartMandatory}
                    onChange={(e) => { setPosShiftStartMandatory(e.target.value); markDirty(); }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold focus:border-[#E2498A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase text-[11px]">
                    Horario Salida Turno Diurno
                  </label>
                  <input
                    type="time"
                    value={posShiftEndMandatory}
                    onChange={(e) => { setPosShiftEndMandatory(e.target.value); markDirty(); }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold focus:border-[#E2498A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Tareas Obligatorias del Operario (Checklist) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm">Lista de Tareas Obligatorias al Iniciar Turno</h4>
                  <span className="text-[11px] text-slate-500">{tasksList.length} tareas activas</span>
                </div>

                <div className="space-y-2">
                  {tasksList.map((task) => (
                    <div key={task.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span className="font-semibold text-slate-700">{task.label}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${task.mandatory ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>
                        {task.mandatory ? 'OBLIGATORIA' : 'OPCIONAL'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    placeholder="Añadir nueva tarea para el checklist de apertura..."
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-white focus:border-[#E2498A] focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newTaskInput.trim()) return;
                      setTasksList((prev) => [...prev, { id: `task-${Date.now()}`, label: newTaskInput.trim(), mandatory: true }]);
                      setNewTaskInput('');
                      markDirty();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#1E1E2F] hover:bg-[#2D2D44] text-white font-bold text-xs"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── 5. TARIFARIO CLP & REGLAS LEGALES (LEY 20.967 & SII) ── */}
          {activeSection === 'tarifas' && (
            <div className="space-y-6 text-xs">
              
              {/* Resumen Ejecutivo de Alto Nivel (Progressive Disclosure - High Level Overview) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Modalidad Vigente</span>
                  <div className="text-xs font-black text-[#1E1E2F] mt-0.5 truncate">
                    {billingModel === 'PER_MINUTE' ? 'Minuto Efectivo Lineal' : 'Tramos (30m + 10m)'}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Conforme Ley 20.967</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Perfil Tributario SII</span>
                  <div className="text-xs font-black text-[#1E1E2F] mt-0.5">
                    {taxDocumentType === 39 ? 'Boleta Afecta (Tipo 39)' : 'Boleta Exenta (Tipo 41)'}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">IVA 19% desglosado</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Período de Gracia</span>
                  <div className="text-xs font-black font-mono text-[#E2498A] mt-0.5 tabular-nums">
                    {gracePeriod} min libres
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Costo $0 inicial</span>
                </div>
              </div>

              {/* TARJETA UNIFICADA DE ESTRUCTURACIÓN TARIFARIA */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#1E1E2F] tracking-tight">
                      Matriz de Cobro &amp; Parámetros Base
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Configure la modalidad legal, tiempo libre de cortesía y valores por categoría vehicular.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                    ⚖️ REDONDEO FLOOR ACTIVO
                  </span>
                </div>

                {/* Selectores de Modalidad Legal y DTE con Tooltips Explicativos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        Modalidad Legal de Liquidación *
                      </label>
                      <span 
                        className="w-4 h-4 rounded-full bg-slate-200 hover:bg-[#E2498A] hover:text-white text-slate-600 font-mono text-[10px] font-black flex items-center justify-center cursor-help transition-colors"
                        title="Ley N° 20.967: Prohíbe tarifas arbitrarias. Solo permite Minuto Efectivo Lineal (sin redondeo de rangos) o Tramo Vencido (primer tramo >= 30 min y siguientes <= 10 min)."
                      >
                        ?
                      </span>
                    </div>
                    <select
                      value={billingModel}
                      onChange={(e) => {
                        setBillingModel(e.target.value as BillingModel);
                        markDirty();
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:border-[#E2498A] focus:bg-white focus:outline-none transition-colors"
                    >
                      <option value="PER_MINUTE">1. Cobro por Minuto Efectivo (Lineal)</option>
                      <option value="TRANCHE_30_10">2. Cobro por Tramos Vencidos (30 min base + 10 min)</option>
                    </select>
                    <span className="text-[10px] text-slate-400 block">
                      {billingModel === 'PER_MINUTE'
                        ? 'Cálculo lineal continuo: tiempo exacto × valor minuto.'
                        : 'Exige bloque base mínimo de 30 min y saltos sucesivos no mayores a 10 min.'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        Tipo de Comprobante DTE (SII) *
                      </label>
                      <span 
                        className="w-4 h-4 rounded-full bg-slate-200 hover:bg-[#E2498A] hover:text-white text-slate-600 font-mono text-[10px] font-black flex items-center justify-center cursor-help transition-colors"
                        title="Normativa SII: Boleta Tipo 39 aplica para ventas gravadas con 19% IVA (comercio general). Boleta Tipo 41 aplica a operaciones expresamente exentas de IVA (concesiones municipales específicas o salud)."
                      >
                        ?
                      </span>
                    </div>
                    <select
                      value={taxDocumentType}
                      onChange={(e) => {
                        setTaxDocumentType(parseInt(e.target.value) as TaxDocumentType);
                        markDirty();
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 focus:border-[#E2498A] focus:bg-white focus:outline-none transition-colors"
                    >
                      <option value={39}>Boleta Electrónica Afecta (Tipo 39 - Con 19% IVA)</option>
                      <option value={41}>Boleta Electrónica No Afecta / Exenta (Tipo 41)</option>
                    </select>
                    <span className="text-[10px] text-slate-400 block">
                      Define la estructura XML para la transmisión diferida hacia el SII.
                    </span>
                  </div>
                </div>

                {/* Tabla de Tarifas por Categoría (Alineación numéricamente estricta a la derecha) */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-800">
                      Valores Monetarios por Categoría (CLP)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Valores con IVA incluido</span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Categoría de Vehículo</th>
                          <th className="py-2.5 px-3 text-right">Tarifa Base (CLP/min)</th>
                          {billingModel === 'TRANCHE_30_10' && (
                            <th className="py-2.5 px-3 text-right">Tramo 10 min (CLP)</th>
                          )}
                          <th className="py-2.5 px-3 text-right">Tope Diario Máx</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
                        <tr>
                          <td className="py-3 px-3 font-bold text-slate-800">Auto / Sedán</td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <span className="text-slate-400 font-mono">$</span>
                              <input
                                type="number"
                                value={rateSedan}
                                onChange={(e) => { setRateSedan(parseInt(e.target.value) || 0); markDirty(); }}
                                className="w-20 h-8 px-2 rounded-lg border border-slate-200 bg-white font-mono font-black text-right text-xs focus:border-[#E2498A] focus:outline-none tabular-nums"
                              />
                            </div>
                          </td>
                          {billingModel === 'TRANCHE_30_10' && (
                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <span className="text-slate-400 font-mono">$</span>
                                <input
                                  type="number"
                                  value={trancheSedan}
                                  onChange={(e) => { setTrancheSedan(parseInt(e.target.value) || 0); markDirty(); }}
                                  className="w-20 h-8 px-2 rounded-lg border border-amber-300 bg-amber-50/40 font-mono font-black text-right text-xs focus:border-[#E2498A] focus:outline-none tabular-nums"
                                />
                              </div>
                            </td>
                          )}
                          <td className="py-3 px-3 text-right font-mono font-semibold text-slate-500 tabular-nums">$ 18.000</td>
                        </tr>

                        <tr>
                          <td className="py-3 px-3 font-bold text-slate-800">Camioneta / SUV</td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <span className="text-slate-400 font-mono">$</span>
                              <input
                                type="number"
                                value={rateSuv}
                                onChange={(e) => { setRateSuv(parseInt(e.target.value) || 0); markDirty(); }}
                                className="w-20 h-8 px-2 rounded-lg border border-slate-200 bg-white font-mono font-black text-right text-xs focus:border-[#E2498A] focus:outline-none tabular-nums"
                              />
                            </div>
                          </td>
                          {billingModel === 'TRANCHE_30_10' && (
                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <span className="text-slate-400 font-mono">$</span>
                                <input
                                  type="number"
                                  value={trancheSuv}
                                  onChange={(e) => { setTrancheSuv(parseInt(e.target.value) || 0); markDirty(); }}
                                  className="w-20 h-8 px-2 rounded-lg border border-amber-300 bg-amber-50/40 font-mono font-black text-right text-xs focus:border-[#E2498A] focus:outline-none tabular-nums"
                                />
                              </div>
                            </td>
                          )}
                          <td className="py-3 px-3 text-right font-mono font-semibold text-slate-500 tabular-nums">$ 22.000</td>
                        </tr>

                        <tr>
                          <td className="py-3 px-3 font-bold text-slate-800">Motocicleta</td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <span className="text-slate-400 font-mono">$</span>
                              <input
                                type="number"
                                value={rateMoto}
                                onChange={(e) => { setRateMoto(parseInt(e.target.value) || 0); markDirty(); }}
                                className="w-20 h-8 px-2 rounded-lg border border-slate-200 bg-white font-mono font-black text-right text-xs focus:border-[#E2498A] focus:outline-none tabular-nums"
                              />
                            </div>
                          </td>
                          {billingModel === 'TRANCHE_30_10' && (
                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <span className="text-slate-400 font-mono">$</span>
                                <input
                                  type="number"
                                  value={trancheMoto}
                                  onChange={(e) => { setTrancheMoto(parseInt(e.target.value) || 0); markDirty(); }}
                                  className="w-20 h-8 px-2 rounded-lg border border-amber-300 bg-amber-50/40 font-mono font-black text-right text-xs focus:border-[#E2498A] focus:outline-none tabular-nums"
                                />
                              </div>
                            </td>
                          )}
                          <td className="py-3 px-3 text-right font-mono font-semibold text-slate-500 tabular-nums">$ 10.000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Período de Gracia & Exención Legal con Tooltips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-700">Tiempo de Gracia Inicial</span>
                        <span
                          className="w-4 h-4 rounded-full bg-slate-200 hover:bg-[#E2498A] hover:text-white text-slate-600 font-mono text-[10px] font-black flex items-center justify-center cursor-help transition-colors"
                          title="Tolerancia legal de permanencia: si la duración total de estadía es menor o igual a este tiempo, el vehículo sale a costo $0 CLP."
                        >
                          ?
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">Minutos libres antes de iniciar cobro</span>
                    </div>
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        value={gracePeriod}
                        onChange={(e) => { setGracePeriod(parseInt(e.target.value) || 0); markDirty(); }}
                        className="w-16 h-8 px-2 rounded-lg border border-slate-200 bg-white font-mono font-black text-right text-xs focus:border-[#E2498A] focus:outline-none tabular-nums"
                      />
                      <span className="text-[10px] text-slate-500 font-bold">min</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-emerald-900">Ticket Extraviado (Ley 20.967)</span>
                        <span
                          className="w-4 h-4 rounded-full bg-emerald-200 hover:bg-emerald-600 hover:text-white text-emerald-800 font-mono text-[10px] font-black flex items-center justify-center cursor-help transition-colors"
                          title="El artículo 15 de la Ley N° 20.967 prohíbe multas fijas por pérdida de comprobante. El operador debe buscar la patente en el sistema y cobrar únicamente los minutos efectivos de uso real."
                        >
                          ?
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-700">Prohibición de multas fijas</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-mono font-bold text-[10px]">
                      PATENTE REAL
                    </span>
                  </div>
                </div>

                {/* REVELACIÓN PROGRESIVA: CONFIGURACIÓN AVANZADA (Progressive Disclosure Toggle) */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedTariffs(!showAdvancedTariffs)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span>⚙</span>
                      <span>Configuración Avanzada (Recargos Horarios &amp; Tolerancias)</span>
                    </div>
                    <span className="text-slate-400 font-mono">{showAdvancedTariffs ? '▲ Ocultar' : '▼ Expandir'}</span>
                  </button>

                  {showAdvancedTariffs && (
                    <div className="mt-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4 animate-fade-in-up">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-700 block text-xs">Recargo Nocturno (22:00 - 06:00)</span>
                            <span className="text-[10px] text-slate-400">Porcentaje aplicado a la base</span>
                          </div>
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              value={nightSurcharge}
                              onChange={(e) => { setNightSurcharge(parseInt(e.target.value) || 0); markDirty(); }}
                              className="w-16 h-8 px-2 rounded-lg border border-slate-200 bg-white font-mono font-black text-right text-xs focus:border-[#E2498A] focus:outline-none tabular-nums"
                            />
                            <span className="text-[10px] font-bold text-slate-500">%</span>
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-700 block text-xs">Recargo Fin de Semana</span>
                            <span className="text-[10px] text-slate-400">Sábados y Domingos</span>
                          </div>
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              value={weekendSurcharge}
                              onChange={(e) => { setWeekendSurcharge(parseInt(e.target.value) || 0); markDirty(); }}
                              className="w-16 h-8 px-2 rounded-lg border border-slate-200 bg-white font-mono font-black text-right text-xs focus:border-[#E2498A] focus:outline-none tabular-nums"
                            />
                            <span className="text-[10px] font-bold text-slate-500">%</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                        <strong>Nota Regulatoria:</strong> Cualquier recargo porcentual se suma a la base bruta y pasa invariablemente por el filtro de truncamiento hacia abajo (<code>Math.floor</code>) a la decena inferior para evitar cualquier aproximación al alza ante reclamos de SERNAC.
                      </div>
                    </div>
                  )}
                </div>

                {/* ── HISTORIAL INMUTABLE DE VERSIONES DE TARIFA (Ley N° 20.967) ── */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>📜</span>
                        <span>Historial Inmutable de Versiones Tarifarias</span>
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Cada cambio genera una versión inmutable. Los vehículos ingresados bajo versiones previas liquidan con el valor protegido de su entrada.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                      {tariffVersions.length} versiones registradas
                    </span>
                  </div>

                  <div className="space-y-2">
                    {tariffVersions.map((tv, idx) => {
                      const isActive = !tv.effectiveUntil;
                      return (
                        <div
                          key={tv.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isActive
                              ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/30'
                              : 'bg-white border-slate-200 opacity-80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                                  isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  v{tv.versionNumber}
                                </span>
                                <span className="font-bold text-xs text-slate-800">
                                  {tv.billingModel === 'TRANCHE_30_10' ? 'Modalidad por Tramos (30/10 min)' : 'Modalidad por Minuto Lineal'}
                                </span>
                                {isActive && (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">
                                    Vigente Activa
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500">
                                Publicada: {new Date(tv.effectiveFrom).toLocaleString('es-CL')} | Por: <strong>{tv.createdBy}</strong>
                                {tv.effectiveUntil && ` | Vigente hasta: ${new Date(tv.effectiveUntil).toLocaleString('es-CL')}`}
                              </p>
                              {tv.reason && (
                                <p className="text-[10px] text-slate-600 italic">
                                  Motivo: "{tv.reason}"
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-slate-400 block">Tarifa Sedán:</span>
                              <span className="text-xs font-mono font-bold text-slate-800">
                                ${tv.vehicleRates['Automóvil']?.minuteRate || 40} CLP/min
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── PARÁMETROS DE FACTURACIÓN ELECTRÓNICA SII ── */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>🏛️</span>
                        <span>Cumplimiento Tributario SII (Boletas Electrónicas &amp; RVD)</span>
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Configuración de DTE reglamentario: Boletas Tipo 39 (Afectas) o Tipo 41 (Exentas) y Timbre Electrónico DTE (&lt;TED&gt;).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                        Tipo de Boleta Emitida
                      </span>
                      <select
                        value={taxDocumentType}
                        onChange={(e) => {
                          setTaxDocumentType(parseInt(e.target.value) as TaxDocumentType);
                          markDirty();
                        }}
                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white font-bold text-xs focus:border-[#E2498A] focus:outline-none cursor-pointer"
                      >
                        <option value={39}>Tipo 39 - Boleta Electrónica Afecta (19% IVA)</option>
                        <option value={41}>Tipo 41 - Boleta Electrónica Exenta (Giro Exento)</option>
                      </select>
                      <span className="text-[9px] text-slate-400 block">
                        {taxDocumentType === 39 ? 'Desglosa Neto + IVA 19% en cada ticket.' : 'Todo el monto se registra como exento.'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                        RUT Emisor Certificado
                      </span>
                      <div className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs flex items-center text-slate-800">
                        76.840.123-K (Estacionamientos Cordano SpA)
                      </div>
                      <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span>✓</span> Timbre Electrónico (&lt;TED&gt;) y CAF Activo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: EDITAR USUARIO & PERMISOS ── */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in-up text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-slate-900 text-sm">Editar Usuario &amp; Permisos</h4>
              <button
                type="button"
                onClick={() => setSelectedUserModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nombre</label>
                <input
                  type="text"
                  value={selectedUserModal.name}
                  onChange={(e) => setSelectedUserModal({ ...selectedUserModal, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Rol en la Garita</label>
                <select
                  value={selectedUserModal.role}
                  onChange={(e) => setSelectedUserModal({ ...selectedUserModal, role: e.target.value as any })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="operador">Operador (Cajero)</option>
                  <option value="administrador">Administrador (Supervisor)</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block">Permisos Específicos:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUserModal.canViewReports}
                    onChange={(e) => setSelectedUserModal({ ...selectedUserModal, canViewReports: e.target.checked })}
                    className="accent-[#E2498A]"
                  />
                  <span>Acceso y emisión de Reporte Z</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUserModal.canOverrideRates}
                    onChange={(e) => setSelectedUserModal({ ...selectedUserModal, canOverrideRates: e.target.checked })}
                    className="accent-[#E2498A]"
                  />
                  <span>Autorizar descuentos o anulación de tickets</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedUserModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveUserEdits}
                className="px-5 py-2 rounded-xl bg-[#E2498A] text-white font-bold"
              >
                Guardar Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREAR NUEVO USUARIO ── */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in-up text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-slate-900 text-sm">Crear Nuevo Usuario</h4>
              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="cajero@cordano.cl"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Rol Asignado</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="operador">Operador (Cajero)</option>
                  <option value="administrador">Administrador (Supervisor)</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block">Permisos:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUserReports}
                    onChange={(e) => setNewUserReports(e.target.checked)}
                    className="accent-[#E2498A]"
                  />
                  <span>Habilitar acceso a Reportes Z y auditoría</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUserOverride}
                    onChange={(e) => setNewUserOverride(e.target.checked)}
                    className="accent-[#E2498A]"
                  />
                  <span>Habilitar anulación y descuentos</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E2498A] text-white font-bold"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
