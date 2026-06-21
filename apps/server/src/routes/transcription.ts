import type { Express } from "express";
import axios from "axios";
import { AssemblyAI } from "assemblyai";
import { put as blobPut } from "@vercel/blob";
import {
  localCallsMemory,
  pendingTranscripts,
  prependAndRemoveCall,
} from "../config.js";
import { assemblyAITranscribe } from "../services/assemblyai.js";
import { callOpenRouter } from "../services/openrouter.js";
import {
  evaluateUtelHeuristic,
  applyTranscriptionGuardrails,
} from "../services/analysis.js";
import { buildChecklist, type Modalidad } from "../shared/pce-rubric.js";
import { saveCallToSupabase } from "../services/supabase.js";

export default function (app: Express): void {
  // POST /api/whisper — Standalone transcription with AssemblyAI
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

      const { segments, duration } = await assemblyAITranscribe(audioBuffer, fileName);

      if (!segments.length) {
        return res.status(503).json({ error: "AssemblyAI transcription produced no segments" });
      }

      return res.status(200).json({ segments, duration, engine: "assemblyai" });
    } catch (error: any) {
      console.error("[WHISPER-API] Error:", error.message);
      return res.status(500).json({ error: `AssemblyAI transcription failed: ${error.message}` });
    }
  });

  // GET /api/transcript/:callId — Poll transcript status and get results
  app.get("/api/transcript/:callId", async (req, res) => {
    const { callId } = req.params;
    const pending = pendingTranscripts.get(callId);

    if (!pending) {
      const existing = localCallsMemory.find(c => c.id === callId);
      if (existing) return res.json({ status: "completed", call: existing });
      return res.status(404).json({ error: "Transcripción no encontrada" });
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "ASSEMBLYAI_API_KEY not configured" });

    try {
      const client = new AssemblyAI({ apiKey });
      const transcript = await client.transcripts.get(pending.transcriptId);

      if (transcript.status === "error") {
        pendingTranscripts.delete(callId);
        return res.json({ status: "error", error: transcript.error || "Error en transcripción" });
      }

      if (transcript.status !== "completed") {
        return res.json({ status: transcript.status, progress: "transcribing" });
      }

      console.log(`[TRANSCRIPT] Transcripción completada para ${callId}, procesando análisis...`);

      const duration = transcript.audio_duration || 0;
      let segments: any[] = [];
      if (transcript.utterances && transcript.utterances.length > 0) {
        segments = transcript.utterances.map((utt: any) => ({
          start: utt.start / 1000,
          end: utt.end / 1000,
          text: (utt.text || "").trim(),
          speaker: utt.speaker || "",
        }));
      } else if (transcript.text && transcript.text.trim()) {
        segments = [{ start: 0, end: duration, text: transcript.text.trim(), speaker: "" }];
      }

      if (!segments.length) {
        pendingTranscripts.delete(callId);
        return res.json({ status: "error", error: "La transcripción no contiene texto" });
      }

      // Diarization with OpenRouter
      const textoTranscrito = segments.map(s => s.text).join(" ");
      let speakerMapping: Record<number, string> = {};
      try {
        const diarResult = await callOpenRouter(`Eres un transcriptor experto. Recibes una transcripción de llamada de ventas UTEL con segmentos sin identificar orador.

Segmentos:
${JSON.stringify(segments.map((s, i) => ({ idx: i, text: s.text })), null, 2)}

Texto completo: "${textoTranscrito}"

Analiza el diálogo y determina para CADA segmento si quien habla es "Vendedor" (asesor UTEL) o "Cliente" (prospecto).

Responde JSON: { "speakers": { "0": "Vendedor"|"Cliente", "1": "...", ... } }`);
        if (diarResult?.speakers) speakerMapping = diarResult.speakers;
      } catch {
        segments.forEach((_, i) => { speakerMapping[i] = i % 2 === 0 ? "Vendedor" : "Cliente"; });
      }

      const posWords = ["bien", "excelente", "perfecto", "gracias", "interesa", "interesado", "gusta", "bueno", "súper", "claro", "sí"];
      const negWords = ["no", "caro", "costoso", "tiempo", "complicado", "difícil", "duda", "pero", "mal"];

      const cleanTranscription = segments.map((seg, i) => {
        const speaker = speakerMapping[i] || (i % 2 === 0 ? "Vendedor" : "Cliente");
        const textLower = seg.text.toLowerCase();
        let sentiment = "neutral";
        if (speaker === "Cliente") {
          const hasPos = posWords.some(w => textLower.includes(w));
          const hasNeg = negWords.some(w => textLower.includes(w));
          if (hasPos && !hasNeg) sentiment = "positive";
          else if (hasNeg) sentiment = "negative";
        }
        return { speaker, start: seg.start || 0, end: seg.end || 0, text: seg.text, sentiment, confidence: 0.95 };
      });

      const correctedTranscription = await applyTranscriptionGuardrails(cleanTranscription);
      const localUtelResult = evaluateUtelHeuristic(correctedTranscription, pending.fileName);

      let finalUtelResult = localUtelResult;
      let summaryText = `La llamada para '${pending.fileName}' se auditó internamente.`;
      let customerMood: "receptivo" | "molesto" | "neutral" | "interesado" | "indiferente" = "neutral";
      let salesOutcome: "venta_cerrada" | "interesado_seguimiento" | "no_interesado" | "agenda_demostracion" = "interesado_seguimiento";
      let strengths = ["Presentación clara"];
      let weaknesses = ["Oportunidad en cierre"];
      let nextSteps = ["Seguimiento CRM"];
      let emotionalAnalysis = localUtelResult.emotionalAnalysis;

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
    - "primaryEmotion": Emoción predominante observable.
    - "emotionalJourney": Viaje emocional de la conversación.
    - "purchaseAptitudeScore": Puntuación 0-100 del deseo de compra.
    - "purchaseAptitudeLabel": "Muy Alto"|"Alto"|"Medio"|"Bajo"|"Nulo".
    - "barriersToPurchase": Obstáculos detectados.
    - "buyingSignals": Señales positivas observadas.
    - "aptitudeReason": Táctica comercial recomendada.

    # TRANSCRIPCIÓN DEL AUDIO:
    ${JSON.stringify(correctedTranscription, null, 2)}

    # FORMATO DE RESPUESTA EXCLUSIVO (JSON VÁLIDO):
    {
      "evaluated_subitems": { "c1_linea": true, "c1_programa": true, ... },
      "evaluacion_detallada": { "CONOCE A TU CLIENTE": "...", ... },
      "modalidad_detectada": "LÍNEA",
      "summary": "Resumen cognitivo...",
      "strengths": [], "weaknesses": [], "nextSteps": [],
      "customerMood": "interesado",
      "salesOutcome": "interesado_seguimiento",
      "emotionalAnalysis": { ... }
    }`;

      try {
        console.log(`[TRANSCRIPT] Analizando con OpenRouter para ${callId}...`);
        const parsed = await callOpenRouter(promptText);
        if (parsed) {
          const evaluatedSubitems = parsed.evaluated_subitems || parsed.evaluatedSubitems || {};
          const feedbackMap = parsed.evaluacion_detallada || parsed.feedbackMap || {};
          const modality = parsed.modalidad_detectada || "LÍNEA";
          finalUtelResult = buildChecklist(evaluatedSubitems, feedbackMap, modality as Modalidad);
          summaryText = parsed.summary || summaryText;
          customerMood = parsed.customerMood || customerMood;
          salesOutcome = parsed.salesOutcome || salesOutcome;
          strengths = parsed.strengths || strengths;
          weaknesses = parsed.weaknesses || weaknesses;
          nextSteps = parsed.nextSteps || nextSteps;
          if (parsed.emotionalAnalysis) emotionalAnalysis = parsed.emotionalAnalysis;
        }
      } catch (orErr: any) {
        console.error("[TRANSCRIPT] Error en análisis OpenRouter:", orErr.message);
      }

      const finalCallData = {
        id: callId,
        contact_id: null,
        status: 'pending_contact',
        metadata: {
          fileName: pending.fileName,
          url: `/api/audio/${callId}`,
          size: pending.audioBuffer.length,
          duration: Math.round(duration || 180),
          uploadedAt: new Date().toISOString(),
          uploadedBy: "auditor_sales_prod",
          status: "pending_contact",
        },
        score: {
          global: Math.round(finalUtelResult.totalScore * 10),
          greeting: 85,
          needDiscovery: 80,
          objectionHandling: 70,
          closingSkills: 60,
          empathy: 75,
        },
        analysis: {
          summary: summaryText,
          strengths,
          weaknesses,
          nextSteps,
          customerMood,
          salesOutcome,
          utel: finalUtelResult,
          emotionalAnalysis,
        },
        transcription: correctedTranscription,
      };

      // Subir audio a Vercel Blob para acceso persistente entre instancias
      try {
        const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
        if (blobToken && pending.audioBuffer) {
          const ext = pending.fileName.split('.').pop() || 'mp3';
          const blobPath = `audio/${callId}.${ext}`;
          const blobResult = await blobPut(blobPath, pending.audioBuffer, {
            access: 'public',
            contentType: `audio/${ext === 'mp3' ? 'mpeg' : ext}`,
            addRandomSuffix: false,
          });
          (finalCallData.metadata as any).blobUrl = blobResult.url;
          (finalCallData.metadata as any).audioUrl = blobResult.url;
          console.log(`[BLOB] Audio subido a Vercel Blob: ${blobResult.url}`);
        }
      } catch (blobErr: any) {
        console.warn(`[BLOB] Error subiendo audio a Blob: ${blobErr.message}`);
        // No es crítico — el audio se sirve desde memoria si es posible
      }

      prependAndRemoveCall(finalCallData, callId);
      pendingTranscripts.delete(callId);
      // Guardamos en Supabase con contact_id = null (se asigna después)
      // Esto asegura que los datos sobrevivan entre instancias serverless
      saveCallToSupabase(finalCallData);
      return res.json({ status: "completed", call: finalCallData });
    } catch (err: any) {
      console.error("[TRANSCRIPT] Error:", err.message);
      return res.status(500).json({ status: "error", error: err.message });
    }
  });
}
