import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { Contact, ContactFilters, PaginatedResponse } from '@auditor/shared-types';

export function useContacts(filters: ContactFilters = {}) {
  return useQuery({
    queryKey: ['contacts', filters],
    queryFn: () => apiClient.get<PaginatedResponse<Contact>>('/contacts', filters as any),
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
