## Descripción del Problema
Al realizar la refactorización masiva de colores estéticos, la interfaz de la aplicación perdió completamente los estilos CSS (dejando solo texto). 

Este colapso ocurrió por dos razones técnicas concurrentes:

1. **Clases de Tailwind Inválidas (Espacios en corchetes):**
   Durante el reemplazo de los colores `#65546C` y `#EDE4E2`, inyecté las clases `text-[rgb(100 116 139)]` y `border-[rgb(226 232 240)]`.
   **El Problema:** El compilador JIT (Just-In-Time) de Tailwind CSS **no soporta espacios** dentro de la sintaxis de valores arbitrarios `[]`. Al encontrar esos espacios, el compilador falló silenciosamente y corrompió la generación de los estilos de esas páginas.

2. **Dependencia de Configuración Raíz Eliminada:**
   Al limpiar la carpeta raíz, se eliminó un archivo `postcss.config.mjs` que Vite estaba heredando para poder compilar TailwindCSS v3 dentro del directorio `cordano-pms-version-publicada`. Sin ese archivo, Vite dejó de compilar Tailwind de forma local, sirviendo el HTML sin las clases CSS generadas.

## Correcciones Propuestas (Hotfixes de Emergencia)

### [NUEVO] cordano-pms-version-publicada/postcss.config.cjs
Para independizar completamente la versión local de la carpeta raíz, debemos crear su propio archivo de configuración de PostCSS:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

### [MODIFICAR] src/components/pms/MenuView.tsx y SupportView.tsx
Debemos corregir las clases corruptas por los nombres correctos de la paleta semántica de Tailwind, eliminando los espacios y brackets arbitrarios:
- `text-[rgb(100 116 139)]` ➔ `text-slate-500`
- `border-[rgb(226 232 240)]` ➔ `border-slate-200`
- `text-[rgb(148 163 184)]` ➔ `text-slate-400`

### Acciones Automáticas del Servidor
1. Detener el proceso actual de Vite que quedó corrupto en memoria.
2. Iniciar nuevamente Vite (`npm run dev`) forzando la lectura de `postcss.config.cjs`.

## Plan de Verificación

### Verificación Manual Esperada
1. Una vez ejecutado este plan, por favor navega a `http://localhost:3000/`.
2. Verifica que los estilos (colores, fuentes, layout) hayan regresado.
3. Verifica que la paleta de colores de la Landing ahora sí esté reflejada (Fondos Blancos/Slate, Botones Rosa `#E2498A` y textos oscuros) en las rutas `/pos`, `/menu`, y `/support`.
