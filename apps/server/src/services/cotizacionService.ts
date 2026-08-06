import { randomUUID } from "crypto";
import { insforge, insforgeAdmin } from "./insforge.js";
import {
  localCotizacionesMemory,
  prependCotizacion,
  setLocalCotizacionesMemory,
} from "../config.js";
import type { Cotizacion, CotizacionCreate, ServiceScope } from "../types.js";

const TABLE = "cotizaciones";

function mapRow(row: any): Cotizacion {
  return {
    id: row.id,
    contact_id: row.contact_id,
    created_by: row.created_by || null,
    created_by_name: row.created_by_name || "Usuario",
    area_id: row.area_id || null,
    team_id: row.team_id || null,
    programa: row.programa || null,
    nivel: row.nivel || null,
    jornada: row.jornada || null,
    lead: row.lead || null,
    zona: row.zona || null,
    fecha_inicio: row.fecha_inicio || null,
    experiencia: row.experiencia || null,
    modalidad: row.modalidad || null,
    beneficios: row.beneficios || {},
    pricing: row.pricing || {},
    resumen_programa: row.resumen_programa || null,
    advisor_name: row.advisor_name || null,
    proposal_status: row.proposal_status || "revision",
    used_speeches: row.used_speeches || [],
    used_objections: row.used_objections || [],
    notes: row.notes || null,
    interaction_type: row.interaction_type || null,
    interaction_tipo: row.interaction_tipo || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function now() {
  return new Date().toISOString();
}

function buildScopeFilter(query: any, scope: ServiceScope) {
  switch (scope.role) {
    case "admin":
      break;
    case "area_manager":
    case "qa":
      query = query.eq("area_id", scope.areaId);
      break;
    case "coordinator":
    case "supervisor":
      query = query.eq("team_id", scope.teamId);
      break;
    case "agent":
      query = query.eq("created_by", scope.userId);
      break;
  }
  return query;
}

export async function getCotizacion(id: string, scope: ServiceScope): Promise<Cotizacion | null> {
  const local = localCotizacionesMemory.find(c => c.id === id);
  if (local) return mapRow(local);

  if (!process.env.INSFORGE_BASE_URL) return null;

  let query = insforge.database.from(TABLE).select("*").eq("id", id);
  query = await buildScopeFilter(query, scope);
  const { data, error } = await query.maybeSingle();
  if (error || !data) {
    if (error) console.warn("[COTIZACIONES] DB get error:", error.message);
    return null;
  }
  return mapRow(data);
}

export async function listCotizacionesByContact(
  contactId: string,
  scope: ServiceScope
): Promise<Cotizacion[]> {
  if (!process.env.INSFORGE_BASE_URL) {
    return localCotizacionesMemory
      .filter(c => c.contact_id === contactId)
      .map(mapRow);
  }

  let query = insforge.database
    .from(TABLE)
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });
  query = await buildScopeFilter(query, scope);

  const { data, error } = await query;
  if (!error && data && data.length > 0) {
    return data.map(mapRow);
  }
  if (error) console.warn("[COTIZACIONES] DB list error:", error.message);

  return localCotizacionesMemory
    .filter(c => c.contact_id === contactId)
    .map(mapRow);
}

export async function createCotizacion(
  input: CotizacionCreate,
  scope: ServiceScope,
  createdByName: string
): Promise<Cotizacion> {
  const ts = now();
  const record: any = {
    id: randomUUID(),
    contact_id: input.contactId,
    created_by: scope.userId,
    created_by_name: createdByName || "Usuario",
    area_id: scope.areaId,
    team_id: scope.teamId,
    programa: input.programa || null,
    nivel: input.nivel || null,
    jornada: input.jornada || null,
    lead: input.lead || null,
    zona: input.zona || null,
    fecha_inicio: input.fechaInicio || null,
    experiencia: input.experiencia || null,
    modalidad: input.modalidad || null,
    beneficios: input.beneficios || {},
    pricing: input.pricing || {},
    resumen_programa: input.resumenPrograma || null,
    advisor_name: input.advisorName || null,
    proposal_status: input.proposalStatus || "revision",
    used_speeches: input.usedSpeeches || [],
    used_objections: input.usedObjections || [],
    notes: input.notes || null,
    interaction_type: input.interactionType || null,
    interaction_tipo: input.interactionTipo || null,
    created_at: ts,
    updated_at: ts,
  };

  // Siempre guardar en memoria local (consistencia inmediata / fallback)
  prependCotizacion(record);

  // Persistir en InsForge DB via admin client (bypass RLS)
  if (process.env.INSFORGE_BASE_URL && insforgeAdmin) {
    const { error } = await insforgeAdmin.database
      .from(TABLE)
      .insert(record)
      .select();
    if (error) {
      console.warn("[COTIZACIONES] DB insert error (non-blocking):", error.message);
    }
  }

  return mapRow(record);
}

export async function deleteCotizacion(
  id: string,
  scope: ServiceScope
): Promise<boolean> {
  const len = localCotizacionesMemory.length;
  setLocalCotizacionesMemory(localCotizacionesMemory.filter(c => c.id !== id));
  if (localCotizacionesMemory.length === len) return false;

  if (process.env.INSFORGE_BASE_URL && insforgeAdmin) {
    const { error } = await insforgeAdmin.database
      .from(TABLE)
      .delete()
      .eq("id", id);
    if (error) console.warn("[COTIZACIONES] DB delete error (non-blocking):", error.message);
  }
  return true;
}

// ─── Startup rehydration ──────────────────────────────────────────

export async function loadCotizacionesFromDB(): Promise<Cotizacion[]> {
  if (!process.env.INSFORGE_BASE_URL) return [];
  const db = insforgeAdmin?.database || insforge.database;
  try {
    const { data, error } = await db
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.warn("[DB] Could not load cotizaciones:", error.message);
      return [];
    }
    return (data || []).map(mapRow);
  } catch (err: any) {
    console.warn("[DB] Connection error loading cotizaciones:", err.message);
    return [];
  }
}
