import type { Express } from "express";
import { z } from "zod";
import { authenticateToken, requireRole, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import {
  listUsers,
  getOrgStructure,
  updateUser,
  createTeam,
  updateTeam,
  createArea,
  updateArea,
  createUser,
  setUserPassword,
  MANAGER_ROLES,
} from "../services/userService.js";

const ROLE_ENUM = z.enum(["admin", "area_manager", "coordinator", "supervisor", "agent", "qa"]);

const userPatchSchema = z.object({
  full_name: z.string().min(1).optional(),
  role: ROLE_ENUM.optional(),
  area_id: z.string().uuid().nullable().optional(),
  team_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).optional(),
  role: ROLE_ENUM,
  areaId: z.string().uuid().nullable().optional(),
  teamId: z.string().uuid().nullable().optional(),
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
});

const createAreaSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).optional(),
  description: z.string().optional(),
  managerId: z.string().uuid().nullable().optional(),
});

const updateAreaSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

const createTeamSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).optional(),
  areaId: z.string().uuid(),
  supervisorId: z.string().uuid().nullable().optional(),
  coordinatorId: z.string().uuid().nullable().optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  supervisorId: z.string().uuid().nullable().optional(),
  coordinatorId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

export default function (app: Express): void {
  // GET /api/users — List users (scoped by role)
  app.get("/api/users", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const users = await listUsers(req.scope!);
      res.json(users);
    } catch (err: any) {
      console.error("[USERS] list error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/users/org — Org structure (areas + teams) for managers
  app.get(
    "/api/users/org",
    authenticateToken,
    injectScope,
    requireRole(...MANAGER_ROLES),
    async (req: AuthenticatedRequest, res) => {
      try {
        const org = await getOrgStructure(req.scope!);
        res.json(org);
      } catch (err: any) {
        console.error("[USERS] org error:", err.message);
        res.status(500).json({ error: err.message });
      }
    }
  );

  // PATCH /api/users/:id — Update role / area / team / active / password (managers only)
  app.patch(
    "/api/users/:id",
    authenticateToken,
    injectScope,
    requireRole(...MANAGER_ROLES),
    async (req: AuthenticatedRequest, res) => {
      try {
        const patch = userPatchSchema.parse(req.body);
        const updated = await updateUser(req.scope!, req.params.id, patch);
        if (patch.password) {
          await setUserPassword(req.scope!, req.params.id, patch.password);
        }
        res.json(updated);
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ error: "Datos inválidos", details: err.issues });
        }
        console.error("[USERS] patch error:", err.message);
        res.status(err.message.includes("Permisos") ? 403 : 400).json({ error: err.message });
      }
    }
  );

  // POST /api/users — Create a user with credentials (managers, scoped)
  app.post(
    "/api/users",
    authenticateToken,
    injectScope,
    requireRole(...MANAGER_ROLES),
    async (req: AuthenticatedRequest, res) => {
      try {
        const input = createUserSchema.parse(req.body);
        const user = await createUser(req.scope!, input);
        res.status(201).json(user);
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ error: "Datos inválidos", details: err.issues });
        }
        console.error("[USERS] create user error:", err.message);
        res.status(err.message.includes("Permisos") ? 403 : 400).json({ error: err.message });
      }
    }
  );

  // POST /api/areas — Create an area/coordinación (admin only)
  app.post(
    "/api/areas",
    authenticateToken,
    injectScope,
    requireRole("admin"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const input = createAreaSchema.parse(req.body);
        const area = await createArea(req.scope!, input);
        res.status(201).json(area);
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ error: "Datos inválidos", details: err.issues });
        }
        console.error("[USERS] create area error:", err.message);
        res.status(400).json({ error: err.message });
      }
    }
  );

  // PATCH /api/areas/:id — Update an area (admin only)
  app.patch(
    "/api/areas/:id",
    authenticateToken,
    injectScope,
    requireRole("admin"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const patch = updateAreaSchema.parse(req.body);
        const area = await updateArea(req.scope!, req.params.id, patch);
        res.json(area);
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ error: "Datos inválidos", details: err.issues });
        }
        console.error("[USERS] update area error:", err.message);
        res.status(400).json({ error: err.message });
      }
    }
  );

  // POST /api/teams — Create a team (admin / area_manager / coordinator)
  app.post(
    "/api/teams",
    authenticateToken,
    injectScope,
    requireRole(...MANAGER_ROLES),
    async (req: AuthenticatedRequest, res) => {
      try {
        const input = createTeamSchema.parse(req.body);
        const team = await createTeam(req.scope!, input);
        res.status(201).json(team);
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ error: "Datos inválidos", details: err.issues });
        }
        console.error("[USERS] create team error:", err.message);
        res.status(400).json({ error: err.message });
      }
    }
  );

  // PATCH /api/teams/:id — Update team (supervisor / coordinator / active)
  app.patch(
    "/api/teams/:id",
    authenticateToken,
    injectScope,
    requireRole(...MANAGER_ROLES),
    async (req: AuthenticatedRequest, res) => {
      try {
        const patch = updateTeamSchema.parse(req.body);
        const team = await updateTeam(req.scope!, req.params.id, patch);
        res.json(team);
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ error: "Datos inválidos", details: err.issues });
        }
        console.error("[USERS] update team error:", err.message);
        res.status(400).json({ error: err.message });
      }
    }
  );
}
