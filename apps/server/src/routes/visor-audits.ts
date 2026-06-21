import type { Express } from "express";
import { authenticateToken, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { supabase } from "../config.js";

export default function (app: Express): void {
  // GET /api/visor/audits/:callId/full - Returns the complete audit data for the AuditorView
  app.get("/api/visor/audits/:callId/full", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const { callId } = req.params;

      if (!supabase) {
        return res.status(503).json({ error: "Base de datos no disponible" });
      }

      // Get the audit record
      const { data: audit, error } = await supabase
        .from("auditorias")
        .select(`
          id, contact_id, score, status, metadata, analysis, transcription, created_at,
          contacts!inner(id, full_name, assigned_to)
        `)
        .eq("id", callId)
        .single();

      if (error || !audit) {
        return res.status(404).json({ error: "Auditoría no encontrada" });
      }

      const contactRow = Array.isArray(audit.contacts) ? audit.contacts[0] || {} : audit.contacts || {};
      const contact = contactRow as { id?: string; full_name?: string; assigned_to?: string };
      const meta = typeof audit.metadata === "string" ? JSON.parse(audit.metadata) : (audit.metadata || {});
      const analysis = typeof audit.analysis === "string" ? JSON.parse(audit.analysis) : (audit.analysis || {});
      const transcription = typeof audit.transcription === "string" ? JSON.parse(audit.transcription) : (audit.transcription || []);

      // Build the full response in Visor's expected format
      const response = {
        call: {
          id: audit.id,
          clientId: contact.id || audit.contact_id,
          title: `Llamada — ${contact.full_name || "Sin nombre"}`,
          rawTitle: meta?.fileName || "unknown.wav",
          shortName: contact.full_name || "Desconocido",
          agent: analysis?.agentName || meta?.agentName || "Sin asignar",
          category: meta?.category || "CALIDAD",
          status: audit.status || "por_auditar",
          score: audit.score,
          date: audit.created_at,
          avatar: (contact.full_name || "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
        },
        audit: {
          callId: audit.id,
          clientId: contact.id || audit.contact_id,
          fileName: meta?.fileName || "unknown.wav",
          trackerId: `call_${Date.now()}`,
          score: audit.score || 0,
          agentName: analysis?.agentName || meta?.agentName || "Sin asignar",
          date: new Date(audit.created_at).toLocaleDateString("es-ES"),
          category: meta?.category || "CALIDAD",
          description: analysis?.summary || "Sin descripción",
          durationSec: meta?.durationSec || 0,
          rubric: analysis?.rubric || analysis?.checklist || [],
          transcript: transcription?.utterances || transcription || [],
          summary: analysis?.summary || "",
          clientTemper: analysis?.emotionalAnalysis?.clientTemper || "Neutral",
          commercialOutcome: analysis?.commercialOutcome || "Seguimiento",
          coachingType: analysis?.coachingType || "ESTÁNDAR",
          justification: analysis?.justification || {},
          purchaseIntentPct: analysis?.purchaseIntentPct || 0,
          purchaseIntentLabel: analysis?.purchaseIntentLabel || "",
          clientSentimentScoreLabel: analysis?.emotionalAnalysis?.sentimentLabel || "",
          cognitivePath: analysis?.cognitivePath || "",
          transitionSummary: analysis?.transitionSummary || "",
          purchaseSignals: analysis?.purchaseSignals || [],
          objections: analysis?.objections || [],
          coaching: analysis?.coaching || { strengths: [], improvements: [], nextSteps: [] },
        },
        transcription: transcription?.utterances || transcription || [],
        rubric: analysis?.rubric || analysis?.checklist || [],
        coaching: analysis?.coaching || { strengths: [], improvements: [], nextSteps: [] },
        insights: {
          summary: analysis?.coachingType || "",
          clientPerception: {
            temper: analysis?.emotionalAnalysis?.clientTemper || "Neutral",
            commercialOutcome: analysis?.commercialOutcome || "Seguimiento",
            purchaseIntentPct: analysis?.purchaseIntentPct || 0,
            purchaseIntentLabel: analysis?.purchaseIntentLabel || "",
            sentimentLabel: analysis?.emotionalAnalysis?.sentimentLabel || "",
            cognitivePath: analysis?.cognitivePath || "",
            transitionSummary: analysis?.transitionSummary || "",
          },
          coaching: {
            type: analysis?.coachingType || "ESTÁNDAR",
            justification: analysis?.justification || {},
          },
          purchaseSignals: analysis?.purchaseSignals || [],
          objections: analysis?.objections || [],
        },
        annotations: [],
        audioUrl: meta?.audioUrl || null,
      };

      res.json(response);
    } catch (err: any) {
      console.error("[VISOR_AUDITS] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
