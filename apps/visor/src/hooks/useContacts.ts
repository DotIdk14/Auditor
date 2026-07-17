import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../auth/authStore';
import { useContactsStore } from '../stores/contactsStore';
import type { Contact, ContactFilters, ContactDisposition, PaginatedResponse, Interaction } from '@auditor/shared-types';

export function useContacts(filters: ContactFilters = {}) {
  const accessToken = useAuthStore(s => s.accessToken);
  const store = useContactsStore();

  // Try API first, fall back to local store
  const apiQuery = useQuery({
    queryKey: ['contacts', filters],
    queryFn: () => apiClient.get<PaginatedResponse<Contact>>('/contacts', filters as any),
    enabled: !!accessToken,
    retry: false,
    throwOnError: false,
  });

  // Always initialize local store
  const initialized = useQuery({
    queryKey: ['contacts-local-init'],
    queryFn: () => { store.init(); return true; },
    staleTime: Infinity,
  });

  // If API failed or no token, use local store
  const useLocal = !accessToken || apiQuery.isError || (!apiQuery.isLoading && !apiQuery.data);

  if (useLocal) {
    const localContacts = store.list({
      search: filters.search,
      disposition: filters.disposition as ContactDisposition | undefined,
    });
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 25;
    const start = (page - 1) * pageSize;
    const paged = localContacts.slice(start, start + pageSize);

    return {
      data: {
        data: paged,
        total: localContacts.length,
        page,
        pageSize,
        totalPages: Math.ceil(localContacts.length / pageSize),
      } as PaginatedResponse<Contact>,
      isLoading: false,
      isError: false,
    };
  }

  return apiQuery;
}

export function useContact(id: string) {
  const store = useContactsStore();

  const apiQuery = useQuery({
    queryKey: ['contact', id],
    queryFn: () => apiClient.get<Contact>(`/contacts/${id}`),
    enabled: !!id,
    retry: false,
    throwOnError: false,
  });

  if (apiQuery.isError || (!apiQuery.isLoading && !apiQuery.data)) {
    const local = store.get(id);
    return { data: local || null, isLoading: false, isError: false };
  }

  return apiQuery;
}

export function useContactCalls(id: string) {
  return useQuery({
    queryKey: ['contact-calls', id],
    queryFn: () => apiClient.get<any[]>(`/contacts/${id}/calls`),
    enabled: !!id,
    retry: false,
  });
}

export function useContactActivity(id: string) {
  return useQuery<{ contactId: string; items: ActivityItem[]; total: number }>({
    queryKey: ['contact-activity', id],
    queryFn: () => apiClient.get(`/contacts/${id}/activity`),
    enabled: !!id,
    retry: false,
  });
}

export interface ActivityItem {
  id: string;
  type: 'audit' | 'task';
  title: string;
  description?: string;
  created_at: string;
  score?: number | null;
  status?: string;
  callId?: string;
  taskType?: string;
  due_date?: string;
  completed_at?: string;
  priority?: string;
  assigned_to?: string;
}

