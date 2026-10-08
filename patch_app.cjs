const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix currentShift usage
content = content.replace(/currentShift\.startTime/g, 'currentShift?.startTime');
content = content.replace(/currentShift\.cashMovements/g, 'currentShift?.cashMovements');
content = content.replace(/currentShift\.id/g, 'currentShift?.id');
content = content.replace(/currentShift\.initialCash/g, 'currentShift?.initialCash');

// The historyLogs logic expects currentShift to be defined. We should conditionally render it or use defaults.
// Let's replace the whole historyLogs block
const historyOld = `  // History logs for POS
  const historyLogs: CashHistoryLog[] = [
    ...(currentShift?.cashMovements || []).map((m) => ({
      time: new Date(m.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      type: (m.type === 'INGRESO_MANUAL' ? 'INGRESO_MANUAL' : 'RETIRO') as any,
      desc: m.description,
      method: 'Efectivo',
      amount: m.amount,
      plate: '---',
      isEgreso: m.type === 'RETIRO_MANUAL',
    })),
    {
      time: new Date(currentShift?.startTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      type: 'APERTURA' as const,
      desc: \`Fondo Inicial Garita Turno \${currentShift?.id}\`,
      method: 'Efectivo',
      amount: currentShift?.initialCash,
      plate: '---',
      isEgreso: false,
    },
  ].sort((a, b) => b.time.localeCompare(a.time));`;

const historyNew = `  // History logs for POS
  const historyLogs: CashHistoryLog[] = currentShift ? [
    ...(currentShift.cashMovements || []).map((m) => ({
      time: new Date(m.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      type: (m.type === 'INGRESO_MANUAL' ? 'INGRESO_MANUAL' : 'RETIRO') as any,
      desc: m.description,
      method: 'Efectivo',
      amount: m.amount,
      plate: '---',
      isEgreso: m.type === 'RETIRO_MANUAL',
    })),
    {
      time: new Date(currentShift.startTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      type: 'APERTURA' as const,
      desc: \`Fondo Inicial Garita Turno \${currentShift.id}\`,
      method: 'Efectivo',
      amount: currentShift.initialCash,
      plate: '---',
      isEgreso: false,
    },
  ].sort((a, b) => b.time.localeCompare(a.time)) : [];`;

// It might be difficult if I've already replaced `.startTime` to `?.startTime`. Let's just do a manual replace block.
// Wait, actually I will just use string replacement carefully.
