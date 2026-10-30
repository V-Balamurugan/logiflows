import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Standard API Error Envelope contract from Django backend
 */
export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Injects authorization token when available (Phase 1 preparation)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Phase 1: Retrieve token from memory or state
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Normalizes error envelopes
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorEnvelope>) => {
    if (error.response?.data?.error) {
      console.warn(`[API ${error.response.status}] ${error.response.data.error.code}: ${error.response.data.error.message}`);
    } else {
      console.warn(`[API Network Error] ${error.message}`);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
