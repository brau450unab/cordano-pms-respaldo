# Plan de Migración y Fusión (Lógica + Estética)

Este plan detalla cómo migraremos las funcionalidades críticas de la antigua versión publicada (`cordanopms.ai.studio`) hacia la nueva estética construida en Next.js.

## 🎯 Situación Actual
1. **El "Cascarón Estético" (Next.js)**: Ya hemos integrado la interfaz visual (`OfficialAuxViews`, `OfficialLandingAndMenu`, `OfficialModals`) que aporta el diseño pulido, limpio y la arquitectura Tailwind CSS requerida.
2. **El "Motor Funcional" (Vite Legacy)**: Todo el código fuente de la versión publicada (ahora importado a la carpeta `legacy_published_version`) contiene más de 20 modales y componentes de lógica pesada (ej. `ModalAperturaTurno`, `ModalCuadraturaVouchers`, `TableroKanbanEstadia`, `TicketModal`, `CommandPalette`).
3. **Integración de Cuentas**: Ya hemos extraído la configuración de `firebase-applet-config.json` y creado el archivo `.env.local` en el nuevo proyecto, vinculándolo oficialmente con tu backend `gen-lang-client-0862587160` (Google AI Studio / Cloud Run).

## 🚀 Fases de Migración

### Fase 1: Portar el Sistema Base de Autenticación y Turnos
- [ ] Mover la lógica de Firebase App Check y Auth desde `legacy_published_version/src/services/` al backend de Next.js (`src/app/api`).
- [ ] Recrear el `ModalAperturaTurno.tsx` e integrarlo al flujo de la nueva interfaz, manteniendo la estética de los "Slots Wireframe".
- [ ] Importar `ChecklistAperturaModal.tsx`.

### Fase 2: Operaciones de Patio y Facturación
- [ ] Migrar el `TicketModal.tsx` (que contiene la lógica de impresión térmica de 80mm y escaneo dual de código QR/Code 128).
- [ ] Restaurar el `ModalConvenioDetectado.tsx` para gestionar servicios paralelos sin ocupar cupos de transitorios.
- [ ] Integrar el `TableroKanbanEstadia.tsx` en la nueva vista de operaciones (`OfficialEngineView`).

### Fase 3: Auditoría, Cierre Ciego e Inteligencia Artificial
- [ ] Restaurar el `ReporteFinancieroTurnoModal.tsx` y el `ModalRevisionVehiculosCierre.tsx`.
- [ ] Traer de vuelta la funcionalidad del **Copiloto Operativo de Garita** (AI Assistant con Function Calling).
- [ ] Restaurar la funcionalidad del **Visor de Documentación Canónica** conectándolo con los archivos locales `.md`.

## 🛠️ Próximo Paso Sugerido
Para comenzar, iniciaremos la **Fase 1** adaptando la capa de Servicios y Autenticación, asegurando que la conexión con tu base de datos esté activa en el nuevo entorno antes de montar los componentes visuales.
