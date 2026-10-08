import React, { useState } from 'react';

interface SupportViewProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SupportView: React.FC<SupportViewProps> = ({ onShowToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLearningStep, setCurrentLearningStep] = useState(0);

  const helpDocuments = [
    { id: 1, title: 'Apertura de Caja y Turno', type: 'Manual', content: 'Pasos para iniciar el turno de forma correcta. Incluye cómo registrar el fondo inicial de 50.000 pesos, revisión de gaveta y firma del checklist de calidad en la garita.' },
    { id: 2, title: 'Operación del POS', type: 'Manual', content: 'Guía sobre cómo utilizar el Punto de Venta. Ingreso por orden de llegada, selección de tarifas (Sedán, SUV, Moto), y proceso de liquidación de salida.' },
    { id: 3, title: 'Cierre de Caja y Reporte Z', type: 'Manual', content: 'Procedimiento de fin de turno. Instrucciones para arqueo ciego, cuadratura de efectivo vs sistema, voucher Transbank, y emisión definitiva del corte Z fiscal.' },
    { id: 4, title: 'Reemplazo de Rollo Térmico (80mm)', type: 'Video', content: 'Videotutorial VD-01. Muestra cómo abrir la impresora térmica, colocar correctamente la bobina de papel de 80mm y verificar la impresión de prueba.' },
    { id: 5, title: 'Reinicio de Gaveta de Dinero RJ11', type: 'Video', content: 'Videotutorial VD-02. Qué hacer si la caja registradora o gaveta de dinero no abre automáticamente. Revisión de cable RJ11 y apertura manual de emergencia.' },
    { id: 6, title: 'Procesamiento de Pago con POS Transbank', type: 'Video', content: 'Videotutorial VD-03. Cómo enlazar un cobro del sistema con el terminal de tarjetas, aceptar débito/crédito y emitir la boleta electrónica.' },
    { id: 7, title: 'Caída de Sistema o Corte de Internet (Modo Offline)', type: 'Procedimiento', content: 'SOP-01. Protocolo a seguir si se corta la luz o internet. Obligatorio el uso de talonario manual de boletas, y registro físico de patentes en bitácora de contingencia.' },
    { id: 8, title: 'Vehículo con ticket extraviado o robado', type: 'Procedimiento', content: 'SOP-02. Cómo actuar si el cliente pierde el ticket. Pasos para solicitar padrón del vehículo, carnet de identidad, cobro de tarifa máxima diaria y registro ejecutado por supervisor.' },
    { id: 9, title: 'Siniestros o daños a vehículos dentro del patio', type: 'Procedimiento', content: 'SOP-03. Qué hacer si un cliente reporta un choque, robo o rayón dentro del estacionamiento. Formulario de siniestros, levantamiento de cámaras CCTV y bloqueo de cupo temporal.' }
  ];

  const learningModules = [
    {
      title: 'Configuración Inicial',
      subtitle: 'Ajustes básicos para comenzar a operar el sistema de garita',
      cards: [
        { icon: 'CATEGORIA', title: 'Categorías', desc: 'Configuración → Categorías' },
        { icon: 'TARIFA', title: 'Tarifas (Configuración)', desc: '8 artículos' },
        { icon: 'USUARIOS', title: 'Usuarios', desc: 'Configuración → Usuarios' },
        { icon: 'PRECIOS', title: 'Precios', desc: 'Configuración → Precios' },
        { icon: 'PAGO', title: 'Medios de Pago', desc: 'Configuración → Medios de Pago' }
      ]
    },
    {
      title: 'Caja',
      subtitle: 'Lo necesario para instalar y configurar el sistema',
      cards: [
        { icon: 'CAJA', title: 'Caja', desc: 'Módulo de caja presencial y arqueos' },
        { icon: 'CIERRE', title: 'Cierre de Caja', desc: 'Procedimiento de corte Z e informes' }
      ]
    },
    {
      title: 'Auditoría',
      subtitle: 'Lo necesario para Auditar tu negocio y mantener el control',
      cards: [
        { icon: 'MONITOR', title: 'TicketControl Monitor', desc: 'Configuración → Ajustes → Monitor' },
        { icon: 'INFORMES', title: 'Informes', desc: 'Configuración → Informes' }
      ]
    }
  ];

  const currentMod = learningModules[currentLearningStep];

  const filteredMatches = searchQuery.trim().length >= 2
    ? helpDocuments.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div id="view-support" className="animate-fade-in-up pb-12 w-full">
      {/* 1. HERO SECTION (Toggl Track warm header) */}
      <div className="bg-gradient-to-b from-[#FDF1EC] to-[#FEF9F5] pt-16 pb-28 px-6 relative text-center border-b border-[#EDE4E2] z-10">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-[#2C1338] mb-10 tracking-tight">
          <span className="relative inline-block z-10">
            Hola,
            <span className="absolute bottom-1.5 left-0 w-full h-2 bg-[#E57CD8] rounded-full opacity-80 -z-10" />
          </span>{' '}
          ¿en qué podemos ayudarte?
        </h2>

        {/* Buscador Principal (Toggl Pill Style) */}
        <div className="max-w-2xl mx-auto relative group z-40">
          <div className="bg-white rounded-full shadow-[0_4px_24px_rgba(44,19,56,0.08)] p-2 flex items-center border border-[#EDE4E2] transition-all focus-within:border-[#E2498A] focus-within:shadow-[0_4px_24px_rgba(226,73,138,0.18)]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busca por palabra clave, procedimiento o SOP..."
              className="flex-1 bg-transparent border-none focus:ring-0 px-6 text-[#2C1338] placeholder:text-[#8C7C92] font-sans text-base outline-none w-full"
            />
            <button className="w-11 h-11 rounded-full bg-[#E2498A] hover:bg-[#E57CD8] text-white flex items-center justify-center shadow-md transition-all shrink-0 cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>

          {/* Dropdown de Autocompletado */}
          {searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-4 right-4 sm:left-6 sm:right-6 mt-3 bg-white border border-[#EDE4E2] rounded-2xl shadow-[0_16px_40px_rgba(44,19,56,0.12)] max-h-80 overflow-y-auto divide-y divide-[#EDE4E2] text-left font-sans z-50">
              {filteredMatches.length === 0 ? (
                <div className="p-4 text-sm text-[#8C7C92] text-center tabular-nums">
                  No se encontraron resultados para "{searchQuery}"
                </div>
              ) : (
                filteredMatches.map((doc) => {
                  let badgeClass = 'bg-[#FEF9F5] text-[#2C1338] border-[#EDE4E2]';
                  if (doc.type === 'Manual') badgeClass = 'bg-[#2DA8D8]/10 text-[#2DA8D8] border-[#2DA8D8]/30';
                  if (doc.type === 'Video') badgeClass = 'bg-[#9E59C7]/10 text-[#9E59C7] border-[#9E59C7]/30';
                  if (doc.type === 'Procedimiento') badgeClass = 'bg-[#2B9E78]/10 text-[#2B9E78] border-[#2B9E78]/30';

                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        onShowToast(`Abriendo ${doc.type.toLowerCase()}: ${doc.title}`, 'info');
                        setSearchQuery('');
                      }}
                      className="p-4 hover:bg-[#FDF1EC] cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <span className="font-bold text-[#2C1338] text-sm leading-tight">{doc.title}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold tabular-nums rounded-full border ${badgeClass} shrink-0`}>
                          {doc.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-[#65546C] line-clamp-2 leading-relaxed">{doc.content}</div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN TOPIC CARDS (Flotando sobre el Hero con estilo Toggl Track) */}
      <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => onShowToast('Abriendo guía: Primeros Pasos', 'info')}
            className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(44,19,56,0.06)] p-8 text-center flex flex-col items-center hover:-translate-y-1 hover:border-[#E57CD8] transition-all cursor-pointer border border-[#EDE4E2] group"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#FDF1EC] text-[#E2498A] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2l.5-.5m5.5-8.5l6-6a2.828 2.828 0 1 0-4-4l-6 6m1.5 1.5l3 3m-9-3l-4.5 4.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2l4.5-4.5m1.5-1.5l3 3" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#2C1338] mb-2">Primeros Pasos</h3>
            <p className="text-xs text-[#65546C] leading-relaxed">Guía básica para iniciar turno, asignar caja y operar el POS en garita.</p>
          </div>

          <div
            onClick={() => onShowToast('Abriendo guía: Conceptos Clave', 'info')}
            className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(44,19,56,0.06)] p-8 text-center flex flex-col items-center hover:-translate-y-1 hover:border-[#E57CD8] transition-all cursor-pointer border border-[#EDE4E2] group"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#FDF1EC] text-[#2DA8D8] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21h6m-3-3v3m-5-8a5 5 0 1 1 10 0c0 3-3 4-3 4s-1 2-2 2H9s-1-2-2-2-3-1-3-4z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#2C1338] mb-2">Conceptos Clave</h3>
            <p className="text-xs text-[#65546C] leading-relaxed">Liquidación de salidas, cuadratura ciega y emisión de Reporte Z fiscal.</p>
          </div>

          <div
            onClick={() => onShowToast('Abriendo: Notas de Versión v4.0.0 Enterprise', 'info')}
            className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(44,19,56,0.06)] p-8 text-center flex flex-col items-center hover:-translate-y-1 hover:border-[#E57CD8] transition-all cursor-pointer border border-[#EDE4E2] group"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#FDF1EC] text-[#9E59C7] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#2C1338] mb-2">Notas de Versión</h3>
            <p className="text-xs text-[#65546C] leading-relaxed">Últimas actualizaciones, hardware compatible, gavetas e impresoras térmicas.</p>
          </div>
        </div>
      </div>

      {/* 3. POPULAR ARTICLES */}
      <div className="max-w-4xl mx-auto px-6 mt-16 space-y-6">
        <h3 className="text-2xl font-bold text-[#2C1338] tracking-tight">
          <span className="relative inline-block">
            Artículos
            <span className="absolute bottom-1 left-0 w-full h-1 bg-[#E2498A] opacity-80" />
          </span>{' '}
          Populares
        </h3>

        <div className="space-y-3">
          <div
            onClick={() => onShowToast('Visualizando: Resolución de descuadre en Arqueo Ciego', 'info')}
            className="bg-white border border-[#EDE4E2] rounded-2xl p-5 flex justify-between items-center shadow-xs cursor-pointer hover:border-[#E57CD8] hover:shadow-md transition-all group"
          >
            <span className="text-sm font-semibold text-[#2C1338] group-hover:text-[#E2498A] transition-colors">
              Resolución de descuadre en Arqueo Ciego
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FDF1EC] text-[#E2498A] flex items-center justify-center group-hover:bg-[#E2498A] group-hover:text-white transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>

          <div
            onClick={() => onShowToast('Visualizando: Procedimiento ante corte de internet (SOP Offline)', 'info')}
            className="bg-white border border-[#EDE4E2] rounded-2xl p-5 flex justify-between items-center shadow-xs cursor-pointer hover:border-[#E57CD8] hover:shadow-md transition-all group"
          >
            <span className="text-sm font-semibold text-[#2C1338] group-hover:text-[#E2498A] transition-colors">
              Procedimiento ante corte de internet (SOP Contingencia Offline)
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FDF1EC] text-[#E2498A] flex items-center justify-center group-hover:bg-[#E2498A] group-hover:text-white transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>

          <div
            onClick={() => onShowToast('Visualizando: Reemplazo y calibración de bobina térmica 80mm', 'info')}
            className="bg-white border border-[#EDE4E2] rounded-2xl p-5 flex justify-between items-center shadow-xs cursor-pointer hover:border-[#E57CD8] hover:shadow-md transition-all group"
          >
            <span className="text-sm font-semibold text-[#2C1338] group-hover:text-[#E2498A] transition-colors">
              Reemplazo y calibración de bobina térmica 80mm
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FDF1EC] text-[#E2498A] flex items-center justify-center group-hover:bg-[#E2498A] group-hover:text-white transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SHOWROOM DE APRENDIZAJE DINÁMICO */}
      <div className="max-w-5xl mx-auto px-6 mt-16">
        <div className="bg-[#FDF1EC] rounded-3xl p-8 md:p-12 border border-[#EDE4E2] shadow-xs">
          <div className="inline-block px-3 py-1 rounded-full bg-[#E57CD8]/20 text-[#2C1338] text-xs font-bold tabular-nums uppercase tracking-wider mb-3">
            Módulos Formativos Garita
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#2C1338] mb-2 tracking-tight">{currentMod.title}</h2>
          <p className="text-sm md:text-base text-[#65546C] mb-8">{currentMod.subtitle}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {currentMod.cards.map((c, i) => (
              <div
                key={i}
                onClick={() => onShowToast(`Abriendo módulo: ${c.title}`, 'info')}
                className="bg-white rounded-2xl border border-[#EDE4E2] p-6 hover:shadow-md hover:border-[#E57CD8] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FDF1EC] text-[#E2498A] flex items-center justify-center border border-[#EDE4E2] shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-[#2C1338] tracking-tight">{c.title}</h4>
                </div>
                <p className="text-xs text-[#65546C]">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-[#EDE4E2] pt-6">
            {currentLearningStep > 0 ? (
              <div
                onClick={() => setCurrentLearningStep((prev) => prev - 1)}
                className="bg-white rounded-2xl p-4 border border-[#EDE4E2] cursor-pointer hover:bg-[#FEF9F5] hover:border-[#E57CD8] transition-all text-left group"
              >
                <div className="text-[11px] font-bold text-[#8C7C92] mb-0.5">Anterior</div>
                <div className="text-sm font-bold text-[#E2498A] group-hover:text-[#2C1338] transition-colors">
                  « {learningModules[currentLearningStep - 1].title}
                </div>
              </div>
            ) : (
              <div />
            )}

            {currentLearningStep < learningModules.length - 1 ? (
              <div
                onClick={() => setCurrentLearningStep((prev) => prev + 1)}
                className="bg-white rounded-2xl p-4 border border-[#EDE4E2] cursor-pointer hover:bg-[#FEF9F5] hover:border-[#E57CD8] transition-all text-right group"
              >
                <div className="text-[11px] font-bold text-[#8C7C92] mb-0.5">Siguiente</div>
                <div className="text-sm font-bold text-[#E2498A] group-hover:text-[#2C1338] transition-colors">
                  {learningModules[currentLearningStep + 1].title} »
                </div>
              </div>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>

      {/* 5. PANEL DE ESCALAMIENTO Y SOPORTE TI (Toggl Deep Aubergine) */}
      <div className="max-w-5xl mx-auto px-6 mt-12">
        <div className="bg-[#2C1338] rounded-3xl p-6 sm:p-8 shadow-[0_12px_36px_rgba(44,19,56,0.2)] flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-[#412A4C]">
          <div className="text-white space-y-2">
            <h4 className="text-lg font-bold flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E57CD8] live-pulse" />
              Soporte Técnico Especializado (Nivel 2)
            </h4>
            <p className="text-xs text-[#EDE4E2]/80 max-w-xl">
              Conexión remota inmediata con supervisión técnica de Cordano Inversiones para diagnóstico de hardware, impresoras térmicas o contingencias en garita Serrano 447.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => onShowToast('Solicitud de Asistencia AnyDesk enviada a soporte@cordano.cl', 'success')}
              className="px-6 h-12 rounded-full bg-[#E2498A] hover:bg-[#E57CD8] text-white text-xs font-bold tabular-nums transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-100"
            >
              [ Solicitar AnyDesk Remoto ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
