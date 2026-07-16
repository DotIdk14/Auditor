import { randomUUID } from "crypto";
import type { Express } from "express";
import { authenticateToken, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { localNotasMemory, localQuickNotesMemory, localCallsMemory } from "../config.js";
import { insforge } from "../services/insforge.js";
import {
  saveNotaToSupabase,
  loadNotasFromSupabase,
  deleteNotaFromSupabase,
} from "../services/supabase.js";

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

  // GET /api/notas — Get all notes across all calls + quick notes
  app.get("/api/notas", authenticateToken, injectScope, async (_req: AuthenticatedRequest, res) => {
    const callMap = new Map<string, string>();
    localCallsMemory.forEach((call: any) => {
      callMap.set(call.id, call.metadata?.fileName || call.id);
    });

    const allNotas: any[] = [];

    // Audit notes from local memory
    localNotasMemory.forEach((notas, callId) => {
      const callName = callMap.get(callId) || callId;
      notas.forEach((n: any) => {
        allNotas.push({ ...n, callName, type: "audit" });
      });
    });

    // Audit notes from DB
    try {
      const { data, error } = await insforge.database.from("notas").select("*");
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
              type: "audit",
            });
          }
        });
      }
    } catch {}

    // Quick notes (free-form, not tied to a call)
    localQuickNotesMemory.forEach((n: any) => {
      allNotas.push({ ...n, type: "quick", callName: null });
    });

    allNotas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(allNotas);
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

  // DELETE /api/llamadas/:id/notas/:notaId — Delete a note
  app.delete("/api/llamadas/:id/notas/:notaId", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    const { id: auditoriaId, notaId } = req.params;

    if (localNotasMemory.has(auditoriaId)) {
      const notas = localNotasMemory.get(auditoriaId)!;
      localNotasMemory.set(auditoriaId, notas.filter((n: any) => n.id !== notaId));
    }

    await deleteNotaFromSupabase(notaId);
    return res.json({ success: true });
  });
}
