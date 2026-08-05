import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import type { UserRole } from '@auditor/shared-types';

// ── Types (org management) ──────────────────────────────────────────────────

export interface OrgUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  areaId: string | null;
  teamId: string | null;
  isActive: boolean;
  coordinatorId?: string | null;
  coordinatorName?: string | null;
  supervisorId?: string | null;
  supervisorName?: string | null;
  teamName?: string | null;
  areaName?: string | null;
}

export interface OrgArea {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  managerId: string | null;
  isActive: boolean;
}

export interface OrgTeam {
  id: string;
  areaId: string;
  name: string;
  code: string | null;
  supervisorId: string | null;
  supervisorName: string | null;
  coordinatorId: string | null;
  coordinatorName: string | null;
  isActive: boolean;
}

export interface OrgStructure {
  areas: OrgArea[];
  teams: OrgTeam[];
}

export interface UserUpdatePayload {
  role?: UserRole;
  teamId?: string | null;
  areaId?: string | null;
  isActive?: boolean;
}

export interface TeamCreatePayload {
  name: string;
  areaId: string;
  supervisorId?: string | null;
  coordinatorId?: string | null;
}

// ── snake_case → camelCase mappers ──────────────────────────────────────────

function mapUser(raw: any): OrgUser {
  return {
    id: raw.id,
    email: raw.email ?? "",
    fullName: raw.full_name ?? raw.fullName ?? null,
    avatarUrl: raw.avatar_url ?? raw.avatarUrl ?? null,
    role: (raw.role ?? "agent") as UserRole,
    areaId: raw.area_id ?? raw.areaId ?? null,
    teamId: raw.team_id ?? raw.teamId ?? null,
    isActive: raw.is_active ?? raw.isActive ?? true,
    coordinatorId: raw.coordinator_id ?? raw.coordinatorId ?? null,
    coordinatorName: raw.coordinator_name ?? raw.coordinatorName ?? null,
    supervisorId: raw.supervisor_id ?? raw.supervisorId ?? null,
    supervisorName: raw.supervisor_name ?? raw.supervisorName ?? null,
    teamName: raw.team_name ?? raw.teamName ?? null,
    areaName: raw.area_name ?? raw.areaName ?? null,
  };
}

function mapArea(raw: any): OrgArea {
  return {
    id: raw.id,
    name: raw.name,
    code: raw.code ?? null,
    description: raw.description ?? null,
    managerId: raw.manager_id ?? raw.managerId ?? null,
    isActive: raw.is_active !== false,
  };
}

function mapTeam(raw: any): OrgTeam {
  return {
    id: raw.id,
    areaId: raw.area_id ?? raw.areaId ?? "",
    name: raw.name ?? "",
    code: raw.code ?? null,
    supervisorId: raw.supervisor_id ?? raw.supervisorId ?? null,
    supervisorName: raw.supervisor_name ?? raw.supervisorName ?? null,
    coordinatorId: raw.coordinator_id ?? raw.coordinatorId ?? null,
    coordinatorName: raw.coordinator_name ?? raw.coordinatorName ?? null,
    isActive: raw.is_active ?? raw.isActive ?? true,
  };
}

// ── API functions ───────────────────────────────────────────────────────────

export async function listUsers(): Promise<OrgUser[]> {
  const res = await apiClient.get<any[]>("/users");
  return (res || []).map(mapUser);
}

export async function getOrgStructure(): Promise<OrgStructure> {
  const res = await apiClient.get<any>("/users/org");
  return {
    areas: (res?.areas ?? []).map(mapArea),
    teams: (res?.teams ?? []).map(mapTeam),
  };
}

export async function updateUser(id: string, patch: UserUpdatePayload): Promise<OrgUser> {
  const body: Record<string, unknown> = {};
  if (patch.role !== undefined) body.role = patch.role;
  if (patch.teamId !== undefined) body.team_id = patch.teamId;
  if (patch.areaId !== undefined) body.area_id = patch.areaId;
  if (patch.isActive !== undefined) body.is_active = patch.isActive;
  const res = await apiClient.patch<any>(`/users/${id}`, body);
  return mapUser(res);
}

export async function createTeam(data: TeamCreatePayload): Promise<OrgTeam> {
  const res = await apiClient.post<any>("/teams", data);
  return mapTeam(res);
}

// ── React Query hooks (shared keys so home + page stay in sync) ─────────────

export const USERS_KEY = ["users"] as const;
export const ORG_KEY = ["org-structure"] as const;

export function useOrgUsers(enabled = true) {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: listUsers,
    enabled,
  });
}

export function useOrgStructure(enabled = true) {
  return useQuery({
    queryKey: ORG_KEY,
    queryFn: getOrgStructure,
    enabled,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UserUpdatePayload }) =>
      updateUser(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      qc.invalidateQueries({ queryKey: ORG_KEY });
    },
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TeamCreatePayload) => createTeam(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      qc.invalidateQueries({ queryKey: ORG_KEY });
    },
  });
}
