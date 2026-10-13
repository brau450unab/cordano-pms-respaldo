import React, { useState } from 'react';
import { useParking } from '../context/ParkingContext';
import { UserRole, AppScreen } from '../types';
import { ROLE_PERMISSIONS } from '../data/mockData';
import { APP_ROUTES } from '../utils/routes';
import {
  Lock,
  ArrowRight,
  Car,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  KeyRound,
  FileSpreadsheet,
  Headphones,
  X,
  Database,
  DollarSign,
  ShieldCheck
} from 'lucide-react';

interface LoginPageProps {
  initialRole?: UserRole;
  targetScreen?: AppScreen;
  onLoginSuccess: (targetScreen?: AppScreen) => void;
}

interface UserAccount {
  username: string;
  name: string;
  password: string;
  allowedRoles: UserRole[];
  email: string;
  rut: string;
}

const REGISTERED_USERS: UserAccount[] = [
  {
    username: 'braulio',
    name: 'Braulio Cordano',
    password: 'admin123',
    allowedRoles: ['administrador', 'operador'],
    email: 'braulio@automatizable.cl',
    rut: '15.221.890-4'
  },
  {
    username: 'cajero',
    name: 'Cajero Garita',
    password: 'cajero123',
    allowedRoles: ['operador'],
    email: 'cajero@cordano.cl',
    rut: '19.824.312-5'
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({
  initialRole = 'operador',
  targetScreen,
  onLoginSuccess
}) => {
  const { setUserRole, setIsLoggedIn, setUser } = useParking();

  const [step, setStep] = useState<'credentials' | 'role_select'>('credentials');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [authenticatedUser, setAuthenticatedUser] = useState<UserAccount | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole || 'operador');
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);

  const applyUserLogin = (account: UserAccount, role: UserRole) => {
    localStorage.setItem('pms_matic_user_role', role);
    setUser({
      id: account.email === 'cajero@cordano.cl' ? 'usr-op-cajero' : 'usr-admin-braulio',
      name: account.name,
      username: account.username,
      rut: account.rut,
      role,
      shiftId: '',
      email: account.email,
      permissions: ROLE_PERMISSIONS[role],
    });
    setIsLoggedIn(true);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim().toLowerCase();
    const foundUser = REGISTERED_USERS.find(
      (u) =>
        u.username.toLowerCase() === cleanUser ||
        u.email.toLowerCase() === cleanUser ||
        u.rut.replace(/\./g, '').toLowerCase() === cleanUser.replace(/\./g, '')
    );

    if (!foundUser) {
      setError('Identificador no registrado en la base de datos CORDANO.');
      return;
    }

    if (foundUser.password !== password) {
      setError('Contraseña no válida. Puede usar los botones de acceso rápido.');
      return;
    }

    setAuthenticatedUser(foundUser);

    if (foundUser.allowedRoles.includes('administrador') && foundUser.allowedRoles.includes('operador')) {
      setSelectedRole(initialRole || 'operador');
      setStep('role_select');
    } else if (foundUser.allowedRoles.includes('administrador')) {
      setSelectedRole('administrador');
      applyUserLogin(foundUser, 'administrador');
      onLoginSuccess(targetScreen || 'inicio');
    } else {
      setSelectedRole('operador');
      applyUserLogin(foundUser, 'operador');
      onLoginSuccess('pos');
    }
  };

  const handleFastLogin = (role: 'operador' | 'administrador') => {
    setError(null);
    const u = role === 'operador'
      ? (REGISTERED_USERS.find((usr) => usr.email === 'cajero@cordano.cl') || REGISTERED_USERS[1])
      : REGISTERED_USERS[0];
    setAuthenticatedUser(u);
    setSelectedRole(role);
    applyUserLogin(u, role);
    if (role === 'operador') {
      onLoginSuccess('pos');
    } else {
      onLoginSuccess(targetScreen || 'inicio');
    }
  };

  const handleFinalizeRoleSelect = (role: UserRole) => {
    if (authenticatedUser) {
      applyUserLogin(authenticatedUser, role);
    } else {
      setUserRole(role);
      setIsLoggedIn(true);
    }
    if (role === 'operador') {
      onLoginSuccess('pos');
    } else {
      onLoginSuccess(targetScreen || 'inicio');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between selection:bg-[#E2498A] selection:text-white relative">
      
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#E2498A]/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#1E1E2F]/5 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />
      </div>

      {/* 1. Header Bar */}
      <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/80 py-3.5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#C83472] to-[#E2498A] flex items-center justify-center text-white font-black text-sm shadow-sm shadow-[#E2498A]/30">
              C
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-[#1E1E2F]">
                Cordano<span className="text-[#E2498A]"> Parking Ops</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Garita Serrano 447 · Iquique</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-slate-600 bg-slate-100/80 px-3 py-1 rounded-full border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Terminal Operativo en Línea</span>
          </div>

          <button
            onClick={() => setShowSupportModal(true)}
            className="text-xs font-semibold text-slate-600 hover:text-[#E2498A] flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-[#E2498A]/40 transition-all cursor-pointer shadow-2xs"
          >
            <Headphones className="w-3.5 h-3.5 text-[#E2498A]" />
            <span>Soporte</span>
          </button>
        </div>
      </header>

      {/* 2. Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden flex flex-col md:flex-row text-xs">
          
          {/* Left Column: Operational Overview & Quick Access (5 cols) */}
          <div className="w-full md:w-5/12 p-6 sm:p-8 bg-gradient-to-b from-slate-50/90 to-slate-100/50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div>
                  <span className="font-extrabold text-xs text-[#1E1E2F] uppercase tracking-wide block">
                    Puesto de Control
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Serrano 447, Iquique</span>
                </div>
                <span className="text-[10px] font-bold text-[#E2498A] bg-[#E2498A]/10 px-2 py-0.5 rounded-full border border-[#E2498A]/20">
                  30 Plazas
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-white/80 shadow-2xs space-y-2.5 text-slate-700">
                <span className="font-bold text-[#1E1E2F] block text-xs tracking-tight">
                  Parámetros de Operación
                </span>
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Plazas asignadas: Sector A (01–15) y B (16–30)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Arqueo ciego imparcial de gaveta ($ 50.000 CLP)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Tarificación Ley N° 20.967 (bloque 30 + 10 min)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Emisión DTE Boleta Electrónica SII integrada</span>
                  </div>
                </div>
              </div>

              {/* Fast Login Preset Buttons for easy testing */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Accesos Directos de Prueba
                </span>
                <button
                  type="button"
                  onClick={() => handleFastLogin('operador')}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#E2498A]/50 rounded-xl text-left px-3.5 text-xs flex items-center justify-between text-slate-700 transition cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                      OP
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block text-xs">Cajero Garita</span>
                      <span className="text-[10px] text-slate-400">cajero@cordano.cl (Operador)</span>
                    </div>
                  </div>
                  <span className="font-bold text-[#E2498A] group-hover:translate-x-0.5 transition-transform">Entrar →</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFastLogin('administrador')}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#E2498A]/50 rounded-xl text-left px-3.5 text-xs flex items-center justify-between text-slate-700 transition cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[10px]">
                      AD
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block text-xs">Braulio Cordano</span>
                      <span className="text-[10px] text-slate-400">Administrador General</span>
                    </div>
                  </div>
                  <span className="font-bold text-[#E2498A] group-hover:translate-x-0.5 transition-transform">Entrar →</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Terminal Garita</span>
              <span className="font-mono">192.168.1.100</span>
            </div>
          </div>

          {/* Right Column: Unified Form OR Role Selection (7 cols) */}
          <div className="w-full md:w-7/12 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
            
            {step === 'credentials' ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                
                <div className="border-b border-slate-100 pb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E2498A]/10 text-[#E2498A] text-[10px] font-bold uppercase tracking-wider mb-2">
                    <ShieldCheck className="w-3 h-3" />
                    Acceso Seguro
                  </div>
                  <h1 className="font-black text-xl text-[#1E1E2F] tracking-tight">
                    Autenticación de Turno
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Ingrese su identificador, correo o RUT junto a su clave autorizada.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Username Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Usuario / RUT / Correo
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="braulio@automatizable.cl o braulio"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#E2498A] focus:bg-white focus:ring-4 focus:ring-[#E2498A]/10 transition-all"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-700">
                      Contraseña / PIN
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-[#E2498A] hover:underline font-medium cursor-pointer"
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#E2498A] focus:bg-white focus:ring-4 focus:ring-[#E2498A]/10 transition-all"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-[#E2498A] to-[#C83472] hover:from-[#C83472] hover:to-[#B02860] text-white rounded-xl font-bold tracking-wide text-xs transition-all shadow-md shadow-[#E2498A]/25 cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.99]"
                >
                  <Lock className="w-4 h-4" />
                  <span>Ingresar a la Plataforma</span>
                </button>

                <div className="pt-2 text-center text-[11px] text-slate-400">
                  Credenciales estándar: <span className="font-mono text-slate-600">operador123</span> / <span className="font-mono text-slate-600">admin123</span>
                </div>

              </form>
            ) : (
              /* STEP 2: ROLE PICKER FOR MULTI-ROLE USERS */
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E2498A]/10 text-[#E2498A] text-[10px] font-bold uppercase tracking-wider mb-2">
                    <CheckCircle2 className="w-3 h-3" />
                    Cuenta Verificada
                  </div>
                  <h2 className="font-black text-xl text-[#1E1E2F] tracking-tight">
                    Seleccione Perfil de Turno
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Sesión autorizada para: <strong className="text-slate-700">{authenticatedUser?.name}</strong>
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleFinalizeRoleSelect('operador')}
                    className="w-full p-4 rounded-2xl border border-slate-200 hover:border-[#E2498A] bg-white hover:bg-slate-50 text-left transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                  >
                    <div>
                      <span className="font-bold block text-sm text-[#1E1E2F] group-hover:text-[#E2498A] transition-colors">
                        Modo Operador de Garita
                      </span>
                      <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                        Punto de venta, control de barrera y arqueo ciego de gaveta.
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#E2498A] group-hover:translate-x-1 transition-all" />
                  </button>

                  <button
                    onClick={() => handleFinalizeRoleSelect('administrador')}
                    className="w-full p-4 rounded-2xl border border-slate-200 hover:border-[#E2498A] bg-white hover:bg-slate-50 text-left transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                  >
                    <div>
                      <span className="font-bold block text-sm text-[#1E1E2F] group-hover:text-[#E2498A] transition-colors">
                        Modo Administrador
                      </span>
                      <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                        Dashboard gerencial, configuración tributaria y auditoría.
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#E2498A] group-hover:translate-x-1 transition-all" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="text-xs text-slate-500 hover:text-[#E2498A] font-semibold cursor-pointer"
                >
                  ← Iniciar sesión con otra cuenta
                </button>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* 3. Footer */}
      <footer className="relative z-10 py-3 text-center text-xs text-slate-400 border-t border-slate-200/80 bg-white/60">
        CORDANO PARKING OPS · Terminal Operativo Garita · Serrano 447, Iquique
      </footer>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 text-left shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-black text-sm text-[#1E1E2F]">Soporte y Asistencia</span>
              <button onClick={() => setShowSupportModal(false)} className="cursor-pointer text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-600 font-medium">
              Para restablecer su PIN de garita o clave de supervisor, contacte al soporte del recinto Serrano 447.
            </p>
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Teléfono:</span>
                <strong className="text-slate-800 font-mono">+56 57 241 8900</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <strong className="text-[#E2498A]">soporte@cordano.cl</strong>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowSupportModal(false)}
                className="px-4 py-2 bg-[#1E1E2F] hover:bg-[#2D2D44] text-white rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
