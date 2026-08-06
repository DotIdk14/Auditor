import type { Express } from "express";
import axios from "axios";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { GEMINI_API_KEY, GEMINI_MODEL } from "../config.js";
import {
  getCotizadorSettings,
  upsertCotizadorSettings,
} from "../services/cotizadorService.js";

const SYSTEM_PROMPT =
  "Eres un amiguito experto que ayuda a los vendedores de UTEL. Responde cortito y de forma muy amable.";

export default function (app: Express): void {
  // GET /api/cotizador/settings — Config global de la calculadora (precios, matriz, colores)
  app.get("/api/cotizador/settings", authenticateToken, async (_req: AuthenticatedRequest, res) => {
    try {
      const settings = await getCotizadorSettings();
      return res.json({ success: true, settings });
    } catch (err: any) {
      console.error("[COTIZADOR] Error getting settings:", err.message);
      return res.status(500).json({ error: "Error al obtener la configuración del cotizador" });
    }
  });

  // POST /api/cotizador/settings — Solo admin. Upsert de cualquier campo (merge sobre lo existente)
  app.post("/api/cotizador/settings", authenticateToken, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const body = req.body || {};
      const partial: Partial<Record<string, unknown>> = {};
      if (body.domiciliacion !== undefined) partial.domiciliacion = Number(body.domiciliacion) || 5;
      if (body.tituloCosto0 !== undefined) partial.tituloCosto0 = Boolean(body.tituloCosto0);
      if (body.platziPreview !== undefined) partial.platziPreview = Boolean(body.platziPreview);
      if (body.primaryColor !== undefined) partial.primaryColor = String(body.primaryColor);
      if (body.firmaCopiar !== undefined) partial.firmaCopiar = Boolean(body.firmaCopiar);
      if (body.bloquearInspeccion !== undefined) partial.bloquearInspeccion = Boolean(body.bloquearInspeccion);
      if (body.precios !== undefined) partial.precios = body.precios;
      if (body.prog !== undefined) partial.prog = body.prog;
      if (body.accs !== undefined) partial.accs = body.accs;

      const settings = await upsertCotizadorSettings(partial as any);
      return res.json({ success: true, settings });
    } catch (err: any) {
      console.error("[COTIZADOR] Error saving settings:", err.message);
      return res.status(500).json({ error: "Error al guardar la configuración del cotizador" });
    }
  });

  // POST /api/cotizador/chat — Asistente Gemini (con fallback a OpenAI) para vendedores UTEL
  app.post("/api/cotizador/chat", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { message, history } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "¡Olvidaste escribir tu mensaje!" });
    }

    try {
      // 1. Gemini (REST v1beta, mismo patrón que el resto del servidor)
      if (GEMINI_API_KEY) {
        const model = GEMINI_MODEL || "gemini-2.0-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

        const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
        if (Array.isArray(history)) {
          for (const h of history) {
            const role = h?.role === "user" ? "user" : "model";
            const text = Array.isArray(h?.parts) && typeof h.parts[0]?.text === "string"
              ? h.parts[0].text
              : "";
            if (text) contents.push({ role, parts: [{ text }] });
          }
        }
        contents.push({ role: "user", parts: [{ text: message }] });

        const response = await axios.post(
          url,
          {
            contents,
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: { temperature: 0.4 },
          },
          { timeout: 30000 },
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return res.json({ text });
        console.warn("[COTIZADOR][CHAT] Gemini respondió vacío:", response.data?.candidates?.[0]?.finishReason);
      }

      // 2. Fallback: OpenAI (REST, sin SDK)
      if (process.env.OPENAI_API_KEY) {
        const messages: Array<{ role: string; content: string }> = [
          { role: "system", content: SYSTEM_PROMPT },
        ];
        if (Array.isArray(history)) {
          for (const h of history) {
            const role = h?.role === "user" ? "user" : "assistant";
            const text = Array.isArray(h?.parts) && typeof h.parts[0]?.text === "string"
              ? h.parts[0].text
              : "";
            if (text) messages.push({ role, content: text });
          }
        }
        messages.push({ role: "user", content: message });

        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          { model: "gpt-4o-mini", messages, stream: false },
          { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, timeout: 30000 },
        );
        const text = response.data?.choices?.[0]?.message?.content;
        if (text) return res.json({ text });
      }

      return res.status(500).json({ error: "El robot tuvo un problema al pensar (ningún modelo disponible)." });
    } catch (err: any) {
      console.error("[COTIZADOR][CHAT] Error:", err.message);
      return res.status(500).json({ error: "El robot tuvo un problema al pensar. Intenta de nuevo." });
    }
  });
}
