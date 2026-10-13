---
target_identity: "file:C:\\Users\\BraulioAM\\OneDrive - UNIVERSIDAD ANDRES BELLO\\PROYECTOS ANTIGRAVITY\\CORDANO PMS FINAL\\cordano-pms-core-pages"
timestamp: 2026-10-13T13-52-29Z
slug: cordano-pms-core-pages
---
# Reporte de Crítica de Diseño — Cordano PMS Core Pages

**Target**: `http://localhost:3000/`, `/login`, `/menu`, `/settings`  
**Score**: 28/40  
**Method**: dual-agent (A: 607cd9d2-5c5d-4e9a-8ea2-1e558b0c09d9 · B: aca4f151-eb96-44a7-bd92-175aafd9b919)

### Heuristics Table
| # | Heurística | Puntaje | Problema Clave |
|---|---|---|---|
| 1 | Visibilidad del estado del sistema | 3/4 | En Login no se indica si el recinto está abierto/cerrado o con turno en marcha. |
| 2 | Coincidencia con el mundo real | 4/4 | Terminología canónica chilena precisa (Arqueo ciego, gaveta $ 50.000, Ley 20.967). |
| 3 | Control y libertad del usuario | 2/4 | Mini-login en Landing compite con /login; omite selector de rol para usuarios híbridos. |
| 4 | Consistencia y estándares | 2/4 | Estilo blueprint/terminal en Login rompe con la paleta Rosa Cordano del resto. |
| 5 | Prevención de errores | 3/4 | Settings usa prompt nativo window.confirm() invasivo en vez de modal integrado. |
| 6 | Reconocimiento antes que recuerdo | 3/4 | Faltan indicadores visuales explícitos de atajos de teclado en tarjetas de MenuView. |
| 7 | Flexibilidad y eficiencia de uso | 3/4 | Buenos atajos F1-F10 pero checklist de apertura carece de navegación por teclado. |
| 8 | Diseño estético y minimalista | 2/4 | LandingView sobrecargada: venta B2B, ocupación en vivo, carrusel y caja de login. |
| 9 | Ayuda a los usuarios a recuperarse de errores | 3/4 | Errores claros en Login y banner RBAC explicativo en Settings para operadores. |
| 10 | Ayuda y documentación | 3/4 | Soporte telefónico/email integrado; falta onboarding para el checklist de apertura. |
| **Total** | | **28/40** | **Nivel Aceptable (Deuda de consistencia arquitectónica)** |

### Design Specificity Verdict
El sistema posee una altísima fidelidad de dominio chileno e iquiqueño (Serrano 447, 30 plazas, Ley 20.967, DTE SII Boletas 39/41), pero sufre de una fractura estética en tres dialectos visuales discordantes:
1. LandingView: SaaS B2B comercial moderno con acentos rosa `#E2498A`.
2. LoginPage: Terminal industrial / Blueprint técnico monocromático `#1E1E2F` con corchetes mecánicos y cero rosa corporativo.
3. MenuView / SettingsView: Dashboard administrativo denso con disparidad de tokens.

El escaneo determinista reveló 301 valores HEX hardcodeados, 285 clases arbitrarias Tailwind, 0 presencia de Rosa Cordano en Login, anomalías de clases duplicadas (`tabular-nums tabular-nums`) e inconsistencias en formato monetario (`$50.000` vs `$ 50.000`).

### Priority Issues
- **[P0] Unificación Estética de LoginPage.tsx**: Eliminar estética blueprint y corchetes mecánicos; integrar paleta oficial Rosa Cordano `#E2498A` y fondos Slate `#F8FAFC`.
- **[P1] Desconexión Tripartita de Tokens**: Sincronizar DESIGN.md, index.css y eliminar los 301 valores HEX directos en JSX.
- **[P2] Separación de Intenciones en LandingView.tsx**: Desacoplar la captación comercial del portal de autenticación de garita.
- **[P3] Errata y Deuda Tipográfica en MenuView.tsx**: Corregir título "Convenios & Convenios" a "Convenios & Abonados Mensuales" y limpiar clases duplicadas `tabular-nums tabular-nums`.

### Persona Red Flags
- **Alex (Operador Garita)**: La landing compite con el acceso rápido; requiere autofoco inmediato y velocidad < 5s sin animaciones decorativas.
- **Jordan (Cajero Novato)**: Checklist con 4 checks marcados por defecto genera confusión sobre si la revisión física ya se realizó.
- **Don Roberto (Admin)**: Alerta confirm() nativa en Settings genera desconfianza técnica; el login técnico le parece roto frente a la Landing.
