const fs = require('fs');
let content = fs.readFileSync('src/components/pms/PlatformNavbar.tsx', 'utf8');

content = content.replace(`shortcut: string;`, `shortcut?: string;`);

fs.writeFileSync('src/components/pms/PlatformNavbar.tsx', content);
