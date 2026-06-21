import type { Express } from "express";
import { z } from "zod";
import { authenticateToken, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { supabase } from "../config.js";

export default function (app: Express): void {
  // GET /api/visor/resources - List knowledge base resources
  app.get("/api/visor/resources", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const { type } = req.query;

      if (!supabase) return res.json([]);

      let query = supabase
        .from("profiles") // We'll use profiles as a simple store or create resources table
        .select("*")
        .limit(0);

      // For now, return empty - resources table will be added later
      res.json([]);
    } catch (err: any) {
      console.error("[VISOR_RESOURCES] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/visor/resources - Create a new knowledge base resource
  app.post("/api/visor/resources", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const bodySchema = z.object({
        title: z.string().min(1, "El título es requerido"),
        type: z.enum(["guia", "faq", "procedimiento", "capacitacion", "manual", "otro"]),
        content: z.string().min(1, "El contenido es requerido"),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        fileUrl: z.string().url().optional().nullable(),
      });

      const data = bodySchema.parse(req.body);

      if (!supabase) {
        return res.status(503).json({ error: "Base de datos no disponible" });
      }

      // Resources table will be created in a future migration
      // For now, return a placeholder response
      res.status(201).json({
        id: `placeholder_${Date.now()}`,
        ...data,
        createdBy: req.scope?.userId || "unknown",
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: err.issues });
      }
      console.error("[VISOR_RESOURCES] Error creating resource:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
