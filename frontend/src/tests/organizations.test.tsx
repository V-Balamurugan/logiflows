import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RegisterOrganizationPage from '../pages/organization/RegisterOrganizationPage';
import PlatformAdminOrgQueuePage from '../pages/admin/PlatformAdminOrgQueuePage';
import * as orgApi from '../api/organizationApi';
import AuthContext from '../context/AuthContext';
import { TenantProvider } from '../context/TenantContext';

// Mock organization API
vi.mock('../api/organizationApi', () => ({
  registerOrganizationApi: vi.fn(),
  getOrganizationsApi: vi.fn(),
  approveOrganizationApi: vi.fn(),
  rejectOrganizationApi: vi.fn(),
  suspendOrganizationApi: vi.fn(),
  getMyMembershipsApi: vi.fn(),
}));

const mockAuthContext = {
  user: {
    id: 'user-123',
    email: 'admin@logiflows.test',
    full_name: 'Platform Admin',
    role: 'PLATFORM_ADMIN' as const,
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

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <TenantProvider>{ui}</TenantProvider>
        </AuthContext.Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Module 1: Organization Frontend Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (orgApi.getMyMembershipsApi as any).mockResolvedValue([]);
  });

  it('renders organization registration form with all required fields', () => {
    renderWithProviders(<RegisterOrganizationPage />);

    expect(screen.getByText('Register Organization')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Apex Logistics')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. APEX-IND')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ops@company.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Application/i })).toBeInTheDocument();
  });

  it('submits organization registration form successfully', async () => {
    (orgApi.registerOrganizationApi as any).mockResolvedValue({
      message: 'Submitted',
      organization: {
        id: 'org-456',
        name: 'Apex Courier',
        code: 'APEX-COURIER',
        status: 'PENDING',
      },
    });

    renderWithProviders(<RegisterOrganizationPage />);

    await userEvent.type(screen.getByPlaceholderText('e.g. Apex Logistics'), 'Apex Courier');
    await userEvent.type(
      screen.getByPlaceholderText('e.g. Apex Logistics Private Limited'),
      'Apex Courier Pvt Ltd'
    );
    await userEvent.type(screen.getByPlaceholderText('e.g. APEX-IND'), 'APEX-COURIER');
    await userEvent.type(screen.getByPlaceholderText('ops@company.com'), 'ops@apex.test');

    await userEvent.click(screen.getByRole('button', { name: /Submit Application/i }));

    await waitFor(() => {
      expect(orgApi.registerOrganizationApi).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Apex Courier',
          legal_name: 'Apex Courier Pvt Ltd',
          code: 'APEX-COURIER',
          contact_email: 'ops@apex.test',
        })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Registration Submitted Successfully!/i)
      ).toBeInTheDocument();
    });
  });

  it('renders platform admin approval queue and lists organizations', async () => {
    (orgApi.getOrganizationsApi as any).mockResolvedValue({
      count: 1,
      results: [
        {
          id: 'org-101',
          name: 'Global Freight Hub',
          legal_name: 'Global Freight Hub Inc',
          code: 'GFH-IND',
          status: 'PENDING',
          contact_email: 'contact@gfh.test',
          created_at: '2026-11-01T12:00:00Z',
          settings: {},
        },
      ],
    });

    renderWithProviders(<PlatformAdminOrgQueuePage />);

    expect(screen.getByText('Platform Tenant Queue')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Global Freight Hub')).toBeInTheDocument();
      expect(screen.getByText('GFH-IND')).toBeInTheDocument();
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Approve$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Reject$/i })).toBeInTheDocument();
    });
  });

  it('executes organization approval mutation when Approve button is clicked', async () => {
    (orgApi.getOrganizationsApi as any).mockResolvedValue({
      count: 1,
      results: [
        {
          id: 'org-101',
          name: 'Global Freight Hub',
          legal_name: 'Global Freight Hub Inc',
          code: 'GFH-IND',
          status: 'PENDING',
          contact_email: 'contact@gfh.test',
          created_at: '2026-11-01T12:00:00Z',
          settings: {},
        },
      ],
    });
    (orgApi.approveOrganizationApi as any).mockResolvedValue({
      message: 'Approved',
      organization: { id: 'org-101', code: 'GFH-IND', status: 'APPROVED' },
    });

    renderWithProviders(<PlatformAdminOrgQueuePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Approve$/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /^Approve$/i }));

    await waitFor(() => {
      expect(orgApi.approveOrganizationApi).toHaveBeenCalledWith('org-101');
    });
  });
});
