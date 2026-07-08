'use client';

import Image from 'next/image';

interface Props {
  supporterName: string;
}

export function SuccessScreen({ supporterName }: Props) {
  return (
    <main className="noise-bg min-h-dvh bg-warm-gradient flex items-center justify-center px-5 py-12">
      <section className="page-enter w-full max-w-md">
        <div className="rounded-[2rem] border border-white/70 bg-white/85 px-6 py-9 text-center shadow-2xl shadow-black/5 backdrop-blur md:px-8">

          {/* Brand */}
          <div className="mx-auto flex justify-center">
            <Image
              src="/logo/logo.png"
              alt="Stride Buddy logo"
              width={96}
              height={96}
              priority
              className="h-20 w-20 object-contain"
            />
          </div>

          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
            Stride Buddy
          </p>

          {/* Success icon */}
          <div className="mx-auto mt-7 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-8 w-8"
              aria-hidden="true"
            >
              <path
                d="M7 12.5l3.2 3.2L17.5 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Confirmation */}
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Message sent
          </p>

          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-ink-900">
            You’re part of their next mile.
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-ink-500">
            Thanks,{' '}
            <span className="font-semibold text-ink-900">
              {supporterName}
            </span>
            . Your message has been saved and will be ready for their workout.
          </p>

          {/* What happens next */}
          <div className="mt-7 rounded-2xl border border-ink-100 bg-white/80 px-5 py-5 text-left shadow-sm">
            <p className="text-sm font-semibold text-ink-900">
              What happens next
            </p>

            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <StepIcon number="1" />

                <div>
                  <p className="text-sm font-medium text-ink-900">
                    Your message is saved
                  </p>
                  <p className="mt-1 text-xs leading-5 text-ink-400">
                    It’s securely connected to their workout.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <StepIcon number="2" />

                <div>
                  <p className="text-sm font-medium text-ink-900">
                    They start their workout
                  </p>
                  <p className="mt-1 text-xs leading-5 text-ink-400">
                    Stride Buddy brings supporter messages along for the journey.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <StepIcon number="3" />

                <div>
                  <p className="text-sm font-medium text-ink-900">
                    Your encouragement reaches them
                  </p>
                  <p className="mt-1 text-xs leading-5 text-ink-400">
                    They’ll hear your message while they’re out there doing the work.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Closing */}
          <p className="mt-7 text-sm font-medium text-ink-600">
            You can close this page.
          </p>

          <p className="mt-2 text-xs leading-5 text-ink-300">
            Your message is saved and ready to go.
          </p>

          <div className="mx-auto mt-6 h-px w-12 bg-ink-100" />

          <p className="mt-5 text-xs text-ink-300">
            Private message · Delivered through Stride Buddy
          </p>

        </div>
      </section>
    </main>
  );
}

function StepIcon({ number }: { number: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
      {number}
    </div>
  );
}