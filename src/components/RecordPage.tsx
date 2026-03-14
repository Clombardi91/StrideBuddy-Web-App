'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { WaveformVisualizer } from './WaveformVisualizer';
import { SuccessScreen } from './SuccessScreen';
import { uploadRecordedAudio } from '@/lib/uploadAudio';

interface Props {
  token: string;
  sessionId: string;
  supporterName: string;
}

const MAX_SECONDS = 60;

type MicPermissionState =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'unsupported';

export function RecordPage({ token, sessionId, supporterName }: Props) {
  const router = useRouter();
  const recorder = useAudioRecorder();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [didSucceed, setDidSucceed] = useState(false);
  const [micPermission, setMicPermission] =
    useState<MicPermissionState>('prompt');

  const progressPct = Math.min(
    (recorder.durationSeconds / MAX_SECONDS) * 100,
    100,
  );
  const remainingSeconds = MAX_SECONDS - recorder.durationSeconds;

  const handleStartRecording = async () => {
    setUploadError(null);

    try {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setMicPermission('unsupported');
        return;
      }

      await recorder.start();
      setMicPermission('granted');
    } catch (error) {
      console.error('handleStartRecording error:', error);

      if (
        error instanceof DOMException &&
        (error.name === 'NotAllowedError' ||
          error.name === 'PermissionDeniedError')
      ) {
        setMicPermission('denied');
        return;
      }

      setMicPermission('prompt');
    }
  };

  const handleRetryPermission = async () => {
    await handleStartRecording();
  };

  const handleSubmit = async () => {
    if (!recorder.audioBlob) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      await uploadRecordedAudio({
        audioBlob: recorder.audioBlob,
        mimeType: recorder.mimeType,
        sessionId,
        supporterName,
        durationSeconds: recorder.durationSeconds,
        token,
      });

      setDidSucceed(true);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Upload failed. Please try again.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (didSucceed) {
    return <SuccessScreen supporterName={supporterName} />;
  }

  return (
    <main className="noise-bg min-h-dvh bg-warm-gradient">
      <div className="page-enter relative z-10 flex flex-col min-h-dvh px-5 py-8">
        <button
          onClick={() => router.back()}
          className="self-start text-ink-400 hover:text-ink-700 text-sm font-medium flex items-center gap-1.5 transition-colors mb-8"
        >
          <span className="text-base">←</span> Back
        </button>

        <div className="flex-1 flex flex-col items-center max-w-sm mx-auto w-full gap-8">
          <div className="text-center">
            <h1 className="font-display text-4xl text-ink-900 mb-2">
              Record your message
            </h1>
            <p className="text-ink-400 text-sm">
              Hi{' '}
              <span className="font-semibold text-terra-500">
                {supporterName}
              </span>
              ! Up to {MAX_SECONDS} seconds · Speak clearly 🗣️
            </p>
          </div>

          <div className="w-full">
            <div
              className={[
                'w-full rounded-4xl border-2 transition-all duration-300',
                'flex flex-col items-center justify-center',
                'bg-white/60 backdrop-blur-sm',
                recorder.state === 'recording'
                  ? 'border-terra-400 shadow-warm-lg min-h-[160px] py-6'
                  : 'border-cream-200 shadow-warm min-h-[140px] py-6',
              ].join(' ')}
            >
              {micPermission === 'denied' && (
                <div className="flex flex-col items-center gap-3 px-5 text-center">
                  <div className="text-4xl">🚫</div>
                  <p className="text-terra-700 text-sm font-medium">
                    Microphone access denied. Please allow it in your browser
                    settings and try again.
                  </p>
                </div>
              )}

              {micPermission === 'unsupported' && (
                <div className="flex flex-col items-center gap-3 px-5 text-center">
                  <div className="text-4xl">🤷</div>
                  <p className="text-terra-700 text-sm font-medium">
                    Your browser does not support microphone recording.
                  </p>
                </div>
              )}

              {micPermission === 'prompt' &&
                recorder.state !== 'recording' &&
                recorder.state !== 'stopped' && (
                  <div className="flex flex-col items-center gap-3 px-5 text-center">
                    <div className="text-5xl">🎙️</div>
                    <p className="text-ink-400 text-sm">
                      Tap below to enable your microphone and start recording.
                    </p>
                  </div>
                )}

              {micPermission === 'granted' && recorder.state === 'idle' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="text-5xl">🎙️</div>
                  <p className="text-ink-300 text-sm font-medium">
                    Tap record to begin
                  </p>
                </div>
              )}

              {recorder.state === 'requesting' && (
                <div className="flex flex-col items-center gap-3 animate-pulse-slow">
                  <div className="text-4xl">🎤</div>
                  <p className="text-ink-400 text-sm">
                    Accessing microphone…
                  </p>
                </div>
              )}

              {micPermission === 'granted' &&
                recorder.state === 'recording' && (
                  <div className="w-full flex flex-col items-center gap-4 px-6">
                    {recorder.analyserNode ? (
                      <WaveformVisualizer
                        analyserNode={recorder.analyserNode}
                        color="#D4623A"
                        height={60}
                      />
                    ) : (
                      <IdleWaveform />
                    )}

                    <div className="flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terra-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-terra-500" />
                      </span>
                      <span className="font-display text-3xl text-ink-900 tabular-nums">
                        {recorder.durationSeconds}s
                      </span>
                      <span className="text-ink-300 text-sm">
                        / {MAX_SECONDS}s
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-cream-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-terra-500 rounded-full transition-all duration-1000"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {remainingSeconds <= 10 && (
                      <p className="text-terra-600 text-xs font-medium animate-pulse">
                        {remainingSeconds}s remaining
                      </p>
                    )}
                  </div>
                )}

              {micPermission === 'granted' &&
                recorder.state === 'stopped' &&
                recorder.audioUrl && (
                  <div className="w-full flex flex-col gap-3 px-5">
                    <p className="text-ink-500 text-xs font-medium text-center">
                      Recorded · {recorder.durationSeconds}s
                    </p>
                    <audio
                      src={recorder.audioUrl}
                      controls
                      className="w-full rounded-xl"
                      style={{ colorScheme: 'light', accentColor: '#D4623A' }}
                    />
                  </div>
                )}

              {recorder.state === 'error' && (
                <div className="flex flex-col items-center gap-2 px-5 text-center">
                  <span className="text-3xl">😕</span>
                  <p className="text-terra-600 text-sm font-medium">
                    {recorder.error}
                  </p>
                </div>
              )}
            </div>
          </div>

          {uploadError && (
            <div className="w-full bg-terra-500/10 border border-terra-300 rounded-2xl p-4 animate-scale-in">
              <p className="text-terra-700 text-sm font-medium text-center">
                ⚠️ {uploadError}
              </p>
            </div>
          )}

          <div className="w-full flex flex-col gap-3 mt-auto">
            {(micPermission === 'prompt' || micPermission === 'denied') && (
              <button
                onClick={handleRetryPermission}
                className="w-full bg-terra-500 hover:bg-terra-600 active:scale-[0.98] text-white font-semibold rounded-3xl py-5 transition-all shadow-warm-lg text-base"
              >
                Enable Microphone
              </button>
            )}

            {(recorder.state === 'idle' || recorder.state === 'error') &&
              micPermission === 'granted' && (
                <button
                  onClick={handleStartRecording}
                  className="w-full bg-terra-500 hover:bg-terra-600 active:scale-[0.98] text-white font-semibold rounded-3xl py-5 transition-all shadow-warm-lg flex items-center justify-center gap-3 text-base"
                >
                  <span className="relative w-3 h-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                  </span>
                  Start Recording
                </button>
              )}

            {recorder.state === 'recording' && micPermission === 'granted' && (
              <button
                onClick={recorder.stop}
                className="w-full bg-ink-800 hover:bg-ink-900 active:scale-[0.98] text-white font-semibold rounded-3xl py-5 transition-all shadow-md flex items-center justify-center gap-3 text-base"
              >
                <span className="w-4 h-4 rounded bg-white inline-block" />
                Stop Recording
              </button>
            )}

            {recorder.state === 'stopped' && micPermission === 'granted' && (
              <>
                <button
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="w-full bg-terra-500 hover:bg-terra-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-3xl py-5 transition-all shadow-warm-lg text-base"
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <SpinnerIcon />
                      Sending message…
                    </span>
                  ) : (
                    'Send Message 🚀'
                  )}
                </button>

                <button
                  onClick={recorder.reset}
                  disabled={isUploading}
                  className="w-full bg-transparent border-2 border-cream-300 hover:border-cream-300 active:scale-[0.98] text-ink-500 hover:text-ink-700 font-medium rounded-3xl py-4 transition-all text-sm"
                >
                  Record Again
                </button>
              </>
            )}
          </div>

          {recorder.state === 'idle' && micPermission === 'granted' && (
            <div className="w-full bg-cream-100/80 rounded-3xl p-5 flex flex-col gap-2">
              <p className="text-ink-500 text-xs font-semibold uppercase tracking-widest mb-1">
                Tips for a great message
              </p>
              {[
                ['🎯', 'Be specific — mention their name or goal'],
                ['💪', 'Be enthusiastic — energy is contagious!'],
                ['❤️', 'Keep it personal — it makes all the difference'],
              ].map(([emoji, tip]) => (
                <div key={tip} className="flex items-start gap-2">
                  <span className="text-sm mt-px">{emoji}</span>
                  <span className="text-ink-500 text-xs leading-relaxed">
                    {tip}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function IdleWaveform() {
  const heights = [30, 60, 45, 75, 50, 85, 40, 65, 35, 70, 55, 80, 42, 58];

  return (
    <div className="flex items-center gap-1 h-16">
      {heights.map((h, i) => (
        <div
          key={i}
          className="wave-bar rounded-full"
          style={{
            height: h,
            animationDelay: `${i * 60}ms`,
            animationDuration: `${700 + i * 40}ms`,
          }}
        />
      ))}
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}