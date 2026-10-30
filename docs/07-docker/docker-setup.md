# LogiFlows Docker Setup & Deployment Guide

## 1. Overview
The LogiFlows platform runs as three decoupled Docker services defined in `docker-compose.yml`:
1. `db`: PostgreSQL 16 Alpine container with health probe.
2. `backend`: Python 3.12-slim container with Django, DRF, and Gunicorn.
3. `frontend`: Node 20 builder + Alpine Nginx container serving the React SPA.

---

## 2. Docker Compose Configuration
```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: logiflows_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-logiflows_db}
      POSTGRES_USER: ${POSTGRES_USER:-logiflows_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-logiflows_dev_password_2026}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-logiflows_user} -d ${POSTGRES_DB:-logiflows_db}"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 5s
    networks:
      - logiflows_net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: logiflows_backend
    restart: unless-stopped
    environment:
      DJANGO_SETTINGS_MODULE: config.settings.development
      DJANGO_SECRET_KEY: ${DJANGO_SECRET_KEY:-dev_secret_key_change_in_production_logiflows_2026_secure}
      DJANGO_DEBUG: ${DJANGO_DEBUG:-True}
      DJANGO_ALLOWED_HOSTS: localhost,127.0.0.1,backend,web,frontend,0.0.0.0
      POSTGRES_DB: ${POSTGRES_DB:-logiflows_db}
      POSTGRES_USER: ${POSTGRES_USER:-logiflows_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-logiflows_dev_password_2026}
      POSTGRES_HOST: db
      POSTGRES_PORT: 5432
      CORS_ALLOWED_ORIGINS: http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/api/v1/health/ || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - logiflows_net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: logiflows_frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://127.0.0.1:3000/ || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 5s
    networks:
      - logiflows_net

volumes:
  postgres_data:
    driver: local

networks:
  logiflows_net:
    driver: bridge
```

---

## 3. Operational Startup & Verification Commands
```bash
# 1. Build and start all services
docker compose up -d --build

# 2. Check running container health status
docker compose ps

# 3. Stream container logs
docker compose logs -f

# 4. Verify Django system checks inside backend container
docker compose exec backend python manage.py check

# 5. Run initial migrations inside backend container
docker compose exec backend python manage.py migrate

# 6. Stop containers gracefully without destroying volumes
docker compose down
```
