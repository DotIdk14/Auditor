import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { supabase, PORT, setLocalCallsMemory } from "./src/config.js";
import { loadCallsFromSupabase } from "./src/services/supabase.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

import mountAuthRoutes from "./src/routes/auth.js";
import mountCallsRoutes from "./src/routes/calls.js";
import mountAudioRoutes from "./src/routes/audio.js";
import mountNotesRoutes from "./src/routes/notes.js";
import mountObjectionsRoutes from "./src/routes/objections.js";
import mountTranscriptionRoutes from "./src/routes/transcription.js";
import mountContactsRoutes from "./src/routes/contacts.js";
import mountPipelineRoutes from "./src/routes/pipeline.js";
import mountTasksRoutes from "./src/routes/tasks.js";
import mountDashboardRoutes from "./src/routes/dashboard.js";
import mountVisorCallsRoutes from "./src/routes/visor-calls.js";
import mountVisorAuditsRoutes from "./src/routes/visor-audits.js";
import mountVisorResourcesRoutes from "./src/routes/visor-resources.js";

const app = express();

// Trust proxy (Cloudflare Tunnel)
app.set("trust proxy", 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  contentSecurityPolicy: false,
}));

// CORS
const ALLOWED_ORIGINS = [
  "https://auditor-olive.vercel.app",
  "https://auditor-idkboooi-s-projects.vercel.app",
  "https://auditor-dotidk14-idkboooi-s-projects.vercel.app",
  "https://unify-catering-purist.ngrok-free.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
});
app.use(globalLimiter);

// Body parser
app.use(express.json({ limit: "10mb" }));

// ── Mount all route modules ──────────────────────────────────────
mountAuthRoutes(app);
mountCallsRoutes(app);
mountAudioRoutes(app);
mountNotesRoutes(app);
mountObjectionsRoutes(app);
mountTranscriptionRoutes(app);
mountContactsRoutes(app);
mountPipelineRoutes(app);
mountTasksRoutes(app);
mountDashboardRoutes(app);
mountVisorCallsRoutes(app);
mountVisorAuditsRoutes(app);
mountVisorResourcesRoutes(app);

// Global error handler (last middleware)
app.use(errorHandler);

// ── Startup: load persisted calls from Supabase ──────────────────
console.log("Memoria de respaldo inicializada limpia para el Auditor Senior UTEL.");

if (supabase) {
  loadCallsFromSupabase().then((calls) => {
    if (calls.length > 0) {
      setLocalCallsMemory(calls);
      console.log(`[SUPABASE] Restored ${calls.length} calls from database to memory.`);
    }
  }).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[SUPABASE] Failed to load calls on startup:", message);
  });

  // Auto-sync supervisors from Supabase to Firebase Auth
  try {
    import("./src/utils/firebaseSync.js").then(mod => {
      mod.syncSupervisoresFromSupabase(supabase).then((result: any) => {
        console.log(`[SYNC] Supervisores: ${result.created} creados, ${result.updated} actualizados${result.errors.length ? `, ${result.errors.length} errores` : ""}`);
      }).catch((err: any) => {
        console.warn("[SYNC] Auto-sync failed:", err.message);
      });
    }).catch((err: any) => {
      console.warn("[SYNC] Firebase Admin no disponible:", err.message);
    });
  } catch (_) { /* ignore */ }
}

// ── Vite / static integration ────────────────────────────────────
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor en puerto ${PORT}`);
  });
};

if (!process.env.VERCEL) {
  startServer();
}

export default app;
