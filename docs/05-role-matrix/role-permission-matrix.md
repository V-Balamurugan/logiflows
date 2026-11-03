# Role-Based Access Control (RBAC) & Permission Matrix

## 1. Overview
LogiFlows implements an enterprise multi-tenant Role-Based Access Control (RBAC) architecture. Permissions are strictly evaluated and enforced on the **BACKEND** in Django REST Framework permission classes. The frontend UI uses `RoleGuard` and `ProtectedRoute` purely for user experience and navigation ergonomics; tampering with client-side JavaScript never bypasses backend security.

## 2. Canonical Platform Roles
1. **PLATFORM_ADMIN**: Global system administrator managing platform-wide health, system audit trails, tenant organizations, and system seed operations.
   - *Creation*: Exclusively via CLI management command (`python manage.py createplatformadmin`), never exposed via public or private API endpoints.
2. **ORGANIZATION_OWNER**: Head of an enterprise postal/logistics tenant organization. Full operational, billing, and member governance rights.
3. **ORGANIZATION_ADMIN**: Administrative delegate managing regional logistics operations, hub structures, and workforce assignments.
4. **BRANCH_MANAGER**: Hub and facility manager overseeing local branch parcel routing, sorting facilities, and vehicle dispatches.
5. **EMPLOYEE**: Operational staff, dispatchers, hub operators, and drivers executing custody transfers and delivery legs.
6. **CUSTOMER**: Consignors, consignees, and public users self-registering on the platform to book deliveries, track parcels, and view personal profiles. Default role for all self-registrations.

> 💡 **Detailed Role Persona & Sample User Guide:**  
> For full personas, database records, test credentials, and UI/API access limits across all 6 roles, consult [`sample-users-and-role-specifications.md`](file:///docs/05-role-matrix/sample-users-and-role-specifications.md).  
> To seed all 6 sample users in development/testing with one command: `python backend/manage.py seedsampleusers`.

---

## 3. Implemented DRF Permission Classes
- `IsPlatformAdmin`: Grants access only if `user.role == UserRole.PLATFORM_ADMIN` and `user.is_active`.
- `IsOrganizationOwner`: Grants access if `user.role == UserRole.ORGANIZATION_OWNER`.
- `IsOrganizationAdmin`: Grants access if `user.role in (ORGANIZATION_OWNER, ORGANIZATION_ADMIN)`.
- `IsBranchManager`: Grants access if `user.role in (ORGANIZATION_OWNER, ORGANIZATION_ADMIN, BRANCH_MANAGER)`.
- `IsEmployee`: Grants access if `user.role in (ORGANIZATION_OWNER, ORGANIZATION_ADMIN, BRANCH_MANAGER, EMPLOYEE)`.
- `IsCustomer`: Grants access if `user.role == UserRole.CUSTOMER`.
- `HasAnyRole(*roles)`: Factory that returns a permission class granting access if the user holds any of the specified roles.
- `CanManageOrganization`: Enforces tenant-level lifecycle permissions (approval/suspension strictly restricted to Platform Admin; profile editing restricted to Owner/Admin).
- `CanManageBranch`: Enforces branch hierarchy permissions (Branch Managers restricted to their assigned branch; Owners/Admins manage all branches in org).
- `CanManageEmployee`: Enforces employee privilege hierarchy (Owner can create Admin/BM/Employee; Admin can only create BM/Employee; BM can only create Employee within own branch).

---

## 4. Phase 1 Authentication & Profile Access Matrix
| Resource / Operation | Public | CUSTOMER | EMPLOYEE | BRANCH_MGR | ORG_ADMIN | ORG_OWNER | PLATFORM_ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `POST /api/v1/auth/register/` | **Yes (Customer only)** | No | No | No | No | No | No |
| `POST /api/v1/auth/activate/` | **Yes (Signed Token)** | No | No | No | No | No | No |
| `POST /api/v1/auth/login/` | **Yes** | Yes | Yes | Yes | Yes | Yes | Yes |
| `POST /api/v1/auth/refresh/` | **Yes (HttpOnly Cookie)**| Yes | Yes | Yes | Yes | Yes | Yes |
| `POST /api/v1/auth/logout/` | **Yes (HttpOnly Cookie)**| Yes | Yes | Yes | Yes | Yes | Yes |
| `POST /api/v1/auth/password/change/` | No | Own | Own | Own | Own | Own | Own |
| `POST /api/v1/auth/password/reset/request/` | **Yes** | Yes | Yes | Yes | Yes | Yes | Yes |
| `POST /api/v1/auth/password/reset/confirm/` | **Yes (Signed Token)** | Yes | Yes | Yes | Yes | Yes | Yes |
| `GET/PATCH /api/v1/users/me/` | No | Own | Own | Own | Own | Own | Own |
| `GET /api/v1/users/me/profile/` | No | Own | Own | Own | Own | Own | Own |
| `createplatformadmin` (CLI) | CLI Only | No | No | No | No | No | **CLI Only** |

---

## 5. Phase 2 Multi-Tenant, Branch & RBAC Access Matrix
| Resource / Operation | Public | CUSTOMER | EMPLOYEE | BRANCH_MGR | ORG_ADMIN | ORG_OWNER | PLATFORM_ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `POST /api/v1/organizations/` (Register Org) | No | **Yes** | No | No | No | No | No |
| `GET /api/v1/organizations/` | No | No | Own Org | Own Org | Own Org | Own Org | **All Orgs** |
| `POST /approve/`, `/reject/`, `/suspend/` | No | No | No | No | No | No | **Yes** |
| `GET /api/v1/memberships/me/` | No | Own | Own | Own | Own | Own | Own |
| `GET /api/v1/organizations/{id}/memberships/` | No | No | No | No | Own Org | Own Org | Audited Read |
| `POST .../memberships/{id}/deactivate/` | No | No | No | No | Staff Only | Staff & Admin | No |
| `GET /api/v1/branches/` | No | No | Own Org | Own Branch | Own Org | Own Org | All |
| `POST /api/v1/branches/` | No | No | No | No | Own Org | Own Org | Audited |
| `POST /api/v1/branches/{id}/service-areas/` | No | No | No | No | Own Org | Own Org | Audited |
| `GET /api/v1/serviceability/?postal_code=` | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| `GET /api/v1/employees/` | No | No | No | Own Branch | Own Org | Own Org | All |
| `POST /api/v1/employees/` | No | No | No | Own Branch (Staff) | Staff & BM | Any in Org | Audited |
| `GET /api/v1/dashboard/summary/` | No | Personal | Employee | Own Branch | Own Org | Own Org | **Global** |

---

## 6. Security & Isolation Invariants
1. **Zero Client Escalation**: Role cannot be supplied in registration or profile update payloads.
2. **Tenant Anti-Spoofing**: Header and query parameter tenant overrides (`X-Organization-ID`) are strictly verified against the user's active membership in an approved organization. Non-members receive 403 Forbidden.
3. **Branch Manager Scoping**: Branch Managers are strictly isolated to their assigned branch (`membership.branch_id`) across branches, service areas, and employee provisioning.
4. **Intra-Organization Postal Conflict Engine**: An active postal code within an organization can belong to at most one branch, preventing ambiguous dispatch routing.
