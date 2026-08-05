import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import type { UserRole } from '@auditor/shared-types';
import { AUDIT_KEY } from '../historial/api';

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
  hasPassword?: boolean;
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
  password?: string;
}

export interface CreateUserPayload {
  email: string;
  fullName?: string;
  role: UserRole;
  areaId?: string | null;
  teamId?: string | null;
  password?: string;
  isActive?: boolean;
}

export interface TeamCreatePayload {
  name: string;
  areaId: string;
  supervisorId?: string | null;
  coordinatorId?: string | null;
}

export interface AreaCreatePayload {
  name: string;
  code?: string;
  description?: string;
  managerId?: string | null;
}

export interface AreaUpdatePayload {
  name?: string;
  code?: string;
  description?: string | null;
  managerId?: string | null;
  isActive?: boolean;
}

export interface DeletedOrgUser extends OrgUser {
  deletedAt: string | null;
  deletedBy: string | null;
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
    hasPassword: raw.has_password ?? raw.hasPassword ?? false,
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
  if (patch.password !== undefined) body.password = patch.password;
  const res = await apiClient.patch<any>(`/users/${id}`, body);
  return mapUser(res);
}

export async function createUser(data: CreateUserPayload): Promise<OrgUser> {
  const res = await apiClient.post<any>("/users", data);
  return mapUser(res);
}

export async function setUserPassword(id: string, password: string): Promise<void> {
  await apiClient.patch(`/users/${id}`, { password });
}

export async function createArea(data: AreaCreatePayload): Promise<OrgArea> {
  const res = await apiClient.post<any>("/areas", data);
  return mapArea(res);
}

export async function updateArea(id: string, patch: AreaUpdatePayload): Promise<OrgArea> {
  const res = await apiClient.patch<any>(`/areas/${id}`, patch);
  return mapArea(res);
}

export async function createTeam(data: TeamCreatePayload): Promise<OrgTeam> {
  const res = await apiClient.post<any>("/teams", data);
  return mapTeam(res);
}

export async function listDeletedUsers(): Promise<DeletedOrgUser[]> {
  const res = await apiClient.get<any[]>("/users/deleted");
  return (res || []).map((u) => ({
    ...mapUser(u),
    deletedAt: u.deleted_at ?? u.deletedAt ?? null,
    deletedBy: u.deleted_by ?? u.deletedBy ?? null,
  }));
}

export async function softDeleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}

export async function restoreUser(id: string): Promise<void> {
  await apiClient.post(`/users/${id}/restore`);
}

// ── React Query hooks (shared keys so home + page stay in sync) ─────────────

export const USERS_KEY = ["users"] as const;
export const ORG_KEY = ["org-structure"] as const;
export const DELETED_KEY = ["users-deleted"] as const;

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
      qc.invalidateQueries({ queryKey: AUDIT_KEY });
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
      qc.invalidateQueries({ queryKey: AUDIT_KEY });
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserPayload) => createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      qc.invalidateQueries({ queryKey: ORG_KEY });
      qc.invalidateQueries({ queryKey: AUDIT_KEY });
    },
  });
}

export function useCreateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AreaCreatePayload) => createArea(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORG_KEY });
      qc.invalidateQueries({ queryKey: AUDIT_KEY });
    },
  });
}

export function useDeletedUsers(enabled = true) {
  return useQuery({
    queryKey: DELETED_KEY,
    queryFn: listDeletedUsers,
    enabled,
  });
}

export function useSoftDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      qc.invalidateQueries({ queryKey: ORG_KEY });
      qc.invalidateQueries({ queryKey: DELETED_KEY });
      qc.invalidateQueries({ queryKey: AUDIT_KEY });
    },
  });
}

export function useRestoreUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      qc.invalidateQueries({ queryKey: ORG_KEY });
      qc.invalidateQueries({ queryKey: DELETED_KEY });
      qc.invalidateQueries({ queryKey: AUDIT_KEY });
    },
  });
}
