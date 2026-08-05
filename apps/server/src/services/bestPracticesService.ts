import { insforge } from "./insforge.js";
import { localCallsMemory } from "../config.js";
import { callOpenRouter } from "./openrouter.js";

// ── Tipos compartidos ─────────────────────────────────────────────

export interface TopCall {
  id: string;
  metadata: Record<string, unknown>;
  score: unknown;
  scoreGlobal: number;
  salesOutcome: string;
  transcription: any[];
  createdAt: string | null;
}

export interface WinMoment {
  text: string;
  context: string;
  sentiment: "positive" | "neutral" | "negative";
  section: string | null;
  objection: string | null;
  start: number;
  end: number;
}

export interface LearnedSpeech {
  id: string;
  sectionId: string | null;
  objectionId: string | null;
  title: string;
  content: string;
  sourceCallCount: number;
  avgScore: number;
  winCount: number;
  status: string;
  createdAt: string;
}

// ── Configuración ────────────────────────────────────────────────

export const TOP_SCORE_THRESHOLD = 85;
const WIN_SALES_OUTCOMES = ["venta_cerrada"];
const MAX_MOMENTS_PER_CALL = 6;
const MAX_CALLS_IN_PROMPT = 12;

const LEARNED_SECTIONS = ["bienvenida", "sondeo", "personalizar", "costos", "acordar"] as const;
const LEARNED_OBJECTIONS = [
  "costos", "duda", "tiempo", "modalidad", "competencia", "confianza", "calidad", "familia",
] as const;

const SECTION_KEYWORDS: { id: string; kws: string[] }[] = [
  {
    id: "bienvenida",
    kws: [
      "buen día", "buenos días", "buenas tardes", "buenas noches", "me comunico",
      "mucho gusto", "gusto saludarte", "te habla", "asesor educativo", "solicitaste información",
      "contacto", "contigo", "escucharte", "primer contacto",
    ],
  },
  {
    id: "sondeo",
    kws: [
      "motivó", "motivación", "te dedicas", "trabajas", "trabajando", "estudias", "estudiando",
      "cuéntame", "dime", "edad", "a qué te gustaría", "crecer laboral", "objetivo personal",
      "título profesional", "qué te gustaría que cambiara", "situación actual", "hijos", "familia",
    ],
  },
  {
    id: "personalizar",
    kws: [
      "utel", "modelo educativo", "universidad en línea", "aula virtual", "flexibilidad",
      "rvoe", "validez", "modalidad", "plan de estudios", "titulación", "acompañamiento",
      "egresados", "trayectoria", "12 años", "docentes", "plataforma",
    ],
  },
  {
    id: "costos",
    kws: [
      "costo", "precio", "colegiatura", "mensualidad", "inscripción", "beca", "descuento",
      "inversión", "pago", "presupuesto", "facilidades de pago", "cuota", "anualidad",
    ],
  },
  {
    id: "acordar",
    kws: [
      "inscribir", "inscripción", "empezar", "comenzar", "documentos", "solicitud de admisión",
      "agendar", "seguimiento", "demo", "cerrar", "compromiso", "empezamos", "inicio de clases",
      "enviar información", "por correo", "requisitos", "último paso",
    ],
  },
];

