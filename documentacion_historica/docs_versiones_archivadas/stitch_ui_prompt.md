# Stitch UI Design Prompt

**Prompt for Google Stitch**

```
Dashboard for ParkOps PMS (Cordano) – Garita Operativa

Key Features:
- Occupancy matrix (30 spots + 5 sobrecupos) displayed as a grid of color‑coded squares.
- Colors follow the official palette (Disponible #10B981, Ocupada #64748B, Reservada #F59E0B, VIP #3B82F6, PMR #06B6D4, EV #8B5CF6, Sobrestadía #EF4444).
- Above the matrix a compact toolbar with keyboard‑first shortcuts: F1‑F9, Enter, Esc.
- Numeric values (prices, timers, counts) use monospaced font with `tabular‑nums`.
- Side panel shows real‑time revenue summary (CLP) and a large "Abrir barrera" button.
- Minimalist, high‑contrast Tailwind‑CSS style, no decorative gradients.
- Responsive: mobile (640px) – tablet (1024px) – desktop (1440px).
- Accessibility: WCAG AAA contrast, focus outlines, ARIA labels.
```

**Export Options**
- HTML/CSS for direct integration into the Next.js codebase.
- Component snippets for React (Tailwind classes included).
- Figma file for design‑system synchronization.

**Additional Notes**
- Use `font-mono` for all numeric values.
- Ensure each grid cell has a data‑attribute `data-spot="A-01"` etc. for future telemetry.
- Include hover state (slightly brighter shade) for available spots.
- Provide variant generation: (a) light theme, (b) dark theme.
```
