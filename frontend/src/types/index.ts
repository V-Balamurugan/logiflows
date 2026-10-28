export interface DatabaseComponentStatus {
  connected: boolean;
  engine: string;
  latency_ms: number | null;
  error: string | null;
}

export interface ApiComponentStatus {
  status: string;
  framework: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'loading' | 'error';
  service: string;
  version: string;
  timestamp: string;
  environment: string;
  components: {
    database: DatabaseComponentStatus;
    api: ApiComponentStatus;
  };
}

export interface PlatformArchitecture {
  multitenancy: string;
  database: string;
  roles: string[];
  core_modules: string[];
}

export interface PlatformInfo {
  platform: string;
  phase: string;
  status: string;
  architecture: PlatformArchitecture;
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

export interface TenantContext {
  id: string;
  name: string;
  code: string;
  type: 'SHIPPER' | 'CARRIER' | '3PL_PROVIDER';
}
