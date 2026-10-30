# LogiFlows Technology Stack Specification

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Language (Backend)** | Python | 3.12 (Docker) / 3.14 (Host) | Core API and business orchestration language |
| **Web Framework** | Django | 5.1.15 | Robust enterprise backend framework with ORM & admin |
| **API Framework** | Django REST Framework | 3.15.2 | RESTful endpoint serialization and view handling |
| **Database Adapter** | psycopg | 3.3.6 (binary) | High-performance C-optimized PostgreSQL 3 driver |
| **CORS Middleware** | django-cors-headers | 4.9.0 | Safe origin-filtered cross-origin resource sharing |
| **API Documentation** | drf-spectacular | 0.27.2 | OpenAPI 3.0 auto-generation and Swagger UI interface |
| **WSGI Server** | Gunicorn | 26.2.0 | Production WSGI server for container environments |
| **Backend Testing** | pytest & pytest-django | 9.2.0 / 4.14.0 | Unit, integration, and database test runner |
| **Language (Frontend)** | TypeScript | 5.6.3 / 5.9.3 | Type-safe enterprise JavaScript frontend programming |
| **UI Library** | React | 18.3.1 | Declarative component UI engine |
| **Build Tool** | Vite | 5.4.8 / 5.4.21 | Rapid HMR dev server and Rollup production bundler |
| **Styling** | Tailwind CSS | 3.4.13 | Utility-first design tokens and responsive classes |
| **Routing** | React Router | 6.27.0 | Declarative client-side route manager |
| **Server State** | TanStack Query | 5.59.0 | Async data fetching, caching, and polling engine |
| **HTTP Client** | Axios | 1.7.7 | Promise-based HTTP client with global interceptors |
| **Form Validation** | React Hook Form & Zod | 7.53.0 / 3.23.8 | Schema validation and high-performance form bindings |
| **Iconography** | Lucide React | 0.453.0 | Modern SVG icon set |
| **Frontend Testing** | Vitest | 2.1.2 / 2.1.9 | Fast Vite-native unit and component test runner |
| **DOM Testing** | React Testing Library | 16.0.1 | User-centric UI component rendering assertions |
| **E2E Testing** | Playwright | 1.48.1 | Headless browser smoke tests and regression runner |
| **Database Engine** | PostgreSQL | 16-alpine | Enterprise ACID relational database |
| **Container Engine** | Docker & Docker Compose | 29.7.2 / v5.5.1 | Multi-service local and cloud container orchestrator |
