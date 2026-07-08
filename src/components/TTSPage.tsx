'use client';

import { useEffect, useRef, useState } from 'react';
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

type PageState =
  | 'compose'
  | 'generating'
  | 'preview'
  | 'uploading'
  | 'success';

const MAX_CHARS = 500;

const MESSAGE_STARTERS = [
  "You've trained so hard for this. Keep going, you've got this!",
  "Every step is getting you closer. Keep moving forward!",
  "You're stronger than you feel right now. Don't stop!",
  "I'm cheering for you every step of the way!",
  "Remember what you're working toward. Keep going!",
  "Look how far you've already come. I'm so proud of you.",
];

export function TTSPage({
  token,
  sessionId,
  supporterName,
}: Props) {
  const router = useRouter();

  const [pageState, setPageState] =
    useState<PageState>('compose');

  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] =
    useState<TTSVoice>('nova');

  const [speed, setSpeed] = useState(1);
  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [audioBase64, setAudioBase64] =
    useState<string | null>(null);

  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
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

      const url = base64ToAudioUrl(
        result.audioBase64,
        result.mimeType,
      );

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(url);
      setAudioBase64(result.audioBase64);
      setEstimatedDuration(result.estimatedDurationSeconds);
      setPageState('preview');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate voice preview.',
      );

      setPageState('compose');
    }
  };

  const handleRegenerate = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

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
      setError(
        err instanceof Error
          ? err.message
          : 'Upload failed. Please try again.',
      );

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
  const charactersRemaining = MAX_CHARS - charCount;

  const selectedVoiceData = TTS_VOICES.find(
    (voice) => voice.id === selectedVoice,
  );

  return (
    <main className="noise-bg min-h-dvh bg-warm-gradient px-5 py-8 md:py-12">
      <section className="page-enter mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-ink-400 transition-colors hover:text-ink-900"
        >
          <span aria-hidden="true">←</span>
          Back
        </button>

        <div className="rounded-[2rem] border border-white/70 bg-white/85 px-6 py-8 shadow-2xl shadow-black/5 backdrop-blur md:px-8">
          <header className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
              Stride Buddy
            </p>

            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-ink-900">
              Write your message
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-500">
              Write what you want to say. We’ll turn it into a
              voice message for{' '}
              <span className="font-semibold text-ink-900">
                {supporterName}
              </span>
              .
            </p>
          </header>

          {pageState === 'compose' && (
            <>
              <div className="mt-7">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="tts-message"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500"
                  >
                    Your message
                  </label>

                  <span
                    className={[
                      'text-xs tabular-nums',
                      isOverLimit
                        ? 'font-semibold text-red-600'
                        : 'text-ink-300',
                    ].join(' ')}
                  >
                    {charactersRemaining} remaining
                  </span>
                </div>

                <textarea
                  ref={textareaRef}
                  id="tts-message"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Write something encouraging..."
                  rows={6}
                  maxLength={MAX_CHARS + 10}
                  className={[
                    'mt-3 w-full resize-none rounded-2xl bg-white/90 px-4 py-4',
                    'text-base leading-7 text-ink-900 placeholder-ink-200',
                    'border outline-none transition-colors duration-150',
                    'shadow-sm',
                    isOverLimit
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-ink-100 focus:border-blue-500',
                  ].join(' ')}
                />
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
                  Need an idea?
                </p>

                <div className="mt-3 flex flex-col gap-2">
                  {MESSAGE_STARTERS.slice(0, 3).map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => insertStarter(starter)}
                      className="group flex w-full items-center justify-between rounded-xl border border-ink-100 bg-white/70 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-white"
                    >
                      <span className="pr-4 text-sm leading-5 text-ink-500 transition group-hover:text-ink-700">
                        {starter}
                      </span>

                      <span className="shrink-0 text-ink-300 transition group-hover:text-blue-600">
                        +
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="my-7 h-px w-full bg-ink-100" />

              <div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
                    Choose a voice
                  </p>

                  <p className="mt-1 text-xs leading-5 text-ink-300">
                    Select the tone that best fits your message.
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {TTS_VOICES.map((voice) => {
                    const isSelected =
                      selectedVoice === voice.id;

                    return (
                      <button
                        key={voice.id}
                        type="button"
                        onClick={() =>
                          setSelectedVoice(voice.id)
                        }
                        className={[
                          'relative rounded-2xl border px-4 py-3.5 text-left',
                          'transition-all duration-150 active:scale-[0.98]',
                          isSelected
                            ? 'border-blue-500 bg-blue-50/70 shadow-sm'
                            : 'border-ink-100 bg-white/70 hover:border-blue-200 hover:bg-white',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span
                              className={[
                                'block text-sm font-semibold',
                                isSelected
                                  ? 'text-blue-700'
                                  : 'text-ink-900',
                              ].join(' ')}
                            >
                              {voice.name}
                            </span>

                            <span className="mt-1 block text-xs leading-4 text-ink-400">
                              {voice.vibe}
                            </span>
                          </div>

                          <span
                            className={[
                              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-ink-100 bg-white',
                            ].join(' ')}
                          >
                            {isSelected && (
                              <CheckIcon className="h-3 w-3" />
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
                      Speaking speed
                    </p>

                    <p className="mt-1 text-xs text-ink-300">
                      Adjust how quickly the message is read.
                    </p>
                  </div>

                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-blue-600">
                    {speed.toFixed(1)}×
                  </span>
                </div>

                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.05"
                  value={speed}
                  onChange={(event) =>
                    setSpeed(parseFloat(event.target.value))
                  }
                  aria-label="Speaking speed"
                  className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-100"
                  style={{ accentColor: '#2563EB' }}
                />

                <div className="mt-2 flex justify-between text-xs text-ink-300">
                  <span>Slower</span>
                  <span>Normal</span>
                  <span>Faster</span>
                </div>
              </div>
            </>
          )}

          {pageState === 'generating' && (
            <div className="mt-7 flex min-h-[280px] flex-col items-center justify-center rounded-[1.75rem] border border-blue-100 bg-blue-50/40 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <GeneratingAnimation />
              </div>

              <p className="mt-5 text-base font-semibold text-ink-900">
                Creating your voice preview
              </p>

              <p className="mt-2 max-w-xs text-sm leading-6 text-ink-400">
                We’re turning your message into speech. This
                should only take a moment.
              </p>
            </div>
          )}

          {pageState === 'preview' && previewUrl && (
            <div className="mt-7">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <AudioIcon />
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Preview ready
                </p>

                <h2 className="mt-2 font-display text-3xl font-semibold text-ink-900">
                  Listen before you send
                </h2>

                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-ink-400">
                  Make sure your message sounds the way you want it to.
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-ink-100 bg-white/80 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      Voice preview
                    </p>

                    <p className="mt-1 text-xs text-ink-400">
                      {selectedVoiceData?.name} ·{' '}
                      {speed.toFixed(1)}× speed
                    </p>
                  </div>

                  <span className="text-xs font-medium text-ink-300">
                    ~{estimatedDuration}s
                  </span>
                </div>

                <audio
                  ref={audioRef}
                  src={previewUrl}
                  controls
                  className="mt-4 w-full"
                  style={{
                    colorScheme: 'light',
                    accentColor: '#2563EB',
                  }}
                />

                <div className="mt-4 border-t border-ink-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-300">
                    Your message
                  </p>

                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    “{text}”
                  </p>
                </div>
              </div>
            </div>
          )}

          {pageState === 'uploading' && (
            <div className="mt-7 flex min-h-[280px] flex-col items-center justify-center rounded-[1.75rem] border border-blue-100 bg-blue-50/40 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <SpinnerIcon className="h-7 w-7" />
              </div>

              <p className="mt-5 text-base font-semibold text-ink-900">
                Sending your message
              </p>

              <p className="mt-2 max-w-xs text-sm leading-6 text-ink-400">
                Your message is being securely added to their
                workout.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center">
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3">
            {pageState === 'compose' && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!text.trim() || isOverLimit}
                className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Generate Voice Preview
              </button>
            )}

            {pageState === 'preview' && (
              <>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98]"
                >
                  Send Message
                </button>

                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="w-full rounded-2xl border border-ink-100 bg-white px-5 py-4 text-sm font-semibold text-ink-600 transition hover:border-blue-200 hover:text-blue-600 active:scale-[0.98]"
                >
                  Edit Message
                </button>
              </>
            )}
          </div>

          {pageState === 'compose' && (
            <p className="mt-6 text-center text-xs text-ink-300">
              You’ll preview the voice before anything is sent.
            </p>
          )}

          {pageState === 'preview' && (
            <p className="mt-6 text-center text-xs text-ink-300">
              Nothing is sent until you select Send Message.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function GeneratingAnimation() {
  return (
    <div className="flex h-7 items-center gap-1">
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className="w-1 animate-bounce-gentle rounded-full bg-blue-600"
          style={{
            height: `${12 + index * 3}px`,
            animationDelay: `${index * 100}ms`,
          }}
        />
      ))}
    </div>
  );
}

function AudioIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <path
        d="M5 9v6M9 6v12M13 4v16M17 7v10M21 10v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({
  className = 'h-4 w-4',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="m7 12.5 3.2 3.2L17.5 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpinnerIcon({
  className = 'h-4 w-4',
}: {
  className?: string;
}) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />

      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
      />
    </svg>
  );
}