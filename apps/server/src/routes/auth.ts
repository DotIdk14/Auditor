import type { Express } from "express";
import { randomUUID } from "crypto";
import { loginLimiter } from "../config.js";
import { authenticateToken, signToken } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import type { UserRole } from "../types.js";
import { insforge } from "../services/insforge.js";

function mapRole(role: string | null | undefined): UserRole {
  if (!role) return "agent";
  const roleMap: Record<string, UserRole> = {
    admin: "admin",
    coordinador: "coordinator",
    supervisor: "supervisor",
    agente: "agent",
    auditor: "qa",
    area_manager: "area_manager",
    coordinator: "coordinator",
    agent: "agent",
    qa: "qa",
  };
  return roleMap[role.toLowerCase()] || "agent";
}

export default function (app: Express): void {
  // POST /api/login — Registro/login abierto. Todos entran como agente por defecto.
  app.post("/api/login", loginLimiter, async (req, res) => {
    try {
      const { email, displayName } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: "Email requerido" });
      }

      const searchEmail = email.trim().toLowerCase();
      let userName = displayName || searchEmail.split("@")[0];
      let userRole: UserRole = "agent";
      let areaId: string | null = null;
      let teamId: string | null = null;
      let userId: string | null = null;

      // Buscar o crear perfil en InsForge
      if (insforge) {
        try {
          const { data: profile, error } = await insforge.database
            .from("profiles")
            .select("id, full_name, role, area_id, team_id, is_active")
            .eq("email", searchEmail)
            .maybeSingle();

          if (profile && !error) {
            if (!profile.is_active) {
              return res.status(403).json({
                success: false,
                error: "Tu cuenta está desactivada. Contacta al administrador.",
              });
            }
            userId = profile.id;
            if (profile.full_name) userName = profile.full_name;
            userRole = mapRole(profile.role);
            areaId = profile.area_id || null;
            teamId = profile.team_id || null;
          } else {
            // Auto-registro: crear perfil como agente
            const newId = randomUUID();
            const { error: insertError } = await insforge.database.from("profiles").insert([{
              id: newId,
              email: searchEmail,
              full_name: userName,
              role: "agent",
              is_active: true,
            }]);
            if (!insertError) {
              userId = newId;
              console.log(`[AUTH] Nuevo perfil creado: ${searchEmail} (agent)`);
            } else {
              console.warn("[AUTH] Error al crear perfil:", insertError.message);
              userId = searchEmail;
            }
          }
        } catch (err: any) {
          console.warn("[AUTH] InsForge lookup failed, allowing as agent:", err.message);
          userId = searchEmail;
        }
      } else {
        userId = searchEmail;
      }

      const token = signToken({
        sub: userId,
        email: searchEmail,
        displayName: userName,
        role: userRole,
        areaId,
        teamId,
      });
      console.log(`[AUTH] Login exitoso: ${searchEmail} (${userRole})`);
      return res.json({
        success: true,
        token,
        username: userName,
        role: userRole,
        areaId,
        teamId,
        userId,
      });
    } catch (err: any) {
      console.error("[AUTH_LOGIN_ERROR]", err.message);
      return res.status(500).json({
        success: false,
        error: "Error interno del servidor al iniciar sesión.",
      });
    }
  });

  // POST /api/verify-session
  app.post("/api/verify-session", authenticateToken, (req: AuthenticatedRequest, res) => {
    return res.json({
      success: true,
      user: {
        sub: req.user!.sub,
        email: req.user!.email,
        displayName: req.user!.displayName,
        role: req.user!.role,
        areaId: req.user!.areaId,
        teamId: req.user!.teamId,
      },
    });
  });

  // GET /api/me
  app.get("/api/me", authenticateToken, (req: AuthenticatedRequest, res) => {
    return res.json({
      success: true,
      user: {
        sub: req.user!.sub,
        email: req.user!.email,
        displayName: req.user!.displayName,
        role: req.user!.role,
        areaId: req.user!.areaId,
        teamId: req.user!.teamId,
      },
    });
  });
}
