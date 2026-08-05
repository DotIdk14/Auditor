import type { Express } from "express";
import { authenticateToken, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import {
  getTopCalls,
  generateLearnedSpeeches,
  saveLearnedSpeeches,
  getLearnedSpeeches,
  getLearningStatus,
  getCallSnippets,
  clearLearnedSpeeches,
} from "../services/bestPracticesService.js";

export default function (app: Express): void {
  // GET /api/visor/best-calls — Top calls (venta cerrada o score alto) con snippets de referencia
  app.get("/api/visor/best-calls", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit || "20"), 10) || 20, 50);
      const calls = await getTopCalls(limit);
      const payload = calls.map((c) => ({
        id: c.id,
        fileName: String(c.metadata?.fileName || "audio"),
        score: c.scoreGlobal,
        salesOutcome: c.salesOutcome,
        momentCount: getCallSnippets(c).length,
        snippets: getCallSnippets(c),
      }));
      return res.json({ calls: payload });
    } catch (err: any) {
      console.error("[LEARNING] Error listing best calls:", err.message);
      return res.status(500).json({ error: "Error al obtener las mejores llamadas" });
    }
  });

  // GET /api/visor/learned-speeches — Catálogo de speeches aprendidos
  app.get("/api/visor/learned-speeches", authenticateToken, injectScope, async (_req: AuthenticatedRequest, res) => {
    try {
      const speeches = await getLearnedSpeeches();
      return res.json({ speeches });
    } catch (err: any) {
      console.error("[LEARNING] Error listing learned speeches:", err.message);
      return res.status(500).json({ error: "Error al obtener los speeches aprendidos" });
    }
  });

  // GET /api/visor/learning-status — Estado del aprendizaje (contador de llamadas nuevas + warning)
  app.get("/api/visor/learning-status", authenticateToken, injectScope, async (_req: AuthenticatedRequest, res) => {
    try {
      const status = await getLearningStatus();
      return res.json(status);
    } catch (err: any) {
      console.error("[LEARNING] Error getting status:", err.message);
      return res.status(500).json({ error: "Error al obtener el estado de aprendizaje" });
    }
  });

  // POST /api/visor/learned-speeches/regenerate — SOLO admin. Re-sintetiza con las mejores llamadas
  app.post("/api/visor/learned-speeches/regenerate", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.scope!.role !== "admin") {
        return res.status(403).json({ error: "Solo el administrador puede regenerar el aprendizaje." });
      }

      const limit = Math.min(parseInt(String(req.body?.limit || "20"), 10) || 20, 50);
      const topCalls = await getTopCalls(limit);

      if (topCalls.length === 0) {
        return res.status(200).json({
          regenerated: false,
          count: 0,
          reason: "Aún no hay llamadas ganadoras (venta cerrada o puntaje alto) para aprender.",
          speeches: [],
        });
      }

      await clearLearnedSpeeches();
      const speeches = await generateLearnedSpeeches(topCalls);
      await saveLearnedSpeeches(speeches, req.scope!.userId);

      return res.json({ regenerated: true, count: speeches.length, speeches });
    } catch (err: any) {
      console.error("[LEARNING] Error regenerating:", err.message);
      return res.status(500).json({ error: "Error al regenerar el aprendizaje. Intenta de nuevo más tarde." });
    }
  });
}
