# LogiFlows Database Design Specification

## 1. Relational Database Strategy
LogiFlows uses PostgreSQL 16 as its authoritative relational database engine.
The platform implements a **shared-database with row-level tenant isolation** strategy:
- Every tenant-scoped entity (`Branch`, `ServiceArea`, `EmployeeProfile`, `Parcel`, `Vehicle`) includes an indexed foreign key to `Organization`.
- Strict foreign key constraints with `on_delete=models.CASCADE` or `models.PROTECT` prevent orphan records.
- Anti-spoofing and tenant isolation are enforced at the query level via `TenantScopedViewSetMixin` and partial database constraints.
- Migrations are managed exclusively through Django ORM schema operations.

---

## 2. Implemented Models and Tables

### Phase 00 & 01: Core Accounts & Authentication
1. **User Model (`apps.accounts.models.User`)**
   - Table: `logiflows_users`
   - Primary Key: UUID (`id`)
   - Unique identifier: `email` (case-insensitive indexed)
   - Fields: `password`, `first_name`, `last_name`, `role`, `is_staff`, `is_active`, `failed_login_attempts`, `last_failed_login`
2. **UserProfile (`apps.accounts.models.UserProfile`)**
   - Table: `logiflows_user_profiles`
   - Fields: `user` (1-to-1), `phone_number`, `avatar`, `notification_preferences`, `timezone`
3. **AuditLog (`apps.accounts.models.AuditLog`)**
   - Table: `logiflows_audit_logs`
   - Append-only immutable log for auth and tenant lifecycle events
4. **AccountToken (`apps.accounts.models.AccountToken`)**
   - Table: `logiflows_account_tokens`
   - Single-use hashed tokens for activation and password reset

### Phase 02: Multi-Tenant Architecture & Branch Hierarchy
1. **Organization (`apps.organizations.models.Organization`)**
   - Table: `organizations_organization`
   - Fields:
     - `id` (UUID PK)
     - `name` (varchar 255)
     - `legal_name` (varchar 255)
     - `registration_number` (varchar 100, optional)
     - `code` (varchar 50, unique uppercase index)
     - `contact_email` (varchar 255)
     - `status` (`PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`)
     - `rejection_reason` (text, optional)
     - `suspension_reason` (text, optional)
     - `settings` (JSONField)
2. **OrganizationMembership (`apps.organizations.models.OrganizationMembership`)**
   - Table: `organizations_organizationmembership`
   - Fields:
     - `id` (UUID PK)
     - `organization` (FK -> Organization)
     - `user` (FK -> User)
     - `role` (enum: `ORGANIZATION_OWNER`, `ORGANIZATION_ADMIN`, `BRANCH_MANAGER`, `EMPLOYEE`)
     - `branch` (FK -> Branch, nullable)
     - `is_active` (boolean, default True)
   - Constraints:
     - `UniqueConstraint(fields=['user', 'organization'], name='unique_user_organization_membership')`
     - Partial Unique Index: `UniqueConstraint(fields=['organization'], condition=Q(role='ORGANIZATION_OWNER', is_active=True), name='unique_active_org_owner')`
3. **Branch (`apps.branches.models.Branch`)**
   - Table: `branches_branch`
   - Fields:
     - `id` (UUID PK)
     - `organization` (FK -> Organization)
     - `code` (varchar 50 uppercase)
     - `name` (varchar 150)
     - `address`, `pincode`, `city`, `state`, `country`
     - `contact_email`, `contact_phone`
     - `latitude`, `longitude` (decimal degrees)
     - `operating_hours` (JSONField)
     - `status` (`ACTIVE`, `INACTIVE`)
   - Constraints:
     - `UniqueConstraint(fields=['organization', 'code'], name='unique_org_branch_code')`
4. **ServiceArea (`apps.branches.models.ServiceArea`)**
   - Table: `branches_servicearea`
   - Fields:
     - `id` (UUID PK)
     - `branch` (FK -> Branch)
     - `postal_code` (varchar 20 uppercase)
     - `is_serviceable` (boolean, default True)
   - Constraints:
     - `UniqueConstraint(fields=['branch', 'postal_code'], name='unique_branch_postal_code')`
   - Intra-Organization Conflict Rule: Within the same organization, an active postal code can belong to at most one branch. Cross-tenant overlaps are explicitly supported.
5. **EmployeeProfile (`apps.employees.models.EmployeeProfile`)**
   - Table: `employees_employeeprofile`
   - Fields:
     - `id` (UUID PK)
     - `membership` (1-to-1 -> OrganizationMembership)
     - `employee_code` (varchar 50 uppercase)
     - `designation` (varchar 100)
     - `phone` (varchar 30)
     - `status` (`ACTIVE`, `ON_LEAVE`, `SUSPENDED`, `TERMINATED`)
     - `joined_date` (date)
     - `temporary_password_active` (boolean)

---

## 3. Database Credentials & Connection Configuration
| Variable Name | Default Dev Value | Description |
| :--- | :--- | :--- |
| `POSTGRES_DB` | `logiflows_db` | Dedicated PostgreSQL database name |
| `POSTGRES_USER` | `logiflows_user` | Dedicated application database user |
| `POSTGRES_PASSWORD` | `logiflows_dev_password_2026` | Database user authentication secret |
| `POSTGRES_HOST` | `db` (Docker) / `localhost` (Host) | Network host resolution address |
| `POSTGRES_PORT` | `5432` | Standard PostgreSQL TCP port |
| `CONN_MAX_AGE` | `60` | Persistent connection age in seconds |
