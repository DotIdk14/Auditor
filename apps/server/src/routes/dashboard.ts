import type { Express } from "express";
import { authenticateToken, requireRole, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getSalesKPIs, getQAKPIs, getUnifiedDashboard } from "../services/dashboardService.js";
import { IS_DEMO_MODE, demoKPIsData } from "../config.js";
import { generateDemoKPIs } from "../services/demoSeeder.js";

export default function (app: Express): void {
  // GET /api/dashboard/sales — Sales KPIs
  app.get("/api/dashboard/sales", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      if (IS_DEMO_MODE) {
        if (!demoKPIsData) {
          // @ts-ignore - demo data is mutable
          demoKPIsData = generateDemoKPIs();
        }
        return res.json(demoKPIsData.sales);
      }
      const kpis = await getSalesKPIs(req.scope!);
      res.json(kpis);
    } catch (err: any) {
      console.error("[DASHBOARD] Sales KPIs error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/dashboard/qa — QA KPIs
  app.get("/api/dashboard/qa", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      if (IS_DEMO_MODE) {
        if (!demoKPIsData) {
          // @ts-ignore - demo data is mutable
          demoKPIsData = generateDemoKPIs();
        }
        return res.json(demoKPIsData.qa);
      }
      const kpis = await getQAKPIs(req.scope!);
      res.json(kpis);
    } catch (err: any) {
      console.error("[DASHBOARD] QA KPIs error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/dashboard/unified — Unified dashboard (admin, area_manager, coordinator, supervisor only)
  app.get(
    "/api/dashboard/unified",
    authenticateToken,
    injectScope,
    requireRole("admin", "area_manager", "coordinator", "supervisor"),
    async (req: AuthenticatedRequest, res) => {
      try {
        if (IS_DEMO_MODE) {
          if (!demoKPIsData) {
            // @ts-ignore - demo data is mutable
            demoKPIsData = generateDemoKPIs();
          }
          return res.json(demoKPIsData);
        }
        const dashboard = await getUnifiedDashboard(req.scope!);
        res.json(dashboard);
      } catch (err: any) {
        console.error("[DASHBOARD] Unified error:", err.message);
        res.status(500).json({ error: err.message });
      }
    }
  );

  // GET /api/dashboard/my — Personal dashboard (for agents)
  app.get("/api/dashboard/my", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      if (IS_DEMO_MODE) {
        if (!demoKPIsData) {
          // @ts-ignore - demo data is mutable
          demoKPIsData = generateDemoKPIs();
        }
        return res.json(demoKPIsData);
      }
      const [sales, qa] = await Promise.all([
        getSalesKPIs(req.scope!),
        getQAKPIs(req.scope!),
      ]);
      res.json({ sales, qa });
    } catch (err: any) {
      console.error("[DASHBOARD] Personal error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
