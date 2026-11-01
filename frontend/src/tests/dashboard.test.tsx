import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../pages/DashboardPage';
import * as dashboardApi from '../api/dashboardApi';
import * as orgApi from '../api/organizationApi';
import AuthContext from '../context/AuthContext';
import { TenantProvider } from '../context/TenantContext';

vi.mock('../api/dashboardApi', () => ({
  getDashboardSummaryApi: vi.fn(),
}));

vi.mock('../api/organizationApi', () => ({
  getMyMembershipsApi: vi.fn(),
}));

const renderWithAuth = (user: any, initialRoute = '/dashboard') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const authValue = {
    user,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    refreshUser: vi.fn(),
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthContext.Provider value={authValue}>
          <TenantProvider>
            <DashboardPage />
          </TenantProvider>
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Module 7: Dashboard Telemetry and Role Scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders platform admin global telemetry dashboard with system metrics', async () => {
    (orgApi.getMyMembershipsApi as any).mockResolvedValue([]);
    (dashboardApi.getDashboardSummaryApi as any).mockResolvedValue({
      role: 'PLATFORM_ADMIN',
      scope: 'GLOBAL',
      metrics: {
        total_organizations: 10,
        pending_organizations: 3,
        approved_organizations: 6,
        suspended_organizations: 1,
        rejected_organizations: 0,
        total_branches: 24,
        active_branches: 22,
        total_service_areas: 45,
        total_employees: 18,
        total_users: 35,
      },
    });

    renderWithAuth({
      id: 'admin-1',
      email: 'admin@logiflows.test',
      full_name: 'Platform Overseer',
      role: 'PLATFORM_ADMIN',
      is_active: true,
    });

    await waitFor(() => {
      expect(screen.getByText('Platform Global Telemetry')).toBeInTheDocument();
      expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Active Tenants')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
    });
  });

  it('renders tenant owner operations dashboard scoped to their organization', async () => {
    (orgApi.getMyMembershipsApi as any).mockResolvedValue([
      {
        id: 'mem-1',
        organization: 'org-apex',
        organization_name: 'Apex Express',
        organization_code: 'APEX',
        organization_status: 'APPROVED',
        user: 'user-owner',
        user_email: 'owner@apex.test',
        user_full_name: 'Apex Owner',
        role: 'ORGANIZATION_OWNER',
        is_active: true,
      },
    ]);

    (dashboardApi.getDashboardSummaryApi as any).mockResolvedValue({
      role: 'ORGANIZATION_OWNER',
      scope: 'TENANT',
      has_tenant: true,
      organization: {
        id: 'org-apex',
        name: 'Apex Express',
        code: 'APEX',
        status: 'APPROVED',
      },
      metrics: {
        total_branches: 5,
        active_branches: 4,
        inactive_branches: 1,
        total_service_areas: 12,
        total_employees: 8,
        active_employees: 7,
      },
    });

    renderWithAuth({
      id: 'user-owner',
      email: 'owner@apex.test',
      full_name: 'Apex Owner',
      role: 'ORGANIZATION_OWNER',
      is_active: true,
    });

    await waitFor(() => {
      expect(screen.getByText('Organization Operations KPI')).toBeInTheDocument();
      expect(screen.getByText('Active Hubs & Branches')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('Serviceable Postal Codes')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Staff & Couriers')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });
  });

  it('renders branch manager operational hub scoped to assigned branch', async () => {
    (orgApi.getMyMembershipsApi as any).mockResolvedValue([
      {
        id: 'mem-bm',
        organization: 'org-apex',
        organization_name: 'Apex Express',
        organization_code: 'APEX',
        organization_status: 'APPROVED',
        user: 'user-bm',
        user_email: 'bm@apex.test',
        user_full_name: 'Branch Chief',
        role: 'BRANCH_MANAGER',
        branch: 'branch-del-01',
        branch_name: 'Delhi North Hub',
        is_active: true,
      },
    ]);

    (dashboardApi.getDashboardSummaryApi as any).mockResolvedValue({
      role: 'BRANCH_MANAGER',
      scope: 'BRANCH',
      has_tenant: true,
      organization: {
        id: 'org-apex',
        name: 'Apex Express',
        code: 'APEX',
      },
      branch: {
        id: 'branch-del-01',
        name: 'Delhi North Hub',
        code: 'DEL-01',
        status: 'ACTIVE',
      },
      metrics: {
        assigned_employees: 6,
        active_employees: 6,
        service_areas_covered: 3,
      },
    });

    renderWithAuth({
      id: 'user-bm',
      email: 'bm@apex.test',
      full_name: 'Branch Chief',
      role: 'BRANCH_MANAGER',
      is_active: true,
    });

    await waitFor(() => {
      expect(screen.getByText(/Branch Operations Hub: Delhi North Hub/i)).toBeInTheDocument();
      expect(screen.getByText('Assigned Branch Staff')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('Covered Postal Codes')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});

