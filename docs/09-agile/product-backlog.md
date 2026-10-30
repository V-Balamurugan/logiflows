# LogiFlows Product Backlog (12-Phase Agile Architecture)

## 1. Phase 00 User Stories & Detailed Breakdown

### STORY-00-1: Repository Structure & Specification Baseline
- **Description**: As a Software Architect, I need to organize the project repository into decoupled `backend/`, `frontend/`, and `docs/` tiers and define the complete software requirements specification (SRS).
- **Status**: **DONE**
- **Acceptance Criteria**:
  - [x] Clean directory layout with no pollution across tiers.
  - [x] Complete project charter, objectives, scope, functional and non-functional requirements documented.
  - [x] Zero business logic from future phases implemented.
- **Evidence**: `docs/01-project-overview/` and `docs/02-requirements/` created and reviewed.

---

### STORY-00-2: Backend Architecture & Custom User Model
- **Description**: As a Backend Developer, I need to configure Django 5.1 with Django REST Framework, modular settings (base, dev, test), centralized logging, OpenAPI schemas, and a custom AbstractUser model.
- **Status**: **DONE**
- **Acceptance Criteria**:
  - [x] Settings split into `config/settings/base.py`, `development.py`, and `test.py`.
  - [x] Custom `User` model created inheriting `AbstractUser` before initial migration.
  - [x] OpenAPI 3.0 schema and Swagger UI endpoints exposed under `/api/v1/`.
  - [x] Centralized error handler returning structured JSON envelopes.
- **Evidence**: 13/13 backend tests passing in pytest; migration `apps/users/migrations/0001_initial.py` created; `python manage.py check` passing with 0 errors.

---

### STORY-00-3: PostgreSQL Persistence & Readiness Probes
- **Description**: As a Database Engineer, I need to configure a dedicated PostgreSQL 16 database with persistent storage volume, `pg_isready` health check, and live API readiness endpoints.
- **Status**: **DONE**
- **Acceptance Criteria**:
  - [x] Dedicated database `logiflows_db` and user `logiflows_user` configured via environment variables.
  - [x] Healthcheck probe using `pg_isready` defined in `docker-compose.yml`.
  - [x] API readiness endpoint `/api/v1/readiness/` actively querying `SELECT 1;` and measuring latency.
  - [x] Persistent volume `postgres_data` declared to ensure zero data loss on restart.
- **Evidence**: `test_database.py` and `test_health.py` verify connection, query latency, and failure handling.

---

### STORY-00-4: Frontend React SPA & Enterprise Design System
- **Description**: As a Frontend Developer and UI/UX Designer, I need to establish a React 18 + TypeScript + Vite SPA featuring Tailwind CSS, React Router, TanStack Query, and an enterprise dark-mode design system.
- **Status**: **DONE**
- **Acceptance Criteria**:
  - [x] Curated color tokens (Navy, Blue, White, Restrained Teal) and glassmorphism styling.
  - [x] Public Landing Page with Header, Hero, Product Overview, and Planned Features Grid.
  - [x] Application Shell with collapsible Sidebar, Topbar with Breadcrumbs, and Tenant context.
  - [x] Development Status Page displaying real-time API and PostgreSQL telemetry with zero dummy data.
  - [x] Clean 404 (Not Found) page and Global Error Fallback boundary.
- **Evidence**: 20/20 Vitest unit/component tests passing; `tsc && vite build` completes in 5.71s with 0 errors.

---

### STORY-00-5: Quality Assurance & Playwright Smoke Suite
- **Description**: As a QA Engineer, I need to configure automated testing across unit, integration, and browser smoke test levels.
- **Status**: **DONE**
- **Acceptance Criteria**:
  - [x] Backend tests executable via `pytest`.
  - [x] Frontend tests executable via `npm test`.
  - [x] Browser smoke tests executable via `npx playwright test`.
  - [x] All test suites passing with 100% pass rate.
- **Evidence**: 37 / 37 automated tests passed (13 pytest, 20 Vitest, 4 Playwright).

---

## 2. All 12 Project Phases Status Overview
| Phase | Title | Status | Dependencies |
| :--- | :--- | :---: | :--- |
| **Phase 00** | Project Initialization & Docker Setup | **DONE** | None |
| **Phase 01** | Multi-Tenant Architecture & Authentication | **READY** | Phase 00 |
| **Phase 02** | Fleet & Vehicle Master Management | **BACKLOG** | Phase 01 |
| **Phase 03** | Parcel Booking & Consignment Waybill | **BACKLOG** | Phase 01, 02 |
| **Phase 04** | QR Code Custody Transfer Engine | **BACKLOG** | Phase 03 |
| **Phase 05** | Branch & Hub Warehouse Staging | **BACKLOG** | Phase 01, 03 |
| **Phase 06** | Delivery Assignment & Dispatch | **BACKLOG** | Phase 02, 05 |
| **Phase 07** | Dynamic Route Optimization | **BACKLOG** | Phase 06 |
| **Phase 08** | AI Delivery Delay Prediction | **BACKLOG** | Phase 03, 07 |
| **Phase 09** | Real-Time Tracking & Notifications | **BACKLOG** | Phase 04, 08 |
| **Phase 10** | Contract Invoicing & Billing | **BACKLOG** | Phase 03, 06 |
| **Phase 11** | Analytics & Executive Intelligence | **BACKLOG** | All Phases |
