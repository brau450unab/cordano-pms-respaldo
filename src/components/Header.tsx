import React, { useState, useEffect } from 'react';
import { useParking } from '../context/ParkingContext';
import { CordanoLogo } from './CordanoLogo';
import {
  ShieldCheck,
  UserCheck,
  Wifi,
  WifiOff,
  Clock,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, setUserRole, isOffline, setIsOffline, syncQueueCount, currentShift } = useParking();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-[#f5f5f7]/95 backdrop-blur-md text-[#1a1c1d] border-b border-[#e2e2e4] sticky top-0 z-40 h-[44px] flex items-center select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="max-w-[1024px] w-full mx-auto px-4 sm:px-6 flex items-center justify-between">
        
        {/* Left: macOS Window Traffic Lights + App Brand */}
        <div className="flex items-center space-x-3.5">
          {/* macOS Traffic Lights */}
          <div className="flex items-center space-x-1.5 pr-2 border-r border-[#d9dadc]">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] inline-block"></span>
          </div>

          {/* Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg overflow-hidden shadow-xs shrink-0 flex items-center justify-center">
              <CordanoLogo className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xs tracking-tight text-[#1a1c1d]">
              Cordano Parking Ops
            </span>
          </div>
        </div>

        {/* Center: Live Clock & Shift Badge */}
        <div className="hidden sm:flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#edeef0] border border-[#d9dadc] text-[#414753] tabular-nums text-[11px]">
            <Clock className="w-3 h-3 text-[#0F172A]" />
            <span>{time || '00:00:00'}</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#ffffff] border border-[#d9dadc] text-[11px] text-[#414753]">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse"></span>
            <span className="font-semibold text-[#1a1c1d]">Turno {currentShift.id}</span>
          </div>
        </div>

        {/* Right: Offline Mode Toggle + Role Segmented Control */}
        <div className="flex items-center space-x-2.5">
          {/* Offline Mode Pill Toggle */}
          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
              isOffline
                ? 'bg-[#ffdad6] text-[#ba1a1a] border-[#ffb4ab] hover:bg-[#ffcdcb]'
                : 'bg-[#edeef0] text-[#414753] border-[#d9dadc] hover:bg-[#e2e2e4]'
            }`}
            title="Simular pérdida o recuperación de conexión"
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3 h-3 text-[#ba1a1a]" />
                <span className="hidden sm:inline">Offline</span>
                {syncQueueCount > 0 && (
                  <span className="bg-[#ba1a1a] text-white font-bold px-1 rounded-full text-[9px]">
                    {syncQueueCount}
                  </span>
                )}
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-slate-800" />
                <span className="hidden sm:inline">Online</span>
              </>
            )}
          </button>

          {/* Role Switcher - macOS Segmented Pill Control */}
          <div className="flex items-center bg-[#edeef0] p-0.5 rounded-full border border-[#d9dadc]">
            <button
              onClick={() => setUserRole('operador')}
              className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                user.role === 'operador'
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'text-[#515154] hover:text-[#1a1c1d]'
              }`}
            >
              <UserCheck className="w-3 h-3" />
              <span>Operador</span>
            </button>
            <button
              onClick={() => setUserRole('administrador')}
              className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                user.role === 'administrador'
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'text-[#515154] hover:text-[#1a1c1d]'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin</span>
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
