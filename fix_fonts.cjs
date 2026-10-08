const fs = require('fs');
let content = fs.readFileSync('tailwind.config.js', 'utf8');

content = content.replace(
  /fontFamily: {[\s\S]*?},/g,
  `fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        haptik: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        public: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },`
);

fs.writeFileSync('tailwind.config.js', content);
console.log('Done fixing fonts');
