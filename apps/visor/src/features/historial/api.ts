import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import type { UserRole } from '@auditor/shared-types';

export const AUDIT_KEY = ["audit-logs"] as const;

export type AuditAction =
  | "create" | "update" | "delete" | "restore" | "password" | "login" | "login_failed";

export interface AuditLogItem {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: UserRole | null;
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  areaId: string | null;
  teamId: string | null;
  changes: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogFilters {
  role?: UserRole;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
  q?: string;
  areaId?: string;
  teamId?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogPage {
  items: AuditLogItem[];
  total: number;
}

function mapItem(raw: any): AuditLogItem {
  return {
    id: raw.id,
    actorId: raw.actor_id ?? raw.actorId ?? null,
    actorEmail: raw.actor_email ?? raw.actorEmail ?? null,
    actorRole: raw.actor_role ?? raw.actorRole ?? null,
    action: raw.action ?? "",
    entityType: raw.entity_type ?? raw.entityType ?? "",
    entityId: raw.entity_id ?? raw.entityId ?? null,
    entityLabel: raw.entity_label ?? raw.entityLabel ?? null,
    areaId: raw.area_id ?? raw.areaId ?? null,
    teamId: raw.team_id ?? raw.teamId ?? null,
    changes: raw.changes ?? {},
    createdAt: raw.created_at ?? raw.createdAt ?? "",
  };
}

export async function fetchAuditLogs(filters: AuditLogFilters): Promise<AuditLogPage> {
  const params: Record<string, unknown> = {};
  if (filters.role) params.role = filters.role;
  if (filters.action) params.action = filters.action;
  if (filters.entityType) params.entityType = filters.entityType;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.q) params.q = filters.q;
  if (filters.areaId) params.areaId = filters.areaId;
  if (filters.teamId) params.teamId = filters.teamId;
  if (filters.limit !== undefined) params.limit = filters.limit;
  if (filters.offset !== undefined) params.offset = filters.offset;

  const res = await apiClient.get<any>("/audit-logs", params);
  return {
    items: (res?.items ?? []).map(mapItem),
    total: res?.total ?? 0,
  };
}

export function useAuditLogs(filters: AuditLogFilters, enabled = true) {
  return useQuery({
    queryKey: [...AUDIT_KEY, filters],
    queryFn: () => fetchAuditLogs(filters),
    enabled,
  });
}
