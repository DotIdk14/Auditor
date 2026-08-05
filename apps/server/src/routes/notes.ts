import { randomUUID } from "crypto";
import type { Express } from "express";
import { authenticateToken, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { localNotasMemory, localQuickNotesMemory, localCallsMemory, setLocalQuickNotesMemory } from "../config.js";
import { insforge, insforgeAdmin } from "../services/insforge.js";
import { resolveManagedTeamIds } from "../services/userService.js";
import {
  saveNotaToSupabase,
  loadNotasFromSupabase,
  deleteNotaFromSupabase,
} from "../services/supabase.js";

interface NotaWithCall {
  id: string;
  auditoriaId: string | null;
  supervisorEmail: string;
  supervisorName: string;
  segmentStart: number | null;
  segmentEnd: number | null;
  text: string;
  createdAt: string;
  type: string;
  callName: string | null;
}

/**
 * Scope notes to the caller's hierarchy:
 * - admin: all notes
 * - area_manager: audit notes of calls in their area
 * - coordinator: audit notes of calls in their managed teams
 * - supervisor: audit notes of calls in their team
 * - agent / qa: only their own notes
 * Quick notes (not tied to a call) are personal: only the author (or admin).
 */
async function filterNotasByScope(
  scope: { role: string; areaId: string | null; teamId: string | null; userId: string } | undefined,
  userEmail: string | undefined,
  notas: NotaWithCall[],
): Promise<NotaWithCall[]> {
  if (!scope || scope.role === "admin") return notas;

  const callMap = new Map<string, { areaId: string | null; teamId: string | null }>();
  localCallsMemory.forEach((call: any) => {
    callMap.set(call.id, {
      areaId: call.area_id ?? call.metadata?.areaId ?? null,
      teamId: call.team_id ?? call.metadata?.teamId ?? null,
    });
  });
  try {
    const db = insforgeAdmin?.database || insforge.database;
    const { data } = await db.from("auditorias").select("id, area_id, team_id");
    (data || []).forEach((c: any) => {
      callMap.set(c.id, { areaId: c.area_id ?? null, teamId: c.team_id ?? null });
    });
  } catch {}

  let managedTeamIds: string[] = [];
  if (scope.role === "coordinator") {
    managedTeamIds = await resolveManagedTeamIds({ role: "coordinator", areaId: scope.areaId, teamId: scope.teamId, userId: scope.userId });
  }

  return notas.filter((n) => {
    const type = n.type || (n.auditoriaId ? "audit" : "quick");
    if (type === "quick") {
      return n.supervisorEmail === userEmail;
    }
    const call = n.auditoriaId ? callMap.get(n.auditoriaId) : null;
    if (scope.role === "area_manager") {
      return !!call && call.areaId === scope.areaId;
    }
    if (scope.role === "coordinator") {
      return !!call && !!call.teamId && managedTeamIds.includes(call.teamId);
    }
    if (scope.role === "supervisor") {
      return !!call && scope.teamId != null && call.teamId === scope.teamId;
    }
    // agent / qa / otros: solo las propias
    return n.supervisorEmail === userEmail;
  });
}

/**
 * Find who owns a note (author email) from memory or DB.
 */
async function findNotaOwner(id: string): Promise<string | null> {
  const mem = [...localQuickNotesMemory];
  for (const [, notas] of localNotasMemory) mem.push(...notas);
  const found = mem.find((n: any) => n.id === id);
  if (found?.supervisorEmail) return found.supervisorEmail;
  try {
    const db = insforgeAdmin?.database || insforge.database;
    const { data } = await db.from("notas").select("supervisor_email").eq("id", id).maybeSingle();
    return data?.supervisor_email ?? null;
  } catch {
    return null;
  }
}

/**
 * Only the author or an admin may delete a note.
 */
async function canDeleteNota(req: AuthenticatedRequest, notaId: string): Promise<boolean> {
  if (req.user?.role === "admin") return true;
  const owner = await findNotaOwner(notaId);
  if (!owner) return true; // idempotent delete
  return owner === req.user?.email;
}

export default function (app: Express): void {
  // POST /api/notas — Create a quick note (not tied to a specific call)
  app.post("/api/notas", authenticateToken, injectScope, (req: AuthenticatedRequest, res) => {
    const supervisorEmail = req.user?.email;
    const { supervisorName, text } = req.body;

    if (!supervisorEmail || !text) {
      return res.status(400).json({ error: "supervisorEmail and text are required." });
    }

    const nota = {
      id: `quick_${Date.now()}_${randomUUID().split("-")[0]}`,
      auditoriaId: null,
      supervisorEmail,
      supervisorName: supervisorName || supervisorEmail.split("@")[0],
      segmentStart: null,
      segmentEnd: null,
      text,
      createdAt: new Date().toISOString(),
      type: "quick",
      callName: null,
    };

    localQuickNotesMemory.push(nota);
    saveNotaToSupabase(nota);
    return res.status(201).json(nota);
  });

  // GET /api/notas — Get all notes across all calls + quick notes (scoped by role)
  app.get("/api/notas", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    const callMap = new Map<string, string>();
    localCallsMemory.forEach((call: any) => {
      callMap.set(call.id, call.metadata?.fileName || call.id);
    });

    const allNotas: NotaWithCall[] = [];

    // Audit notes from local memory
    localNotasMemory.forEach((notas, callId) => {
      const callName = callMap.get(callId) || callId;
      notas.forEach((n: any) => {
        allNotas.push({ ...n, callName, type: n.type || "audit" });
      });
    });

    // Audit notes from DB
    try {
      const db = insforgeAdmin?.database || insforge.database;
      const { data, error } = await db.from("notas").select("*");
      if (!error && data) {
        const existingIds = new Set(allNotas.map((n: any) => n.id));
        data.forEach((row: any) => {
          if (!existingIds.has(row.id)) {
            const callName = callMap.get(row.auditoria_id) || row.auditoria_id;
            allNotas.push({
              id: row.id,
              auditoriaId: row.auditoria_id,
              supervisorEmail: row.supervisor_email,
              supervisorName: row.supervisor_name,
              segmentStart: row.segment_start,
              segmentEnd: row.segment_end,
              text: row.text,
              createdAt: row.created_at,
              callName,
              type: row.type || (row.auditoria_id ? "audit" : "quick"),
            });
          }
        });
      }
    } catch {}

    // Quick notes (free-form, not tied to a call)
    localQuickNotesMemory.forEach((n: any) => {
      allNotas.push({ ...n, type: n.type || "quick", callName: null });
    });

    const scoped = await filterNotasByScope(req.scope, req.user?.email, allNotas);
    scoped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(scoped);
  });

  // POST /api/llamadas/:id/notas — Add a note to a specific call
  app.post("/api/llamadas/:id/notas", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    const auditoriaId = req.params.id;
    const supervisorEmail = req.user?.email;
    const { supervisorName, segmentStart, segmentEnd, text } = req.body;

    if (!supervisorEmail || !text || segmentStart === undefined || segmentEnd === undefined) {
      return res.status(400).json({ error: "supervisorEmail, text, segmentStart, and segmentEnd are required." });
    }

    const nota = {
      id: `nota_${Date.now()}_${randomUUID().split("-")[0]}`,
      auditoriaId,
      supervisorEmail,
      supervisorName: supervisorName || supervisorEmail.split("@")[0],
      segmentStart,
      segmentEnd,
      text,
      createdAt: new Date().toISOString(),
      type: "audit",
    };

    if (!localNotasMemory.has(auditoriaId)) {
      localNotasMemory.set(auditoriaId, []);
    }
    localNotasMemory.get(auditoriaId)!.push(nota);

    saveNotaToSupabase(nota);
    return res.status(201).json(nota);
  });

  // GET /api/llamadas/:id/notas — List notes for a call
  app.get("/api/llamadas/:id/notas", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    const auditoriaId = req.params.id;
    const supabaseNotas = await loadNotasFromSupabase(auditoriaId);
    const localNotas = localNotasMemory.get(auditoriaId) || [];

    const supabaseIds = new Set(supabaseNotas.map((n: any) => n.id));
    const merged = [...supabaseNotas, ...localNotas.filter((n: any) => !supabaseIds.has(n.id))];

    return res.json(merged);
  });

  // DELETE /api/notas/:id — Delete a quick note or audit note by id
  app.delete("/api/notas/:id", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    if (!(await canDeleteNota(req, id))) {
      return res.status(403).json({ error: "No puedes eliminar una nota de otro usuario" });
    }

    setLocalQuickNotesMemory(localQuickNotesMemory.filter((n: any) => n.id !== id));

    for (const [callId, notas] of localNotasMemory) {
      const filtered = notas.filter((n: any) => n.id !== id);
      if (filtered.length !== notas.length) {
        localNotasMemory.set(callId, filtered);
      }
    }

    try {
      const db = insforgeAdmin?.database || insforge.database;
      await db.from("notas").delete().eq("id", id);
    } catch {}

    return res.json({ success: true });
  });

  // DELETE /api/llamadas/:id/notas/:notaId — Delete a note
  app.delete("/api/llamadas/:id/notas/:notaId", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    const { id: auditoriaId, notaId } = req.params;

    if (!(await canDeleteNota(req, notaId))) {
      return res.status(403).json({ error: "No puedes eliminar una nota de otro usuario" });
    }

    if (localNotasMemory.has(auditoriaId)) {
      const notas = localNotasMemory.get(auditoriaId)!;
      localNotasMemory.set(auditoriaId, notas.filter((n: any) => n.id !== notaId));
    }

    await deleteNotaFromSupabase(notaId);
    return res.json({ success: true });
  });
}
