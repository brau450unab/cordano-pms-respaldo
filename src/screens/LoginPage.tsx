import React, { useState } from 'react';
import { useParking } from '../context/ParkingContext';
import { UserRole, AppScreen } from '../types';
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
    username: 'andrea.valdes',
    name: 'Andrea Valdés',
    password: 'admin123',
    allowedRoles: ['administrador', 'operador'],
    email: 'andrea.valdes@cordano.cl',
    rut: '16.892.415-3'
  },
  {
    username: 'carlos.mendoza',
    name: 'Carlos Mendoza',
    password: 'operador123',
    allowedRoles: ['operador'],
    email: 'carlos.mendoza@cordano.cl',
    rut: '18.342.119-K'
  },
  {
    username: 'braulio.cordano',
    name: 'Braulio Cordano',
    password: 'cordano123',
    allowedRoles: ['administrador', 'operador'],
    email: 'automatizable@gmail.com',
    rut: '15.221.890-4'
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({
  initialRole = 'operador',
  targetScreen,
  onLoginSuccess
}) => {
  const { setUserRole, setIsLoggedIn } = useParking();

  const [step, setStep] = useState<'credentials' | 'role_select'>('credentials');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [authenticatedUser, setAuthenticatedUser] = useState<UserAccount | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole || 'operador');
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);

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
      setUserRole('administrador');
      setIsLoggedIn(true);
      onLoginSuccess(targetScreen || 'inicio');
    } else {
      setSelectedRole('operador');
      setUserRole('operador');
      setIsLoggedIn(true);
      onLoginSuccess(targetScreen || 'inicio');
    }
  };

  const handleFastLogin = (role: 'operador' | 'administrador') => {
    setError(null);
    if (role === 'operador') {
      const u = REGISTERED_USERS.find((usr) => usr.username === 'carlos.mendoza')!;
      setAuthenticatedUser(u);
      setSelectedRole('operador');
      setUserRole('operador');
      setIsLoggedIn(true);
      onLoginSuccess(targetScreen || 'inicio');
    } else {
      const u = REGISTERED_USERS.find((usr) => usr.username === 'andrea.valdes')!;
      setAuthenticatedUser(u);
      setSelectedRole('administrador');
      setUserRole('administrador');
      setIsLoggedIn(true);
      onLoginSuccess(targetScreen || 'inicio');
    }
  };

  const handleFinalizeRoleSelect = (role: UserRole) => {
    setUserRole(role);
    setIsLoggedIn(true);
    onLoginSuccess(targetScreen || 'inicio');
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans text-slate-900 flex flex-col justify-between selection:bg-slate-900 selection:text-white relative">
      
      {/* Millimeter Blueprint Grid Pattern */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      {/* 1. Header Bar */}
      <header className="relative z-10 bg-white border-b border-slate-300 py-3.5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block" />
            <span>[ PUESTO DE CONTROL GARITA · SERRANO 447 ]</span>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="font-bold text-slate-900 uppercase">CORDANO PMS</span>
            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              [ ACCESO OPERACIONAL ]
            </span>
          </div>

          <button
            onClick={() => setShowSupportModal(true)}
            className="text-xs font-mono text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-300 bg-slate-50 cursor-pointer"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Soporte</span>
          </button>
        </div>
      </header>

      {/* 2. Main Login Card in Wireframe Style */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-4xl bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden flex flex-col md:flex-row font-mono text-xs">
          
          {/* Left Column: Technical Blueprint Specification (5 cols) */}
          <div className="w-full md:w-5/12 p-6 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-300 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 uppercase">[ GARITA SERRANO 447 ]</span>
                <span className="text-[10px] text-slate-500">Iquique</span>
              </div>

              <div className="border border-dashed border-slate-300 rounded p-3 bg-white space-y-2 text-slate-700">
                <span className="font-bold text-slate-900 block text-[11px] uppercase">
                  [ ESPECIFICACIÓN OPERATIVA ]
                </span>
                <div className="space-y-1.5 text-[11px] font-sans">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                    <span>30 Plazas en Zonas A, B y C</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                    <span>Arqueo ciego imparcial de caja</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                    <span>Trazabilidad SSoT Google Sheets</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                    <span>Validación Anti-passback activa</span>
                  </div>
                </div>
              </div>

              {/* Fast Login Preset Buttons for easy testing */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  [ ACCESOS RÁPIDOS DE PRUEBA ]
                </span>
                <button
                  type="button"
                  onClick={() => handleFastLogin('operador')}
                  className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded text-left px-3 text-[11px] flex items-center justify-between text-slate-800 cursor-pointer"
                >
                  <span>1. Carlos Mendoza (Operador)</span>
                  <span className="font-bold">Entrar →</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFastLogin('administrador')}
                  className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded text-left px-3 text-[11px] flex items-center justify-between text-slate-800 cursor-pointer"
                >
                  <span>2. Andrea Valdés (Admin)</span>
                  <span className="font-bold">Entrar →</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-500">
              Terminal Garita · IP Local 192.168.1.100
            </div>
          </div>

          {/* Right Column: Unified Form OR Role Selection (7 cols) */}
          <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            
            {step === 'credentials' ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                
                <div className="border-b border-slate-200 pb-3">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">
                    [ AUTENTICACIÓN CENTRAL ]
                  </span>
                  <h1 className="font-bold text-lg text-slate-900 mt-0.5 uppercase">
                    Ingreso al Sistema CORDANO
                  </h1>
                  <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                    Ingrese usuario, correo o RUT junto a su clave de garita.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-slate-100 border border-slate-400 rounded text-slate-800 text-[11px] flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-slate-900" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Username Input */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-600">
                    Usuario / RUT / Correo
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ej. carlos.mendoza o 18.342.119-K"
                    className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="block text-[10px] font-bold uppercase text-slate-600">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-slate-500 hover:text-slate-800"
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold uppercase tracking-wider text-xs transition cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>[ INGRESAR AL SISTEMA ]</span>
                </button>

                <div className="pt-2 text-center text-[10px] text-slate-500">
                  Credenciales por defecto: <strong>operador123</strong> / <strong>admin123</strong>
                </div>

              </form>
            ) : (
              /* STEP 2: ROLE PICKER FOR MULTI-ROLE USERS */
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">
                    [ SELECCIÓN DE SESIÓN ]
                  </span>
                  <h2 className="font-bold text-lg text-slate-900 mt-0.5 uppercase">
                    Seleccione Modo de Operación
                  </h2>
                  <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                    Usuario: <strong>{authenticatedUser?.name}</strong> ({authenticatedUser?.username})
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleFinalizeRoleSelect('operador')}
                    className="w-full p-3 rounded border border-slate-300 hover:border-slate-800 bg-white hover:bg-slate-50 text-left transition flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold block text-slate-900 uppercase">1. Modo Operador de Garita</span>
                      <span className="text-[11px] text-slate-600 font-sans">
                        Punto de venta, cobro de tickets y arqueo ciego.
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-700" />
                  </button>

                  <button
                    onClick={() => handleFinalizeRoleSelect('administrador')}
                    className="w-full p-3 rounded border border-slate-300 hover:border-slate-800 bg-white hover:bg-slate-50 text-left transition flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold block text-slate-900 uppercase">2. Modo Administrador</span>
                      <span className="text-[11px] text-slate-600 font-sans">
                        Dashboard gerencial, configuración y bitácora de auditoría.
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-700" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="text-[11px] text-slate-500 hover:underline"
                >
                  ← Cambiar de cuenta
                </button>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* 3. Footer */}
      <footer className="relative z-10 py-3 text-center text-[10px] font-mono text-slate-500 border-t border-slate-300 bg-white">
        CORDANO PMS · Terminal Operativo · Serrano 447, Iquique
      </footer>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-xl max-w-sm w-full p-5 space-y-3 font-mono text-left shadow-lg text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900 uppercase">[ AYUDA INGRESO ]</span>
              <button onClick={() => setShowSupportModal(false)}>
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <p className="text-slate-600 font-sans">
              Para reestablecer su PIN de garita o clave de administrador, contacte a supervisión local.
            </p>
            <div className="border border-dashed border-slate-300 rounded p-2.5 bg-slate-50 text-[11px]">
              <div>Tel: <strong>+56 57 241 8900</strong></div>
              <div>Email: <strong>soporte@cordano.cl</strong></div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSupportModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-bold"
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
