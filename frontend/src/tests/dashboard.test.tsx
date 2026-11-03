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

  it('renders employee workforce hub with assigned organization and branch', async () => {
    (orgApi.getMyMembershipsApi as any).mockResolvedValue([
      {
        id: 'mem-emp',
        organization: 'org-apex',
        organization_name: 'Apex Express',
        organization_code: 'APEX',
        organization_status: 'APPROVED',
        user: 'user-emp',
        user_email: 'courier@apex.test',
        user_full_name: 'Courier Rajesh',
        role: 'EMPLOYEE',
        branch: 'branch-del-01',
        branch_name: 'Delhi North Hub',
        is_active: true,
      },
    ]);

    (dashboardApi.getDashboardSummaryApi as any).mockResolvedValue({
      role: 'EMPLOYEE',
      scope: 'EMPLOYEE',
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
      },
      metrics: {
        is_active: true,
      },
    });

    renderWithAuth({
      id: 'user-emp',
      email: 'courier@apex.test',
      full_name: 'Courier Rajesh',
      role: 'EMPLOYEE',
      is_active: true,
    });

    await waitFor(() => {
      expect(screen.getByText('Courier & Operations Workforce Hub')).toBeInTheDocument();
      expect(screen.getByText('Assigned Organization')).toBeInTheDocument();
      expect(screen.getByText('Assigned Branch Hub')).toBeInTheDocument();
      expect(screen.getByText('Active Duty')).toBeInTheDocument();
    });
  });

  it('renders customer portal with serviceability and registration CTAs', async () => {
    (orgApi.getMyMembershipsApi as any).mockResolvedValue([]);

    (dashboardApi.getDashboardSummaryApi as any).mockResolvedValue({
      role: 'CUSTOMER',
      scope: 'PERSONAL',
      has_tenant: false,
      metrics: {
        account_status: 'ACTIVE',
      },
    });

    renderWithAuth({
      id: 'user-cust',
      email: 'customer@test.com',
      full_name: 'Jane Customer',
      role: 'CUSTOMER',
      is_active: true,
    });

    await waitFor(() => {
      expect(screen.getByText('Customer Logistics Portal')).toBeInTheDocument();
      expect(screen.getByText('Check Delivery Serviceability')).toBeInTheDocument();
      expect(screen.getByText('Register a Logistics Company')).toBeInTheDocument();
    });
  });

  it('renders all five segregated functional sections on the dashboard for enhanced UX', async () => {
    (orgApi.getMyMembershipsApi as any).mockResolvedValue([
      {
        id: 'mem-1',
        organization: 'org-apex',
        organization_name: 'Apex Express',
        organization_code: 'APEX',
        organization_status: 'APPROVED',
        user: 'user-owner',
        user_email: 'owner@apex.test',
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
        total_branches: 3,
        active_branches: 3,
        inactive_branches: 0,
        total_service_areas: 8,
        total_employees: 5,
        active_employees: 5,
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
      // 1. Executive Command Header Section
      expect(screen.getByTestId('section-command-header')).toBeInTheDocument();
      expect(screen.getAllByText('Phase 02 Live')[0]).toBeInTheDocument();

      // 2. Operational Metrics Section
      expect(screen.getByTestId('section-metrics')).toBeInTheDocument();
      expect(screen.getByText('Organization Operations KPI')).toBeInTheDocument();

      // 3. Process Flow Lifecycle Section
      expect(screen.getByTestId('section-process-flow')).toBeInTheDocument();
      expect(screen.getByText('End-to-End Operational Logistics Lifecycle')).toBeInTheDocument();

      // 4. Action Center Controls Section
      expect(screen.getByTestId('section-action-center')).toBeInTheDocument();
      expect(screen.getByText('Operational Command Center & Quick Controls')).toBeInTheDocument();

      // 5. Next Phase Roadmap Preview Section
      expect(screen.getByTestId('section-roadmap-preview')).toBeInTheDocument();
      expect(screen.getByText('Next Capability Unlock: Self-Service Consignment Booking')).toBeInTheDocument();
    });
  });

  it('renders process flow stepper with completed phase 01 and 02 stages', async () => {
    (orgApi.getMyMembershipsApi as any).mockResolvedValue([]);

    (dashboardApi.getDashboardSummaryApi as any).mockResolvedValue({
      role: 'PLATFORM_ADMIN',
      scope: 'GLOBAL',
      metrics: {
        total_organizations: 5,
        pending_organizations: 1,
        approved_organizations: 4,
        suspended_organizations: 0,
        rejected_organizations: 0,
        total_branches: 12,
        active_branches: 12,
        total_service_areas: 25,
        total_employees: 10,
        total_users: 20,
      },
    });

    renderWithAuth({
      id: 'admin-1',
      email: 'admin@logiflows.test',
      full_name: 'Admin',
      role: 'PLATFORM_ADMIN',
      is_active: true,
    });

    await waitFor(() => {
      const stepper = screen.getByTestId('process-flow-stepper');
      expect(stepper).toBeInTheDocument();

      // Check all 6 lifecycle stages are rendered
      expect(screen.getByText('Tenant Identity & Security')).toBeInTheDocument();
      expect(screen.getByText('Branch Hub Facilities')).toBeInTheDocument();
      expect(screen.getByText('Postal Coverage Zones')).toBeInTheDocument();
      expect(screen.getByText('Workforce & Role RBAC')).toBeInTheDocument();
      expect(screen.getByText('Consignment & Waybills')).toBeInTheDocument();
      expect(screen.getByText('Custody & Dispatch')).toBeInTheDocument();

      // Check completed count badge
      expect(screen.getByText('Phase 02: 4/4 Core Stages Live')).toBeInTheDocument();
    });
  });
});

