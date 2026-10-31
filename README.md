# LogiFlows — AI-Powered Smart Postal & B2B Logistics Platform

> **Phase 01: Authentication, Role-Based Access Control & User Management — COMPLETE**

LogiFlows is an enterprise-grade B2B logistics, postal, and supply chain service platform designed to connect logistics organizations, branches, vehicle fleets, and parcel custody under a secure, multi-tenant digital architecture.

---

## 🚀 Technology Stack
- **Backend API**: Python 3.12 (Docker) / 3.14 (Host), Django 5.1, Django REST Framework 3.15, `psycopg` 3.3, `drf-spectacular` 0.27, `djangorestframework-simplejwt`
- **Frontend SPA**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Axios, React Hook Form, Zod, Lucide Icons
- **Database**: PostgreSQL 16 Alpine with persistent storage volume
- **Dev Mail Sink**: Mailpit (SMTP on port 1025, Web UI on port 8025)
- **Orchestration**: Docker Compose v2 with automated healthcheck probes on all services
- **Testing**: pytest & pytest-django (Backend), Vitest & RTL (Frontend), Playwright (E2E Browser Tests)

---

## 📦 Getting Started (Docker Compose)

### 1. Prerequisites
- Docker Engine & Docker Compose
- Git

### 2. Launch Platform
```bash
# Clone the repository
git clone https://github.com/V-Balamurugan/logiflows.git
cd "logiflows"

# Configure environment variables
cp .env.example .env

# Build and start all services
docker compose up -d --build
```

### 3. Verify Service Health
```bash
docker compose ps
```
All 4 containers (`logiflows_db`, `logiflows_backend`, `logiflows_frontend`, `logiflows_mailpit`) will report `healthy`.

### 4. Live Endpoints
- **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
- **Development Status Console**: [http://localhost:3000/app/status](http://localhost:3000/app/status)
- **User Profile & Security**: [http://localhost:3000/profile](http://localhost:3000/profile)
- **12-Phase Architecture Roadmap**: [http://localhost:3000/app/architecture](http://localhost:3000/app/architecture)
- **Backend Health Check Probe**: [http://localhost:8000/api/v1/health/](http://localhost:8000/api/v1/health/)
- **Swagger UI Interactive API Explorer**: [http://localhost:8000/api/v1/docs/](http://localhost:8000/api/v1/docs/)
- **OpenAPI 3.0 Schema**: [http://localhost:8000/api/v1/schema/](http://localhost:8000/api/v1/schema/)
- **Mailpit Web Mail Sink**: [http://localhost:8025/](http://localhost:8025/)
- **Django Admin**: [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

## 🔐 Authentication & Security (Phase 01)
- **In-Memory JWT Access Tokens**: 15-minute lifespan stored in React state memory closures (immune to XSS `localStorage` theft).
- **HttpOnly Rotating Refresh Cookies**: 7-day lifespan with server-side blacklist rotation on every refresh.
- **Single-Use Cryptographic Tokens**: 24-hour expiring activation and password reset tokens hashed with SHA-256 and redeemed with row-level locks.
- **Account Lockout**: 5 failed consecutive attempts triggers 15-minute database-enforced lockout (`lockout_until`).
- **Immutable Audit Logging**: Complete actor, IP, User-Agent, and metadata capture in `AuditLog` table.
- **Platform Admin CLI**: Created exclusively via `python manage.py createplatformadmin`.

---

## 🧪 Automated Testing (134 / 134 Passing)

### Backend Test Suite (pytest)
```bash
# Host Virtual Environment:
pytest backend -v --cov=apps.accounts --cov-report=term-missing

# Inside Docker:
docker compose exec backend pytest -v --cov=apps.accounts
```
*Result: 67 / 67 tests passed in 2.15s (93% test coverage on `apps.accounts`).*

### Frontend Component & Unit Tests (Vitest)
```bash
cd frontend
npm test
```
*Result: 56 / 56 tests passed across 8 test suites in 6.09s (100% pass rate).*

### Browser End-to-End Tests (Playwright)
```bash
cd frontend
npx playwright test
```
*Result: 11 / 11 browser scenarios passed in 18.7s (smoke tests + full auth lifecycle).*

---

## 📚 Documentation Index
Comprehensive engineering specifications are organized in the [`docs/`](file:///docs/) directory:
- [Phase Status Tracker](file:///docs/phase-reports/phase-status.md)
- [Phase 01 Completion Report](file:///docs/phase-reports/PHASE_01_REPORT.md)
- [Phase 00 Completion Report](file:///docs/phase-reports/PHASE_00_REPORT.md)
- [ADR-004: Token Strategy & Security Audit Logging](file:///docs/ADRs/ADR-004-database-backed-single-use-tokens-and-security-audit-logging.md)
- [02 - Software Requirements Specification (SRS)](file:///docs/02-srs-requirements/software-requirements-specification.md)
- [04 - Entity-Relationship Diagram](file:///docs/04-database-er/entity-relationship-diagram.md)
- [05 - Role-Based Access Control Matrix](file:///docs/05-role-matrix/role-permission-matrix.md)
- [05 - Sample Users & Role Specifications Matrix](file:///docs/05-role-matrix/sample-users-and-role-specifications.md)
- [06 - API Design Conventions](file:///docs/06-api-conventions/api-conventions.md)

---

## ⚖️ License
Proprietary & Confidential. All rights reserved.
