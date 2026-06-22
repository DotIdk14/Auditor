import type { Express } from "express";
import axios from "axios";
import { AssemblyAI } from "assemblyai";
import { put as blobPut } from "@vercel/blob";
import {
  localCallsMemory,
  pendingTranscripts,
  prependAndRemoveCall,
  supabase,
  supabaseAdmin,
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
    let pending = pendingTranscripts.get(callId);

    // ── If not in memory, try to recover from Supabase ────────────
    // This is critical for Vercel serverless: upload happened on instance A,
    // but polling hits instance B where pendingTranscripts is empty.
    if (!pending) {
      // 1. Check localCallsMemory first (already completed, warm instance)
      const existing = localCallsMemory.find(c => c.id === callId);
      if (existing) return res.json({ status: "completed", call: existing });

      // 2. Try to recover from Supabase (persistent across instances)
      if (supabase) {
        try {
          const client = supabaseAdmin || supabase;
          const { data: dbCall } = await client
            .from("auditorias")
            .select("*")
            .eq("id", callId)
            .maybeSingle();

          if (!dbCall) {
            return res.status(404).json({ error: "Transcripción no encontrada", callId });
          }

          const meta = dbCall?.metadata || {};

          // 2a. If analysis is already complete, restore the full call
          if (meta.analysisComplete) {
            const restoredCall = {
              id: dbCall.id,
              contact_id: dbCall.contact_id || null,
              status: meta.status || 'por_auditar',
              metadata: meta,
              score: dbCall.score || { global: 0 },
              analysis: dbCall.analysis || {},
              transcription: dbCall.transcription || [],
            };
            localCallsMemory.unshift(restoredCall);
            return res.json({ status: "completed", call: restoredCall });
          }

          // 2b. If transcriptId exists, reconstruct pending entry
          const transcriptId = meta.transcriptId || meta.transcript_id;
          if (transcriptId) {
            pending = {
              transcriptId,
              audioBuffer: Buffer.alloc(0), // placeholder — audio will be re-fetched from Blob
              fileName: meta?.fileName || "audio.mp3",
              callId,
              timestamp: Date.now(),
            };
            pendingTranscripts.set(callId, pending);
            console.log(`[TRANSCRIPT] Recovered transcript ${transcriptId} for ${callId} from Supabase`);
          } else {
            // 2c. Call exists but no transcriptId and no analysisComplete → upload never completed
            return res.status(404).json({
              error: "Transcripción no encontrada",
              detail: "El audio se recibió pero la transcripción no se inició. El transcriptId no está disponible en la base de datos.",
              callId,
            });
          }
        } catch (dbErr: any) {
          console.warn(`[TRANSCRIPT] Supabase recovery failed for ${callId}: ${dbErr.message}`);
          return res.status(404).json({ error: "Transcripción no encontrada", callId });
        }
      } else {
        // No Supabase configured — in-memory only
        return res.status(404).json({ error: "Transcripción no encontrada", callId });
      }
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

      const promptText = `# Manual de Auditoría PCE UTEL

Eres el agente inteligente "Auditor Senior UTEL", programado para evaluar de forma estricta y transparente la interacción verbal entre un asesor comercial y un prospecto de UTEL Universidad. Tu tarea consiste en procesar la transcripción de la llamada, identificar los roles de los participantes y aplicar rigurosamente la Pauta de Calidad Educativa (PCE) con el fin de generar análisis psicológicos de neuroventas y puntajes comerciales exactos.

## Árbol de Razonamiento

Sigue esta secuencia lógica:

1. **Identificación de Roles**: Quien introduce el saludo institucional UTEL es el Vendedor. Quien responde sobre motivos personales es el Cliente. Si el primer orador expresa timidez breve (ej: "¿Sí? Bueno..."), no lo tipifiques como vendedor por hablar primero.
2. **Segmentación del Diálogo**: Divide diálogos continuos. Si un bloque supera 15 palabras, córtalo en partes secuenciales.
3. **Verificación Binaria Estricta (22 Subítems)**: Para cada subítem, busca evidencia discursiva explícita. No asumas que porque se habló de dinero ya se cumplieron todos los subítems de costos.
4. **Inferencia Psicoemocional**: Analiza el cambio de actitud del prospecto. ¿Inició indiferente y cerró interesado?

## Guía de Evaluación Campo por Campo (22 Subítems)

### CATEGORÍA C1: CONOCE A TU CLIENTE
- **c1_linea** (0.20 pts): ¿El asesor menciona modalidad virtual/flexible/a distancia? Disparadores: "modalidad en línea", "virtual", "estudio a distancia". Falso positivo: solo decir "bienvenido a UTEL" sin describir el formato.
- **c1_programa** (0.20 pts): ¿Se define el título o grado exacto (Licenciatura en X, Maestría en Y)? No basta un área general. Disparadores: "Ingeniería en...", "Licenciatura en...".
- **c1_demo** (0.20 pts): ¿Se capturan edad o ubicación (ciudad/estado)? Disparadores: "¿En qué estado vives?", "¿Qué edad tienes?".
- **c1_ocup** (0.20 pts): ¿Se pregunta ocupación laboral o último grado académico? Disparadores: "¿Actualmente trabajas?", "¿Cuál es tu último nivel de estudios?".
- **c1_equiv** (0.20 pts): ¿Se indaga sobre equivalencias, revalidación o estudios inconclusos? Disparadores: "¿Tienes estudios universitarios previos?", "¿Dejaste alguna carrera trunca?".

### CATEGORÍA C2: GENERALIDADES
- **c2_num** (0.34 pts): ¿Mención explícita de numeralia (más de 12 años, presencia en 30+ países, 100K+ egresados)? Disparadores: "más de 12 años de trayectoria", "presencia en varios países".
- **c2_mod** (0.33 pts): ¿Explica el modelo educativo flexible (aula digital 24/7, tutor, coach)? Disparadores: "plataforma disponible 24/7", "acompañamiento tutorial".
- **c2_esp** (0.33 pts): ¿Vincula el modelo con las necesidades específicas del prospecto? Disparadores: "Como me comentabas que tu horario es...", "Justo para ti que...".

### CATEGORÍA C3: OFERTA ACADÉMICA
- **c3_costos** (0.20 pts): ¿Presenta el costo regular mensual? Falso positivo: dar precio con descuento sin establecer la base.
- **c3_comp** (0.20 pts): ¿Explica costos complementarios (inscripción, reinscripción, titulación)? Disparadores: "cuota única de inscripción", "monto por reinscripción".
- **c3_jor** (0.20 pts): ¿Define la carga horaria (2-3 horas diarias)? Falso positivo: decir que con minutos a la semana basta.
- **c3_beca** (0.20 pts): ¿Informa % de beca, vigencia y condiciones para mantenerla? Disparadores: "beca del 40%", "manteniendo promedio mínimo de 8.5".
- **c3_ciclos** (0.20 pts): ¿Fecha exacta de inicio de clases? Falso positivo: respuestas vagas como "en unos días".

### CATEGORÍA C4: ACUERDOS Y CIERRE
- **c4_res** (0.25 pts): ¿Recapitula los acuerdos clave (programa, costo neto, beca)? Disparadores: "Para recapitular las condiciones...".
- **c4_doc** (0.25 pts): ¿Solicita documentos de admisión (CURP, INE, certificado)? Disparadores: "Necesitaremos tus documentos digitales".
- **c4_pag** (0.25 pts): ¿Establece fecha/hora límite de pago? Falso positivo: aceptar "pago cuando tenga dinero".
- **c4_ref** (0.25 pts): ¿Pide referidos proactivamente? Disparadores: "¿Tienes algún amigo o familiar interesado?".

### CATEGORÍA C5: GESTIÓN Y REGISTRO
- **c5_int** (1.20 pts): ¿Habla directamente con el interesado real?
- **c5_tip** (1.20 pts): ¿Se infiere tipificación correcta para CRM?
- **c5_pla** (1.20 pts): ¿Usa plataformas/guiones UTEL con profesionalismo?
- **c5_reg** (1.20 pts): ¿Menciona tomar notas en CRM? Disparadores: "Permíteme apuntar esto en tu sistema...".
- **c5_seg** (1.20 pts): ¿Acuerda fecha/hora exacta de seguimiento? Falso positivo: "luego te marco".

## TRANSCRIPCIÓN DEL AUDIO:
${JSON.stringify(correctedTranscription, null, 2)}

## FORMATO DE RESPUESTA EXCLUSIVO (JSON VÁLIDO, sin markdown):
{
  "summary": "Resumen ejecutivo en tercera persona (máx 120 palabras).",
  "customerMood": "receptivo | molesto | neutral | interesado | indiferente",
  "salesOutcome": "venta_cerrada | interesado_seguimiento | no_interesado | agenda_demostracion",
  "strengths": ["Fortaleza 1", "Fortaleza 2"],
  "weaknesses": ["Debilidad 1", "Debilidad 2"],
  "nextSteps": ["Paso 1", "Paso 2"],
  "evaluatedSubitems": {
    "c1_linea": true, "c1_programa": true, "c1_demo": false, "c1_ocup": true, "c1_equiv": false,
    "c2_num": true, "c2_mod": true, "c2_esp": true,
    "c3_costos": true, "c3_comp": false, "c3_jor": false, "c3_beca": true, "c3_ciclos": true,
    "c4_res": true, "c4_doc": false, "c4_pag": false, "c4_ref": false,
    "c5_int": true, "c5_tip": true, "c5_pla": true, "c5_reg": false, "c5_seg": true
  },
  "feedbackMap": {
    "CONOCE A TU CLIENTE": "Comentario sobre C1.",
    "GENERALIDADES": "Comentario sobre C2.",
    "OFERTA ACADÉMICA": "Comentario sobre C3.",
    "ACUERDOS Y CIERRE": "Comentario sobre C4.",
    "GESTIÓN Y REGISTRO": "Comentario sobre C5."
  },
  "modalidad_detectada": "LÍNEA",
  "emotionalAnalysis": {
    "primaryEmotion": "Emoción dominante",
    "emotionalJourney": "Evolución emocional",
    "purchaseAptitudeScore": 75,
    "purchaseAptitudeLabel": "Alto",
    "barriersToPurchase": ["Barrera 1"],
    "buyingSignals": ["Señal 1"],
    "aptitudeReason": "Justificación de la aptitud"
  }
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

      // Normalizar el formato de análisis: extraer checklist → rubric
      const utelChecklist = (finalUtelResult as any)?.checklist || (finalUtelResult as any)?.rubric || [];
      const rubricItems = utelChecklist.map((item: any, i: number) => ({
        title: item.title || `Criterio ${i + 1}`,
        points: Math.round((item.score || 0) * (item.weight || 10)),
        maxPoints: item.weight || 10,
        status: (item.score || 0) >= 0.8 ? 'success' : (item.score || 0) >= 0.5 ? 'warning' : 'danger',
        details: [item.feedback || item.evaluacion || 'Sin detalle'],
      }));

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
          global: Math.round((finalUtelResult as any).totalScore * 10 || 75),
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
          // Los siguientes campos son para compatibilidad con visor-audits.ts
          rubric: rubricItems,
          checklist: utelChecklist,
          coaching: {
            strengths,
            improvements: weaknesses,
            nextSteps,
          },
          agentName: 'Sistema Automático',
          purchaseIntentPct: (finalUtelResult as any)?.emotionalAnalysis?.purchaseAptitudeScore || Math.round((finalUtelResult as any).totalScore * 10 || 50),
          purchaseIntentLabel: (finalUtelResult as any)?.emotionalAnalysis?.purchaseAptitudeLabel || 'Medio',
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
      // Mark analysis as complete and remove transient transcriptId
      // so cold-start recovery knows this call is fully processed
      (finalCallData.metadata as any).analysisComplete = true;
      delete (finalCallData.metadata as any).transcriptId;
      delete (finalCallData.metadata as any).transcript_id;
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
