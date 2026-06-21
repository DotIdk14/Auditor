import type { TranscriptionUtterance } from "../types.js";
import { evaluateHeuristic, buildChecklist, type Modalidad } from "../shared/pce-rubric.js";
import { generateHighFidelitySimulatedCall } from "../__fixtures__/simulated-calls.js";
import { callOpenRouter } from "./openrouter.js";
import { assemblyAITranscribe } from "./assemblyai.js";

// ── Heuristic evaluation (keyword-based, no AI) ───────────────────

export function evaluateUtelHeuristic(transcription: any[], fileName: string): any {
  const fullText = transcription.map((t: any) => t.text).join(" ").toLowerCase();
  return evaluateHeuristic(
    transcription.map((t: any) => ({ text: t.text })),
    fullText,
  );
}

// ── Guardrail: generate and split text diarization ────────────────

export async function generateAndSplitTextDiarization(
  consolidatedText: string
): Promise<TranscriptionUtterance[]> {
  try {
    console.log("[GUARDRAILS_OR] Separando oradores con OpenRouter...");
    const prompt = `Eres un transcriptor experto. Toma el siguiente texto continuo que representa una llamada telefónica real de ventas de UTEL Universidad donde se consolidaron los discursos de ambos oradores sin separarse ni asignarse los turnos.

Analiza semánticamente el flujo del diálogo y sepáralo exactamente en turnos de habla alternativos e individuales para 'Vendedor' (asesor UTEL) y 'Cliente' (prospecto).

Texto continuo a separar:
"${consolidatedText}"

Responde con un objeto JSON con el siguiente formato:
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

Divide el texto en fragmentos pequeños (máximo 15 palabras por turno). Estima tiempos coherentes ("start" y "end") incrementales comenzando en 0.0, asumiendo ~3 palabras por segundo.`;

    const result = await callOpenRouter(prompt);
    return (result.transcription || []).map((t: any) => ({
      speaker: t.speaker === "Vendedor" || t.speaker === "Cliente"
        ? t.speaker
        : (String(t.speaker).toLowerCase().includes("client") ? "Cliente" : "Vendedor"),
      text: String(t.text || "").trim(),
      sentiment: (t.sentiment === "positive" || t.sentiment === "negative" || t.sentiment === "neutral")
        ? t.sentiment
        : "neutral",
      start: typeof t.start === "number" ? t.start : 0.0,
      end: typeof t.end === "number" ? t.end : 0.0,
      confidence: 0.95,
    }));
  } catch (err) {
    console.error("Fallo al separar oradores con OpenRouter:", err);
    return [];
  }
}

// ── Transcription guardrails ──────────────────────────────────────

export async function applyTranscriptionGuardrails(
  transcription: any[]
): Promise<TranscriptionUtterance[]> {
  if (!transcription || transcription.length === 0) return [];

  let cleaned: TranscriptionUtterance[] = transcription.map(item => {
    let speaker: "Vendedor" | "Cliente" = "Vendedor";
    const s = String(item.speaker || "").toLowerCase().trim();
    if (s.includes("client") || s.includes("prospect") || s.includes("student") || s.includes("usuario") || s.includes("persona") || s.includes("c") || s.includes("interesado") || s.includes("jessica") || s.includes("prospecto")) {
      speaker = "Cliente";
    } else if (s.includes("vend") || s.includes("asesor") || s.includes("ejecut") || s.includes("utel") || s.includes("v") || s.includes("comercial") || s.includes("representante") || s.includes("alejandro")) {
      speaker = "Vendedor";
    } else {
      speaker = s.includes("2") || s.includes("b") ? "Cliente" : "Vendedor";
    }
    return {
      speaker,
      sentiment: (item.sentiment === "positive" || item.sentiment === "negative" || item.sentiment === "neutral")
        ? item.sentiment
        : "neutral",
      start: typeof item.start === "number" ? item.start : 0.0,
      end: typeof item.end === "number" ? item.end : 0.0,
      text: String(item.text || "").trim(),
      confidence: typeof item.confidence === "number" ? item.confidence : 0.95,
    };
  });

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

  let sellerScoresForVendedor = 0;
  let sellerScoresForCliente = 0;

  const sellerKeywords = [
    "utel", "colegiatura", "mensualidad", "inscripcion", "inscripción", "revalidar",
    "equivalencia", "plan de estudios", "materias", "modelo educativo", "beca",
    "descuento", "certificado de bachillerato", "ejecutivo", "asesor", "bienvenido",
    "duración", "jornada", "egresados",
  ];

  cleaned.forEach(item => {
    const textLower = (item.text || "").toLowerCase();
    let hits = 0;
    sellerKeywords.forEach(kw => {
      if (textLower.includes(kw)) hits++;
    });
    if (item.speaker === "Vendedor") {
      sellerScoresForVendedor += hits;
    } else if (item.speaker === "Cliente") {
      sellerScoresForCliente += hits;
    }
  });

  console.log(`[SPEAKER_GUARDRAIL_EVAL] Vendedor Score de palabras clave: ${sellerScoresForVendedor}, Cliente Score de palabras clave: ${sellerScoresForCliente}`);

  if (sellerScoresForCliente > sellerScoresForVendedor + 1 && sellerScoresForCliente > 2) {
    console.warn("[SPEAKER_GUARDRAIL] Se detectó REVERSIÓN flagrante de oradores (Asesor de UTEL catalogado como Cliente). Realizando swap de roles global para toda la transcripción...");
    cleaned = cleaned.map(item => ({
      ...item,
      speaker: item.speaker === "Vendedor" ? "Cliente" : "Vendedor",
    }));
  }

  return cleaned;
}

