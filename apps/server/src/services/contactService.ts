import { randomUUID } from "crypto";
import { insforge } from "./insforge.js";
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

function localList(filters: ContactFilters): PaginatedResponse<Contact> {
  let items = [...localContactsMemory];

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
  if (filters.areaId) items = items.filter(c => c.area_id === filters.areaId);
  if (filters.teamId) items = items.filter(c => c.team_id === filters.teamId);

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

// ─── Public API ───────────────────────────────────────────────────────────

export async function listContacts(
  filters: ContactFilters,
  scope: ServiceScope
): Promise<PaginatedResponse<Contact>> {
  if (!process.env.INSFORGE_BASE_URL) return localList(filters);

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 25;
  const offset = (page - 1) * pageSize;

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
  if (!process.env.INSFORGE_BASE_URL) return localGet(id);

  let query = insforge.database.from(TABLE).select("*").eq("id", id);
  query = buildScopeFilter(query, scope);

  const { data, error } = await query.single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Error al obtener contacto: ${error.message}`);
  }
  return data ? mapRow(data) : null;
}

export async function createContact(
  input: ContactCreate,
  userId: string,
  scope: ServiceScope
): Promise<Contact> {
  if (!process.env.INSFORGE_BASE_URL) return localCreate(input, userId, scope);

  const areaId = scope.areaId;
  const teamId = scope.teamId;
  const resolvedUserId = userId;

  const record: Record<string, unknown> = {
    full_name: input.fullName,
    phone: input.phone || null,
    email: input.email || null,
    company: input.company || null,
    source: input.source || "manual",
    status: input.status || "lead",
    disposition: input.disposition || "no_contactado",
    assigned_to: resolvedUserId,
    area_id: areaId,
    team_id: teamId,
    pipeline_id: input.pipelineId || null,
    stage_id: input.stageId || null,
    metadata: input.metadata || {},
    last_activity_at: new Date().toISOString(),
    callback_at: input.callbackAt || null,
  };

  const { data, error } = await insforge.database
    .from(TABLE)
    .insert([record])
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
  if (!process.env.INSFORGE_BASE_URL) return localUpdate(id, input, scope.role);

  const existing = await getContact(id, scope);
  if (!existing) return null;

  const updates: Record<string, unknown> = {};
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
    const isAdmin = scope.role === "admin";

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
    updates.last_activity_at = new Date().toISOString();
  }

  const { data, error } = await insforge.database
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
  if (!process.env.INSFORGE_BASE_URL) return localUpdate(id, { stageId });

  const existing = await getContact(id, scope);
  if (!existing) return null;

  const { data, error } = await insforge.database
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
  if (!process.env.INSFORGE_BASE_URL) return localDelete(id);

  const existing = await getContact(id, scope);
  if (!existing) return false;

  const { error } = await insforge.database.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(`Error al eliminar contacto: ${error.message}`);
  return true;
}

export async function findContactByPhoneOrEmail(
  phone?: string | null,
  email?: string | null,
  scope?: ServiceScope
): Promise<Contact | null> {
  if (!process.env.INSFORGE_BASE_URL) {
    const found = localContactsMemory.find(c =>
      (phone && c.phone === phone) || (email && c.email === email)
    );
    return found ? mapRow(found) : null;
  }

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

  // Update the audit's contact_id
  if (process.env.INSFORGE_BASE_URL) {
    const { error: auditErr } = await insforge.database
      .from("auditorias")
      .update({ contact_id: contactId })
      .eq("id", auditId);
    if (auditErr) console.warn("[LINK_AUDIT] Error updating audit:", auditErr.message);
  } else {
    // Local: update in-memory calls
    const { localCallsMemory } = await import("../config.js");
    const call = localCallsMemory.find((c: any) => c.id === auditId);
    if (call) {
      call.contact_id = contactId;
      if (call.metadata) call.metadata.contactId = contactId;
    }
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
