# Idea‑OS – Plan de Actualización y Despliegue

## Contexto
- Proyecto: **NUEVO PMS CORDANO** (ParkOps PMS & ERP).
- Infraestructura: Cloud Run (`cordano-pms-v1` en `us‑west1`), Google Stitch Project `12916038623650348087`.
- Requerimientos principales: actualizar la estructura y el diseño según las directrices de **AGENTS.md** y **DESIGN.md**, compilar y desplegar.

## Objetivos
1. **Compilar** la aplicación Next.js en modo producción.
2. **Desplegar** a Google Cloud Run.
3. **Generar** artefactos de diseño (mockup, prompt Stitch, plan Idea‑OS) y documentación de despliegue.
4. **Mantener** cumplimiento de normas de dominio (colores, tipografía, atajos de teclado, auditoría antifraude).

## Alcance
- Actualizar dependencias (`npm install`).
- Ejecutar `npm run build` (ya completado).
- Verificar disponibilidad de `gcloud` y, si falta, instalar Google Cloud SDK.
- Ejecutar `deploy-cloudrun.bat`.
- Crear artefactos:
  - `idea_os_plan.md` (este documento).
  - `stitch_ui_prompt.md` (prompt para Google Stitch).
  - `deployment_report.md` (resumen del despliegue).

## Requisitos Funcionales
- La UI debe usar la paleta de colores oficial (ver `DESIGN.md`).
- Los atajos de teclado (F1‑F9, Enter, Esc) deben estar presentes en la interfaz de garita.
- La tipografía numérica debe usar `font‑mono` con `tabular‑nums`.
- El despliegue debe estar accesible en `https://cordano-pms-v1-349577440002.us-west1.run.app`.

## Requisitos No Funcionales
- **Performance:** tiempo de carga < 2 s en conexión 4G.
- **Seguridad:** sin scroll vertical/​horizontal en la vista principal de garita.
- **Accesibilidad:** contraste WCAG AAA.
- **Resiliencia:** modo offline‑first con IndexedDB (sufijo `O`).

## Arquitectura de Trabajo
```mermaid
flowchart TD
    subgraph LocalDev[Desarrollo local]
        A[Instalar dependencias] --> B[Compilar (npm run build)]
    end
    subgraph Cloud[Google Cloud]
        C[gcloud CLI] --> D[Deploy Cloud Run]
    end
    A --> B --> C --> D
    D --> E[URL producción]
    E --> F[Validación funcional]
```

## Cronograma (estimado)
| Etapa | Duración | Responsable |
|-------|----------|-------------|
| Dependencias & build | 15 min | DevOps |
| Instalación `gcloud` (si necesario) | 10 min | DevOps |
| Despliegue (`deploy-cloudrun.bat`) | 5 min | DevOps |
| Verificación URL y pruebas funcionales | 10 min | QA |
| Entrega de artefactos (plan, prompt, reporte) | 5 min | Equipo de producto |

## Criterios de Aceptación
- `npm run build` finaliza sin errores (log adjunto).
- `gcloud` está disponible y `deploy-cloudrun.bat` finaliza con mensaje **Despliegue completado con éxito**.
- La URL de producción responde y muestra la UI actualizada.
- Artefactos (`idea_os_plan.md`, `stitch_ui_prompt.md`, `deployment_report.md`) están creados y versionados en el repo.
- Todas las reglas de dominio (colores, tipografía, atajos) están presentes.

## Próximos Pasos
1. Verificar/instalar `gcloud`.
2. Ejecutar `deploy-cloudrun.bat`.
3. Crear el prompt Stitch (ver `stitch_ui_prompt.md`).
4. Generar `deployment_report.md` con logs de build y despliegue.

---
*Este documento ha sido creado automáticamente por la skill **idea‑os**.*
