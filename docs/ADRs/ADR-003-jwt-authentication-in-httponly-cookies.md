# ADR-003: JWT Authentication Strategy with Short-Lived Access & Rotating Refresh in HttpOnly Cookies

## Status
Accepted

## Date
2026-10-30

## Context
Standard Single Page Applications (SPAs) frequently store JWT tokens in browser `localStorage` or `sessionStorage`. This pattern is highly susceptible to Cross-Site Scripting (XSS) credential theft: any third-party npm dependency or injected script can extract the long-lived refresh token and hijack the user session.

## Decision
LogiFlows configures `djangorestframework-simplejwt` with:
1. **Short-Lived Access Tokens**: Lifetime of 15 minutes (`ACCESS_TOKEN_LIFETIME = timedelta(minutes=15)`).
2. **Rotating Refresh Tokens**: Lifetime of 7 days with rotation on every refresh (`ROTATE_REFRESH_TOKENS = True`, `BLACKLIST_AFTER_ROTATION = True`).
3. **Transport Security**: Refresh tokens will be stored in secure, `httpOnly`, `SameSite=Lax` (or `Strict`), and `Secure=True` (in production) cookies, completely inaccessible to JavaScript execution environments.

## Consequences
- **Positive**:
  - Immunity from client-side XSS token exfiltration.
  - Revocability of compromised sessions via SimpleJWT blacklist tokens.
- **Negative / Considerations**:
  - Requires CSRF protection on token refresh mutations.
