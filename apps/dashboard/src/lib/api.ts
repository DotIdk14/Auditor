import type { UnifiedDashboard, CallItem, PaginatedResponse } from '@auditor/shared-types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getToken(): string | null {
  return localStorage.getItem('utel_supervisor_token');
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${url}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

export const dashboardApi = {
  /** Unified dashboard KPIs (admin/manager/coordinator/supervisor) */
  getUnified: () => request<UnifiedDashboard>('/api/dashboard/unified'),

  /** Personal dashboard KPIs (agent) */
  getMyDashboard: () => request<UnifiedDashboard>('/api/dashboard/my'),

  /** Sales KPIs only */
  getSalesKPIs: () => request<UnifiedDashboard['sales']>('/api/dashboard/sales'),

  /** QA KPIs only */
  getQAKPIs: () => request<UnifiedDashboard['qa']>('/api/dashboard/qa'),

  /** Calls/audits for the kanban board */
  getCalls: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return request<CallItem[]>(`/api/visor/calls${query ? `?${query}` : ''}`);
  },

  /** Contacts list */
  getContacts: (params?: { search?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    const query = qs.toString();
    return request<PaginatedResponse<any>>(`/api/contacts${query ? `?${query}` : ''}`);
  },
};
