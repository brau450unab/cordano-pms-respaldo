# Plan de Implementación de Ingeniería: ParkOps PMS & ERP v4.5

## 1. Resumen de Decisiones del Brief (Grill-Me UI)
A partir de la interrogación interactiva del brief, se consolidaron 5 directrices definitivas:
1. **Flujo Unificado Split-Screen en Garita**: Mantener ingreso `[F2]` y cobro/salida `[F4]` en el panel POS central con visor lateral en tiempo real de los 30 cupos y foco inmediato por teclado `F1`-`F9` sin scroll en 1080p.
2. **Conmutador Híbrido Permanente**: Conservar el conmutador interactivo `[📐 Ver Modo Wireframe]` / `[🖼️ Ver Renders HD IA]` en la cabecera.
3. **Sidebar Colapsable Lateral (Dock ERP)**: Migrar la navegación a un menú lateral izquierdo colapsable (estilo Linear/Datadog) para maximizar el ancho vertical de la pantalla.
4. **Exclusión Estricta de IA en el Proceso Operativo**: El proceso operativo de garita (ingreso, cobro, barrera, arqueo) es **100% determinista, manual y óptico sin dependencias de IA**. Los componentes de IA quedan exclusivamente en soporte y analítica auxiliar.
5. **Sincronización Automática en Background**: Persistencia local en `IndexedDB` con detección automática de reconexión a Cloud Run (`/api/health`).

---

## 2. Requerimientos Técnicos y Cambios Propuestos

### Fase 1: Creación del Componente de Navegación Lateral (`CollapsibleSidebar.tsx`)
- **Archivo**: `src/components/navigation/CollapsibleSidebar.tsx`
- **Funcionalidad**:
  - Estado local de colapso/expansión (`isCollapsed: boolean`, persistente o toggleable).
  - Ancho colapsado `w-16` (64px) con iconos centrados, badges de atajo (`[F1]`, `[F2]`, `[F3]`, etc.) y tooltips flotantes.
  - Ancho expandido `w-56` (224px) con etiquetas completas de texto.
  - Enlaces a las 8 vistas operativas: Menú `F1`, POS `F2`, Clientes/Paralelo `F3`, Salida `F4`, Ajustes `F5`, Historial `F6`, Barrera `F9`, Motor BD `F10`, y Reportes/Soporte.

### Fase 2: Reestructuración del Layout en `src/app/page.tsx`
- **Archivo**: `src/app/page.tsx`
- **Cambios**:
  - Convertir el contenedor principal en un layout flexible horizontal (`flex flex-row h-screen w-screen overflow-hidden`).
  - Renderizar `CollapsibleSidebar` en el lateral izquierdo cuando `activeView !== 'landing'`.
  - Mantener la barra superior compacta (`h-12`) para el reloj de turno, badge de garita/offline, búsqueda de patente (`⌘K`), pulso de barrera y botón de arqueo ciego.
  - Eliminar los botones redundantes de la cabecera que ahora residen en el Sidebar lateral.

### Fase 3: Purificación Determinista del POS en Garita (Retiro de IA Operativa)
- **Archivo**: `src/app/page.tsx`
- **Cambios en `#pos-subtab-entry`**:
  - Retirar los botones `[LPR IA]` y `[Peritaje IA]` del formulario de ingreso vehicular de garita.
  - Establecer el flujo directo de digitación manual de patente y selección de categoría con validación instantánea en menos de 4 segundos.
  - Mantener el campo de observaciones/daños como entrada de texto directa y limpia con soporte para escáneres ópticos.
- **Cambios en `#modal-close-shift`**:
  - En el Paso 2 de arqueo ciego, presentar la conciliación directa y determinista: `Efectivo Sistema` vs `Efectivo Físico Declarado` = `Diferencia / Cuadre`, sellada con el hash criptográfico `SHA-256`, eliminando cualquier bloqueo dependiente de llamadas a la IA.

### Fase 4: Sincronización del Bundle Autónomo para Google AI Studio
- **Archivos**: `scratch/build_aistudio_html.js` y `PARKOPS_FRONTEND_GOOGLE_AI_STUDIO.html`
- **Acción**:
  - Incorporar el nuevo `CollapsibleSidebar` y los ajustes deterministas en el empaquetador para generar el HTML autónomo actualizado.

---

## 3. Plan de Verificación y Pruebas
1. **Compilación de Tipos**:
   - Ejecutar `npx tsc --noEmit` para asegurar 0 errores de TypeScript.
2. **Generación de Bundle**:
   - Ejecutar el script generador y verificar tamaño de salida y sintaxis JSX/Babel en `PARKOPS_FRONTEND_GOOGLE_AI_STUDIO.html`.
3. **Verificación de Ergonomía y Atajos**:
   - Comprobar que los atajos de teclado (`F1` a `F9`) sigan funcionando con el sidebar colapsado.
