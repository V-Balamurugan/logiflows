import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BranchListPage from '../pages/branch/BranchListPage';
import BranchDetailPage from '../pages/branch/BranchDetailPage';
import ServiceabilityCheckerPage from '../pages/branch/ServiceabilityCheckerPage';
import * as branchApi from '../api/branchApi';
import * as orgApi from '../api/organizationApi';
import AuthContext from '../context/AuthContext';
import { TenantProvider } from '../context/TenantContext';

vi.mock('../api/branchApi', () => ({
  getBranchesApi: vi.fn(),
  getBranchApi: vi.fn(),
  createBranchApi: vi.fn(),
  updateBranchApi: vi.fn(),
  deactivateBranchApi: vi.fn(),
  activateBranchApi: vi.fn(),
  getServiceAreasApi: vi.fn(),
  addServiceAreaApi: vi.fn(),
  deleteServiceAreaApi: vi.fn(),
  checkServiceabilityApi: vi.fn(),
}));

vi.mock('../api/organizationApi', () => ({
  getMyMembershipsApi: vi.fn(),
  registerOrganizationApi: vi.fn(),
  getOrganizationsApi: vi.fn(),
  approveOrganizationApi: vi.fn(),
  rejectOrganizationApi: vi.fn(),
  suspendOrganizationApi: vi.fn(),
}));

const mockAuthAdmin = {
  user: {
    id: 'user-owner',
    email: 'owner@logiflows.test',
    full_name: 'Org Owner',
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
        <AuthContext.Provider value={mockAuthAdmin}>
          <TenantProvider>{ui}</TenantProvider>
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Module 4 & 5: Branches and Service Areas Frontend Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (orgApi.getMyMembershipsApi as any).mockResolvedValue([
      {
        id: 'mem-1',
        organization: 'org-123',
        organization_name: 'Apex Express',
        organization_code: 'APEX-EXP',
        organization_status: 'APPROVED',
        user: 'user-owner',
        user_email: 'owner@logiflows.test',
        user_full_name: 'Org Owner',
        role: 'ORGANIZATION_OWNER',
        is_active: true,
      },
    ]);
  });

  it('renders branch list with hubs and service area badges', async () => {
    (branchApi.getBranchesApi as any).mockResolvedValue({
      count: 1,
      results: [
        {
          id: 'branch-1',
          organization: 'org-123',
          organization_code: 'APEX-EXP',
          organization_name: 'Apex Express',
          code: 'DEL-NORTH',
          name: 'Delhi North Hub',
          address: 'Kashmere Gate, Delhi',
          pincode: '110006',
          city: 'Delhi',
          state: 'Delhi',
          status: 'ACTIVE',
          manager_name: 'Rajesh Kumar',
          service_area_count: 5,
        },
      ],
    });

    renderWithProviders(<BranchListPage />);

    expect(screen.getByText('Postal & Logistics Branches')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Delhi North Hub')).toBeInTheDocument();
      expect(screen.getByText('DEL-NORTH')).toBeInTheDocument();
      expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('renders branch detail with service areas and handles adding postal codes', async () => {
    (branchApi.getBranchApi as any).mockResolvedValue({
      id: 'branch-1',
      organization: 'org-123',
      organization_code: 'APEX-EXP',
      organization_name: 'Apex Express',
      code: 'DEL-NORTH',
      name: 'Delhi North Hub',
      address: 'Kashmere Gate, Delhi',
      pincode: '110006',
      city: 'Delhi',
      state: 'Delhi',
      status: 'ACTIVE',
      manager_name: 'Rajesh Kumar',
    });

    (branchApi.getServiceAreasApi as any).mockResolvedValue([
      {
        id: 'sa-1',
        branch: 'branch-1',
        branch_name: 'Delhi North Hub',
        branch_code: 'DEL-NORTH',
        postal_code: '110006',
        is_serviceable: true,
      },
    ]);

    renderWithProviders(
      <Routes>
        <Route path="/branches/:id" element={<BranchDetailPage />} />
      </Routes>,
      '/branches/branch-1'
    );

    await waitFor(() => {
      expect(screen.getByText('Delhi North Hub')).toBeInTheDocument();
      expect(screen.getByText('110006')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Postal Code/i })).toBeInTheDocument();
    });
  });

  it('renders serviceability checker and returns positive result for served postal code', async () => {
    (branchApi.checkServiceabilityApi as any).mockResolvedValue({
      postal_code: '110006',
      is_serviceable: true,
      match_count: 1,
      providers: [
        {
          postal_code: '110006',
          is_serviceable: true,
          organization: { id: 'org-1', name: 'Apex Express', code: 'APEX-EXP' },
          branch: { id: 'br-1', name: 'Delhi North Hub', code: 'DEL-NORTH', city: 'Delhi', state: 'Delhi' },
        },
      ],
    });

    renderWithProviders(<ServiceabilityCheckerPage />);

    expect(screen.getByText('Delivery Serviceability Checker')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Enter postal code/i);
    await userEvent.type(input, '110006');
    await userEvent.click(screen.getByRole('button', { name: /Check/i }));

    await waitFor(() => {
      expect(screen.getByText(/Postal Code 110006 is Serviceable!/i)).toBeInTheDocument();
      expect(screen.getByText('Delhi North Hub')).toBeInTheDocument();
    });
  });
});