export function useCreateContact() {
  const qc = useQueryClient();
  const store = useContactsStore();

  return useMutation({
    mutationFn: async (data: {
      fullName: string;
      phone?: string;
      email?: string;
      company?: string;
      status?: string;
      source?: string;
      disposition?: string;
      callbackAt?: string;
    }) => {
      try {
        return await apiClient.post<Contact>('/contacts', data);
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 400) {
          throw err;
        }
        return store.create(data);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  const store = useContactsStore();

  return useMutation({
    mutationFn: ({ id, ...data }: {
      id: string;
      fullName?: string;
      phone?: string;
      email?: string;
      company?: string;
      status?: string;
      disposition?: string;
      callbackAt?: string;
      stageId?: string | null;
    }) => {
      return apiClient.patch<Contact>(`/contacts/${id}`, data).catch(() => {
        const updated = store.update(id, data as any);
        if (!updated) throw new Error('Contact not found');
        return updated;
      });
    },
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact', variables.id] });
    },
  });
}

export function useNotes(callId: string | null) {
  return useQuery({
    queryKey: ['notes', callId],
    queryFn: () => apiClient.get<any[]>(`/llamadas/${callId}/notas`),
    enabled: !!callId,
    retry: false,
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

// ── Link Audit to Contact ──────────────────────────────────────────

export function useUnlinkedAudits() {
  return useQuery({
    queryKey: ['unlinked-audits'],
    queryFn: () => apiClient.get<any[]>('/audits/unlinked'),
    retry: false,
  });
}

export function useLinkAudit() {
  const qc = useQueryClient();
  const store = useContactsStore();

  return useMutation({
    mutationFn: ({ contactId, auditId, tipificacion }: {
      contactId: string;
      auditId: string;
      tipificacion: 'positiva' | 'negativa';
    }) => {
      return apiClient.post<{ contact: Contact; previousDisposition: string }>(
        `/contacts/${contactId}/link-audit`,
        { auditId, tipificacion }
      ).catch(() => {
        // Fallback: update locally
        const current = store.get(contactId);
        if (!current) throw new Error('Contact not found');

        const isLocked = current.disposition_locked || current.disposition === 'evaluando';
        let newDisposition = current.disposition;
        let newLocked = current.disposition_locked;

        if (tipificacion === 'positiva') {
          newDisposition = 'evaluando';
          newLocked = true;
        } else if (!isLocked) {
          newDisposition = 'cuelgue';
        }

        const updated = store.update(contactId, {
          disposition: newDisposition,
          disposition_locked: newLocked,
        });

        return { contact: updated, previousDisposition: current.disposition };
      });
    },
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact', variables.contactId] });
      qc.invalidateQueries({ queryKey: ['contact-activity', variables.contactId] });
      qc.invalidateQueries({ queryKey: ['unlinked-audits'] });
    },
  });
}

// ── Interactions ──────────────────────────────────────────────────

const INTERACTIONS_STORAGE_KEY = 'visor-interactions';

function getLocalInteractions(): Interaction[] {
  try {
    return JSON.parse(localStorage.getItem(INTERACTIONS_STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveLocalInteraction(interaction: Interaction): void {
  const all = getLocalInteractions();
  all.unshift(interaction);
  localStorage.setItem(INTERACTIONS_STORAGE_KEY, JSON.stringify(all));
}

function getLocalInteractionsByContact(contactId: string): Interaction[] {
  return getLocalInteractions().filter(i => i.contact_id === contactId);
}

export function useInteractions(contactId: string) {
  const accessToken = useAuthStore(s => s.accessToken);

  const apiQuery = useQuery({
    queryKey: ['interactions', contactId],
    queryFn: () => apiClient.get<Interaction[]>(`/contacts/${contactId}/interactions`),
    enabled: !!accessToken && !!contactId,
    retry: false,
    throwOnError: false,
  });

  const useLocal = !accessToken || apiQuery.isError || (!apiQuery.isLoading && !apiQuery.data);

  if (useLocal) {
    return {
      data: getLocalInteractionsByContact(contactId),
      isLoading: false,
      isError: false,
    };
  }

  return apiQuery;
}

export function useCreateInteraction() {
  const qc = useQueryClient();
  const store = useContactsStore();

  return useMutation({
    mutationFn: async ({ contactId, type, tipificacion, notes, files }: {
      contactId: string;
      type: 'llamada' | 'correo' | 'whatsapp';
      tipificacion: 'positiva' | 'negativa';
      notes?: string;
      files?: File[];
    }) => {
      const formData = new FormData();
      formData.append('contactId', contactId);
      formData.append('type', type);
      formData.append('tipificacion', tipificacion);
      if (notes) formData.append('notes', notes);
      if (files) {
        files.forEach(f => formData.append('files', f));
      }

      try {
        const result = await apiClient.post<Interaction>('/interactions', formData);
        return result;
      } catch {
        // Fallback: create locally
        const interaction: Interaction = {
          id: `local-interaction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          contact_id: contactId,
          type,
          tipificacion,
          notes: notes || null,
          files: files ? await Promise.all(files.map(async (f) => ({
            name: f.name,
            type: f.type,
            size: f.size,
            url: await fileToDataUrl(f),
          }))) : [],
          created_by: 'local',
          created_by_name: 'Usuario',
          created_at: new Date().toISOString(),
        };

        saveLocalInteraction(interaction);

        // Update contact disposition locally
        if (tipificacion === 'positiva') {
          const current = store.get(contactId);
          if (current && !current.disposition_locked) {
            store.update(contactId, { disposition: 'evaluando', disposition_locked: true });
          }
        }

        return interaction;
      }
    },
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ['interactions', variables.contactId] });
      qc.invalidateQueries({ queryKey: ['contact', variables.contactId] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact-activity', variables.contactId] });

      // Sync Zustand store on API success
      const store = useContactsStore.getState();
      if (variables.tipificacion === 'positiva') {
        const current = store.get(variables.contactId);
        if (current && !current.disposition_locked) {
          store.update(variables.contactId, { disposition: 'evaluando', disposition_locked: true });
        }
      }
    },
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
