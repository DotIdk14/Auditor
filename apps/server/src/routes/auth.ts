import type { Express } from "express";
import jwt from "jsonwebtoken";
import { supabase, supabaseAdmin, loginLimiter, JWT_SECRET } from "../config.js";
import { signToken } from "../middleware/auth.js";
import type { UserRole } from "../types.js";

/**
 * Maps old Spanish role names to new English role names
 */
function mapRole(oldRole: string): UserRole {
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
  return roleMap[oldRole.toLowerCase()] || "agent";
}

export default function (app: Express): void {
  // POST /api/login — Login with role-based access
  app.post("/api/login", loginLimiter, async (req, res) => {
    const { email, displayName, username, password } = req.body;

    // Option 1: Google OAuth / Email-based
    if (email) {
      const searchEmail = email.trim().toLowerCase();
      let isAuthorized = false;
      let userName = displayName || email.split("@")[0];
      let userRole: UserRole = "agent";
      let areaId: string | null = null;
      let teamId: string | null = null;
      let userId: string | null = null;

      // Try Supabase profiles first (use admin client to bypass RLS)
      if (supabaseAdmin) {
        try {
          const { data: profile, error } = await supabaseAdmin
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
            userRole = mapRole(profile.role);
            userId = profile.id;
            if (profile.full_name) userName = profile.full_name;
            areaId = profile.area_id;
            teamId = profile.team_id;

            console.log(`[AUTH] ${searchEmail} -> rol: ${userRole}, área: ${areaId}, equipo: ${teamId}`);
          } else {
            // Fallback: check old 'rol' column if 'role' doesn't exist
            try {
              const { data: oldProfile } = await supabase!
                .from("profiles")
                .select("id, nombre, rol")
                .eq("email", searchEmail)
                .single();

              if (oldProfile) {
                isAuthorized = ["admin", "coordinador"].includes(oldProfile.rol);
                userRole = mapRole(oldProfile.rol);
                if (oldProfile.nombre) userName = oldProfile.nombre;
                console.log(`[AUTH_LEGACY] ${searchEmail} -> rol: ${oldProfile.rol}`);
              }
            } catch {
              console.log(`[AUTH] ${searchEmail} no encontrado en profiles`);
            }
          }
        } catch (err: any) {
          console.error(`[AUTH_ERROR] ${err.message}`);
        }
      }

      // Fallback: ALLOWED_EMAILS env var
      const allowedEmailsEnv = process.env.ALLOWED_EMAILS || "";
      const fallbackEmails = new Set(
        allowedEmailsEnv.split(",").map(e => e.trim().toLowerCase()).filter(Boolean)
      );
      if (!isAuthorized && fallbackEmails.size > 0) {
        isAuthorized = fallbackEmails.has(searchEmail);
        if (isAuthorized) {
          userRole = "supervisor";
          console.log(`[AUTH_FALLBACK] ${searchEmail} autorizado por ALLOWED_EMAILS`);
        }
      }

      if (isAuthorized) {
        console.log(`[AUTH_SUCCESS] Acceso concedido para: ${searchEmail} (${userRole})`);
        const token = signToken({
          sub: userId || searchEmail,
          email: searchEmail,
          displayName: userName,
          role: userRole,
          areaId,
          teamId,
        });
        return res.json({
          success: true,
          token,
          username: userName,
          role: userRole,
          areaId,
          teamId,
        });
      } else {
        console.warn(`[AUTH_DENIED] Acceso denegado para: ${email}.`);
        return res.status(403).json({
          success: false,
          error: `Acceso denegado: El correo ${email} no tiene permisos. Contacta al administrador.`,
        });
      }
    }

    // Option 2: Password Authentication (legacy fallback)
    if (password) {
      const correctPassword = process.env.SUPERVISOR_PASSWORD;

      if (email) {
        const searchEmail = email.trim().toLowerCase();
        const allowedEmailsEnv = process.env.ALLOWED_EMAILS || "";
        const allowedEmails = new Set(
          allowedEmailsEnv.split(",").map(e => e.trim().toLowerCase()).filter(Boolean)
        );

        if (!allowedEmails.has(searchEmail)) {
          return res.status(403).json({ success: false, error: `El correo ${email} no tiene permisos.` });
        }

        if (correctPassword && password === correctPassword) {
          const token = signToken({
            sub: searchEmail,
            email: searchEmail,
            displayName: username || searchEmail.split("@")[0],
            role: "supervisor",
            areaId: null,
            teamId: null,
          });
          return res.json({ success: true, token, username: username || searchEmail.split("@")[0], role: "supervisor" });
        }
      }

      if (!correctPassword) {
        return res.status(501).json({ success: false, error: "Autenticación por contraseña no configurada en el servidor." });
      }
      if (password === correctPassword) {
        const token = signToken({
          sub: username || "supervisor",
          email: "",
          displayName: username || "Supervisor",
          role: "supervisor",
          areaId: null,
          teamId: null,
        });
        return res.json({ success: true, token, username: username || "Supervisor", role: "supervisor" });
      } else {
        return res.status(401).json({ success: false, error: "Contraseña de acceso incorrecta." });
      }
    }

    return res.status(400).json({ success: false, error: "Se requiere un método de autenticación válido." });
  });

  // POST /api/verify-session — Verify JWT session
  app.post("/api/verify-session", (req, res) => {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ error: "Token requerido." });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET!);
      return res.json({ success: true, user: decoded });
    } catch {
      return res.status(401).json({ error: "Sesión inválida o expirada" });
    }
  });

  // POST /api/sync-supervisores — Sync Supabase profiles to Firebase Auth
  app.post("/api/sync-supervisores", async (req, res) => {
    try {
      console.log("[SYNC] Iniciando sincronización Supabase → Firebase Auth...");
      const { syncSupervisoresFromSupabase } = await import("../utils/firebaseSync.js");
      const result = await syncSupervisoresFromSupabase(supabase);
      console.log(`[SYNC] Completado: ${result.created} creados, ${result.updated} actualizados, ${result.errors.length} errores`);
      return res.json(result);
    } catch (err: any) {
      console.error("[SYNC] Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/set-supervisor-passwords — Set known passwords for supervisors
  app.post("/api/set-supervisor-passwords", async (req, res) => {
    try {
      const password = req.body.password || "Supervisor2026!";
      console.log("[PASSWORDS] Asignando contraseña a supervisores en Firebase Auth...");
      const { syncSupervisoresFromSupabase } = await import("../utils/firebaseSync.js");
      const result = await syncSupervisoresFromSupabase(supabase, password);
      return res.json({
        message: "Contraseñas asignadas. Usa Email/Password para iniciar sesión desde cualquier dominio.",
        updated: result.updated,
        errors: result.errors,
      });
    } catch (err: any) {
      console.error("[PASSWORDS] Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // GET /api/me — Get current user's profile (authenticated)
  app.get("/api/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token requerido" });
    }

    try {
      const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET!);
      return res.json({ success: true, user: decoded });
    } catch {
      return res.status(401).json({ error: "Token inválido" });
    }
  });
}
