# LogiFlows API Design Standards

## 1. API Protocol & Namespace
- **Base Protocol**: REST over HTTPS
- **Namespace Root**: `/api/v1/`
- **Payload Format**: JSON (`Content-Type: application/json; charset=utf-8`)
- **Naming Conventions**:
  - URLs: lowercase with hyphens (kebab-case), trailing slash required (e.g., `/api/v1/platform-info/`).
  - JSON Keys: snake_case (e.g., `error_code`, `latency_ms`).

---

## 2. Standardized Error Response Envelope
Every 4xx and 5xx API error must conform to the standard error envelope structure:
```json
{
  "status": "error",
  "error_code": "NOT_FOUND | VALIDATION_ERROR | INTERNAL_SERVER_ERROR | PERMISSION_DENIED",
  "message": "Human-readable description of the problem",
  "details": null
}
```

---

## 3. Pagination Standards
- **Default Strategy**: Page number pagination (`PageNumberPagination`)
- **Default Page Size**: 20 items per page
- **Query Parameters**: `?page=1&page_size=20`
- **Envelope Response Structure**:
```json
{
  "count": 142,
  "next": "http://api.logiflows.local/api/v1/items/?page=2",
  "previous": null,
  "results": [...]
}
```

---

## 4. HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure.
- `401 Unauthorized`: Authentication missing or invalid.
- `403 Forbidden`: Authenticated user lacks permission.
- `404 Not Found`: Resource or endpoint does not exist.
- `500 Internal Server Error`: Unhandled server exception.
- `503 Service Unavailable`: Dependent service (e.g. PostgreSQL) offline.
