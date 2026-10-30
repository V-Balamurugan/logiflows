# LogiFlows API Endpoint Reference

## 1. OpenAPI & Interactive Documentation Endpoints
- **OpenAPI 3.0 Schema**: `GET /api/v1/schema/`
- **Swagger UI Interactive Explorer**: `GET /api/v1/docs/`
- **ReDoc API Documentation**: `GET /api/v1/redoc/`

---

## 2. Health & Readiness Probes

### 2.1 Application Liveness: `GET /api/v1/health/`
Returns the runtime health of the API process and its attached database.

**Sample 200 OK Response**:
```json
{
  "status": "healthy",
  "service": "LogiFlows B2B Service Platform API",
  "version": "1.0.0-phase-00",
  "timestamp": "2026-10-30T12:00:00.000000+00:00",
  "environment": "development",
  "components": {
    "database": {
      "connected": true,
      "engine": "postgresql",
      "latency_ms": 1.45,
      "error": null
    },
    "api": {
      "status": "healthy",
      "framework": "Django REST Framework 3.15"
    }
  }
}
```

---

### 2.2 Database Readiness: `GET /api/v1/readiness/`
Performs an active query (`SELECT 1;`) to verify PostgreSQL connectivity.

**Sample 200 OK Response**:
```json
{
  "ready": true,
  "status": "ready",
  "database": {
    "connected": true,
    "latency_ms": 1.25,
    "engine": "postgresql"
  },
  "timestamp": "2026-10-30T12:00:00.000000+00:00"
}
```

**Sample 503 Service Unavailable Response**:
```json
{
  "ready": false,
  "status": "not_ready",
  "database": {
    "connected": false,
    "error": "connection to server at 'db' (172.28.0.2), port 5432 failed"
  },
  "timestamp": "2026-10-30T12:00:00.000000+00:00"
}
```

---

### 2.3 Platform Information: `GET /api/v1/platform-info/`
Returns architectural metadata and planned operational modules.
