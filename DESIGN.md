# DESIGN.md — ParkOps PMS & ERP
## Sistema de Diseño Unificado · Versión 2026 · CORDANO-PMS-2026

> **Actualizado**: Octubre 2026  
> **Fuente de Diseño**: Google Stitch `projects/10292600008632163693` + Magnific AI Presets  
> **Aplicación**: Landing Page Comercial + Cockpit Operativo de Garita + Módulos ERP

---

## 1. Principios de Diseño

| Principio | Regla |
|:---|:---|
| **Comercial primero** | La landing es el escaparate del producto. Debe hablar el lenguaje del cliente, no del técnico. Cero jerga. |
| **Operativo sin scroll** | Las pantallas de garita (POS, Matriz, POS Cobro) no requieren scroll en 1080p/4K. |
| **Keyboard-First** | F1–F9 como atajos primarios. El campo de patente/ticket tiene autofoco inmediato. |
| **Numérica tabular** | Todo valor CLP, tiempo y correlativo usa `font-mono` + `tabular-nums`. |
| **Modo claro / oscuro** | Todos los componentes soportan ambos temas. El token de cada color se define en par light/dark. |
| **Accesibilidad AA** | Ratio de contraste mínimo 4.5:1. Focus visible en todos los interactivos. |

---

## 2. Paleta de Color

### 2.1 Colores Semánticos de Plazas (Obligatorio — sin excepciones)

| Estado | Token | Hex | Uso |
|:---|:---|:---|:---|
| Disponible / Libre | `--slot-libre` | `#10B981` | Plaza abierta, confirmación, éxito |
| Ocupado | `--slot-ocupado` | `#64748B` | Plaza con vehículo activo |
| Reservado | `--slot-reservado` | `#F59E0B` | Plaza con reserva previa |
| Abonado / VIP | `--slot-abonado` | `#3B82F6` | Contrato mensual activo |
| PMR (Movilidad Reducida) | `--slot-pmr` | `#06B6D4` | Plaza preferencial |
| Punto Carga EV | `--slot-ev` | `#8B5CF6` | Electrolinera |
| Sobrestadía / Alerta | `--slot-alerta` | `#EF4444` | Más de 3 horas sin cobro |
| Offline / Contingencia | `--slot-offline` | `#F97316` | Ticket emitido sin conexión |

### 2.2 Superficies

| Token | Light | Dark |
|:---|:---|:---|
| `--surface-app` | `#f8fafc` | `#09090f` |
| `--surface-base` | `#ffffff` | `#111118` |
| `--surface-raised` | `#f1f5f9` | `#17171f` |
| `--surface-overlay` | `rgba(15,23,42,0.72)` | `rgba(0,0,0,0.75)` |
| `--surface-dark-hero` | `#0f172a` | `#0a0a14` |

### 2.3 Marca y Acentos

| Token | Hex | Rol |
|:---|:---|:---|
| `--accent-brand-dark` | `#0f172a` | Marca principal (modo claro), botón primario light |
| `--accent-emerald` | `#10B981` | CTA principal, éxito, estados "libre", badge landing |
| `--accent-emerald-hover` | `#059669` | Hover sobre CTA, botones secundarios activos |
| `--accent-warning` | `#F59E0B` | Alertas suaves, abonados por vencer |
| `--accent-danger` | `#EF4444` | Error, sobrestadía, descuadre de caja crítico |
| `--accent-info` | `#3B82F6` | Informativo, abonados VIP |

### 2.4 Texto

| Token | Light | Dark |
|:---|:---|:---|
| `--text-primary` | `#0f172a` | `#f8fafc` |
| `--text-secondary` | `#475569` | `#94a3b8` |
| `--text-tertiary` | `#94a3b8` | `#475569` |
| `--text-inverted` | `#ffffff` | `#ffffff` |

### 2.5 Bordes

| Token | Light | Dark |
|:---|:---|:---|
| `--border-subtle` | `#e2e8f0` | `rgba(255,255,255,0.06)` |
| `--border-default` | `#e2e8f0` | `rgba(255,255,255,0.08)` |
| `--border-strong` | `#cbd5e1` | `rgba(255,255,255,0.14)` |

