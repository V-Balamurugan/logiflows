# Changelog

All notable changes to the **LogiFlows B2B Service Platform** project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-10-30
### Added - Phase 01 Authentication & User Management
- **Database & Data Models**:
  - Extended custom `User` model (`apps.accounts.models.User`) with account lockout tracking (`failed_login_attempts`, `last_failed_login`, `lockout_until`, `last_login_ip`).
  - Added `UserProfile` model (`phone_number`, `avatar_url`, `bio`, timestamps) with 1-to-1 linkage to `User`.
  - Added `AccountToken` model for database-backed, single-use, 24-hour expiring activation and password reset tokens hashed with SHA-256 digests.
  - Added `AuditLog` model recording immutable security logs (`actor`, `action`, `target`, `ip_address`, `user_agent`, `metadata`, `created_at`) with compound indexes on `(actor, created_at)` and `(action)`.
  - Integrated `rest_framework_simplejwt.token_blacklist` for rotating refresh token revocation.
- **Backend Services & Security**:
  - Implemented service functions: `register_customer` (atomic transaction with email rollback), `activate_account` (row-level lock verification), `authenticate_user` (generic invalid credentials error and 5-attempt/15-minute account lockout), `refresh_user_tokens` (rotating refresh token with blacklist), `change_password`, `request_password_reset`, `confirm_password_reset`.
  - Added `LoginRateThrottle`, `PasswordResetRateThrottle`, and `RegisterRateThrottle` for IP-based throttling.
  - Implemented full RBAC hierarchy: `IsPlatformAdmin`, `IsOrganizationOwner`, `IsOrganizationAdmin`, `IsBranchManager`, `IsEmployee`, `IsCustomer`, `HasAnyRole`, `ObjectOwnerPermission`, and `TenantAwareMixin`.
  - Created management command `python manage.py createplatformadmin` for CLI-only platform superadmin bootstrapping.
- **API Endpoints (`/api/v1/auth/*`, `/api/v1/users/me/*`)**:
  - `POST /api/v1/auth/register/` (public customer registration)
  - `POST /api/v1/auth/activate/` (cryptographic single-use activation)
  - `POST /api/v1/auth/login/` (credentials verification, HttpOnly refresh cookie injection)
  - `POST /api/v1/auth/refresh/` (silent token rotation via cookie)
  - `POST /api/v1/auth/logout/` (server-side blacklist and cookie clearing)
  - `POST /api/v1/auth/password/change/` (authenticated password change)
  - `POST /api/v1/auth/password/reset/request/` (anti-enumeration reset request)
  - `POST /api/v1/auth/password/reset/confirm/` (token redemption and password update)
  - `GET/PATCH /api/v1/users/me/` & `GET /api/v1/users/me/profile/` (user and profile self-service)
  - Fully documented in drf-spectacular OpenAPI 3.0 schema.
- **Frontend Single Page Application**:
  - In-memory JWT access token management in `axios.ts` with request authorization interceptor.
  - Single-flight token refresh queue on 401 Unauthorized errors with deduplicated session restoration.
  - `AuthContext` and `useAuth` hook providing silent cookie session bootstrap, authentication state, and role assertions.
  - Components: `ProtectedRoute`, `RoleGuard`, `PasswordStrengthIndicator`.
  - Auth Pages: `LoginPage`, `RegisterPage`, `ActivationPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `UnauthorizedPage` (403), and `ProfilePage`.
  - React Hook Form + Zod schema validations mirroring backend security rules.
- **Docker & Infrastructure**:
  - Added `mailpit` service (ports 1025 SMTP and 8025 Web UI) in `docker-compose.yml` for local development mail sink.
  - Verified Docker Compose stack build (`docker compose build`) passes cleanly.
- **Automated Verification**:
  - Backend: 64 pytest tests passing (93% test coverage on `apps.accounts`).
  - Frontend: 56 Vitest unit and component tests passing (100% pass rate).
  - End-to-End: 11 Playwright browser tests passing (smoke tests + full auth lifecycle).
  - TypeScript: `tsc --noEmit` clean with 0 errors.
  - Total automated tests: 131 / 131 tests passing across the stack.

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
