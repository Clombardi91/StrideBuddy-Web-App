'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SuccessScreen } from './SuccessScreen';
import {
  generateTTS,
  uploadTTSAudio,
  base64ToAudioUrl,
} from '@/lib/uploadAudio';
import { TTS_VOICES, type TTSVoice } from '@/lib/types';

interface Props {
  token: string;
  sessionId: string;
  supporterName: string;
}

type PageState = 'compose' | 'generating' | 'preview' | 'uploading' | 'success';

const MAX_CHARS = 500;

const MESSAGE_STARTERS = [
  "You've trained so hard for this — go show the world!",
  "Every single step counts. Don't you dare give up!",
  "You're stronger than you feel right now. Keep going!",
  "I'm cheering for you every single mile. You've got this!",
  'Pain is temporary, but finishing is forever. Push through!',
  "Think of how far you've already come. Don't stop now!",
];

export function TTSPage({ token, sessionId, supporterName }: Props) {
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('compose');
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>('nova');
  const [speed, setSpeed] = useState(1.0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setError(null);
    setPageState('generating');

    try {
      const result = await generateTTS({
        text: text.trim(),
        voice: selectedVoice,
        speed,
      });

      const url = base64ToAudioUrl(result.audioBase64, result.mimeType);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(url);
      setAudioBase64(result.audioBase64);
      setEstimatedDuration(result.estimatedDurationSeconds);
      setPageState('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate voice');
      setPageState('compose');
    }
  };

  const handleRegenerate = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setAudioBase64(null);
    setPageState('compose');
  };

  const handleSubmit = async () => {
    if (!audioBase64) return;

    setError(null);
    setPageState('uploading');

    try {
      await uploadTTSAudio({
        audioBase64,
        mimeType: 'audio/mpeg',
        sessionId,
        supporterName,
        textContent: text.trim(),
        voice: selectedVoice,
        token,
      });

      setPageState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Try again.');
      setPageState('preview');
    }
  };

  const insertStarter = (starter: string) => {
    setText(starter);
    textareaRef.current?.focus();
  };

  if (pageState === 'success') {
    return <SuccessScreen supporterName={supporterName} />;
  }

  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;
  const charPct = Math.min((charCount / MAX_CHARS) * 100, 100);

  return (
    <main className="noise-bg min-h-dvh bg-warm-gradient">
      <div className="page-enter relative z-10 flex flex-col min-h-dvh px-5 py-8">
        <button
          onClick={() => router.back()}
          className="self-start text-ink-400 hover:text-ink-700 text-sm font-medium flex items-center gap-1.5 transition-colors mb-8"
        >
          <span className="text-base">←</span> Back
        </button>

        <div className="flex-1 flex flex-col max-w-sm mx-auto w-full gap-6">
          <div className="text-center">
            <h1 className="font-display text-4xl text-ink-900 mb-2">
              Write your message
            </h1>
            <p className="text-ink-400 text-sm">
              AI converts it to a voice message for{' '}
              <span className="font-semibold text-terra-500">{supporterName}</span>
            </p>
          </div>

          {pageState === 'compose' && (
            <div>
              <p className="text-ink-400 text-xs font-semibold uppercase tracking-widest mb-2.5">
                Quick starters
              </p>
              <div className="flex flex-wrap gap-2">
                {MESSAGE_STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => insertStarter(s)}
                    className="text-xs bg-cream-100 hover:bg-cream-200 active:scale-[0.97] border border-cream-200 text-ink-500 hover:text-ink-700 rounded-full px-3 py-1.5 transition-all line-clamp-1 text-left max-w-full"
                  >
                    {s.length > 40 ? `${s.slice(0, 40)}…` : s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write something heartfelt, funny, or wildly encouraging…"
              disabled={pageState !== 'compose'}
              rows={5}
              maxLength={MAX_CHARS + 10}
              className={[
                'w-full bg-white/80 backdrop-blur-sm rounded-3xl px-5 py-4',
                'text-ink-900 text-base leading-relaxed placeholder-ink-200',
                'border-2 transition-colors duration-150 resize-none',
                'shadow-inner-warm',
                isOverLimit
                  ? 'border-terra-500'
                  : 'border-cream-200 focus:border-terra-400',
                pageState !== 'compose' && 'opacity-60 cursor-not-allowed',
              ].join(' ')}
            />
            <div className="absolute bottom-3 right-4 flex items-center gap-2">
              <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" fill="none" stroke="#E8D5C4" strokeWidth="2" />
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  fill="none"
                  stroke={isOverLimit ? '#D4623A' : charPct > 80 ? '#E8845A' : '#CEAD96'}
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 8}`}
                  strokeDashoffset={`${2 * Math.PI * 8 * (1 - charPct / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <span className={`text-xs tabular-nums font-medium ${isOverLimit ? 'text-terra-600' : 'text-ink-300'}`}>
                {MAX_CHARS - charCount}
              </span>
            </div>
          </div>

          {pageState !== 'preview' && (
            <div>
              <p className="text-ink-400 text-xs font-semibold uppercase tracking-widest mb-3">
                Choose a voice
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TTS_VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    disabled={pageState !== 'compose'}
                    className={[
                      'flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left',
                      'border-2 transition-all duration-150',
                      selectedVoice === v.id
                        ? 'bg-terra-500/10 border-terra-400 shadow-warm'
                        : 'bg-white/60 border-cream-200 hover:border-cream-300',
                      pageState !== 'compose' && 'opacity-50 cursor-not-allowed',
                    ].join(' ')}
                  >
                    <span className="text-xl">{v.emoji}</span>
                    <span>
                      <span className="block text-sm font-semibold text-ink-800">{v.name}</span>
                      <span className="block text-xs text-ink-400">{v.vibe}</span>
                    </span>
                    {selectedVoice === v.id && (
                      <span className="ml-auto text-terra-500 text-xs font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {pageState === 'compose' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-ink-400 text-xs font-semibold uppercase tracking-widest">
                  Speaking speed
                </p>
                <span className="text-terra-500 text-xs font-semibold tabular-nums">
                  {speed.toFixed(1)}×
                </span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.25"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-cream-200 cursor-pointer"
                style={{ accentColor: '#D4623A' }}
              />
              <div className="flex justify-between text-ink-300 text-xs mt-1">
                <span>Slower</span>
                <span>Normal</span>
                <span>Faster</span>
              </div>
            </div>
          )}

          {pageState === 'preview' && previewUrl && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-cream-200 p-5 flex flex-col gap-4 shadow-warm">
              <div className="flex items-center justify-between">
                <p className="text-ink-600 text-sm font-semibold">
                  🎙️ Preview your message
                </p>
                <span className="text-ink-300 text-xs">~{estimatedDuration}s</span>
              </div>
              <audio
                ref={audioRef}
                src={previewUrl}
                controls
                className="w-full"
                style={{ colorScheme: 'light', accentColor: '#D4623A' }}
              />
              <div className="bg-cream-100 rounded-2xl px-4 py-3">
                <p className="text-ink-500 text-xs leading-relaxed italic">
                  "{text.length > 120 ? `${text.slice(0, 120)}…` : text}"
                </p>
                <p className="text-ink-300 text-xs mt-1">
                  Voice: {TTS_VOICES.find((v) => v.id === selectedVoice)?.name}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="w-full bg-terra-500/10 border border-terra-300 rounded-2xl p-4 animate-scale-in">
              <p className="text-terra-700 text-sm font-medium text-center">⚠️ {error}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-auto pb-4">
            {pageState === 'compose' && (
              <button
                onClick={handleGenerate}
                disabled={!text.trim() || isOverLimit}
                className="w-full bg-terra-500 hover:bg-terra-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-3xl py-5 transition-all shadow-warm-lg text-base"
              >
                Generate Voice Preview ✨
              </button>
            )}

            {pageState === 'generating' && (
              <div className="w-full bg-cream-100 rounded-3xl py-5 flex items-center justify-center gap-3 border-2 border-cream-200">
                <GeneratingAnimation />
                <span className="text-ink-500 text-sm font-medium">
                  Generating voice…
                </span>
              </div>
            )}

            {pageState === 'preview' && (
              <>
                <button
                  onClick={handleSubmit}
                  className="w-full bg-terra-500 hover:bg-terra-600 active:scale-[0.98] text-white font-semibold rounded-3xl py-5 transition-all shadow-warm-lg text-base"
                >
                  Send Message 🚀
                </button>
                <button
                  onClick={handleRegenerate}
                  className="w-full bg-transparent border-2 border-cream-300 text-ink-500 hover:text-ink-700 font-medium rounded-3xl py-4 transition-all text-sm"
                >
                  Edit & Regenerate
                </button>
              </>
            )}

            {pageState === 'uploading' && (
              <div className="w-full bg-terra-500/10 rounded-3xl py-5 flex items-center justify-center gap-3 border-2 border-terra-300">
                <SpinnerIcon />
                <span className="text-terra-700 text-sm font-medium">
                  Sending your message…
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function GeneratingAnimation() {
  return (
    <div className="flex items-center gap-[3px] h-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[3px] bg-terra-400 rounded-full animate-bounce-gentle"
          style={{
            height: `${10 + i * 3}px`,
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-4 w-4 text-terra-600" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}