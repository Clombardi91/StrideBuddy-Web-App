export type ActivityType = 'run' | 'cycle' | 'walk';
export type MessageSourceType = 'recorded' | 'tts';

export interface SessionPublic {
  id: string;
  name: string;
  description: string | null;
  activity_type: ActivityType;
  invite_token: string;
  invite_expires_at: string | null;
  is_active: boolean;
}

export interface UploadRecordedPayload {
  type: 'recorded';
  audioBlob: Blob;
  mimeType: string;
  sessionId: string;
  supporterName: string;
  durationSeconds: number;
}

export interface UploadTTSPayload {
  type: 'tts';
  audioBase64: string;
  mimeType: string;
  sessionId: string;
  supporterName: string;
  textContent: string;
  voice: string;
}

export type UploadPayload = UploadRecordedPayload | UploadTTSPayload;

export interface UploadResult {
  messageId: string;
  audioUrl: string;
  supporterName: string;
  sourceType: MessageSourceType;
}

export interface TTSGenerateRequest {
  text: string;
  voice: TTSVoice;
  speed?: number;
}

export interface TTSGenerateResponse {
  audioBase64: string;
  mimeType: 'audio/mpeg';
  voice: TTSVoice;
  estimatedDurationSeconds: number;
}

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export const TTS_VOICES: { id: TTSVoice; name: string; vibe: string; emoji: string }[] = [
  { id: 'nova',    name: 'Nova',    vibe: 'Warm & uplifting',  emoji: '☀️' },
  { id: 'shimmer', name: 'Shimmer', vibe: 'Bright & energetic', emoji: '⚡' },
  { id: 'fable',   name: 'Fable',   vibe: 'Deep & powerful',   emoji: '🔥' },
  { id: 'alloy',   name: 'Alloy',   vibe: 'Clear & confident', emoji: '💎' },
  { id: 'echo',    name: 'Echo',    vibe: 'Calm & steady',     emoji: '🌊' },
  { id: 'onyx',    name: 'Onyx',    vibe: 'Rich & motivating', emoji: '🏆' },
];

export const ACTIVITY_LABELS: Record<ActivityType, { verb: string; emoji: string; noun: string }> = {
  run:   { verb: 'running',  emoji: '🏃', noun: 'run'   },
  cycle: { verb: 'cycling',  emoji: '🚴', noun: 'ride'  },
  walk:  { verb: 'walking',  emoji: '🚶', noun: 'walk'  },
};
