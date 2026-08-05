import api from "@/api/client";
import type { OrgStructure, OrgTeam, OrgUser, UserRole } from "@/api/types";

const USERS_BASE = "/api/users";
const TEAMS_BASE = "/api/teams";

// ── Backend (snake_case) → Frontend (camelCase) mappers ────────────────────

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

function mapArea(raw: any) {
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

// ── API Functions ──────────────────────────────────────────────────────────

export async function listUsers(): Promise<OrgUser[]> {
  const res = await api.get<any[]>(USERS_BASE);
  return (res.data || []).map(mapUser);
}

export async function getOrgStructure(): Promise<OrgStructure> {
  const res = await api.get<any>(`${USERS_BASE}/org`);
  return {
    areas: (res.data?.areas ?? []).map(mapArea),
    teams: (res.data?.teams ?? []).map(mapTeam),
  };
}

export interface UserUpdatePayload {
  role?: UserRole;
  teamId?: string | null;
  areaId?: string | null;
  isActive?: boolean;
}

export async function updateUser(id: string, patch: UserUpdatePayload): Promise<OrgUser> {
  const body: Record<string, unknown> = {};
  if (patch.role !== undefined) body.role = patch.role;
  if (patch.teamId !== undefined) body.team_id = patch.teamId;
  if (patch.areaId !== undefined) body.area_id = patch.areaId;
  if (patch.isActive !== undefined) body.is_active = patch.isActive;
  const res = await api.patch<any>(`${USERS_BASE}/${id}`, body);
  return mapUser(res.data);
}

export interface TeamCreatePayload {
  name: string;
  areaId: string;
  supervisorId?: string | null;
  coordinatorId?: string | null;
}

export async function createTeam(data: TeamCreatePayload): Promise<OrgTeam> {
  const res = await api.post<any>(TEAMS_BASE, data);
  return mapTeam(res.data);
}

export interface TeamUpdatePayload {
  name?: string;
  supervisorId?: string | null;
  coordinatorId?: string | null;
  isActive?: boolean;
}

export async function updateTeam(id: string, patch: TeamUpdatePayload): Promise<OrgTeam> {
  const res = await api.patch<any>(`${TEAMS_BASE}/${id}`, patch);
  return mapTeam(res.data);
}
