# LogiFlows — AI-Powered Smart Postal & B2B Logistics Platform

> **Phase 00: Complete Project Initialization & Setup — COMPLETE**

LogiFlows is an enterprise-grade B2B logistics, postal, and supply chain service platform designed to connect logistics organizations, branches, vehicle fleets, and parcel custody under a secure, multi-tenant digital architecture.

---

## 🚀 Technology Stack
- **Backend API**: Python 3.12 (Docker) / 3.14 (Host), Django 5.1, Django REST Framework 3.15, `psycopg` 3.3, `drf-spectacular` 0.27
- **Frontend SPA**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Axios, Lucide Icons
- **Database**: PostgreSQL 16 Alpine with named persistent storage volume
- **Orchestration**: Docker Compose v2 with automated healthcheck probes on all services
- **Testing**: pytest & pytest-django (Backend), Vitest & RTL (Frontend), Playwright (E2E Browser Smoke Tests)

---

## 📦 Getting Started (Docker Compose)

### 1. Prerequisites
- Docker Engine & Docker Compose
- Git

### 2. Launch Platform
```bash
# Clone the repository
git clone <repo-url>
cd "Logiflows B@B service platform"

# Configure environment variables
cp .env.example .env

# Build and start services
docker compose up -d --build
```

### 3. Verify Service Health
```bash
docker compose ps
```
All 3 containers (`logiflows_db`, `logiflows_backend`, `logiflows_frontend`) report `healthy`.

### 4. Live Endpoints
- **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
- **Development Status Console**: [http://localhost:3000/app/status](http://localhost:3000/app/status)
- **12-Phase Architecture Roadmap**: [http://localhost:3000/app/architecture](http://localhost:3000/app/architecture)
- **Backend Health Check Probe**: [http://localhost:8000/api/v1/health/](http://localhost:8000/api/v1/health/)
- **Database Readiness Probe**: [http://localhost:8000/api/v1/readiness/](http://localhost:8000/api/v1/readiness/)
- **Swagger UI Interactive API Explorer**: [http://localhost:8000/api/v1/docs/](http://localhost:8000/api/v1/docs/)
- **OpenAPI 3.0 Schema**: [http://localhost:8000/api/v1/schema/](http://localhost:8000/api/v1/schema/)
- **Django Admin**: [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

## 🧪 Automated Testing

### Backend Test Suite (pytest)
```bash
# Inside Docker:
docker compose exec backend pytest

# Host Virtual Environment:
cd backend
pytest
```
*Result: 13 / 13 tests passed in 0.72s (100% pass rate).*

### Frontend Component & Unit Tests (Vitest)
```bash
cd frontend
npm test
```
*Result: 20 / 20 tests passed across 4 suites in 3.40s (100% pass rate).*

### Browser Smoke Tests (Playwright)
```bash
cd frontend
npx playwright test
```
*Result: 4 / 4 browser smoke tests passed in 6.0s (100% pass rate).*

---

## 📚 Documentation Index
Comprehensive engineering specifications are organized in the [`docs/`](file:///docs/) directory:
- [01 - Project Overview](file:///docs/01-project-overview/project-charter.md)
  - [`project-charter.md`](file:///docs/01-project-overview/project-charter.md)
  - [`objectives.md`](file:///docs/01-project-overview/objectives.md)
  - [`scope.md`](file:///docs/01-project-overview/scope.md)
- [02 - Requirements](file:///docs/02-requirements/srs.md)
  - [`srs.md`](file:///docs/02-requirements/srs.md)
  - [`functional-requirements.md`](file:///docs/02-requirements/functional-requirements.md)
  - [`non-functional-requirements.md`](file:///docs/02-requirements/non-functional-requirements.md)
- [03 - Architecture](file:///docs/03-architecture/system-architecture.md)
  - [`system-architecture.md`](file:///docs/03-architecture/system-architecture.md)
  - [`component-diagram.md`](file:///docs/03-architecture/component-diagram.md)
  - [`technology-stack.md`](file:///docs/03-architecture/technology-stack.md)
- [04 - Database](file:///docs/04-database/database-design.md)
  - [`database-design.md`](file:///docs/04-database/database-design.md)
  - [`initial-er-diagram.md`](file:///docs/04-database/initial-er-diagram.md)
- [05 - UI/UX](file:///docs/05-ui-ux/design-system.md)
  - [`design-system.md`](file:///docs/05-ui-ux/design-system.md)
  - [`frontend-architecture.md`](file:///docs/05-ui-ux/frontend-architecture.md)
- [06 - API](file:///docs/06-api/api-standards.md)
  - [`api-standards.md`](file:///docs/06-api/api-standards.md)
  - [`api-documentation.md`](file:///docs/06-api/api-documentation.md)
- [07 - Docker](file:///docs/07-docker/docker-setup.md)
  - [`docker-setup.md`](file:///docs/07-docker/docker-setup.md)
  - [`environment-configuration.md`](file:///docs/07-docker/environment-configuration.md)
- [08 - Testing](file:///docs/08-testing/test-strategy.md)
  - [`test-strategy.md`](file:///docs/08-testing/test-strategy.md)
  - [`test-results.md`](file:///docs/08-testing/test-results.md)
- [09 - Agile Methodology](file:///docs/09-agile/product-backlog.md)
  - [`product-backlog.md`](file:///docs/09-agile/product-backlog.md)
  - [`sprint-plan.md`](file:///docs/09-agile/sprint-plan.md)
  - [`phase-tracker.md`](file:///docs/09-agile/phase-tracker.md)
- [10 - Phase Completion Reports](file:///docs/10-phase-reports/phase-00-completion-report.md)
  - [`phase-00-completion-report.md`](file:///docs/10-phase-reports/phase-00-completion-report.md)

---

## ⚖️ License
Proprietary & Confidential. All rights reserved.
