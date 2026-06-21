import axios from "axios";
import {
  OPENROUTER_MODEL,
  OPENROUTER_API_KEY,
  DEEPSEEK_API_KEY,
  DEEPSEEK_MODEL,
  AI_PROVIDER,
} from "../config.js";

export async function callOpenRouter(prompt: string, timeout = 60000): Promise<any> {
  const jsonInstruction = "\n\nResponde SOLO con un objeto JSON válido. No incluyas markdown, bloques de código, ni texto adicional fuera del JSON.";

  // ── DeepSeek (OpenAI-compatible API) ──
  if (AI_PROVIDER === "deepseek") {
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY not configured");
    try {
      const response = await axios.post(
        "https://api.deepseek.com/v1/chat/completions",
        {
          model: DEEPSEEK_MODEL,
          messages: [{ role: "user", content: prompt + jsonInstruction }],
          response_format: { type: "json_object" },
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

  // ── OpenRouter (default) ──
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: prompt + jsonInstruction }],
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://auditor-olive.vercel.app",
          "Content-Type": "application/json",
        },
        timeout,
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenRouter");

    const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();
    return JSON.parse(cleaned);
  } catch (err: any) {
    const detail = err.response?.data?.error?.message || err.message;
    console.error("[OPENROUTER] Error:", detail);
    throw new Error(`OpenRouter: ${detail}`);
  }
}
