# LogiFlows Environment Configuration

## 1. Environment Variable Reference

### Core Django Settings
- `DJANGO_SECRET_KEY`: Cryptographic signing key for Django sessions and tokens.
- `DJANGO_DEBUG`: Boolean flag (`True` / `False`). Must be `False` in production.
- `DJANGO_ALLOWED_HOSTS`: Comma-separated list of hostnames/IPs authorized to serve requests.
- `DJANGO_SETTINGS_MODULE`: Python module path (`config.settings.development` or `config.settings.production`).

### PostgreSQL Database Settings
- `POSTGRES_DB`: PostgreSQL database name (`logiflows_db`).
- `POSTGRES_USER`: PostgreSQL username (`logiflows_user`).
- `POSTGRES_PASSWORD`: Database user password (`logiflows_dev_password_2026`).
- `POSTGRES_HOST`: Host address of the database service (`db` in Docker, `localhost` locally).
- `POSTGRES_PORT`: TCP port for database connection (`5432`).

### Cross-Origin Resource Sharing (CORS)
- `CORS_ALLOWED_ORIGINS`: Comma-separated origins authorized for browser requests (e.g. `http://localhost:3000,http://localhost:5173`).

### Frontend Build & Runtime
- `VITE_API_BASE_URL`: Base API prefix consumed by Axios (`/api/v1` or `http://localhost:8000/api/v1`).
- `PORT`: Development server port (`3000`).
