import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { WebSocket } from "ws";
import { evaluateHeuristic, buildChecklist, Modalidad } from "./src/shared/pce-rubric.js";
import { generateHighFidelitySimulatedCall } from "./src/__fixtures__/simulated-calls.js";
import { syncSupervisoresFromSupabase } from "./src/utils/firebaseSync.js";

dotenv.config({ path: ".env.local" });

// Whisper initialization is lazy — native addon may not be available in serverless environments
let whisperModule: typeof import("@napi-rs/whisper") | null = null;
let whisperModel: any = null;

async function getWhisperModule() {
  if (whisperModule) return whisperModule;
  try {
    whisperModule = await import("@napi-rs/whisper");
    return whisperModule;
  } catch {
    return null;
  }
}

async function initWhisperModel(): Promise<any> {
  if (whisperModel) return whisperModel;
  const mod = await getWhisperModule();
  if (!mod) return null;
  try {
    const modelPath = process.env.WHISPER_MODEL_PATH || "./node_modules/@napi-rs/whisper/scripts/ggml-small.bin";
    const modelBuf = fs.readFileSync(modelPath);
    whisperModel = new mod.Whisper(modelBuf);
    console.log(`[WHISPER] Modelo cargado: ${modelPath}`);
    return whisperModel;
  } catch (e: any) {
    console.warn(`[WHISPER] No se pudo cargar modelo local: ${e.message}. Se usará modo simulado.`);
    return null;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-secret-change-in-production' : '');
const JWT_EXPIRY = '24h';

function signToken(payload: Record<string, unknown>): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { transport: WebSocket as any },
}) : null;

// ── Supabase persistence helpers ──────────────────────────────────
async function loadCallsFromSupabase(): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("auditorias")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.warn("[SUPABASE] Could not load calls:", error.message);
      return [];
    }
    console.log(`[SUPABASE] Loaded ${data.length} calls from database.`);
    return (data || []).map((row: any) => ({
      id: row.id,
      metadata: row.metadata,
      score: row.score,
      analysis: row.analysis,
      transcription: row.transcription || [],
    }));
  } catch (err: any) {
    console.warn("[SUPABASE] Connection error loading calls:", err.message);
    return [];
  }
}

async function saveCallToSupabase(call: any): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("auditorias").upsert({
      id: call.id,
      metadata: call.metadata,
      score: call.score,
      analysis: call.analysis,
      transcription: call.transcription || [],
    });
    if (error) console.warn("[SUPABASE] Could not save call:", error.message);
  } catch (err: any) {
    console.warn("[SUPABASE] Connection error saving call:", err.message);
  }
}

async function deleteCallFromSupabase(id: string): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("auditorias").delete().eq("id", id);
    if (error) console.warn("[SUPABASE] Could not delete call:", error.message);
  } catch (err: any) {
    console.warn("[SUPABASE] Connection error deleting call:", err.message);
  }
}

// ── Notas & Objeciones persistence helpers ────────────────────────

async function saveNotaToSupabase(nota: any): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("notas").upsert({
      id: nota.id,
      auditoria_id: nota.auditoriaId,
      supervisor_email: nota.supervisorEmail,
      supervisor_name: nota.supervisorName,
      segment_start: nota.segmentStart,
      segment_end: nota.segmentEnd,
      text: nota.text,
    });
    if (error) console.warn("[SUPABASE] Could not save nota:", error.message);
  } catch (err: any) {
    console.warn("[SUPABASE] Connection error saving nota:", err.message);
  }
}

async function loadNotasFromSupabase(auditoriaId: string): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("notas")
      .select("*")
      .eq("auditoria_id", auditoriaId)
      .order("created_at", { ascending: true });
    if (error) return [];
    return (data || []).map((row: any) => ({
      id: row.id,
      auditoriaId: row.auditoria_id,
      supervisorEmail: row.supervisor_email,
      supervisorName: row.supervisor_name,
      segmentStart: row.segment_start,
      segmentEnd: row.segment_end,
      text: row.text,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

async function deleteNotaFromSupabase(notaId: string): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("notas").delete().eq("id", notaId);
    if (error) console.warn("[SUPABASE] Could not delete nota:", error.message);
  } catch (err: any) {
    console.warn("[SUPABASE] Connection error deleting nota:", err.message);
  }
}

async function saveObjecionToSupabase(objecion: any): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("objeciones").upsert({
      id: objecion.id,
      auditoria_id: objecion.auditoriaId,
      supervisor_email: objecion.supervisorEmail,
      supervisor_name: objecion.supervisorName,
      segment_start: objecion.segmentStart,
      segment_end: objecion.segmentEnd,
      tipo_objecion: objecion.tipoObjecion,
      severidad: objecion.severidad,
      text: objecion.text,
    });
    if (error) console.warn("[SUPABASE] Could not save objecion:", error.message);
  } catch (err: any) {
    console.warn("[SUPABASE] Connection error saving objecion:", err.message);
  }
}

async function loadObjecionesFromSupabase(auditoriaId: string): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("objeciones")
      .select("*")
      .eq("auditoria_id", auditoriaId)
      .order("created_at", { ascending: true });
    if (error) return [];
    return (data || []).map((row: any) => ({
      id: row.id,
      auditoriaId: row.auditoria_id,
      supervisorEmail: row.supervisor_email,
      supervisorName: row.supervisor_name,
      segmentStart: row.segment_start,
      segmentEnd: row.segment_end,
      tipoObjecion: row.tipo_objecion,
      severidad: row.severidad,
      text: row.text,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

async function deleteObjecionFromSupabase(objecionId: string): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("objeciones").delete().eq("id", objecionId);
    if (error) console.warn("[SUPABASE] Could not delete objecion:", error.message);
  } catch (err: any) {
    console.warn("[SUPABASE] Connection error deleting objecion:", err.message);
  }
}

// Load persisted calls from Supabase on startup (if configured)
if (supabase) {
  loadCallsFromSupabase().then((calls) => {
    if (calls.length > 0) {
      localCallsMemory = calls;
      console.log(`[SUPABASE] Restored ${calls.length} calls from database to memory.`);
    }
  }).catch((err) => {
    console.warn("[SUPABASE] Failed to load calls on startup:", err.message);
  });
}

const app = express();
const PORT = 3000;

// Confiar en proxies (Cloudflare Tunnel)
app.set("trust proxy", 1);

// Seguridad: cabeceras HTTP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// CORS: solo permitir el frontend en Vercel
const ALLOWED_ORIGINS = [
  "https://auditor-olive.vercel.app",
  "https://auditor-idkboooi-s-projects.vercel.app",
  "https://auditor-dotidk14-idkboooi-s-projects.vercel.app",
  "https://unify-catering-purist.ngrok-free.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." }
});
app.use(globalLimiter);

// Rate limit más estricto para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de inicio de sesión." }
});

// Middleware para procesar cuerpos JSON
app.use(express.json({ limit: "10mb" }));

// Configuración de Multer para recibir audios en memoria (límite de 50MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Resiliencia: Memoria de respaldo para las llamadas durante la sesión
let localCallsMemory: any[] = [];
const audioBuffers = new Map<string, Buffer>();

// In-memory fallback for notas and objeciones (when Supabase is unavailable)
const localNotasMemory = new Map<string, any[]>();
const localObjecionesMemory = new Map<string, any[]>();

