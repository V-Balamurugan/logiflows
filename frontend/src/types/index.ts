/**
 * TypeScript Data Contracts and UI Models for LogiFlows.
 */

export interface DatabaseStatus {
  connected: boolean;
  engine: string;
  latency_ms: number | null;
  error: string | null;
}

export interface ApiStatus {
  status: string;
  framework: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  service: string;
  version: string;
  timestamp: string;
  environment: string;
  components: {
    database: DatabaseStatus;
    api: ApiStatus;
  };
}

export interface ReadinessResponse {
  ready: boolean;
  status: 'ready' | 'not_ready';
  database?: {
    connected: boolean;
    latency_ms?: number;
    engine?: string;
    error?: string;
  };
  timestamp: string;
}

export interface PlatformArchitecture {
  multitenancy: string;
  database: string;
  roles: string[];
  planned_modules: string[];
}

export interface PlatformInfoResponse {
  platform: string;
  phase: string;
  status: string;
  architecture: PlatformArchitecture;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  iconName?: string;
  badge?: string;
  planned?: boolean;
}

// Aliases and types for legacy prototype views compatibility
export type HealthStatus = HealthResponse;
export type PlatformInfo = PlatformInfoResponse;

export interface TenantContext {
  id: string;
  name: string;
  code: string;
  type: string;
}

export type ShipmentStatusType =
  | 'DRAFT'
  | 'BOOKED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EXCEPTION'
  | 'CANCELLED';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'TENANT_ADMIN'
  | 'LOGISTICS_MANAGER'
  | 'DISPATCHER'
  | 'DRIVER'
  | 'AUDITOR_VIEWER';
