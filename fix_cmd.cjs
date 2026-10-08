const fs = require('fs');
let content = fs.readFileSync('src/components/CommandPalette.tsx', 'utf8');

// Add agreements to useParking
content = content.replace(
  `const { tickets, calculateFee } = useParking();`,
  `const { tickets, calculateFee, agreements } = useParking();`
);

// Delete the quickActions block
const quickActionsRegex = /const quickActions:\s*Array<\{[\s\S]*?\];\s*/;
content = content.replace(quickActionsRegex, '');

// Delete the render block of quickActions if it exists, wait it doesn't exist in the file
// Replace the results container entirely
const resultsRegex = /\{\/\* Results Container \*\/\}.*?(?=\<\/motion\.div\>)/s;

const newResults = `{/* Results Container */}
        <div className="overflow-y-auto p-3 space-y-4 divide-y divide-slate-100">
          
          {/* Active Parking Vehicles Section */}
          <div>
            <div className="flex items-center justify-between px-2 pb-2 text-[11px] tabular-nums font-bold text-slate-700 uppercase tracking-wider">
              <span>[ VEHÍCULOS ESTACIONADOS: {filteredTickets.length} ]</span>
              <span className="text-[10px] text-slate-500 tabular-nums">En vivo</span>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="py-6 text-center text-xs tabular-nums text-slate-500 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                {query ? 'No se encontraron vehículos coincidentes' : 'No hay vehículos activos en este momento'}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {filteredTickets.slice(0, 8).map((ticket) => {
                  const fee = calculateFee(ticket);
                  const entryDate = new Date(ticket.entryTime);
                  const timeStr = entryDate.toLocaleTimeString('es-CL', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  });

                  return (
                    <div
                      key={ticket.id}
                      className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-slate-200 transition cursor-pointer"
                      onClick={() => {
                        if (onSelectTicketForCheckout) {
                          onSelectTicketForCheckout(ticket);
                        }
                        onNavigate('operacion_salida');
                        onClose();
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-md bg-slate-50 border border-dashed border-slate-300 text-slate-800 flex items-center justify-center tabular-nums font-bold text-xs">
                          {ticket.slotCode || 'P'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="tabular-nums font-bold text-slate-900 text-sm tracking-wide">
                              {ticket.plateNumber}
                            </span>
                            <span className="text-[11px] tabular-nums text-slate-500">· {ticket.vehicleType}</span>
                            {ticket.tariffType === 'especial' && (
                              <span className="text-[10px] tabular-nums text-slate-800 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-300">
                                Especial
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] tabular-nums text-slate-500 flex items-center space-x-2 mt-0.5">
                            <span>Entrada: {timeStr}</span>
                            <span>·</span>
                            <span>{fee.durationMinutes} min</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="text-xs tabular-nums font-bold text-slate-900 block">
                            \${fee.totalAmount.toLocaleString('es-CL')} CLP
                          </span>
                          <span className="text-[10px] tabular-nums text-slate-500">#{ticket.ticketCode}</span>
                        </div>
                        <button
                          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Agreements Section */}
          {filteredAgreements.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center justify-between px-2 pb-2 text-[11px] tabular-nums font-bold text-slate-700 uppercase tracking-wider">
                <span>[ CLIENTES ABONADOS: {filteredAgreements.length} ]</span>
                <span className="text-[10px] text-slate-500 tabular-nums">Convenios</span>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {filteredAgreements.slice(0, 8).map((agr) => (
                  <div
                    key={agr.id}
                    className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-slate-200 transition cursor-pointer"
                    onClick={() => {
                      onNavigate('clientes');
                      onClose();
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-md bg-slate-50 border border-dashed border-slate-300 text-slate-800 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm tracking-wide">
                            {agr.clientName}
                          </span>
                          <span className="text-[11px] tabular-nums text-slate-500">{agr.rut}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {agr.companyName} · {agr.plateNumbers?.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 block">
                        {agr.status === 'al_dia' ? 'Al Día' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      `;

content = content.replace(resultsRegex, newResults);

// Also add filteredAgreements definition
const filterRegex = /const filteredTickets = activeTickets\.filter\(\(t\) => \{/s;
const newFilter = `const filteredAgreements = agreements.filter(a => {
    if (!cleanQuery) return true;
    return a.clientName.toUpperCase().includes(cleanQuery) || 
           a.companyName.toUpperCase().includes(cleanQuery) || 
           a.rut.toUpperCase().includes(cleanQuery) ||
           (a.plateNumbers || []).some(p => p.toUpperCase().replace('-', '').includes(cleanQuery.replace('-', '')));
  });

  const filteredTickets = activeTickets.filter((t) => {`;

content = content.replace(filterRegex, newFilter);

fs.writeFileSync('src/components/CommandPalette.tsx', content);
console.log('Done modifying CommandPalette.tsx');
