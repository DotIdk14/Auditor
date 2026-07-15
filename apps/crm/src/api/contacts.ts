import api from '@/api/client';
import type {
  Contact,
  ContactCreate,
  ContactFilters,
  ContactUpdate,
  PaginatedResponse,
} from '@/api/types';

const BASE = '/api/contacts';

// ── Backend (snake_case) → Frontend (camelCase) mapper ─────────────────────

function mapContact(raw: any): Contact {
  return {
    id: raw.id,
    fullName: raw.full_name ?? raw.fullName ?? "",
    phone: raw.phone ?? null,
    email: raw.email ?? null,
    company: raw.company ?? null,
    source: raw.source ?? "manual",
    status: raw.status ?? "lead",
    disposition: raw.disposition ?? "no_contactado",
    assignedTo: raw.assigned_to ?? raw.assignedTo ?? "",
    areaId: raw.area_id ?? raw.areaId ?? null,
    teamId: raw.team_id ?? raw.teamId ?? null,
    pipelineId: raw.pipeline_id ?? raw.pipelineId ?? null,
    stageId: raw.stage_id ?? raw.stageId ?? null,
    metadata: raw.metadata ?? {},
    lastActivityAt: raw.last_activity_at ?? raw.lastActivityAt ?? null,
    callbackAt: raw.callback_at ?? raw.callbackAt ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? "",
    updatedAt: raw.updated_at ?? raw.updatedAt ?? "",
    assignedToName: raw.assignedToName ?? null,
    stageName: raw.stageName ?? null,
  };
}

// ── API Functions ──────────────────────────────────────────────────────────

export async function getContacts(
  filters: ContactFilters = {},
): Promise<PaginatedResponse<Contact>> {
  const params: Record<string, string | number | undefined> = {};

  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.source) params.source = filters.source;
  if (filters.disposition) params.disposition = filters.disposition;
  if (filters.assignedTo) params.assignedTo = filters.assignedTo;
  if (filters.stageId) params.stageId = filters.stageId;
  if (filters.areaId) params.areaId = filters.areaId;
  if (filters.teamId) params.teamId = filters.teamId;
  if (filters.page !== undefined) params.page = filters.page;
  if (filters.pageSize !== undefined) params.pageSize = filters.pageSize;

  const res = await api.get<any>(BASE, { params });
  const raw = res.data;
  return {
    ...raw,
    data: (raw.data || []).map(mapContact),
  };
}

export async function getContact(id: string): Promise<Contact> {
  const res = await api.get<any>(`${BASE}/${id}`);
  return mapContact(res.data);
}

export async function createContact(data: ContactCreate): Promise<Contact> {
  const res = await api.post<any>(BASE, data);
  return mapContact(res.data);
}

export async function updateContact(
  id: string,
  data: ContactUpdate,
): Promise<Contact> {
  const res = await api.patch<any>(`${BASE}/${id}`, data);
  return mapContact(res.data);
}

export async function deleteContact(id: string): Promise<void> {
  await api.delete<never>(`${BASE}/${id}`);
}

export async function moveContactStage(
  id: string,
  stageId: string,
): Promise<Contact> {
  const res = await api.patch<any>(`${BASE}/${id}/stage`, { stageId });
  return mapContact(res.data);
}

export async function getContactCalls(contactId: string): Promise<any[]> {
  const res = await api.get<any[]>(`${BASE}/${contactId}/calls`);
  return res.data;
}
