import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../auth/authStore';
import type { CallItem, CallFilters, CallStatus } from '@auditor/shared-types';

export function useCalls(filters: CallFilters = {}) {
  const accessToken = useAuthStore(s => s.accessToken);
  return useQuery({
    queryKey: ['calls', filters],
    queryFn: () => apiClient.get<CallItem[]>('/visor/calls', filters as any),
    enabled: !!accessToken,
  });
}

export function useMoveCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CallStatus }) =>
      apiClient.patch(`/visor/calls/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calls'] });
    },
  });
}

export function useDeleteCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/visor/calls/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calls'] });
    },
  });
}

export function useAssignContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ callId, contactId, fullName, phone, email }: {
      callId: string;
      contactId?: string;
      fullName?: string;
      phone?: string;
      email?: string;
    }) =>
      apiClient.post(`/llamadas/${callId}/assign-contact`, { contactId, fullName, phone, email }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calls'] });
    },
  });
}
