import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, model } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });
  }

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model || OPENROUTER_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://auditor-olive.vercel.app',
          'Content-Type': 'application/json',
        },
        timeout: 300000,
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: 'Empty response from OpenRouter' });
    }

    return res.status(200).json(JSON.parse(content));
  } catch (error: any) {
    console.error('[OLLAMA_PROXY] OpenRouter error:', error.response?.data?.error?.message || error.message);
    return res.status(500).json({
      error: `OpenRouter error: ${error.response?.data?.error?.message || error.message}`,
    });
  }
}
