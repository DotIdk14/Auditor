import { insforge, insforgeAdmin } from "./insforge.js";
import type { SalesCall, Nota, Objecion } from "../types.js";

function db() {
  return (insforgeAdmin?.database || insforge.database);
}

export async function loadCallsFromSupabase(): Promise<any[]> {
  try {
    const { data, error } = await insforge.database
      .from("auditorias")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.warn("[DB] Could not load calls:", error.message);
      return [];
    }
    return (data || []).map((row: any) => ({
      id: row.id,
      contact_id: row.contact_id || null,
      area_id: row.area_id || null,
      team_id: row.team_id || null,
      status: row.metadata?.status || null,
      metadata: row.metadata,
      score: row.score,
      analysis: row.analysis,
      transcription: row.transcription || [],
    }));
  } catch (err: any) {
    console.warn("[DB] Connection error loading calls:", err.message);
    return [];
  }
}

export async function saveCallToSupabase(call: any): Promise<void> {
  try {
    const metadata = {
      ...(call.metadata || {}),
      status: call.status || call.metadata?.status || "por_auditar",
    };
    const { error } = await insforge.database.from("auditorias").upsert({
      id: call.id,
      contact_id: call.contact_id || call.metadata?.contactId || null,
      area_id: call.area_id || null,
      team_id: call.team_id || null,
      metadata,
      score: call.score || { global: 0 },
      analysis: call.analysis || {},
      transcription: call.transcription || [],
    });
    if (error) console.warn("[DB] Could not save call:", error.message);
  } catch (err: any) {
    console.warn("[DB] Connection error saving call:", err.message);
  }
}

export async function deleteCallFromSupabase(id: string): Promise<void> {
  try {
    const { error } = await insforge.database.from("auditorias").delete().eq("id", id);
    if (error) console.warn("[DB] Could not delete call:", error.message);
  } catch (err: any) {
    console.warn("[DB] Connection error deleting call:", err.message);
  }
}

export async function saveNotaToSupabase(nota: any): Promise<void> {
  try {
    const { error } = await db().from("notas").upsert({
      id: nota.id,
      auditoria_id: nota.auditoriaId,
      supervisor_email: nota.supervisorEmail,
      supervisor_name: nota.supervisorName,
      segment_start: nota.segmentStart,
      segment_end: nota.segmentEnd,
      text: nota.text,
    });
    if (error) console.warn("[DB] Could not save nota:", error.message);
  } catch (err: any) {
    console.warn("[DB] Connection error saving nota:", err.message);
  }
}

export async function loadNotasFromSupabase(auditoriaId: string): Promise<any[]> {
  try {
    const { data, error } = await db()
      .from("notas")
      .select("*")
      .eq("auditoria_id", auditoriaId)
      .order("created_at", { ascending: true });
    if (error) return [];
    return (data || []).map((row: any) => ({
      id: row.id,
      auditoriaId: row.auditoria_id,
      supervisorEmail: row.supervisor_email,
      supervisorName: row.supervisor_name,
      segmentStart: row.segment_start,
      segmentEnd: row.segment_end,
      text: row.text,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

export async function deleteNotaFromSupabase(notaId: string): Promise<void> {
  try {
    const { error } = await db().from("notas").delete().eq("id", notaId);
    if (error) console.warn("[DB] Could not delete nota:", error.message);
  } catch (err: any) {
    console.warn("[DB] Connection error deleting nota:", err.message);
  }
}

export async function saveObjecionToSupabase(objecion: any): Promise<void> {
  try {
    const { error } = await db().from("objeciones").upsert({
      id: objecion.id,
      auditoria_id: objecion.auditoriaId,
      supervisor_email: objecion.supervisorEmail,
      supervisor_name: objecion.supervisorName,
      segment_start: objecion.segmentStart,
      segment_end: objecion.segmentEnd,
      tipo_objecion: objecion.tipoObjecion,
      severidad: objecion.severidad,
      text: objecion.text,
    });
    if (error) console.warn("[DB] Could not save objecion:", error.message);
  } catch (err: any) {
    console.warn("[DB] Connection error saving objecion:", err.message);
  }
}

export async function loadObjecionesFromSupabase(auditoriaId: string): Promise<any[]> {
  try {
    const { data, error } = await db()
      .from("objeciones")
      .select("*")
      .eq("auditoria_id", auditoriaId)
      .order("created_at", { ascending: true });
    if (error) return [];
    return (data || []).map((row: any) => ({
      id: row.id,
      auditoriaId: row.auditoria_id,
      supervisorEmail: row.supervisor_email,
      supervisorName: row.supervisor_name,
      segmentStart: row.segment_start,
      segmentEnd: row.segment_end,
      tipoObjecion: row.tipo_objecion,
      severidad: row.severidad,
      text: row.text,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

export async function deleteObjecionFromSupabase(objecionId: string): Promise<void> {
  try {
    const { error } = await db().from("objeciones").delete().eq("id", objecionId);
    if (error) console.warn("[DB] Could not delete objecion:", error.message);
  } catch (err: any) {
    console.warn("[DB] Connection error deleting objecion:", err.message);
  }
}
