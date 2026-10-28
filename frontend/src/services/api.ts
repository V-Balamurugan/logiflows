import { HealthStatus, PlatformInfo } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export async function fetchHealthStatus(): Promise<HealthStatus> {
  const endpoint = `${BASE_URL.replace(/\/$/, '')}/health/`;
  try {
    const res = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      if (errorData && errorData.components) {
        return errorData;
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    return {
      status: 'error',
      service: 'LogiFlows B2B Service Platform API',
      version: '0.1.0-phase-00',
      timestamp: new Date().toISOString(),
      environment: 'disconnected',
      components: {
        database: {
          connected: false,
          engine: 'unknown',
          latency_ms: null,
          error: err.message || 'Failed to reach API endpoint',
        },
        api: {
          status: 'unreachable',
          framework: 'Django REST Framework',
        },
      },
    };
  }
}

export async function fetchPlatformInfo(): Promise<PlatformInfo | null> {
  const endpoint = `${BASE_URL.replace(/\/$/, '')}/platform-info/`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
