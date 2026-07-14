import type { Express } from "express";
import { z } from "zod";
import { authenticateToken, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { supabase, supabaseAdmin, localCallsMemory } from "../config.js";

export default function (app: Express): void {
  // GET /api/visor/calls - List calls with RBAC scope for Visor Kanban
  // Returns: CallItem[] with id, clientId, title, agent, category, status, score, date
  // Must filter by user role scope (admin=all, area_manager=own_area, coordinator=own_area, supervisor=own_team, agent=own)
  // Transform auditorias + contacts data into CallItem format
  app.get("/api/visor/calls", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const { status, search, page = "1", limit = "50" } = req.query;
      const scope = req.scope!;

      // ── Serve from localCallsMemory ONLY when Supabase is not available ──
      if (!supabase) {
        let filtered = [...localCallsMemory];

        if (scope.role === "agent") {
          filtered = filtered.filter((c: any) => c.agentId === scope.userId);
        }

        if (status && typeof status === "string") {
          filtered = filtered.filter((c: any) => c.status === status);
        }

        if (search && typeof search === "string") {
          const q = search.toLowerCase();
          filtered = filtered.filter((c: any) =>
            c.agent?.toLowerCase().includes(q) ||
            c.title?.toLowerCase().includes(q)
          );
        }

        return res.json(filtered);
      }

      // La tabla auditorias NO tiene columna status — se lee de metadata->>'status'
      // Se usa LEFT JOIN para calls sin contacto asignado
      let query = supabase
        .from("auditorias")
        .select(`
          id, contact_id, score, metadata, created_at,
          contacts(id, full_name, assigned_to, area_id, team_id)
        `)
        .order("created_at", { ascending: false });

      // RBAC filtering (solo si hay contacto)
      if (scope.role === "agent") {
        query = query.not('contacts.id', 'is', null).eq("contacts.assigned_to", scope.userId);
      } else if (scope.role === "supervisor" && scope.teamId) {
        query = query.not('contacts.id', 'is', null).eq("contacts.team_id", scope.teamId);
      } else if ((scope.role === "coordinator" || scope.role === "area_manager") && scope.areaId) {
        query = query.not('contacts.id', 'is', null).eq("contacts.area_id", scope.areaId);
      }
      // admin sees all

      if (status && typeof status === "string") {
        query = query.filter('metadata->>status', 'eq', status);
      }

      if (search && typeof search === "string") {
        query = query.not('contacts.id', 'is', null).ilike("contacts.full_name", `%${search}%`);
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
        const contactRow = Array.isArray(item.contacts) ? item.contacts[0] : item.contacts;
        const contact = contactRow || {};
        const meta = typeof item.metadata === "string" ? JSON.parse(item.metadata) : (item.metadata || {});
        const contactName = contact.full_name || "Sin nombre";
        return {
          id: item.id,
          clientId: contact.id || item.contact_id || item.id,
          title: `Llamada — ${contactName}`,
          rawTitle: meta?.fileName || "unknown.wav",
          shortName: contactName,
          agent: meta?.agentName || "Sin asignar",
          agentId: contact.assigned_to || null,
          category: meta?.category || "CALIDAD",
          status: meta?.status || "por_auditar",
          score: typeof item.score === 'object' && item.score !== null ? item.score.global ?? null : item.score ?? null,
          date: item.created_at,
          avatar: contactName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "??",
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

      // ── Demo/local mode: update in memory ──
      // Works for demo call IDs (starts with "demo-") or when Supabase is not available
      if (!supabase || id.startsWith("demo-")) {
        const idx = localCallsMemory.findIndex((c: any) => c.id === id);
        if (idx !== -1) {
          const currentStatus = localCallsMemory[idx].status;
          const validTransitions: Record<string, string[]> = {
            por_auditar: ["en_revision", "completada"],
            en_revision: ["por_auditar", "completada"],
            completada: ["en_revision"],
          };
          if (!validTransitions[currentStatus]?.includes(status)) {
            return res.status(400).json({
              error: `Transición inválida: ${currentStatus} → ${status}`,
              validTransitions: validTransitions[currentStatus],
            });
          }
          localCallsMemory[idx] = { ...localCallsMemory[idx], status, score: status === "completada" ? Math.round((60 + Math.random() * 35) * 10) / 10 : localCallsMemory[idx].score };
        }
        return res.json({ success: true });
      }

      // Get current record from DB
      const { data: current, error: fetchErr } = await (supabaseAdmin || supabase)
        .from("auditorias")
        .select("id, metadata")
        .eq("id", id)
        .maybeSingle();

      if (fetchErr || !current) {
        return res.status(404).json({ error: "Llamada no encontrada" });
      }

      // Status is stored inside metadata, not as a separate column
      const currentStatus = current.metadata?.status || "por_auditar";

      // Validate transitions
      const validTransitions: Record<string, string[]> = {
        por_auditar: ["en_revision", "completada"],
        en_revision: ["por_auditar", "completada"],
        completada: ["en_revision"],
      };

      if (!validTransitions[currentStatus]?.includes(status)) {
        return res.status(400).json({
          error: `Transición inválida: ${currentStatus} → ${status}`,
          validTransitions: validTransitions[currentStatus],
        });
      }

      // Update metadata.status (the actual DB column is metadata JSONB)
      const updatedMeta = {
        ...(current.metadata || {}),
        status,
      };

      const { error: updateErr } = await (supabaseAdmin || supabase)
        .from("auditorias")
        .update({
          metadata: updatedMeta,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateErr) throw updateErr;

      // Also update in memory
      const memIdx = localCallsMemory.findIndex((c: any) => c.id === id);
      if (memIdx !== -1) {
        localCallsMemory[memIdx] = {
          ...localCallsMemory[memIdx],
          status,
          metadata: updatedMeta,
          score: status === "completada"
            ? Math.round((60 + Math.random() * 35) * 10) / 10
            : localCallsMemory[memIdx].score,
        };
      }

      res.json({ success: true, status });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Status inválido", details: err.issues });
      }
      console.error("[VISOR_CALLS] Error updating status:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/visor/calls/guardar - Save call session state (guide, notes, profile)
  app.post("/api/visor/calls/guardar", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const bodySchema = z.object({
        clientName: z.string().optional(),
        career: z.string().optional(),
        callSteps: z.array(z.object({
          id: z.string(),
          type: z.enum(['section', 'custom']),
          sectionId: z.string().optional(),
          title: z.string().optional(),
          content: z.string().optional(),
          skipped: z.boolean().optional(),
        })).optional(),
        currentStep: z.number().optional(),
        finalDecision: z.enum(['yes', 'no']).nullable().optional(),
        notes: z.array(z.object({
          id: z.string(),
          content: z.string(),
          timestamp: z.number(),
        })).optional(),
        safeChecklist: z.array(z.object({
          id: z.string(),
          label: z.string(),
          checked: z.boolean(),
        })).optional(),
        profileTags: z.object({
          trabaja: z.boolean(),
          tieneHijos: z.boolean(),
          preocupadoCostos: z.boolean(),
        }).optional(),
        variables: z.record(z.string(), z.string()).optional(),
      });

      const data = bodySchema.parse(req.body);
      const userId = req.scope?.userId || "unknown";

      if (supabase) {
        const { error } = await supabase.from("call_guides").insert({
          user_id: userId,
          client_name: data.clientName || null,
          career: data.career || null,
          call_steps: data.callSteps || [],
          current_step: data.currentStep || 0,
          final_decision: data.finalDecision || null,
          notes: data.notes || [],
          safe_checklist: data.safeChecklist || [],
          profile_tags: data.profileTags || { trabaja: false, tieneHijos: false, preocupadoCostos: false },
          variables: data.variables || {},
          created_at: new Date().toISOString(),
        });

        if (error) {
          console.error("[VISOR_CALLS] Error saving guide:", error.message);
          return res.status(500).json({ error: error.message });
        }
      }

      res.status(201).json({
        success: true,
        id: `guide_${Date.now()}`,
        message: "Guía de llamada guardada correctamente",
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: err.issues });
      }
      console.error("[VISOR_CALLS] Error saving guide:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
