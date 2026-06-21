import axios from "axios";
import {
  OPENCODE_API_KEY,
  OPENCODE_MODEL,
  OPENCODE_BASE_URL,
} from "../config.js";

/**
 * Llama a OpenCode Go API (OpenAI-compatible) para análisis de auditoría.
 * Provee acceso a modelos como DeepSeek, Claude, Gemini, etc.
 */
export async function callOpenRouter(prompt: string, timeout = 120000): Promise<any> {
  if (!OPENCODE_API_KEY) throw new Error("OPENCODE_API_KEY not configured");

  const model = OPENCODE_MODEL || "deepseek-v4-flash";
  const baseUrl = OPENCODE_BASE_URL || "https://api.opencode.go/v1";
  const jsonInstruction = "\n\nResponde SOLO con un objeto JSON válido. No incluyas markdown, bloques de código, ni texto adicional fuera del JSON.";

  try {
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model,
        messages: [{ role: "user", content: prompt + jsonInstruction }],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 8192,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENCODE_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout,
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenCode Go");

    const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();
    return JSON.parse(cleaned);
  } catch (err: any) {
    const detail = err.response?.data?.error?.message || err.message;
    console.error("[OPENCODE] Error:", detail);
    if (err.response?.data) {
      console.error("[OPENCODE] Full response:", JSON.stringify(err.response.data).slice(0, 500));
    }
    throw new Error(`OpenCode Go: ${detail}`);
  }
}
