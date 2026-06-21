import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { UnifiedDashboard, SalesKPIs, QAKPIs } from '@auditor/shared-types';
import { useAuthStore } from '../auth/authStore';

export function useDashboard() {
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'area_manager';
  
  return useQuery({
    queryKey: ['dashboard', isAdmin ? 'unified' : 'my'],
    queryFn: () => {
      if (isAdmin) {
        return apiClient.get<UnifiedDashboard>('/dashboard/unified');
      }
      return apiClient.get<{ sales: SalesKPIs; qa: QAKPIs }>('/dashboard/my');
    },
  });
}
