# Contributing to LogiFlows

Thank you for contributing to LogiFlows! This guide details development workflows, testing requirements, and branch conventions.

---

## 1. Code of Conduct & Scope Discipline
- **Strict Phase Discipline**: Only implement features assigned to the active phase. Never introduce business models or endpoints ahead of schedule.
- **No Hardcoded Secrets**: Never commit passwords, tokens, API keys, or private certificates. Use `.env.example` as a template and place local secrets in `.env`.
- **Honest Test Evidence**: Every pull request must provide real, verifiable test execution results. Never report unexecuted tests as passed.

---

## 2. Development Setup

### Option A: Docker Compose (Recommended)
```bash
# Clone the repository
git clone <repo-url>
cd "Logiflows B@B service platform"

# Configure local environment
cp .env.example .env

# Build and start services
docker compose up -d --build

# Verify container health
docker compose ps
```

### Option B: Native Host Environment
```bash
# 1. Backend setup
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
cd backend
python manage.py check
pytest

# 2. Frontend setup
cd ../frontend
npm install
npm run build
npm test
npx playwright test
```

---

## 3. Git Workflow & Commit Conventions
- **Feature Branches**: `feature/phase-XX-<description>` (e.g., `feature/phase-00-foundation`).
- **Commit Message Format**: Follow Conventional Commits:
  - `chore(phase-00): initialize LogiFlows development environment`
  - `feat(phase-01): implement multi-tenant organization model`
  - `test(phase-00): add pytest and playwright smoke suites`
  - `docs(phase-00): create 10-module engineering specifications`

---

## 4. Testing Requirements
Before submitting changes:
1. Run backend tests: `pytest` (must pass 100%).
2. Run frontend unit tests: `npm test` (must pass 100%).
3. Run Playwright browser smoke tests: `npx playwright test` (must pass 100%).
4. Verify TypeScript build: `npm run build` (must pass with 0 errors).
