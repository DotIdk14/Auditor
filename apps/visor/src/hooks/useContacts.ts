import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../auth/authStore';
import type { Contact, ContactFilters, PaginatedResponse } from '@auditor/shared-types';

export function useContacts(filters: ContactFilters = {}) {
  const accessToken = useAuthStore(s => s.accessToken);
  return useQuery({
    queryKey: ['contacts', filters],
    queryFn: () => apiClient.get<PaginatedResponse<Contact>>('/contacts', filters as any),
    enabled: !!accessToken,
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: () => apiClient.get<Contact>(`/contacts/${id}`),
    enabled: !!id,
  });
}

export function useContactCalls(id: string) {
  return useQuery({
    queryKey: ['contact-calls', id],
    queryFn: () => apiClient.get<any[]>(`/contacts/${id}/calls`),
    enabled: !!id,
  });
}

export function useContactActivity(id: string) {
  return useQuery<{ contactId: string; items: ActivityItem[]; total: number }>({
    queryKey: ['contact-activity', id],
    queryFn: () => apiClient.get(`/contacts/${id}/activity`),
    enabled: !!id,
  });
}

export interface ActivityItem {
  id: string;
  type: 'audit' | 'task';
  title: string;
  description?: string;
  created_at: string;
  // audit-specific
  score?: number | null;
  status?: string;
  callId?: string;
  // task-specific
  taskType?: string;
  due_date?: string;
  completed_at?: string;
  priority?: string;
  assigned_to?: string;
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { fullName: string; phone?: string; email?: string; company?: string; status?: string }) =>
      apiClient.post<Contact>('/contacts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useNotes(callId: string | null) {
  return useQuery({
    queryKey: ['notes', callId],
    queryFn: () => apiClient.get<any[]>(`/llamadas/${callId}/notas`),
    enabled: !!callId,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ callId, text }: { callId: string; text: string }) =>
      apiClient.post(`/llamadas/${callId}/notas`, {
        supervisorEmail: localStorage.getItem('visor_device_id') || 'unknown@localhost',
        supervisorName: 'Usuario',
        segmentStart: 0,
        segmentEnd: 0,
        text,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit'] });
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