---

## 3. Tipografía

### 3.1 Familia de fuentes

| Rol | Fuente | Peso | Uso |
|:---|:---|:---|:---|
| Cuerpo / UI | `Plus Jakarta Sans` | 400, 600, 700, 800, 900 | Títulos, párrafos, botones, labels |
| Monoespaciada numérica | `JetBrains Mono` | 400, 600, 700, 900 | CLP, patentes, tickets, timers, coords |
| Fallback | `system-ui, -apple-system, sans-serif` | — | Sin carga de fuente |

### 3.2 Escala tipográfica

| Nivel | Tamaño | Peso | Uso |
|:---|:---|:---|:---|
| `display-xl` | `clamp(2rem, 4vw, 3.25rem)` | 900 | Hero H1 landing |
| `display-lg` | `clamp(1.75rem, 3.5vw, 2.5rem)` | 900 | Sección CTA final |
| `heading-lg` | `clamp(1.5rem, 3vw, 2.25rem)` | 900 | H2 de sección |
| `heading-md` | `1.125rem` / `18px` | 800 | Título de panel, card header |
| `body-lg` | `16px` | 400, 600 | Párrafos de hero |
| `body-md` | `14px` | 600 | Texto de módulos, descripciones |
| `body-sm` | `13px` | 600, 700 | Labels de nav, textos secundarios |
| `caption` | `12px` | 600, 700 | Subtítulos, badges, ayuda |
| `micro` | `11px` | 700 | Tags, UPPERCASE labels, tooltips |
| `mono-data` | `13–14px` | 700, 900 | CLP, timestamps, placas, códigos |

### 3.3 Reglas de letra

```css
/* Todo valor monetario, timer, ocupación o placa: */
font-family: 'JetBrains Mono', ui-monospace, monospace;
font-variant-numeric: tabular-nums;
font-feature-settings: "tnum" 1;
letter-spacing: -0.01em;

/* H1, H2 de landing: */
letter-spacing: -0.04em to -0.06em;
line-height: 1.08–1.15;

/* Badges y micro-labels: */
font-weight: 700;
letter-spacing: 0.08em;
text-transform: uppercase;
```

---

## 4. Espaciado y Layout

### 4.1 Grid principal

| Contexto | Grid | Gap |
|:---|:---|:---|
| Landing Hero | `1.2fr 0.8fr` | `40px` |
| Módulos | `repeat(auto-fill, minmax(260px, 1fr))` | `16px` |
| FAQ | `1fr` | `8px` |
| Footer | `flexbox space-between` | `16px` |
| Cockpit Garita | `7fr 5fr` (sin scroll) | `16px` |
| Matriz de Plazas | `repeat(auto-fill, minmax(72px, 1fr))` | `8px` |

### 4.2 Max-widths

| Contexto | Max Width |
|:---|:---|
| Landing completa | `1200px` |
| FAQ / Soporte | `1000px` |
| Hero párrafo | `480px` |
| Hero descripción FAQ | `440px` |
| App (Cockpit) | `1536px` |

### 4.3 Radios

| Token | Valor | Uso |
|:---|:---|:---|
| `--radius-sm` | `6px` | Badges, chips pequeños |
| `--radius-md` | `9–10px` | Inputs, botones secundarios |
| `--radius-lg` | `14–16px` | Cards de módulo, FAQ items |
| `--radius-xl` | `20px` | Login panel, modales |
| `--radius-2xl` | `24px` | Secciones grandes |
| `--radius-pill` | `9999px` | Badges de estado, toggle pill |

---

## 5. Componentes de Landing

### 5.1 Navbar pública (landing)

```
height: 60px
position: sticky top-0 z-50
background: rgba(bg, 0.92) + backdrop-blur(16px)
border-bottom: 1px solid --border-subtle
```

**Contenido**: Logo + Nombre · Links de sección (Módulos, Funciones, FAQ) · Toggle dark/light · CTA "Iniciar sesión →"

