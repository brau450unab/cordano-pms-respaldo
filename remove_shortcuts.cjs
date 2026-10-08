const fs = require('fs');

function removeShortcuts(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\[F\d+\]/g, ''); // Removes [F1], [F2], etc.
    content = content.replace(/\[Enter\]/g, ''); // Removes [Enter]
    content = content.replace(/\[Esc\]/g, ''); // Removes [Esc]
    content = content.replace(/data-shortcut=".*?"/g, '');
    fs.writeFileSync(filePath, content);
  }
}

removeShortcuts('src/components/pms/PosView.tsx');
removeShortcuts('src/components/pms/MenuView.tsx');
removeShortcuts('src/components/pms/ClientsView.tsx');
removeShortcuts('src/components/pms/ReportsView.tsx');
removeShortcuts('src/components/pms/AnalyticsView.tsx');
removeShortcuts('src/components/pms/PlatformNavbar.tsx');
removeShortcuts('src/components/pms/ArqueoCiegoModal.tsx');
removeShortcuts('src/components/pms/TicketPreviewModal.tsx');

