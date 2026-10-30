# LogiFlows Database Design Specification

## 1. Relational Database Strategy
LogiFlows uses PostgreSQL 16 as its authoritative relational database engine.
The platform implements a **shared-database with row-level tenant isolation** strategy:
- Every future operational record (shipments, fleet, branch, invoices) will include an indexed `organization_id` UUID foreign key.
- Strict database foreign key constraints prevent orphan records.
- Migrations are managed exclusively through Django ORM schema operations.

---

## 2. Phase 00 Database State & Custom User Model
In accordance with Section 4 and Section 7, Phase 00 creates only:
1. **Custom User Model (`apps.users.models.User`)**:
   - Inherits from Django's `AbstractUser`.
   - Stored in table `logiflows_users`.
   - Preserves all standard Django auth fields (`username`, `email`, `password`, `is_staff`, `is_active`, `date_joined`).
   - Declared as `AUTH_USER_MODEL = 'users.User'` in `config.settings.base` prior to initial migration.
2. **Django Core Tables**:
   - `django_migrations` (migration history)
   - `django_content_type` (content types)
   - `django_session` (session storage)
   - `auth_permission`, `auth_group` (permission relations)

No parcel, branch, vehicle, custody, or billing tables are created during Phase 00.

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