const OBJECTION_KEYWORDS: { id: string; kws: string[] }[] = [
  {
    id: "costos",
    kws: [
      "es muy caro", "caro", "no alcanza", "no me alcanza", "presupuesto", "mucho dinero",
      "no tengo dinero", "no puedo pagar", "se me hace mucho", "gasto", "lo veo caro",
    ],
  },
  {
    id: "duda",
    kws: [
      "pensarlo", "pensarlo bien", "dejame pensarlo", "déjame pensarlo", "decidir", "lo pienso",
      "necesito pensarlo", "tengo dudas", "dudas", "meditarlo", "tomar una decisión",
    ],
  },
  {
    id: "tiempo",
    kws: [
      "no tengo tiempo", "muy ocupado", "no me da tiempo", "sin tiempo", "no alcanzo",
      "trabajo todo el día", "no tengo horario", "no puedo estudiar",
    ],
  },
  {
    id: "modalidad",
    kws: [
      "presencial", "no me gusta en línea", "modalidad no me convence", "no me convence en línea",
      "prefiero presencial", "campus", "no soy de clases virtuales", "no me adapto en línea",
    ],
  },
  {
    id: "competencia",
    kws: [
      "otra universidad", "otra opción", "ya estoy inscrito", "ya estoy inscrita",
      "en otra institución", "otra escuela", "estoy comparando", "me ofrecieron otra",
    ],
  },
  {
    id: "confianza",
    kws: [
      "no conozco", "de fiar", "es confiable", "confianza", "estafa", "fraude", "seguro que es real",
      "nunca había escuchado", "es legal",
    ],
  },
  {
    id: "calidad",
    kws: [
      "en línea es buena", "realmente buena", "aprendes de verdad", "no es como presencial",
      "la educación en línea", "calidad educativa", "solo suben videos", "es seria",
    ],
  },
  {
    id: "familia",
    kws: [
      "familia", "esposo", "esposa", "pareja", "mis papás", "mis padres", "con mi mamá",
      "con mi papá", "consultar", "platicarlo con", "apoyo de mi familia",
    ],
  },
];

// ── Normalización de llamadas ─────────────────────────────────────

interface NormalizedCall {
  id: string;
  metadata: Record<string, unknown>;
  score: unknown;
  analysis: Record<string, unknown>;
  transcription: any[];
  createdAt: string | null;
}

