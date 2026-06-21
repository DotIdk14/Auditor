import { supabase } from "../config.js";

// ── Call persistence ──────────────────────────────────────────────

export async function loadCallsFromSupabase(): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("auditorias")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.warn("[SUPABASE] Could not load calls:", error.message);
      return [];
    }
    console.log(`[SUPABASE] Loaded ${data.length} calls from database.`);
    return (data || []).map((row: any) => ({
      id: row.id,
      metadata: row.metadata,
      score: row.score,
      analysis: row.analysis,
      transcription: row.transcription || [],
    }));
  } catch (err: any) {
    console.warn("[SUPABASE] Connection error loading calls:", err.message);
    return [];
  }
}

export async function saveCallToSupabase(call: any): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("auditorias").upsert({
      id: call.id,
      metadata: call.metadata,
      score: call.score,
      analysis: call.analysis,
      transcription: call.transcription || [],
    });
    if (error) console.warn("[SUPABASE] Could not save call:", error.message);
  } catch (err: any) {
    console.warn("[SUPABASE] Connection error saving call:", err.message);
  }
}

export async function deleteCallFromSupabase(id: string): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("auditorias").delete().eq("id", id);
    if (error) console.warn("[SUPABASE] Could not delete call:", error.message);
  } catch (err: any) {
    console.warn("[SUPABASE] Connection error deleting call:", err.message);
  }
}

// ── Notas persistence ─────────────────────────────────────────────

export async function saveNotaToSupabase(nota: any): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("notas").upsert({
      id: nota.id,
      auditoria_id: nota.auditoriaId,
      supervisor_email: nota.supervisorEmail,
      supervisor_name: nota.supervisorName,
      segment_start: nota.segmentStart,
      segment_end: nota.segmentEnd,
      text: nota.text,
    });
    if (error) console.warn("[SUPABASE] Could not save nota:", error.message);
  } catch (err: any) {
    console.warn("[SUPABASE] Connection error saving nota:", err.message);
  }
}

export async function loadNotasFromSupabase(auditoriaId: string): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
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
  if (!supabase) return;
  try {
    const { error } = await supabase.from("notas").delete().eq("id", notaId);
    if (error) console.warn("[SUPABASE] Could not delete nota:", error.message);
  } catch (err: any) {
    console.warn("[SUPABASE] Connection error deleting nota:", err.message);
  }
}

// ── Objeciones persistence ─────────────────────────────────────────

export async function saveObjecionToSupabase(objecion: any): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("objeciones").upsert({
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
    if (error) console.warn("[SUPABASE] Could not save objecion:", error.message);
  } catch (err: any) {
    console.warn("[SUPABASE] Connection error saving objecion:", err.message);
  }
}

export async function loadObjecionesFromSupabase(auditoriaId: string): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
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
  if (!supabase) return;
  try {
    const { error } = await supabase.from("objeciones").delete().eq("id", objecionId);
    if (error) console.warn("[SUPABASE] Could not delete objecion:", error.message);
  } catch (err: any) {
    console.warn("[SUPABASE] Connection error deleting objecion:", err.message);
  }
}