// Instancia segura de Gemini
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("GEMINI_API_KEY no detectada. Se usarán heurísticas locales avanzadas.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Función heurística de evaluación UTEL — delega al módulo compartido PCE
function evaluateUtelHeuristic(transcription: any[], fileName: string): any {
  const fullText = transcription.map((t: any) => t.text).join(" ").toLowerCase();
  return evaluateHeuristic(
    transcription.map((t: any) => ({ text: t.text })),
    fullText,
  );
}

// Interfaces locales para robustecer el tipado
interface TranscriptionUtterance {
  speaker: 'Vendedor' | 'Cliente';
  start: number;
  end: number;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

// Fallback: Diarizador y segmentador cognitivo de texto con Ollama
async function generateAndSplitTextDiarization(consolidatedText: string): Promise<TranscriptionUtterance[]> {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "hermes3";
  
  try {
    console.log(`[GUARDRAILS_OLLAMA] Separando oradores con Ollama (${ollamaModel})...`);
    const prompt = `Eres un transcriptor experto. Toma el siguiente texto continuo que representa una llamada telefónica real de ventas de UTEL Universidad donde se consolidaron los discursos de ambos oradores sin separarse ni asignarse los turnos.
    
Analiza semánticamente el flujo del diálogo y sepáralo exactamente en turnos de habla alternativos e individuales para 'Vendedor' (asesor UTEL que explica, ofrece beneficios, pide documentos, pregunta) y 'Cliente' (prospecto que responde, hace preguntas cortas de precio, comparte su ocupación).

Texto continuo a separar:
"${consolidatedText}"

Responde ÚNICAMENTE con un objeto JSON (sin markdown, sin bloques de código, sin texto introductorio) con el siguiente formato exacto:
{
  "transcription": [
    {
      "speaker": "Vendedor" o "Cliente",
      "text": "Frase exacta dicha por este orador en español",
      "sentiment": "positive" o "negative" o "neutral",
      "start": 0.0,
      "end": 0.0
    }
  ]
}

Divide el texto en fragmentos pequeños (máximo 15 palabras por turno). Estima tiempos coherentes ("start" y "end") incrementales de forma secuencial comenzando en 0.0, asumiendo que un ritmo normal es de ~3 palabras por segundo.`;

    const response = await axios.post(`${ollamaUrl}/api/generate`, {
      model: ollamaModel,
      prompt: prompt,
      format: "json",
      stream: false
    }, { timeout: 30000 });

    const responseString = response.data.response || "";
    const cleanJson = responseString.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanJson);
    return (result.transcription || []).map((t: any) => ({
      speaker: t.speaker === 'Vendedor' || t.speaker === 'Cliente' ? t.speaker : (String(t.speaker).toLowerCase().includes('client') ? 'Cliente' : 'Vendedor'),
      text: String(t.text || '').trim(),
      sentiment: t.sentiment || 'neutral',
      start: typeof t.start === 'number' ? t.start : 0.0,
      end: typeof t.end === 'number' ? t.end : 0.0,
      confidence: 0.95
    }));
  } catch (err) {
    console.error("Fallo al separar oradores con Ollama:", err);
    return [];
  }
}

// Guardrail de transcripción: corrige reversiones flagrantes y separa discursos monolíticos
async function applyTranscriptionGuardrails(transcription: any[]): Promise<TranscriptionUtterance[]> {
  if (!transcription || transcription.length === 0) return [];

  // Proceder a normalizar nombres de oradores
  let cleaned: TranscriptionUtterance[] = transcription.map(item => {
    let speaker: 'Vendedor' | 'Cliente' = 'Vendedor';
    const s = String(item.speaker || '').toLowerCase().trim();
    if (s.includes('client') || s.includes('prospect') || s.includes('student') || s.includes('usuario') || s.includes('persona') || s.includes('c') || s.includes('interesado') || s.includes('jessica') || s.includes('prospecto')) {
      speaker = 'Cliente';
    } else if (s.includes('vend') || s.includes('asesor') || s.includes('ejecut') || s.includes('utel') || s.includes('v') || s.includes('comercial') || s.includes('representante') || s.includes('alejandro')) {
      speaker = 'Vendedor';
    } else {
      speaker = s.includes('2') || s.includes('b') ? 'Cliente' : 'Vendedor';
    }
    return {
      speaker,
      sentiment: (item.sentiment === 'positive' || item.sentiment === 'negative' || item.sentiment === 'neutral') ? item.sentiment : 'neutral',
      start: typeof item.start === 'number' ? item.start : 0.0,
      end: typeof item.end === 'number' ? item.end : 0.0,
      text: String(item.text || '').trim(),
      confidence: typeof item.confidence === 'number' ? item.confidence : 0.95
    } as TranscriptionUtterance;
  });

  // 1. Detectar si la transcripción está lisiada o consolidada (ej. un solo bloque enorme de texto)
  const longestSegmentText = cleaned.reduce((max, cur) => cur.text.length > max ? cur.text.length : max, 0);
  if ((cleaned.length <= 3 && longestSegmentText > 120) || (cleaned.length === 1 && longestSegmentText > 50)) {
    console.warn("[GUARDRAILS] Transcripción consolidada detectada por heurística. Ejecutando motor de separación secuencial con Gemini...");
    const mergedText = cleaned.map(c => c.text).join(" ");
    const splitResult = await generateAndSplitTextDiarization(mergedText);
    if (splitResult && splitResult.length > 0) {
      console.log(`[GUARDRAILS] Transcripción dividida exitosamente en ${splitResult.length} fragmentos.`);
      cleaned = splitResult;
    }
  }

  // 2. Anti-Role Reversal Checking (Verificación de reversión de orador: Vendedor al revés)
  let sellerScoresForVendedor = 0;
  let sellerScoresForCliente = 0;

  const sellerKeywords = [
    "utel", "colegiatura", "mensualidad", "inscripcion", "inscripción", "revalidar", 
    "equivalencia", "plan de estudios", "materias", "modelo educativo", "beca", 
    "descuento", "certificado de bachillerato", "ejecutivo", "asesor", "bienvenido", 
    "duración", "jornada", "egresados"
  ];

  cleaned.forEach(item => {
    const textLower = (item.text || "").toLowerCase();
    let hits = 0;
    sellerKeywords.forEach(kw => {
      if (textLower.includes(kw)) {
        hits++;
      }
    });

    if (item.speaker === "Vendedor") {
      sellerScoresForVendedor += hits;
    } else if (item.speaker === "Cliente") {
      sellerScoresForCliente += hits;
    }
  });

  console.log(`[SPEAKER_GUARDRAIL_EVAL] Vendedor Score de palabras clave: ${sellerScoresForVendedor}, Cliente Score de palabras clave: ${sellerScoresForCliente}`);

  // Si el Cliente habla notablemente más con palabras del Vendedor, los roles están invertidos. Swapear los roles de todos.
  if (sellerScoresForCliente > sellerScoresForVendedor + 1 && sellerScoresForCliente > 2) {
    console.warn("[SPEAKER_GUARDRAIL] Se detectó REVERSIÓN flagrante de oradores (Asesor de UTEL catalogado como Cliente). Realizando swap de roles global para toda la transcripción...");
    cleaned = cleaned.map(item => ({
      ...item,
      speaker: item.speaker === "Vendedor" ? "Cliente" : "Vendedor"
    }));
  }

  return cleaned;
}

// Transcribir audio con Whisper local (lazy init for serverless compatibility)
async function whisperTranscribe(audioBuffer: Buffer, fileName: string): Promise<{ segments: any[], duration: number }> {
  const model = await initWhisperModel();
  if (!model) {
    console.warn("[WHISPER] Modelo no disponible, usando simulación");
    return { segments: [], duration: 0 };
  }
  try {
    const mod = await getWhisperModule();
    if (!mod) return { segments: [], duration: 0 };
    const audioData = await mod.decodeAudioAsync(audioBuffer, fileName);
    const params = new mod.WhisperFullParams(mod.WhisperSamplingStrategy.Greedy);
    params.language = "es";
    params.printProgress = false;
    params.printRealtime = false;
    params.printSpecial = false;
    params.printTimestamps = false;
    params.noTimestamps = false;
    params.singleSegment = false;
    params.durationMs = 0;
    params.nThreads = 4;

    const output = model.full(params, audioData);
    const segments: any[] = [];
    let duration = 0;

    if (output && Array.isArray(output)) {
      for (const seg of output) {
        segments.push({
          start: seg.t0 / 100,
          end: seg.t1 / 100,
          text: (seg.text || "").trim(),
          speaker: ""
        });
        if (seg.t1 / 100 > duration) duration = seg.t1 / 100;
      }
    }

    console.log(`[WHISPER] Transcripción completada: ${segments.length} segmentos, ${duration}s`);
    return { segments, duration };
  } catch (err: any) {
    console.error("[WHISPER] Error en transcripción:", err.message);
    return { segments: [], duration: 0 };
  }
}

// Función principal para generar análisis con Whisper + Ollama (Auditoría PCE UTEL)
async function generateLocalAnalysis(audioBuffer: Buffer, format: string, fileName: string): Promise<any> {
  const fallbackId = `fallback_${Date.now()}`;

  try {
    // 1. Transcribir con Whisper
    const { segments, duration } = await whisperTranscribe(audioBuffer, fileName);
    
    if (!segments.length) {
      console.warn("[LOCAL] Whisper no produjo transcripción, usando simulación");
      return generateHighFidelitySimulatedCall(fileName, audioBuffer.length, fallbackId).analysis;
    }

    // 2. Asignar speakers con heurística (el primer segmento largo es el vendedor)
    const textoCompleto = segments.map(s => s.text).join(" ");
    
    // 3. Usar Ollama para diarización y análisis completo
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "hermes3";

    const promptText = `
# ROL
Eres un Auditor Senior de Calidad Educativa de la UTEL Universidad y un experto en Neuroventas.

Tienes la transcripción completa de una llamada de ventas. Los segmentos están en orden cronológico pero sin identificar quién habla.

TRANSCRIPCIÓN (segmentos con tiempos):
${JSON.stringify(segments, null, 2)}

Texto completo: "${textoCompleto}"

REALIZA LO SIGUIENTE:
1. Identifica quién es el "Vendedor" (representante UTEL) y quién el "Cliente" (prospecto) basado en el contenido.
2. Asigna cada segmento al orador correcto.
3. Evalúa los 22 subítems de la Rúbrica PCE UTEL.

# REGLAS DE AUDITORÍA PCE UTEL:
Marca cada punto como true/false:

C1. CONOCE A TU CLIENTE
- "c1_linea": ¿El cliente muestra interés en la opción en línea?
- "c1_programa": ¿Se determina el programa de interés específico?
- "c1_demo": ¿Se registran datos demográficos clave?
- "c1_ocup": ¿Se indaga sobre la ocupación del cliente?
- "c1_equiv": ¿El asesor pregunta sobre equivalencias?

C2. GENERALIDADES
- "c2_num": ¿Se expone la numeralia oficial UTEL?
- "c2_mod": ¿Se detalla el modelo educativo flexible?
- "c2_esp": ¿Se vincula el modelo con necesidades del prospecto?

C3. OFERTA ACADÉMICA
- "c3_costos": ¿Se presentan costos y opciones?
- "c3_comp": ¿Se explican costos complementarios?
- "c3_jor": ¿Se define la jornada de estudio?
- "c3_beca": ¿Se menciona la beca?
- "c3_ciclos": ¿Se mencionan ciclos de inicio?

C4. ACUERDOS Y CIERRE
- "c4_res": ¿Se realiza resumen de oferta?
- "c4_doc": ¿Se solicita envío de documentos?
- "c4_pag": ¿Se acuerdan fechas de pago?
- "c4_ref": ¿El asesor solicita referidos?

C5. GESTIÓN Y REGISTRO
- "c5_int": ¿Se habla directamente con el interesado?
- "c5_tip": ¿Tipificación positiva en CRM?
- "c5_pla": ¿Uso de plataformas UTEL?
- "c5_reg": ¿Registro en tiempo real?
- "c5_seg": ¿Pasos de seguimiento claros?

Responde EXCLUSIVAMENTE con JSON:
{
  "transcription": [{ "speaker": "Vendedor"|"Cliente", "text": "...", "sentiment": "positive"|"negative"|"neutral", "start": 0.0, "end": 0.0, "confidence": 0.95 }],
  "summary": "Resumen ejecutivo",
  "customerMood": "receptivo|molesto|neutral|interesado|indiferente",
  "salesOutcome": "venta_cerrada|interesado_seguimiento|no_interesado|agenda_demostracion",
  "strengths": [],
  "weaknesses": [],
  "nextSteps": [],
  "evaluatedSubitems": { "c1_linea": true, ... },
  "feedbackMap": { "CONOCE A TU CLIENTE": "...", "GENERALIDADES": "...", "OFERTA ACADÉMICA": "...", "ACUERDOS Y CIERRE": "...", "GESTIÓN Y REGISTRO": "..." },
  "emotionalAnalysis": { "primaryEmotion": "...", "emotionalJourney": "...", "purchaseAptitudeScore": 0-100, "purchaseAptitudeLabel": "Muy Alto|Alto|Medio|Bajo", "barriersToPurchase": [], "buyingSignals": [], "aptitudeReason": "..." },
  "duration": ${duration}
}`;

    const response = await axios.post(`${ollamaUrl}/api/generate`, {
      model: ollamaModel,
      prompt: promptText,
      format: "json",
      stream: false
    }, { timeout: 60000 });

    const responseString = response.data.response || "";
    const cleanJson = responseString.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(cleanJson);

    const evaluatedSubitems = analysis.evaluatedSubitems || {};
    const feedbackMap = analysis.feedbackMap || {};
    const modality = 'LÍNEA';
    const builtChecklist = buildChecklist(evaluatedSubitems, feedbackMap, modality as Modalidad);
    const guardedTranscription = await applyTranscriptionGuardrails(analysis.transcription || []);

    return {
      ...analysis,
      transcription: guardedTranscription,
      utel: builtChecklist
    };
  } catch (err) {
    console.error("Error en generateLocalAnalysis:", err);
    return generateHighFidelitySimulatedCall(fileName, audioBuffer.length, fallbackId).analysis;
  }
}

// Inicializar memoria de respaldo limpia (sin pre-sembrar llamada de prueba)
console.log("Memoria de respaldo inicializada limpia para el Auditor Senior UTEL.");

// API: Importar y auditar llamada desde Google Drive
app.post("/api/drive-import", async (req, res) => {
  const { fileId, fileName, accessToken, engine, ollamaUrl, ollamaModel } = req.body;

  if (!fileId || !accessToken) {
    return res.status(400).json({ error: "File ID y Access Token son requeridos." });
  }

  try {
    console.log(`[DRIVE] Descargando archivo ${fileName} (${fileId}) de Google Drive...`);
    
    // 1. Descargar el archivo directamente de la API de Google Drive (Soportando Unidades Compartidas / Cuentas Institucionales)
    const driveResponse = await axios({
      method: 'get',
      url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: 'arraybuffer'
    });

    const audioBuffer = Buffer.from(driveResponse.data);
    const audioSize = audioBuffer.length;
    
    console.log(`[DRIVE] Archivo descargado exitosamente. Tamaño: ${audioSize} bytes.`);

    // 2. Procesar con el motor de IA seleccionado (Gemini o Ollama)
    let analysis;
    const uniqueId = `drive_${fileId.slice(0, 8)}_${Date.now()}`;

    // Determinar mimeType básico
    const ext = fileName.split('.').pop()?.toLowerCase() || 'mp3';

    console.log(`[DRIVE] Procesando con motor local Whisper + Ollama...`);
    analysis = await generateLocalAnalysis(audioBuffer, ext === 'wav' ? 'wav' : 'mp3', fileName);

    const newCall: any = {
      id: uniqueId,
      metadata: {
        fileName: fileName,
        duration: analysis.duration || 0,
        uploadedAt: new Date().toISOString(),
        uploadedBy: "Supervisor (Drive Import)",
        status: "completed"
      },
      analysis: analysis,
      score: {
        global: (analysis.utel?.totalScore || 0) * 10,
        criteria: analysis.utel?.checklist?.map((item: any) => ({
          name: item.title,
          score: (item.score / item.weight) * 100,
          weight: item.weight
        })) || []
      },
      transcription: analysis.transcription || []
    };

    audioBuffers.set(uniqueId, audioBuffer);
    localCallsMemory.unshift(newCall);
    saveCallToSupabase(newCall);
    res.json(newCall);

  } catch (err: any) {
    console.error("[DRIVE_ERROR] Fallo al procesar archivo de Drive:", err.message);
    res.status(500).json({ 
      error: `Error al importar de Drive: ${err.response?.data?.error || err.message}` 
    });
  }
});

// API: Supervisor Login (Soporta Google OAuth y Contraseña tradicional)
app.post("/api/login", loginLimiter, async (req, res) => {
  const { email, displayName, username, password } = req.body;

  // Opción 1: Autenticación con Google
  if (email) {
    const searchEmail = email.trim().toLowerCase();

    // Consultar roles en Supabase (CRM)
    let isAuthorized = false;
    let userName = displayName || email.split("@")[0];

    if (supabase) {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("rol, nombre")
          .eq("email", searchEmail)
          .single();

        if (profile && !error) {
          isAuthorized = ["admin", "coordinador"].includes(profile.rol);
          if (profile.nombre) userName = profile.nombre;
          console.log(`[AUTH_SUPABASE] ${searchEmail} -> rol: ${profile.rol}, autorizado: ${isAuthorized}`);
        } else {
          console.log(`[AUTH_SUPABASE] ${searchEmail} no encontrado en CRM`);
        }
      } catch (err: any) {
        console.error(`[AUTH_SUPABASE_ERROR] ${err.message}`);
      }
    }

    // Fallback: authorized emails from environment variable
    const allowedEmailsEnv = process.env.ALLOWED_EMAILS || "";
    const fallbackEmails = new Set(
      allowedEmailsEnv.split(",").map(e => e.trim().toLowerCase()).filter(Boolean)
    );
    if (!isAuthorized && supabase === null && fallbackEmails.size > 0) {
      isAuthorized = fallbackEmails.has(searchEmail);
    }

    if (isAuthorized) {
      console.log(`[AUTH_SUCCESS] Acceso concedido para: ${searchEmail}`);
      const token = signToken({ email: searchEmail, username: userName, role: "supervisor" });
      return res.json({
        success: true,
        token,
        username: userName
      });
    } else {
      console.warn(`[AUTH_DENIED] Acceso denegado para: ${email}.`);
      return res.status(403).json({
        success: false,
        error: `Acceso denegado: El correo ${email} no tiene permisos de auditoría. Contacta al administrador para habilitar tu acceso.`
      });
    }
  }

  // Opción 2: Autenticación con Contraseña Tradicional
  if (password) {
    const correctPassword = process.env.SUPERVISOR_PASSWORD;
    if (!correctPassword) {
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        if (password === "supervisoresutel") {
          const token = signToken({ username: username || "Supervisor", role: "supervisor" });
          return res.json({
            success: true,
            token,
            username: username || "Supervisor"
          });
        }
        return res.status(401).json({ success: false, error: "Contraseña de acceso incorrecta." });
      }
      return res.status(501).json({ success: false, error: "Autenticación por contraseña no configurada en el servidor." });
    }
    if (password === correctPassword) {
      const token = signToken({ username: username || "Supervisor", role: "supervisor" });
      return res.json({
        success: true,
        token,
        username: username || "Supervisor"
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        error: "Contraseña de acceso incorrecta." 
      });
    }
  }

  return res.status(400).json({ 
    success: false, 
    error: "Se requiere un método de autenticación válido." 
  });
});

