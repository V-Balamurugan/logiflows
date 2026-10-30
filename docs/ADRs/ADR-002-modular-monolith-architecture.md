# ADR-002: Modular Monolith Architecture Pattern

## Status
Accepted

## Date
2026-10-30

## Context
When architecting enterprise logistics software, organizations often prematurely decompose applications into independent microservices. In early and mid-stage logistics platforms, microservices introduce severe distributed systems overhead: distributed transaction management across multi-stop manifests, complex cross-service networking, network latency, high operational cost, and deployment synchronization hurdles.

## Decision
LogiFlows adopts a strictly bounded **Modular Monolith** architecture:
1. **Single Repository & Unified Process**: Monorepo with dedicated `backend/`, `frontend/`, `docker/`, and `docs/` directories.
2. **Django App Boundaries**: Each business domain will reside in a dedicated Django application inside `apps/` (e.g., `apps/core`, `apps/accounts`, later `apps/tenants`, `apps/parcels`, etc.).
3. **Explicit Cross-Module Contracts**: Domain models belong solely to their owning app. Inter-app data access is governed through service layers and managers.
4. **Shared Database with Logical Tenant Isolation**: Single PostgreSQL instance utilizing tenant-scoped foreign keys and row-level query filters.

## Consequences
- **Positive**:
  - High developer velocity and ACID transactions across parcel custody, billing, and fleet assignment.
  - Simplified CI/CD and single Docker Compose deployment stack.
  - Zero network overhead between internal logistics domain operations.
- **Negative / Considerations**:
  - Requires continuous discipline to prevent cyclic dependencies between Django apps (enforced via tests and linting).
