# Project Requirements Document (PRD): Cordano Operations ERP

## 1. Executive Summary
**Cordano Operations ERP** is a high-fidelity parking management system designed for **Cordano Inversiones Inmobiliarias Ltda.** It focuses on professionalizing parking operations in Iquique, Chile, by replacing manual processes with a secure, real-time digital platform. The system prioritizes financial traceability, operational speed (POS), and administrative oversight via architectural data visualization.

---

## 2. Product Vision & Branding
### 2.1 Brand Identity
- **Personality:** Professional, Reliable, Architectural, Precise.
- **Visual Language:** Monochrome (Black/Charcoal/White) with high-density data presentation.
- **Logo:** Master monochrome white-on-black logo (nested frames around a central 'C').
- **Typography:** 
    - **Manrope:** Primary UI and headings.
    - **IBM Plex Mono:** Operational data (CLP, plates, durations).

---

## 3. User Personas
### 3.1 Patricia (Administrator/Owner)
- **Goal:** Real-time visibility of revenue and occupancy from any device.
- **Pain Points:** Cash leakage, lack of audit trails, manual reporting.
- **Key Tasks:** Financial oversight, tariff configuration, audit log review.

### 3.2 Carlos (Front-line Operator)
- **Goal:** Process check-ins and check-outs in under 10 seconds.
- **Pain Points:** Slow systems, long queues, personal liability for cash discrepancies.
- **Key Tasks:** Plate entry, ticket printing, cash handling, shift closure.

---

## 4. Functional Requirements

### 4.1 Core Operations (POS)
- **Check-in:** Rapid capture of plate, vehicle type, and assigned slot.
- **Check-out:** Automated tariff calculation based on time of entry, grace periods, and dynamic rates.
- **Payment Handling:** Support for Cash (with change calculator), Card (external terminal), and Customer Accounts.
- **Anti-passback:** System validation to prevent duplicate active entries for the same plate.

### 4.2 Parking Management
- **Real-time Layout:** Interactive 30-slot map showing occupancy, duration, and status (Available, Occupied, Reserved, Blocked).
- **Duration Tracking:** Visual alerts for long-stay vehicles (e.g., >4 hours).
- **Kanban View:** Alternate operational view grouping stays by duration categories.

### 4.3 Financial Control & Audit
- **Blind Cash Closure:** Operators must declare physical cash before the system reveals the expected total.
- **Audit Log:** Immutable ledger of all sensitive actions (voids, manual gate openings, discounts) with timestamp and user ID.
- **Discrepancy Reporting:** Automated flagging of cash differences outside set tolerances.

### 4.4 Administrative Tools
- **Dynamic Tariff Engine:** Configuration of rates by vehicle type, peak hours, holidays, and grace periods.
- **Task Management:** Kanban-style board for managing operational maintenance and staff tasks.
- **Reporting:** Exportable PDF/CSV reports for revenue, occupancy trends, and shift performance.

---

## 5. Technical Specifications
### 5.1 System Architecture
- **PWA / Web-first:** Optimized for desktop command centers with mobile-responsive oversight.
- **Offline Mode:** Local storage (IndexedDB) to allow POS operations during internet outages, with automatic background synchronization.

### 5.2 UI/UX Standards
- **App Shell:** Persistent dark sidebar (navigation) and command header.
- **Layout:** 12-column grid for dense data; Ivory canvas (#F5F5F3) to reduce eye strain.
- **Accessibility:** WCAG 2.1 compliance (Contrast, ARIA labels, Keyboard navigation).

---

## 6. Project Milestones
1. **Phase 1: Identity & Access:** Branding consolidation and secure multi-profile login flow. (Completed)
2. **Phase 2: Core POS & Layout:** Real-time monitoring and transactional flows. (Completed)
3. **Phase 3: Financial & Audit:** Shift management, blind closure, and audit logs. (In Progress)
4. **Phase 4: Advanced Reporting:** Automated financial analytics and client frequency mapping. (Pending)
5. **Phase 5: Configuration & Scale:** Multi-site management and tariff versioning. (Pending)

---
*Document Version: 1.0 | Status: Active Specification*