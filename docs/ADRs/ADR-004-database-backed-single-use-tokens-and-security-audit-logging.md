# ADR-004: Database-Backed Single-Use Cryptographic Tokens and Security Audit Logging

## Status
Accepted

## Date
2026-10-30

## Context
Phase 1 introduces account activation links and password reset links transmitted to users via asynchronous emails. A common vulnerability pattern in modern web platforms is relying on stateless, long-lived JWTs for password resets or account activations without server-side revocation capability. In such architectures:
1. Compromised or intercepted links cannot be revoked before their expiration without rotating signing keys across the entire platform.
2. Tokens cannot be reliably marked as single-use without maintaining distributed revocation lists or checking timestamps that are fragile against clock skew.
3. If an email is sent twice or re-clicked after completion, replay attacks or accidental state corruption can occur.
4. Compliance, enterprise security audits, and SOC2/ISO 27001 posture require immutable, structured event logging of all authentication events, failed credential attempts, and permission violations with client IP, user-agent, and metadata.

## Decision
1. **Database-Backed AccountToken with SHA-256 Digest**:
   - Instead of storing raw token secrets or stateless JWTs, LogiFlows issues high-entropy cryptographically random URL-safe tokens (`secrets.token_urlsafe(32)`).
   - Only the SHA-256 digest of the token is persisted in the PostgreSQL `account_tokens` table.
   - When the user redeems the token via `/api/v1/auth/activate/` or `/api/v1/auth/password/reset/confirm/`, the backend hashes the incoming client token and looks up the active record using `select_for_update()` inside an atomic transaction.
   - Upon successful verification, `is_used` is set to `True` and `used_at` is set to the current UTC timestamp within the same transaction. Any subsequent attempt to redeem the token is immediately rejected with a deterministic `TOKEN_EXPIRED` or `ALREADY_USED` domain error.
   - Tokens strictly expire after 24 hours (`expires_at = timezone.now() + timedelta(hours=24)`).

2. **Immutable AuditLog Framework**:
   - All authentication actions (`AUTH_REGISTER_SUCCESS`, `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILURE`, `AUTH_ACCOUNT_LOCKED`, `AUTH_TOKEN_REFRESH`, `AUTH_LOGOUT`, `AUTH_PASSWORD_CHANGE`, `AUTH_PASSWORD_RESET_REQUEST`, `AUTH_PASSWORD_RESET_SUCCESS`, `PROFILE_UPDATE`, `RBAC_ROLE_ASSIGNED`, `PLATFORM_ADMIN_BOOTSTRAP`) are recorded in an append-only `AuditLog` table.
   - Passwords, raw credentials, and sensitive tokens are strictly filtered and NEVER recorded in audit payloads or database rows.
   - Indexed on `(actor, created_at)` and `(action)` for high-performance compliance auditing and security threat analysis.

3. **In-Memory JWT Access Tokens & HttpOnly Refresh Cookies**:
   - Access tokens are stored purely in React state / memory (in `axios.ts` / `AuthContext`), preventing browser `localStorage` XSS exfiltration.
   - Refresh tokens are transported via `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth/` cookies, rotated on every refresh, and blacklisted server-side via `token_blacklist`.
   - Single-flight queue interceptors and React 18 StrictMode deduplication prevent race conditions during refresh.

## Consequences
- **Positive**:
  - Zero token replay vulnerability: links are guaranteed single-use by PostgreSQL row-level locks.
  - Zero token leakage from database backups: an attacker who compromises database backups cannot use stored token hashes to authenticate or reset accounts.
  - Full traceability: security teams can reconstruct complete user authentication lifecycles with exact IP and user-agent forensics.
- **Negative / Considerations**:
  - Database roundtrip is required for token validation (mitigated by B-Tree index on `token_hash`).
  - Requires scheduled pruning of expired tokens in future maintenance phases.
