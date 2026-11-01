import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EmployeeListPage from '../pages/employee/EmployeeListPage';
import EmployeeDetailPage from '../pages/employee/EmployeeDetailPage';
import * as employeeApi from '../api/employeeApi';
import * as branchApi from '../api/branchApi';
import * as orgApi from '../api/organizationApi';
import AuthContext from '../context/AuthContext';
import { TenantProvider } from '../context/TenantContext';

vi.mock('../api/employeeApi', () => ({
  getEmployeesApi: vi.fn(),
  getEmployeeApi: vi.fn(),
  createEmployeeApi: vi.fn(),
  updateEmployeeApi: vi.fn(),
  deactivateEmployeeApi: vi.fn(),
  activateEmployeeApi: vi.fn(),
}));

vi.mock('../api/branchApi', () => ({
  getBranchesApi: vi.fn(),
}));

vi.mock('../api/organizationApi', () => ({
  getMyMembershipsApi: vi.fn(),
}));

const mockAuthOwner = {
  user: {
    id: 'user-owner',
    email: 'owner@apex.test',
    full_name: 'Apex Owner',
    role: 'ORGANIZATION_OWNER' as const,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn(),
  refreshUser: vi.fn(),
};

const renderWithProviders = (ui: React.ReactElement, initialRoute = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthContext.Provider value={mockAuthOwner}>
          <TenantProvider>{ui}</TenantProvider>
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Module 6: Employees and RBAC Frontend Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (orgApi.getMyMembershipsApi as any).mockResolvedValue([
      {
        id: 'mem-1',
        organization: 'org-123',
        organization_name: 'Apex Logistics',
        organization_code: 'APEX-LOG',
        organization_status: 'APPROVED',
        user: 'user-owner',
        user_email: 'owner@apex.test',
        user_full_name: 'Apex Owner',
        role: 'ORGANIZATION_OWNER',
        is_active: true,
      },
    ]);
    (branchApi.getBranchesApi as any).mockResolvedValue({
      count: 1,
      results: [
        {
          id: 'branch-1',
          name: 'Delhi Central Hub',
          code: 'DEL-01',
          status: 'ACTIVE',
        },
      ],
    });
  });

  it('renders employee directory list with role badges and contact information', async () => {
    (employeeApi.getEmployeesApi as any).mockResolvedValue({
      count: 1,
      results: [
        {
          id: 'emp-1',
          organization_id: 'org-123',
          organization_name: 'Apex Logistics',
          organization_code: 'APEX-LOG',
          user_id: 'user-emp-1',
          email: 'rajesh.kumar@apex.test',
          first_name: 'Rajesh',
          last_name: 'Kumar',
          full_name: 'Rajesh Kumar',
          role: 'EMPLOYEE',
          branch_id: 'branch-1',
          branch_name: 'Delhi Central Hub',
          branch_code: 'DEL-01',
          employee_code: 'EMP-DEL-001',
          designation: 'Senior Route Courier',
          phone: '+91 9988776655',
          status: 'ACTIVE',
          is_active: true,
          joined_date: '2026-02-15T00:00:00Z',
          temporary_password_active: false,
          created_at: '2026-02-15T00:00:00Z',
          updated_at: '2026-02-15T00:00:00Z',
        },
      ],
    });

    renderWithProviders(<EmployeeListPage />);

    await waitFor(() => {
      expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      expect(screen.getByText('rajesh.kumar@apex.test')).toBeInTheDocument();
      expect(screen.getByText('ID: EMP-DEL-001')).toBeInTheDocument();
      expect(screen.getByText('Senior Route Courier')).toBeInTheDocument();
      expect(screen.getByText('Delhi Central Hub')).toBeInTheDocument();
    });
  });

  it('allows owner to open modal and provision a new employee', async () => {
    (employeeApi.getEmployeesApi as any).mockResolvedValue({
      count: 0,
      results: [],
    });
    (employeeApi.createEmployeeApi as any).mockResolvedValue({
      id: 'emp-new',
      full_name: 'Pooja Sharma',
      employee_code: 'EMP-DEL-002',
    });

    renderWithProviders(<EmployeeListPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Employee/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Add Employee/i }));

    expect(screen.getByText('Provision New Employee')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Jane'), 'Pooja');
    await userEvent.type(screen.getByPlaceholderText('Doe'), 'Sharma');
    await userEvent.type(screen.getByPlaceholderText('jane.doe@company.com'), 'pooja.sharma@apex.test');
    await userEvent.type(screen.getByPlaceholderText('EMP-001'), 'EMP-DEL-002');
    await userEvent.type(screen.getByPlaceholderText('Senior Dispatch Specialist'), 'Operations Lead');

    await userEvent.click(screen.getByRole('button', { name: /^Provision Employee$/i }));

    await waitFor(() => {
      expect(employeeApi.createEmployeeApi).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'Pooja',
          last_name: 'Sharma',
          email: 'pooja.sharma@apex.test',
          employee_code: 'EMP-DEL-002',
          role: 'EMPLOYEE',
          designation: 'Operations Lead',
        })
      );
    });
  });

  it('renders employee detail page and handles deactivation toggle', async () => {
    (employeeApi.getEmployeeApi as any).mockResolvedValue({
      id: 'emp-1',
      organization_id: 'org-123',
      organization_name: 'Apex Logistics',
      organization_code: 'APEX-LOG',
      user_id: 'user-emp-1',
      email: 'rajesh.kumar@apex.test',
      first_name: 'Rajesh',
      last_name: 'Kumar',
      full_name: 'Rajesh Kumar',
      role: 'EMPLOYEE',
      branch_id: 'branch-1',
      branch_name: 'Delhi Central Hub',
      branch_code: 'DEL-01',
      employee_code: 'EMP-DEL-001',
      designation: 'Senior Route Courier',
      phone: '+91 9988776655',
      status: 'ACTIVE',
      is_active: true,
      joined_date: '2026-02-15T00:00:00Z',
      temporary_password_active: false,
      created_at: '2026-02-15T00:00:00Z',
      updated_at: '2026-02-15T00:00:00Z',
    });

    (employeeApi.deactivateEmployeeApi as any).mockResolvedValue({
      id: 'emp-1',
      status: 'ACTIVE',
      is_active: false,
    });

    renderWithProviders(
      <Routes>
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
      </Routes>,
      '/employees/emp-1'
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Rajesh Kumar' })).toBeInTheDocument();
      expect(screen.getByText(/EMP-DEL-001/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Deactivate Account/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Deactivate Account/i }));

    await waitFor(() => {
      expect(employeeApi.deactivateEmployeeApi).toHaveBeenCalledWith('emp-1');
    });
  });
});
