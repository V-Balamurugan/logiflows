# API Design Conventions & Standards

## 1. URI Namespace & Versioning
All REST API endpoints are prefixed with `/api/v1/` to support backwards compatibility and zero-downtime upgrades.

```
https://api.logiflows.local/api/v1/<resource>/
```

## 2. HTTP Method Semantics
| Method | Description | Success Code | Idempotent |
| :--- | :--- | :---: | :---: |
| `GET` | Retrieve resource representation or paginated list | `200 OK` | Yes |
| `POST` | Create new entity or execute non-idempotent workflow action | `201 Created` / `200 OK` | No |
| `PUT` | Full replacement of existing entity | `200 OK` | Yes |
| `PATCH` | Partial update of specific fields | `200 OK` | Yes |
| `DELETE` | Soft-delete / deactivate entity | `204 No Content` | Yes |

## 3. Standard Response & Error Envelopes

### 3.1 Standard Error Envelope
All error responses strictly adhere to the unified envelope:
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": null
  }
}
```

### 3.2 Canonical Domain Error Codes
- `INVALID_CREDENTIALS`: Authentication failed due to mismatched credentials.
- `ACCOUNT_INACTIVE`: Account has not been activated via email verification link.
- `ACCOUNT_LOCKED`: Account has exceeded failed login threshold (5 attempts) and is temporarily locked.
- `TOKEN_EXPIRED`: Cryptographic single-use token or JWT has exceeded validity lifetime.
- `TOKEN_INVALID`: Cryptographic token hash does not match any valid record.
- `ALREADY_USED`: Single-use activation or reset token has already been consumed.
- `THROTTLED`: Request throttled due to excessive rate of attempts.
- `VALIDATION_ERROR`: Field validation failure (details populated with field-level errors).
- `PERMISSION_DENIED`: Caller does not possess the requisite RBAC role or object ownership.
- `NOT_AUTHENTICATED`: Request requires valid Bearer access token or auth cookie.

---

## 4. Phase 1 Authentication & User API Endpoints

### 4.1 `POST /api/v1/auth/register/`
- **Access**: Public
- **Throttling**: 10/hour (prod), 120/min (dev)
- **Request Body**:
  ```json
  {
    "email": "customer@example.com",
    "password": "SecurePassword123!",
    "password_confirm": "SecurePassword123!",
    "first_name": "Jane",
    "last_name": "Doe"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "message": "Registration successful. Please check your email to activate your account.",
    "user_id": "0ba1842e-0b44-4dfd-8f95-f7ee388f585e",
    "email": "customer@example.com",
    "role": "CUSTOMER"
  }
  ```

### 4.2 `POST /api/v1/auth/activate/`
- **Access**: Public (Cryptographic token)
- **Request Body**:
  ```json
  {
    "token": "4vQ...signed_raw_token"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Account activated successfully. You may now log in.",
    "email": "customer@example.com"
  }
  ```

### 4.3 `POST /api/v1/auth/login/`
- **Access**: Public
- **Throttling**: 5/min (prod), 120/min (dev)
- **Request Body**:
  ```json
  {
    "email": "customer@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response** (`200 OK`):
  - Sets `HttpOnly; SameSite=Lax; Path=/api/v1/auth/` cookie: `refresh_token=...`
  ```json
  {
    "access": "eyJhbGciOi...",
    "user": {
      "id": "0ba1842e-0b44-4dfd-8f95-f7ee388f585e",
      "email": "customer@example.com",
      "first_name": "Jane",
      "last_name": "Doe",
      "role": "CUSTOMER",
      "is_active": true
    }
  }
  ```

### 4.4 `POST /api/v1/auth/refresh/`
- **Access**: Public (Authenticated via HttpOnly refresh cookie)
- **Response** (`200 OK`):
  - Rotates refresh cookie and blacklists prior refresh token.
  ```json
  {
    "access": "eyJhbGciOi...",
    "user": { ... }
  }
  ```

### 4.5 `POST /api/v1/auth/logout/`
- **Access**: Authenticated or Cookie-bearing
- **Response** (`200 OK`):
  - Blacklists refresh token and deletes `refresh_token` cookie (`Max-Age=0`).
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

### 4.6 `POST /api/v1/auth/password/change/`
- **Access**: Authenticated (`Bearer <access_token>`)
- **Request Body**:
  ```json
  {
    "current_password": "OldPassword123!",
    "new_password": "NewSecurePassword2026!",
    "new_password_confirm": "NewSecurePassword2026!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Password changed successfully"
  }
  ```

### 4.7 `POST /api/v1/auth/password/reset/request/`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "If an account exists with this email, a password reset link has been dispatched."
  }
  ```

### 4.8 `POST /api/v1/auth/password/reset/confirm/`
- **Access**: Public (Cryptographic token)
- **Request Body**:
  ```json
  {
    "token": "4vQ...reset_token",
    "new_password": "NewPassword2026!",
    "new_password_confirm": "NewPassword2026!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Password reset successful. You may now log in with your new password."
  }
  ```

### 4.9 `GET/PATCH /api/v1/users/me/`
- **Access**: Authenticated
- **Response** (`200 OK`):
  ```json
  {
    "id": "0ba1842e-0b44-4dfd-8f95-f7ee388f585e",
    "email": "customer@example.com",
    "first_name": "Jane",
    "last_name": "Doe",
    "role": "CUSTOMER",
    "is_active": true,
    "last_login": "2026-10-30T14:40:00Z",
    "profile": {
      "phone_number": "+1 555-0199",
      "avatar_url": "",
      "bio": "Logistics Coordinator"
    }
  }
  ```

### 4.10 `GET /api/v1/users/me/profile/`
- **Access**: Authenticated
- **Response** (`200 OK`):
  ```json
  {
    "id": "7ca34b7f-1d88-44fa-8b1e-355ee374a581",
    "phone_number": "+1 555-0199",
    "avatar_url": "",
    "bio": "Logistics Coordinator",
    "created_at": "2026-10-30T14:00:00Z",
    "updated_at": "2026-10-30T14:05:00Z"
  }
  ```

---

## 5. Health Probe API (`/api/v1/health/`)
- Public, unauthenticated endpoint for orchestrators (Docker Compose, Kubernetes liveness probes).
- Executes `SELECT 1;` against PostgreSQL to guarantee database reachability.
- Response contains service version, environment, status, and millisecond latency.
