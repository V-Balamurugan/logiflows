# Role-Based Access Control (RBAC) & Permission Matrix

## 1. Overview
LogiFlows implements a multi-tenant Role-Based Access Control (RBAC) model. Permissions are enforced on the backend by Django REST Framework permission classes and evaluated against both the user's role and their active organization context.

## 2. Platform Roles
1. **SUPER_ADMIN**: Global platform engineer with unrestricted administrative access across system nodes and tenant schemas.
2. **TENANT_ADMIN**: Organization owner/administrator with full operational and user management permissions within their tenant scope.
3. **LOGISTICS_MANAGER**: Supply chain manager managing rate cards, booking shipments, selecting carriers, and auditing performance.
4. **DISPATCHER**: Operations specialist managing fleet assets, driver assignments, route manifests, and exception handling.
5. **DRIVER**: Mobile/field user with limited permissions to view assigned dispatches, update milestones, and capture ePOD.
6. **AUDITOR_VIEWER**: Read-only oversight persona for regulatory, compliance, and billing verification.

## 3. Permission Matrix
| Resource / Action | SUPER_ADMIN | TENANT_ADMIN | LOGISTICS_MANAGER | DISPATCHER | DRIVER | AUDITOR_VIEWER |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Organization Config** | Full | Manage Own | View | View | None | View |
| **User Management** | Full | Manage Own | View | View | None | None |
| **Create Shipment** | Yes | Yes | Yes | No | No | No |
| **Cancel Shipment** | Yes | Yes | Yes | No | No | No |
| **Assign Driver/Fleet**| Yes | Yes | Yes | Yes | No | No |
| **Update Milestone** | Yes | Yes | Yes | Yes | Assigned Only | No |
| **Capture ePOD** | Yes | Yes | Yes | Yes | Assigned Only | No |
| **Manage Rate Cards** | Yes | Yes | Yes | No | No | View |
| **Approve Invoices** | Yes | Yes | Yes | No | No | View |
| **Audit Log Access** | All | Tenant Logs| Tenant Logs | Dispatches | None | Full Read-Only |
| **Health Telemetry** | Full | Read | Read | Read | Read | Read |

## 4. Enforcement Strategy
- **Backend First**: Never rely on disabling or hiding UI elements for security.
- **Organization Boundary**: Every DRF queryset automatically filters `organization_id=request.user.organization_id`.
- **Object-Level Permissions**: DRF permission classes (`IsAssignedDriverOrDispatcher`) verify that a driver can only mutate their own active shipment milestone.
