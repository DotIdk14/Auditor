import type { Express } from "express";
import { z } from "zod";
import { authenticateToken, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getAuditLogs } from "../services/auditService.js";
import type { UserRole } from "../types.js";

const ROLE_ENUM = ["admin", "area_manager", "coordinator", "supervisor", "agent", "qa"] as const;

const auditFiltersSchema = z.object({
  role: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  areaId: z.string().optional(),
  teamId: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export default function (app: Express): void {
  // GET /api/audit-logs — Historial de cambios (scoped por rol)
  app.get("/api/audit-logs", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = auditFiltersSchema.parse(req.query);
      const role =
        parsed.role && (ROLE_ENUM as readonly string[]).includes(parsed.role)
          ? (parsed.role as UserRole)
          : undefined;
      const result = await getAuditLogs(req.scope!, {
        role,
        action: parsed.action,
        entityType: parsed.entityType,
        from: parsed.from,
        to: parsed.to,
        q: parsed.q,
        areaId: parsed.areaId,
        teamId: parsed.teamId,
        limit: parsed.limit,
        offset: parsed.offset,
      });
      res.json(result);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Filtros inválidos", details: err.issues });
      }
      console.error("[AUDIT] list error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
