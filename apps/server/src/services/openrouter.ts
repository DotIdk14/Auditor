import axios from "axios";
import {
  GEMINI_API_KEY,
  GEMINI_MODEL,
} from "../config.js";

/**
 * Llama a Google Gemini API para análisis de auditoría.
 * Usa respuesta en formato JSON.
 */
export async function callOpenRouter(prompt: string, timeout = 120000): Promise<any> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const model = GEMINI_MODEL || "gemini-2.0-flash";
  const jsonInstruction = "\n\nResponde SOLO con un objeto JSON válido. No incluyas markdown, bloques de código, ni texto adicional fuera del JSON.";

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [{ text: prompt + jsonInstruction }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          topP: 0.95,
        },
      },
      { timeout }
    );

    const candidate = response.data?.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text;

    if (!content) {
      const blockReason = candidate?.finishReason || "unknown";
      const blockMsg = candidate?.safetyRatings
        ?.filter((r: any) => r.probability !== "NEGLIGIBLE")
        ?.map((r: any) => `${r.category}: ${r.probability}`)
        ?.join(", ") || "";
      throw new Error(`Gemini: respuesta vacía (finishReason: ${blockReason}${blockMsg ? ` - ${blockMsg}` : ""})`);
    }

    // Intentar extraer JSON del contenido
    const cleaned = content
      .replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1")
      .replace(/^[^{]*/, "")  // quitar texto antes del primer {
      .replace(/[^}]*$/, "")  // quitar texto después del último }
      .trim();

    return JSON.parse(cleaned);
  } catch (err: any) {
    // Si es error de parseo JSON, mostrar el contenido que falló
    if (err instanceof SyntaxError) {
      console.error("[GEMINI] Error parseando JSON. Respuesta raw:", err.message);
      throw new Error(`Gemini: respuesta no es JSON válido`);
    }
    const detail = err.response?.data?.error?.message || err.message;
    console.error("[GEMINI] Error:", detail);
    throw new Error(`Gemini: ${detail}`);
  }
}
