import apiClient from '../lib/axios';
import {
  Organization,
  OrganizationMembership,
  RegisterOrganizationInput,
  UpdateOrganizationInput,
  ActionReasonInput,
  PaginatedResponse,
} from '../types/organization';

export const registerOrganizationApi = async (
  data: RegisterOrganizationInput
): Promise<{ message: string; organization: Organization }> => {
  const response = await apiClient.post<{ message: string; organization: Organization }>(
    '/organizations/',
    data
  );
  return response.data;
};

export const getOrganizationsApi = async (params?: {
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Organization>> => {
  const response = await apiClient.get<PaginatedResponse<Organization>>('/organizations/', {
    params,
  });
  return response.data;
};

export const getOrganizationApi = async (id: string): Promise<Organization> => {
  const response = await apiClient.get<Organization>(`/organizations/${id}/`);
  return response.data;
};

export const updateOrganizationApi = async (
  id: string,
  data: UpdateOrganizationInput
): Promise<Organization> => {
  const response = await apiClient.patch<Organization>(`/organizations/${id}/`, data);
  return response.data;
};

export const approveOrganizationApi = async (
  id: string
): Promise<{ message: string; organization: Organization }> => {
  const response = await apiClient.post<{ message: string; organization: Organization }>(
    `/organizations/${id}/approve/`
  );
  return response.data;
};

export const rejectOrganizationApi = async (
  id: string,
  reason: string
): Promise<{ message: string; organization: Organization }> => {
  const response = await apiClient.post<{ message: string; organization: Organization }>(
    `/organizations/${id}/reject/`,
    { reason }
  );
  return response.data;
};

export const suspendOrganizationApi = async (
  id: string,
  reason: string
): Promise<{ message: string; organization: Organization }> => {
  const response = await apiClient.post<{ message: string; organization: Organization }>(
    `/organizations/${id}/suspend/`,
    { reason }
  );
  return response.data;
};

export const getMyMembershipsApi = async (): Promise<OrganizationMembership[]> => {
  const response = await apiClient.get<OrganizationMembership[]>('/memberships/me/');
  return response.data;
};
