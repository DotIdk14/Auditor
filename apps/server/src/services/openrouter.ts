import axios from "axios";
import {
  GEMINI_API_KEY,
  GEMINI_MODEL,
  AI_PROVIDER,
} from "../config.js";

export async function callOpenRouter(prompt: string, timeout = 60000): Promise<any> {
  const jsonInstruction = "\n\nResponde SOLO con un objeto JSON válido. No incluyas markdown, bloques de código, ni texto adicional fuera del JSON.";

  // ── Gemini (Google AI) ──
  if (AI_PROVIDER === "gemini" || !AI_PROVIDER || AI_PROVIDER === "openrouter") {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const model = GEMINI_MODEL || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const response = await axios.post(
        url,
        {
          contents: [
            {
              parts: [{ text: prompt + jsonInstruction }],
            },
          ],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.2,
            maxOutputTokens: 8192,
          },
        },
        { timeout }
      );

      const candidate = response.data?.candidates?.[0];
      const content = candidate?.content?.parts?.[0]?.text;

      if (!content) {
        // Try fallback: maybe the response was blocked
        const blockReason = candidate?.finishReason || "unknown";
        throw new Error(`Gemini: respuesta vacía (finishReason: ${blockReason})`);
      }

      const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();
      return JSON.parse(cleaned);
    } catch (err: any) {
      const detail = err.response?.data?.error?.message || err.message;
      const fullResponse = err.response?.data;
      console.error("[GEMINI] Error:", detail);
      if (fullResponse) console.error("[GEMINI] Full response:", JSON.stringify(fullResponse).slice(0, 500));
      throw new Error(`Gemini: ${detail}`);
    }
  }

  throw new Error(`AI_PROVIDER "${AI_PROVIDER}" no soportado. Usa "gemini".`);
}
