import type { Express } from "express";
import { z } from "zod";
import { authenticateToken, requireRole, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import * as contactService from "../services/contactService.js";
import { supabase, supabaseAdmin, IS_DEMO_MODE, demoContactsList, localCallsMemory } from "../config.js";
import { generateDemoContacts, generateDemoCalls } from "../services/demoSeeder.js";

// Seed demo contacts once
let demoContactsSeeded = false;
function ensureDemoContacts() {
  if (!demoContactsSeeded && IS_DEMO_MODE) {
    const contacts = generateDemoContacts();
    demoContactsList.length = 0;
    demoContactsList.push(...contacts);
    // Also seed calls if not already done
    if (localCallsMemory.length === 0) {
      const calls = generateDemoCalls();
      localCallsMemory.push(...calls);
    }
    demoContactsSeeded = true;
    console.log(`[DEMO_CONTACTS] ${contacts.length} contactos demo cargados`);
  }
}

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
      const userId = req.scope!.userId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

      if (IS_DEMO_MODE || !isUuid) {
        if (!IS_DEMO_MODE) {
          console.log(`[CONTACTS] userId no es UUID (${userId}), sirviendo contactos desde memoria`);
        }
        ensureDemoContacts();
        const filters = contactFiltersSchema.parse(req.query);
        let filtered = [...demoContactsList];
        if (filters.search) {
          const q = filters.search.toLowerCase();
          filtered = filtered.filter(c =>
            c.full_name.toLowerCase().includes(q) ||
            (c.email && c.email.toLowerCase().includes(q)) ||
            (c.company && c.company.toLowerCase().includes(q))
          );
        }
        if (filters.status) {
          filtered = filtered.filter(c => c.status === filters.status);
        }
        const page = filters.page || 1;
        const pageSize = filters.pageSize || 25;
        const total = filtered.length;
        const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
        return res.json({ data: paginated, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
      }

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
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.scope!.userId);

      if (IS_DEMO_MODE || !isUuid) {
        ensureDemoContacts();
        const contact = demoContactsList.find(c => c.id === req.params.id);
        if (!contact) return res.status(404).json({ error: "Contacto no encontrado" });
        return res.json(contact);
      }

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

  // POST /api/contacts — Create contact (in demo mode, store in memory)
  app.post("/api/contacts", authenticateToken, injectScope, requireRole("admin", "area_manager", "coordinator", "supervisor", "agent"), async (req: AuthenticatedRequest, res) => {
    try {
      const input = createContactSchema.parse(req.body);

      // Si el userId no es un UUID válido, el usuario se autenticó por password
      // sin tener cuenta en auth.users. En ese caso, creamos el contacto en memoria.
      const userId = req.scope!.userId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

      if (IS_DEMO_MODE || !isUuid) {
        if (!IS_DEMO_MODE) {
          console.log(`[CONTACTS] userId no es UUID (${userId}), creando contacto en memoria`);
        }
        ensureDemoContacts();
        const newContact = {
          id: `demo-contact-${Date.now()}`,
          full_name: input.fullName,
          phone: input.phone || null,
          email: input.email || null,
          company: input.company || null,
          source: input.source || "manual",
          status: input.status || "lead",
          assigned_to: userId,
          assignedToName: req.user?.displayName || "Usuario",
          area_id: req.scope!.areaId || null,
          team_id: req.scope!.teamId || null,
          stageName: null,
          metadata: {},
          last_activity_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        demoContactsList.unshift(newContact);
        return res.status(201).json(newContact);
      }

      const contact = await contactService.createContact(input, userId, req.scope!);
      res.status(201).json(contact);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: err.issues });
      }
      console.error("[CONTACTS] Error creating:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH /api/contacts/:id — Update contact (in demo mode, update in memory)
  app.patch("/api/contacts/:id", authenticateToken, injectScope, requireRole("admin", "area_manager", "coordinator", "supervisor", "agent"), async (req: AuthenticatedRequest, res) => {
    try {
      const input = updateContactSchema.parse(req.body);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.scope!.userId);

      if (IS_DEMO_MODE || !isUuid) {
        ensureDemoContacts();
        const idx = demoContactsList.findIndex(c => c.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: "Contacto no encontrado" });
        const updated = { ...demoContactsList[idx], ...input, updated_at: new Date().toISOString() };
        demoContactsList[idx] = updated;
        return res.json(updated);
      }

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
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.scope!.userId);

      if (IS_DEMO_MODE || !isUuid) {
        ensureDemoContacts();
        const idx = demoContactsList.findIndex(c => c.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: "Contacto no encontrado" });
        demoContactsList.splice(idx, 1);
        return res.json({ success: true, message: "Contacto eliminado" });
      }

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
      if (IS_DEMO_MODE || !supabase) {
        ensureDemoContacts();
        // Return demo calls that are linked to this contact
        const contact = demoContactsList.find(c => c.id === req.params.id);
        if (!contact) return res.json([]);
        const contactCalls = localCallsMemory
          .filter((c: any) => c.contact_id === req.params.id || c.clientId === req.params.id)
          .map((c: any) => ({
            id: c.id,
            contact_id: c.contact_id || c.clientId || null,
            metadata: { fileName: c.rawTitle || c.metadata?.fileName, agentName: c.agent, category: c.category, status: c.status || c.metadata?.status },
            score: { total: c.score || 0 },
            analysis: c.analysis || {},
            transcription: c.transcription || [],
            created_at: c.date || c.metadata?.uploadedAt,
          }));
        return res.json(contactCalls);
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

      // ── Demo mode: combine local memory ──
      if (IS_DEMO_MODE || !supabase) {
        ensureDemoContacts();
        const contact = demoContactsList.find(c => c.id === contactId);
        if (!contact) return res.json({ contactId, items: [] });

        // Auditorías vinculadas
        const audits = localCallsMemory
          .filter((c: any) => c.contact_id === contactId || c.clientId === contactId)
          .map((c: any) => ({
            id: c.id,
            type: "audit" as const,
            title: c.metadata?.fileName || c.rawTitle || "Auditoría",
            description: c.agent ? `Agente: ${c.agent}` : "",
            created_at: c.date || c.metadata?.uploadedAt || c.created_at,
            score: c.score || c.metadata?.score || null,
            status: c.status || c.metadata?.status || "completada",
            callId: c.id,
          }));

        // Tareas de demo (en memoria — tasks no tienen persistencia en modo demo)
        // Buscamos en localCallsMemory tareas simuladas tipo "call" vinculadas
        const tasksFromMemory = localCallsMemory
          .filter((c: any) => c.metadata?.taskContactId === contactId || c.taskContactId === contactId)
          .map((c: any) => ({
            id: `task-${c.id}`,
            type: "task" as const,
            title: c.metadata?.taskTitle || "Llamada agendada",
            taskType: c.metadata?.taskType || "call",
            description: c.metadata?.taskDescription || "",
            created_at: c.metadata?.taskDueDate || c.metadata?.uploadedAt || c.created_at,
            status: c.metadata?.taskStatus || "pending",
            priority: c.metadata?.taskPriority || "medium",
          }));

        // Combinar y ordenar por fecha
        const items = [...audits, ...tasksFromMemory]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return res.json({ contactId, items, total: items.length });
      }

      // ── Supabase mode: query both auditorias and tasks ──
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

      // Mapear auditorías
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

      // Mapear tareas
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

      // Combinar y ordenar por fecha descendente
      const items = [...auditItems, ...taskItems]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      res.json({ contactId, items, total: items.length });
    } catch (err: any) {
      console.error("[CONTACTS] Error getting activity:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
