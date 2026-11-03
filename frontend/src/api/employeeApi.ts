import apiClient from '../lib/axios';
import {
  Employee,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from '../types/employee';
import { PaginatedResponse } from '../types/organization';

export const getEmployeesApi = async (params?: {
  status?: string;
  role?: string;
  branch_id?: string;
  search?: string;
  organization_id?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Employee>> => {
  const response = await apiClient.get<PaginatedResponse<Employee>>('/employees/', { params });
  return response.data;
};

export const getEmployeeApi = async (id: string): Promise<Employee> => {
  const response = await apiClient.get<Employee>(`/employees/${id}/`);
  return response.data;
};

export const createEmployeeApi = async (data: CreateEmployeeInput): Promise<Employee> => {
  const response = await apiClient.post<Employee>('/employees/', data);
  return response.data;
};

export const updateEmployeeApi = async (id: string, data: UpdateEmployeeInput): Promise<Employee> => {
  const response = await apiClient.patch<Employee>(`/employees/${id}/`, data);
  return response.data;
};

export const deactivateEmployeeApi = async (id: string): Promise<Employee> => {
  const response = await apiClient.post<Employee>(`/employees/${id}/deactivate/`);
  return response.data;
};

export const activateEmployeeApi = async (id: string): Promise<Employee> => {
  const response = await apiClient.post<Employee>(`/employees/${id}/activate/`);
  return response.data;
};

