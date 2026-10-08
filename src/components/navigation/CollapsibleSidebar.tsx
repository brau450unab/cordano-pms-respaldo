import React from 'react';
import { AppScreen } from '../../types';

interface CollapsibleSidebarProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onInitiateCashClose?: () => void;
  operatorName?: string;
  shiftTimer?: string;
  isOffline?: boolean;
}

interface NavGroup {
  title: string;
  items: {
    id: AppScreen;
    label: string;
    sublabel?: string;
    shortcut?: string;
    path: string;
    icon: React.ReactNode;
  }[];
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  currentScreen,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  onInitiateCashClose,
  operatorName = 'Juan Pérez',
  shiftTimer = '00:00:00',
  isOffline = false,
}) => {
  const navGroups: NavGroup[] = [
    {
      title: 'Terminal Garita',
      items: [
        {
          id: 'pos',
          label: 'Garita POS',
          sublabel: 'Ingreso & Cobro',
          shortcut: 'F1',
          path: '/pos',
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          ),
        },
        {
          id: 'map',
          label: 'Plano 30 Estacionamientos',
          sublabel: 'Matriz en Vivo',
          shortcut: 'F2',
          path: '/pos/matriz',
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          ),
        },
        {
          id: 'menu',
          label: 'Menú Principal',
          sublabel: 'Checklist Apertura',
          shortcut: 'F5',
          path: '/menu',
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Servicios Especiales',
      items: [
        {
          id: 'clients',
          label: 'Convenios & Noche',
          sublabel: 'Submódulo Paralelo',
          shortcut: 'F3',
          path: '/servicios/convenios',
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Auditoría & Finanzas',
      items: [
        {
          id: 'reports',
          label: 'Reportes & DTE',
          sublabel: 'Libro Mayor & PIN',
          shortcut: 'F4',
          path: '/auditoria/transacciones',
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Sistema & Soporte',
      items: [
        {
          id: 'settings',
          label: 'Ajustes Tarifas',
          sublabel: 'Ley 20.967',
          path: '/ajustes/tarifas',
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          ),
        },
        {
          id: 'support',
          label: 'Manuales SOPs',
          sublabel: 'Centro de Ayuda',
          path: '/soporte',
          icon: (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <aside
      id="collapsible-dock-sidebar"
      className={`h-screen bg-[#2C1338] text-white border-r border-[#412A4C] transition-all duration-200 select-none flex flex-col justify-between shrink-0 z-40 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Header with Brand and Toggle */}
      <div>
        <div className="h-14 px-3 flex items-center justify-between border-b border-[#412A4C]">
          {!isCollapsed && (
            <div
              onClick={() => onNavigate('menu')}
              className="flex items-center gap-2.5 cursor-pointer min-w-0"
              title="ParkOps PMS — Cordano Inversiones"
            >
              <div className="w-8 h-8 rounded-xl bg-[#E2498A] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-[0_2px_8px_rgba(226,73,138,0.35)] shrink-0">
                P
              </div>
              <div className="truncate">
                <span className="brand-text font-display font-extrabold text-sm tracking-tight text-white block truncate">
                  ParkOps PMS
                </span>
                <span className="text-[10px] tabular-nums text-[#E5DBDF]/70 block truncate">
                  Serrano 447 · 30 Cupos
                </span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div
              onClick={() => onNavigate('menu')}
              className="w-10 h-10 rounded-xl bg-[#E2498A] text-white flex items-center justify-center font-bold text-base cursor-pointer mx-auto shadow-md"
              title="Ir al Menú Principal"
            >
              P
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="w-7 h-7 rounded-lg hover:bg-[#412A4C] text-[#E5DBDF] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Colapsar barra lateral"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
        </div>

        {/* Collapsed expansion button */}
        {isCollapsed && (
          <div className="pt-2 px-2 flex justify-center">
            <button
              onClick={onToggleCollapse}
              className="w-10 h-7 rounded-lg hover:bg-[#412A4C] text-[#E5DBDF] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Expandir barra lateral"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

        {/* Navigation Items Organized by Canonical Groups */}
        <div className="py-2.5 px-2 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2.5 py-1 text-[10px] tabular-nums font-bold uppercase tracking-wider text-[#96859B]">
                  {group.title}
                </div>
              )}

              {group.items.map((item) => {
                const isActive =
                  currentScreen === item.id ||
                  (item.id === 'pos' &&
                    (currentScreen === 'operacion_salida' ||
                      currentScreen === 'operacion_ingreso')) ||
                  (item.id === 'map' && currentScreen === 'operacion_layout') ||
                  (item.id === 'reports' &&
                    (currentScreen === 'reportes_dashboard' ||
                      currentScreen === 'reportes_auditoria'));

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={isCollapsed ? `${item.label} [${item.shortcut || ''}] — ${item.path}` : item.path}
                    className={`w-full rounded-xl transition-all flex items-center cursor-pointer ${
                      isCollapsed
                        ? 'h-11 justify-center'
                        : 'px-3 py-2 justify-between'
                    } ${
                      isActive
                        ? 'bg-[#E2498A] text-white shadow-xs font-bold'
                        : 'text-[#E5DBDF] hover:bg-[#412A4C] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.icon}
                      {!isCollapsed && (
                        <div className="text-left truncate">
                          <span className="text-xs font-semibold block leading-tight truncate">
                            {item.label}
                          </span>
                          {item.sublabel && (
                            <span className="text-[10px] tabular-nums text-[#E5DBDF]/60 block leading-tight truncate">
                              {item.sublabel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {!isCollapsed && item.shortcut && (
                      <span
                        className={`text-[9px] tabular-nums px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-white/20 text-white' : 'bg-[#1E0C25] text-[#E57CD8]'
                        } shrink-0`}
                      >
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Quick Arqueo Ciego Button in Sidebar */}
          {onInitiateCashClose && (
            <div className="pt-2 border-t border-[#412A4C]">
              <button
                onClick={onInitiateCashClose}
                title={isCollapsed ? 'Arqueo Ciego SHA-256 [F9]' : 'Cierre de Caja Ciego'}
                className={`w-full rounded-xl bg-[#E2498A]/20 hover:bg-[#E2498A] text-[#E57CD8] hover:text-white border border-[#E2498A]/40 transition-all flex items-center cursor-pointer ${
                  isCollapsed ? 'h-11 justify-center' : 'px-3 py-2 gap-2 text-xs font-bold'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {!isCollapsed && <span>Arqueo Ciego [F9]</span>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer: Operator status, Shift timer */}
      <div className="p-3 border-t border-[#412A4C] bg-[#1E0C25]/60">
        {!isCollapsed ? (
          <div className="space-y-1.5 tabular-nums text-xs tabular-nums">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#96859B]">Garita:</span>
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-amber-400' : 'bg-[#2B9E78]'}`} />
                <span>01 Serrano</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#96859B]">Operador:</span>
              <span className="font-semibold text-white truncate max-w-[120px]">{operatorName}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#96859B]">Turno:</span>
              <span className="font-bold text-[#E57CD8]">{shiftTimer}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-[10px] tabular-nums">
            <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-400' : 'bg-[#2B9E78]'}`} />
            <span className="text-[#E57CD8] font-bold text-[9px] tabular-nums">
              {shiftTimer.slice(0, 5)}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
