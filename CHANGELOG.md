# Changelog

All notable changes to the **LogiFlows B2B Service Platform** project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-28
### Added - Phase 00 Foundation & Docker Baseline
- **Requirements & Charter**: Complete project charter and Software Requirements Specification (SRS) covering 6 system actors and 12 core requirements.
- **System Architecture**: Multi-tenant SOA architecture specification with container topology and security baseline.
- **ER Data Model**: PostgreSQL 16 entity-relationship diagram with 8 relational tables (Organizations, Users, Shipments, Milestone Updates, Vehicles, Dispatch Assignments, Invoices, Audit Logs).
- **Role-Permission Matrix**: Granular RBAC definitions across 6 system personas.
- **REST API Baseline**: Django 5.0 + Django REST Framework 3.15 baseline with standard response envelope conventions.
- **Health Check Endpoint**: `/api/v1/health/` probing PostgreSQL connectivity (`SELECT 1;`) and returning latency metrics.
- **Frontend SPA**: React 18, TypeScript, and Vite frontend with an enterprise dark-mode design system.
- **Shell Layout**: Responsive sidebar, tenant switcher, user profile, and real-time infrastructure telemetry card.
- **Containerization**: `docker-compose.yml` orchestrating PostgreSQL 16 Alpine, Django backend, and React/Nginx frontend with health check dependencies.
- **Automated Tests**: Unit test suite for Django health endpoint and 5 Vitest component tests for the React shell.
- **Documentation Suite**: 12 documentation modules including setup guides, Docker deployment guide, traceability matrix, and Phase 00 completion report.
