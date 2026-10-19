# CORDANO PMS — Archivo Histórico de Documentación

> **CENTRALIZACIÓN DE CONTEXTO HISTÓRICO Y EVOLUTIVO**  
> Este directorio almacena la totalidad de los documentos, PRDs, flujos de diseño y análisis producidos a lo largo de las distintas etapas de conceptualización e implementación de **CORDANO PMS (ParkOps)**.

---

## Estructura del Archivo

### 1. `docs_arquitectura_y_prds/`
Contiene la documentación oficial de arquitectura, especificaciones de pantallas, roles de usuario y diagramas:
- **PRDs Oficiales:** `cordano_operations_erp_official_prd.md`, `PRD_SISTEMA_DE_PARKING.md`.
- **Arquitectura de Base de Datos:** Esquemas híbridos, modelo relacional/documental y planes de contingencia offline.
- **Planes de Pantallas:** Cockpit de garita, Arqueo de Caja Ciego, Configuración de Tarifas, Auditoría y Reportes.
- **Flujos Operativos:** Guías SOP para cajero/operador y supervisor/administrador.

### 2. `contexto_conversaciones/`
Contiene los documentos clave generados en las sesiones maestras de Antigravity:
- **Conversación DOCUMENTACIÓN (`33563bff-fe19-497c-b065-97d247aa58f8`):**
  - `DISEÑO_APROBACIONES_DIFERIDAS.md`: Mecanismo express antifraude con validación en lote al cierre de turno.
  - `PROMPT_FLUJO_DE_TURNOS_Y_CAJA.md`: Especificación del ciclo de vida de turnos, apertura con fondo de sencillo y cierre ciego.
  - `mapa_de_sitio_y_rutas_plan.md`: Las 20 rutas canónicas agrupadas en 7 secciones funcionales.
  - `cloud_database_architecture_plan.md`: Arquitectura Cloud Run y persistencia Firestore.
- **Conversación INTERFAZ (`6eeff568-afba-40ff-994d-eab716bddd53`):**
  - `ALINEACION_OPERATIVA.md`: Adaptación del PMS a la realidad física de Serrano 447 (sin barrera de hardware, caja ciega pura, agilidad sobre burocracia).
  - `FLUJO_OPERATIVO.md`: Diagrama del paso a paso del cajero en garita.
  - `estetica_unificada_reporte.md`: Consolidación de la paleta oficial (Rosa `#E2498A`, Slate `#F8FAFC`, Dark `#1E1E2F`).

### 3. `docs_versiones_archivadas/`
Historial de iteraciones previas, minutas de reuniones y versiones preliminares conservadas únicamente con fines de auditoría.
