import React, { useState } from 'react';
import { useParking } from '../../context/ParkingContext';

interface SupportViewProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const parseMarkdown = (text: string) => {
  if (!text) return '';
  let html = text;
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-[#1E1E2F] mt-8 mb-4 border-b border-slate-100 pb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-[#1E1E2F] mt-10 mb-4">$1</h2>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#1E1E2F]">$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-slate-100 text-[#E2498A] rounded text-[13px] font-mono">$1</code>');
  html = html.replace(/^\- (.*$)/gim, '<li class="ml-6 mb-2 text-slate-700 list-disc">$1</li>');
  html = html.replace(/\n\n/g, '</p><p class="mb-4 text-slate-700 leading-relaxed">');
  return `<p class="mb-4 text-slate-700 leading-relaxed">${html}</p>`;
};

export const SupportView: React.FC<SupportViewProps> = ({ onShowToast }) => {
  const { isLoggedIn, setIsLoggedIn } = useParking();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedArticle, setSelectedArticle] = useState<{title: string, type: string, fullContent: string} | null>(null);

  // Login popup states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      onShowToast('Ingresa usuario y contraseña', 'error');
      return;
    }
    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
      setIsLoggedIn(true);
      onShowToast('Acceso a soporte concedido', 'success');
    }, 800);
  };

  const helpDocuments = [
    { 
      id: 1, 
      title: 'Garita y Punto de Venta (POS)', 
      type: 'Módulo Principal', 
      content: 'Explicación del flujo de entrada/salida de vehículos, asignación de tarifas (Sedán, SUV, Moto) y atajos de teclado (F1-F9).',
      fullContent: `### Módulo de Garita y Punto de Venta (POS)

**Propósito:**
El POS es el corazón operativo de la garita. Permite el registro ultrarrápido de ingresos y salidas sin depender del uso del mouse (Ergonomía Keyboard-First).

**Reglas de Dominio y Operación:**
1. **Atajos de Teclado:** Todas las acciones operativas críticas están mapeadas a teclas de función:
- \`F1\`: Ingreso Sedán
- \`F2\`: Ingreso SUV
- \`F3\`: Ingreso Motocicleta
- \`Enter\`: Búsqueda de patente o cobro.
- \`Esc\`: Cancelar acción.
2. **Sin Scroll:** La interfaz está diseñada para resoluciones de 1080p, operando completamente sin scroll vertical ni horizontal para agilizar la operación visual del cajero.
3. **Autofoco:** Al entrar a la vista de cobro, el campo de patente tiene autofoco inmediato.

**Flujo Práctico:**
- **Paso 1:** Al acercarse un vehículo, presiona F1, F2 o F3 según el tipo.
- **Paso 2:** El sistema registra la hora, captura imagen mediante LPR (Genkit/Flash) si está habilitado y bloquea la plaza temporalmente.
- **Paso 3:** Al egresar, escanea el ticket (o digita la patente y presiona Enter).
- **Paso 4:** Cobra el monto exacto sugerido por el Motor de Tarifas.`
    },
    { 
      id: 2, 
      title: 'Cierre Ciego y Arqueo (Blind-Close)', 
      type: 'Operación y Auditoría', 
      content: 'Procedimiento de cierre de caja en 3 columnas, declaración en efectivo sin mostrar cuadre previo y validación criptográfica (SHA-256).',
      fullContent: `### Cierre de Caja Ciego en 3 Columnas (Blind-Close)

**Propósito:**
Evitar fugas de capital y manipulación del sistema de ventas. El cajero declara lo que tiene en físico ANTES de conocer el monto que el sistema espera.

**Procedimiento de Arqueo:**
1. **Paso 1 - Declaración:** El operador ingresa el conteo de billetes físicos que tiene en gaveta.
2. **Paso 2 - Comparación:** El sistema cruza este monto con:
- Efectivo Inicial
- Ventas en Efectivo (Transitorios + Renovaciones)
- Egresos autorizados (Vales/Descuentos)
3. **Paso 3 - Cuadratura:** El sistema emite la diferencia (Faltante / Sobrante / Cuadre Perfecto).

**Firmas SHA-256:**
Cada arqueo se sella criptográficamente para asegurar su inmutabilidad frente a auditorías fiscales o de supervisión. Ningún cajero puede editar un arqueo posterior a su emisión. Si se equivocó al contar, el supervisor debe autorizar un re-arqueo documentado.`
    },
    { 
      id: 3, 
      title: 'Fondo Fijo y Excepciones TOTP', 
      type: 'Seguridad', 
      content: 'Configuración del fondo base, cobro de tickets extraviados ($8.000 CLP) y validación de supervisor (Google Authenticator).',
      fullContent: `### Fondo Fijo, Fugas y Excepciones con Aprobación Remota (TOTP)

**Fondo Base Inicial:**
- Apertura obligatoria de turno declarando fondo inicial de sencillo para dar vuelto (Por defecto: $50.000 CLP). No se puede cobrar sin iniciar caja.

**Eventos de Excepción:**
Las excepciones críticas en la garita no pueden ser realizadas por el operador de forma unilateral. Requieren aprobación remota.
1. **Ticket Perdido:** Cobro obligatorio de $8.000 CLP.
2. **Fugas:** El vehículo escapa sin pagar rompiendo barrera. El operador marca "Fuga", se captura LPR y se ingresa a lista negra (Alerta Roja).
3. **Descuentos de Cortesía:** Requiere un Administrador/Supervisor ingresando su PIN (Google Authenticator TOTP de 6 dígitos) y una justificación escrita obligatoria (>10 caracteres).

**Colores de Auditoría:**
- **Verde:** Descuentos y cortesías debidamente autorizadas.
- **Rojo:** Recargos por ticket perdido, fugas o anulaciones irregulares.`
    }
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col pt-16 relative">
        {isLoggingIn && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full border-4 border-[#E2498A]/30 border-t-[#E2498A] animate-spin" />
          </div>
        )}
        
        <div className="w-full max-w-md mx-auto mt-20 px-6">
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-[#2C1338]/5 border border-slate-100 overflow-hidden relative group p-8 sm:p-12">
            <div className="w-16 h-16 rounded-2xl bg-[#FFF5F8] text-[#E2498A] flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            
            <h2 className="text-2xl font-black text-[#1E1E2F] tracking-tight mb-2">
              Soporte Central
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-8">
              Documentación técnica y manuales operativos de la Plataforma ParkOps.
            </p>

            <form onSubmit={handleLogin} className="space-y-4 relative z-10">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1 mb-1 block">Usuario</label>
                <input
                  type="text"
                  placeholder="admin@cordano.cl"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-12 bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 text-sm font-medium text-[#1E1E2F] placeholder-slate-400 focus:outline-none focus:border-[#E2498A] focus:ring-1 focus:ring-[#E2498A] transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1 mb-1 block">Clave de Acceso</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 text-sm font-medium text-[#1E1E2F] placeholder-slate-400 focus:outline-none focus:border-[#E2498A] focus:ring-1 focus:ring-[#E2498A] transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 mt-4 bg-[#1E1E2F] hover:bg-[#2D2D44] text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]"
              >
                Acceder a Documentación
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col pt-16">
      {selectedArticle ? (
        <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r border-slate-200 h-full flex flex-col overflow-y-auto shrink-0 shadow-[4px_0_24px_rgba(44,19,56,0.02)]">
            <div className="p-6 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-md z-10">
              <button 
                onClick={() => setSelectedArticle(null)}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1E1E2F] transition-colors cursor-pointer mb-6"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                Volver a Soporte
              </button>
              <h3 className="text-lg font-black text-[#1E1E2F] tracking-tight">Índice de Artículos</h3>
              <p className="text-xs text-slate-500 mt-1">Selecciona un documento para leer</p>
            </div>
            <div className="p-4 space-y-2">
              {helpDocuments.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => setSelectedArticle({ title: doc.title, type: doc.type, fullContent: doc.fullContent })}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${selectedArticle?.title === doc.title ? 'bg-[#FFF5F8] border border-[#E2498A]/30 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#E2498A] mb-1 block">
                    {doc.type}
                  </span>
                  <h4 className={`text-sm font-bold leading-tight ${selectedArticle?.title === doc.title ? 'text-[#E2498A]' : 'text-[#1E1E2F]'}`}>
                    {doc.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-[#F8FAFC] h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto py-12 px-8">
              <div className="bg-white rounded-3xl p-10 sm:p-14 shadow-sm border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2498A] bg-[#E2498A]/10 px-3 py-1 rounded-full mb-4 inline-block">
                  {selectedArticle.type}
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-[#1E1E2F] tracking-tight leading-tight mb-8">
                  {selectedArticle.title}
                </h1>
                
                <div 
                  className="prose prose-slate max-w-none text-sm md:text-base font-sans"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(selectedArticle.fullContent) }} 
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full">
          {/* SEARCH HEADER */}
          <div className="bg-white border-b border-slate-200 py-16">
            <div className="max-w-3xl mx-auto px-6 text-center">
              <h2 className="text-3xl sm:text-4xl font-black text-[#1E1E2F] tracking-tight mb-4">
                ¿Cómo podemos ayudarte hoy?
              </h2>
              <p className="text-sm text-slate-500 mb-8">
                Busca en nuestra base de conocimiento o explora los manuales operativos.
              </p>
              
              <div className="relative max-w-2xl mx-auto group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#E2498A] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar manuales, atajos o reportes..." 
                  className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 text-sm font-medium text-[#1E1E2F] placeholder-slate-400 focus:outline-none focus:border-[#E2498A] focus:ring-1 focus:ring-[#E2498A] focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-6 mt-16 space-y-6">
            <h3 className="text-2xl font-bold text-[#1E1E2F] tracking-tight mb-8">
              <span className="relative inline-block">
                SOPs &
                <span className="absolute bottom-1 left-0 w-full h-1 bg-[#E2498A] opacity-80" />
              </span>{' '}
              Manuales Operativos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {helpDocuments.filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.content.toLowerCase().includes(searchQuery.toLowerCase())).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedArticle({ title: doc.title, type: doc.type, fullContent: doc.fullContent })}
                  className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-[0_4px_12px_rgba(44,19,56,0.04)] cursor-pointer hover:border-[#E2498A] hover:-translate-y-1 transition-all group h-full"
                >
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <span className="text-sm font-bold text-[#1E1E2F] group-hover:text-[#E2498A] transition-colors leading-tight">
                      {doc.title}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#E2498A] bg-[#FFF5F8] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                      {doc.type}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-500 leading-relaxed flex-grow">
                    {doc.content}
                  </p>
                  
                  <div className="mt-5 pt-4 border-t border-slate-200 flex items-center gap-2 text-[11px] font-semibold text-[#E2498A]">
                    Leer documento completo 
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. PANEL DE ESCALAMIENTO Y SOPORTE TI */}
          <div className="max-w-5xl mx-auto px-6 mt-12 mb-16">
            <div className="bg-[#1E1E2F] rounded-3xl p-6 sm:p-8 shadow-[0_12px_36px_rgba(44,19,56,0.2)] flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-[#2D2D44]">
              <div className="text-white space-y-2">
                <h4 className="text-lg font-bold flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E2498A] live-pulse" />
                  Soporte Técnico Especializado (Nivel 2)
                </h4>
                <p className="text-xs text-slate-200/80 max-w-xl">
                  Conexión remota inmediata con supervisión técnica de Cordano Inversiones para diagnóstico de hardware, impresoras térmicas o contingencias en garita Serrano 447.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button
                  onClick={() => onShowToast('Solicitud de Asistencia AnyDesk enviada a soporte@cordano.cl', 'success')}
                  className="px-6 h-12 rounded-full bg-[#E2498A] hover:bg-[#E2498A] text-white text-xs font-bold tabular-nums transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-100"
                >
                  [ Solicitar AnyDesk Remoto ]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
