/**
 * TypeScript Data Contracts and UI Models for LogiFlows Phase 00.
 */

export interface DatabaseStatus {
  connected: boolean;
  latency_ms?: number | null;
  error?: string | null;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  db: 'ok' | 'unavailable';
  latency_ms?: number;
  environment: string;
  version: string;
  timestamp: string;
  service?: string;
  components?: {
    database: DatabaseStatus;
    api: { status: string; framework: string };
  };
}

export interface ReadinessResponse {
  ready: boolean;
  status: 'ready' | 'not_ready';
  database?: {
    connected: boolean;
    latency_ms?: number;
    error?: string;
  };
  timestamp: string;
}

export interface PlatformInfoResponse {
  platform: string;
  phase: string;
  status: string;
  architecture: {
    multitenancy: string;
    database: string;
    roles: string[];
    planned_modules: string[];
  };
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface NavItem {
  to: string;
  label: string;
  icon: string;
  badge?: string;
}

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'error' | 'loading';

export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  plan: 'enterprise' | 'growth' | 'standard';
}
