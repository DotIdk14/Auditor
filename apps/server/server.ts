import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { PORT, setLocalCallsMemory, setLocalContactsMemory, localInteractionsMemory } from "./src/config.js";
import { loadCallsFromSupabase } from "./src/services/supabase.js";
import { loadContactsFromDB, loadInteractionsFromDB, loadProfilesCache } from "./src/services/contactService.js";
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
import mountRecoveryRoutes from "./src/routes/recovery.js";
import mountInteractionsRoutes from "./src/routes/interactions.js";

const app = express();

// Trust proxy (Cloudflare Tunnel)
app.set("trust proxy", 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.insforge.app", "https://*.vercel.app"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
}));

// CORS
const ALLOWED_ORIGINS = [
  "https://auditor-olive.vercel.app",
  "https://auditor-idkboooi-s-projects.vercel.app",
  "https://auditor-dotidk14-idkboooi-s-projects.vercel.app",
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

// ── Health-check endpoint ─────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

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
mountRecoveryRoutes(app);
mountInteractionsRoutes(app);

// ── 404 handler (after all routes, before error handler) ─────────
app.use((req, res, _next) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Global error handler (last middleware)
app.use(errorHandler);

// ── Startup: rehydrate memory from DB ────────────────────────────
loadCallsFromSupabase().then((calls) => {
  if (calls.length > 0) {
    setLocalCallsMemory(calls);
    console.log(`[DB] Restored ${calls.length} calls from database to memory.`);
  }
}).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.warn("[DB] Failed to load calls on startup:", message);
});

loadProfilesCache().then(() => console.log("[DB] Profiles cache loaded.")).catch(() => {});

loadContactsFromDB().then((contacts) => {
  if (contacts.length > 0) {
    setLocalContactsMemory(contacts);
    console.log(`[DB] Restored ${contacts.length} contacts from database to memory.`);
  }
}).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.warn("[DB] Failed to load contacts on startup:", message);
});

loadInteractionsFromDB().then((interactions) => {
  if (interactions.length > 0) {
    localInteractionsMemory.length = 0;
    localInteractionsMemory.push(...interactions);
    console.log(`[DB] Restored ${interactions.length} interactions from database to memory.`);
  }
}).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.warn("[DB] Failed to load interactions on startup:", message);
});

// ── Start server ────────────────────────────────────────────────
if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor en puerto ${PORT}`);
  });
}

export default app;
