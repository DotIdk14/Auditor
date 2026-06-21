import type { Express } from "express";
import axios from "axios";
import { AssemblyAI } from "assemblyai";
import { localCallsMemory, audioBuffers, pendingTranscripts, upload } from "../config.js";
import { assemblyAITranscribe } from "../services/assemblyai.js";
import { callOpenRouter } from "../services/openrouter.js";
import { evaluateUtelHeuristic, applyTranscriptionGuardrails } from "../services/analysis.js";
import { buildChecklist, type Modalidad } from "../shared/pce-rubric.js";
import { saveCallToSupabase } from "../services/supabase.js";

function serveAudio(res: any, buf: Buffer, range: string | undefined): void {
  const totalLength = buf.length;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
    if (start >= totalLength || end >= totalLength || start < 0 || end < start) {
      res.writeHead(416, { "Content-Range": `bytes */${totalLength}`, "Accept-Ranges": "bytes" });
      return res.end();
    }
    const chunk = buf.subarray(start, end + 1);
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${totalLength}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunk.length,
      "Content-Type": "audio/mpeg",
    });
    res.write(chunk);
    return res.end();
  }
  res.writeHead(200, {
    "Content-Length": totalLength,
    "Content-Type": "audio/mpeg",
    "Accept-Ranges": "bytes",
  });
  res.write(buf);
  return res.end();
}

export default function (app: Express): void {
  // GET /api/audio/:id — Serve audio file with range support
  app.get("/api/audio/:id", async (req, res) => {
    const callId = req.params.id;
    const buffer = audioBuffers.get(callId);
    if (buffer) {
      return serveAudio(res, buffer, req.headers.range);
    }

    const call = localCallsMemory.find(c => c.id === callId);
    const blobUrl = call?.metadata?.blobUrl;
    if (blobUrl) {
      try {
        const resp = await axios.get(blobUrl, { responseType: "arraybuffer", timeout: 15000 });
        audioBuffers.set(callId, Buffer.from(resp.data));
        return serveAudio(res, audioBuffers.get(callId)!, req.headers.range);
      } catch {
        // fall through to 404
      }
    }

    return res.status(404).json({ error: "Archivo de audio no encontrado en el servidor." });
  });

  // POST /api/upload — Upload audio file, start async transcription
  app.post("/api/upload", upload.single("audio"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No se proporcionó ningún archivo de audio." });
      }

      const originalName = file.originalname;
      const callId = `call_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      console.log(`[UPLOAD] Iniciando transcripción asíncrona: ${originalName} (ID: ${callId})`);

      audioBuffers.set(callId, file.buffer);

      const processingCallStub = {
        id: callId,
        contact_id: null,
        status: 'pending_contact',
        metadata: {
          fileName: originalName,
          url: `/api/audio/${callId}`,
          size: file.size,
          duration: 0,
          uploadedAt: new Date().toISOString(),
          uploadedBy: "auditor_sales_prod",
          status: "pending_contact",
        },
        score: { global: 0, greeting: 0, needDiscovery: 0, objectionHandling: 0, closingSkills: 0, empathy: 0 },
        analysis: {
          summary: "Procesando transcripción y auditoría cognitiva...",
          strengths: [], weaknesses: [], nextSteps: [],
          customerMood: "neutral",
          salesOutcome: "interesado_seguimiento",
        },
        transcription: [],
      };
      localCallsMemory.unshift(processingCallStub);

      const apiKey = process.env.ASSEMBLYAI_API_KEY;
      if (!apiKey) throw new Error("ASSEMBLYAI_API_KEY not configured");

      const client = new AssemblyAI({ apiKey });
      const uploadUrl = await client.files.upload(file.buffer);
      const transcript = await client.transcripts.submit({
        audio: uploadUrl,
        speaker_labels: true,
        language_code: "es",
      });

      pendingTranscripts.set(callId, {
        transcriptId: transcript.id,
        audioBuffer: file.buffer,
        fileName: originalName,
        callId,
        timestamp: Date.now(),
      });

      console.log(`[UPLOAD] Transcripción asíncrona iniciada: callId=${callId}, transcriptId=${transcript.id}`);
      return res.json({ status: "processing", callId, transcriptId: transcript.id });
    } catch (error: any) {
      console.error("[UPLOAD] Error:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // POST /api/process-blob — Process audio from Vercel Blob URL (async)
  app.post("/api/process-blob", async (req, res) => {
    const { blobUrl, fileName } = req.body;
    if (!blobUrl) return res.status(400).json({ error: "blobUrl is required" });

    const callId = `call_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    try {
      const resp = await axios.get(blobUrl, { responseType: "arraybuffer", timeout: 30000 });
      const audioBuffer = Buffer.from(resp.data);
      const originalName = fileName || "audio.mp3";

      audioBuffers.set(callId, audioBuffer);

      const processingCallStub = {
        id: callId,
        contact_id: null,
        status: 'pending_contact',
        metadata: {
          fileName: originalName,
          url: `/api/audio/${callId}`,
          blobUrl,
          size: audioBuffer.length,
          duration: 0,
          uploadedAt: new Date().toISOString(),
          uploadedBy: "auditor_sales_prod",
          status: "pending_contact",
        },
        score: { global: 0, greeting: 0, needDiscovery: 0, objectionHandling: 0, closingSkills: 0, empathy: 0 },
        analysis: {
          summary: "Procesando transcripción y auditoría cognitiva...",
          strengths: [], weaknesses: [], nextSteps: [],
          customerMood: "neutral",
          salesOutcome: "interesado_seguimiento",
        },
        transcription: [],
      };
      localCallsMemory.unshift(processingCallStub);

      const apiKey = process.env.ASSEMBLYAI_API_KEY;
      if (!apiKey) throw new Error("ASSEMBLYAI_API_KEY not configured");
      const client = new AssemblyAI({ apiKey });
      const uploadUrl = await client.files.upload(audioBuffer);
      const transcript = await client.transcripts.submit({
        audio: uploadUrl,
        speaker_labels: true,
        language_code: "es",
      });

      pendingTranscripts.set(callId, {
        transcriptId: transcript.id,
        audioBuffer,
        fileName: originalName,
        callId,
        timestamp: Date.now(),
      });

      console.log(`[BLOB] Transcripción asíncrona iniciada: callId=${callId}, transcriptId=${transcript.id}`);
      return res.json({ status: "processing", callId, transcriptId: transcript.id });
    } catch (err: any) {
      console.error("[BLOB_ERROR]", err.message);
      return res.status(500).json({ error: err.message });
    }
  });
}
