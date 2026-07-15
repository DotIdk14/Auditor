import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { supabase, PORT, JWT_SECRET, setLocalCallsMemory, localCallsMemory, localContactsMemory, prependContact } from "./src/config.js";
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
import mountRecoveryRoutes from "./src/routes/recovery.js";
import mountInteractionsRoutes from "./src/routes/interactions.js";

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

// ── Startup validation ────────────────────────────────────────────
if (!JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET no configurado. La autenticación JWT fallará.");
  console.warn("   Genera uno con: openssl rand -hex 64");
  console.warn("   Configúralo en Vercel: Settings > Environment Variables > JWT_SECRET");
}

// ── Health-check endpoint ─────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  const routeCount = app._router?.stack?.filter((layer: any) => layer.route).length || 0;
  res.json({
    status: "ok",
    supabase: !!supabase,
    jwt: !!JWT_SECRET,
    routes: routeCount,
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
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      "/api/health",
      "/api/login",
      "/api/llamadas",
      "/api/llamadas/:id/assign-contact",
      "/api/contacts",
      "/api/contacts/:id/activity",
      "/api/contacts/:id/calls",
      "/api/tasks",
      "/api/visor/calls",
      "/api/whisper",
      "/api/admin/assemblyai-transcripts",
      "/api/admin/recover-transcript/:callId",
      "/api/admin/force-recover/:callId",
      "/api/admin/zombie-calls",
      "/api/admin/zombie-call/:callId",
      "/api/admin/cleanup-zombies",
    ],
  });
});

// Global error handler (last middleware)
app.use(errorHandler);

// ── Startup: seed demo data or load from Supabase ────────────────
console.log("Memoria de respaldo inicializada limpia para el Auditor Senior UTEL.");

// Seed demo contacts when no Supabase is configured
if (!supabase && localContactsMemory.length === 0) {
  const now = new Date().toISOString();
  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
  const demoContacts = [
    // ── No contactados ──
    {
      id: "demo-contact-001",
      full_name: "María García López",
      phone: "+52 55 1234 5678",
      email: "maria.garcia@empresa.com",
      company: "Tech Solutions SA",
      source: "web",
      status: "lead",
      disposition: "no_contactado",
      disposition_locked: false,
      assigned_to: "admin@test.com",
      area_id: null,
      team_id: null,
      pipeline_id: null,
      stage_id: null,
      metadata: {},
      last_activity_at: null,
      callback_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-contact-002",
      full_name: "Roberto Díaz Sánchez",
      phone: "+52 55 8765 4321",
      email: "roberto.diaz@negocios.com",
      company: "Negocios Globales",
      source: "outbound",
      status: "lead",
      disposition: "no_contactado",
      disposition_locked: false,
      assigned_to: "admin@test.com",
      area_id: null,
      team_id: null,
      pipeline_id: null,
      stage_id: null,
      metadata: {},
      last_activity_at: null,
      callback_at: null,
      created_at: now,
      updated_at: now,
    },
    // ── Cuelgues (pendientes de callback) ──
    {
      id: "demo-contact-003",
      full_name: "Carlos Rodríguez Martínez",
      phone: "+52 33 9876 5432",
      email: "carlos.rodriguez@firma.mx",
      company: "Consultoría Moderna",
      source: "referral",
      status: "lead",
      disposition: "cuelgue",
      disposition_locked: false,
      assigned_to: "admin@test.com",
      area_id: null,
      team_id: null,
      pipeline_id: null,
      stage_id: null,
      metadata: { notes: "Se le marcó pero no contestó. Pide que le llamemos mañana por la tarde." },
      last_activity_at: now,
      callback_at: tomorrow,
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-contact-004",
      full_name: "Laura Hernández Ruiz",
      phone: "+52 81 5555 9999",
      email: "laura.hernandez@corp.com",
      company: "Corporativo del Norte",
      source: "inbound",
      status: "lead",
      disposition: "cuelgue",
      disposition_locked: false,
      assigned_to: "admin@test.com",
      area_id: null,
      team_id: null,
      pipeline_id: null,
      stage_id: null,
      metadata: { notes: "En reunión, pide volver a llamar a las 3pm" },
      last_activity_at: now,
      callback_at: nextWeek,
      created_at: now,
      updated_at: now,
    },
    // ── Prospectos evaluando ──
    {
      id: "demo-contact-005",
      full_name: "Ana Martínez Fernández",
      phone: "+52 81 5555 1234",
      email: "ana.martinez@corporativo.com",
      company: "Corporativo del Norte",
      source: "outbound",
      status: "prospect",
      disposition: "evaluando",
      disposition_locked: true,
      assigned_to: "admin@test.com",
      area_id: null,
      team_id: null,
      pipeline_id: null,
      stage_id: null,
      metadata: { notes: "Se le envió catálogo de servicios. Está comparando precios con la competencia." },
      last_activity_at: now,
      callback_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-contact-006",
      full_name: "Pedro López Gutiérrez",
      phone: "+52 55 1111 2222",
      email: "pedro.lopez@startup.io",
      company: "StartupTech",
      source: "event",
      status: "prospect",
      disposition: "evaluando",
      disposition_locked: true,
      assigned_to: "admin@test.com",
      area_id: null,
      team_id: null,
      pipeline_id: null,
      stage_id: null,
      metadata: { notes: "Conocido en el evento de tecnología. Le interesó el módulo de auditoría." },
      last_activity_at: now,
      callback_at: null,
      created_at: now,
      updated_at: now,
    },
  ];
  demoContacts.forEach(c => prependContact(c));
  console.log(`[SEED] ${demoContacts.length} contactos de prueba cargados (2 no contactados, 2 cuelgues, 2 prospectos evaluando).`);
}

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

// ── Static file serving (prod only — dev visor runs separately on :5174) ──
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// ── Start server ────────────────────────────────────────────────
if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor en puerto ${PORT}`);
  });
}

export default app;
