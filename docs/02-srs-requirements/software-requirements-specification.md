# Software Requirements Specification (SRS) — LogiFlows B2B

## 1. Introduction
This Software Requirements Specification describes the functional and non-functional requirements for the LogiFlows AI-Powered Smart Postal and B2B Logistics Delivery Management Platform.

## 2. Actors & Personas
- **ACT-01 Super Admin / Platform Admin (`PLATFORM_ADMIN`)**: Global system administrator managing platform-wide health, audit ledgers, tenant creation, and system configurations. Created only via secured management command CLI (`createplatformadmin`).
- **ACT-02 Organization Owner (`ORGANIZATION_OWNER`)**: Head of a postal or logistics enterprise tenant with full billing, administrative, branch, and workforce management privileges.
- **ACT-03 Organization Admin (`ORGANIZATION_ADMIN`)**: Administrative operational manager for an organization tenant.
- **ACT-04 Branch Manager (`BRANCH_MANAGER`)**: Manages physical postal sorting hubs, branch inventory, custody transfers, and local vehicle/driver fleets.
- **ACT-05 Employee / Dispatcher (`EMPLOYEE`)**: Hub operator, driver, or postal clerk handling daily line-haul loading, waypoint scans, and delivery runs.
- **ACT-06 Customer (`CUSTOMER`)**: Public consignor or consignee who self-registers on the portal to book parcels, track shipments, and view delivery updates. Default role for all self-registrations.

## 3. Functional Requirements (FR)

### Module 1: Identity, Authentication & Role-Based Access Control (Phase 1)
- **FR-101 (Customer Self-Registration)**:
  - The system shall allow public users to self-register via `POST /api/v1/auth/register/` supplying email, password, and first/last name.
  - The system shall strictly assign the `CUSTOMER` role upon registration. Any client payload attempting to specify elevated roles (`role=PLATFORM_ADMIN`, `is_staff`, `is_superuser`) shall be ignored/rejected.
  - Newly registered users shall have `is_active=False` until email verification.
  - Registration is wrapped in an atomic transaction; if email dispatch fails, user creation rolls back completely.
- **FR-102 (Email Verification & Account Activation)**:
  - The system shall dispatch an activation email containing a high-entropy, 24-hour cryptographic token signed with SHA-256.
  - Verification via `POST /api/v1/auth/activate/` shall validate the token hash atomically with row-level locks, mark `is_used=True`, activate the account (`is_active=True`), and reject subsequent activations.
- **FR-103 (Authentication & Rotating JWT Session)**:
  - The system shall authenticate users via `POST /api/v1/auth/login/` with email and password. Inactive or locked accounts are rejected with generic, enumeration-safe errors.
  - Upon authentication, the system returns a short-lived access token (15-minute lifetime) in the JSON payload and sets an `HttpOnly`, `SameSite=Lax`, `Secure` (production) refresh token cookie with 7-day lifetime.
  - The frontend holds the access token strictly in memory (React state); tokens are never persisted in `localStorage` or `sessionStorage`.
  - Silent refresh via `POST /api/v1/auth/refresh/` validates the cookie, blacklists the old refresh token, and issues a rotated refresh cookie and access token.
- **FR-104 (Account Lockout & Anti-Brute Force)**:
  - The system shall record failed login attempts per user account. After 5 consecutive failed attempts, the account is locked for 15 minutes (`lockout_until = now + 15m`).
  - IP-based rate throttling limits login attempts to prevent distributed credential stuffing.
- **FR-105 (Password Lifecycle Management)**:
  - Authenticated users may change their password via `POST /api/v1/auth/password/change/` requiring validation of their current password and compliance with Django password validators.
  - Forgot password requests via `POST /api/v1/auth/password/reset/request/` generate single-use 24-hour reset tokens sent via email. Requests return identical 200 OK responses regardless of user existence (anti-enumeration).
  - Password reset confirmation via `POST /api/v1/auth/password/reset/confirm/` consumes the token and updates the password hash.
- **FR-106 (User Profile & Self-Service)**:
  - Authenticated users may query `GET /api/v1/users/me/` and `GET /api/v1/users/me/profile/` and update editable fields (`phone_number`, `bio`, `first_name`, `last_name`).
- **FR-107 (Immutable Security Audit Logging)**:
  - All authentication actions (`AUTH_REGISTER_SUCCESS`, `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILURE`, `AUTH_ACCOUNT_LOCKED`, `AUTH_TOKEN_REFRESH`, `AUTH_LOGOUT`, `AUTH_PASSWORD_CHANGE`, `AUTH_PASSWORD_RESET_REQUEST`, `AUTH_PASSWORD_RESET_SUCCESS`) are recorded in an append-only `AuditLog` table with actor, action, target, IP address, user-agent, and metadata.
  - Credentials and passwords are never logged or stored in audit records.

### Module 2: Multi-Tenancy & Organizations (Phase 2 Backlog)
- **FR-108**: The system shall isolate operational data by tenant organization (`organization_id`).

### Module 3: Shipment & Waybill Management (Phase 3 Backlog)
- **FR-201**: The system shall support state-machine lifecycles: `DRAFT`, `BOOKED`, `DISPATCHED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `EXCEPTION`, `CANCELLED`.

### Module 4: Infrastructure & Observability
- **FR-501**: The backend shall provide a public `/api/v1/health/` probe reporting DB connectivity and latency.
- **FR-502**: The frontend shall display real-time system status probing `/api/v1/health/` every 15 seconds.

## 4. Non-Functional Requirements (NFR)
- **NFR-SEC-01 (Token Storage)**: JWT access tokens must remain in JavaScript memory only. Refresh tokens must only exist in HttpOnly cookies.
- **NFR-SEC-02 (Anti-Enumeration)**: Login and password reset responses must never leak user existence.
- **NFR-SEC-03 (Account Lockout)**: Consecutive failed logins (>5) trigger temporary lockout (15 minutes).
- **NFR-SEC-04 (Cryptographic Tokens)**: Activation and reset tokens must use SHA-256 digests with 24-hour expiration and single-use invalidation.
- **NFR-PERF-01 (Latency)**: Health and auth verification endpoints must respond within 100ms.
- **NFR-REL-01 (Reliability)**: Docker Compose services run health checks and restart policies.
- **NFR-COMP-01 (Auditability)**: All authentication events must be preserved in immutable audit logs.
