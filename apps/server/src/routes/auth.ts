import type { Express } from "express";
import jwt from "jsonwebtoken";
import { supabase, supabaseAdmin, loginLimiter, JWT_SECRET, IS_DEMO_MODE } from "../config.js";
import { signToken } from "../middleware/auth.js";
import type { UserRole, JWTPayload } from "../types.js";
import { findDemoUser } from "../services/demoSeeder.js";

/**
 * Maps old Spanish role names to new English role names
 */
function mapRole(oldRole: string | null | undefined): UserRole {
  if (!oldRole) {
    console.warn(`[AUTH] mapRole recibió rol nulo/undefined, usando 'agent' por defecto`);
    return "agent";
  }
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

// ── Email → Role mapping for fallback auth ──
const FALLBACK_ROLES: Record<string, UserRole> = {
  "admin@visor.com": "admin",
  "sofia@visor.com": "area_manager",
  "marcos@visor.com": "area_manager",
  "zakir@visor.com": "coordinator",
  "bagas@visor.com": "supervisor",
  "leonardo@visor.com": "agent",
  "ianidk1@gmail.com": "supervisor",
};

export default function (app: Express): void {
  // POST /api/login — Login with role-based access
  app.post("/api/login", loginLimiter, async (req, res) => {
    try {
      const { email, displayName, username, password } = req.body;

      // Option 0: Demo Mode — hardcoded test users (no DB required)
      if (IS_DEMO_MODE && email && password) {
        const demoUser = findDemoUser(email.trim().toLowerCase(), password);
        if (demoUser) {
          console.log(`[AUTH_DEMO] Acceso demo: ${demoUser.email} como ${demoUser.role}`);
          const token = signToken({
            sub: `demo-${demoUser.email.split('@')[0]}`,
            email: demoUser.email,
            displayName: demoUser.displayName,
            role: demoUser.role,
            areaId: demoUser.areaId,
            teamId: demoUser.teamId,
          });
          return res.json({
            success: true,
            token,
            username: demoUser.displayName,
            role: demoUser.role,
            areaId: demoUser.areaId,
            teamId: demoUser.teamId,
          });
        }
        // If not a demo user, fall through to normal auth
      }

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

              console.log(`[AUTH] ${searchEmail} -> db_role: ${profile.role}, mapped: ${userRole}, area: ${areaId}, team: ${teamId}`);
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

        // Fallback: ALLOWED_EMAILS env var with role mapping
        const allowedEmailsEnv = process.env.ALLOWED_EMAILS || "";
        const fallbackEmails = new Set(
          allowedEmailsEnv.split(",").map(e => e.trim().toLowerCase()).filter(Boolean)
        );
        if (!isAuthorized && fallbackEmails.size > 0) {
          isAuthorized = fallbackEmails.has(searchEmail);
          if (isAuthorized) {
            // Use predefined role mapping or fall back to supervisor
            userRole = FALLBACK_ROLES[searchEmail] || "supervisor";
            console.log(`[AUTH_FALLBACK] ${searchEmail} autorizado por ALLOWED_EMAILS como ${userRole}`);
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
        }

        // Si NO está autorizado por Supabase/ALLOWED_EMAILS pero hay password,
        // NO retornamos 403 aún — dejamos que Option 2 lo intente.
        if (!password) {
          console.warn(`[AUTH_DENIED] Acceso denegado para: ${email} (sin password).`);
          return res.status(403).json({
            success: false,
            error: `Acceso denegado: El correo ${email} no tiene permisos. Contacta al administrador.`,
          });
        }

        // Si hay password, caemos a Option 2
        console.log(`[AUTH] ${email} no autorizado por perfil/ALLOWED_EMAILS, intentando password...`);
      }

      // Option 2: Password Authentication
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
            const role = FALLBACK_ROLES[searchEmail] || "supervisor";

            // Intentar resolver el UUID real del usuario en auth.users
            // Esto es necesario para que assigned_to funcione correctamente
            // en la tabla contacts (FK a auth.users)
            let userSub = searchEmail;
            if (supabaseAdmin) {
              try {
                const { data: authUser } = await supabaseAdmin
                  .schema("auth")
                  .from("users")
                  .select("id")
                  .eq("email", searchEmail)
                  .maybeSingle();
                if (authUser?.id) {
                  userSub = authUser.id;
                  console.log(`[AUTH] UUID resuelto para ${searchEmail}: ${userSub}`);
                }
              } catch (err: any) {
                console.warn(`[AUTH] No se pudo resolver UUID para ${searchEmail}: ${err.message}`);
              }
            }

            const token = signToken({
              sub: userSub,
              email: searchEmail,
              displayName: username || searchEmail.split("@")[0],
              role,
              areaId: null,
              teamId: null,
            });
            return res.json({ success: true, token, username: username || searchEmail.split("@")[0], role });
          }

          // Password incorrecto
          return res.status(401).json({ success: false, error: "Contraseña de acceso incorrecta." });
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
    } catch (err: any) {
      console.error("[AUTH_LOGIN_ERROR]", err.message);
      return res.status(500).json({ success: false, error: "Error interno del servidor al iniciar sesión." });
    }
  });

  // POST /api/verify-session — Verify JWT session (legacy, no refresh)
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

  // ---------------------------------------------------------------------------
  // POST /api/refresh-token — Issue a new JWT if current one is valid
  // or expired within the grace period (REFRESH_GRACE_SECONDS, default 3600 = 1h).
  //
  // Why a grace period? The 401 interceptor catches expired tokens. Without
  // this window, an expired JWT can NEVER be refreshed (crypto verification
  // fails), forcing the user to log in again.
  // ---------------------------------------------------------------------------
  const REFRESH_GRACE_SECONDS = parseInt(process.env.REFRESH_GRACE_SECONDS || "3600", 10);

  app.post("/api/refresh-token", (req, res) => {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ error: "Token requerido." });
    }

    try {
      // 1. Decode WITHOUT verifying expiration first, so we can inspect the expiry
      const decoded = jwt.decode(token) as jwt.JwtPayload | null;
      if (!decoded || !decoded.sub) {
        return res.status(401).json({ error: "Token inválido." });
      }

      // 2. Check expiration with grace window
      const now = Math.floor(Date.now() / 1000);
      const exp = decoded.exp ?? 0;

      if (exp < now - REFRESH_GRACE_SECONDS) {
        return res.status(401).json({
          error: "Sesión expirada. Debes iniciar sesión nuevamente.",
          expired: true,
        });
      }

      // 3. Verify signature (catches tampered tokens)
      const verified = jwt.verify(token, JWT_SECRET!, { ignoreExpiration: true }) as JWTPayload;

      // 4. Issue a NEW token with fresh 24h expiry
      const newToken = signToken({
        sub: verified.sub,
        email: verified.email,
        displayName: verified.displayName,
        role: verified.role,
        areaId: verified.areaId,
        teamId: verified.teamId,
      });

      console.log(`[REFRESH] Token renovado para ${verified.email} (${verified.role})`);
      return res.json({
        success: true,
        token: newToken,
        user: verified,
      });
    } catch (err) {
      console.error("[REFRESH_ERROR]", (err as Error).message);
      return res.status(401).json({ error: "Token inválido o sesión expirada." });
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
