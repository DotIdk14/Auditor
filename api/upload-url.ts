import type { VercelRequest, VercelResponse } from '@vercel/node';
import { issueSignedToken, presignUrl } from '@vercel/blob';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ error: 'filename is required' });
  }

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN!;
    const uniquePath = `audio/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${filename}`;

    const signedToken = await issueSignedToken({
      token,
      pathname: uniquePath,
      operations: ['put'],
      maximumSizeInBytes: 50 * 1024 * 1024,
      allowedContentTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg'],
    });

    const { presignedUrl } = await presignUrl(signedToken, {
      operation: 'put',
      pathname: uniquePath,
      access: 'public',
    });

    return res.status(200).json({ presignedUrl });
  } catch (error: any) {
    console.error('[UPLOAD_URL] Error:', error.message);
    return res.status(500).json({ error: `Failed to generate upload URL: ${error.message}` });
  }
}