### 5.2 Hero Section

**Layout**: Grid 1.2fr / 0.8fr en desktop, apilado en mobile  
**Izquierda**: Badge animado → H1 comercial → párrafo → doble botón CTA → stats strip  
**Derecha**: Login panel flotante con shadow y border

**Badge animado**:
```
background: rgba(16,185,129,0.12)
border: 1px solid rgba(16,185,129,0.25)
border-radius: 99px
dot: 6px verde pulsante (animation: pulse 2s infinite)
```

### 5.3 Login Panel

```
background: --surface-base
border: 1px solid --border-default
border-radius: 20px
padding: 32px
box-shadow: dark: 0 24px 48px rgba(0,0,0,0.4) | light: 0 16px 48px rgba(15,23,42,0.08)
```

**Elementos**:
1. Toggle de rol (Operador / Administrador) — pill selector
2. Input Email/Usuario
3. Input Contraseña con toggle show/hide
4. Link "¿Olvidaste tu contraseña?"
5. Botón "Ingresar al Sistema →" (verde `#10B981`, `box-shadow: 0 4px 12px rgba(16,185,129,0.3)`)
6. Divider + link de soporte

**Estado de error**: `background: rgba(239,68,68,0.12)` + `border: rgba(239,68,68,0.3)`  
**Estado de carga**: spinner `⟳` rotando + texto "Verificando..."

### 5.4 Matrix Preview (Sección oscura)

```
background: #0f172a (light) / #0a0a14 (dark)
padding: 64px 20px
```

Slot cards en grid `auto-fill, minmax(72px, 1fr)`, cada una con:
- `background: ${colorSlot}18` (12% opacidad del color semántico)
- `border: 1.5px solid ${colorSlot}40` (25% opacidad)
- `border-radius: 10px`
- Emoji de estado + ID + label
- Transición suave (`transition: all 0.4s cubic-bezier(0.16,1,0.3,1)`)

### 5.5 Module Cards

```
background: --surface-base
border: 1.5px solid --border-default (hover → colorMódulo + 40%)
border-radius: 16px
padding: 22px
transition: all 0.3s cubic-bezier(0.16,1,0.3,1)
hover: translateY(-3px) + box-shadow
```

**Estructura**: Emoji grande (28px) + Badge de categoría (10px UPPERCASE) → Título (14px 800) → Descripción (12px)

### 5.6 FAQ Accordion

```
background: --surface-base
border: 1px solid --border-default
border-radius: 14px
overflow: hidden
```

- Botón header: full-width, padding `20px 24px`, `flex justify-between`  
- Número `P.01` en `JetBrains Mono` + color `#10B981`
- Ícono `+` con `transform: rotate(45deg)` cuando está abierto
- Respuesta: `border-top: 1px solid --border`, `padding: 16px 24px 20px`

### 5.7 Footer dark

```
background: #0f172a (light) / #060608 (dark)
padding: 32px 20px
```

Tres columnas: Empresa + dirección · Links legales · Copyright

---

## 6. Animaciones

### 6.1 Reveal on scroll (Intersection Observer)

```tsx
// Hook useInView con threshold 0.15
// Estilos inline:
transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.6s ...
opacity: inView ? 1 : 0
transform: inView ? 'translateY(0)' : 'translateY(24px)'
```

**Delays escalonados**: Módulos → `i * 50ms`, FAQ → `i * 40ms`, Stats → `260ms`

### 6.2 Badge de ocupación pulsante

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

Dot verde de 6px en badge de hero. Indica conexión live.

### 6.3 Hover de botones

```
CTA Landing: scale(1.03) + transición 200ms
Module Card: translateY(-3px) + box-shadow
Nav links: color → textPrimary + background → surfaceRaised
Toggle dark/light: opacity 0.87 en hover
```

### 6.4 Loader de login

```
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
```

Spinner `⟳` en font-size 16px, duración 1s lineal.

### 6.5 Contador de plazas animado

