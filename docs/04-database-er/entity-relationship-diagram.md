# Entity-Relationship (ER) Diagram & Schema Baseline

## 1. Domain Entities
The LogiFlows relational schema in PostgreSQL 16 is centered around multi-tenancy, shipment tracking, and financial ledgers.

```mermaid
erDiagram
    ORGANIZATION ||--o{ USER : employs
    ORGANIZATION ||--o{ SHIPMENT : owns
    ORGANIZATION ||--o{ VEHICLE : manages
    ORGANIZATION ||--o{ INVOICE : bills

    USER ||--o{ DISPATCH_ASSIGNMENT : dispatches
    USER ||--o{ AUDIT_LOG : initiates

    SHIPMENT ||--o{ MILESTONE_UPDATE : logs
    SHIPMENT ||--o{ DISPATCH_ASSIGNMENT : assigned_to
    SHIPMENT ||--o{ INVOICE_LINE_ITEM : billed_under

    VEHICLE ||--o{ DISPATCH_ASSIGNMENT : deployed_in

    ORGANIZATION {
        uuid id PK
        string name
        string code UK
        string type
        string status
        timestamp created_at
    }

    USER {
        uuid id PK
        uuid organization_id FK
        string email UK
        string full_name
        string role
        boolean is_active
        timestamp created_at
    }

    SHIPMENT {
        uuid id PK
        uuid organization_id FK
        string tracking_number UK
        string origin_address
        string destination_address
        decimal weight_kg
        string status
        timestamp estimated_delivery
        timestamp created_at
    }

    MILESTONE_UPDATE {
        uuid id PK
        uuid shipment_id FK
        string status
        string location
        string notes
        timestamp recorded_at
    }

    VEHICLE {
        uuid id PK
        uuid organization_id FK
        string plate_number UK
        string vehicle_type
        decimal capacity_kg
        string status
    }

    DISPATCH_ASSIGNMENT {
        uuid id PK
        uuid shipment_id FK
        uuid vehicle_id FK
        uuid driver_id FK
        timestamp assigned_at
        string dispatch_notes
    }

    INVOICE {
        uuid id PK
        uuid organization_id FK
        string invoice_number UK
        decimal total_amount
        string currency
        string payment_status
        date due_date
        timestamp issued_at
    }

    AUDIT_LOG {
        uuid id PK
        uuid user_id FK
        string action
        string entity_name
        uuid entity_id
        jsonb changes
        timestamp created_at
    }
```

## 2. Table Specifications
- **`organizations`**: Master tenant table for Shippers, Carriers, and 3PL Providers.
- **`users`**: Tenant-scoped accounts with granular role bindings.
- **`shipments`**: Freight records enforcing state transitions (`DRAFT` through `DELIVERED`).
- **`milestone_updates`**: Immutable chronological breadcrumbs for shipment location and events.
- **`vehicles`**: Physical assets (tractors, trailers, box trucks) with inspection and capacity metadata.
- **`invoices`**: Financial bills calculated from contract rates and shipment milestones.
- **`audit_logs`**: Tamper-evident ledger of user and system mutations.
