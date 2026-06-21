import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'crm_token';

/**
 * Read the current JWT from localStorage.
 * Returns `null` when no token exists (e.g. first visit, logged out).
 */
function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // localStorage may be disabled in some environments
    return null;
  }
}

/**
 * Persist a JWT to localStorage.
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove the JWT from localStorage.
 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Allow the browser to send cookies for same-origin requests when using a
  // Vite proxy (BASE_URL is empty), otherwise they are sent cross-origin only
  // when the server explicitly allows it (withCredentials is opt-in).
  withCredentials: false,
});

// ---------------------------------------------------------------------------
// Request interceptor – attach Authorization header
// ---------------------------------------------------------------------------

instance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor – handle 401 globally
// ---------------------------------------------------------------------------

instance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearToken();
      // Avoid redirect loops – only redirect if we are not already on /login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ---------------------------------------------------------------------------
// Typed convenience helpers
// ---------------------------------------------------------------------------

const api = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return instance.get<T>(url, config);
  },

  post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return instance.post<T>(url, data, config);
  },

  put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return instance.put<T>(url, data, config);
  },

  patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return instance.patch<T>(url, data, config);
  },

  delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return instance.delete<T>(url, config);
  },
};

export default api;
export { instance as axiosInstance };
