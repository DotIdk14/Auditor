import type { Express } from "express";
import { z } from "zod";
import { authenticateToken, requireRole, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import * as taskService from "../services/taskService.js";

const createTaskSchema = z.object({
  contactId: z.string().uuid("Contacto inválido"),
  title: z.string().min(1, "El título es obligatorio").max(300),
  description: z.string().max(2000).optional(),
  assignedTo: z.string().uuid("Usuario asignado inválido"),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("medium"),
  type: z.enum(["call", "email", "meeting", "follow_up", "demo", "proposal", "other"]).optional().default("follow_up"),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional().nullable(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  type: z.enum(["call", "email", "meeting", "follow_up", "demo", "proposal", "other"]).optional(),
});

const taskFiltersSchema = z.object({
  contactId: z.string().uuid().optional(),
  assignedTo: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDateBefore: z.string().datetime().optional(),
  dueDateAfter: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export default function (app: Express): void {
  // GET /api/tasks — List tasks with filters
  app.get("/api/tasks", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const filters = taskFiltersSchema.parse(req.query);
      const result = await taskService.listTasks(filters, req.scope!);
      res.json(result);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Filtros inválidos", details: err.issues });
      }
      console.error("[TASKS] Error listing:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/tasks/:id — Get single task
  app.get("/api/tasks/:id", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const task = await taskService.getTask(req.params.id, req.scope!);
      if (!task) {
        return res.status(404).json({ error: "Tarea no encontrada" });
      }
      res.json(task);
    } catch (err: any) {
      console.error("[TASKS] Error getting:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/tasks — Create task
  app.post("/api/tasks", authenticateToken, injectScope, requireRole("admin", "area_manager", "coordinator", "supervisor", "agent"), async (req: AuthenticatedRequest, res) => {
    try {
      const input = createTaskSchema.parse(req.body);
      const task = await taskService.createTask(input, req.scope!.userId, req.scope!);
      res.status(201).json(task);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: err.issues });
      }
      console.error("[TASKS] Error creating:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH /api/tasks/:id — Update task
  app.patch("/api/tasks/:id", authenticateToken, injectScope, requireRole("admin", "area_manager", "coordinator", "supervisor", "agent"), async (req: AuthenticatedRequest, res) => {
    try {
      const input = updateTaskSchema.parse(req.body);
      const task = await taskService.updateTask(req.params.id, input, req.scope!);
      if (!task) {
        return res.status(404).json({ error: "Tarea no encontrada" });
      }
      res.json(task);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: err.issues });
      }
      console.error("[TASKS] Error updating:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/tasks/:id — Delete task (admin/manager/supervisor only)
  app.delete("/api/tasks/:id", authenticateToken, injectScope, requireRole("admin", "area_manager", "coordinator", "supervisor"), async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await taskService.deleteTask(req.params.id, req.scope!);
      if (!deleted) {
        return res.status(404).json({ error: "Tarea no encontrada" });
      }
      res.json({ success: true, message: "Tarea eliminada" });
    } catch (err: any) {
      console.error("[TASKS] Error deleting:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
