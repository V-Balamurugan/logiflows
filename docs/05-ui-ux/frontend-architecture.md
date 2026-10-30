# LogiFlows Frontend Architecture

## 1. Directory Structure
```
frontend/
  public/            # Static icons, manifest, favicon
  src/
    app/             # Application root, routing definitions (App.tsx, routes.tsx)
    api/             # Centralized Axios instance (client.ts), TanStack queries (health.ts)
    components/
      ui/            # Reusable UI atomics (Button, Badge, Card, Input)
      common/        # Global layout elements (Logo, Breadcrumbs, ErrorFallback)
    layouts/         # Layout shells (PublicLayout, AppShellLayout)
    pages/           # Screen views (LandingPage, StatusPage, ArchitecturePage, NotFoundPage)
    styles/          # Design tokens and Tailwind directives (index.css)
    types/           # TypeScript contracts and interface models (index.ts)
    tests/           # Vitest and React Testing Library specs
  e2e/               # Playwright browser smoke test suites (smoke.spec.ts)
  index.html         # SPA HTML entrypoint with Inter Google font
  package.json       # Dependencies, scripts, package metadata
  tsconfig.json      # TypeScript compiler configuration
  vite.config.ts     # Vite bundler, proxy, and Vitest runner setup
  playwright.config  # Playwright browser testing configuration
  tailwind.config.js # Tailwind CSS theme tokens
  Dockerfile         # Multi-stage production build (Node 20 -> Alpine Nginx)
```

---

## 2. State Management Strategy
1. **Server State**: Managed via `@tanstack/react-query`. Provides automated query caching, refetch on network reconnect, and background polling.
2. **URL State**: Managed via `react-router-dom` (declarative routes, query parameters, breadcrumb extraction).
3. **Local UI State**: Managed via React hooks (`useState`, `useCallback`, `useMemo`) for component-level UI interactions (e.g., sidebar toggling).

---

## 3. Global Error Handling
- **React Error Boundary**: Implemented in `App.tsx` via `GlobalErrorBoundary` capturing unhandled component render errors and rendering `ErrorFallback`.
- **Axios Response Interceptors**: Implemented in `api/client.ts` logging and normalizing HTTP 4xx/5xx network failures.
