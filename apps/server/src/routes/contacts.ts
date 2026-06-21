import type { Express } from "express";
import { z } from "zod";
import { authenticateToken, requireRole, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import * as contactService from "../services/contactService.js";
import { supabase } from "../config.js";

const createContactSchema = z.object({
  fullName: z.string().min(1, "El nombre es obligatorio").max(200),
  phone: z.string().regex(/^[\d\s\-+()]{7,}$/, "Teléfono inválido").optional().nullable(),
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
      if (!supabase) return res.json([]);

      const { data: audits, error: auditsError } = await supabase
        .from("auditorias")
        .select("id, metadata, score, analysis, transcription, created_at")
        .eq("contact_id", req.params.id)
        .order("created_at", { ascending: false });

      if (auditsError) throw auditsError;
      res.json(audits || []);
    } catch (err: any) {
      console.error("[CONTACTS] Error getting calls:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
