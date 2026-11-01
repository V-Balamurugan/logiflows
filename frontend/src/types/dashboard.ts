export interface PlatformAdminMetrics {
  total_organizations: number;
  pending_organizations: number;
  approved_organizations: number;
  suspended_organizations: number;
  rejected_organizations: number;
  total_branches: number;
  active_branches: number;
  total_service_areas: number;
  total_employees: number;
  total_users: number;
}

export interface TenantMetrics {
  total_branches: number;
  active_branches: number;
  inactive_branches: number;
  total_service_areas: number;
  total_employees: number;
  active_employees: number;
}

export interface BranchManagerMetrics {
  assigned_employees: number;
  active_employees: number;
  service_areas_covered: number;
}

export interface DashboardSummaryResponse {
  role: string;
  scope: 'GLOBAL' | 'TENANT' | 'BRANCH' | 'EMPLOYEE' | 'PERSONAL';
  has_tenant?: boolean;
  organization?: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
    status?: string;
  } | null;
  metrics: PlatformAdminMetrics | TenantMetrics | BranchManagerMetrics | Record<string, any>;
}
