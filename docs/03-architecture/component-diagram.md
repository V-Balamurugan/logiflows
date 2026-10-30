# LogiFlows Component Diagram

```mermaid
classDiagram
    class FrontendApp {
        +PublicLayout
        +AppShellLayout
        +LandingPage
        +StatusPage
        +ArchitecturePage
        +NotFoundPage
        +ApiClient (Axios)
        +TanStackQuery
    }

    class DjangoBackend {
        +Settings (base, dev, test)
        +CustomUser (AbstractUser)
        +HealthCheckView
        +ReadinessCheckView
        +PlatformInfoView
        +ExceptionHandler
        +OpenAPISchemaView
    }

    class PostgresDatabase {
        +logiflows_users (table)
        +django_migrations (table)
        +pg_isready (health probe)
        +postgres_data (volume)
    }

    FrontendApp --> DjangoBackend : JSON over REST (/api/v1/)
    DjangoBackend --> PostgresDatabase : psycopg3 connection
```

## Component Boundaries & Inter-Service Networking
1. **Frontend to Backend**:
   - Local Browser access: `http://localhost:3000`
   - Internal Docker Reverse Proxy: Requests matching `/api/v1/*` are proxied to `http://backend:8000/api/v1/*`
2. **Backend to Database**:
   - Internal DNS name: `db`
   - Internal port: `5432`
   - Managed connection pool with max lifetime of 60 seconds (`CONN_MAX_AGE = 60`)