```tsx
// State: setOccupancy cada 3 segundos ±1 plaza
// Rango: 10–28 plazas ocupadas (demo)
setInterval(() => setOccupancy(o => Math.min(28, Math.max(10, o + (Math.random() > 0.5 ? 1 : -1)))), 3000)
```

---

## 7. Dark / Light Mode

### Implementación

```tsx
// Hook useDarkMode():
// Detecta prefers-color-scheme del sistema
// Permite override manual con toggle (navbar)
// Se suscribe a cambios del sistema con addEventListener

const [isDark, setIsDark] = useState(() =>
  window.matchMedia('(prefers-color-scheme: dark)').matches
);
```

### Estrategia de theming

Se usan variables CSS inline (no clases Tailwind) para todo el contenido de la landing, ya que el tema se aplica dinámicamente en tiempo de ejecución. Esto permite:
1. Reactividad instantánea al cambiar tema (sin flash)
2. Compatibilidad con Google AI Studio
3. Sin dependencia de `document.documentElement.classList`

---

## 8. Responsive

| Breakpoint | Estrategia |
|:---|:---|
| `< 640px` (mobile) | Hero apilado (login arriba, texto abajo), nav simplificada (sin links, solo logo + CTA), matriz en 3 columnas |
| `640–1024px` (tablet) | Hero 1 columna, módulos 2 columnas |
| `> 1024px` (desktop) | Hero 2 columnas, módulos 4 columnas |

```css
/* Mobile override vía @media */
@media (max-width: 768px) {
  .hero-grid { grid-template-columns: 1fr !important; }
  .login-card-container { order: -1; } /* Login primero en mobile */
}
```

---

## 9. Magnific AI — Presets para Mejora Visual

### Preset A: UI Screenshots & Dashboard (Cockpit Garita)
- **Engine**: Faithful / Graphic Design
- **Creativity**: `0` (nunca deformar números CLP o placas)
- **Resemblance**: `95`
- **HDR**: `10`
- **Fractality**: `0`
- **Prompt**: `Ultra-sharp enterprise dark mode UI dashboard, crisp vector icons, perfectly legible monospace numbers, flat clean surfaces, 8k resolution, zero compression artifacts, pixel-perfect alignment.`

### Preset B: Recinto Serrano 447 (Vista Arquitectónica)
- **Engine**: Hard Surface / Architecture
- **Creativity**: `+3`
- **Resemblance**: `75`
- **HDR**: `45`
- **Fractality**: `35`
- **Prompt**: `Aerial view of an outdoor parking lot in Iquique Chile, emerald green and slate painted stalls marked 01 to 30, automatic barriers, coastal daylight, hyperrealistic 8k.`

### Preset C: CCTV / LPR Feed
- **Engine**: Photographic
- **Creativity**: `+2`
- **Resemblance**: `80`
- **HDR**: `30`
- **Prompt**: `Security CCTV camera view of car entering parking booth, Chilean license plate, industrial gate, realistic lens distortion, timestamp overlay.`

### Preset D: Landing Hero Image
- **Engine**: Photographic + Structure
- **Creativity**: `+1`
- **Resemblance**: `85`
- **HDR**: `20`
- **Prompt**: `Modern parking management software landing page screenshot, dark mode UI, emerald accents, clean enterprise design, 4K retina display, no compression.`

---

## 10. Google Stitch — Origen y Referencia

Las pantallas base de este sistema de diseño provienen del proyecto Stitch `projects/10292600008632163693`:

| Pantalla Stitch | Descripción | Aplicación en código |
|:---|:---|:---|
| `parkops_split_workstation` | Workstation dividida garita/info | `PosView.tsx`, cockpit split layout |
| `parkops_matriz_kanban_30plazas` | Matriz 30 plazas Kanban | `AnalyticsView.tsx`, matrix grid |
| `parkops_terminal_dark_metallic` | Terminal oscura metálica | Preset colores dark mode |
| `parkops_launchpad_minimalista` | Hub minimalista de accesos | `MenuView.tsx` |
| `parkops_login_modulos` | Login con módulos laterales | `LandingView.tsx` — Hero + Login panel |
| `parkops_acceso_informacion` | FAQ + Soporte + Info | `LandingView.tsx` — Sección FAQ |
| `parkops_terminal_hud_inmersiva` | HUD garita inmersiva | `InicioHub.tsx` |
| `parkops_matriz_kanban_v2` | Matriz v2 compacta | Slots grid 72px |

