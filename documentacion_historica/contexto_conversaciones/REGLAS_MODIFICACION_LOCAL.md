# Plan de Trabajo y Directrices de Modificación Local

De acuerdo con tus indicaciones, he establecido las siguientes directrices y prioridades como **restricciones absolutas** para esta y todas las futuras interacciones de desarrollo:

### 1. Entorno de Trabajo Exclusivo: Local
Todos los cambios de código, diseño UI/UX, arquitectura y lógica de negocio se aplicarán **estrictamente en los archivos locales** de tu máquina. No habrá interacciones no solicitadas con entornos externos.

### 2. Bloqueo Activo de Entornos Online
Hasta que no emitas una orden explícita de despliegue o sincronización, se encuentra **totalmente prohibido**:
- 🛑 **Repositorios GitHub:** Hacer *commits* o ejecutar `git push` hacia `brau450unab/cordano-pms-oficial` o el repositorio de respaldo.
- 🛑 **Google Cloud Run:** Ejecutar comandos de despliegue (`gcloud run deploy`) o alterar la imagen en producción de `cordano-pms`.
- 🛑 **Google Stitch / AI Studio:** Enviar actualizaciones automáticas al proyecto oficial activo para sobreescribir el `DESIGN.md` o las pantallas en línea.

### 3. Foco en la Versión Local Activa
Todo esfuerzo de codificación se centrará en la **versión exacta que estás visualizando y diseñando en `localhost:3000`**. 

*Nota Operativa:* Como detectamos en la última corrección, tienes dos versiones en tu directorio (Next.js en la raíz y Vite en `cordano-pms-version-publicada`). Mi prioridad será intervenir los archivos de la **versión Vite** (`cordano-pms-version-publicada/src/...`), ya que es la interfaz que me mostraste en tu captura de pantalla y sobre la cual estás diseñando el producto final en tiempo real.

---
**Estado Actual:** Reglas asimiladas. A la espera de tu aprobación para continuar diseñando localmente.
