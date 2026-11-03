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
        db: 'ok',
        version: '1.0.0-phase-00',
        timestamp: '2026-10-30T12:00:00Z',
        environment: 'development',
        latency_ms: 1.8,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      dataUpdatedAt: Date.now(),
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
    expect(screen.getByText('Phase 02 Multi-Tenant Network Active')).toBeInTheDocument();
  });

  it('renders health/status page on /status with live DB telemetry', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/status']}>
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Development Status & Telemetry')).toBeInTheDocument();
    expect(screen.getByText('Django REST API')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL 16')).toBeInTheDocument();
    expect(screen.getByText('DB: OK')).toBeInTheDocument();
  });

  it('renders enterprise design system page on /design-system', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/design-system']}>
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Enterprise Design System & Tokens')).toBeInTheDocument();
    expect(screen.getByText('1. Color Palette Tokens')).toBeInTheDocument();
    expect(screen.getByText('2. Buttons & Actions')).toBeInTheDocument();
    expect(screen.getByText('3. Form Controls')).toBeInTheDocument();
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
