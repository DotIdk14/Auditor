import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { useAuthStore } from '../../../auth/authStore';
import type { LearnedSpeech, LearningStatus, TopCallRef } from '../types';

export function useLearnedSpeeches() {
  const accessToken = useAuthStore(s => s.accessToken);
  return useQuery({
    queryKey: ['learned-speeches'],
    queryFn: () => apiClient.get<{ speeches: LearnedSpeech[] }>('/visor/learned-speeches'),
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBestCalls(limit = 20) {
  const accessToken = useAuthStore(s => s.accessToken);
  return useQuery({
    queryKey: ['best-calls', limit],
    queryFn: () => apiClient.get<{ calls: TopCallRef[] }>('/visor/best-calls', { limit }),
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLearningStatus() {
  const accessToken = useAuthStore(s => s.accessToken);
  return useQuery({
    queryKey: ['learning-status'],
    queryFn: () => apiClient.get<LearningStatus>('/visor/learning-status'),
    enabled: !!accessToken,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useRegenerateLearnedSpeeches() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<{ regenerated: boolean; count: number; speeches: LearnedSpeech[] }>(
        '/visor/learned-speeches/regenerate',
        {},
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learned-speeches'] });
      qc.invalidateQueries({ queryKey: ['learning-status'] });
      qc.invalidateQueries({ queryKey: ['best-calls'] });
    },
  });
}
