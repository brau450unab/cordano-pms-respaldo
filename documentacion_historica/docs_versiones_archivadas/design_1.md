---
name: Iquique Operations Interface
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#584237'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#8c7164'
  outline-variant: '#e0c0b1'
  surface-tint: '#9d4300'
  primary: '#9d4300'
  on-primary: '#ffffff'
  primary-container: '#f97316'
  on-primary-container: '#582200'
  inverse-primary: '#ffb690'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#006398'
  on-tertiary: '#ffffff'
  tertiary-container: '#00a2f4'
  on-tertiary-container: '#003554'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#ffb690'
  on-primary-fixed: '#341100'
  on-primary-fixed-variant: '#783200'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#cde5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#004b74'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
  sidebar-bg: '#0F172A'
  sidebar-item-active: '#334155'
  surface-main: '#FFFFFF'
  surface-alt: '#F8FAFC'
  status-success: '#10B981'
  status-error: '#EF4444'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar-width: 260px
  sidebar-collapsed: 72px
  gutter: 24px
  margin-page: 32px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

This design system is engineered for operational excellence, catering to the logistics and parking management sector. The brand personality is **Professional, Reliable, and Highly Functional**. It prioritizes clarity and speed of information processing, essential for real-time urban management.

The design style is **Corporate / Modern**, characterized by a sophisticated high-contrast layout. It utilizes a structural "Command Center" approach: a dark, authoritative sidebar for navigation contrasted with a clean, expansive white workspace for data and administrative tasks. The aesthetic avoids unnecessary decoration, focusing instead on clear information hierarchy, purposeful color accents, and a robust typographic structure that ensures legibility in high-pressure environments.

## Colors

The palette is anchored by **Slate Navy (#0F172A)**, used for the primary navigation sidebar to establish a sense of stability and authority. The workspace resides on a **Crisp White (#FFFFFF)** canvas to maximize contrast and reduce eye strain during prolonged use.

- **Primary Orange (#F97316):** Used exclusively for high-priority actions, active navigation states, and critical highlights. It provides a warm, energetic contrast against the cool navy.
- **Secondary Blue (#2563EB):** Utilized for secondary interactive elements, informational links, and supporting data visualizations.
- **Functional Neutrals:** A range of Slate grays is used for borders, secondary text, and background shifts to create a clear visual hierarchy without introducing noise.

## Typography

This design system utilizes **Inter** across all levels to ensure maximum legibility and a modern, neutral feel. 

The typographic hierarchy is bold and structured. Headlines use a tighter letter-spacing and heavier weights to command attention, while body text maintains generous line heights for readability. For data-heavy tables and dashboards, `label-md` and `label-sm` are preferred to maintain high information density while preserving clarity. In the dark sidebar, typography should transition to high-contrast white or light-gray variants.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. The sidebar remains at a fixed width (or collapses to an icon-only view), while the main workspace content area is fluid, utilizing a 12-column grid system for internal dashboard components.

### Breakpoints
- **Desktop (1280px+):** Full 260px sidebar, 32px page margins.
- **Tablet (768px - 1279px):** Collapsed sidebar (72px), 24px page margins. Content reflows to 2-column or 1-column cards.
- **Mobile (< 767px):** Hidden sidebar (accessible via hamburger menu), 16px page margins. Single column layout for all data cards.

Spacing follows an 8px base grid to ensure consistent alignment and a clean rhythmic vertical flow (`stack-sm` to `stack-lg`).

## Elevation & Depth

Visual hierarchy is primarily established through **Tonal Layers** rather than heavy shadows, maintaining a clean, professional aesthetic.

- **Level 0 (Floor):** The sidebar (`#0F172A`) and the main workspace background (`#F8FAFC`).
- **Level 1 (Card/Surface):** White surfaces (`#FFFFFF`) used for content containers and data tables. These use a very subtle, highly diffused 4% opacity neutral shadow to lift them slightly from the background.
- **Level 2 (Interaction/Overlays):** Modals, dropdowns, and tooltips. These use a more pronounced, 12% opacity shadow with a 16px blur to indicate immediate priority.
- **Outlines:** Low-contrast borders (`#E2E8F0`) are used to define boundaries within white surfaces, such as table rows and input fields, avoiding visual clutter.

## Shapes

The design system employs a **Rounded** shape language (8px default radius). This softens the corporate aesthetic, making the professional interface feel modern and accessible without sacrificing the structured feel required for a management system.

- **Small elements (Checkboxes, Tags):** 4px radius.
- **Standard elements (Buttons, Inputs, Cards):** 8px radius (`rounded-md`).
- **Large elements (Modals, Feature Sections):** 16px radius (`rounded-lg`).
- **Interactive States:** Highlighting in the sidebar uses a 6px radius to sit comfortably within the navigation container.

## Components

### Buttons
- **Primary:** Orange (#F97316) background with white text. Solid, no gradient.
- **Secondary:** Transparent background with Blue (#2563EB) border and text.
- **Ghost:** Used in the sidebar for inactive items; white text at 70% opacity.

### Input Fields
- Structured with a 1px border (#E2E8F0) and 8px corner radius.
- Active focus state uses a 2px Primary Orange border with a subtle orange outer glow.

### Cards
- Used for dashboard widgets and "most frequent" sections.
- White background, 1px border (#E2E8F0), and 16px padding.
- For highlighted features, a subtle secondary background or accent top-border in Primary Orange may be used.

### Navigation (Sidebar)
- Dark Slate (#0F172A) base. 
- Active items use a semi-transparent "Slate-700" background and a Primary Orange 4px vertical bar on the left edge or as an icon accent.

### Chips & Status Indicators
- Status indicators for parking occupancy or payment status use a "pill" shape (full rounding).
- Success uses Emerald Green; Warnings use Orange; Errors use Red. These should be paired with subtle tinted backgrounds (e.g., 10% opacity) for better scannability.