import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, model, format, stream = false, options } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const ollamaModel = model || process.env.OLLAMA_MODEL || 'hermes3';

  try {
    const response = await axios.post(
      `${ollamaUrl}/api/generate`,
      {
        model: ollamaModel,
        prompt,
        format,
        stream,
        options,
      },
      { timeout: 60000 }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Ollama API error:', error.message);
    return res.status(500).json({
      error: `Ollama error: ${error.response?.data?.error || error.message}`,
    });
  }
}