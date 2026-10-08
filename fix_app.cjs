const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

const search = `  useEffect(() => {
    // ---------------------------------------------------------------------------
    // 3. EVENT LISTENERS
    // ---------------------------------------------------------------------------`;

const replace = `  useEffect(() => {
    const handleOpenShift = (e: any) => {
      openNewShift(e.detail.cash || 50000);
      showToast('Turno abierto exitosamente.', 'success');
    };
    window.addEventListener('pms:openShift', handleOpenShift);
    return () => window.removeEventListener('pms:openShift', handleOpenShift);
  }, [openNewShift]);

  useEffect(() => {
    // ---------------------------------------------------------------------------
    // 3. EVENT LISTENERS
    // ---------------------------------------------------------------------------`;

appContent = appContent.replace(search, replace);
fs.writeFileSync('src/App.tsx', appContent);
console.log('App.tsx event listener added.');