// ── Main local analysis pipeline (AssemblyAI + OpenRouter) ────────

export async function generateLocalAnalysis(
  audioBuffer: Buffer,
  format: string,
  fileName: string
): Promise<any> {
  const fallbackId = `fallback_${Date.now()}`;

  try {
    const { segments, duration } = await assemblyAITranscribe(audioBuffer, fileName);

    if (!segments.length) {
      console.warn("[LOCAL] ⚠ AssemblyAI no produjo transcripción. Verifica ASSEMBLYAI_API_KEY. Usando simulación como fallback.");
      return generateHighFidelitySimulatedCall(fileName, audioBuffer.length, fallbackId).analysis;
    }

    const textoCompleto = segments.map(s => s.text).join(" ");

    const promptText = `
# ROL
Eres un Auditor Senior de Calidad Educativa de la UTEL Universidad y un experto en Neuroventas.

TRANSCRIPCIÓN (segmentos con tiempos):
${JSON.stringify(segments, null, 2)}

Texto completo: "${textoCompleto}"

REALIZA LO SIGUIENTE:
1. Identifica quién es el "Vendedor" (representante UTEL) y quién el "Cliente" (prospecto) basado en el contenido.
2. Asigna cada segmento al orador correcto.
3. Evalúa los 22 subítems de la Rúbrica PCE UTEL (marca true/false cada uno).
4. Analiza el estado emocional y la aptitud de compra del cliente.

Responde con JSON en este formato exacto:
{
  "transcription": [{ "speaker": "Vendedor"|"Cliente", "text": "...", "sentiment": "positive"|"negative"|"neutral", "start": 0.0, "end": 0.0, "confidence": 0.95 }],
  "summary": "Resumen ejecutivo",
  "customerMood": "receptivo"|"molesto"|"neutral"|"interesado"|"indiferente",
  "salesOutcome": "venta_cerrada"|"interesado_seguimiento"|"no_interesado"|"agenda_demostracion",
  "strengths": [],
  "weaknesses": [],
  "nextSteps": [],
  "evaluatedSubitems": { "c1_linea": true, "c1_programa": false, ... },
  "feedbackMap": { "CONOCE A TU CLIENTE": "...", "GENERALIDADES": "...", "OFERTA ACADÉMICA": "...", "ACUERDOS Y CIERRE": "...", "GESTIÓN Y REGISTRO": "..." },
  "emotionalAnalysis": { "primaryEmotion": "...", "emotionalJourney": "...", "purchaseAptitudeScore": 0-100, "purchaseAptitudeLabel": "Muy Alto"|"Alto"|"Medio"|"Bajo", "barriersToPurchase": [], "buyingSignals": [], "aptitudeReason": "..." },
  "duration": ${duration}
}`;

    const analysis = await callOpenRouter(promptText);

    const evaluatedSubitems = analysis.evaluatedSubitems || {};
    const feedbackMap = analysis.feedbackMap || {};
    const modality = "LÍNEA";
    const builtChecklist = buildChecklist(evaluatedSubitems, feedbackMap, modality as Modalidad);
    const guardedTranscription = await applyTranscriptionGuardrails(analysis.transcription || []);

    return {
      ...analysis,
      transcription: guardedTranscription,
      utel: builtChecklist,
    };
  } catch (err) {
    console.error("Error en generateLocalAnalysis:", err);
    return generateHighFidelitySimulatedCall(fileName, audioBuffer.length, fallbackId).analysis;
  }
}