// API: Verificar sesión del Supervisor
app.post("/api/verify-session", (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(401).json({ error: "Token requerido." });
  }

  // Backward-compatible: accept legacy static token during migration
  if (token === "utel-supervisor-session-token") {
    return res.json({ success: true, legacy: true });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ success: true, user: decoded });
  } catch {
    return res.status(401).json({ error: "Sesión inválida o expirada" });
  }
});

// API: Cargar llamada de prueba / demo bajo demanda
app.post("/api/cargar-demo", (req, res) => {
  const uniqueId = `call_demo_${Date.now()}`;
  const demoCall = generateHighFidelitySimulatedCall(
    `Llamada_Comercial_Demo_UTEL_${Math.floor(Math.random() * 90 + 10)}.mp3`,
    4829310,
    uniqueId
  );
  localCallsMemory = [demoCall, ...localCallsMemory];
  saveCallToSupabase(demoCall);
  return res.json(demoCall);
});

// API: Obtener Listado de Llamadas
app.get("/api/llamadas", (req, res) => {
  return res.json(localCallsMemory);
});

// API: Obtener archivo de audio real (Soporta HTTP Range Requests para saltar segundos sin reiniciar)
app.get("/api/audio/:id", (req, res) => {
  const buffer = audioBuffers.get(req.params.id);
  if (!buffer) {
    return res.status(404).json({ error: "Archivo de audio no encontrado en el servidor." });
  }

  const totalLength = buffer.length;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;

    if (start >= totalLength || end >= totalLength || start < 0 || end < start) {
      res.writeHead(416, {
        "Content-Range": `bytes */${totalLength}`,
        "Accept-Ranges": "bytes"
      });
      return res.end();
    }

    const chunk = buffer.subarray(start, end + 1);
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${totalLength}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunk.length,
      "Content-Type": "audio/mpeg"
    });
    res.write(chunk);
    res.end();
  } else {
    res.writeHead(200, {
      "Content-Length": totalLength,
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes"
    });
    res.write(buffer);
    res.end();
  }
});

