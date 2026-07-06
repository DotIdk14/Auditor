import type { Express } from "express";
import { z } from "zod";
import { authenticateToken, requireRole, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import * as contactService from "../services/contactService.js";
import { supabase, supabaseAdmin } from "../config.js";

const createContactSchema = z.object({
  fullName: z.string().min(1, "El nombre es obligatorio").max(200),
  phone: z.string().regex(/^[\d\s\-+()]{4,}$/, "Teléfono inválido (mín. 4 dígitos)").optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  source: z.enum(["inbound", "outbound", "referral", "web", "event", "other", "manual"]).optional().default("manual"),
  status: z.enum(["lead", "prospect", "customer", "churned"]).optional().default("lead"),
  pipelineId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const updateContactSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  phone: z.string().regex(/^[\d\s\-+()]{7,}$/).optional().nullable(),
  email: z.string().email().optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  source: z.enum(["inbound", "outbound", "referral", "web", "event", "other", "manual"]).optional(),
  status: z.enum(["lead", "prospect", "customer", "churned"]).optional(),
  stageId: z.string().uuid().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const contactFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["lead", "prospect", "customer", "churned"]).optional(),
  assignedTo: z.string().optional(),
  stageId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

const moveStageSchema = z.object({
  stageId: z.string().uuid("ID de etapa inválido"),
});

export default function (app: Express): void {
  // GET /api/contacts — List contacts with filters and pagination
  app.get("/api/contacts", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const filters = contactFiltersSchema.parse(req.query);
      const result = await contactService.listContacts(filters, req.scope!);
      res.json(result);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Filtros inválidos", details: err.issues });
      }
      console.error("[CONTACTS] Error listing:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/contacts/:id — Get single contact
  app.get("/api/contacts/:id", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const contact = await contactService.getContact(req.params.id, req.scope!);
      if (!contact) {
        return res.status(404).json({ error: "Contacto no encontrado" });
      }
      res.json(contact);
    } catch (err: any) {
      console.error("[CONTACTS] Error getting:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/contacts — Create contact
  app.post("/api/contacts", authenticateToken, injectScope, requireRole("admin", "area_manager", "coordinator", "supervisor", "agent"), async (req: AuthenticatedRequest, res) => {
    try {
      const input = createContactSchema.parse(req.body);
      const contact = await contactService.createContact(input, req.scope!.userId, req.scope!);
      res.status(201).json(contact);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: err.issues });
      }
      console.error("[CONTACTS] Error creating:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH /api/contacts/:id — Update contact
  app.patch("/api/contacts/:id", authenticateToken, injectScope, requireRole("admin", "area_manager", "coordinator", "supervisor", "agent"), async (req: AuthenticatedRequest, res) => {
    try {
      const input = updateContactSchema.parse(req.body);
      const contact = await contactService.updateContact(req.params.id, input, req.scope!);
      if (!contact) {
        return res.status(404).json({ error: "Contacto no encontrado" });
      }
      res.json(contact);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: err.issues });
      }
      console.error("[CONTACTS] Error updating:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH /api/contacts/:id/stage — Move contact to a different stage (Kanban drag & drop)
  app.patch("/api/contacts/:id/stage", authenticateToken, injectScope, requireRole("admin", "area_manager", "coordinator", "supervisor", "agent"), async (req: AuthenticatedRequest, res) => {
    try {
      const { stageId } = moveStageSchema.parse(req.body);
      const contact = await contactService.updateContactStage(req.params.id, stageId, req.scope!);
      if (!contact) {
        return res.status(404).json({ error: "Contacto no encontrado" });
      }
      res.json(contact);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: err.issues });
      }
      console.error("[CONTACTS] Error moving stage:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/contacts/:id — Delete contact (restricted roles)
  app.delete("/api/contacts/:id", authenticateToken, injectScope, requireRole("admin", "area_manager", "coordinator", "supervisor"), async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await contactService.deleteContact(req.params.id, req.scope!);
      if (!deleted) {
        return res.status(404).json({ error: "Contacto no encontrado" });
      }
      res.json({ success: true, message: "Contacto eliminado" });
    } catch (err: any) {
      console.error("[CONTACTS] Error deleting:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/contacts/:id/calls — Get calls linked to a contact (from auditorias)
  app.get("/api/contacts/:id/calls", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      if (!supabase) {
        return res.json([]);
      }

      const { data: audits, error: auditsError } = await (supabaseAdmin || supabase)
        .from("auditorias")
        .select("id, contact_id, metadata, score, analysis, transcription, created_at")
        .eq("contact_id", req.params.id)
        .order("created_at", { ascending: false });

      if (auditsError) throw auditsError;
      res.json(audits || []);
    } catch (err: any) {
      console.error("[CONTACTS] Error getting calls:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/contacts/:id/activity — Unified activity timeline (auditorías + tareas/interacciones)
  app.get("/api/contacts/:id/activity", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const contactId = req.params.id;

      if (!supabase) {
        return res.json({ contactId, items: [] });
      }

      const [{ data: audits, error: auditsError }, { data: tasks, error: tasksError }] = await Promise.all([
        (supabaseAdmin || supabase)
          .from("auditorias")
          .select("id, contact_id, metadata, score, analysis, transcription, created_at")
          .eq("contact_id", contactId)
          .order("created_at", { ascending: false }),
        (supabaseAdmin || supabase)
          .from("tasks")
          .select("id, contact_id, title, description, type, status, priority, due_date, completed_at, assigned_to, created_at, updated_at")
          .eq("contact_id", contactId)
          .order("created_at", { ascending: false }),
      ]);

      if (auditsError) console.warn("[ACTIVITY] Error fetching audits:", auditsError.message);
      if (tasksError) console.warn("[ACTIVITY] Error fetching tasks:", tasksError.message);

      const auditItems = (audits || []).map((a: any) => ({
        id: a.id,
        type: "audit" as const,
        title: a.metadata?.fileName || "Auditoría",
        description: a.metadata?.agentName ? `Agente: ${a.metadata.agentName}` : "",
        created_at: a.created_at,
        score: a.score != null ? (typeof a.score === "object" ? (a.score as any).global ?? null : a.score) : null,
        status: a.status || a.metadata?.status || "completada",
        callId: a.id,
      }));

      const taskItems = (tasks || []).map((t: any) => ({
        id: t.id,
        type: "task" as const,
        title: t.title,
        taskType: t.type || "follow_up",
        description: t.description || "",
        created_at: t.created_at,
        due_date: t.due_date,
        completed_at: t.completed_at,
        status: t.status,
        priority: t.priority,
        assigned_to: t.assigned_to,
      }));

      const items = [...auditItems, ...taskItems]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      res.json({ contactId, items, total: items.length });
    } catch (err: any) {
      console.error("[CONTACTS] Error getting activity:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
