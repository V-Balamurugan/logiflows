import apiClient from '../lib/axios';
import { DashboardSummaryResponse } from '../types/dashboard';

export const getDashboardSummaryApi = async (organizationId?: string): Promise<DashboardSummaryResponse> => {
  const response = await apiClient.get<DashboardSummaryResponse>('/dashboard/summary/', {
    params: organizationId ? { organization_id: organizationId } : undefined,
  });
  return response.data;
};
