# API Design Conventions & Standards

## 1. URI Namespace & Versioning
All REST API endpoints are prefixed with `/api/v1/` to support backwards compatibility and zero-downtime upgrades.

```
https://api.logiflows.local/api/v1/<resource>/
```

## 2. HTTP Method Semantics
| Method | Description | Success Code | Idempotent |
| :--- | :--- | :---: | :---: |
| `GET` | Retrieve resource representation or paginated list | `200 OK` | Yes |
| `POST` | Create new entity or execute non-idempotent workflow action | `201 Created` / `200 OK` | No |
| `PUT` | Full replacement of existing entity | `200 OK` | Yes |
| `PATCH` | Partial update of specific fields | `200 OK` | Yes |
| `DELETE` | Soft-delete / deactivate entity | `204 No Content` | Yes |

## 3. Standard Response Envelopes
Successful responses return clear JSON objects.

### Single Entity Response
```json
{
  "id": "c1f7b029-4d6b-4b2a-89a5-7a91176bc1d3",
  "tracking_number": "TRK-2026-9812",
  "status": "IN_TRANSIT",
  "created_at": "2026-10-28T14:30:00Z"
}
```

### Paginated List Response
```json
{
  "count": 142,
  "next": "/api/v1/shipments/?page=2",
  "previous": null,
  "results": [...]
}
```

### Error Envelope
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid state transition from DELIVERED to DRAFT",
    "details": {
      "status": ["Cannot transition backward from terminal state."]
    }
  }
}
```

## 4. Health Probe API (`/api/v1/health/`)
- Public, unauthenticated endpoint for orchestrators (Docker Compose, Kubernetes liveness probes).
- Executes `SELECT 1;` against PostgreSQL to guarantee database reachability.
- Response contains service version, environment, status, and millisecond latency.
