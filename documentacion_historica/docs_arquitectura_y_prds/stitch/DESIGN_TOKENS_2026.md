# Tokens de Diseño y Sistema UI Oficial: Google Stitch ➔ CORDANO-PMS-2026

Extraído directamente de las pantallas y especificaciones maestras del proyecto:
**Google Stitch Project**: `projects/10292600008632163693` (*ParkOps Parking ERP*)
**URL**: https://stitch.withgoogle.com/projects/10292600008632163693

---

## 1. Paleta de Colores Oficial (High-Tech Garita HUD)

```json
{
  "colors": {
    "workstation-bg": "#07090e",
    "macos-surface": "#0c111a",
    "macos-elevated": "#121926",
    "macos-card": "#151d2c",
    "macos-border": "rgba(255, 255, 255, 0.08)",
    "macos-border-bright": "rgba(255, 255, 255, 0.16)",
    "primary": "#38bdf8",
    "primary-focus": "#0ea5e9",
    "primary-bright": "#00f0ff",
    "accent-bordeaux": "#a52c55",
    "accent-bordeaux-glow": "rgba(165, 44, 85, 0.35)",
    "cyan-glow": "rgba(56, 189, 248, 0.25)",
    "status": {
      "available": "#10b981",
      "occupied": "#64748b",
      "reserved": "#f59e0b",
      "vip_agreement": "#3b82f6",
      "pmr": "#06b6d4",
      "ev_charging": "#8b5cf6",
      "alert_overstay": "#ef4444"
    }
  }
}
```

---

## 2. Tipografía Oficial

* **Fuentes Principales**:
  * `Geist` (Inter / SF Pro Display alternativa para jerarquía limpia de títulos y lectura rápida)
  * `JetBrains Mono` (Monoespaciada obligatoria con `tabular-nums` para montos en CLP `$4.500`, patentes, tiempos y correlativos)
* **Escala Tipográfica**:
  * `display-lg`: 48px / Line-height: 56px (Bold)
  * `headline-xl`: 36px / Line-height: 44px (Semibold)
  * `headline-lg`: 28px / Line-height: 36px (Semibold)
  * `headline-md`: 22px / Line-height: 30px (Semibold)
  * `body-lg`: 16px / Line-height: 24px (Regular)
  * `body-md`: 14px / Line-height: 20px (Regular)
  * `label-sm` (Telemetría / Chips): 10px / Line-height: 14px (Semibold Mono)

---

## 3. Catálogo de Pantallas de Google Stitch Descargadas Localmente

Las siguientes pantallas oficiales ya se encuentran disponibles en la carpeta [`/stitch_designs/`](./stitch_designs/):

1. **Estación Split Workstation**: [`parkops_split_workstation.html`](./stitch_designs/parkops_split_workstation.html)
   - Layout dual de garita: cobro rápido a la izquierda, cámara LPR e inspección visual a la derecha.
2. **Matriz de 30 Plazas y Tablero Kanban**: [`parkops_matriz_kanban_30plazas.html`](./stitch_designs/parkops_matriz_kanban_30plazas.html)
   - Vista topológica interactiva de Serrano 447 con selector de modo (Split, Topología, Kanban).
3. **Terminal HUD Inmersiva**: [`parkops_terminal_hud_inmersiva.html`](./stitch_designs/parkops_terminal_hud_inmersiva.html)
   - Vista HUD de alto contraste para garita nocturna o monitores de control.
4. **Terminal Dark Metallic**: [`parkops_terminal_dark_metallic.html`](./stitch_designs/parkops_terminal_dark_metallic.html)
   - Estética metálica refinada para kioscos o terminales de autoservicio.
5. **Launchpad Minimalista**: [`parkops_launchpad_minimalista.html`](./stitch_designs/parkops_launchpad_minimalista.html)
   - Centro de accesos rápidos a módulos ERP y control de garita.
6. **Inicio de Sesión y Módulos**: [`parkops_login_modulos.html`](./stitch_designs/parkops_login_modulos.html)
   - Autenticación segura de operarios y supervisores con PIN y roles.
7. **Acceso e Información**: [`parkops_acceso_informacion.html`](./stitch_designs/parkops_acceso_informacion.html)
   - Portal de bienvenida y consulta pública de tarifas y reglamentos.
