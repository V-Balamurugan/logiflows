# ADR-001: UUID Primary Keys and Case-Insensitive Email Login for Custom User Model

## Status
Accepted

## Date
2026-10-30

## Context
LogiFlows is an enterprise multi-tenant B2B logistics delivery management SaaS platform.
In standard Django projects, the default User model uses auto-incrementing integer IDs (`AutoField`) and usernames.
However, enterprise logistics platforms require:
1. **Security & Anti-Enumeration**: Auto-incrementing integers allow adversaries or competitors to enumerate user IDs, infer transaction volumes, and perform IDOR attacks.
2. **Distributed ID Generation**: Distributed logistics workers, offline mobile scanners, and disparate branch nodes need to generate entity identifiers without coordinating centralized sequential locks.
3. **Enterprise Identity Standards**: Business users and logistics partners do not remember arbitrary usernames. Authentication should be anchored on a globally unique, verified organizational email address.
4. **Early Customization Guarantee**: Changing `AUTH_USER_MODEL` midway through a Django lifecycle causes severe foreign-key migration surgery across built-in and 3rd-party apps. Creating `accounts.User` before initial database migrations is essential.

## Decision
1. **UUIDv4 Primary Keys**:
   - `accounts.User` and all base domain models (`UUIDModel`) declare `id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)`.
2. **Case-Insensitive Email Authentication**:
   - Set `USERNAME_FIELD = 'email'`.
   - Email is indexed with a functional case-insensitive unique index: `models.Index(Lower('email'), name='user_email_lower_idx')`.
   - Custom `UserManager.create_user()` and `UserManager.create_superuser()` normalize emails to lower case (`email.strip().lower()`).
3. **Role CharField**:
   - Define role choices (`PLATFORM_ADMIN`, `ORGANIZATION_OWNER`, `ORGANIZATION_ADMIN`, `BRANCH_MANAGER`, `EMPLOYEE`, `CUSTOMER`) defaulting strictly to `CUSTOMER` to guarantee least privilege upon registration.

## Consequences
- **Positive**:
  - Zero ID enumeration vulnerability across APIs.
  - Consistent UUID format across PostgreSQL and React TypeScript interfaces.
  - Case variations in user inputs (e.g., `Admin@Example.com` vs `admin@example.com`) are resolved safely without duplicate accounts.
  - No database migration surgery in subsequent phases.
- **Negative / Considerations**:
  - UUIDs consume 16 bytes compared to 4/8 bytes for integers (negligible given PostgreSQL native UUID support).
  - Index lookups on UUIDs have slight storage overhead, offset by fast B-Tree indexing in PostgreSQL 16.
