import { insforge, insforgeAdmin } from "./insforge.js";
import type { ServiceScope, UserRole } from "../types.js";

function db() {
  return insforgeAdmin?.database || insforge.database;
}

function dbAvailable(): boolean {
  return Boolean(process.env.INSFORGE_BASE_URL && db());
}

export type AuditAction = "create" | "update" | "delete" | "restore" | "password" | "login" | "login_failed";
export type AuditEntityType = "area" | "team" | "user" | "auth";

export interface AuditLogEntry {
  actor: { id: string; email: string; role: UserRole };
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  entityLabel?: string | null;
  areaId?: string | null;
  teamId?: string | null;
  changes?: Record<string, unknown>;
}

// Fire-and-forget: nunca debe romper la operación que dispara el log.
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  if (!dbAvailable()) return;
  try {
    await db().from("audit_logs").insert([
      {
        actor_id: entry.actor.id,
        actor_email: entry.actor.email,
        actor_role: entry.actor.role,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId ?? null,
        entity_label: entry.entityLabel ?? null,
        area_id: entry.areaId ?? null,
        team_id: entry.teamId ?? null,
        changes: entry.changes ?? {},
      },
    ]);
  } catch (err: any) {
    console.warn("[AUDIT] Failed to log event:", err?.message || err);
  }
}

async function resolveActor(scope: ServiceScope): Promise<AuditLogEntry["actor"]> {
  // El rol del scope (del JWT, resuelto en el login) es la autoridad: refleja los
  // permisos efectivos con los que se ejecutó la acción.
  const actor: AuditLogEntry["actor"] = { id: scope.userId, email: scope.userId, role: scope.role };
  if (!dbAvailable()) return actor;
  try {
    const { data } = await db().from("profiles").select("email").eq("id", scope.userId).maybeSingle();
    if (data?.email) actor.email = data.email;
  } catch { /* non-fatal: usamos el fallback */ }
  return actor;
}

// Versión para llamadas internas que solo tienen el scope (sin email del actor).
export async function logAuditFromScope(scope: ServiceScope, entry: Omit<AuditLogEntry, "actor">): Promise<void> {
  const actor = await resolveActor(scope);
  await logAudit({ ...entry, actor });
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

function mapAuditItem(row: any): AuditLogItem {
  return {
    id: row.id,
    actorId: row.actor_id ?? null,
    actorEmail: row.actor_email ?? null,
    actorRole: row.actor_role ?? null,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id ?? null,
    entityLabel: row.entity_label ?? null,
    areaId: row.area_id ?? null,
    teamId: row.team_id ?? null,
    changes: row.changes ?? {},
    createdAt: row.created_at,
  };
}

async function resolveCoordinatorTeamIds(scope: ServiceScope): Promise<string[]> {
  if (!dbAvailable()) return scope.teamId ? [scope.teamId] : [];
  const { data, error } = await db()
    .from("teams")
    .select("id")
    .eq("coordinator_id", scope.userId);
  if (error || !data) return scope.teamId ? [scope.teamId] : [];
  const ids = (data || []).map((t: any) => t.id);
  if (scope.teamId && !ids.includes(scope.teamId)) ids.push(scope.teamId);
  return ids;
}

function escapeLike(term: string): string {
  return term.replace(/[%_]/g, (m) => `\\${m}`);
}

export async function getAuditLogs(
  scope: ServiceScope,
  filters: AuditLogFilters
): Promise<{ items: AuditLogItem[]; total: number }> {
  if (!dbAvailable()) return { items: [], total: 0 };

  let q = db().from("audit_logs").select("*", { count: "exact" });

  // Scoping por rol: cada rol ve solo su alcance.
  if (scope.role === "admin") {
    // todo
  } else if (scope.role === "area_manager") {
    q = q.or(`area_id.eq.${scope.areaId || "none"},actor_id.eq.${scope.userId}`);
  } else if (scope.role === "coordinator") {
    const teamIds = await resolveCoordinatorTeamIds(scope);
    if (teamIds.length > 0) {
      const teamOr = teamIds.map((id) => `team_id.eq.${id}`).join(",");
      q = q.or(`${teamOr},actor_id.eq.${scope.userId}`);
    } else {
      q = q.eq("actor_id", scope.userId);
    }
  } else if (scope.role === "supervisor") {
    q = q.or(`team_id.eq.${scope.teamId || "none"},actor_id.eq.${scope.userId}`);
  } else {
    q = q.eq("actor_id", scope.userId);
  }

  if (filters.role) q = q.eq("actor_role", filters.role);
  if (filters.action) q = q.eq("action", filters.action);
  if (filters.entityType) q = q.eq("entity_type", filters.entityType);
  if (filters.from) q = q.gte("created_at", filters.from);
  if (filters.to) q = q.lte("created_at", filters.to);
  if (filters.areaId) q = q.eq("area_id", filters.areaId);
  if (filters.teamId) q = q.eq("team_id", filters.teamId);
  if (filters.q && filters.q.trim()) {
    const term = `%${escapeLike(filters.q.trim().toLowerCase())}%`;
    q = q.or(`actor_email.ilike.${term},actor_id.ilike.${term},entity_label.ilike.${term}`);
  }

  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);
  const offset = Math.max(filters.offset ?? 0, 0);

  const { data, error, count } = await q
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Error al leer el historial: ${error.message}`);

  return {
    items: (data || []).map(mapAuditItem),
    total: count ?? (data || []).length,
  };
}
