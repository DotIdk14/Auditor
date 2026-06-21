import type { Express } from "express";
import { localNotasMemory } from "../config.js";
import {
  saveNotaToSupabase,
  loadNotasFromSupabase,
  deleteNotaFromSupabase,
} from "../services/supabase.js";

export default function (app: Express): void {
  // POST /api/llamadas/:id/notas — Add a note
  app.post("/api/llamadas/:id/notas", async (req, res) => {
    const auditoriaId = req.params.id;
    const { supervisorEmail, supervisorName, segmentStart, segmentEnd, text } = req.body;

    if (!supervisorEmail || !text || segmentStart === undefined || segmentEnd === undefined) {
      return res.status(400).json({ error: "supervisorEmail, text, segmentStart, and segmentEnd are required." });
    }

    const nota = {
      id: `nota_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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
  app.get("/api/llamadas/:id/notas", async (req, res) => {
    const auditoriaId = req.params.id;
    const supabaseNotas = await loadNotasFromSupabase(auditoriaId);
    const localNotas = localNotasMemory.get(auditoriaId) || [];

    const supabaseIds = new Set(supabaseNotas.map((n: any) => n.id));
    const merged = [...supabaseNotas, ...localNotas.filter((n: any) => !supabaseIds.has(n.id))];

    return res.json(merged);
  });

  // DELETE /api/llamadas/:id/notas/:notaId — Delete a note
  app.delete("/api/llamadas/:id/notas/:notaId", async (req, res) => {
    const { id: auditoriaId, notaId } = req.params;

    if (localNotasMemory.has(auditoriaId)) {
      const notas = localNotasMemory.get(auditoriaId)!;
      localNotasMemory.set(auditoriaId, notas.filter((n: any) => n.id !== notaId));
    }

    await deleteNotaFromSupabase(notaId);
    return res.json({ success: true });
  });
}
