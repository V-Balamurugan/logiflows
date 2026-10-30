# LogiFlows Project Scope Specification

## 1. Phase 00 Strict Scope Boundaries

In accordance with Section 14 (Strict Phase 0 Scope Control), Phase 00 encompasses infrastructure, core framework architecture, and automated testing baseline ONLY.

### In Scope (Phase 00 Deliverables)
- Project directory organization (`backend/`, `frontend/`, `docs/`).
- Python / Django 5.1 / Django REST Framework 3.15 initialization.
- Custom User model (`apps.users.models.User`) extending `AbstractUser`.
- Environment-based configuration (`config.settings.base`, `development`, `test`).
- PostgreSQL 16 connection setup with health probe (`/api/v1/health/`) and readiness probe (`/api/v1/readiness/`).
- OpenAPI 3.0 schema and Swagger UI documentation endpoints via `drf-spectacular`.
- React 18 + TypeScript + Vite + Tailwind CSS frontend application.
- Public Landing Page with responsive Header, Hero, Product Overview, and Planned Features Grid.
- Application Shell with Collapsible Sidebar, Topbar with Breadcrumbs, and Tenant Context indicator.
- Development Status Page with real-time API and PostgreSQL latency monitoring.
- Standard 404 (Not Found) and Global Error Fallback boundary.
- Docker Compose baseline configuration (`db`, `backend`, `frontend`).
- Automated tests (pytest for backend, Vitest for frontend, Playwright for browser smoke tests).
- Comprehensive engineering documentation in `docs/`.

---

## 2. Explicitly Out of Scope (Deferred to Later Phases)
The following operational business capabilities are strictly prohibited in Phase 00:
- User registration, login, logout, and password reset flows (Phase 01).
- JWT token generation, refresh, and rotation (Phase 01).
- Multi-tenant Organization onboarding and tenant administration (Phase 01).
- Role-Based Access Control (RBAC) permission matrices (Phase 01).
- Fleet registration, vehicle CRUD, and driver assignments (Phase 02).
- Parcel booking, consignment waybills, and weight tariffs (Phase 03).
- QR code generation and custody handoff verification (Phase 04).
- Branch and hub warehouse staging (Phase 05).
- Delivery assignment run-sheets and dispatch (Phase 06).
- TSP dynamic route optimization (Phase 07).
- Machine learning AI delivery delay prediction models (Phase 08).
- Real-time customer tracking and SMS/email notifications (Phase 09).
- Automated freight invoicing, billing, and tax computation (Phase 10).
- Operational analytics and executive BI dashboards (Phase 11).
