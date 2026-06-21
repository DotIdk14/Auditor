import { supabase, supabaseAdmin } from "../config.js";
import type { Contact, ContactCreate, ContactUpdate, ContactFilters, PaginatedResponse, ServiceScope } from "../types.js";

const TABLE = "contacts";

function mapRow(row: any): Contact {
  return {
    id: row.id,
    full_name: row.full_name,
    phone: row.phone,
    email: row.email,
    company: row.company,
    source: row.source,
    status: row.status,
    assigned_to: row.assigned_to,
    area_id: row.area_id,
    team_id: row.team_id,
    pipeline_id: row.pipeline_id,
    stage_id: row.stage_id,
    metadata: row.metadata || {},
    last_activity_at: row.last_activity_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Build a Supabase query with RLS-aware filters based on user scope.
 * This is a backend complement to PostgreSQL RLS (defense in depth).
 */
function buildScopeFilter(query: any, scope: ServiceScope) {
  switch (scope.role) {
    case "admin":
      // Admin sees all - no filter needed
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

export async function listContacts(
  filters: ContactFilters,
  scope: ServiceScope
): Promise<PaginatedResponse<Contact>> {
  const client = supabaseAdmin || supabase;
  if (!client) throw new Error("Supabase no disponible");

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 25;
  const offset = (page - 1) * pageSize;

  let query = client.from(TABLE).select("*", { count: "exact" });

  // Apply scope filter
  query = buildScopeFilter(query, scope);

  // Apply search filter (full-text search across name, phone, email, company)
  if (filters.search) {
    const s = filters.search.trim();
    query = query.or(
      `full_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%,company.ilike.%${s}%`
    );
  }

  // Apply specific filters
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
  if (filters.stageId) query = query.eq("stage_id", filters.stageId);
  if (filters.areaId && (scope.role === "admin")) query = query.eq("area_id", filters.areaId);
  if (filters.teamId && (scope.role === "admin" || scope.role === "area_manager" || scope.role === "coordinator")) {
    query = query.eq("team_id", filters.teamId);
  }

  // Order by last activity (most recent first), fallback to created_at
  query = query.order("last_activity_at", { ascending: false, nullsFirst: false });
  query = query.order("created_at", { ascending: false });

  // Pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Error al listar contactos: ${error.message}`);

  return {
    data: (data || []).map(mapRow),
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getContact(
  id: string,
  scope: ServiceScope
): Promise<Contact | null> {
  const client = supabaseAdmin || supabase;
  if (!client) throw new Error("Supabase no disponible");

  let query = client.from(TABLE).select("*").eq("id", id);
  query = buildScopeFilter(query, scope);

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw new Error(`Error al obtener contacto: ${error.message}`);
  }

  return data ? mapRow(data) : null;
}

export async function createContact(
  input: ContactCreate,
  userId: string,
  scope: ServiceScope
): Promise<Contact> {
  const client = supabaseAdmin || supabase;
  if (!client) throw new Error("Supabase no disponible");

  // Derive area_id and team_id from the creating user's scope
  const areaId = scope.areaId;
  const teamId = scope.teamId;

  // Resolve userId to a valid UUID if it's an email (password-based auth)
  let resolvedUserId = userId;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

  if (!isUuid && supabaseAdmin) {
    try {
      // Step 1: Try profiles table first
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", userId)
        .maybeSingle();

      if (profile?.id) {
        resolvedUserId = profile.id;
      } else {
        // Step 2: Try auth.users via admin API
        const { data: authUsers, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
        if (!authErr && authUsers?.users) {
          const matched = authUsers.users.find(
            (u: any) => u.email?.toLowerCase() === userId.toLowerCase()
          );
          if (matched?.id) {
            resolvedUserId = matched.id;
          }
        }
      }
    } catch {
      // Step 3: Last resort — try to find ANY admin user to use as fallback
      try {
        const { data: anyAdmin } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("role", "admin")
          .limit(1)
          .maybeSingle();
        if (anyAdmin?.id) {
          resolvedUserId = anyAdmin.id;
          console.warn(`[CONTACTS] userId "${userId}" no es UUID ni existe en auth — usando admin fallback: ${resolvedUserId}`);
        }
      } catch {
        // Cannot resolve; will let Supabase reject with a clear error
        console.warn(`[CONTACTS] Cannot resolve userId "${userId}" to UUID — insert may fail`);
      }
    }
  }

  const record: Record<string, unknown> = {
    full_name: input.fullName,
    phone: input.phone || null,
    email: input.email || null,
    company: input.company || null,
    source: input.source || "manual",
    status: input.status || "lead",
    assigned_to: resolvedUserId,
    area_id: areaId,
    team_id: teamId,
    pipeline_id: input.pipelineId || null,
    stage_id: input.stageId || null,
    metadata: input.metadata || {},
    last_activity_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from(TABLE)
    .insert(record)
    .select()
    .single();

  if (error) throw new Error(`Error al crear contacto: ${error.message}`);
  return mapRow(data);
}

export async function updateContact(
  id: string,
  input: ContactUpdate,
  scope: ServiceScope
): Promise<Contact | null> {
  const client = supabaseAdmin || supabase;
  if (!client) throw new Error("Supabase no disponible");

  // First verify the contact exists and is accessible
  const existing = await getContact(id, scope);
  if (!existing) return null;

  const updates: Record<string, unknown> = {};
  if (input.fullName !== undefined) updates.full_name = input.fullName;
  if (input.phone !== undefined) updates.phone = input.phone;
  if (input.email !== undefined) updates.email = input.email;
  if (input.company !== undefined) updates.company = input.company;
  if (input.source !== undefined) updates.source = input.source;
  if (input.status !== undefined) updates.status = input.status;
  if (input.metadata !== undefined) updates.metadata = input.metadata;
  if (input.stageId !== undefined) updates.stage_id = input.stageId;

  // Update last_activity_at on meaningful changes
  if (input.stageId !== undefined || input.status !== undefined) {
    updates.last_activity_at = new Date().toISOString();
  }

  const { data, error } = await client
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Error al actualizar contacto: ${error.message}`);
  return mapRow(data);
}

export async function updateContactStage(
  id: string,
  stageId: string,
  scope: ServiceScope
): Promise<Contact | null> {
  const client = supabaseAdmin || supabase;
  if (!client) throw new Error("Supabase no disponible");

  const existing = await getContact(id, scope);
  if (!existing) return null;

  const { data, error } = await client
    .from(TABLE)
    .update({
      stage_id: stageId,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Error al mover contacto: ${error.message}`);
  return mapRow(data);
}

export async function deleteContact(
  id: string,
  scope: ServiceScope
): Promise<boolean> {
  const client = supabaseAdmin || supabase;
  if (!client) throw new Error("Supabase no disponible");

  const existing = await getContact(id, scope);
  if (!existing) return false;

  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(`Error al eliminar contacto: ${error.message}`);
  return true;
}

export async function findContactByPhoneOrEmail(
  phone?: string | null,
  email?: string | null,
  scope?: ServiceScope
): Promise<Contact | null> {
  const client = supabaseAdmin || supabase;
  if (!client) return null;
  if (!phone && !email) return null;

  let query = client.from(TABLE).select("*");

  if (phone && email) {
    query = query.or(`phone.eq.${phone},email.eq.${email}`);
  } else if (phone) {
    query = query.eq("phone", phone);
  } else if (email) {
    query = query.eq("email", email);
  }

  if (scope) {
    query = buildScopeFilter(query, scope);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error || !data) return null;
  return mapRow(data);
}
