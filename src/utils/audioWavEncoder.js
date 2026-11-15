// src/utils/audioWavEncoder.js
// Fast browser-side audio converter that turns MediaRecorder WebM/Opus blobs into
// 16 kHz mono 16-bit PCM WAV so the server skips ffmpeg decoding & disk writes.

const DEFAULT_TARGET_SR = 16000;

function writeAsciiString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function encodeMonoPcm16Wav(samples, sampleRate) {
  const numSamples = samples.length;
  const dataBytes = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  writeAsciiString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeAsciiString(view, 8, 'WAVE');
  writeAsciiString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format = 1
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeAsciiString(view, 36, 'data');
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Downmix and resample any browser audio Blob into a 16 kHz mono WAV Blob.
 * Falls back cleanly to the original Blob if Web Audio APIs are unavailable.
 */
export async function convertBlobTo16kMonoWav(blob, targetSr = DEFAULT_TARGET_SR) {
  if (!(blob instanceof Blob) || blob.size <= 0) return blob;
  const typeLower = String(blob.type || '').toLowerCase();
  if (typeLower === 'audio/wav' || typeLower === 'audio/wave' || typeLower === 'audio/x-wav') {
    return blob;
  }
  if (typeof window === 'undefined') return blob;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!AudioCtx || !OfflineCtx) return blob;

  let decodeCtx = null;
  try {
    const arrayBuffer = await blob.arrayBuffer();
    decodeCtx = new AudioCtx();
    const decoded = await decodeCtx.decodeAudioData(arrayBuffer);
    if (!decoded || decoded.length <= 0 || decoded.duration <= 0) {
      return blob;
    }

    const frameCount = Math.max(1, Math.ceil(decoded.duration * targetSr));
    const offline = new OfflineCtx(1, frameCount, targetSr);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);

    const rendered = await offline.startRendering();
    const monoSamples = rendered.getChannelData(0);
    return encodeMonoPcm16Wav(monoSamples, targetSr);
  } catch (_) {
    return blob;
  } finally {
    if (decodeCtx && typeof decodeCtx.close === 'function') {
      try {
        await decodeCtx.close();
      } catch (_) {}
    }
  }
}
