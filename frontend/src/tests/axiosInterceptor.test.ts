import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { setAccessToken, getAccessToken, apiClient } from '../lib/axios';

describe('Axios Client & In-Memory Token Interceptor', () => {
  beforeEach(() => {
    setAccessToken(null);
    vi.clearAllMocks();
  });

  it('manages in-memory token without exposing to storage', () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken('sample-jwt-access-token');
    expect(getAccessToken()).toBe('sample-jwt-access-token');
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  it('attaches Bearer token in request headers when present in memory', async () => {
    setAccessToken('bearer-test-token-123');

    // Simulate interceptor request logic
    const config: any = {
      headers: {},
      url: '/users/me/',
    };

    // Grab request interceptor handler
    const requestHandler = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const modifiedConfig = requestHandler(config);

    expect(modifiedConfig.headers.Authorization).toBe('Bearer bearer-test-token-123');
  });

  it('does not attach Bearer token when in-memory token is null', () => {
    setAccessToken(null);
    const config: any = {
      headers: {},
      url: '/health/',
    };

    const requestHandler = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const modifiedConfig = requestHandler(config);

    expect(modifiedConfig.headers.Authorization).toBeUndefined();
  });
});
