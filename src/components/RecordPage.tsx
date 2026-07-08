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

export function RecordPage({
  token,
  sessionId,
  supporterName,
}: Props) {
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

  const remainingSeconds = Math.max(
    MAX_SECONDS - recorder.durationSeconds,
    0,
  );

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
        err instanceof Error
          ? err.message
          : 'Upload failed. Please try again.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (didSucceed) {
    return <SuccessScreen supporterName={supporterName} />;
  }

  return (
    <main className="noise-bg min-h-dvh bg-warm-gradient px-5 py-8 md:py-12">
      <section className="page-enter mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-ink-400 transition-colors hover:text-ink-900"
        >
          <span aria-hidden>←</span>
          Back
        </button>

        <div className="rounded-[2rem] border border-white/70 bg-white/85 px-6 py-8 shadow-2xl shadow-black/5 backdrop-blur md:px-8">
          <header className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
              Stride Buddy
            </p>

            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-ink-900">
              Record your message
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-500">
              Recording as{' '}
              <span className="font-semibold text-ink-900">
                {supporterName}
              </span>
              . You have up to {MAX_SECONDS} seconds.
            </p>
          </header>

          <div
            className={[
              'mt-7 flex min-h-[220px] w-full flex-col items-center justify-center',
              'rounded-[1.75rem] border bg-white/80 px-5 py-7',
              'transition-all duration-300',
              recorder.state === 'recording'
                ? 'border-blue-300 shadow-lg shadow-blue-600/10'
                : 'border-ink-100 shadow-sm',
            ].join(' ')}
          >
            {micPermission === 'denied' && (
              <StatusMessage
                icon={<MicOffIcon />}
                title="Microphone access is blocked"
                description="Allow microphone access in your browser settings, then try again."
              />
            )}

            {micPermission === 'unsupported' && (
              <StatusMessage
                icon={<MicOffIcon />}
                title="Recording is not supported"
                description="This browser does not support microphone recording. Try opening the link in a current version of Chrome, Safari, or Edge."
              />
            )}

            {micPermission === 'prompt' &&
              recorder.state !== 'recording' &&
              recorder.state !== 'stopped' && (
                <StatusMessage
                  icon={<MicrophoneIcon />}
                  title="Ready to record"
                  description="Allow microphone access to begin recording your message."
                />
              )}

            {micPermission === 'granted' &&
              recorder.state === 'idle' && (
                <StatusMessage
                  icon={<MicrophoneIcon />}
                  title="Your microphone is ready"
                  description="Select Start Recording when you're ready to begin."
                />
              )}

            {recorder.state === 'requesting' && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <SpinnerIcon className="h-7 w-7" />
                </div>

                <div>
                  <p className="text-base font-semibold text-ink-900">
                    Connecting to your microphone
                  </p>
                  <p className="mt-1 text-sm text-ink-400">
                    This should only take a moment.
                  </p>
                </div>
              </div>
            )}

            {micPermission === 'granted' &&
              recorder.state === 'recording' && (
                <div className="flex w-full flex-col items-center gap-5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
                    </span>

                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                      Recording
                    </span>
                  </div>

                  <div className="flex h-16 w-full items-center justify-center overflow-hidden">
                    {recorder.analyserNode ? (
                      <WaveformVisualizer
                        analyserNode={recorder.analyserNode}
                        color="#2563EB"
                        height={64}
                      />
                    ) : (
                      <IdleWaveform />
                    )}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-semibold tabular-nums text-ink-900">
                      {formatTime(recorder.durationSeconds)}
                    </span>

                    <span className="text-sm text-ink-300">
                      / {formatTime(MAX_SECONDS)}
                    </span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-50">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-1000"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {remainingSeconds <= 10 && (
                    <p className="text-xs font-semibold text-blue-600">
                      {remainingSeconds} seconds remaining
                    </p>
                  )}
                </div>
              )}

            {micPermission === 'granted' &&
              recorder.state === 'stopped' &&
              recorder.audioUrl && (
                <div className="flex w-full flex-col items-center gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <CheckIcon />
                  </div>

                  <div className="text-center">
                    <p className="text-base font-semibold text-ink-900">
                      Your message is ready
                    </p>

                    <p className="mt-1 text-sm text-ink-400">
                      Review your {recorder.durationSeconds}-second recording
                      before sending.
                    </p>
                  </div>

                  <audio
                    src={recorder.audioUrl}
                    controls
                    className="w-full rounded-xl"
                    style={{
                      colorScheme: 'light',
                      accentColor: '#2563EB',
                    }}
                  />
                </div>
              )}

            {recorder.state === 'error' && (
              <StatusMessage
                icon={<MicOffIcon />}
                title="Something went wrong"
                description={
                  recorder.error ||
                  'We could not start the recording. Please try again.'
                }
              />
            )}
          </div>

          {uploadError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center">
              <p className="text-sm font-medium text-red-700">
                {uploadError}
              </p>
            </div>
          )}

          <div className="mt-5 flex w-full flex-col gap-3">
            {(micPermission === 'prompt' ||
              micPermission === 'denied') && (
              <button
                type="button"
                onClick={handleRetryPermission}
                className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98]"
              >
                Enable Microphone
              </button>
            )}

            {(recorder.state === 'idle' ||
              recorder.state === 'error') &&
              micPermission === 'granted' && (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98]"
                >
                  <span className="h-3 w-3 rounded-full bg-white" />
                  Start Recording
                </button>
              )}

            {recorder.state === 'recording' &&
              micPermission === 'granted' && (
                <button
                  type="button"
                  onClick={recorder.stop}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-ink-900 px-5 py-4 text-base font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-[0.98]"
                >
                  <span className="h-3.5 w-3.5 rounded-sm bg-white" />
                  Stop Recording
                </button>
              )}

            {recorder.state === 'stopped' &&
              micPermission === 'granted' && (
                <>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isUploading}
                    className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <SpinnerIcon className="h-4 w-4" />
                        Sending message…
                      </span>
                    ) : (
                      'Send Message'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={recorder.reset}
                    disabled={isUploading}
                    className="w-full rounded-2xl border border-ink-100 bg-white px-5 py-4 text-sm font-semibold text-ink-600 transition hover:border-blue-200 hover:text-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Record Again
                  </button>
                </>
              )}
          </div>

          {recorder.state === 'idle' &&
            micPermission === 'granted' && (
              <div className="mt-6 border-t border-ink-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  A great message can be simple
                </p>

                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Mention their name, remind them what they’re working toward,
                  or simply tell them you’re proud of them.
                </p>
              </div>
            )}

          <p className="mt-6 text-center text-xs text-ink-300">
            Private message · Sent securely through Stride Buddy
          </p>
        </div>
      </section>
    </main>
  );
}

function StatusMessage({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center px-3 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <p className="mt-4 text-base font-semibold text-ink-900">
        {title}
      </p>

      <p className="mt-2 max-w-xs text-sm leading-6 text-ink-400">
        {description}
      </p>
    </div>
  );
}

function MicrophoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <path
        d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6.5 11.5V12a5.5 5.5 0 0 0 11 0v-.5M12 17.5V21M9 21h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <path
        d="m4 4 16 16M9 9v3a3 3 0 0 0 4.8 2.4M15 10V6a3 3 0 0 0-5.6-1.5M6.5 11.5V12a5.5 5.5 0 0 0 8.7 4.5M17.5 11.5V12c0 .8-.2 1.6-.5 2.3M12 17.5V21M9 21h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-8 w-8"
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

function IdleWaveform() {
  const heights = [24, 42, 32, 52, 36, 58, 28, 46, 30, 50, 38, 56];

  return (
    <div className="flex h-16 items-center gap-1">
      {heights.map((height, index) => (
        <div
          key={index}
          className="w-1 rounded-full bg-blue-500"
          style={{
            height: `${height}px`,
            opacity: 0.35 + index * 0.035,
          }}
        />
      ))}
    </div>
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

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}