# LogiFlows Non-Functional Requirements (NFR)

## 1. Performance & Scalability
- **NFR-P-1 (Response Time)**: 95% of standard API read endpoints must respond in under 100ms under standard loads.
- **NFR-P-2 (Database Query Overhead)**: Core health check and lookup queries must resolve in under 20ms round-trip latency.
- **NFR-P-3 (Asset Optimization)**: The production frontend bundle must stay under 350KB gzipped (achieved: 100.27 KB).
- **NFR-P-4 (Concurrent Users)**: Gunicorn WSGI workers and connection pooling must support at least 250 concurrent authenticated requests per container instance.

---

## 2. Security & Compliance
- **NFR-S-1 (No Baked Secrets)**: No production passwords, secret keys, or database credentials may exist in source code or Dockerfiles.
- **NFR-S-2 (CORS Strictness)**: CORS origins must be strictly controlled via environment variables; wildcard `*` is prohibited in production.
- **NFR-S-3 (Data Isolation)**: Multi-tenant data leakage is a critical severity defect. Row-level tenant isolation must be verified via unit tests.
- **NFR-S-4 (Container Rootless / Minimal Privileges)**: Docker images must utilize Alpine / slim bases with minimal build dependencies removed.

---

## 3. Reliability & Maintainability
- **NFR-R-1 (Container Health Probes)**: All Docker Compose services must define verifiable health checks with automatic restart policies (`unless-stopped`).
- **NFR-R-2 (Database Persistence)**: All PostgreSQL tables and indexes must reside on a named persistent Docker volume (`postgres_data`) surviving container recreation.
- **NFR-R-3 (Test Coverage Gate)**: Code commits must maintain automated test execution across backend (pytest) and frontend (Vitest + Playwright).
- **NFR-R-4 (Strict Linting & Typing)**: TypeScript strict mode must be enabled with zero compile warnings in production builds.
