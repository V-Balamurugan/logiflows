# LogiFlows — Mandatory Post-Phase Synchronization Standard

## 1. Principle & Core Rule

> [!IMPORTANT]
> **COMPULSORY POST-PHASE COMPLETION REQUIREMENT:**
> At the completion of every development phase, it is **strictly mandatory** to update, polish, and synchronize all user-facing dashboards, telemetry probes, navigation shells, announcement banners, and site status indicators across the entire LogiFlows platform before declaring the phase complete. Never leave stale phase tags (e.g. "Phase 00" or previous phase indicators) on the live site when new capabilities are operational.

---

## 2. Compulsory Phase Synchronization Checklist

For every phase (Phase 01 through Phase 11), the following 6 areas **must** be updated and tested:

### 1. Role-Based Operations Dashboards (`/dashboard`)
Every role tier must receive an intelligent, functional command center structured into **5 distinct segregated sections** for optimal UX and interaction:
1. **Section 1: Executive Command & Phase Milestone Header**: Current operational state, active tenant workspace badges, role identification, and immediate quick actions.
2. **Section 2: Key Operational Metrics & Telemetry**: Scoped numerical KPIs, live data trends, and active resource counts (platform-wide, tenant-wide, or branch-specific).
3. **Section 3: End-to-End Logistics Process Flow (`ProcessFlowStepper`)**: Interactive visual lifecycle (Tenant Identity → Hub Facilities → Postal Coverage → Workforce RBAC → Consignment Waybills → Custody & Dispatch), tracking completed versus upcoming milestone stages.
4. **Section 4: Operational Command Center & Quick Controls**: Segregated category cards for Postal Coverage Verification, Tenant/Hub Directory, Workforce Provisioning, and Profile Security.
5. **Section 5: Next Phase Roadmap Preview & Capability Unlocks**: Transparent preview card outlining capabilities unlocking in the immediate next phase.

Every role tier is supported with tailored data:
- **PLATFORM_ADMIN**: Global multi-tenant health, tenant queue counts, aggregate operational hubs, total workforce stats, and direct administrative quick actions.
- **ORGANIZATION_OWNER / ORGANIZATION_ADMIN**: Tenant-scoped operational KPIs, branch hubs, covered delivery postal codes, active workforce roster, verified tenant status badge, and profile configuration links.
- **BRANCH_MANAGER**: Hub operational view, assigned workforce counts, delivery postal service areas covered, and branch dispatch tools.
- **EMPLOYEE (Couriers & Field Staff)**: Assigned organization & hub badges, duty status, postal code serviceability search, and active assignment queues.
- **CUSTOMER**: Account verification overview, postal serviceability checker widget, B2B organization registration portal, and self-service shipment booking previews.

### 2. Public Announcement Banners & Layout Shells
- **Public Header Banner (`PublicLayout.tsx`)**: Update the top announcement banner to reflect the current live phase, active multi-tenant capabilities, and direct links to health telemetry.
- **App Shell Header & Sidebar (`AppShell.tsx`)**: Update the top navbar status badge (e.g. `Phase 02 Multi-Tenant Network`), active tenant organization context, and security/tenancy status badge in the sidebar footer.
- **Legacy Shells (`AppShellLayout.tsx`)**: Keep all fallback/legacy layout components synchronized with the current phase badge and description.

### 3. Public Landing Page (`LandingPage.tsx`)
- **Hero Badge**: Update the top pill badge to state the active live phase and key operational capabilities.
- **Live vs Planned Feature Matrix**: Categorize features explicitly into **Live Capabilities** (with direct navigation buttons) vs **Upcoming Milestones** (transparent roadmap previews).
- **CTA Actions**: Provide high-visibility entry points to live capabilities (Dev Console, Health Telemetry, Postal Serviceability Checker, Organization Registration).

### 4. Real-Time Telemetry & Status Page (`/status`)
- **Architecture & Verification Card**: Update the audited badge (e.g., `PHASE 02 VERIFIED`) and list live database-enforced capabilities.
- **Backend Health Probe**: Ensure `/api/v1/health/` reports the matching version string (`1.0.0-phase-XX`) and PostgreSQL query latency.

### 5. Architecture & Roadmap Viewers
- **Interactive Web Roadmap (`/app/architecture`)**: Update status badges (`COMPLETE`, `READY`, `BACKLOG`) and milestone summaries across all 12 phases.
- **Documentation Gantt Chart (`docs/09-agile/phase-tracker.md`)**: Update Mermaid Gantt chart dates, active markers, and acceptance status tables.

### 6. Automated Verification & Quality Gates
- **Frontend Test Suites**: Update tests asserting on announcement strings (e.g. `App.test.tsx`, `navigation.test.tsx`, `dashboard.test.tsx`) so that tests validate the real active phase and remain 100% passing.
- **Clean Production Build**: Validate with `npm run build` (`tsc && vite build`) with zero TypeScript errors before pushing.

---

## 3. Enforcement & Governance

No phase pull request, commit, or acceptance gate may be approved without fulfilling this synchronization standard. This ensures the LogiFlows platform consistently feels alive, polished, and immediately understandable to all users and stakeholders.

