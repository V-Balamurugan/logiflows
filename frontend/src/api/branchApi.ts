import apiClient from '../lib/axios';
import {
  Branch,
  ServiceArea,
  CreateBranchInput,
  UpdateBranchInput,
  ServiceabilityResponse,
} from '../types/branch';
import { PaginatedResponse } from '../types/organization';

export const getBranchesApi = async (params?: {
  status?: string;
  city?: string;
  pincode?: string;
  search?: string;
  organization_id?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Branch>> => {
  const response = await apiClient.get<PaginatedResponse<Branch>>('/branches/', { params });
  return response.data;
};

export const getBranchApi = async (id: string): Promise<Branch> => {
  const response = await apiClient.get<Branch>(`/branches/${id}/`);
  return response.data;
};

export const createBranchApi = async (data: CreateBranchInput): Promise<Branch> => {
  const response = await apiClient.post<Branch>('/branches/', data);
  return response.data;
};

export const updateBranchApi = async (id: string, data: UpdateBranchInput): Promise<Branch> => {
  const response = await apiClient.patch<Branch>(`/branches/${id}/`, data);
  return response.data;
};

export const deactivateBranchApi = async (id: string): Promise<Branch> => {
  const response = await apiClient.post<Branch>(`/branches/${id}/deactivate/`);
  return response.data;
};

export const activateBranchApi = async (id: string): Promise<Branch> => {
  const response = await apiClient.post<Branch>(`/branches/${id}/activate/`);
  return response.data;
};

export const getServiceAreasApi = async (branchId: string): Promise<ServiceArea[]> => {
  const response = await apiClient.get<ServiceArea[]>(`/branches/${branchId}/service-areas/`);
  return response.data;
};

export const addServiceAreaApi = async (
  branchId: string,
  data: { postal_code: string; is_serviceable?: boolean }
): Promise<ServiceArea> => {
  const response = await apiClient.post<ServiceArea>(`/branches/${branchId}/service-areas/`, data);
  return response.data;
};

export const deleteServiceAreaApi = async (branchId: string, areaId: string): Promise<void> => {
  await apiClient.delete(`/branches/${branchId}/service-areas/${areaId}/`);
};

export const checkServiceabilityApi = async (
  postalCode: string,
  organizationId?: string
): Promise<ServiceabilityResponse> => {
  const response = await apiClient.get<ServiceabilityResponse>('/serviceability/', {
    params: {
      postal_code: postalCode,
      organization_id: organizationId,
    },
  });
  return response.data;
};
