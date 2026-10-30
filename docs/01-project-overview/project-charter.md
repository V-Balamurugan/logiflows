# LogiFlows Project Charter

## 1. Project Identification
- **Project Name**: LogiFlows
- **Project Type**: AI-Powered Smart Postal and B2B Logistics Management Web Application
- **Initial Scope**: Responsive Web Application (Desktop, Tablet, Mobile)
- **Phase Milestone**: Phase 00 — Foundation, Architecture, and Docker Baseline
- **Document Version**: 1.0.0

---

## 2. Executive Summary
LogiFlows is an enterprise-grade B2B freight, postal, and supply chain management platform designed to unify logistics organizations, carrier fleets, shipment booking, custody verification, route optimization, and operational intelligence into a secure, multi-tenant digital platform.

Phase 00 establishes the clean architectural foundation, containerized development environment, testing pipelines, and documentation framework before commercial freight modules are constructed.

---

## 3. Core Business Problem
Modern B2B freight and logistics operations suffer from fragmented ecosystems:
1. **Siloed Stakeholders**: Shippers, 3PL providers, line-haul carriers, and last-mile dispatchers use disparate disconnected portals.
2. **Custody Disputes**: Manual paper waybills result in lost parcels, unverified delivery handoffs, and unaccountable damage claims.
3. **Reactive Exception Management**: Dispatchers discover delivery delays only after customers lodge complaints, leading to SLA breach penalties.
4. **Architectural Fragility**: Monolithic systems lack multi-tenant data isolation, auditable event tracking, and OpenAPI standard contracts.

---

## 4. Key Stakeholders & System Actors
1. **Super Administrator**: Platform owner managing platform-wide settings, subscription tiers, and global system telemetry.
2. **Tenant Administrator**: Organization admin managing branch configurations, employees, internal RBAC, and client accounts.
3. **Logistics Manager**: Operations supervisor planning line-haul routes, carrier contracts, and cross-docking operations.
4. **Dispatcher**: Station/hub operator generating run-sheets, assigning consignments, and resolving operational exceptions.
5. **Vehicle Driver / Field Agent**: Mobile delivery operator executing pick-ups, scanning QR custody handoffs, and capturing digital POD.
6. **Auditor / Business Customer**: Client viewing shipment tracking, waybill audit trails, and contract invoices.

---

## 5. Success Criteria & Phase 00 Definition of Done
- Complete multi-container Docker Compose environment with health checks.
- Python 3.12 / Django 5.1 / Django REST Framework 3.15 API baseline with custom AbstractUser model.
- PostgreSQL 16 database with persistent volume and `pg_isready` probe.
- React 18 + TypeScript + Vite + Tailwind CSS frontend with dark-mode enterprise design system.
- Zero business models created ahead of their scheduled phases.
- 100% automated test pass rate across backend (pytest) and frontend (Vitest).
- Comprehensive OpenAPI 3.0 documentation via Swagger UI.
