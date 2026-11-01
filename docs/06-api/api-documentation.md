# LogiFlows API Endpoint Reference

## 1. OpenAPI & Interactive Documentation Endpoints
- **OpenAPI 3.0 Schema**: `GET /api/v1/schema/`
- **Swagger UI Interactive Explorer**: `GET /api/v1/docs/`
- **ReDoc API Documentation**: `GET /api/v1/redoc/`

---

## 2. Health & Readiness Probes
- `GET /api/v1/health/`: System liveness and PostgreSQL query latency check.
- `GET /api/v1/dashboard/summary/`: Aggregated role-scoped and tenant-isolated dashboard telemetry.

---

## 3. Phase 01: Authentication & User Endpoints
| HTTP Method | Endpoint | Description | Access / Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register/` | Self-service customer account registration | Public (`AllowAny`) |
| `POST` | `/api/v1/auth/activate/` | Email token account activation | Public (`AllowAny`) |
| `POST` | `/api/v1/auth/login/` | User authentication returning JWT tokens | Public (`AllowAny`) |
| `POST` | `/api/v1/auth/refresh/` | Silent token refresh via rotating httpOnly cookie | Public / Cookie |
| `POST` | `/api/v1/auth/logout/` | Revokes refresh token and clears cookie | Authenticated |
| `POST` | `/api/v1/auth/password/change/` | In-session password change (revokes active tokens) | Authenticated |
| `POST` | `/api/v1/auth/password/reset/request/` | Initiates password reset email flow | Public (`AllowAny`) |
| `POST` | `/api/v1/auth/password/reset/confirm/` | Confirms password reset with token | Public (`AllowAny`) |
| `GET` | `/api/v1/users/me/` | Current user profile and role details | Authenticated |
| `PATCH` | `/api/v1/users/me/profile/` | Update profile preferences and details | Authenticated |

---

## 4. Phase 02: Multi-Tenant Architecture & Membership Endpoints
| HTTP Method | Endpoint | Description | Access / Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/organizations/` | Register new organization (prospective owner) | Authenticated Customer |
| `GET` | `/api/v1/organizations/` | List organizations (Platform Admin = all; Owner/Admin = own) | Authenticated |
| `GET` | `/api/v1/organizations/{id}/` | Get organization details (tenant-scoped) | Tenant Members / Platform Admin |
| `PATCH` | `/api/v1/organizations/{id}/` | Update organization details / settings | Org Owner / Admin |
| `POST` | `/api/v1/organizations/{id}/approve/` | Approve organization and elevate owner | `PLATFORM_ADMIN` |
| `POST` | `/api/v1/organizations/{id}/reject/` | Reject organization with required reason | `PLATFORM_ADMIN` |
| `POST` | `/api/v1/organizations/{id}/suspend/` | Suspend organization with required reason | `PLATFORM_ADMIN` |
| `GET` | `/api/v1/memberships/me/` | List all active tenant memberships for current user | Authenticated |
| `GET` | `/api/v1/organizations/{id}/memberships/` | List organization memberships | Org Owner / Org Admin |
| `PATCH` | `/api/v1/organizations/{id}/memberships/{mem_id}/` | Update member role or branch | Org Owner / Org Admin |
| `POST` | `/api/v1/organizations/{id}/memberships/{mem_id}/deactivate/` | Deactivate tenant membership | Org Owner / Org Admin |
| `POST` | `/api/v1/organizations/{id}/memberships/{mem_id}/activate/` | Reactivate tenant membership | Org Owner / Org Admin |

---

## 5. Phase 02: Branch & Service Area Endpoints
| HTTP Method | Endpoint | Description | Access / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/branches/` | List branches (tenant-scoped; Branch Manager sees own) | Org Staff / Platform Admin |
| `POST` | `/api/v1/branches/` | Create a new operational branch / hub | Org Owner / Org Admin |
| `GET` | `/api/v1/branches/{id}/` | Retrieve branch details | Org Staff / Platform Admin |
| `PATCH` | `/api/v1/branches/{id}/` | Update branch configuration / manager | Org Owner / Org Admin |
| `POST` | `/api/v1/branches/{id}/deactivate/` | Deactivate branch | Org Owner / Org Admin |
| `POST` | `/api/v1/branches/{id}/activate/` | Reactivate branch | Org Owner / Org Admin |
| `GET` | `/api/v1/branches/{id}/service-areas/` | List service areas / postal codes in branch | Org Staff / Platform Admin |
| `POST` | `/api/v1/branches/{id}/service-areas/` | Add postal code with intra-org overlap check | Org Owner / Org Admin |
| `DELETE` | `/api/v1/branches/{id}/service-areas/{area_id}/` | Remove service area | Org Owner / Org Admin |
| `GET` | `/api/v1/serviceability/?postal_code=` | Public serviceability check across all active carriers | Public (`AllowAny`) |

---

## 6. Phase 02: Employee & RBAC Provisioning Endpoints
| HTTP Method | Endpoint | Description | Access / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/employees/` | List employees (tenant-scoped; BM sees own branch) | Org Admin / BM / Owner |
| `POST` | `/api/v1/employees/` | Provision staff with role & temp password | Org Admin / BM (own branch) / Owner |
| `GET` | `/api/v1/employees/{id}/` | Retrieve employee profile | Org Admin / BM / Owner |
| `PATCH` | `/api/v1/employees/{id}/` | Update employee designation, phone, status | Org Admin / Owner |
| `POST` | `/api/v1/employees/{id}/deactivate/` | Deactivate employee account & membership | Org Admin / Owner |
| `POST` | `/api/v1/employees/{id}/activate/` | Reactivate employee account & membership | Org Admin / Owner |
