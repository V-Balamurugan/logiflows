import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

/**
 * Environment-configured API Base URL.
 * Defaults to '/api/v1' for seamless Docker Nginx / Vite proxy resolution.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface ApiErrorResponse {
  status: string;
  error_code: string;
  message: string;
  details?: Record<string, unknown> | null;
}

/**
 * Centralized Axios client instance for LogiFlows.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Interceptor foundation: Authorization headers will be injected here in Phase 1
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for Global Error Handling Foundation
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      // Server returned a standard error response
      console.warn(`[API ${error.response.status}]`, error.response.data?.message || error.message);
    } else if (error.request) {
      // Network unreachable or CORS issue
      console.error('[API Network Error] Backend server unreachable at:', API_BASE_URL);
    } else {
      console.error('[API Configuration Error]', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
