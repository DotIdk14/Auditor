import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const backendUrl = process.env.APP_URL || 'http://localhost:3000';

  try {
    const { data } = await axios.post(
      `${backendUrl}/api/whisper`,
      req.body,
      { timeout: 55000, headers: { 'content-type': 'application/json' } }
    );

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[WHISPER-PROXY] Error:', error.message);
    return res.status(error.response?.status || 500).json(
      error.response?.data || { error: `Whisper proxy failed: ${error.message}` }
    );
  }
}