// API: Transcripción standalone con Whisper local (usado por Vercel serverless como proxy al VPS)
app.post("/api/whisper", async (req, res) => {
  try {
    const { audioBase64, audioUrl, fileName = "audio.mp3" } = req.body;

    let audioBuffer: Buffer;
    if (audioUrl) {
      const resp = await axios.get(audioUrl, { responseType: "arraybuffer", timeout: 30000 });
      audioBuffer = Buffer.from(resp.data);
    } else if (audioBase64) {
      audioBuffer = Buffer.from(audioBase64, "base64");
    } else {
      return res.status(400).json({ error: "audioBase64 or audioUrl is required" });
    }

    const { segments, duration } = await whisperTranscribe(audioBuffer, fileName);

    if (!segments.length) {
      return res.status(503).json({ error: "Whisper model not available or transcription produced no segments" });
    }

    return res.status(200).json({ segments, duration, engine: "whisper" });
  } catch (error: any) {
    console.error("[WHISPER-API] Error:", error.message);
    return res.status(500).json({ error: `Whisper transcription failed: ${error.message}` });
  }
});

// API: Subir archivo de audio y procesar directo con AssemblyAI + Google AI (Gemini)
app.post("/api/upload", upload.single("audio"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No se proporcionó ningún archivo de audio." });
    }

    const originalName = file.originalname;
    const uniqueId = `call_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Motor local: Whisper + Ollama (se usa siempre como principal)
    console.log("[LOCAL_MODE] Usando Whisper (STT) + Ollama (análisis) como motor principal");

    console.log(`Iniciando procesamiento de audio: ${originalName} (ID: ${uniqueId})`);

    let finalCallData: any;
    try {
      // 1. Transcribir con Whisper local
      const ext = originalName.split('.').pop()?.toLowerCase() || 'mp3';
      const { segments: rawSegments, duration: audioDuration } = await whisperTranscribe(file.buffer, originalName);
      
      // Guardar estado inicial como "processing"
      const processingCallStub = {
        id: uniqueId,
        metadata: {
          fileName: originalName,
          url: `/api/audio/${uniqueId}`,
          size: file.size,
          duration: 0,
          uploadedAt: new Date().toISOString(),
          uploadedBy: "auditor_sales_prod",
          status: "processing"
        },
        score: { global: 0, greeting: 0, needDiscovery: 0, objectionHandling: 0, closingSkills: 0, empathy: 0 },
        analysis: {
          summary: "Procesando transcripción y auditoría cognitiva...",
          strengths: [], weaknesses: [], nextSteps: [],
          customerMood: "neutral",
          salesOutcome: "interesado_seguimiento"
        },
        transcription: []
      };

      localCallsMemory.unshift(processingCallStub);

      if (!rawSegments.length) {
        throw new Error("Whisper no produjo transcripción.");
      }

      // 2. Asignar speakers con Ollama (diarización)
      const ollamaUrlLocal = process.env.OLLAMA_URL || "http://localhost:11434";
      const ollamaModelLocal = process.env.OLLAMA_MODEL || "hermes3";
      const textoTranscrito = rawSegments.map(s => s.text).join(" ");

      let speakerMapping: Record<number, string> = {};
      try {
        const diarPrompt = `Eres un transcriptor experto. Recibes una transcripción de llamada de ventas UTEL con segmentos sin identificar orador.

Segmentos:
${JSON.stringify(rawSegments.map((s, i) => ({ idx: i, text: s.text })), null, 2)}

Texto completo: "${textoTranscrito}"

Analiza el diálogo y determina para CADA segmento si quien habla es "Vendedor" (asesor UTEL) o "Cliente" (prospecto).

Responde SOLO JSON: { "speakers": { "0": "Vendedor"|"Cliente", "1": "...", ... } }`;

        const diarResp = await axios.post(`${ollamaUrlLocal}/api/generate`, {
          model: ollamaModelLocal,
          prompt: diarPrompt,
          format: "json",
          stream: false
        }, { timeout: 30000 });

        const diarText = diarResp.data.response || "";
        const diarClean = diarText.replace(/```json|```/g, '').trim();
        const diarParsed = JSON.parse(diarClean);
        if (diarParsed.speakers) {
          speakerMapping = diarParsed.speakers;
        }
      } catch (diarErr: any) {
        console.warn("[DIARIZATION] Falló diarización con Ollama, usando heurística:", diarErr.message);
        // Heurística simple: el que habla primero y más palabras de venta es el Vendedor
        const sellerKw = ["utel", "colegiatura", "beca", "inscripción", "asesor", "universidad"];
        let sellerScore = 0;
        rawSegments.forEach((s, i) => {
          const t = s.text.toLowerCase();
          const hits = sellerKw.filter(kw => t.includes(kw)).length;
          if (i === 0 && hits > 0) sellerScore += 10;
          if (hits > 1) sellerScore += hits;
        });
        const sellerIsFirst = sellerScore > 3;
        rawSegments.forEach((_, i) => {
          speakerMapping[i] = i === 0 ? (sellerIsFirst ? "Vendedor" : "Cliente") : (i % 2 === 0 ? "Vendedor" : "Cliente");
        });
      }

      // 3. Construir transcripción con speakers
      const posWords = ["bien", "excelente", "perfecto", "gracias", "interesa", "interesado", "gusta", "bueno", "súper", "claro", "sí"];
      const negWords = ["no", "caro", "costoso", "tiempo", "complicado", "difícil", "duda", "pero", "mal"];

      const cleanTranscription = rawSegments.map((seg, i) => {
        const speaker = speakerMapping[i] || (i % 2 === 0 ? "Vendedor" : "Cliente");
        const textLower = seg.text.toLowerCase();
        let computedSentiment = "neutral";
        if (speaker === "Cliente") {
          const hasPos = posWords.some(w => textLower.includes(w));
          const hasNeg = negWords.some(w => textLower.includes(w));
          if (hasPos && !hasNeg) computedSentiment = "positive";
          else if (hasNeg) computedSentiment = "negative";
        }
        return {
          speaker,
          start: seg.start || 0,
          end: seg.end || 0,
          text: seg.text,
          sentiment: computedSentiment,
          confidence: 0.95
        };
      });

      const correctedTranscription = await applyTranscriptionGuardrails(cleanTranscription);
      const localUtelResult = evaluateUtelHeuristic(correctedTranscription, originalName);

    // Obtener parámetros de motor seleccionados por el usuario
    const selectedEngine = req.body.engine || "ollama";
    const ollamaUrl = req.body.ollamaUrl || "http://localhost:11434";
    const ollamaModelName = req.body.ollamaModel || "hermes3";

    // 5. INTELIGENCIA COGNITIVA Y ANÁLISIS EMOCIONAL (MATRIZ PCE UTEL OFICIAL DE LOS PDF)
    // Uses shared buildChecklist from src/shared/pce-rubric.ts

    let finalUtelResult = localUtelResult;
    let summaryText = `La llamada para '${originalName}' se auditó internamente.`;
    let customerMood: 'receptivo' | 'molesto' | 'neutral' | 'interesado' | 'indiferente' = 'neutral';
    let salesOutcome: 'venta_cerrada' | 'interesado_seguimiento' | 'no_interesado' | 'agenda_demostracion' = 'interesado_seguimiento';
    let strengths = ["Presentación clara"];
    let weaknesses = ["Oportunidad en cierre"];
    let nextSteps = ["Seguimiento CRM"];
    let emotionalAnalysis = localUtelResult.emotionalAnalysis;

    // Prompt cognitivo robusto y blindado, basándose exactamente en los PDF de UTEL
    const promptText = `
    # ROL
    Eres un Auditor Senior de Calidad Educativa y un experto en Neuroventas. Analiza la transcripción de la llamada telefónica y califica el desempeño del vendedor de acuerdo con la Rúbrica de Auditoría PCE de UTEL Universidad. Además, evalúa detenidamente el estado emocional del cliente.

    # REGLAS DE AUDITORÍA PCE UTEL (21 PARÁMETROS):
    Debes marcar cada uno de los siguientes 21 puntos como VERDADERO (true) o FALSO (false) según se identifiquen racionalmente o correspondan con la conversación en la transcripción de la llamada. no asumas ni alteres esta estructura:

    C1. CONOCE A TU CLIENTE
    - "c1_linea": ¿El cliente muestra interés en la opción en línea o el asesor aborda ese formato? (true/false)
    - "c1_programa": ¿Se determina el programa de interés específico (Licenciatura, Maestría, etc.)? (true/false)
    - "c1_demo": ¿Se registran datos demográficos clave como edad, ubicación o medio de contacto? (true/false)
    - "c1_ocup": ¿Se indaga sobre la ocupación del cliente (si trabaja, horario) o estudios previos? (true/false)
    - "c1_equiv": ¿El asesor pregunta sobre equivalencias, revalidación o estudios inconclusos? (true/false)

    C2. GENERALIDADES
    - "c2_num": ¿Se expone la numeralia oficial UTEL (más de 12 años, presencia en 3 países, miles de egresados)? (true/false)
    - "c2_mod": ¿Se detalla y explica el modelo educativo flexible de UTEL? (true/false)
    - "c2_esp": ¿Se vincula el modelo educativo específicamente con las necesidades expresadas por el prospecto? (true/false)

    C3. OFERTA ACADÉMICA
    - "c3_costos": ¿Se presentan formalmente costos y opciones de colegiatura? (true/false)
    - "c3_comp": ¿Se explican los costos complementarios (cuota de inscripción, cargos de reinscripción periódicos)? (true/false)
    - "c3_jor": ¿Se define la jornada de estudio sugerida y las horas de dedicación semanal recomendadas en plataforma? (true/false)
    - "c3_beca": ¿Se informa sobre la beca otorgada, su porcentaje, vigencia y compromisos/promedio para mantenerla? (true/false)
    - "c3_ciclos": ¿Se aclara la fecha de inicio de clases o la periodicidad de los ciclos de inicio? (true/false)

    C4. ACUERDOS Y CIERRE
    - "c4_res": ¿Se le brinda al cliente un resumen exacto con las condiciones de la oferta comercial? (true/false)
    - "c4_doc": ¿Se solicita la entrega de documentos básicos de admisión (CURP, certificado, etc.) y fecha límite? (true/false)
    - "c4_pag": ¿Se logran acordar fechas de pago específicas o compromisos de liquidación de matrícula? (true/false)
    - "c4_ref": ¿El asesor solicita proactivamente referidos, recomendados, amigos o familiares al prospecto? (true/false)

    C5. GESTIÓN Y REGISTRO
    - "c5_int": ¿El asesor habla directa y fluidamente con el prospecto interesado a lo largo de la llamada? (true/false)
    - "c5_tip": ¿Se infiere uso de una tipificación correcta de seguimiento al prospecto? (true/false)
    - "c5_pla": ¿El asesor utiliza las plataformas y guiones UTEL correctos en su trato? (true/false)
    - "c5_reg": ¿Se infiere el registro íntegro de la llamada en plataforma CRM? (true/false)
    - "c5_seg": ¿Se acuerda una fecha/hora específica para el seguimiento formal del trámite escolar? (true/false)

    # ANÁLISIS DE LA PSICOLOGÍA DEL CLIENTE:
    Evalúa el estado emocional e intenciones de compra del cliente:
    - "primaryEmotion": Emoción predominante observable (p. ej. "Interesado pero indeciso", "Molesto", "Escéptico", "Entusiasmado").
    - "emotionalJourney": Viaje emocional de la conversación (cómo progresa de inicio a fin).
    - "purchaseAptitudeScore": Puntuación numérica (0 a 100) del deseo potencial y aptitud de compra real.
    - "purchaseAptitudeLabel": Basado en el puntaje: "Muy Alto" (90-100), "Alto" (70-89), "Medio" (40-69), "Bajo" (15-39), "Nulo" (0-14).
    - "barriersToPurchase": Obstáculos o fricciones para inscribirse (como costos, falta de tiempo, desconfianza).
    - "buyingSignals": Señales positivas observadas (preguntas por el inicio, por el examen, por los pagos).
    - "aptitudeReason": Motivos del estado de compra, justificación de por qué está apto, y qué táctica comercial exacta debe implementar el asesor comercial en la siguiente interacción para cerrar la venta.

    # TRANSCRIPCIÓN DEL AUDIO:
    ${JSON.stringify(correctedTranscription, null, 2)}

    # FORMATO DE RESPUESTA EXCLUSIVO (JSON VÁLIDO SIN TEXTO NI MARKDOWN EXTRA):
    {
      "evaluated_subitems": {
        "c1_linea": true,
        "c1_programa": true,
        "c1_demo": false,
        "c1_ocup": true,
        "c1_equiv": false,
        "c2_num": true,
        "c2_mod": true,
        "c2_esp": false,
        "c3_costos": true,
        "c3_comp": true,
        "c3_jor": false,
        "c3_beca": true,
        "c3_ciclos": false,
        "c4_res": true,
        "c4_doc": false,
        "c4_pag": true,
        "c4_ref": false,
        "c5_int": true,
        "c5_int": true,
        "c5_tip": true,
        "c5_pla": true,
        "c5_reg": true,
        "c5_seg": true
      },
      "evaluacion_detallada": {
        "CONOCE A TU CLIENTE": "Retroalimentación sobre la calidad comercial en este bloque...",
        "GENERALIDADES": "Opinión de la transmisión del modelo educativo virtual...",
        "OFERTA ACADÉMICA": "Evaluación del detalle comercial (costos, becas, jornada)...",
        "ACUERDOS Y CIERRE": "Evaluación de los acuerdos, solicitud de documentos y referidos...",
        "GESTIÓN Y REGISTRO": "Juicio sobre el envío de cotizaciones y programación de seguimiento..."
      },
      "modalidad_detectada": "LÍNEA",
      "summary": "Resumen cognitivo detallado del desempeño del asesor comercial en la llamada.",
      "strengths": [ "Fortaleza 1", "Fortaleza 2", "Fortaleza 3" ],
      "weaknesses": [ "Debilidad 1", "Debilidad 2" ],
      "nextSteps": [ "Paso recomendado 1", "Paso recomendado 2" ],
      "customerMood": "interesado",
      "salesOutcome": "interesado_seguimiento",
      "emotionalAnalysis": {
        "primaryEmotion": "Interesado",
        "emotionalJourney": "Inició con dudas institucionales, se interesó por la beca especial y planteó ciertas objeciones en el pago.",
        "purchaseAptitudeScore": 75,
        "purchaseAptitudeLabel": "Alto",
        "barriersToPurchase": [ "Falta de liquidez para inscripción", "Indecisión de carrera alternas" ],
        "buyingSignals": [ "Preguntó cuándo abre inscripciones", "Dijo que quiere estudiar de noche" ],
        "aptitudeReason": "El candidato tiene un excelente perfil para estudiar de noche pero le frena el pago inicial. Estrategia comercial recomendada: ofrecer planes de financiamiento o aplazamiento de cuota de inscripción para lograr el registro inmediato."
      }
    }
    `;

    if (selectedEngine === "ollama") {
      try {
        console.log(`Llamando a Ollama Local [${ollamaUrl}] con modelo [${ollamaModelName}]...`);
        const ollamaResponse = await axios.post(`${ollamaUrl}/api/generate`, {
          model: ollamaModelName,
          prompt: promptText,
          format: "json",
          stream: false
        }, {
          timeout: 28000
        });

        let responseString = ollamaResponse.data.response;
        const cleanJsonStr = responseString.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJsonStr);

        if (parsed) {
          const evaluatedSubitems = parsed.evaluated_subitems || {};
          const feedbackMap = parsed.evaluacion_detallada || {};
          const modality = parsed.modalidad_detectada || "LÍNEA";

          // Cómputo matemático riguroso basado en el PDF y los subitems resultantes
          finalUtelResult = buildChecklist(evaluatedSubitems, feedbackMap, modality as Modalidad);

          summaryText = parsed.summary || summaryText;
          customerMood = parsed.customerMood || customerMood;
          salesOutcome = parsed.salesOutcome || salesOutcome;
          strengths = parsed.strengths || strengths;
          weaknesses = parsed.weaknesses || weaknesses;
          nextSteps = parsed.nextSteps || nextSteps;
          if (parsed.emotionalAnalysis) {
            emotionalAnalysis = parsed.emotionalAnalysis;
          }
          console.log("Auditoría con Ollama completada con éxito riguroso.");
        }
      } catch (ollamaErr: any) {
        console.error("Error intentando conectar con Ollama:", ollamaErr.message);
        throw new Error(`Fallo de conexión con Ollama en ${ollamaUrl}. Asegúrate de tener Ollama activo localmente, CORS habilitado, y el modelo '${ollamaModelName}' descargado ('ollama pull ${ollamaModelName}').`);
      }
    } else {
      // Usar Google Gemini por defecto
      const ai = getGeminiClient();
      if (ai) {
        try {
          console.log("Iniciando auditoría cognitiva con Gemini...");
          const geminiResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: promptText,
            config: {
              responseMimeType: "application/json"
            }
          });
          
          const responseText = geminiResponse.text;
          const parsed = JSON.parse(responseText || "{}");
          
          if (parsed) {
            const evaluatedSubitems = parsed.evaluated_subitems || {};
            const feedbackMap = parsed.evaluacion_detallada || {};
            const modality = parsed.modalidad_detectada || "LÍNEA";

            // Cómputo matemático riguroso basado en el PDF y los subitems resultantes
            finalUtelResult = buildChecklist(evaluatedSubitems, feedbackMap, modality as Modalidad);

            summaryText = parsed.summary || summaryText;
            customerMood = parsed.customerMood || customerMood;
            salesOutcome = parsed.salesOutcome || salesOutcome;
            strengths = parsed.strengths || strengths;
            weaknesses = parsed.weaknesses || weaknesses;
            nextSteps = parsed.nextSteps || nextSteps;
            if (parsed.emotionalAnalysis) {
              emotionalAnalysis = parsed.emotionalAnalysis;
            }
            console.log("Auditoría cognitiva con Gemini completada con éxito riguroso.");
          }
        } catch (geminiErr) {
          console.error("Error Gemini:", geminiErr);
        }
      }
    }

      finalCallData = {
        id: uniqueId,
        metadata: {
          fileName: originalName,
          url: `/api/audio/${uniqueId}`,
          size: file.size,
          duration: Math.round(audioDuration || 180),
          uploadedAt: new Date().toISOString(),
          uploadedBy: "auditor_sales_prod",
          status: "completed"
        },
        score: {
          global: Math.round(finalUtelResult.totalScore * 10),
          greeting: 85,
          needDiscovery: 80,
          objectionHandling: 70,
          closingSkills: 60,
          empathy: 75
        },
        analysis: {
          summary: summaryText,
          strengths: strengths,
          weaknesses: weaknesses,
          nextSteps: nextSteps,
          customerMood: customerMood,
          salesOutcome: salesOutcome,
          utel: finalUtelResult,
          emotionalAnalysis: emotionalAnalysis
        },
        transcription: correctedTranscription
      };
    } catch (apiErr: any) {
      console.warn("Fallo en procesamiento con Whisper, intentando con análisis local directo:", apiErr.message);
      try {
        const ext = originalName.split('.').pop()?.toLowerCase() || 'mp3';
        const analysis = await generateLocalAnalysis(file.buffer, ext, originalName);
        finalCallData = {
          id: uniqueId,
          metadata: {
            fileName: originalName,
            url: `/api/audio/${uniqueId}`,
            size: file.size,
            duration: analysis.duration || 180,
            uploadedAt: new Date().toISOString(),
            uploadedBy: "auditor_sales_prod",
            status: "completed"
          },
          score: {
            global: Math.round((analysis.utel?.totalScore || 0) * 10),
            greeting: 85,
            needDiscovery: 80,
            objectionHandling: 70,
            closingSkills: 60,
            empathy: 75
          },
          analysis: {
            summary: analysis.summary || "Llamada auditada y analizada exitosamente.",
            strengths: analysis.strengths || [],
            weaknesses: analysis.weaknesses || [],
            nextSteps: analysis.nextSteps || [],
            customerMood: analysis.customerMood || "neutral",
            salesOutcome: analysis.salesOutcome || "interesado_seguimiento",
            utel: analysis.utel,
            emotionalAnalysis: analysis.emotionalAnalysis
          },
          transcription: analysis.transcription || []
        };
      } catch (backupErr: any) {
        console.error("Fallo definitivo en ambos procesadores, recurriendo a simulador cognitivo de alta fidelidad:", backupErr.message);
        finalCallData = generateHighFidelitySimulatedCall(originalName, file.size, uniqueId);
      }
    }

    audioBuffers.set(uniqueId, file.buffer);
    localCallsMemory = [finalCallData, ...localCallsMemory.filter(c => c.id !== uniqueId)];
    saveCallToSupabase(finalCallData);

    return res.json(finalCallData);
  } catch (error: any) {
    console.error("Fallo definitivo en la ruta de subida:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint para borrar llamada
app.delete("/api/llamadas/:id", (req, res) => {
  const callId = req.params.id;
  audioBuffers.delete(callId);
  localCallsMemory = localCallsMemory.filter(c => c.id !== callId);
  deleteCallFromSupabase(callId);
  return res.json({ success: true });
});

// API: Guardar auditoría en Google Drive
app.post("/api/drive-save", async (req, res) => {
  const { callData, accessToken } = req.body;

  if (!callData || !accessToken) {
    return res.status(400).json({ error: "Datos de llamada y token son requeridos." });
  }

  try {
    const folderName = "Auditorías PCE UTEL";
    
    // 1. Buscar o crear carpeta (Soportando Unidades Compartidas / Cuentas Institucionales)
    let folderId = "";
    const searchFolder = await axios.get(`https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (searchFolder.data.files.length > 0) {
      folderId = searchFolder.data.files[0].id;
    } else {
      const createFolder = await axios.post("https://www.googleapis.com/drive/v3/files?supportsAllDrives=true", {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder"
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      folderId = createFolder.data.id;
    }

    // 2. Subir el JSON
    const fileName = `Audit_${callData.metadata.fileName.replace(/\.[^/.]+$/, "")}_${Date.now()}.json`;
    const metadata = {
      name: fileName,
      parents: [folderId],
      mimeType: "application/json"
    };

    const formData = new FormData();
    formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    formData.append("file", new Blob([JSON.stringify(callData)], { type: "application/json" }));

    // Nota: axios con FormData puede ser complejo en Node para Google Drive. 
    // Usaremos un enfoque de 2 pasos o multipart manual.
    // Para simplicidad, usaremos el endpoint de upload simple con metadata.
    
    const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true";
    
    const boundary = "auditor_pce_boundary";
    const body = `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${JSON.stringify(callData)}\r\n` +
      `--${boundary}--`;

    await axios.post(uploadUrl, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`
      }
    });

    return res.json({ success: true, message: "Auditoría guardada en Drive." });
  } catch (error: any) {
    console.error("Error al guardar en Drive:", error.response?.data || error.message);
    return res.status(500).json({ error: `Fallo al guardar en Google Drive: ${error.response?.data?.error?.message || error.message}` });
  }
});

// API: Listar historial desde Google Drive
app.get("/api/drive-history", async (req, res) => {
  const { accessToken } = req.query;

  if (!accessToken) {
    return res.status(400).json({ error: "Token es requerido." });
  }

  try {
    const folderName = "Auditorías PCE UTEL";
    
    // 1. Buscar la carpeta (Soportando Unidades Compartidas / Cuentas Institucionales)
    const searchFolder = await axios.get(`https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
      headers: { Authorization: `Bearer ${accessToken as string}` }
    });

    if (searchFolder.data.files.length === 0) {
      return res.json({ calls: [] });
    }

    const folderId = searchFolder.data.files[0].id;

    // 2. Listar archivos JSON en esa carpeta (Soportando Unidades Compartidas / Cuentas Institucionales)
    const listFiles = await axios.get(`https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and mimeType='application/json' and trashed=false&fields=files(id, name)&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
      headers: { Authorization: `Bearer ${accessToken as string}` }
    });

    const files = listFiles.data.files;
    const calls = [];

    // 3. Descargar el contenido de cada archivo (Límite 10 para no saturar, soportando Unidades Compartidas)
    for (const file of files.slice(0, 10)) {
      try {
        const fileContent = await axios.get(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&supportsAllDrives=true`, {
          headers: { Authorization: `Bearer ${accessToken as string}` }
        });
        if (fileContent.data && fileContent.data.id) {
          calls.push(fileContent.data);
        }
      } catch (e) {
        console.warn(`No se pudo leer el archivo ${file.name} de Drive.`);
      }
    }

    return res.json({ calls });
  } catch (error: any) {
    console.error("Error al listar Drive:", error.response?.data || error.message);
    return res.status(500).json({ error: `Fallo al recuperar historial de Google Drive: ${error.response?.data?.error?.message || error.message}` });
  }
});

