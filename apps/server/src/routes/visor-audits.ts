import type { Express } from "express";
import { insforge } from "../services/insforge.js";
import { authenticateToken, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { localCallsMemory } from "../config.js";

/**
 * Transform a local memory call record into AuditFullResponse format.
 * Reused for both localCallsMemory lookups and Supabase queries.
 */
function toAuditFullResponse(audit: any): any {
  const meta = typeof audit.metadata === "string" ? JSON.parse(audit.metadata) : (audit.metadata || {});
  const analysis = typeof audit.analysis === "string" ? JSON.parse(audit.analysis) : (audit.analysis || {});
  const transcription = typeof audit.transcription === "string" ? JSON.parse(audit.transcription) : (audit.transcription || []);

  const contactName = audit.contactName || meta?.contactName || "Sin nombre";
  const status = audit.status || meta?.status || "por_auditar";

  return {
    call: {
      id: audit.id,
      clientId: audit.contact_id || audit.clientId || "unknown",
      title: `Llamada — ${contactName}`,
      rawTitle: meta?.fileName || "unknown.wav",
      shortName: contactName,
      agent: analysis?.agentName || meta?.agentName || "Sin asignar",
      category: meta?.category || "CALIDAD",
      status,
      score: typeof audit.score === "object" ? audit.score?.global ?? null : audit.score ?? null,
      date: audit.created_at || audit.date,
      avatar: contactName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "??",
    },
    audit: {
      callId: audit.id,
      clientId: audit.contact_id || audit.clientId || "unknown",
      fileName: meta?.fileName || "unknown.wav",
      trackerId: `call_${Date.now()}`,
      score: typeof audit.score === "object" ? audit.score?.global || 0 : audit.score || 0,
      agentName: analysis?.agentName || meta?.agentName || "Sin asignar",
      date: audit.created_at ? new Date(audit.created_at).toLocaleDateString("es-ES") : "—",
      category: meta?.category || "CALIDAD",
      description: analysis?.summary || "Sin descripción",
      durationSec: meta?.duration || meta?.durationSec || 0,
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
    audioUrl: meta?.audioUrl || (meta?.url?.startsWith("/api") ? undefined : meta?.url) || null,
  };
}

export default function (app: Express): void {
  // GET /api/visor/audits/:callId/full - Returns the complete audit data for the AuditorView
  app.get("/api/visor/audits/:callId/full", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const { callId } = req.params;

      // ── 1. Check localCallsMemory FIRST (covers uploaded calls not yet in Supabase) ──
      const localCall = localCallsMemory.find((c: any) => c.id === callId);
      if (localCall) {
        return res.json(toAuditFullResponse(localCall));
      }

      // ── 2. Query DB with LEFT JOIN (contacts may be null) ──
      const { data: audit, error } = await insforge.database
        .from("auditorias")
        .select(`
          id, contact_id, score, metadata, analysis, transcription, created_at,
          contacts(id, full_name, assigned_to)
        `)
        .eq("id", callId)
        .maybeSingle();

      if (error) {
        console.error("[VISOR_AUDITS] Supabase error:", error.message);
        return res.status(500).json({ error: error.message });
      }

      if (!audit) {
        return res.status(404).json({ error: "Auditoría no encontrada" });
      }

      // Attach contact name for the transformer (cast to any for flexibility)
      const auditAny = audit as any;
      const contactRow = Array.isArray(auditAny.contacts) ? auditAny.contacts[0] : auditAny.contacts;
      const contact = contactRow as { id?: string; full_name?: string; assigned_to?: string } | null;
      auditAny.contactName = contact?.full_name || "Sin nombre";
      if (contact?.id) auditAny.contact_id = auditAny.contact_id || contact.id;
      if (!auditAny.metadata) auditAny.metadata = {};
      if (typeof auditAny.metadata === "string") auditAny.metadata = JSON.parse(auditAny.metadata);

      return res.json(toAuditFullResponse(auditAny));
    } catch (err: any) {
      console.error("[VISOR_AUDITS] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
