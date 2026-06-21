import api from '@/api/client';
import type {
  QAKPIs,
  SalesKPIs,
  UnifiedDashboard,
} from '@/api/types';

/**
 * Fetch sales KPIs for the current user's scope.
 */
export async function getSalesKPIs(): Promise<SalesKPIs> {
  const res = await api.get<SalesKPIs>('/api/dashboard/sales');
  return res.data;
}

/**
 * Fetch QA KPIs for the current user's scope.
 */
export async function getQAKPIs(): Promise<QAKPIs> {
  const res = await api.get<QAKPIs>('/api/dashboard/qa');
  return res.data;
}

/**
 * Fetch both Sales and QA KPIs (unified dashboard).
 * For admin, area_manager, coordinator, and supervisor roles.
 */
export async function getUnifiedDashboard(): Promise<UnifiedDashboard> {
  const res = await api.get<UnifiedDashboard>('/api/dashboard/unified');
  return res.data;
}

/**
 * Fetch personal dashboard (for agents).
 */
export async function getMyDashboard(): Promise<UnifiedDashboard> {
  const res = await api.get<UnifiedDashboard>('/api/dashboard/my');
  return res.data;
}
