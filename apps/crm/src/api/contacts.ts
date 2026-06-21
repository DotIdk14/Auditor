import api from '@/api/client';
import type {
  Contact,
  ContactCreate,
  ContactFilters,
  ContactUpdate,
  PaginatedResponse,
} from '@/api/types';

const BASE = '/api/contacts';

export async function getContacts(
  filters: ContactFilters = {},
): Promise<PaginatedResponse<Contact>> {
  const params: Record<string, string | number | undefined> = {};

  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.source) params.source = filters.source;
  if (filters.assignedTo) params.assignedTo = filters.assignedTo;
  if (filters.stageId) params.stageId = filters.stageId;
  if (filters.areaId) params.areaId = filters.areaId;
  if (filters.teamId) params.teamId = filters.teamId;
  if (filters.page !== undefined) params.page = filters.page;
  if (filters.pageSize !== undefined) params.pageSize = filters.pageSize;

  const res = await api.get<PaginatedResponse<Contact>>(BASE, { params });
  return res.data;
}

export async function getContact(id: string): Promise<Contact> {
  const res = await api.get<Contact>(`${BASE}/${id}`);
  return res.data;
}

export async function createContact(data: ContactCreate): Promise<Contact> {
  const res = await api.post<Contact>(BASE, data);
  return res.data;
}

export async function updateContact(
  id: string,
  data: ContactUpdate,
): Promise<Contact> {
  const res = await api.patch<Contact>(`${BASE}/${id}`, data);
  return res.data;
}

export async function deleteContact(id: string): Promise<void> {
  await api.delete<never>(`${BASE}/${id}`);
}

export async function moveContactStage(
  id: string,
  stageId: string,
): Promise<Contact> {
  const res = await api.patch<Contact>(`${BASE}/${id}/stage`, { stageId });
  return res.data;
}

export async function getContactCalls(contactId: string): Promise<any[]> {
  const res = await api.get<any[]>(`${BASE}/${contactId}/calls`);
  return res.data;
}
