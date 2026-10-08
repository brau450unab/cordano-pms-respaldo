const fs = require('fs');
let content = fs.readFileSync('src/components/pms/PosView.tsx', 'utf8');

content = content.replace(
  `[F2] Foco · [Enter] Emitir
                </span>`,
  `[F2] Foco · [Enter] Emitir
                </span>`
); // Let's just find and replace the span itself.

const searchSpan = `<span className="text-[10px] tabular-nums font-bold text-[#E2498A] bg-[#FDF1EC] px-2.5 py-1 rounded-full border border-[#EDE4E2]">
                  [F2] Foco · [Enter] Emitir
                </span>`;

const replaceSpan = `<span className="text-[10px] font-sans font-bold text-[#E2498A] bg-[#FDF1EC] px-2.5 py-1 rounded-full border border-[#EDE4E2] tracking-wide">
                  [F2] Foco · [Enter] Emitir
                </span>`;

content = content.replace(searchSpan, replaceSpan);

fs.writeFileSync('src/components/pms/PosView.tsx', content);
console.log('Done fixing PosView span');
