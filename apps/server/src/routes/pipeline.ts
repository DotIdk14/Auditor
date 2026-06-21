import type { Express } from "express";
import { z } from "zod";
import { authenticateToken, requireRole, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import * as pipelineService from "../services/pipelineService.js";

const createStageSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  displayOrder: z.number().int().min(0).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido (formato #RRGGBB)").optional().default("#6366f1"),
  isClosedWon: z.boolean().optional().default(false),
  isClosedLost: z.boolean().optional().default(false),
  probability: z.number().int().min(0).max(100).optional().default(0),
});

const updateStageSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  displayOrder: z.number().int().min(0).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isClosedWon: z.boolean().optional(),
  isClosedLost: z.boolean().optional(),
  probability: z.number().int().min(0).max(100).optional(),
});

export default function (app: Express): void {
  // GET /api/pipeline — Get pipeline config and stages for current user's scope
  app.get("/api/pipeline", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await pipelineService.getPipelineWithStages(req.scope!);
      if (!result.pipeline) {
        return res.status(404).json({ error: "No hay pipeline configurado para tu área" });
      }
      res.json(result);
    } catch (err: any) {
      console.error("[PIPELINE] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/pipeline/stages — Get all stages for the user's pipeline
  app.get("/api/pipeline/stages", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const { pipeline, stages } = await pipelineService.getPipelineWithStages(req.scope!);
      if (!pipeline) {
        return res.status(404).json({ error: "No hay pipeline configurado" });
      }
      res.json(stages);
    } catch (err: any) {
      console.error("[PIPELINE] Error getting stages:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/pipeline/contacts — Get contacts grouped by stage (Kanban data)
  app.get("/api/pipeline/contacts", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const stagesWithContacts = await pipelineService.getContactsByStage(req.scope!);
      res.json(stagesWithContacts);
    } catch (err: any) {
      console.error("[PIPELINE] Error getting contacts by stage:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/pipeline/stages — Create a new stage (admin/area_manager only)
  app.post("/api/pipeline/stages", authenticateToken, injectScope, requireRole("admin", "area_manager"), async (req: AuthenticatedRequest, res) => {
    try {
      const input = createStageSchema.parse(req.body);
      
      // Get the pipeline for the user's scope
      const { pipeline } = await pipelineService.getPipelineWithStages(req.scope!);
      if (!pipeline) {
        return res.status(404).json({ error: "No hay pipeline configurado" });
      }

      const stage = await pipelineService.createStage(pipeline.id, input);
      res.status(201).json(stage);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: err.issues });
      }
      console.error("[PIPELINE] Error creating stage:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH /api/pipeline/stages/:id — Update a stage
  app.patch("/api/pipeline/stages/:id", authenticateToken, injectScope, requireRole("admin", "area_manager"), async (req: AuthenticatedRequest, res) => {
    try {
      const input = updateStageSchema.parse(req.body);
      const stage = await pipelineService.updateStage(req.params.id, input);
      if (!stage) {
        return res.status(404).json({ error: "Etapa no encontrada" });
      }
      res.json(stage);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: err.issues });
      }
      console.error("[PIPELINE] Error updating stage:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/pipeline/stages/:id — Delete a stage
  app.delete("/api/pipeline/stages/:id", authenticateToken, injectScope, requireRole("admin", "area_manager"), async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await pipelineService.deleteStage(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Etapa no encontrada" });
      }
      res.json({ success: true, message: "Etapa eliminada" });
    } catch (err: any) {
      console.error("[PIPELINE] Error deleting stage:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
