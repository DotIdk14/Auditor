import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../auth/authStore';

// ---------------------------------------------------------------------------
// PUBLIC API — Sin interceptores de auth. Usada SOLO para login y refresh.
// Rompe la dependencia circular: authStore → api → authStore → ...
// ---------------------------------------------------------------------------
export const publicApi = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ---------------------------------------------------------------------------
// PRIVATE API — Con interceptores de auth (request: añade token, response: 401)
// ---------------------------------------------------------------------------
export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Request interceptor: adjunta JWT a todas las salidas ────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Refresh queue management ────────────────────────────────────────────
// Evita que múltiples 401 concurrentes disparen N refrescos simultáneos.
interface QueueItem {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  config: InternalAxiosRequestConfig;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, newToken: string | null = null): void {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else if (newToken && config.headers) {
      config.headers.Authorization = `Bearer ${newToken}`;
      resolve(api(config)); // Reintentar con api (preserva baseURL, timeout, etc.)
    }
  });
  failedQueue = [];
}

// ── Response interceptor: 401 → refresh → retry ────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;
    if (!originalRequest) return Promise.reject(error);

    // Solo intentamos refresh en 401 que no sean del propio refresh
    const isRefreshRequest = originalRequest.url?.includes('/refresh-token');
    if (error.response?.status !== 401 || isRefreshRequest) {
      return Promise.reject(error);
    }

    const authState = useAuthStore.getState();

    // Si no hay token, no tiene sentido refrescar
    if (!authState.accessToken) {
      return Promise.reject(error);
    }

    // ── Si ya hay un refresh en curso, encolamos ──
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    // ── Iniciamos refresh ──
    isRefreshing = true;

    try {
      // Usamos publicApi para EVITAR que el refresh lance otro 401 → loop infinito
      const { data } = await publicApi.post<{
        success: boolean;
        token: string;
        user: {
          sub: string;
          email: string;
          displayName: string;
          role: string;
          areaId?: string | null;
          teamId?: string | null;
        };
      }>('/refresh-token', { token: authState.accessToken });

      if (!data.success || !data.token) {
        throw new Error('Refresh token response invalid');
      }

      // Actualizar store con el nuevo token
      useAuthStore.setState({
        accessToken: data.token,
        user: {
          sub: data.user.sub,
          email: data.user.email,
          displayName: data.user.displayName,
          role: data.user.role as any,
          areaId: data.user.areaId ?? null,
          teamId: data.user.teamId ?? null,
          hierarchy: {
            areaId: data.user.areaId ?? null,
            teamId: data.user.teamId ?? null,
          },
          permissions: [],
        },
      });

      // Procesar cola y reintentar la petición original
      const newToken = data.token;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      processQueue(null, newToken);

      return api(originalRequest);
    } catch (refreshError) {
      // Refresh falló → logout y rechazar todas las cola
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ── Typed API helpers ───────────────────────────────────────────────────
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
