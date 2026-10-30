import { useQuery } from '@tanstack/react-query';
import apiClient from './client';
import { HealthResponse, ReadinessResponse, PlatformInfoResponse } from '../types';

/**
 * Fetch application liveness & health status.
 */
export const fetchHealth = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/health/');
  return response.data;
};

/**
 * Fetch database readiness status.
 */
export const fetchReadiness = async (): Promise<ReadinessResponse> => {
  const response = await apiClient.get<ReadinessResponse>('/readiness/');
  return response.data;
};

/**
 * Fetch platform capability and architectural metadata.
 */
export const fetchPlatformInfo = async (): Promise<PlatformInfoResponse> => {
  const response = await apiClient.get<PlatformInfoResponse>('/platform-info/');
  return response.data;
};

/**
 * TanStack Query Hook for Health Telemetry.
 */
export const useHealthQuery = (refetchInterval = 10000) => {
  return useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval,
    retry: 2,
  });
};

/**
 * TanStack Query Hook for Database Readiness.
 */
export const useReadinessQuery = (refetchInterval = 10000) => {
  return useQuery({
    queryKey: ['readiness'],
    queryFn: fetchReadiness,
    refetchInterval,
    retry: 2,
  });
};

/**
 * TanStack Query Hook for Platform Baseline Info.
 */
export const usePlatformInfoQuery = () => {
  return useQuery({
    queryKey: ['platform-info'],
    queryFn: fetchPlatformInfo,
    staleTime: 60000,
  });
};
