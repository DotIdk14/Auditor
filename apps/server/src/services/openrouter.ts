import axios from "axios";
import {
  DEEPSEEK_API_KEY,
  DEEPSEEK_MODEL,
} from "../config.js";

/**
 * Llama a DeepSeek (OpenAI-compatible API) para análisis de auditoría.
 * Siempre fuerza respuesta JSON.
 */
export async function callOpenRouter(prompt: string, timeout = 60000): Promise<any> {
  if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY not configured");

  const model = DEEPSEEK_MODEL || "deepseek-chat";
  const jsonInstruction = "\n\nResponde SOLO con un objeto JSON válido. No incluyas markdown, bloques de código, ni texto adicional fuera del JSON.";

  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model,
        messages: [{ role: "user", content: prompt + jsonInstruction }],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 8192,
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout,
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from DeepSeek");

    const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();
    return JSON.parse(cleaned);
  } catch (err: any) {
    const detail = err.response?.data?.error?.message || err.message;
    console.error("[DEEPSEEK] Error:", detail);
    throw new Error(`DeepSeek: ${detail}`);
  }
}
