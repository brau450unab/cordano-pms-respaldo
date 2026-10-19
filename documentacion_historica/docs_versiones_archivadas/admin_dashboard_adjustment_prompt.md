# Admin Dashboard UI Adjustment Specification

**Role:** UI/UX Designer & Front-end Developer  
**Objective:** Refactor the Admin Dashboard to maximize focus, information density, and task management efficiency.

---

### 1. Layout Changes
- **Conditional Visibility:** The side (left) menu must be **HIDDEN** whenever the central grid dashboard is active.
- **Side Menu Behavior:** The sidebar only appears in sub-modules where the central dashboard is absent. It must be fully **collapsible/expandable** via a toggle button.
- **Workspace:** The central grid should expand to fill the horizontal space when the sidebar is hidden.

### 2. Component Sizing
- **Icons:** Significantly enlarge module icons (suggested 48px - 64px) to serve as primary visual anchors.
- **Typography Hierarchy:**
    - **Titles:** Increase font size and weight (Headline-md or lg).
    - **Body Text:** Reduce size (Label-sm or Body-sm) and use secondary color contrast to deprioritize descriptions.

### 3. Background Design
- **Module Patterns:** Each module card must feature a representative background "entramado" (SVG pattern or watermark).
- **Aesthetic:** Patterns should be subtle (low opacity) but distinct enough to identify the module's function (e.g., bar charts for reports, gear for config).

### 4. Top Bar
- **Simplification:** Remove all summary widgets ("Ingresos hoy", "Ocupación actual").
- **Content:** The top bar should contain ONLY the upper navigation, global search, notifications, and user avatar.

### 5. Avatar & Notification Menus
- **Single Source of Truth:** The avatar menu must appear **exclusively** in the top bar. Remove any user profile sections from the sidebar to avoid redundancy.
- **Placement:** Notification bell and Avatar remain in the top-right corner.

### 6. Task Widget
- **Functional Requirements:**
    - **Task Creation:** Input field for task description.
    - **Date Assignment:** Integrated date picker or quick-select dates.
    - **Pending List:** A scrollable list showing active tasks with their due dates.
    - **Status:** Simple checkbox to mark as complete/clear.

### 7. Additional Recommendations
- **Focus Mode:** Use a slightly darker background for the workspace (`surface-dim`) and pure white for the module cards to make them pop.
- **Empty States:** Ensure the Task Widget has a clean "No pending tasks" state.
- **Hover States:** Add subtle elevation or border-color shifts on module cards to improve interactivity feedback.
