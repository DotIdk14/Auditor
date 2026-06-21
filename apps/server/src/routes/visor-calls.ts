import type { Express } from "express";
import { z } from "zod";
import { authenticateToken, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { supabase } from "../config.js";

export default function (app: Express): void {
  // GET /api/visor/calls - List calls with RBAC scope for Visor Kanban
  // Returns: CallItem[] with id, clientId, title, agent, category, status, score, date
  // Must filter by user role scope (admin=all, area_manager=own_area, coordinator=own_area, supervisor=own_team, agent=own)
  // Transform auditorias + contacts data into CallItem format
  app.get("/api/visor/calls", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const { status, search, page = "1", limit = "50" } = req.query;
      const scope = req.scope!;

      if (!supabase) {
        // Return empty for demo mode
        return res.json([]);
      }

      let query = supabase
        .from("auditorias")
        .select(`
          id, contact_id, score, status, metadata, created_at,
          contacts!inner(id, full_name, assigned_to, area_id, team_id)
        `)
        .order("created_at", { ascending: false });

      // RBAC filtering
      if (scope.role === "agent") {
        query = query.eq("contacts.assigned_to", scope.userId);
      } else if (scope.role === "supervisor" && scope.teamId) {
        query = query.eq("contacts.team_id", scope.teamId);
      } else if ((scope.role === "coordinator" || scope.role === "area_manager") && scope.areaId) {
        query = query.eq("contacts.area_id", scope.areaId);
      }
      // admin sees all

      if (status && typeof status === "string") {
        query = query.eq("status", status);
      }

      if (search && typeof search === "string") {
        query = query.ilike("contacts.full_name", `%${search}%`);
      }

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 50;
      const from = (pageNum - 1) * limitNum;
      const to = from + limitNum - 1;
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw error;

      // Transform to CallItem format
      const calls = (data || []).map((item: any) => {
        const contact = item.contacts || {};
        const meta = typeof item.metadata === "string" ? JSON.parse(item.metadata) : (item.metadata || {});
        return {
          id: item.id,
          clientId: contact.id || item.contact_id,
          title: `Llamada — ${contact.full_name || "Sin nombre"}`,
          rawTitle: meta?.fileName || "unknown.wav",
          shortName: contact.full_name || "Desconocido",
          agent: meta?.agentName || "Sin asignar",
          agentId: contact.assigned_to,
          category: meta?.category || "CALIDAD",
          status: item.status || "por_auditar",
          score: item.score,
          date: item.created_at,
          avatar: (contact.full_name || "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
        };
      });

      res.json(calls);
    } catch (err: any) {
      console.error("[VISOR_CALLS] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH /api/visor/calls/:id/status - Move call between statuses (Kanban drag)
  // Validates transitions: por_auditar→en_revision, en_revision→completada, etc.
  app.patch("/api/visor/calls/:id/status", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const { status } = z.object({
        status: z.enum(["por_auditar", "en_revision", "completada"]),
      }).parse(req.body);

      const { id } = req.params;

      if (!supabase) {
        return res.json({ success: true });
      }

      // Get current status
      const { data: current } = await supabase
        .from("auditorias")
        .select("status")
        .eq("id", id)
        .single();

      if (!current) {
        return res.status(404).json({ error: "Llamada no encontrada" });
      }

      // Validate transitions
      const validTransitions: Record<string, string[]> = {
        por_auditar: ["en_revision", "completada"],
        en_revision: ["por_auditar", "completada"],
        completada: ["en_revision"],
      };

      if (!validTransitions[current.status]?.includes(status)) {
        return res.status(400).json({
          error: `Transición inválida: ${current.status} → ${status}`,
          validTransitions: validTransitions[current.status],
        });
      }

      const { error } = await supabase
        .from("auditorias")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      res.json({ success: true, status });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Status inválido", details: err.issues });
      }
      console.error("[VISOR_CALLS] Error updating status:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
