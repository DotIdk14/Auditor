import { insforge } from "./insforge.js";
import type { Task, TaskCreate, TaskUpdate, TaskFilters, PaginatedResponse } from "../types.js";
import type { ServiceScope } from "../types.js";

const TABLE = "tasks";

function mapRow(row: any): Task {
  return {
    id: row.id,
    contact_id: row.contact_id,
    title: row.title,
    description: row.description,
    assigned_to: row.assigned_to,
    created_by: row.created_by,
    due_date: row.due_date,
    completed_at: row.completed_at,
    status: row.status,
    priority: row.priority,
    type: row.type,
    area_id: row.area_id,
    team_id: row.team_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function buildScopeFilter(query: any, scope: ServiceScope) {
  switch (scope.role) {
    case "admin":
      break;
    case "area_manager":
    case "coordinator":
      query = query.eq("area_id", scope.areaId);
      break;
    case "supervisor":
      query = query.eq("team_id", scope.teamId);
      break;
    case "agent":
      query = query.eq("assigned_to", scope.userId);
      break;
    case "qa":
      query = query.eq("area_id", scope.areaId);
      break;
  }
  return query;
}

export async function listTasks(
  filters: TaskFilters,
  scope: ServiceScope
): Promise<PaginatedResponse<Task>> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 25;
  const offset = (page - 1) * pageSize;

  let query = insforge.database.from(TABLE).select("*", { count: "exact" });

  query = buildScopeFilter(query, scope);

  if (filters.contactId) query = query.eq("contact_id", filters.contactId);
  if (filters.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.dueDateBefore) query = query.lte("due_date", filters.dueDateBefore);
  if (filters.dueDateAfter) query = query.gte("due_date", filters.dueDateAfter);

  query = query.order("due_date", { ascending: true, nullsFirst: false });
  query = query.order("priority", { ascending: false });

  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Error al listar tareas: ${error.message}`);

  return {
    data: (data || []).map(mapRow),
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getTask(
  id: string,
  scope: ServiceScope
): Promise<Task | null> {
  let query = insforge.database.from(TABLE).select("*").eq("id", id);
  query = buildScopeFilter(query, scope);

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Error al obtener tarea: ${error.message}`);
  }

  return data ? mapRow(data) : null;
}

export async function createTask(
  input: TaskCreate,
  userId: string,
  scope: ServiceScope
): Promise<Task> {
  // Get contact's area/team to inherit
  const { data: contact } = await insforge.database
    .from("contacts")
    .select("area_id, team_id")
    .eq("id", input.contactId)
    .single();

  const record: Record<string, unknown> = {
    contact_id: input.contactId,
    title: input.title,
    description: input.description || null,
    assigned_to: input.assignedTo,
    created_by: userId,
    due_date: input.dueDate || null,
    status: "pending",
    priority: input.priority || "medium",
    type: input.type || "follow_up",
    area_id: contact?.area_id || scope.areaId,
    team_id: contact?.team_id || scope.teamId,
  };

  const { data, error } = await insforge.database
    .from(TABLE)
    .insert(record)
    .select()
    .single();

  if (error) {
    console.error("[TASKS] InsForge insert error:", JSON.stringify({ code: error.code, message: error.message, details: error.details, hint: error.hint }));
    throw new Error(`Error al crear tarea: ${error.message}`);
  }

  // Update contact's last_activity_at so it appears at the top of the list
  try {
    await insforge.database
      .from("contacts")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", input.contactId);
  } catch (updateErr: any) {
    // Non-critical: log but don't fail the task creation
    console.warn("[TASKS] Could not update contact last_activity_at:", updateErr.message);
  }

  return mapRow(data);
}

export async function updateTask(
  id: string,
  input: TaskUpdate,
  scope: ServiceScope
): Promise<Task | null> {
  const existing = await getTask(id, scope);
  if (!existing) return null;

  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.assignedTo !== undefined) updates.assigned_to = input.assignedTo;
  if (input.dueDate !== undefined) updates.due_date = input.dueDate;
  if (input.status !== undefined) updates.status = input.status;
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.type !== undefined) updates.type = input.type;

  // Auto-set completed_at
  if (input.status === "completed" && !existing.completed_at) {
    updates.completed_at = new Date().toISOString();
  } else if (input.status !== undefined && input.status !== "completed") {
    updates.completed_at = null;
  }

  const { data, error } = await insforge.database
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Error al actualizar tarea: ${error.message}`);
  return data ? mapRow(data) : null;
}

export async function deleteTask(
  id: string,
  scope: ServiceScope
): Promise<boolean> {
  const existing = await getTask(id, scope);
  if (!existing) return false;

  const { error } = await insforge.database.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(`Error al eliminar tarea: ${error.message}`);
  return true;
}
