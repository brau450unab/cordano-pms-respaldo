## Objetivo
Establecer de forma permanente, tanto para esta sesión como para todas las futuras conversaciones en este proyecto, que **todos los esfuerzos y modificaciones se aplicarán única y exclusivamente al entorno local (`cordano-pms-version-publicada` ejecutándose en `localhost:3000`)**. Se prohíbe terminantemente realizar actualizaciones, commits en repositorios remotos o despliegues en línea a menos que se solicite explícitamente.

## ⚠️ Requiere Revisión (User Review Required)
> [!IMPORTANT] Modificación de Reglas Globales (Workspace Rules)
> Para garantizar que esta restricción se cumpla en "todas las demás conversaciones", propongo inyectar esta regla directamente en los archivos de directrices de tu proyecto (`AGENTS.md` y `GEMINI.md`). Estos archivos son leídos automáticamente por mí o por cualquier otro agente de Antigravity cada vez que inicias un chat nuevo.

## Preguntas Abiertas
¿Estás de acuerdo con que modifique los archivos `AGENTS.md` y `GEMINI.md` para dejar esta regla grabada a fuego para el futuro?

## Propuesta de Regla Permanente

---

### Módulo de Directrices: `AGENTS.md` y `GEMINI.md`
Se añadirá una nueva regla de prioridad máxima en la sección de directrices del proyecto.

#### [MODIFY] `AGENTS.md`
```markdown
---
## 0. [CRITICAL DIRECTIVE] FLUJO DE TRABAJO ESTRICTAMENTE LOCAL (LOCAL-FIRST)

**REGLA ABSOLUTA PARA TODOS LOS AGENTES:**
1. **Entorno de Trabajo Único:** Todas las modificaciones de código, refactorizaciones, cambios de interfaz (UI/UX) y creación de componentes deben realizarse **exclusivamente en la versión local Vite** (carpeta `cordano-pms-version-publicada`), la cual se visualiza en `http://localhost:3000`.
2. **Prohibición de Despliegue:** Queda estrictamente prohibido ejecutar comandos de despliegue (ej. `node ecosystem-manager.mjs deploy`), empujar código a GitHub (`git push`), o alterar la versión en línea (`https://cordanopms.ai.studio`) bajo ninguna circunstancia, **a menos que el usuario emita una orden explícita y directa** (ej. "Procede a publicar a la versión online").
3. **Validación:** El agente debe asumir siempre que el objetivo es preparar, diseñar y verificar el software localmente.
---
```

## Plan de Verificación

### Verificación Manual
1. Leeré tus reglas de proyecto actualizadas en mi memoria de instrucciones (System Prompt) para confirmar que la restricción fue asimilada.
2. Cada vez que me pidas un cambio, te confirmaré que se ha realizado sobre los archivos de `cordano-pms-version-publicada` y te invitaré a revisar `localhost:3000`, sin hacer mención a Cloud Run o la versión en vivo.
