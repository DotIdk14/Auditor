import type { Express } from "express";
import { loginLimiter } from "../config.js";
import { authenticateToken } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { insforge } from "../services/insforge.js";

export default function (app: Express): void {
  // POST /api/login — Authenticate user with InsForge
  app.post("/api/login", loginLimiter, async (req, res) => {
    try {
      const { email, displayName } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: "Email requerido" });
      }

      const searchEmail = email.trim().toLowerCase();
      let userName = displayName || searchEmail.split("@")[0];
      let userRole = "agent";
      let areaId: string | null = null;
      let teamId: string | null = null;
      let userId: string | null = null;

      // Look up user profile in profiles table
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
        userRole = profile.role || "agent";
        areaId = profile.area_id || null;
        teamId = profile.team_id || null;
      } else {
        // Check allowed emails from env var
        const allowedEmailsEnv = process.env.ALLOWED_EMAILS || "";
        const allowedEmails = new Set(
          allowedEmailsEnv.split(",").map(e => e.trim().toLowerCase()).filter(Boolean)
        );
        if (allowedEmails.size === 0 || !allowedEmails.has(searchEmail)) {
          return res.status(403).json({
            success: false,
            error: `Acceso denegado: El correo ${email} no tiene permisos.`,
          });
        }
      }

      console.log(`[AUTH] Login exitoso: ${searchEmail} (${userRole})`);
      return res.json({
        success: true,
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

  // POST /api/verify-session — Verify JWT and return user info
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

  // GET /api/me — Get current user profile
  app.get("/api/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
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
