import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AssemblyAI } from 'assemblyai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ASSEMBLYAI_API_KEY not configured' });
  }

  try {
    const { audioBase64, audioUrl, fileName = 'audio.mp3' } = req.body;

    let audioBuffer: Buffer;
    if (audioUrl) {
      const axios = (await import('axios')).default;
      const resp = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 30000 });
      audioBuffer = Buffer.from(resp.data);
    } else if (audioBase64) {
      audioBuffer = Buffer.from(audioBase64, 'base64');
    } else {
      return res.status(400).json({ error: 'audioBase64 or audioUrl is required' });
    }

    const client = new AssemblyAI({ apiKey });

    const uploadUrl = await client.files.upload(audioBuffer);

    const transcript = await client.transcripts.transcribe({
      audio: uploadUrl,
      speaker_labels: true,
      language_code: 'es',
      speech_models: ['universal-3-pro', 'universal-2'],
    });

    if (transcript.status === 'error') {
      return res.status(503).json({ error: transcript.error || 'AssemblyAI transcription failed' });
    }

    const segments = (transcript.utterances || []).map((utt: any) => ({
      start: utt.start / 1000,
      end: utt.end / 1000,
      text: (utt.text || '').trim(),
      speaker: utt.speaker || '',
    }));

    return res.status(200).json({
      segments,
      duration: transcript.audio_duration || 0,
      engine: 'assemblyai',
    });
  } catch (error: any) {
    console.error('[WHISPER-API] Error:', error.message);
    return res.status(500).json({ error: `Transcription failed: ${error.message}` });
  }
}
