import React, { useState } from 'react';
import { ShieldAlert, X, KeyRound, CheckCircle2 } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminName: string) => void;
  title?: string;
  reasonText?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Autorización de Administrador Requerida',
  reasonText = 'Esta acción sensible requiere validación de credenciales administrativas para registrarse en la bitácora de auditoría.',
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123' || password === '1234') {
      setError('');
      setPassword('');
      onSuccess('María González (Administradora)');
      onClose();
    } else {
      setError('Clave incorrecta. Intente con "admin123" o "1234".');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-['Manrope',sans-serif]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#e2e2e4]">
        <div className="bg-[#000722] p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">{title}</h3>
              <p className="text-white/70 text-xs mt-0.5 font-medium">Control de Auditoría Inmutable</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-[#414753] leading-relaxed bg-[#f9f9fb] p-3.5 rounded-xl border border-[#e2e2e4] font-medium">
            {reasonText}
          </p>

          <div>
            <label className="block text-xs font-extrabold text-[#1a1c1d] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <KeyRound className="w-4 h-4 text-[#717785]" />
              <span>Clave de Administrador</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese clave (ej: admin123)"
              className="w-full px-4 py-3 rounded-xl border border-[#c1c6d6] focus:border-[#0071e3] tabular-nums text-base outline-none transition bg-white"
              autoFocus
            />
            {error && <p className="text-xs text-[#ba1a1a] font-bold mt-1.5">{error}</p>}
          </div>

          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#2D2D44] shrink-0 mt-0.5" />
            <span className="font-medium">
              <strong>Claves de prueba válidas:</strong> <code className="bg-amber-100 px-1 py-0.5 rounded tabular-nums font-bold">admin123</code> o <code className="bg-amber-100 px-1 py-0.5 rounded tabular-nums font-bold">1234</code>.
            </span>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-full border border-[#c1c6d6] font-bold text-[#414753] hover:bg-[#f3f3f5] transition text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs transition text-sm flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Autorizar Acceso</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
