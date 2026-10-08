const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(
  `family=Geist:wght@300;400;500;600;700&display=swap`,
  `family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600;700&display=swap`
);

fs.writeFileSync('index.html', content);
console.log('Done fixing index.html fonts');
