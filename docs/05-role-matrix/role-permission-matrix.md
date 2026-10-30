# Role-Based Access Control (RBAC) & Permission Matrix

## 1. Overview
LogiFlows implements an enterprise multi-tenant Role-Based Access Control (RBAC) architecture. Permissions are strictly evaluated and enforced on the **BACKEND** in Django REST Framework permission classes. The frontend UI uses `RoleGuard` and `ProtectedRoute` purely for user experience and navigation ergonomics; tampering with client-side JavaScript never bypasses backend security.

## 2. Canonical Platform Roles (Phase 1 Baseline)
1. **PLATFORM_ADMIN**: Global system administrator managing platform-wide health, system audit trails, tenant organizations, and system seed operations.
   - *Creation*: Exclusively via CLI management command (`python manage.py createplatformadmin`), never exposed via public or private API endpoints.
2. **ORGANIZATION_OWNER**: Head of an enterprise postal/logistics tenant organization. Full operational, billing, and member governance rights.
3. **ORGANIZATION_ADMIN**: Administrative delegate managing regional logistics operations, hub structures, and workforce assignments.
4. **BRANCH_MANAGER**: Hub and facility manager overseeing local branch parcel routing, sorting facilities, and vehicle dispatches.
5. **EMPLOYEE**: Operational staff, dispatchers, hub operators, and drivers executing custody transfers and delivery legs.
6. **CUSTOMER**: Consignors, consignees, and public users self-registering on the platform to book deliveries, track parcels, and view personal profiles. Default role for all self-registrations.

## 3. Implemented DRF Permission Classes (`apps.accounts.permissions`)
- `IsPlatformAdmin`: Grants access only if `user.role == UserRole.PLATFORM_ADMIN` and `user.is_active`.
- `IsOrganizationOwner`: Grants access if `user.role == UserRole.ORGANIZATION_OWNER`.
- `IsOrganizationAdmin`: Grants access if `user.role in (ORGANIZATION_OWNER, ORGANIZATION_ADMIN)`.
- `IsBranchManager`: Grants access if `user.role in (ORGANIZATION_OWNER, ORGANIZATION_ADMIN, BRANCH_MANAGER)`.
- `IsEmployee`: Grants access if `user.role in (ORGANIZATION_OWNER, ORGANIZATION_ADMIN, BRANCH_MANAGER, EMPLOYEE)`.
- `IsCustomer`: Grants access if `user.role == UserRole.CUSTOMER`.
- `HasAnyRole(*roles)`: Factory that returns a permission class granting access if the user holds any of the specified roles.
- `ObjectOwnerPermission`: Validates object-level ownership: `obj == request.user`, or `obj.user == request.user`, or `obj.owner == request.user` (or `request.user.role == PLATFORM_ADMIN`).
- `TenantAwareMixin`: Reusable viewset mixin providing multi-tenant queryset scoping (`filter_by_tenant()`) and object ownership verification (`get_queryset()` and `check_object_permissions()`).

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

## 5. Security & Isolation Invariants
1. **Zero Client Escalation**: Role cannot be supplied in registration or profile update payloads.
2. **Generic Error Responses**: Failed login returns generic `Invalid email or password` without revealing user existence.
3. **Lockout Policy**: 5 failed consecutive attempts triggers 15-minute database-enforced lockout.