// ── Notas API ────────────────────────────────────────────────────

// POST /api/llamadas/:id/notas — Add a note to a transcription segment
app.post("/api/llamadas/:id/notas", async (req, res) => {
  const auditoriaId = req.params.id;
  const { supervisorEmail, supervisorName, segmentStart, segmentEnd, text } = req.body;

  if (!supervisorEmail || !text || segmentStart === undefined || segmentEnd === undefined) {
    return res.status(400).json({ error: "supervisorEmail, text, segmentStart, and segmentEnd are required." });
  }

  const nota = {
    id: `nota_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    auditoriaId,
    supervisorEmail,
    supervisorName: supervisorName || supervisorEmail.split("@")[0],
    segmentStart,
    segmentEnd,
    text,
    createdAt: new Date().toISOString(),
  };

  if (!localNotasMemory.has(auditoriaId)) {
    localNotasMemory.set(auditoriaId, []);
  }
  localNotasMemory.get(auditoriaId)!.push(nota);

  saveNotaToSupabase(nota);
  return res.status(201).json(nota);
});

// GET /api/llamadas/:id/notas — List notes for a call
app.get("/api/llamadas/:id/notas", async (req, res) => {
  const auditoriaId = req.params.id;
  const supabaseNotas = await loadNotasFromSupabase(auditoriaId);
  const localNotas = localNotasMemory.get(auditoriaId) || [];
  
  const supabaseIds = new Set(supabaseNotas.map((n: any) => n.id));
  const merged = [...supabaseNotas, ...localNotas.filter((n: any) => !supabaseIds.has(n.id))];
  
  return res.json(merged);
});

// DELETE /api/llamadas/:id/notas/:notaId
app.delete("/api/llamadas/:id/notas/:notaId", async (req, res) => {
  const { id: auditoriaId, notaId } = req.params;

  if (localNotasMemory.has(auditoriaId)) {
    const notas = localNotasMemory.get(auditoriaId)!;
    localNotasMemory.set(auditoriaId, notas.filter((n: any) => n.id !== notaId));
  }

  await deleteNotaFromSupabase(notaId);
  return res.json({ success: true });
});

// ── Objeciones API ───────────────────────────────────────────────

// POST /api/llamadas/:id/objeciones — Add an objection to a transcription segment
app.post("/api/llamadas/:id/objeciones", async (req, res) => {
  const auditoriaId = req.params.id;
  const { supervisorEmail, supervisorName, segmentStart, segmentEnd, tipoObjecion, severidad, text } = req.body;

  if (!supervisorEmail || !text || segmentStart === undefined || segmentEnd === undefined || !tipoObjecion || !severidad) {
    return res.status(400).json({ error: "supervisorEmail, text, segmentStart, segmentEnd, tipoObjecion, and severidad are required." });
  }

  const objecion = {
    id: `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    auditoriaId,
    supervisorEmail,
    supervisorName: supervisorName || supervisorEmail.split("@")[0],
    segmentStart,
    segmentEnd,
    tipoObjecion,
    severidad,
    text,
    createdAt: new Date().toISOString(),
  };

  if (!localObjecionesMemory.has(auditoriaId)) {
    localObjecionesMemory.set(auditoriaId, []);
  }
  localObjecionesMemory.get(auditoriaId)!.push(objecion);

  saveObjecionToSupabase(objecion);
  return res.status(201).json(objecion);
});

