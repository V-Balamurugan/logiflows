import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient, { API_BASE_URL } from '../api/client';
import { fetchHealth, fetchReadiness, fetchPlatformInfo } from '../api/health';

describe('API Client & Endpoints Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('configures default API base URL correctly', () => {
    expect(API_BASE_URL).toBeDefined();
    expect(typeof API_BASE_URL).toBe('string');
  });

  it('fetchHealth calls /health/ on apiClient', async () => {
    const mockHealthData = {
      status: 'healthy',
      service: 'LogiFlows API',
      version: '1.0.0',
      timestamp: '2026-10-30T00:00:00Z',
      environment: 'development',
      components: {
        database: { connected: true, engine: 'postgresql', latency_ms: 1.0, error: null },
        api: { status: 'healthy', framework: 'Django REST Framework' },
      },
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockHealthData });

    const result = await fetchHealth();
    expect(getSpy).toHaveBeenCalledWith('/health/');
    expect(result.status).toBe('healthy');
    expect(result.components?.database.connected).toBe(true);
  });

  it('fetchReadiness calls /readiness/ on apiClient', async () => {
    const mockReadinessData = {
      ready: true,
      status: 'ready',
      timestamp: '2026-10-30T00:00:00Z',
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockReadinessData });

    const result = await fetchReadiness();
    expect(getSpy).toHaveBeenCalledWith('/readiness/');
    expect(result.ready).toBe(true);
  });

  it('fetchPlatformInfo calls /platform-info/ on apiClient', async () => {
    const mockPlatformData = {
      platform: 'LogiFlows B2B Logistics Platform',
      phase: 'Phase 00',
      status: 'baseline_active',
      architecture: { multitenancy: 'Shared', database: 'postgresql', roles: [], planned_modules: [] },
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockPlatformData });

    const result = await fetchPlatformInfo();
    expect(getSpy).toHaveBeenCalledWith('/platform-info/');
    expect(result.platform).toContain('LogiFlows');
  });
});
