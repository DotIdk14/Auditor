import type { Express } from "express";
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
  // POST /api/login — Google OAuth
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
      let isAuthorized = false;

      // Try InsForge profiles first
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
            isAuthorized = true;
            userId = profile.id;
            if (profile.full_name) userName = profile.full_name;
            userRole = mapRole(profile.role);
            areaId = profile.area_id || null;
            teamId = profile.team_id || null;
          }
        } catch (err: any) {
          console.warn("[AUTH] InsForge lookup failed, trying fallback:", err.message);
        }
      }

      // Fallback: ALLOWED_EMAILS
      if (!isAuthorized) {
        const allowedEmailsEnv = process.env.ALLOWED_EMAILS || "";
        const allowedEmails = new Set(
          allowedEmailsEnv.split(",").map(e => e.trim().toLowerCase()).filter(Boolean)
        );

        if (allowedEmails.size > 0 && allowedEmails.has(searchEmail)) {
          isAuthorized = true;
          userRole = "supervisor";
          console.log(`[AUTH_FALLBACK] ${searchEmail} autorizado por ALLOWED_EMAILS`);
        }
      }

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          error: `Acceso denegado: El correo ${email} no tiene permisos.`,
        });
      }

      const token = signToken({
        sub: userId || searchEmail,
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
