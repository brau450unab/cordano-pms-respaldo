## Goal Description
The goal is to combine the deep business‑logic implementation of the current **NUEVO PMS CORDANO** codebase with the modern, polished UI from the **cordano‑pms‑version‑publicada** folder. The result should be a single Next.js application that retains all existing functional endpoints, services, and data models while adopting the newer visual components, layout, and design system.

---
## User Review Required
> [!IMPORTANT] **Potential breaking changes**
> - Replacing UI components may require updating prop signatures and state management across many pages. Ensure that any custom hooks or context providers used by the current UI are compatible with the new components.
> - The published version uses its own Tailwind configuration and design tokens. Merging them could cause class name conflicts.

---
## Open Questions
> [!WARNING] **Component compatibility**
> - Which parts of the new UI should replace the existing ones? (e.g., full layout, Navbar, modals, dashboards) – or only specific screens?
> - Are there any custom business rules in the current version that rely on UI‑specific behaviours (e.g., focus handling, keyboard shortcuts) that need to be preserved?
> 
> [!CAUTION] **Styling strategy**
> - Do you want to adopt the Tailwind configuration from the published version entirely, or merge it with the current project's configuration?
> - Should we keep the existing design‑system tokens (`stitch-design-system`) or replace them with the ones used by the published UI?

---
## Proposed Changes
### 1. Project Structure Alignment
- **Create a UI layer**: `src/ui/` will contain all UI components imported from `cordano-pms-version-publicada`.
- **Add a compatibility shim**: Small wrapper components that adapt props from the current pages to the new UI components.

### 2. Import New UI Components
#### [MODIFY] `src/app/layout.tsx`
```diff
- import { Navbar } from "../components/Navbar";
+ // New UI Navbar from published version
+ import { Navbar as NewNavbar } from "../ui/components/Navbar";
```
- Update any layout wrappers to use `NewNavbar` and `NewSidebar`.

#### [NEW] `src/ui/components/`
- Copy UI component files from `cordano-pms-version-publicada/src/components/` (e.g., `Header.tsx`, `Sidebar.tsx`, `Modal*`, `TicketModal.tsx`).
- Adjust import paths for shared utilities (`src/lib/`, `src/services/`).

### 3. Tailwind / Design System Merge
- **Create** `tailwind.config.ui.js` based on the published version’s config.
- **Merge** with existing `tailwind.config.js` using `@import` or extending the `theme`.
- Update `postcss.config.js` to reference the merged config.

### 4. Context & State Compatibility
- Review current context files (`src/context/*`).
- Export any needed values from the existing contexts and provide them to the new UI components via props or React Context wrappers.

### 5. API & Service Reuse
- No changes to backend routes (`src/api/*`) or services (`src/lib/*`, `src/services/*`).
- Ensure that any UI component that previously fetched data directly now uses the shared service layer.

### 6. Type Alignment
- Verify that component prop types (`src/types/*`) match across the two codebases.
- Add/adjust TypeScript interfaces where necessary.

### 7. Testing & Validation
#### Automated Tests
- Run existing Jest/Playwright tests to ensure no regressions.
- Add new component rendering tests for the imported UI components.

#### Manual Verification
- Verify critical user flows: ticket entry, shift opening, payment, auditoria logs, and dashboard navigation.
- Check that keyboard shortcuts (F1‑F9, Enter, Esc) still work.

---
## Verification Plan
**Automated Tests**
```bash
npm run test          # unit tests
npm run test:e2e      # end‑to‑end flow tests (Playwright)
```
**Manual Verification**
1. Start the dev server: `npm run dev`.
2. Navigate to each major screen (Login, Hub, Dashboard, Registro, Checkout) and confirm UI matches the published style.
3. Perform a typical transaction (check‑in, payment, checkout) and ensure data persists and backend calls succeed.
4. Verify that all role‑based restrictions (admin vs operador) still enforce the business rules defined in `AGENTS.md`.
5. Confirm that the color‑code semantics for parking spots are displayed correctly.

---
## Timeline (tentative)
| Phase | Tasks | Duration |
|------|-------|----------|
| 1️⃣ Analysis & mapping | File inventory, prop mapping, Tailwind merge plan | 2 days |
| 2️⃣ UI import & shims | Copy UI, create wrappers, adjust imports | 3 days |
| 3️⃣ Styling integration | Merge Tailwind configs, test CSS build | 2 days |
| 4️⃣ Type & context alignment | Update interfaces, add context providers | 2 days |
| 5️⃣ Testing & QA | Run automated tests, manual walkthrough | 2 days |
| **Total** |  | **11 days** |

---
## Next Steps
- Resolve the open questions above.
- Once clarified, proceed with implementation as outlined.
- Keep the `src/ui/` folder version‑controlled to allow future UI updates without affecting core logic.
