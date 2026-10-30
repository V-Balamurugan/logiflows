# LogiFlows Functional Requirements

This document catalogs the functional modules across all project phases.

## 1. Phase 00: Foundation & Environment (Current)
- **FR-00-1**: The system shall expose a liveness endpoint `GET /api/v1/health/` returning service name, version, timestamp, environment, and component status.
- **FR-00-2**: The system shall expose a database readiness probe `GET /api/v1/readiness/` that executes an active query (`SELECT 1;`) against PostgreSQL and returns round-trip latency.
- **FR-00-3**: The API shall provide OpenAPI 3.0 schema generation at `GET /api/v1/schema/` and interactive Swagger UI at `GET /api/v1/docs/`.
- **FR-00-4**: All unhandled API errors shall return a standardized JSON envelope containing `status`, `error_code`, `message`, and `details`.
- **FR-00-5**: The frontend shall provide a public Landing Page with brand header, hero overview, and planned features grid.
- **FR-00-6**: The frontend shall provide an Application Shell with responsive sidebar, top navigation, breadcrumbs, and live telemetry widgets.
- **FR-00-7**: The frontend shall provide a Development Status Page displaying real-time API and PostgreSQL telemetry without mock data.
- **FR-00-8**: A custom User model inheriting from `AbstractUser` shall be configured in Django before initial migrations.

---

## 2. Phase 01: Multi-Tenancy & Identity (Upcoming)
- **FR-01-1**: The system shall enforce shared-database multi-tenancy where all operational rows reference an `organization_id`.
- **FR-01-2**: The system shall provide JWT authentication (access and refresh token pair) with token rotation.
- **FR-01-3**: Role-Based Access Control (RBAC) permissions shall gate access by role (`SUPER_ADMIN`, `TENANT_ADMIN`, `LOGISTICS_MANAGER`, `DISPATCHER`, `DRIVER`, `AUDITOR_VIEWER`).

---

## 3. Phase 02 to Phase 11 Roadmap Overview
- **Phase 02 (Fleet)**: Vehicle master registration, dimensions, payload ratings, telematics telemetry integration.
- **Phase 03 (Booking)**: Consignment booking, volumetric dimensional calculation, barcode waybill generation.
- **Phase 04 (QR Custody)**: Cryptographic QR scanning, chain-of-custody transfer logging.
- **Phase 05 (Hub Ops)**: Inbound/outbound sorting, staging bin allocation, transfer manifests.
- **Phase 06 (Dispatch)**: Driver run-sheet creation, dispatch confirmation, electronic POD capture.
- **Phase 07 (Routing)**: TSP route optimization considering road networks, speed limits, and delivery windows.
- **Phase 08 (AI Delay)**: Machine learning predictive inference scoring weather, customs, and congestion risk.
- **Phase 09 (Notifications)**: Real-time milestone WebSockets, customer SMS, and email alerts.
- **Phase 10 (Billing)**: Tariff calculation, automated invoice generation, payment reconciliation.
- **Phase 11 (Analytics)**: SLA performance dashboards, vehicle utilization metrics, carbon emission audits.
