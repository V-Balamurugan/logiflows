import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from '../app/routes';
import * as healthApi from '../api/health';

vi.mock('../api/health');

describe('Frontend Navigation & Routing Test Suite', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    vi.mocked(healthApi.useHealthQuery).mockReturnValue({
      data: {
        status: 'healthy',
        service: 'LogiFlows B2B Service Platform API',
        version: '1.0.0-phase-00',
        timestamp: '2026-10-30T12:00:00Z',
        environment: 'development',
        components: {
          database: { connected: true, engine: 'postgresql', latency_ms: 1.5, error: null },
          api: { status: 'healthy', framework: 'Django REST Framework 3.15' },
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      dataUpdatedAt: Date.now(),
    } as any);

    vi.mocked(healthApi.useReadinessQuery).mockReturnValue({
      data: { ready: true, status: 'ready', database: { connected: true, latency_ms: 1.2 } },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(healthApi.usePlatformInfoQuery).mockReturnValue({
      data: {
        platform: 'LogiFlows B2B Logistics & Supply Chain Platform',
        phase: 'Phase 00',
        status: 'baseline_active',
        architecture: { multitenancy: 'Shared', database: 'postgresql', roles: [], planned_modules: [] },
      },
    } as any);
  });

  it('renders landing page on root route /', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Smart Postal &.*Logistics Management/i);
    expect(screen.getByText('Phase 00 Foundation Active')).toBeInTheDocument();
    expect(screen.getByText('Multi-Tenant Organization Management')).toBeInTheDocument();
  });

  it('renders development status page on /app/status', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/app/status']}>
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Development Status & Telemetry')).toBeInTheDocument();
    expect(screen.getByText('Django REST API')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL 16')).toBeInTheDocument();
    expect(screen.getByText('App Environment')).toBeInTheDocument();
  });

  it('renders architecture page on /app/architecture', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/app/architecture']}>
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('System Architecture & 12-Phase Roadmap')).toBeInTheDocument();
    expect(screen.getByText('Django Backend Layer')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL 16 Persistence')).toBeInTheDocument();
  });

  it('renders 404 NotFound page on unknown route', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/non-existent-random-route']}>
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });
});
