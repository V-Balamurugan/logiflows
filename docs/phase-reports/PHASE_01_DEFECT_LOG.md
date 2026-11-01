# LogiFlows Phase 01 — Defect & Remediation Log

**Phase:** Phase 01 — Authentication and User Management  
**Branch:** `feature/phase-01-auth`  
**Auditor / Engineer:** Principal Security-Minded Software Engineer & QA Automation Engineer  
**Date:** 2026-10-31  

---

## Defect Summary

| Defect ID | Severity | Component | Summary | Status |
| :--- | :---: | :--- | :--- | :---: |
| **DEF-001** | **S2 (High)** | Email Delivery / Docker | Outbound transactional emails defaulted to console instead of Mailpit SMTP sink | **RESOLVED** |
| **DEF-002** | **S2 (High)** | Token Security / Revocation | Outstanding refresh tokens not revoked upon password change / reset | **RESOLVED** |
| **DEF-003** | **S3 (Medium)** | Profile API | `UserProfileView` lacked PATCH handler, causing 405 on profile endpoint updates | **RESOLVED** |
| **DEF-004** | **S3 (Medium)** | Auth Header / Public Views | Invalid JWT in Authorization header caused 401 cascade across AllowAny endpoints | **RESOLVED** |

---

## Detailed Defect Entries

### DEF-001: Transactional Emails Defaulted to Console Backend in Dev Container
- **Severity:** S2 (High)
- **Component:** `backend/config/settings/base.py`, `docker-compose.yml`
- **Description:** In local development and Docker Compose, outbound activation and password reset emails were written to the backend container's standard output instead of being sent to Mailpit SMTP on port 1025. This prevented Playwright E2E and dev inbox inspection from retrieving tokens via the Mailpit REST API (`http://localhost:8025/api/v1/messages`).
- **Root Cause:** In `backend/config/settings/base.py`, `EMAIL_BACKEND` was set to `'django.core.mail.backends.console.EmailBackend'` whenever `DEBUG=True`, ignoring the `EMAIL_HOST=mailpit` environment variable unless `DJANGO_EMAIL_BACKEND` was explicitly supplied.
- **Remediation:**
  1. Updated `backend/config/settings/base.py` to default to `smtp.EmailBackend` whenever `EMAIL_HOST` is defined or `DEBUG=False`, falling back to `console.EmailBackend` only when running without an email host in local standalone mode.
  2. Added `DJANGO_EMAIL_BACKEND: django.core.mail.backends.smtp.EmailBackend` explicitly in `docker-compose.yml`.
- **Regression Tests:**
  - Automated Playwright E2E Test: `auth.spec.ts` (Customer registers, extracts activation token from Mailpit via `http://localhost:8025/api/v1/messages`, and activates account).
- **Rerun Result:** **PASSED** (11/11 E2E tests passing, token extracted and consumed in under 8s).

---

### DEF-002: Outstanding Refresh Tokens Not Revoked on Password Change or Reset
- **Severity:** S2 (High)
- **Component:** `backend/apps/accounts/services/auth_service.py`
- **Description:** When an authenticated user updated their password via `/api/v1/auth/password/change/` or confirmed a password reset via `/api/v1/auth/password/reset/confirm/`, their prior active sessions (outstanding refresh tokens) remained valid for rotation, violating the security requirement that password modification must revoke all existing sessions across devices.
- **Root Cause:** Django REST Framework SimpleJWT maintains an `OutstandingToken` table, but does not automatically iterate and insert corresponding entries into `BlacklistedToken` on password changes unless explicitly instructed by application logic.
- **Remediation:**
  1. Created `revoke_all_user_tokens(user: User) -> int` in `apps.accounts.services.auth_service`.
  2. Queries `OutstandingToken.objects.filter(user=user)` and atomically calls `BlacklistedToken.objects.get_or_create(token=token)`.
  3. Integrated `revoke_all_user_tokens(user)` directly into both `change_password()` and `confirm_password_reset()`.
- **Regression Tests:**
  - `backend/tests/test_auth_services.py::TestAuthServices::test_change_password_revokes_outstanding_refresh_tokens`
  - `backend/tests/test_auth_services.py::TestAuthServices::test_password_reset_revokes_outstanding_refresh_tokens`
- **Rerun Result:** **PASSED** (both tests verify that pre-existing refresh tokens are rejected with `TokenInvalidOrExpiredException`).

---

### DEF-003: `UserProfileView` Returned 405 Method Not Allowed on PATCH
- **Severity:** S3 (Medium)
- **Component:** `backend/apps/accounts/views.py` (`UserProfileView`)
- **Description:** While profile updates could be performed via `PATCH /api/v1/users/me/`, direct requests to `PATCH /api/v1/users/me/profile/` failed with HTTP 405 Method Not Allowed because `UserProfileView` only defined a `get()` method.
- **Root Cause:** `UserProfileView` was initially designed as a read-only endpoint, creating an inconsistency with the documented profile attributes API.
- **Remediation:**
  - Implemented `patch(self, request)` on `UserProfileView` using `UserProfileSerializer(profile, data=request.data, partial=True)`.
  - Added Swagger OpenAPI schema documentation via `@extend_schema`.
- **Regression Tests:**
  - `backend/tests/test_permission_matrix.py::TestEndpointPermissionMatrix::test_users_me_profile_patch_access` across all 6 roles + anonymous/inactive.
- **Rerun Result:** **PASSED** (all 6 roles successfully patch phone, avatar, bio; anonymous and inactive rejected with 401).

---

### DEF-004: Public Endpoints Returned 401 When Invalid Token Header Was Sent
- **Severity:** S3 (Medium)
- **Component:** `backend/apps/accounts/authentication.py` (`LogiFlowsJWTAuthentication`)
- **Description:** When an expired, malformed, or double-prefixed token was saved in a client tool (such as Swagger UI localStorage), visiting public endpoints (e.g., `/api/v1/health/`, `/api/v1/auth/login/`, `/api/v1/auth/register/`) resulted in HTTP 401 Unauthorized instead of allowing unauthenticated access.
- **Root Cause:** Standard SimpleJWT `JWTAuthentication.authenticate()` raises `InvalidToken` immediately when an `Authorization` header is present, even if the destination view has `permission_classes = [AllowAny]`.
- **Remediation:**
  - Implemented `LogiFlowsJWTAuthentication` inheriting from SimpleJWT's `JWTAuthentication`.
  - Gracefully falls back to `None` for views configured with `AllowAny` permissions when an invalid token is provided, allowing public access while strictly enforcing valid tokens on protected views.
  - Automatically normalizes header variants (stripping redundant `Bearer Bearer`, supporting `Token`, `JWT`, and `X-Auth-Token`).
- **Regression Tests:**
  - `backend/tests/test_auth_api.py::TestAuthAPIEndpoints::test_allow_any_endpoint_with_invalid_token`
  - `backend/tests/test_auth_api.py::TestAuthAPIEndpoints::test_flexible_jwt_auth_header_formats`
- **Rerun Result:** **PASSED** (health check and auth endpoints succeed even with invalid or corrupted Authorization headers).

