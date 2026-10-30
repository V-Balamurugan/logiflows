# LogiFlows Initial Entity-Relationship (ER) Diagram

## 1. Phase 00 Implemented Schema
```mermaid
erDiagram
    LOGIFLOWS_USERS {
        bigint id PK
        string password
        timestamp last_login
        boolean is_superuser
        string username UK
        string first_name
        string last_name
        string email
        boolean is_staff
        boolean is_active
        timestamp date_joined
    }

    DJANGO_MIGRATIONS {
        bigint id PK
        string app
        string name
        timestamp applied
    }

    DJANGO_CONTENT_TYPE {
        integer id PK
        string app_label
        string model
    }

    DJANGO_SESSION {
        string session_key PK
        text session_data
        timestamp expire_date
    }
```

---

## 2. Planned Future Schema (Phase 01–Phase 11 Roadmap Reference)
```mermaid
erDiagram
    ORGANIZATIONS ||--o{ LOGIFLOWS_USERS : employs
    ORGANIZATIONS ||--o{ BRANCHES : operates
    ORGANIZATIONS ||--o{ VEHICLES : owns
    ORGANIZATIONS ||--o{ CONSIGNMENTS : manages
    CONSIGNMENTS ||--o{ CUSTODY_EVENTS : tracks
    CONSIGNMENTS ||--o{ DELIVERIES : fulfills
    DELIVERIES ||--o{ ROUTE_STOPS : follows
    CONSIGNMENTS ||--o{ INVOICE_ITEMS : billed_in
```
*Note: Future business entities are planned for subsequent phases and are strictly not created during Phase 00.*
