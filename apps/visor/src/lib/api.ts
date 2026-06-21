import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../auth/authStore';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor - adds JWT token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handles 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore.getState();
      if (authStore.accessToken) {
        try {
          await authStore.refresh();
          // Retry original request with new token
          const config = error.config;
          if (config) {
            config.headers.Authorization = `Bearer ${useAuthStore.getState().accessToken}`;
            return axios(config);
          }
        } catch {
          authStore.logout();
        }
      }
    }
    return Promise.reject(error);
  }
);

// Typed API helpers
export const apiClient = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    api.get<T>(url, { params }).then(r => r.data),

  post: <T>(url: string, data?: unknown) =>
    api.post<T>(url, data).then(r => r.data),

  patch: <T>(url: string, data?: unknown) =>
    api.patch<T>(url, data).then(r => r.data),

  delete: <T>(url: string) =>
    api.delete<T>(url).then(r => r.data),
};
