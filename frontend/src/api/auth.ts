import apiClient from '../lib/axios';
import {
  User,
  UserProfile,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  PasswordChangeRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  UserUpdateRequest,
} from '../types/auth';

export const registerApi = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>('/auth/register/', data);
  return response.data;
};

export const activateApi = async (token: string): Promise<{ message: string; email: string }> => {
  const response = await apiClient.post<{ message: string; email: string }>('/auth/activate/', { token });
  return response.data;
};

export const loginApi = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login/', credentials);
  return response.data;
};

export const refreshTokenApi = async (): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/refresh/');
  return response.data;
};

export const logoutApi = async (): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/auth/logout/');
  return response.data;
};

export const changePasswordApi = async (data: PasswordChangeRequest): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/auth/password/change/', data);
  return response.data;
};

export const requestPasswordResetApi = async (data: PasswordResetRequest): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/auth/password/reset/request/', data);
  return response.data;
};

export const confirmPasswordResetApi = async (data: PasswordResetConfirmRequest): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/auth/password/reset/confirm/', data);
  return response.data;
};

export const getMeApi = async (): Promise<User> => {
  const response = await apiClient.get<User>('/users/me/');
  return response.data;
};

export const updateMeApi = async (data: UserUpdateRequest): Promise<User> => {
  const response = await apiClient.patch<User>('/users/me/', data);
  return response.data;
};

export const getProfileApi = async (): Promise<UserProfile> => {
  const response = await apiClient.get<UserProfile>('/users/me/profile/');
  return response.data;
};
