# Changelog

All notable changes to the **LogiFlows B2B Service Platform** project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-30
### Added - Phase 00 Foundation & Development Environment Initialization
- **Custom User Model**: Minimal `apps.users.models.User` extending `AbstractUser` and initial migration `0001_initial.py` configured via `AUTH_USER_MODEL = 'users.User'` prior to any business migrations.
- **Django Modular Settings**: Modular architecture under `config/settings/` (`base.py`, `development.py`, `test.py`) with environment-driven configurations and centralized logging.
- **OpenAPI 3.0 & Swagger UI**: Integrated `drf-spectacular` generating `/api/v1/schema/`, `/api/v1/docs/` (Swagger UI), and `/api/v1/redoc/`.
- **Health & Readiness Probes**: `/api/v1/health/` and `/api/v1/readiness/` (executes PostgreSQL `SELECT 1;` roundtrip probe) with standardized JSON response envelopes.
- **Frontend SPA & Design System**: React 18, TypeScript, Vite, and Tailwind CSS enterprise design system (Navy `#070d19`, Blue `#2563eb`, Teal `#0d9488`).
- **Core Pages**: Public Landing Page with header, hero, and planned module overview; App Shell with responsive sidebar and breadcrumbs; Live Telemetry Dev Status Page; 12-Phase Architecture Roadmap Page; 404 Not Found Page.
- **Container Infrastructure**: `docker-compose.yml` with PostgreSQL 16 Alpine (`pg_isready` healthcheck), Django 5.1 backend, and React frontend with proper internal service networking.
- **Automated Verification**:
  - Backend: 13 pytest tests passing (100% pass rate).
  - Frontend: 20 Vitest tests passing (100% pass rate).
  - End-to-End: 4 Playwright browser smoke tests passing (100% pass rate).
  - Total: 37 / 37 tests passing.
- **Documentation Suite**: 10 distinct documentation modules under `docs/` (Overview, Requirements, Architecture, Database, UI/UX, API, Docker, Testing, Agile, Phase Reports) + `README.md`, `CONTRIBUTING.md`.

