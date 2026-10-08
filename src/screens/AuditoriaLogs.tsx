import React, { useState } from 'react';
import { useParking } from '../context/ParkingContext';
import {
  FileCheck2,
  Search,
  User
} from 'lucide-react';

export const AuditoriaLogs: React.FC = () => {
  const { auditLogs } = useParking();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'todos' | 'info' | 'warning' | 'critical'>('todos');

  const filteredLogs = auditLogs.filter((log) => {
    const matchSeverity = severityFilter === 'todos' || log.severity === severityFilter;
    const matchSearch =
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSeverity && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-slate-900">
      
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 tabular-nums">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 bg-slate-100 text-slate-900 rounded-lg flex items-center justify-center border border-slate-300 shrink-0">
            <FileCheck2 className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-700 uppercase bg-slate-100 px-2 py-0.5 rounded inline-block border border-slate-300">
              SEGURIDAD & TRAZABILIDAD
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1">Bitácora de Auditoría Inmutable</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro secuencial e imborrable de eventos sensibles y autorizaciones
            </p>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex space-x-1.5 text-xs tabular-nums">
          <button
            onClick={() => setSeverityFilter('todos')}
            className={`px-3 py-1 rounded-md border transition cursor-pointer ${
              severityFilter === 'todos' ? 'bg-slate-900 text-white border-slate-900 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            [ Todos ({auditLogs.length}) ]
          </button>
          <button
            onClick={() => setSeverityFilter('warning')}
            className={`px-3 py-1 rounded-md border transition cursor-pointer ${
              severityFilter === 'warning' ? 'bg-slate-900 text-white border-slate-900 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            [ Advertencias ]
          </button>
          <button
            onClick={() => setSeverityFilter('critical')}
            className={`px-3 py-1 rounded-md border transition cursor-pointer ${
              severityFilter === 'critical' ? 'bg-slate-900 text-white border-slate-900 font-bold' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            [ Críticos ]
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative tabular-nums">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por operador, acción, ticket o detalle..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 placeholder-slate-400 focus:border-slate-800 outline-none shadow-xs"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden tabular-nums">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-300">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Acción / Evento</th>
                <th className="py-2.5 px-4">Usuario Responsable</th>
                <th className="py-2.5 px-4">Detalles del Evento</th>
                <th className="py-2.5 px-4 text-right">Gravedad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-900">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 font-medium">
                    No se registraron eventos de auditoría con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isCritical = log.severity === 'critical';
                  const isWarning = log.severity === 'warning';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      
                      {/* Timestamp */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      {/* Action Code */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <span className="bg-slate-100 border border-slate-300 text-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {log.action}
                        </span>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 text-slate-900">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{log.userName}</span>
                        </div>
                        {log.authorizedBy && (
                          <span className="text-[10px] text-slate-500 block">
                            Aut: {log.authorizedBy}
                          </span>
                        )}
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 text-slate-600 max-w-md font-sans">
                        {log.details}
                      </td>

                      {/* Severity Badge */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                            isCritical
                              ? 'bg-slate-900 text-white border-slate-900'
                              : isWarning
                              ? 'bg-slate-200 text-slate-800 border-slate-400'
                              : 'bg-white text-slate-600 border-slate-300'
                          }`}
                        >
                          {log.severity}
                        </span>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
