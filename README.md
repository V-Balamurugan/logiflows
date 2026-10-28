# LogiFlows — B2B Logistics Service Platform

> **Phase 00 Foundation, Architecture & Docker Baseline**

LogiFlows is an enterprise-grade B2B logistics, freight, and supply chain service platform designed to connect shippers, carriers, freight forwarders, dispatchers, and warehouse operators under a secure, multi-tenant architecture.

---

## 🚀 Technology Stack
- **Backend API**: Python 3.12, Django 5.0, Django REST Framework 3.15, `psycopg` 3.1
- **Frontend SPA**: React 18, TypeScript, Vite, Lucide Icons, Vanilla CSS Design System
- **Database**: PostgreSQL 16 Alpine
- **Containerization**: Docker Compose v2 with health check probes on all services
- **Testing**: Django Test Suite, Vitest, React Testing Library

---

## 📦 Getting Started (Docker Compose)

### 1. Prerequisites
- Docker Desktop with WSL2 or Docker Engine
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

### 3. Verify Health
```bash
docker compose ps
```
All 3 containers (`logiflows_db`, `logiflows_backend`, `logiflows_frontend`) will report `healthy`.

### 4. Endpoints
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend Health Check**: [http://localhost:8000/api/v1/health/](http://localhost:8000/api/v1/health/)
- **Platform Info**: [http://localhost:8000/api/v1/platform-info/](http://localhost:8000/api/v1/platform-info/)
- **Django Admin**: [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

## 🧪 Automated Testing

### Backend Unit Tests
```bash
# Inside Docker:
docker compose exec backend python manage.py test apps.common

# Native:
cd backend && python manage.py test apps.common
```

### Frontend Vitest Tests
```bash
cd frontend
npm test
```

---

## 📚 Documentation Index
Comprehensive engineering specifications are located in the [`docs/`](file:///docs/) directory:
- [01 - Project Charter](file:///docs/01-project-charter/project-charter.md)
- [02 - Software Requirements Specification (SRS)](file:///docs/02-srs-requirements/software-requirements-specification.md)
- [03 - System Architecture](file:///docs/03-architecture/system-architecture.md)
- [04 - Database ER Diagram](file:///docs/04-database-er/entity-relationship-diagram.md)
- [05 - Role-Permission Matrix](file:///docs/05-role-matrix/role-permission-matrix.md)
- [06 - API Design Conventions](file:///docs/06-api-conventions/api-conventions.md)
- [07 - Design System & UI Tokens](file:///docs/07-design-system/design-system.md)
- [08 - Developer Setup Guide](file:///docs/08-developer-setup/developer-setup-guide.md)
- [09 - Docker Deployment Guide](file:///docs/09-docker-guide/docker-deployment-guide.md)
- [10 - Agile Backlog & Tracker](file:///docs/10-agile-backlog/phase-backlog.md)
- [11 - Phase 00 Completion Report](file:///docs/11-phase-completion-reports/phase-00.md)
- [12 - Traceability Matrix](file:///docs/12-traceability-and-quality/traceability-matrix.md)

---

## ⚖️ License
Proprietary & Confidential. All rights reserved.
