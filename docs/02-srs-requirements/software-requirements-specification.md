# Software Requirements Specification (SRS) — LogiFlows B2B

## 1. Introduction
This Software Requirements Specification describes the functional and non-functional requirements for the LogiFlows B2B Service Platform.

## 2. Actors & Personas
- **ACT-01 Super Admin**: Manages system tenants, platform health, database migrations, and global telemetry.
- **ACT-02 Tenant Admin**: Manages organization members, credentials, API tokens, and branch locations.
- **ACT-03 Logistics Manager**: Creates shipment orders, assigns carrier contracts, and reviews invoices.
- **ACT-04 Dispatcher**: Manages daily loads, pairs shipments with drivers and tractors/trailers.
- **ACT-05 Driver**: Reviews dispatched loads, updates shipment progress, records ePOD signatures.
- **ACT-06 Auditor / Viewer**: Read-only oversight of audit logs, contracts, and tracking records.

## 3. Functional Requirements (FR)

### Module 1: Multi-Tenancy & Identity Management
- **FR-101**: The system shall isolate data strictly by tenant organization (`organization_id`).
- **FR-102**: Users shall belong to one or more organizations with distinct roles per organization.
- **FR-103**: API requests shall validate authorization at the DRF view/permission layer before querying the database.

### Module 2: Shipment & Waybill Management
- **FR-201**: The system shall support a state-machine lifecycle: `DRAFT`, `BOOKED`, `DISPATCHED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `EXCEPTION`, `CANCELLED`.
- **FR-202**: State transitions shall be validated on the backend; invalid transitions shall return HTTP 400 Bad Request with descriptive error reasons.
- **FR-203**: Each shipment shall record timestamps, origin, destination, cargo weight/volume, and consignee details.

### Module 3: Fleet & Driver Operations
- **FR-301**: The system shall track vehicle units (tractors, trailers, chassis) with capacity limits.
- **FR-302**: Dispatches shall verify driver license validity and vehicle availability before assignment.

### Module 4: Invoicing & Financial Settlement
- **FR-401**: Invoices shall generate automatically upon delivery confirmation or milestone completion.
- **FR-402**: The system shall support line-item charges (base freight, fuel surcharge, accessorials, detention fees).

### Module 5: Infrastructure & Observability
- **FR-501**: The backend shall provide a public/unauthenticated `/api/v1/health/` probe reporting DB connectivity and query response time.
- **FR-502**: The frontend shall display real-time system status probing `/api/v1/health/` every 15 seconds.

## 4. Non-Functional Requirements (NFR)
- **NFR-SEC-01 (Security)**: Authentication tokens and session secrets must never be hardcoded or checked into source control.
- **NFR-SEC-02 (Data Isolation)**: A tenant must never receive or mutate another tenant's records under any circumstance.
- **NFR-PERF-01 (Performance)**: The `/api/v1/health/` endpoint must respond within 100ms under standard loads.
- **NFR-REL-01 (Reliability)**: Docker containers must employ automatic health checks and restart policies (`unless-stopped`).
- **NFR-COMP-01 (Auditability)**: All write mutations must record timestamps and acting user identifiers in an immutable audit ledger.