function getScoreGlobal(call: Pick<NormalizedCall, "score">): number {
  const s = call.score;
  if (typeof s === "number") return s;
  if (s && typeof s === "object") {
    const g = (s as Record<string, unknown>).global;
    const n = typeof g === "number" ? g : Number(g);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function hasSellerLines(transcription: any[]): boolean {
  return (
    Array.isArray(transcription) &&
    transcription.some((u) => String(u.speaker || "").toLowerCase().includes("vend"))
  );
}

async function fetchAuditedCalls(): Promise<NormalizedCall[]> {
  if (process.env.INSFORGE_BASE_URL) {
    try {
      const { data, error } = await insforge.database
        .from("auditorias")
        .select("id, metadata, score, analysis, transcription, created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) return [];
      return (data || []).map((row: any) => ({
        id: row.id,
        metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : (row.metadata || {}),
        score: row.score,
        analysis: row.analysis || {},
        transcription: row.transcription || [],
        createdAt: row.created_at || null,
      }));
    } catch {
      return [];
    }
  }
  return localCallsMemory.map((c: any) => ({
    id: c.id,
    metadata: c.metadata || {},
    score: c.score,
    analysis: c.analysis || {},
    transcription: c.transcription || [],
    createdAt: c.created_at || c.metadata?.uploadedAt || null,
  }));
}

function toTopCall(call: NormalizedCall): TopCall {
  return {
    id: call.id,
    metadata: call.metadata,
    score: call.score,
    scoreGlobal: getScoreGlobal(call),
    salesOutcome: String(call.analysis.salesOutcome || ""),
    transcription: call.transcription,
    createdAt: call.createdAt,
  };
}

// ── Selección de mejores llamadas ─────────────────────────────────

export function selectWinningCalls(candidates: TopCall[], limit = 20): TopCall[] {
  const winners = candidates.filter(
    (c) => WIN_SALES_OUTCOMES.includes(c.salesOutcome) || c.scoreGlobal >= TOP_SCORE_THRESHOLD,
  );
  winners.sort((a, b) => b.scoreGlobal - a.scoreGlobal);
  return winners.slice(0, Math.min(limit, 50));
}

export async function getTopCalls(limit = 20): Promise<TopCall[]> {
  const calls = await fetchAuditedCalls();
  const candidates = calls.map(toTopCall).filter((c) => hasSellerLines(c.transcription));
  return selectWinningCalls(candidates, limit);
}

// ── Clasificación por etapa y objeción ────────────────────────────

function scoreByKeywords(text: string, map: { id: string; kws: string[] }[]): string | null {
  const lower = text.toLowerCase();
  let best: string | null = null;
  let bestHits = 0;
  for (const { id, kws } of map) {
    let hits = 0;
    for (const kw of kws) {
      if (lower.includes(kw)) hits++;
    }
    if (hits > bestHits) {
      bestHits = hits;
      best = id;
    }
  }
  return bestHits > 0 ? best : null;
}

export function classifySection(text: string): string | null {
  return scoreByKeywords(text, SECTION_KEYWORDS);
}

export function classifyObjection(text: string, hasContext: boolean): string | null {
  if (!hasContext) return null;
  return scoreByKeywords(text, OBJECTION_KEYWORDS);
}

// ── Extracción de momentos ganadores ──────────────────────────────

export function extractWinMoments(call: TopCall): WinMoment[] {
  const transcription = Array.isArray(call.transcription) ? call.transcription : [];
  const moments: WinMoment[] = [];
  let current: string[] = [];
  let currentStart = 0;
  let currentEnd = 0;
  let currentSentiment: "positive" | "neutral" | "negative" = "neutral";
  let lastClient = "";
  let hasClientBefore = false;

  const flush = () => {
    if (current.length === 0) return;
    const text = current.join(" ").replace(/\s+/g, " ").trim();
    if (text.length >= 30) {
      moments.push({
        text,
        context: lastClient,
        sentiment: currentSentiment,
        section: classifySection(text),
        objection: classifyObjection(text, hasClientBefore),
        start: currentStart,
        end: currentEnd,
      });
    }
    current = [];
    currentSentiment = "neutral";
  };

  (transcription as any[]).forEach((utt) => {
    const speaker = String(utt.speaker || "").toLowerCase();
    if (speaker.includes("vend")) {
      if (current.length === 0) currentStart = typeof utt.start === "number" ? utt.start : 0;
      current.push(String(utt.text || "").trim());
      currentEnd = typeof utt.end === "number" ? utt.end : 0;
      const sent = String(utt.sentiment || "").toLowerCase();
      if (sent === "negative") currentSentiment = "negative";
      else if (sent === "positive" && currentSentiment !== "negative") currentSentiment = "positive";
    } else {
      flush();
      const t = String(utt.text || "").trim();
      if (t) {
        lastClient = t;
        hasClientBefore = true;
      }
    }
  });
  flush();

  const classified = moments.filter((m) => m.section || m.objection);
  const rest = moments.filter((m) => !(m.section || m.objection));
  return [...classified, ...rest].slice(0, MAX_MOMENTS_PER_CALL);
}

// ── Prompt y síntesis con IA ──────────────────────────────────────

interface MomentsByCall {
  call: TopCall;
  moments: WinMoment[];
}

const SECTION_LABELS: Record<string, string> = {
  bienvenida: "Bienvenida / Apertura",
  sondeo: "Sondeo / Descubrimiento de necesidades",
  personalizar: "Personalizar / Asesorar (UTEL, modelo, validez)",
  costos: "Oferta económica / Costos",
  acordar: "Acuerdos y cierre",
};

const OBJECTION_LABELS: Record<string, string> = {
  costos: "Objeción: es muy caro / no alcanza",
  duda: "Objeción: déjame pensarlo",
  tiempo: "Objeción: no tengo tiempo",
  modalidad: "Objeción: no me convence la modalidad en línea",
  competencia: "Objeción: ya tengo otra opción",
  confianza: "Objeción: no conozco UTEL",
  calidad: "Objeción: ¿la educación en línea es buena?",
  familia: "Objeción: necesito consultarlo con mi familia",
};

function buildLearningPrompt(momentsByCall: MomentsByCall[]): string {
  const callDump = momentsByCall
    .map(({ call, moments }, i) => {
      const lines = moments
        .map((m) => {
          const tags = [
            m.section ? `seccion:${m.section}` : null,
            m.objection ? `objecion:${m.objection}` : null,
          ]
            .filter(Boolean)
            .join(", ");
          const ctx = m.context ? `\n      Cliente antes: "${m.context}"` : "";
          return `    - [${tags || "sin clasificar"}]${ctx}\n      Vendedor: "${m.text}"`;
        })
        .join("\n");
      const fileName = String(call.metadata?.fileName || "audio");
      return `LLAMADA ${i + 1} (score ${call.scoreGlobal}, desenlace "${call.salesOutcome}", "${fileName}"):\n${lines}`;
    })
    .join("\n\n");

  const sectionsDesc = LEARNED_SECTIONS.map((id) => `${id} (${SECTION_LABELS[id]})`).join(", ");
  const objectionsDesc = LEARNED_OBJECTIONS.map((id) => `${id} (${OBJECTION_LABELS[id]})`).join(", ");

  return `
# ROL
Eres un Auditor Senior de Calidad Educativa de UTEL Universidad y un experto en neuroventas. Tu tarea es convertir las MEJORES frases reales de llamadas exitosas en speeches reutilizables para los asesores.

# MATERIAL (frases reales de vendedores que cerraron ventas o lograron puntaje alto, con contexto)
${callDump}

# TAREA
A partir SOLO de las frases del material, sintetiza los mejores speeches posibles para cada una de las siguientes etapas y objeciones.

Etapas: ${sectionsDesc}
Objeciones: ${objectionsDesc}

# CRITERIOS DE EVALUACIÓN (para cada frase candidata puntúa 1-5 por criterio y elige la mejor técnica):
1. Proveniencia ganadora: que provenga de llamadas con venta cerrada o puntaje alto.
2. Frecuencia de éxito: que la misma técnica aparezca en varias llamadas.
3. Completa la rúbrica PCE: cubre el subítem correspondiente de la etapa.
4. Naturalidad: clara, conversacional, fácil de decir en vivo, sin muletillas.
5. Acción en objeciones: para objeciones, valida la emoción del cliente Y da un siguiente paso concreto.
6. Reutilizable: funciona con cualquier prospecto usando placeholders [Nombre], [Carrera], [duración].

# REGLAS
- Prohibido inventar datos (cifras, becas, programas) que no estén en el material.
- Usa placeholders para nombres y carreras.
- Redacta en español, en primera persona, con la voz de un asesor UTEL.
- Para cada etapa escribe 1-2 speeches; para cada objeción escribe 1-2 respuestas.

# FORMATO DE RESPUESTA
Responde con un objeto JSON con esta estructura exacta:
{
  "sections": [
    { "sectionId": "bienvenida|sondeo|personalizar|costos|acordar", "title": "Título corto", "content": "Texto del speech" }
  ],
  "objections": [
    { "objectionId": "costos|duda|tiempo|modalidad|competencia|confianza|calidad|familia", "title": "Título corto", "content": "Texto de la respuesta" }
  ]
}`;
}

export function normalizeSectionId(value: unknown): string | null {
  const v = String(value || "").trim().toLowerCase();
  return (LEARNED_SECTIONS as readonly string[]).includes(v) ? v : null;
}

export function normalizeObjectionId(value: unknown): string | null {
  const v = String(value || "").trim().toLowerCase();
  return (LEARNED_OBJECTIONS as readonly string[]).includes(v) ? v : null;
}

function slugify(title: string): string {
  const slug = String(title || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return slug || "speech";
}

interface CallStat {
  sourceCallCount: number;
  avgScore: number;
  winCount: number;
}

function computeStats(relevant: MomentsByCall[]): CallStat {
  const scores = relevant
    .map((r) => r.call.scoreGlobal)
    .filter((s): s is number => typeof s === "number");
  const avg = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
  const wins = relevant.filter((r) => WIN_SALES_OUTCOMES.includes(r.call.salesOutcome)).length;
  return {
    sourceCallCount: relevant.length,
    avgScore: avg,
    winCount: wins,
  };
}

export async function generateLearnedSpeeches(topCalls: TopCall[]): Promise<LearnedSpeech[]> {
  const momentsByCall: MomentsByCall[] = topCalls
    .map((call) => ({ call, moments: extractWinMoments(call) }))
    .filter((x) => x.moments.length > 0);

  if (momentsByCall.length === 0) return [];

  const prompt = buildLearningPrompt(momentsByCall.slice(0, MAX_CALLS_IN_PROMPT));
  const result = await callOpenRouter(prompt);

  const sections = Array.isArray(result?.sections) ? result.sections : [];
  const objections = Array.isArray(result?.objections) ? result.objections : [];

  const speeches: LearnedSpeech[] = [];
  const now = new Date().toISOString();

  for (const sec of sections) {
    const sectionId = normalizeSectionId(sec?.sectionId);
    if (!sectionId) continue;
    const relevant = momentsByCall.filter(({ moments }) => moments.some((m) => m.section === sectionId));
    const stats = computeStats(relevant);
    const list = Array.isArray(sec?.speeches) ? sec.speeches : [];
    for (const s of list) {
      const title = String(s?.title || "").trim();
      const content = String(s?.content || "").trim();
      if (!title || !content) continue;
      speeches.push({
        id: `sec_${sectionId}_${slugify(title)}`,
        sectionId,
        objectionId: null,
        title,
        content,
        sourceCallCount: stats.sourceCallCount,
        avgScore: stats.avgScore,
        winCount: stats.winCount,
        status: "published",
        createdAt: now,
      });
    }
  }

  for (const obj of objections) {
    const objectionId = normalizeObjectionId(obj?.objectionId);
    if (!objectionId) continue;
    const relevant = momentsByCall.filter(({ moments }) => moments.some((m) => m.objection === objectionId));
    const stats = computeStats(relevant);
    const list = Array.isArray(obj?.speeches) ? obj.speeches : [];
    for (const s of list) {
      const title = String(s?.title || "").trim();
      const content = String(s?.content || "").trim();
      if (!title || !content) continue;
      speeches.push({
        id: `obj_${objectionId}_${slugify(title)}`,
        sectionId: null,
        objectionId,
        title,
        content,
        sourceCallCount: stats.sourceCallCount,
        avgScore: stats.avgScore,
        winCount: stats.winCount,
        status: "published",
        createdAt: now,
      });
    }
  }

  return speeches;
}

// ── Persistencia (DB con fallback en memoria) ─────────────────────

const learningMemory: {
  speeches: LearnedSpeech[];
  lastRegeneratedAt: string | null;
  lastRegeneratedBy: string | null;
} = {
  speeches: [],
  lastRegeneratedAt: null,
  lastRegeneratedBy: null,
};

export async function clearLearnedSpeeches(): Promise<void> {
  learningMemory.speeches = [];
  if (process.env.INSFORGE_BASE_URL) {
    try {
      await insforge.database.from("learned_speeches").delete().neq("id", "__none__");
    } catch (err: any) {
      console.warn("[LEARNING] Error clearing speeches:", err.message);
    }
  }
}

export async function saveLearnedSpeeches(
  speeches: LearnedSpeech[],
  byUser: string,
): Promise<void> {
  learningMemory.speeches = speeches;
  learningMemory.lastRegeneratedAt = new Date().toISOString();
  learningMemory.lastRegeneratedBy = byUser;

  if (!process.env.INSFORGE_BASE_URL) return;

  try {
    if (speeches.length > 0) {
      await insforge.database.from("learned_speeches").upsert(
        speeches.map((s) => ({
          id: s.id,
          section_id: s.sectionId,
          objection_id: s.objectionId,
          title: s.title,
          content: s.content,
          source_call_count: s.sourceCallCount,
          avg_score: s.avgScore,
          win_count: s.winCount,
          status: s.status,
          created_at: s.createdAt,
          updated_at: new Date().toISOString(),
        })),
      );
    }
    await insforge.database.from("learning_meta").upsert({
      id: 1,
      last_regenerated_at: learningMemory.lastRegeneratedAt,
      last_regenerated_by: byUser,
      updated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn("[LEARNING] Error saving speeches:", err.message);
  }
}

export async function getLearnedSpeeches(): Promise<LearnedSpeech[]> {
  if (process.env.INSFORGE_BASE_URL) {
    try {
      const { data, error } = await insforge.database
        .from("learned_speeches")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) return learningMemory.speeches;
      return (data || []).map((row: any) => ({
        id: row.id,
        sectionId: row.section_id,
        objectionId: row.objection_id,
        title: row.title,
        content: row.content,
        sourceCallCount: row.source_call_count || 0,
        avgScore: row.avg_score || 0,
        winCount: row.win_count || 0,
        status: row.status || "published",
        createdAt: row.created_at || new Date().toISOString(),
      }));
    } catch {
      return learningMemory.speeches;
    }
  }
  return learningMemory.speeches;
}

async function getLastRegeneratedAt(): Promise<string | null> {
  if (process.env.INSFORGE_BASE_URL) {
    try {
      const { data } = await insforge.database
        .from("learning_meta")
        .select("last_regenerated_at")
        .eq("id", 1)
        .maybeSingle();
      return data?.last_regenerated_at || null;
    } catch {
      return learningMemory.lastRegeneratedAt;
    }
  }
  return learningMemory.lastRegeneratedAt;
}

export interface LearningStatus {
  totalCalls: number;
  newCallsSince: number;
  lastRegeneratedAt: string | null;
  generatedSpeechCount: number;
  warning: "none" | "info" | "warning";
  warningThreshold: number;
  topCallsCount: number;
  avgTopScore: number;
  canRegenerate: boolean;
}

export async function getLearningStatus(): Promise<LearningStatus> {
  const threshold = parseInt(process.env.LEARNING_WARN_THRESHOLD || "10", 10) || 10;
  const calls = await fetchAuditedCalls();
  const totalCalls = calls.length;

  const lastRegeneratedAt = await getLastRegeneratedAt();

  const newCallsSince = lastRegeneratedAt
    ? calls.filter((c) => {
        const t = c.createdAt;
        return !!t && new Date(t).getTime() > new Date(lastRegeneratedAt).getTime();
      }).length
    : totalCalls;

  let generatedSpeechCount = 0;
  if (process.env.INSFORGE_BASE_URL) {
    try {
      const { count } = await insforge.database
        .from("learned_speeches")
        .select("id", { count: "exact", head: true });
      generatedSpeechCount = count || 0;
    } catch {
      generatedSpeechCount = learningMemory.speeches.length;
    }
  } else {
    generatedSpeechCount = learningMemory.speeches.length;
  }

  const topCalls = await getTopCalls(30);
  const avgTopScore = topCalls.length
    ? Math.round(topCalls.reduce((a, c) => a + c.scoreGlobal, 0) / topCalls.length)
    : 0;

  let warning: "none" | "info" | "warning" = "none";
  if (newCallsSince >= threshold) warning = "warning";
  else if (newCallsSince >= Math.ceil(threshold / 2) && newCallsSince > 0) warning = "info";

  return {
    totalCalls,
    newCallsSince,
    lastRegeneratedAt,
    generatedSpeechCount,
    warning,
    warningThreshold: threshold,
    topCallsCount: topCalls.length,
    avgTopScore,
    canRegenerate: topCalls.length > 0,
  };
}

// ── Snippets para la lista de referencia ──────────────────────────

export function getCallSnippets(call: TopCall): string[] {
  return extractWinMoments(call).map((m) => m.text).slice(0, 3);
}
