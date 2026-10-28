import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import App from './App';
import * as api from './services/api';

vi.mock('./services/api');

describe('LogiFlows Phase 00 Shell Layout & Health Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchHealthStatus).mockResolvedValue({
      status: 'healthy',
      service: 'LogiFlows B2B Service Platform API',
      version: '0.1.0-phase-00',
      timestamp: '2026-10-28T12:00:00Z',
      environment: 'development',
      components: {
        database: {
          connected: true,
          engine: 'postgresql',
          latency_ms: 2.45,
          error: null,
        },
        api: {
          status: 'healthy',
          framework: 'Django REST Framework 3.15',
        },
      },
    });

    vi.mocked(api.fetchPlatformInfo).mockResolvedValue({
      platform: 'LogiFlows B2B Logistics & Supply Chain Platform',
      phase: 'Phase 00 - Foundation, Requirements & Docker Baseline',
      status: 'baseline_active',
      architecture: {
        multitenancy: 'Shared-database with tenant-isolation',
        database: 'postgresql',
        roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'LOGISTICS_MANAGER', 'DISPATCHER', 'DRIVER'],
        core_modules: ['Multi-Tenant Organization Management', 'RBAC'],
      },
    });
  });

  it('renders application brand, header, and sidebar navigation', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('LogiFlows')).toBeInTheDocument();
    expect(screen.getByText('LogiFlows Enterprise Logistics')).toBeInTheDocument();
    expect(screen.getByText('Phase 00: Foundation, Architecture & Docker Baseline')).toBeInTheDocument();
    expect(screen.getByText('Platform Overview')).toBeInTheDocument();
  });

  it('displays real-time infrastructure probe results and database status', async () => {
    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Live Infrastructure & Database Health')).toBeInTheDocument();
      expect(screen.getByText('Django REST API')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL Engine')).toBeInTheDocument();
      expect(screen.getByText('CONNECTED')).toBeInTheDocument();
    });
  });

  it('allows switching tenant context via header dropdown', async () => {
    await act(async () => {
      render(<App />);
    });

    const tenantSelect = screen.getByLabelText('Tenant:') as HTMLSelectElement;
    expect(tenantSelect.value).toBe('ten-global-logistics');

    act(() => {
      fireEvent.change(tenantSelect, { target: { value: 'ten-apex-freight' } });
    });

    expect(tenantSelect.value).toBe('ten-apex-freight');
    expect(screen.getByText('Apex Freightways Ltd')).toBeInTheDocument();
  });

  it('renders shipment lifecycle badges', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('DRAFT')).toBeInTheDocument();
    expect(screen.getByText('BOOKED')).toBeInTheDocument();
    expect(screen.getByText('IN TRANSIT')).toBeInTheDocument();
    expect(screen.getByText('DELIVERED')).toBeInTheDocument();
  });

  it('renders Phase 00 Acceptance Gate checklist table', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('Phase 00 Acceptance Gate Verification')).toBeInTheDocument();
    expect(screen.getByText('STORY-00-1')).toBeInTheDocument();
    expect(screen.getByText('STORY-00-2')).toBeInTheDocument();
    expect(screen.getByText('STORY-00-3')).toBeInTheDocument();
    expect(screen.getByText('STORY-00-4')).toBeInTheDocument();
    expect(screen.getByText('STORY-00-5')).toBeInTheDocument();
  });
});
