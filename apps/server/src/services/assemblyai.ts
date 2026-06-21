import { AssemblyAI } from "assemblyai";

export async function assemblyAITranscribe(
  audioBuffer: Buffer,
  fileName: string
): Promise<{ segments: any[]; duration: number }> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    console.warn("[AAI] ASSEMBLYAI_API_KEY no configurada");
    return { segments: [], duration: 0 };
  }

  try {
    const client = new AssemblyAI({ apiKey });

    console.log(`[AAI] Subiendo archivo ${fileName} (${(audioBuffer.length / 1024 / 1024).toFixed(1)} MB)...`);
    const uploadUrl = await client.files.upload(audioBuffer);
    console.log(`[AAI] Archivo subido: ${uploadUrl}`);

    console.log("[AAI] Enviando a transcripción con speaker_labels...");
    const transcript = await client.transcripts.transcribe({
      audio: uploadUrl,
      speaker_labels: true,
      language_code: "es",
    });

    if (transcript.status === "error") {
      throw new Error(transcript.error || "Error en transcripción AssemblyAI");
    }

    const duration = transcript.audio_duration || 0;
    let segments: any[] = [];

    if (transcript.utterances && transcript.utterances.length > 0) {
      segments = transcript.utterances.map((utt: any) => ({
        start: utt.start / 1000,
        end: utt.end / 1000,
        text: (utt.text || "").trim(),
        speaker: utt.speaker || "",
      }));
    } else if (transcript.text && transcript.text.trim()) {
      console.warn("[AAI] Sin utterances, usando texto completo como segmento único.");
      segments = [{
        start: 0,
        end: duration,
        text: transcript.text.trim(),
        speaker: "",
      }];
    } else {
      console.warn("[AAI] Transcripción vacía. Verifica que el audio contenga voz.");
      return { segments: [], duration };
    }

    console.log(`[AAI] Transcripción completada: ${segments.length} utterances, ${duration}s`);
    return { segments, duration };
  } catch (err: any) {
    const detail = err.response?.data?.error?.message || err.message;
    console.error("[AAI] Error en transcripción:", detail);
    throw new Error(`AssemblyAI: ${detail}`);
  }
}
