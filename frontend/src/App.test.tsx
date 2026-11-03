import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import App from './App';
import * as healthApi from './api/health';

vi.mock('./api/health');

describe('LogiFlows Root Application Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(healthApi.useHealthQuery).mockReturnValue({
      data: {
        status: 'healthy',
        service: 'LogiFlows B2B Service Platform API',
        version: '1.0.0-phase-00',
        timestamp: '2026-10-30T12:00:00Z',
        environment: 'development',
        components: {
          database: {
            connected: true,
            engine: 'postgresql',
            latency_ms: 2.15,
            error: null,
          },
          api: {
            status: 'healthy',
            framework: 'Django REST Framework 3.15',
          },
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      dataUpdatedAt: Date.now(),
    } as any);

    vi.mocked(healthApi.useReadinessQuery).mockReturnValue({
      data: {
        ready: true,
        status: 'ready',
        database: { connected: true, latency_ms: 1.8 },
        timestamp: '2026-10-30T12:00:00Z',
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(healthApi.usePlatformInfoQuery).mockReturnValue({
      data: {
        platform: 'LogiFlows B2B Logistics & Supply Chain Platform',
        phase: 'Phase 00 - Foundation, Requirements & Docker Baseline',
        status: 'baseline_active',
        architecture: {
          multitenancy: 'Shared-database with tenant-isolation',
          database: 'postgresql',
          roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'DISPATCHER'],
          planned_modules: ['Multi-Tenant Org Management', 'Fleet Tracking'],
        },
      },
    } as any);
  });

  it('renders application brand, header, and hero overview', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getAllByText('Logi')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Flows')[0]).toBeInTheDocument();
    expect(screen.getByText('Phase 02 Multi-Tenant Network Active')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Smart Postal &.*Logistics Management/i);
  });

  it('renders planned feature overview cards', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('Multi-Tenant Organization Management')).toBeInTheDocument();
    expect(screen.getByText('Carrier & Fleet Tracking')).toBeInTheDocument();
    expect(screen.getByText('QR-Based Parcel Custody')).toBeInTheDocument();
    expect(screen.getByText('AI Delivery Delay Prediction')).toBeInTheDocument();
  });

  it('renders navigation links to Status Page and Architecture Roadmap', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByRole('link', { name: /Platform Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Architecture & Roadmap/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dev Status/i })).toBeInTheDocument();
  });

  it('renders documentation links and technical specification metrics', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('Django 5.1')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL 16')).toBeInTheDocument();
    expect(screen.getByText('Docker Compose')).toBeInTheDocument();
    expect(screen.getAllByText(/Swagger API Docs/i)[0]).toBeInTheDocument();
  });
});
