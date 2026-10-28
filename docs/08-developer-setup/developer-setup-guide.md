# Developer Setup Guide — LogiFlows

## 1. Prerequisites
- **Docker & Docker Compose**: Docker Desktop 4.x+ with WSL2 integration (Windows) or native Docker Engine (Linux/macOS).
- **Node.js**: v20+ and npm 10+ (for local frontend development without Docker).
- **Python**: 3.12+ (for local backend development without Docker).
- **Git**: 2.30+.

## 2. Quickstart with Docker Compose (Recommended)
1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd "Logiflows B@B service platform"
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```

3. **Build and Run All Services**:
   ```bash
   docker compose up -d --build
   ```

4. **Verify Container Health**:
   ```bash
   docker compose ps
   ```

5. **Access Application Endpoints**:
   - Frontend Application: [http://localhost:3000](http://localhost:3000)
   - Backend API Health: [http://localhost:8000/api/v1/health/](http://localhost:8000/api/v1/health/)
   - Platform Info: [http://localhost:8000/api/v1/platform-info/](http://localhost:8000/api/v1/platform-info/)
   - Django Admin: [http://localhost:8000/admin/](http://localhost:8000/admin/)

## 3. Running Native Local Development (Without Docker)

### Backend (Django)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
# Accessible at http://localhost:5173 or configured port
```

## 4. Running Test Suites

### Backend Tests
```bash
# In Docker:
docker compose exec backend python manage.py test apps.common

# Native:
cd backend && python manage.py test apps.common
```

### Frontend Tests
```bash
cd frontend
npm test
```