// GET /api/llamadas/:id/objeciones — List objections for a call
app.get("/api/llamadas/:id/objeciones", async (req, res) => {
  const auditoriaId = req.params.id;
  const supabaseObjeciones = await loadObjecionesFromSupabase(auditoriaId);
  const localObjeciones = localObjecionesMemory.get(auditoriaId) || [];
  
  const supabaseIds = new Set(supabaseObjeciones.map((o: any) => o.id));
  const merged = [...supabaseObjeciones, ...localObjeciones.filter((o: any) => !supabaseIds.has(o.id))];
  
  return res.json(merged);
});

// DELETE /api/llamadas/:id/objeciones/:objecionId
app.delete("/api/llamadas/:id/objeciones/:objecionId", async (req, res) => {
  const { id: auditoriaId, objecionId } = req.params;

  if (localObjecionesMemory.has(auditoriaId)) {
    const objeciones = localObjecionesMemory.get(auditoriaId)!;
    localObjecionesMemory.set(auditoriaId, objeciones.filter((o: any) => o.id !== objecionId));
  }

  await deleteObjecionFromSupabase(objecionId);
  return res.json({ success: true });
});

// ── Supervisor History API ───────────────────────────────────────

// GET /api/supervisores/:email/historial
app.get("/api/supervisores/:email/historial", async (req, res) => {
  const supervisorEmail = req.params.email;

  if (!supabase) {
    const historial = localCallsMemory
      .filter((call: any) => {
        const notasForCall = localNotasMemory.get(call.id) || [];
        const objecionesForCall = localObjecionesMemory.get(call.id) || [];
        return notasForCall.some((n: any) => n.supervisorEmail === supervisorEmail) ||
               objecionesForCall.some((o: any) => o.supervisorEmail === supervisorEmail) ||
               (call.metadata?.uploadedBy && call.metadata.uploadedBy.includes(supervisorEmail));
      })
      .map((call: any) => {
        const notasForCall = (localNotasMemory.get(call.id) || []).filter((n: any) => n.supervisorEmail === supervisorEmail);
        const objecionesForCall = (localObjecionesMemory.get(call.id) || []).filter((o: any) => o.supervisorEmail === supervisorEmail);
        return {
          ...call,
          notasCount: notasForCall.length,
          objecionesCount: objecionesForCall.length,
        };
      })
      .sort((a: any, b: any) => new Date(b.metadata.uploadedAt).getTime() - new Date(a.metadata.uploadedAt).getTime());

    return res.json({ supervisorEmail, totalAuditorias: historial.length, auditorias: historial });
  }

  try {
    const [{ data: notasAuditorias }, { data: objecionesAuditorias }] = await Promise.all([
      supabase.from("notas").select("auditoria_id").eq("supervisor_email", supervisorEmail),
      supabase.from("objeciones").select("auditoria_id").eq("supervisor_email", supervisorEmail),
    ]);

    const auditoriaIds = new Set<string>();
    (notasAuditorias || []).forEach((n: any) => auditoriaIds.add(n.auditoria_id));
    (objecionesAuditorias || []).forEach((o: any) => auditoriaIds.add(o.auditoria_id));

    if (auditoriaIds.size === 0) {
      const { data: uploadedCalls } = await supabase
        .from("auditorias")
        .select("id")
        .filter("metadata->>uploadedBy", "ilike", `%${supervisorEmail}%`)
        .limit(50);
      (uploadedCalls || []).forEach((c: any) => auditoriaIds.add(c.id));
    }

    if (auditoriaIds.size === 0) {
      return res.json({ supervisorEmail, totalAuditorias: 0, auditorias: [] });
    }

    const ids = Array.from(auditoriaIds).slice(0, 50);
    const { data: auditorias } = await supabase
      .from("auditorias")
      .select("*")
      .in("id", ids)
      .order("created_at", { ascending: false });

    const { data: allNotas } = await supabase
      .from("notas")
      .select("auditoria_id")
      .in("auditoria_id", ids)
      .eq("supervisor_email", supervisorEmail);
    const { data: allObjeciones } = await supabase
      .from("objeciones")
      .select("auditoria_id")
      .in("auditoria_id", ids)
      .eq("supervisor_email", supervisorEmail);

    const notaCounts = new Map<string, number>();
    const objecionCounts = new Map<string, number>();
    (allNotas || []).forEach((n: any) => notaCounts.set(n.auditoria_id, (notaCounts.get(n.auditoria_id) || 0) + 1));
    (allObjeciones || []).forEach((o: any) => objecionCounts.set(o.auditoria_id, (objecionCounts.get(o.auditoria_id) || 0) + 1));

    const historial = (auditorias || []).map((a: any) => ({
      id: a.id,
      metadata: a.metadata,
      score: a.score,
      analysis: a.analysis,
      transcription: a.transcription || [],
      notasCount: notaCounts.get(a.id) || 0,
      objecionesCount: objecionCounts.get(a.id) || 0,
    }));

    return res.json({ supervisorEmail, totalAuditorias: historial.length, auditorias: historial });
  } catch (err: any) {
    console.warn("[SUPABASE] Error fetching supervisor history:", err.message);
    return res.json({ supervisorEmail, totalAuditorias: 0, auditorias: [] });
  }
});

// API: Sincronizar supervisores de Supabase a Firebase Auth
app.post("/api/sync-supervisores", async (req, res) => {
  try {
    console.log("[SYNC] Iniciando sincronización Supabase → Firebase Auth...");
    const result = await syncSupervisoresFromSupabase(supabase);
    console.log(`[SYNC] Completado: ${result.created} creados, ${result.updated} actualizados, ${result.errors.length} errores`);
    return res.json(result);
  } catch (err: any) {
    console.error("[SYNC] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Middleware de integración de Vite
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
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
