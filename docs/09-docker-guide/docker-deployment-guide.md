# Docker Deployment & Container Orchestration Guide

## 1. Container Topology
LogiFlows uses Docker Compose with an isolated bridge network (`logiflows_net`) and named volumes (`postgres_data`).

| Service | Container Name | Image / Build | Internal Port | Host Port | Health Check Probe |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **db** | `logiflows_db` | `postgres:16-alpine` | 5432 | 5432 | `pg_isready -U logiflows_user -d logiflows_db` |
| **backend** | `logiflows_backend`| `./backend/Dockerfile` | 8000 | 8000 | `curl -f http://localhost:8000/api/v1/health/` |
| **frontend**| `logiflows_frontend`| `./frontend/Dockerfile`| 3000 | 3000 | `wget -q --spider http://localhost:3000/` |

## 2. Startup Sequencing & Health Dependency
To prevent race conditions on cold boots:
- The `backend` container declares `depends_on: db: condition: service_healthy`.
- The `frontend` container declares `depends_on: backend: condition: service_healthy`.
- The health probe on `backend` actively executes `SELECT 1;` against the database to guarantee end-to-end readiness before traffic is routed.

## 3. Useful Operations Commands

### Rebuilding Images
```bash
docker compose build --no-cache
```

### Inspecting Service Logs
```bash
# All services:
docker compose logs -f

# Specific service:
docker compose logs -f backend
docker compose logs -f db
```

### Running Migrations Inside Container
```bash
docker compose exec backend python manage.py migrate
```

### Entering Container Shell
```bash
docker compose exec backend /bin/sh
docker compose exec db psql -U logiflows_user -d logiflows_db
```

### Teardown
```bash
# Stop containers:
docker compose down

# Stop containers and remove volumes (CAUTION: wipes database):
docker compose down -v
```
