import React from 'react';
import { useParking } from '../context/ParkingContext';
import {
  LayoutDashboard,
  MapPin,
  Lock,
  BarChart3,
  Sliders,
  FileCheck2,
  DollarSign,
  PlusCircle,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, activeTab, setActiveTab } = useParking();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Panel Operación',
      icon: LayoutDashboard,
      roles: ['operador', 'administrador'],
    },
    {
      id: 'ingreso',
      label: 'Ingreso Vehicular',
      icon: PlusCircle,
      roles: ['operador', 'administrador'],
    },
    {
      id: 'punto_venta',
      label: 'Caja & Salida POS',
      icon: DollarSign,
      roles: ['operador', 'administrador'],
    },
    {
      id: 'layout',
      label: 'Mapa de Slots',
      icon: MapPin,
      roles: ['operador', 'administrador'],
    },
    {
      id: 'cierre_caja',
      label: 'Cierre Ciego',
      icon: Lock,
      roles: ['operador', 'administrador'],
    },
    {
      id: 'admin',
      label: 'Métricas Admin',
      icon: BarChart3,
      roles: ['administrador'],
    },
    {
      id: 'tarifas',
      label: 'Tarifas & Políticas',
      icon: Sliders,
      roles: ['administrador'],
    },
    {
      id: 'auditoria',
      label: 'Bitácora Auditoría',
      icon: FileCheck2,
      roles: ['administrador'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <nav className="bg-[#ffffff] border-b border-[#d9dadc] sticky top-[44px] z-30 h-[52px] flex items-center select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="max-w-[1024px] w-full mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto no-scrollbar">
        
        <div className="flex items-center space-x-1 sm:space-x-2 h-full">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center space-x-2 px-3 sm:px-3.5 h-[52px] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#1a1c1d]'
                    : 'text-[#717785] hover:text-[#1a1c1d]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0F172A]' : 'text-[#717785]'}`} />
                <span>{item.label}</span>
                
                {/* macOS Solid bottom indicator border */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0F172A] rounded-t-full"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Current User Pill Display */}
        <div className="hidden lg:flex items-center pl-4 border-l border-[#edeef0] text-[11px] text-[#717785]">
          <span className="truncate max-w-[170px] font-medium text-[#414753]">
            {user.name}
          </span>
        </div>

      </div>
    </nav>
  );
};
