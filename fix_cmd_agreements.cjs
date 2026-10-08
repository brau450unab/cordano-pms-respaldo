const fs = require('fs');
let content = fs.readFileSync('src/components/CommandPalette.tsx', 'utf8');

content = content.replace(
  `a.clientName.toUpperCase().includes(cleanQuery) || 
           a.companyName.toUpperCase().includes(cleanQuery) || 
           a.rut.toUpperCase().includes(cleanQuery) ||
           (a.plateNumbers || []).some(p => p.toUpperCase().replace('-', '').includes(cleanQuery.replace('-', '')))`,
  `(a.contactName || '').toUpperCase().includes(cleanQuery) || 
           (a.companyName || '').toUpperCase().includes(cleanQuery) || 
           (a.rutCompany || '').toUpperCase().includes(cleanQuery) ||
           (a.plateNumber || '').toUpperCase().replace('-', '').includes(cleanQuery.replace('-', ''))`
);

content = content.replace(
  `<span className="font-bold text-slate-900 text-sm tracking-wide">
                            {agr.clientName}
                          </span>
                          <span className="text-[11px] tabular-nums text-slate-500">{agr.rut}</span>`,
  `<span className="font-bold text-slate-900 text-sm tracking-wide">
                            {agr.contactName || agr.companyName}
                          </span>
                          <span className="text-[11px] tabular-nums text-slate-500">{agr.rutCompany}</span>`
);

content = content.replace(
  `{agr.companyName} · {agr.plateNumbers?.join(', ')}`,
  `{agr.companyName} · {agr.plateNumber}`
);

fs.writeFileSync('src/components/CommandPalette.tsx', content);
console.log('Done fixing Agreement properties');
