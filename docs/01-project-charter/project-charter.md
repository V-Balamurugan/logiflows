# LogiFlows B2B Service Platform — Project Charter

## 1. Executive Summary
**LogiFlows** is a modern, enterprise-grade B2B logistics, freight, and supply chain service platform designed to unify shippers, carriers, freight forwarders, dispatchers, and warehouse operators under a single pane of glass.

## 2. Business Objectives & Goals
- **Real-Time Visibility**: Eliminate operational blind spots with end-to-end milestone tracking and telemetry probes.
- **Multi-Tenant Isolation**: Enable B2B organizations (Shippers, Carriers, 3PLs) to operate independently while collaborating securely.
- **Operational Automation**: Transition from manual paperwork (bills of lading, paper invoices) to automated dispatch, state machine enforcement, and digital invoicing.
- **Data Integrity & Traceability**: Immutable audit trails and real PostgreSQL-backed data with zero fake mock records disguised as live operations.
- **Strict SLA Compliance**: Real-time alerts for delayed shipments, route exceptions, and detention time.

## 3. Project Scope
### In-Scope (Phase 00 Foundation through Phase 06)
- Multi-tenant Organization & Tenant Context Management.
- Granular Role-Based Access Control (RBAC).
- Freight Order & Shipment Lifecycle Management (FSM: Draft -> Booked -> Dispatched -> In Transit -> Out for Delivery -> Delivered / Exception).
- Carrier, Fleet & Driver Assignments.
- Contract Rate Calculation, Invoicing & Billing Ledgers.
- Docker Compose development and production baselines.
- Comprehensive automated testing and quality gates.

### Out-of-Scope (Phase 00 Baseline)
- Mobile native apps (iOS / Android) — initial focus is responsive Web SPA.
- Hardware-level IoT GPS trackers firmware development (platform consumes webhooks/APIs).

## 4. Key Stakeholders & Actors
| Stakeholder / Actor | Role & Responsibilities |
| :--- | :--- |
| **Super Administrator** | Platform infrastructure, tenant provisioning, cross-organization audits, system telemetry. |
| **Tenant Administrator** | Organization configuration, user onboarding, role assignments, billing accounts. |
| **Logistics Manager** | Freight procurement, contract rates, SLA monitoring, carrier performance evaluation. |
| **Dispatcher** | Load assignment, fleet routing, exception resolution, live driver dispatching. |
| **Driver / Transporter** | Mobile web milestone status reporting, electronic proof of delivery (ePOD), incident reporting. |
| **Auditor / Viewer** | Read-only compliance, regulatory documentation review, audit trail verification. |

## 5. Technology Stack Selection & Rationale
- **Backend API**: Python 3.12, Django 5.0, Django REST Framework 3.15 (Rock-solid ORM, mature security, built-in admin, robust serialization).
- **Frontend SPA**: React 18, TypeScript, Vite (Type safety, lightning-fast HMR, rich responsive UI, component reusability).
- **Primary Database**: PostgreSQL 16 Alpine (ACID compliance, relational integrity, row-level security capabilities).
- **Infrastructure & Containerization**: Docker Compose v2 with health check probes on all services.
