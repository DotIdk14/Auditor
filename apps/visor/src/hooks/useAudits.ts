import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { AuditFullResponse, Annotation } from '@auditor/shared-types';

export function useAuditFull(callId: string) {
  return useQuery({
    queryKey: ['audit', callId],
    queryFn: () => apiClient.get<AuditFullResponse>(`/visor/audits/${callId}/full`),
    enabled: !!callId && callId !== 'default',
  });
}

export function useSaveAnnotation(callId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'author' | 'role'>) =>
      apiClient.post(`/visor/audits/${callId}/annotations`, annotation),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit', callId] });
    },
  });
}
