const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.md')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix jargon
  content = content.replace(/Cloud Run/g, 'La Plataforma');
  content = content.replace(/Túnel SSL Seguro/g, 'Conexión Segura');
  content = content.replace(/CLOUD RUN/g, 'EN LÍNEA');

  // Fix vocabulary
  content = content.replace(/Plazas/g, 'Cupos');
  content = content.replace(/plazas/g, 'cupos');
  content = content.replace(/Plaza /g, 'Cupo ');
  content = content.replace(/plaza /g, 'cupo ');
  content = content.replace(/Abonados/g, 'Convenios');
  content = content.replace(/abonados/g, 'convenios');
  content = content.replace(/Abonado Mensual/g, 'Convenio Mensual');
  content = content.replace(/Abonado/g, 'Mensualidad');
  content = content.replace(/abonado/g, 'mensualidad');
  content = content.replace(/Bahías/g, 'Estacionamientos');
  content = content.replace(/bahías/g, 'estacionamientos');
  content = content.replace(/Bahía/g, 'Estacionamiento');
  content = content.replace(/bahía/g, 'estacionamiento');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
console.log('Vocabulary update complete.');
