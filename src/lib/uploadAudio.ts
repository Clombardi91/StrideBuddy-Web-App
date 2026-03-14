import type { UploadResult } from './types';

/**
 * Upload a recorded audio Blob to the server.
 * Sends as multipart/form-data.
 */
export async function uploadRecordedAudio(params: {
  audioBlob: Blob;
  mimeType: string;
  sessionId: string;
  supporterName: string;
  durationSeconds: number;
  token: string;
}): Promise<UploadResult> {
  const formData = new FormData();
  const extension = getExtension(params.mimeType);

  formData.append('audio', params.audioBlob, `recording${extension}`);
  formData.append('sessionId', params.sessionId);
  formData.append('supporterName', params.supporterName);
  formData.append('sourceType', 'recorded');
  formData.append('duration', Math.round(params.durationSeconds).toString());
  formData.append('token', params.token);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(err.message ?? `Upload failed: ${res.status}`);
  }

  return res.json() as Promise<UploadResult>;
}

/**
 * Upload a TTS-generated audio (base64) to the server.
 * Sends as JSON.
 */
export async function uploadTTSAudio(params: {
  audioBase64: string;
  mimeType: string;
  sessionId: string;
  supporterName: string;
  textContent: string;
  voice: string;
  token: string;
}): Promise<UploadResult> {
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: params.audioBase64,
      mimeType: params.mimeType,
      sessionId: params.sessionId,
      supporterName: params.supporterName,
      sourceType: 'tts',
      textContent: params.textContent,
      voice: params.voice,
      token: params.token,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(err.message ?? `Upload failed: ${res.status}`);
  }

  return res.json() as Promise<UploadResult>;
}

/**
 * Generate TTS audio via OpenAI through our API route.
 */
export async function generateTTS(params: {
  text: string;
  voice: string;
  speed?: number;
}): Promise<{
  audioBase64: string;
  mimeType: string;
  estimatedDurationSeconds: number;
}> {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: params.text,
      voice: params.voice,
      speed: params.speed ?? 1.0,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'TTS generation failed' }));
    throw new Error(err.error ?? `TTS failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Get the best supported MIME type for MediaRecorder in this browser.
 */
export function getBestAudioMimeType(): string {
  if (typeof window === 'undefined' || !window.MediaRecorder) {
    return 'audio/webm';
  }

  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];

  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }

  return 'audio/webm';
}

/**
 * Convert a base64 string to a data URL for audio playback.
 */
export function base64ToAudioUrl(base64: string, mimeType: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'audio/webm': '.webm',
    'audio/webm;codecs=opus': '.webm',
    'audio/ogg': '.ogg',
    'audio/ogg;codecs=opus': '.ogg',
    'audio/mp4': '.m4a',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
  };

  return map[mimeType] ?? '.audio';
}