const { parentPort } = require('worker_threads');
const fs = require('fs');

parentPort.on('message', async (msg) => {
  try {
    const mod = require('@napi-rs/whisper');
    const modelBuf = fs.readFileSync(msg.modelPath);
    const model = new mod.Whisper(modelBuf);
    const audioData = await mod.decodeAudioAsync(Buffer.from(msg.audioBuffer), msg.fileName);
    const params = new mod.WhisperFullParams(mod.WhisperSamplingStrategy.Greedy);
    params.language = "es";
    params.printProgress = false;
    params.printRealtime = false;
    params.printSpecial = false;
    params.printTimestamps = false;
    params.noTimestamps = false;
    params.singleSegment = false;
    params.durationMs = 0;
    params.nThreads = 4;
    const output = model.full(params, audioData);
    const segments = (output && Array.isArray(output))
      ? output.map(seg => ({ t0: seg.t0, t1: seg.t1, text: seg.text }))
      : [];
    parentPort.postMessage({ segments });
  } catch (err) {
    parentPort.postMessage({ error: err.message });
  }
});
