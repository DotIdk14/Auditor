import { randomUUID } from "crypto";
import { insforge, insforgeAdmin } from "./insforge.js";
import { localContactsMemory, prependContact, updateContactInMemory, removeContactById } from "../config.js";
import type { Contact, ContactCreate, ContactUpdate, ContactFilters, ContactDisposition, PaginatedResponse, ServiceScope } from "../types.js";

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
    disposition: row.disposition || "no_contactado",
    disposition_locked: row.disposition_locked || false,
    assigned_to: row.assigned_to,
    assignedToName: row.assigned_to_name || undefined,
    area_id: row.area_id,
    team_id: row.team_id,
    pipeline_id: row.pipeline_id,
    stage_id: row.stage_id,
    metadata: row.metadata || {},
    last_activity_at: row.last_activity_at,
    callback_at: row.callback_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function now() {
  return new Date().toISOString();
}

// ─── Local memory helpers ──────────────────────────────────────────────────

function localList(filters: ContactFilters, scope?: ServiceScope): PaginatedResponse<Contact> {
  let items = [...localContactsMemory];

  // Apply scope filter (same logic as buildScopeFilter)
  if (scope) {
    switch (scope.role) {
      case "admin":
        break;
      case "area_manager":
      case "coordinator":
        items = items.filter(c => c.area_id === scope.areaId);
        break;
      case "supervisor":
        items = items.filter(c => c.team_id === scope.teamId);
        break;
      case "agent":
        items = items.filter(c => c.assigned_to === scope.userId);
        break;
      case "qa":
        items = items.filter(c => c.area_id === scope.areaId);
        break;
    }
  }

  if (filters.search) {
    const s = filters.search.toLowerCase();
    items = items.filter(c =>
      c.full_name?.toLowerCase().includes(s) ||
      c.phone?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.company?.toLowerCase().includes(s)
    );
  }
  if (filters.status) items = items.filter(c => c.status === filters.status);
  if (filters.source) items = items.filter(c => c.source === filters.source);
  if (filters.disposition) items = items.filter(c => (c.disposition || "no_contactado") === filters.disposition);
  if (filters.assignedTo) items = items.filter(c => c.assigned_to === filters.assignedTo);
  if (filters.stageId) items = items.filter(c => c.stage_id === filters.stageId);
  if (filters.areaId && scope?.role === "admin") items = items.filter(c => c.area_id === filters.areaId);
  if (filters.teamId && (scope?.role === "admin" || scope?.role === "area_manager" || scope?.role === "coordinator")) items = items.filter(c => c.team_id === filters.teamId);

  items.sort((a, b) => {
    const aDate = a.last_activity_at || a.created_at;
    const bDate = b.last_activity_at || b.created_at;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 25;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return {
    data: paged.map(mapRow),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  };
}

function localGet(id: string): Contact | null {
  const found = localContactsMemory.find(c => c.id === id);
  return found ? mapRow(found) : null;
}

function localCreate(input: ContactCreate, userId: string, scope: ServiceScope): Contact {
  const ts = now();
  const record: any = {
    id: randomUUID(),
    full_name: input.fullName,
    phone: input.phone || null,
    email: input.email || null,
    company: input.company || null,
    source: input.source || "manual",
    status: input.status || "lead",
    disposition: input.disposition || "no_contactado",
    disposition_locked: false,
    assigned_to: userId,
    area_id: scope.areaId,
    team_id: scope.teamId,
    pipeline_id: input.pipelineId || null,
    stage_id: input.stageId || null,
    metadata: input.metadata || {},
    last_activity_at: ts,
    callback_at: input.callbackAt || null,
    created_at: ts,
    updated_at: ts,
  };
  prependContact(record);
  return mapRow(record);
}

function localUpdate(id: string, input: ContactUpdate, role?: string): Contact | null {
  const existing = localContactsMemory.find(c => c.id === id);
  if (!existing) return null;

  const updates: Record<string, unknown> = { updated_at: now() };
  if (input.fullName !== undefined) updates.full_name = input.fullName;
  if (input.phone !== undefined) updates.phone = input.phone;
  if (input.email !== undefined) updates.email = input.email;
  if (input.company !== undefined) updates.company = input.company;
  if (input.source !== undefined) updates.source = input.source;
  if (input.status !== undefined) updates.status = input.status;
  if (input.callbackAt !== undefined) updates.callback_at = input.callbackAt;
  if (input.metadata !== undefined) updates.metadata = input.metadata;
  if (input.stageId !== undefined) updates.stage_id = input.stageId;
  if (input.dispositionLocked !== undefined) updates.disposition_locked = input.dispositionLocked;

  if (input.disposition !== undefined) {
    const currentDisposition = existing.disposition || "no_contactado";
    const isLocked = existing.disposition_locked || currentDisposition === "evaluando";
    const isAdmin = role === "admin";

    if (isLocked && !isAdmin && input.disposition !== currentDisposition) {
      console.warn(`[CONTACTS] Disposition locked for ${id}. Cannot change from evaluando without admin role.`);
    } else {
      updates.disposition = input.disposition;
      if (input.disposition === "evaluando") {
        updates.disposition_locked = true;
      }
    }
  }

  if (input.stageId !== undefined || input.status !== undefined || input.disposition !== undefined) {
    updates.last_activity_at = now();
  }
  return updateContactInMemory(id, updates);
}

function localDelete(id: string): boolean {
  return removeContactById(id);
}

// ─── Scope filter (Supabase) ──────────────────────────────────────────────

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

// ─── Enrich contacts with assigned user names ─────────────────────────────

let profilesCache: Map<string, string> | null = null;

export async function loadProfilesCache(): Promise<void> {
  if (!process.env.INSFORGE_BASE_URL) return;
  try {
    const db = insforgeAdmin?.database || insforge.database;
    const { data, error } = await db.from("profiles").select("id, email, display_name");
    if (!error && data) {
      profilesCache = new Map();
      for (const p of data) {
        profilesCache.set(p.id, p.display_name || p.email || p.id);
      }
    }
  } catch { /* ignore */ }
}

async function enrichWithAssignedName(contacts: Contact[]): Promise<Contact[]> {
  if (!process.env.INSFORGE_BASE_URL) return contacts;
  if (!profilesCache) await loadProfilesCache();
  if (!profilesCache) return contacts;
  return contacts.map(c => ({
    ...c,
    assignedToName: c.assignedToName || profilesCache?.get(c.assigned_to) || undefined,
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────

export async function listContacts(
  filters: ContactFilters,
  scope: ServiceScope
): Promise<PaginatedResponse<Contact>> {
  if (!process.env.INSFORGE_BASE_URL) return localList(filters, scope);

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 25;

  // Fetch from DB
  let query = insforge.database.from(TABLE).select("*", { count: "exact" });
  query = buildScopeFilter(query, scope);

  if (filters.search) {
    const s = filters.search.trim();
    query = query.or(
      `full_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%,company.ilike.%${s}%`
    );
  }

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.disposition) query = query.eq("disposition", filters.disposition);
  if (filters.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
  if (filters.stageId) query = query.eq("stage_id", filters.stageId);
  if (filters.areaId && scope.role === "admin") query = query.eq("area_id", filters.areaId);
  if (filters.teamId && ["admin", "area_manager", "coordinator"].includes(scope.role)) {
    query = query.eq("team_id", filters.teamId);
  }

  query = query.order("last_activity_at", { ascending: false, nullsFirst: false });
  query = query.order("created_at", { ascending: false });

  let dbRows: any[] = [];
  let dbCount = 0;
  try {
    const { data, error, count } = await query;
    if (!error) {
      dbRows = data || [];
      dbCount = count || 0;
    } else {
      console.error("[CONTACTS] DB list error:", error.message);
    }
  } catch (err: any) {
    console.error("[CONTACTS] DB list exception:", err.message);
  }

  // Merge with local memory (local takes precedence for same IDs)
  const seenIds = new Set<string>();
  for (const c of localContactsMemory) {
    seenIds.add(c.id);
  }
  const merged = [...localContactsMemory];

  for (const row of dbRows) {
    if (!seenIds.has(row.id)) {
      merged.push(row);
      seenIds.add(row.id);
    }
  }

  // Apply filters on merged set
  let items = merged;
  if (filters.search) {
    const s = filters.search.toLowerCase();
    items = items.filter((c: any) =>
      (c.full_name || "").toLowerCase().includes(s) ||
      (c.phone || "").toLowerCase().includes(s) ||
      (c.email || "").toLowerCase().includes(s) ||
      (c.company || "").toLowerCase().includes(s)
    );
  }
  if (filters.status) items = items.filter((c: any) => c.status === filters.status);
  if (filters.source) items = items.filter((c: any) => c.source === filters.source);
  if (filters.disposition) items = items.filter((c: any) => (c.disposition || "no_contactado") === filters.disposition);
  if (filters.assignedTo) items = items.filter((c: any) => c.assigned_to === filters.assignedTo);
  if (filters.stageId) items = items.filter((c: any) => c.stage_id === filters.stageId);
  if (filters.areaId) items = items.filter((c: any) => c.area_id === filters.areaId);
  if (filters.teamId) items = items.filter((c: any) => c.team_id === filters.teamId);

  items.sort((a: any, b: any) => {
    const aDate = a.last_activity_at || a.created_at;
    const bDate = b.last_activity_at || b.created_at;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  const offset = (page - 1) * pageSize;
  const paged = items.slice(offset, offset + pageSize);
  const enriched = await enrichWithAssignedName(paged.map(mapRow));

  return {
    data: enriched,
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  };
}

export async function getContact(
  id: string,
  scope: ServiceScope
): Promise<Contact | null> {
  // Check local memory first
  const local = localGet(id);
  if (local) return local;

  if (!process.env.INSFORGE_BASE_URL) return null;

  let query = insforge.database.from(TABLE).select("*").eq("id", id);
  query = buildScopeFilter(query, scope);

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("[CONTACTS] DB get error:", error.message);
    return null;
  }
  if (!data) return null;
  const enriched = await enrichWithAssignedName([mapRow(data)]);
  return enriched[0] || null;
}

export async function createContact(
  input: ContactCreate,
  userId: string,
  scope: ServiceScope
): Promise<Contact> {
  // Always write to local memory first (immediate consistency)
  const local = localCreate(input, userId, scope);

  // Also persist in InsForge DB via admin client (bypass RLS)
  if (process.env.INSFORGE_BASE_URL && insforgeAdmin) {
    const record: Record<string, unknown> = {
      id: local.id,
      full_name: local.full_name,
      phone: local.phone,
      email: local.email,
      company: local.company,
      source: local.source,
      status: local.status,
      disposition: local.disposition,
      assigned_to: local.assigned_to,
      area_id: local.area_id,
      team_id: local.team_id,
      pipeline_id: input.pipelineId || null,
      stage_id: input.stageId || null,
      metadata: local.metadata,
      last_activity_at: local.last_activity_at,
      callback_at: local.callback_at,
    };

    const { error } = await insforgeAdmin.database
      .from(TABLE)
      .insert(record)
      .select();

    if (error) {
      console.error("[CONTACTS] DB insert error (non-blocking):", JSON.stringify({ code: error.code, message: error.message }));
    }
  }

  return local;
}

export async function updateContact(
  id: string,
  input: ContactUpdate,
  scope: ServiceScope
): Promise<Contact | null> {
  // Update local memory first
  const local = localUpdate(id, input, scope.role);
  if (!local) return null;

  // Also persist in InsForge DB via admin client
  if (process.env.INSFORGE_BASE_URL && insforgeAdmin) {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.fullName !== undefined) updates.full_name = input.fullName;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.email !== undefined) updates.email = input.email;
    if (input.company !== undefined) updates.company = input.company;
    if (input.source !== undefined) updates.source = input.source;
    if (input.status !== undefined) updates.status = input.status;
    if (input.callbackAt !== undefined) updates.callback_at = input.callbackAt;
    if (input.metadata !== undefined) updates.metadata = input.metadata;
    if (input.stageId !== undefined) updates.stage_id = input.stageId;
    if (input.disposition !== undefined) updates.disposition = input.disposition;
    if (input.dispositionLocked !== undefined) updates.disposition_locked = input.dispositionLocked;
    if (input.stageId !== undefined || input.status !== undefined || input.disposition !== undefined) {
      updates.last_activity_at = new Date().toISOString();
    }

    const { error } = await insforgeAdmin.database
      .from(TABLE)
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      console.error("[CONTACTS] DB update error (non-blocking):", JSON.stringify({ code: error.code, message: error.message }));
    }
  }

  return local;
}

export async function updateContactStage(
  id: string,
  stageId: string,
  scope: ServiceScope
): Promise<Contact | null> {
  // Update local memory first
  const local = localUpdate(id, { stageId });
  if (!local) return null;

  // Also persist in InsForge DB via admin client
  if (process.env.INSFORGE_BASE_URL && insforgeAdmin) {
    const { error } = await insforgeAdmin.database
      .from(TABLE)
      .update({
        stage_id: stageId,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      console.error("[CONTACTS] DB stage update error (non-blocking):", JSON.stringify({ code: error.code, message: error.message }));
    }
  }

  return local;
}

export async function deleteContact(
  id: string,
  scope: ServiceScope
): Promise<boolean> {
  // Delete from local memory first
  const local = localDelete(id);
  if (!local) return false;

  // Also delete from InsForge DB via admin client
  if (process.env.INSFORGE_BASE_URL && insforgeAdmin) {
    const { error } = await insforgeAdmin.database.from(TABLE).delete().eq("id", id);
    if (error) {
      console.error("[CONTACTS] DB delete error (non-blocking):", JSON.stringify({ code: error.code, message: error.message }));
    }
  }

  return true;
}

export async function findContactByPhoneOrEmail(
  phone?: string | null,
  email?: string | null,
  scope?: ServiceScope
): Promise<Contact | null> {
  // Check local memory first
  const local = localContactsMemory.find(c =>
    (phone && c.phone === phone) || (email && c.email === email)
  );
  if (local) return mapRow(local);

  if (!process.env.INSFORGE_BASE_URL) return null;
  if (!phone && !email) return null;

  let query = insforge.database.from(TABLE).select("*");

  if (phone && email) {
    query = query.or(`phone.eq.${phone},email.eq.${email}`);
  } else if (phone) {
    query = query.eq("phone", phone);
  } else if (email) {
    query = query.eq("email", email);
  }

  if (scope) query = buildScopeFilter(query, scope);

  const { data, error } = await query.limit(1).maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}

// ─── Link Audit to Contact ──────────────────────────────────────────────

export interface LinkAuditResult {
  contact: Contact;
  auditId: string;
  previousDisposition: ContactDisposition;
}

export async function linkAuditToContact(
  contactId: string,
  auditId: string,
  tipificacion: "positiva" | "negativa",
  scope: ServiceScope
): Promise<LinkAuditResult> {
  const contact = await getContact(contactId, scope);
  if (!contact) throw new Error("Contacto no encontrado");

  const previousDisposition = contact.disposition;
  let newDisposition: ContactDisposition = contact.disposition;
  let newLocked = contact.disposition_locked;

  if (tipificacion === "positiva") {
    newDisposition = "evaluando";
    newLocked = true;
  } else {
    // negative: only change if not locked
    if (!contact.disposition_locked) {
      newDisposition = "cuelgue";
    }
  }

  // Update the audit's contact_id (always in local, best-effort in DB)
  {
    const { localCallsMemory } = await import("../config.js");
    const call = localCallsMemory.find((c: any) => c.id === auditId);
    if (call) {
      call.contact_id = contactId;
      if (call.metadata) call.metadata.contactId = contactId;
    }
  }
  if (process.env.INSFORGE_BASE_URL && insforgeAdmin) {
    const { error: auditErr } = await insforgeAdmin.database
      .from("auditorias")
      .update({ contact_id: contactId })
      .eq("id", auditId);
    if (auditErr) console.warn("[LINK_AUDIT] Error updating audit:", auditErr.message);
  }

  // Update contact disposition
  const updated = await updateContact(
    contactId,
    { disposition: newDisposition, dispositionLocked: newLocked },
    scope
  );

  return {
    contact: updated || contact,
    auditId,
    previousDisposition,
  };
}

export async function getUnlinkedAudits(scope: ServiceScope): Promise<any[]> {
  if (!process.env.INSFORGE_BASE_URL) {
    // Local: return calls from memory that have no contact_id
    const { localCallsMemory } = await import("../config.js");
    return localCallsMemory
      .filter((c: any) => !c.contact_id && c.status === "completada")
      .map((c: any) => ({
        id: c.id,
        title: c.metadata?.fileName || c.rawTitle || `Auditoría ${c.id.slice(0, 8)}`,
        agent: c.agent || c.metadata?.agentName || "Desconocido",
        score: c.score,
        date: c.date || c.created_at,
        created_at: c.created_at || c.date,
      }));
  }

  const { data, error } = await insforge.database
    .from("auditorias")
    .select("id, metadata, score, created_at")
    .is("contact_id", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(`Error al obtener auditorías sin vincular: ${error.message}`);

  return (data || []).map((a: any) => ({
    id: a.id,
    title: a.metadata?.fileName || `Auditoría ${a.id.slice(0, 8)}`,
    agent: a.metadata?.agentName || "Desconocido",
    score: a.score != null ? (typeof a.score === "object" ? (a.score as any).global ?? null : a.score) : null,
    date: a.created_at,
    created_at: a.created_at,
  }));
}

// ─── Startup rehydration ──────────────────────────────────────────

export async function loadContactsFromDB(): Promise<Contact[]> {
  if (!process.env.INSFORGE_BASE_URL) return [];
  const db = insforgeAdmin?.database || insforge.database;
  try {
    const { data, error } = await db
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.warn("[DB] Could not load contacts:", error.message);
      return [];
    }
    return (data || []).map(mapRow);
  } catch (err: any) {
    console.warn("[DB] Connection error loading contacts:", err.message);
    return [];
  }
}

export async function loadInteractionsFromDB(): Promise<any[]> {
  if (!process.env.INSFORGE_BASE_URL) return [];
  const db = insforgeAdmin?.database || insforge.database;
  try {
    const { data, error } = await db
      .from("interactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.warn("[DB] Could not load interactions:", error.message);
      return [];
    }
    return (data || []).map((row: any) => ({
      id: row.id,
      contact_id: row.contact_id,
      type: row.type,
      tipificacion: row.tipificacion,
      notes: row.notes || null,
      files: row.files || [],
      created_by: row.created_by || null,
      created_by_name: row.created_by_name || "Usuario",
      created_at: row.created_at,
    }));
  } catch (err: any) {
    console.warn("[DB] Connection error loading interactions:", err.message);
    return [];
  }
}
