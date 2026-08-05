import { randomUUID, scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { insforge, insforgeAdmin } from "./insforge.js";
import type { ServiceScope, UserProfile, UserRole, OrgUser, OrgStructure, OrgArea } from "../types.js";

// Admin client (bypass RLS) when available, else anon client.
function db() {
  return insforgeAdmin?.database || insforge.database;
}

export function dbAvailable(): boolean {
  return Boolean(process.env.INSFORGE_BASE_URL && db());
}

// ─── Password hashing (scrypt + salt, no external deps) ────────────────────

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split("$");
    if (scheme !== "scrypt" || !salt || !hash) return false;
    const candidate = scryptSync(password, salt, SCRYPT_KEYLEN);
    const expected = Buffer.from(hash, "hex");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

function mapOrgArea(row: any): OrgArea {
  return {
    id: row.id,
    name: row.name,
    code: row.code ?? null,
    description: row.description ?? null,
    manager_id: row.manager_id ?? null,
    is_active: row.is_active !== false,
  };
}

export const MANAGER_ROLES: UserRole[] = ["admin", "area_manager", "coordinator"];

function mapProfile(row: any): UserProfile {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name ?? null,
    avatar_url: row.avatar_url ?? null,
    role: (row.role as UserRole) || "agent",
    area_id: row.area_id ?? null,
    team_id: row.team_id ?? null,
    is_active: row.is_active !== false,
    has_password: Boolean(row.password_hash),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Resolve the team IDs that a coordinator (or supervisor) owns.
 * - admin / area_manager: [] (they scope by area)
 * - coordinator: teams where coordinator_id = current user
 * - supervisor: their own team
 */
export async function resolveManagedTeamIds(scope: ServiceScope): Promise<string[]> {
  if (!dbAvailable()) {
    if (scope.role === "supervisor" && scope.teamId) return [scope.teamId];
    return [];
  }
  if (scope.role === "supervisor") {
    return scope.teamId ? [scope.teamId] : [];
  }
  if (scope.role === "coordinator") {
    const { data, error } = await db()
      .from("teams")
      .select("id")
      .eq("coordinator_id", scope.userId);
    if (error) {
      console.warn("[USER_SERVICE] resolveManagedTeamIds error:", error.message);
      return scope.teamId ? [scope.teamId] : [];
    }
    const ids = (data || []).map((t: any) => t.id);
    // fallback to the team attached to the coordinator's own profile
    if (scope.teamId && !ids.includes(scope.teamId)) ids.push(scope.teamId);
    return ids;
  }
  return [];
}

/**
 * Whether the caller can manage (list/edit) the target profile.
 */
export async function canManageTarget(scope: ServiceScope, target: { id: string; role: UserRole; area_id: string | null; team_id: string | null }): Promise<boolean> {
  if (scope.role === "admin") return true;
  if (scope.role === "area_manager") {
    return target.area_id === scope.areaId && target.role !== "admin" && target.role !== "area_manager";
  }
  if (scope.role === "coordinator") {
    if (target.role === "admin" || target.role === "area_manager" || target.role === "coordinator") return false;
    if (target.id === scope.userId) return false;
    if (!target.team_id) return false;
    const teamIds = await resolveManagedTeamIds(scope);
    return teamIds.includes(target.team_id);
  }
  return false;
}

// ─── List users (scoped) ──────────────────────────────────────────────────

export async function listUsers(scope: ServiceScope): Promise<OrgUser[]> {
  if (!dbAvailable()) return [];

  const [profilesRes, teamsRes, areasRes] = await Promise.all([
    db().from("profiles").select("*").order("full_name"),
    db().from("teams").select("*"),
    db().from("areas").select("id, name, code"),
  ]);

  if (profilesRes.error) {
    throw new Error(`Error al listar usuarios: ${profilesRes.error.message}`);
  }

  const teams = teamsRes.data || [];
  const areas = areasRes.data || [];
  const teamIds = scope.role === "coordinator" ? await resolveManagedTeamIds(scope) : [];

  let rows = (profilesRes.data || []).map(mapProfile);
  switch (scope.role) {
    case "admin":
      break;
    case "area_manager":
      rows = rows.filter(p => p.area_id === scope.areaId);
      break;
    case "coordinator":
      rows = rows.filter(p => p.id === scope.userId || (p.team_id && teamIds.includes(p.team_id)));
      break;
    case "supervisor":
      rows = rows.filter(p => p.id === scope.userId || (scope.teamId && p.team_id === scope.teamId));
      break;
    default:
      rows = rows.filter(p => p.id === scope.userId);
  }

  const teamById = new Map(teams.map((t: any) => [t.id, t]));
  const areaNameById = new Map(areas.map((a: any) => [a.id, a.name]));
  const profileById = new Map(rows.map((p: any) => [p.id, p]));

  return rows.map((p: any) => {
    const team = p.team_id ? teamById.get(p.team_id) : null;
    const coordinatorId = team?.coordinator_id || null;
    const supervisorId = team?.supervisor_id || null;
    const coordinator = coordinatorId ? profileById.get(coordinatorId) : null;
    const supervisor = supervisorId ? profileById.get(supervisorId) : null;
    return {
      ...p,
      coordinatorId,
      coordinatorName: coordinator?.full_name || coordinator?.email || null,
      supervisorId,
      supervisorName: supervisor?.full_name || supervisor?.email || null,
      teamName: team?.name || null,
      areaName: p.area_id ? areaNameById.get(p.area_id) || null : null,
    };
  });
}

// ─── Org structure (areas + teams with names) ──────────────────────────────

export async function getOrgStructure(scope: ServiceScope): Promise<OrgStructure> {
  if (!dbAvailable()) return { areas: [], teams: [] };

  const [profilesRes, areasRes, teamsRes] = await Promise.all([
    db().from("profiles").select("id, email, full_name, role, area_id, team_id, is_active"),
    db().from("areas").select("*").order("name"),
    db().from("teams").select("*").order("name"),
  ]);

  const profiles = profilesRes.data || [];
  const areas = (areasRes.data || []).filter((a: any) => a.is_active !== false);
  let teams = teamsRes.data || [];

  if (scope.role === "admin") {
    // all
  } else if (scope.role === "area_manager") {
    const areaIds = new Set([scope.areaId].filter(Boolean));
    teams = teams.filter((t: any) => t.area_id && areaIds.has(t.area_id));
  } else if (scope.role === "coordinator") {
    const teamIds = new Set(await resolveManagedTeamIds(scope));
    teams = teams.filter((t: any) => t.coordinator_id === scope.userId || (t.id && teamIds.has(t.id)));
  } else if (scope.role === "supervisor") {
    teams = teams.filter((t: any) => scope.teamId && t.id === scope.teamId);
  } else {
    teams = [];
  }

  const nameOf = (id: string | null | undefined) => {
    if (!id) return null;
    const p = profiles.find((x: any) => x.id === id);
    return p?.full_name || p?.email || id;
  };

  return {
    areas: areas
      .filter((a: any) => {
        if (scope.role === "admin" || scope.role === "area_manager" || scope.role === "coordinator") return true;
        return teams.some((t: any) => t.area_id === a.id);
      })
      .map((a: any) => ({
        id: a.id,
        name: a.name,
        code: a.code || null,
        description: a.description || null,
        manager_id: a.manager_id || null,
        is_active: a.is_active !== false,
      })),
    teams: teams.map((t: any) => ({
      id: t.id,
      area_id: t.area_id,
      name: t.name,
      code: t.code || null,
      supervisor_id: t.supervisor_id || null,
      supervisor_name: nameOf(t.supervisor_id),
      coordinator_id: t.coordinator_id || null,
      coordinator_name: nameOf(t.coordinator_id),
      is_active: t.is_active !== false,
    })),
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────

const ALLOWED_PATCH = ["full_name", "role", "area_id", "team_id", "is_active"] as const;

export interface UserPatch {
  full_name?: string | null;
  role?: UserRole;
  area_id?: string | null;
  team_id?: string | null;
  is_active?: boolean;
}

export async function updateUser(scope: ServiceScope, userId: string, patch: UserPatch): Promise<OrgUser> {
  if (!dbAvailable()) throw new Error("Base de datos no disponible");

  const { data: target, error: fetchErr } = await db()
    .from("profiles")
    .select("id, email, full_name, role, area_id, team_id, is_active")
    .eq("id", userId)
    .maybeSingle();
  if (fetchErr || !target) throw new Error("Usuario no encontrado");

  const can = await canManageTarget(scope, {
    id: target.id,
    role: target.role,
    area_id: target.area_id,
    team_id: target.team_id,
  });
  if (!can) throw new Error("Permisos insuficientes para modificar este usuario");

  // Role restrictions per caller
  if (patch.role) {
    if (scope.role === "area_manager" && !["coordinator", "supervisor", "agent", "qa"].includes(patch.role)) {
      throw new Error("Como gerente solo puedes asignar roles de coordinador, supervisor, agente o auditor");
    }
    if (scope.role === "coordinator" && !["agent", "qa"].includes(patch.role)) {
      throw new Error("Como coordinador solo puedes asignar roles de agente o auditor");
    }
  }

  // Team restrictions: target team must be within the caller's scope
  if (patch.team_id !== undefined && patch.team_id !== null) {
    if (scope.role === "area_manager") {
      const t = await findTeam(patch.team_id);
      if (t && t.area_id !== scope.areaId) throw new Error("El equipo está fuera de tu área");
    } else if (scope.role === "coordinator") {
      const teamIds = await resolveManagedTeamIds(scope);
      if (!teamIds.includes(patch.team_id)) throw new Error("El equipo está fuera de tu grupo de coordinación");
    }
  }

  // Area changes only for admin (or area_manager keeping same area)
  if (patch.area_id !== undefined && scope.role === "coordinator") {
    throw new Error("Como coordinador no puedes cambiar el área");
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ALLOWED_PATCH) {
    if (patch[key] !== undefined && patch[key] !== null) {
      updates[key] = patch[key];
    }
  }

  // Consistency: assigning to a team also inherits the team's area
  if (patch.team_id) {
    const team = await findTeam(patch.team_id);
    if (team?.area_id) updates.area_id = team.area_id;
  }

  const { error: updateErr } = await db()
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  if (updateErr) throw new Error(`Error al actualizar usuario: ${updateErr.message}`);

  const fresh = await listUsers(scope);
  return fresh.find((u: OrgUser) => u.id === userId) as OrgUser;
}

// ─── Teams ────────────────────────────────────────────────────────────────

export async function createTeam(
  scope: ServiceScope,
  input: { name: string; code?: string; areaId: string; supervisorId?: string | null; coordinatorId?: string | null }
): Promise<any> {
  if (!dbAvailable()) throw new Error("Base de datos no disponible");
  if (!["admin", "area_manager", "coordinator"].includes(scope.role)) {
    throw new Error("Permisos insuficientes para crear equipos");
  }
  if (scope.role === "area_manager" && input.areaId !== scope.areaId) {
    throw new Error("El equipo debe pertenecer a tu área");
  }

  const area = await findArea(input.areaId);
  if (!area) throw new Error("Área no encontrada");

  const code = input.code || slugify(input.name);
  const coordinatorId = scope.role === "coordinator" ? scope.userId : (input.coordinatorId || null);

  const team = {
    id: randomUUID(),
    area_id: input.areaId,
    name: input.name,
    code,
    supervisor_id: input.supervisorId || null,
    coordinator_id: coordinatorId,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db().from("teams").insert(team).select().single();
  if (error) throw new Error(`Error al crear equipo: ${error.message}`);

  // Sync supervisor profile team_id
  if (input.supervisorId) {
    await db()
      .from("profiles")
      .update({ team_id: data.id, area_id: input.areaId, updated_at: new Date().toISOString() })
      .eq("id", input.supervisorId);
  }

  return data;
}

export async function updateTeam(
  scope: ServiceScope,
  teamId: string,
  patch: { name?: string; supervisorId?: string | null; coordinatorId?: string | null; isActive?: boolean }
): Promise<any> {
  if (!dbAvailable()) throw new Error("Base de datos no disponible");

  const team = await findTeam(teamId);
  if (!team) throw new Error("Equipo no encontrado");

  if (scope.role === "area_manager" && team.area_id !== scope.areaId) {
    throw new Error("El equipo está fuera de tu área");
  }
  if (scope.role === "coordinator" && team.coordinator_id !== scope.userId) {
    throw new Error("El equipo está fuera de tu grupo de coordinación");
  }
  if (scope.role !== "admin" && scope.role !== "area_manager" && scope.role !== "coordinator") {
    throw new Error("Permisos insuficientes");
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.isActive !== undefined) updates.is_active = patch.isActive;
  if (patch.supervisorId !== undefined) updates.supervisor_id = patch.supervisorId || null;
  if (patch.coordinatorId !== undefined) {
    if (scope.role !== "admin" && scope.role !== "area_manager") {
      throw new Error("Solo admin o gerente puede reasignar el coordinador del equipo");
    }
    updates.coordinator_id = patch.coordinatorId || null;
  }

  const { error } = await db().from("teams").update(updates).eq("id", teamId);
  if (error) throw new Error(`Error al actualizar equipo: ${error.message}`);

  // Sync supervisor profile team_id
  if (patch.supervisorId !== undefined) {
    if (patch.supervisorId) {
      await db()
        .from("profiles")
        .update({ team_id: teamId, area_id: team.area_id, updated_at: new Date().toISOString() })
        .eq("id", patch.supervisorId);
    }
    // Clear previous supervisor's team if it pointed here
    if (team.supervisor_id && team.supervisor_id !== patch.supervisorId) {
      await db()
        .from("profiles")
        .update({ team_id: null, updated_at: new Date().toISOString() })
        .eq("id", team.supervisor_id)
        .eq("team_id", teamId);
    }
  }

  return findTeam(teamId);
}

// ─── Areas (coordinaciones) ────────────────────────────────────────────────

export async function createArea(
  scope: ServiceScope,
  input: { name: string; code?: string; description?: string; managerId?: string | null }
): Promise<OrgArea> {
  if (!dbAvailable()) throw new Error("Base de datos no disponible");
  if (scope.role !== "admin") throw new Error("Solo el admin puede crear áreas");

  const code = (input.code || slugify(input.name)).toUpperCase().slice(0, 24) || slugify(input.name);
  const area = {
    id: randomUUID(),
    name: input.name,
    code,
    description: input.description || null,
    manager_id: input.managerId || null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db().from("areas").insert(area).select().single();
  if (error) {
    const msg = error.message || "";
    if (/duplicate|unique/i.test(msg)) {
      throw new Error(`Ya existe un área con nombre o código "${input.name}" / "${code}"`);
    }
    throw new Error(`Error al crear área: ${msg}`);
  }
  return mapOrgArea(data);
}

export async function updateArea(
  scope: ServiceScope,
  areaId: string,
  patch: { name?: string; code?: string; description?: string | null; managerId?: string | null; isActive?: boolean }
): Promise<OrgArea> {
  if (!dbAvailable()) throw new Error("Base de datos no disponible");
  if (scope.role !== "admin") throw new Error("Solo el admin puede modificar áreas");

  const area = await findArea(areaId);
  if (!area) throw new Error("Área no encontrada");

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.code !== undefined) updates.code = patch.code;
  if (patch.description !== undefined) updates.description = patch.description || null;
  if (patch.managerId !== undefined) updates.manager_id = patch.managerId || null;
  if (patch.isActive !== undefined) updates.is_active = patch.isActive;

  const { error } = await db().from("areas").update(updates).eq("id", areaId);
  if (error) throw new Error(`Error al actualizar área: ${error.message}`);
  return mapOrgArea(await findArea(areaId));
}

// ─── Users ─────────────────────────────────────────────────────────────────

export async function createUser(
  scope: ServiceScope,
  input: {
    email: string;
    fullName?: string;
    role: UserRole;
    areaId?: string | null;
    teamId?: string | null;
    password?: string;
    isActive?: boolean;
  }
): Promise<OrgUser> {
  if (!dbAvailable()) throw new Error("Base de datos no disponible");

  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Correo electrónico inválido");

  const { data: existing } = await db().from("profiles").select("id").eq("email", email).maybeSingle();
  if (existing) throw new Error("Ya existe un usuario con ese correo");

  if (scope.role === "area_manager" && !["coordinator", "supervisor", "agent", "qa"].includes(input.role)) {
    throw new Error("Como gerente solo puedes crear coordinador, supervisor, agente o auditor");
  }
  if (scope.role === "coordinator" && !["agent", "qa"].includes(input.role)) {
    throw new Error("Como coordinador solo puedes crear asesores o auditores");
  }

  let areaId = input.areaId || null;
  let teamId = input.teamId || null;

  if (teamId) {
    const team = await findTeam(teamId);
    if (!team) throw new Error("Equipo no encontrado");
    if (scope.role === "area_manager" && team.area_id !== scope.areaId) {
      throw new Error("El equipo está fuera de tu área");
    }
    if (scope.role === "coordinator") {
      const teamIds = await resolveManagedTeamIds(scope);
      if (!teamIds.includes(teamId)) throw new Error("El equipo está fuera de tu grupo de coordinación");
    }
    areaId = areaId || team.area_id;
  }

  if (scope.role === "area_manager" && areaId && areaId !== scope.areaId) {
    throw new Error("El área está fuera de tu alcance");
  }
  if (scope.role === "coordinator" && areaId && areaId !== scope.areaId) {
    throw new Error("Como coordinador no puedes cambiar el área");
  }

  const profile = {
    id: randomUUID(),
    email,
    full_name: input.fullName || email.split("@")[0],
    role: input.role,
    area_id: areaId,
    team_id: teamId,
    is_active: input.isActive !== false,
    password_hash: input.password ? hashPassword(input.password) : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db().from("profiles").insert(profile).select().single();
  if (error) throw new Error(`Error al crear usuario: ${error.message}`);

  const fresh = await listUsers(scope);
  return fresh.find((u: OrgUser) => u.id === data.id) as OrgUser;
}

export async function setUserPassword(scope: ServiceScope, userId: string, password: string): Promise<void> {
  if (!dbAvailable()) throw new Error("Base de datos no disponible");
  if (scope.role !== "admin" && scope.userId !== userId) {
    throw new Error("Solo el admin puede cambiar contraseñas de otros usuarios");
  }
  const { data: target } = await db().from("profiles").select("id").eq("id", userId).maybeSingle();
  if (!target) throw new Error("Usuario no encontrado");

  const { error } = await db()
    .from("profiles")
    .update({ password_hash: hashPassword(password), updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw new Error(`Error al guardar contraseña: ${error.message}`);
}

// ─── Lookup helpers ───────────────────────────────────────────────────────

async function findTeam(teamId: string | null | undefined): Promise<any> {
  if (!teamId) return null;
  const { data, error } = await db().from("teams").select("*").eq("id", teamId).maybeSingle();
  if (error || !data) return null;
  return data;
}

async function findArea(areaId: string | null | undefined): Promise<any> {
  if (!areaId) return null;
  const { data, error } = await db().from("areas").select("*").eq("id", areaId).maybeSingle();
  if (error || !data) return null;
  return data;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24) || "team";
}