---

## 11. Tokens CSS Completos (`:root`)

```css
:root {
  /* ── Superficies (Light) ── */
  --surface-app:          #f8fafc;
  --surface-base:         #ffffff;
  --surface-raised:       #f1f5f9;
  --surface-overlay:      rgba(15, 23, 42, 0.72);
  --surface-dark-hero:    #0f172a;

  /* ── Bordes ── */
  --border-subtle:        #e2e8f0;
  --border-default:       #e2e8f0;
  --border-strong:        #cbd5e1;

  /* ── Texto ── */
  --text-primary:         #0f172a;
  --text-secondary:       #475569;
  --text-tertiary:        #94a3b8;
  --text-inverted:        #ffffff;

  /* ── Marca ── */
  --accent-brand:         #0f172a;
  --accent-emerald:       #10B981;
  --accent-emerald-hover: #059669;
  --accent-warning:       #F59E0B;
  --accent-danger:        #EF4444;
  --accent-info:          #3B82F6;

  /* ── Slots (Semántico obligatorio) ── */
  --slot-libre:           #10B981;
  --slot-ocupado:         #64748B;
  --slot-reservado:       #F59E0B;
  --slot-abonado:         #3B82F6;
  --slot-pmr:             #06B6D4;
  --slot-ev:              #8B5CF6;
  --slot-alerta:          #EF4444;
  --slot-offline:         #F97316;

  /* ── Radios ── */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --radius-xl:   20px;
  --radius-2xl:  24px;
  --radius-pill: 9999px;

  /* ── Transiciones ── */
  --ease-spring:  cubic-bezier(0.16, 1, 0.3, 1);
  --ease-smooth:  cubic-bezier(0.4, 0, 0.2, 1);
  --duration-sm:  200ms;
  --duration-md:  300ms;
  --duration-lg:  600ms;

  /* ── Sombras ── */
  --shadow-sm:   0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-md:   0 4px 14px rgba(15, 23, 42, 0.08);
  --shadow-lg:   0 16px 48px rgba(15, 23, 42, 0.10);
  --shadow-cta:  0 4px 12px rgba(16, 185, 129, 0.30);
  --shadow-dark: 0 24px 48px rgba(0, 0, 0, 0.40);
}

/* ── Dark overrides ── */
@media (prefers-color-scheme: dark) {
  :root {
    --surface-app:     #09090f;
    --surface-base:    #111118;
    --surface-raised:  #17171f;
    --surface-overlay: rgba(0, 0, 0, 0.75);
    --border-subtle:   rgba(255, 255, 255, 0.06);
    --border-default:  rgba(255, 255, 255, 0.08);
    --border-strong:   rgba(255, 255, 255, 0.14);
    --text-primary:    #f8fafc;
    --text-secondary:  #94a3b8;
    --text-tertiary:   #475569;
  }
}
```

---

## 12. Auditoría de Colores — Reglas Antifraude

| Elemento | Color | Contexto |
|:---|:---|:---|
| Descuento autorizado (con PIN) | `#10B981` verde | Fila en bitácora |
| Recargo / Multa ticket perdido | `#EF4444` rojo | Fila en bitácora |
| Ticket pagado normal | `#3B82F6` azul | Fila en bitácora |
| Diferencia de caja OK (≤ $2.000) | `#10B981` verde | Panel arqueo |
| Diferencia de caja CRÍTICA (> $2.000) | `#EF4444` rojo | Panel arqueo |
| Turno sin abrir (admin) | `#F59E0B` ámbar | Badge de estado |

---

*Documento generado por Antigravity + Stitch Design System · CORDANO-PMS-2026*
