import type { Express } from "express";
import { localObjecionesMemory } from "../config.js";
import {
  saveObjecionToSupabase,
  loadObjecionesFromSupabase,
  deleteObjecionFromSupabase,
} from "../services/supabase.js";

export default function (app: Express): void {
  // POST /api/llamadas/:id/objeciones — Add an objection
  app.post("/api/llamadas/:id/objeciones", async (req, res) => {
    const auditoriaId = req.params.id;
    const { supervisorEmail, supervisorName, segmentStart, segmentEnd, tipoObjecion, severidad, text } = req.body;

    if (!supervisorEmail || !text || segmentStart === undefined || segmentEnd === undefined || !tipoObjecion || !severidad) {
      return res.status(400).json({ error: "supervisorEmail, text, segmentStart, segmentEnd, tipoObjecion, and severidad are required." });
    }

    const objecion = {
      id: `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      auditoriaId,
      supervisorEmail,
      supervisorName: supervisorName || supervisorEmail.split("@")[0],
      segmentStart,
      segmentEnd,
      tipoObjecion,
      severidad,
      text,
      createdAt: new Date().toISOString(),
    };

    if (!localObjecionesMemory.has(auditoriaId)) {
      localObjecionesMemory.set(auditoriaId, []);
    }
    localObjecionesMemory.get(auditoriaId)!.push(objecion);

    saveObjecionToSupabase(objecion);
    return res.status(201).json(objecion);
  });

  // GET /api/llamadas/:id/objeciones — List objections for a call
  app.get("/api/llamadas/:id/objeciones", async (req, res) => {
    const auditoriaId = req.params.id;
    const supabaseObjeciones = await loadObjecionesFromSupabase(auditoriaId);
    const localObjeciones = localObjecionesMemory.get(auditoriaId) || [];

    const supabaseIds = new Set(supabaseObjeciones.map((o: any) => o.id));
    const merged = [...supabaseObjeciones, ...localObjeciones.filter((o: any) => !supabaseIds.has(o.id))];

    return res.json(merged);
  });

  // DELETE /api/llamadas/:id/objeciones/:objecionId — Delete an objection
  app.delete("/api/llamadas/:id/objeciones/:objecionId", async (req, res) => {
    const { id: auditoriaId, objecionId } = req.params;

    if (localObjecionesMemory.has(auditoriaId)) {
      const objeciones = localObjecionesMemory.get(auditoriaId)!;
      localObjecionesMemory.set(auditoriaId, objeciones.filter((o: any) => o.id !== objecionId));
    }

    await deleteObjecionFromSupabase(objecionId);
    return res.json({ success: true });
  });
}
