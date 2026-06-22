import type { Express } from "express";
import { AssemblyAI } from "assemblyai";
import {
  supabase,
  supabaseAdmin,
  localCallsMemory,
  pendingTranscripts,
} from "../config.js";
import { authenticateToken, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { deleteCallFromSupabase } from "../services/supabase.js";

/**
 * POST /api/admin/recover-transcript/:callId
 *
 * Tries to recover a "zombie" call — one that was uploaded to AssemblyAI
 * but whose transcriptId was lost (e.g. serverless cold start before the fix).
 *
 * Strategy:
 * 1. Fetch the call from Supabase
 * 2. If already complete, return it
 * 3. If transcriptId is stored, resume from there
 * 4. If no transcriptId, list ALL recent transcripts from AssemblyAI
 *    and try to match by creation time proximity (the callId contains
 *    a Date.now() timestamp: call_{timestamp}_{random})
 * 5. If a match is found, reconstruct the pending entry so the
 *    normal polling flow (/api/transcript/:callId) can complete it
 * 6. If no match, return a useful error
 */
export default function (app: Express): void {
  // ── List recent AssemblyAI transcripts (admin) ────────────────────
  app.get(
    "/api/admin/assemblyai-transcripts",
    authenticateToken,
    injectScope,
    async (req: AuthenticatedRequest, res) => {
      try {
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) {
          return res.status(500).json({ error: "ASSEMBLYAI_API_KEY no configurada" });
        }

        const limit = parseInt(req.query.limit as string) || 50;
        const status = (req.query.status as string) || undefined;

        const client = new AssemblyAI({ apiKey });
        const params: Record<string, any> = { limit: Math.min(limit, 200) };
        if (status) params.status = status;

        const result = await client.transcripts.list(params as any);

        const transcripts = (result.transcripts || []).map((t: any) => ({
          id: t.id,
          status: t.status,
          created: t.created,
          completed: t.completed,
          audio_duration: t.audio_duration,
          audio_url: t.audio_url,
          error: t.error || null,
        }));

        return res.json({
          count: transcripts.length,
          transcripts,
        });
      } catch (err: any) {
        console.error("[RECOVERY] Error listing transcripts:", err.message);
        return res.status(500).json({
          error: `Error al listar transcripts de AssemblyAI: ${err.message}`,
        });
      }
    },
  );

  // ── Try to recover a specific zombie call ─────────────────────────
  app.post(
    "/api/admin/recover-transcript/:callId",
    authenticateToken,
    injectScope,
    async (req: AuthenticatedRequest, res) => {
      const { callId } = req.params;

      try {
        // ── 1. Fetch from Supabase ────────────────────────────────
        const client = supabaseAdmin || supabase;
        if (!client) {
          return res.status(503).json({
            error: "Supabase no está configurado. Esta operación requiere base de datos.",
          });
        }

        const { data: dbCall, error: dbErr } = await client
          .from("auditorias")
          .select("*")
          .eq("id", callId)
          .maybeSingle();

        if (dbErr) {
          return res.status(500).json({ error: `Error consultando Supabase: ${dbErr.message}` });
        }

        if (!dbCall) {
          return res.status(404).json({
            error: "Llamada no encontrada en Supabase.",
            detail: "La llamada no existe en la base de datos. Puede que nunca se haya persistido.",
            callId,
          });
        }

        const meta = dbCall.metadata || {};

        // ── 1a. Already complete? ──────────────────────────────
        if (meta.analysisComplete) {
          const restoredCall = {
            id: dbCall.id,
            contact_id: dbCall.contact_id || null,
            status: meta.status || "por_auditar",
            metadata: meta,
            score: dbCall.score || { global: 0 },
            analysis: dbCall.analysis || {},
            transcription: dbCall.transcription || [],
          };
          localCallsMemory.unshift(restoredCall);
          return res.json({
            success: true,
            status: "already_complete",
            message: "La llamada ya está completamente procesada.",
            call: restoredCall,
          });
        }

        // ── 1b. transcriptId is stored but processing stalled ──
        const storedTranscriptId = meta.transcriptId || meta.transcript_id;
        if (storedTranscriptId) {
          // Reconstruct the pending entry so /api/transcript/:callId can pick it up
          const fileName = meta.fileName || "audio_recuperado.mp3";
          pendingTranscripts.set(callId, {
            transcriptId: storedTranscriptId,
            audioBuffer: Buffer.alloc(0), // will be re-fetched from Blob URL
            fileName,
            callId,
            timestamp: Date.now(),
          });

          console.log(`[RECOVERY] Reconstructed pending entry for ${callId} (transcriptId: ${storedTranscriptId})`);

          // The caller should now poll /api/transcript/:callId to get the result
          return res.json({
            success: true,
            status: "reconstructing",
            message:
              "Se reconstruyó la entrada pendiente. Ahora puedes consultar GET /api/transcript/:callId para obtener el resultado.",
            transcriptId: storedTranscriptId,
            callId,
            pollingEndpoint: `/api/transcript/${callId}`,
          });
        }

        // ── 2. No transcriptId — try to find it on AssemblyAI ──────
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) {
          return res.status(500).json({
            error: "ASSEMBLYAI_API_KEY no configurada",
            detail:
              "No se puede buscar el transcript en AssemblyAI sin la API key.",
          });
        }

        // Parse timestamp from callId: call_{timestamp}_{random}
        const match = callId.match(/^call_(\d+)_/);
        if (!match) {
          return res.status(400).json({
            error: "Formato de callId inválido.",
            detail:
              "Se esperaba formato call_{timestamp}_{random} para poder estimar la fecha de creación.",
          });
        }

        const callTimestamp = parseInt(match[1], 10);
        const callDate = new Date(callTimestamp);
        console.log(
          `[RECOVERY] Call ${callId} created at ${callDate.toISOString()}`,
        );

        // ── 3. Search AssemblyAI transcripts around that time ──────
        const aai = new AssemblyAI({ apiKey });

        // List recent transcripts (up to 200)
        const listResult = await aai.transcripts.list({ limit: 200 } as any);
        const allTranscripts: any[] = listResult.transcripts || [];

        if (allTranscripts.length === 0) {
          return res.status(404).json({
            error: "No se encontraron transcripciones en AssemblyAI.",
            detail:
              "No hay transcripciones recientes en tu cuenta de AssemblyAI. El audio probablemente nunca se subió correctamente.",
            callId,
          });
        }

        // Find transcripts close to our call timestamp (±5 minutes)
        const fiveMinutes = 5 * 60 * 1000;
        const candidates = allTranscripts.filter((t: any) => {
          const tCreated = new Date(t.created).getTime();
          return Math.abs(tCreated - callTimestamp) < fiveMinutes;
        });

        if (candidates.length === 0) {
          // If no close match, return all recent ones so the user can try manually
          return res.status(404).json({
            error: "No se encontró un transcript coincidente en AssemblyAI.",
            detail: `Se buscaron transcripciones creadas cerca de ${callDate.toISOString()} (±5 min). No se encontraron coincidencias.`,
            callId,
            callCreatedAt: callDate.toISOString(),
            recentTranscripts: allTranscripts.slice(0, 20).map((t: any) => ({
              id: t.id,
              status: t.status,
              created: t.created,
              duration: t.audio_duration,
              error: t.error || null,
            })),
            hint: "Si ves un transcript que coincida, re-ejecuta este endpoint con el header X-Transcript-Id: <id>",
          });
        }

        // ── 4. Use the closest match ─────────────────────────────
        // Sort by time proximity and take the closest
        candidates.sort(
          (a: any, b: any) =>
            Math.abs(new Date(a.created).getTime() - callTimestamp) -
            Math.abs(new Date(b.created).getTime() - callTimestamp),
        );
        const bestMatch = candidates[0];

        if (bestMatch.status === "error") {
          return res.status(502).json({
            error: "El transcript encontrado en AssemblyAI tiene estado 'error'.",
            detail: bestMatch.error || "Error desconocido en AssemblyAI.",
            transcriptId: bestMatch.id,
          });
        }

        // Reconstruct pending entry
        const fileName = meta.fileName || `recuperado_${bestMatch.id}.mp3`;
        pendingTranscripts.set(callId, {
          transcriptId: bestMatch.id,
          audioBuffer: Buffer.alloc(0),
          fileName,
          callId,
          timestamp: Date.now(),
        });

        // Save transcriptId to Supabase for future resilience
        await client
          .from("auditorias")
          .update({
            metadata: {
              ...meta,
              transcriptId: bestMatch.id,
              recoveredAt: new Date().toISOString(),
            },
          })
          .eq("id", callId);

        console.log(
          `[RECOVERY] Match found! Transcript ${bestMatch.id} matched to ${callId}`,
        );

        return res.json({
          success: true,
          status: "recovered",
          message: `Se encontró el transcript ${bestMatch.id} en AssemblyAI. Ahora consulta GET /api/transcript/${callId} para obtener el resultado.`,
          transcriptId: bestMatch.id,
          transcriptStatus: bestMatch.status,
          callId,
          pollingEndpoint: `/api/transcript/${callId}`,
        });
      } catch (err: any) {
        console.error("[RECOVERY] Error:", err.message);
        return res.status(500).json({
          error: `Error en recuperación: ${err.message}`,
        });
      }
    },
  );

  // ── Force-complete recovery with a known transcript ID ────────────
  app.post(
    "/api/admin/force-recover/:callId",
    authenticateToken,
    injectScope,
    async (req: AuthenticatedRequest, res) => {
      const { callId } = req.params;
      const { transcriptId } = req.body;

      if (!transcriptId) {
        return res.status(400).json({
          error: "Se requiere un transcriptId en el body.",
          example: { transcriptId: "abc123" },
        });
      }

      try {
        const client = supabaseAdmin || supabase;
        if (!client) {
          return res.status(503).json({ error: "Supabase no está configurado." });
        }

        // Verify the transcript exists on AssemblyAI
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) {
          return res.status(500).json({ error: "ASSEMBLYAI_API_KEY no configurada" });
        }

        const aai = new AssemblyAI({ apiKey });
        let transcript;
        try {
          transcript = await aai.transcripts.get(transcriptId);
        } catch {
          return res.status(404).json({
            error: `El transcriptId ${transcriptId} no existe en AssemblyAI o no es accesible.`,
          });
        }

        // Store transcriptId in Supabase
        const { data: dbCall } = await client
          .from("auditorias")
          .select("metadata")
          .eq("id", callId)
          .maybeSingle();

        const existingMeta = dbCall?.metadata || {};
        await client
          .from("auditorias")
          .update({
            metadata: {
              ...existingMeta,
              transcriptId,
              forcedRecoveryAt: new Date().toISOString(),
            },
          })
          .eq("id", callId);

        // Reconstruct pending
        pendingTranscripts.set(callId, {
          transcriptId,
          audioBuffer: Buffer.alloc(0),
          fileName: existingMeta.fileName || `forced_${transcriptId}.mp3`,
          callId,
          timestamp: Date.now(),
        });

        return res.json({
          success: true,
          status: "recovered",
          message: `Transcript ${transcriptId} forzado para ${callId}. Consulta GET /api/transcript/${callId}`,
          transcriptStatus: transcript.status,
          callId,
          pollingEndpoint: `/api/transcript/${callId}`,
        });
      } catch (err: any) {
        console.error("[FORCE-RECOVER] Error:", err.message);
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // ── List zombie calls (calls in Supabase without analysisComplete) ─
  app.get(
    "/api/admin/zombie-calls",
    authenticateToken,
    injectScope,
    async (req: AuthenticatedRequest, res) => {
      try {
        const client = supabaseAdmin || supabase;
        if (!client) {
          return res.status(503).json({ error: "Supabase no está configurado." });
        }

        const { data, error } = await client
          .from("auditorias")
          .select("id, created_at, metadata->fileName, metadata->status, metadata->analysisComplete, metadata->transcriptId")
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          return res.status(500).json({ error: `Error consultando Supabase: ${error.message}` });
        }

        const zombies = (data || []).filter((row: any) => {
          const meta = row.metadata || {};
          return !meta.analysisComplete && meta.transcriptId;
        });

        const incomplete = (data || []).filter((row: any) => {
          const meta = row.metadata || {};
          return !meta.analysisComplete && !meta.transcriptId;
        });

        return res.json({
          total: (data || []).length,
          zombies: zombies.length,
          incomplete: incomplete.length,
          zombieCalls: zombies.map((z: any) => ({
            id: z.id,
            created: z.created_at,
            fileName: z.metadata?.fileName || "unknown",
            transcriptId: z.metadata?.transcriptId || null,
          })),
          incompleteCalls: incomplete.map((z: any) => ({
            id: z.id,
            created: z.created_at,
            fileName: z.metadata?.fileName || "unknown",
          })),
        });
      } catch (err: any) {
        console.error("[ZOMBIE-LIST] Error:", err.message);
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // ── Delete a zombie call from Supabase ────────────────────────────
  app.delete(
    "/api/admin/zombie-call/:callId",
    authenticateToken,
    injectScope,
    async (req: AuthenticatedRequest, res) => {
      const { callId } = req.params;

      try {
        // Delete from Supabase
        await deleteCallFromSupabase(callId);

        // Also clean up local memory
        const idx = localCallsMemory.findIndex((c: any) => c.id === callId);
        if (idx !== -1) {
          localCallsMemory.splice(idx, 1);
        }
        pendingTranscripts.delete(callId);

        return res.json({
          success: true,
          message: `Call zombie ${callId} eliminado de Supabase y memoria local.`,
        });
      } catch (err: any) {
        console.error("[ZOMBIE-DELETE] Error:", err.message);
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // ── Clean ALL zombie calls (bulk) ─────────────────────────────────
  app.delete(
    "/api/admin/cleanup-zombies",
    authenticateToken,
    injectScope,
    async (req: AuthenticatedRequest, res) => {
      try {
        const client = supabaseAdmin || supabase;
        if (!client) {
          return res.status(503).json({ error: "Supabase no está configurado." });
        }

        // Find all zombie calls (no analysisComplete)
        const { data, error } = await client
          .from("auditorias")
          .select("id, metadata")
          .limit(100);

        if (error) {
          return res.status(500).json({ error: `Error consultando Supabase: ${error.message}` });
        }

        const zombieIds = (data || [])
          .filter((row: any) => {
            const meta = row.metadata || {};
            return !meta.analysisComplete;
          })
          .map((row: any) => row.id);

        if (zombieIds.length === 0) {
          return res.json({ success: true, message: "No hay calls zombies para limpiar.", deleted: 0 });
        }

        // Delete in batches of 10
        let deleted = 0;
        for (let i = 0; i < zombieIds.length; i += 10) {
          const batch = zombieIds.slice(i, i + 10);
          const { error: delErr } = await client
            .from("auditorias")
            .delete()
            .in("id", batch);
          if (!delErr) deleted += batch.length;
        }

        // Clean local memory
        for (const id of zombieIds) {
          const idx = localCallsMemory.findIndex((c: any) => c.id === id);
          if (idx !== -1) localCallsMemory.splice(idx, 1);
          pendingTranscripts.delete(id);
        }

        return res.json({
          success: true,
          message: `Se eliminaron ${deleted} calls zombies de Supabase.`,
          deleted,
          total: zombieIds.length,
        });
      } catch (err: any) {
        console.error("[CLEANUP-ZOMBIES] Error:", err.message);
        return res.status(500).json({ error: err.message });
      }
    },
  );
}
