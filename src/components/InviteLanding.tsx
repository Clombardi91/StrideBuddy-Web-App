'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionPublic } from '@/lib/types';
import { ACTIVITY_LABELS } from '@/lib/types';

interface Props {
  session: SessionPublic;
  inviteToken: string;
}

export function InviteLanding({ session, inviteToken }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activity = ACTIVITY_LABELS[session.activity_type] ?? ACTIVITY_LABELS.run;

  const athleteName = session.athlete_name || 'your athlete';

  const validateAndGo = (method: 'record' | 'type') => {
    if (!name.trim()) {
      setNameError('Please enter your name first.');
      inputRef.current?.focus();
      return;
    }

    if (!inviteToken) {
      setNameError('Invite link is missing. Please go back and try again.');
      return;
    }

    setNameError('');

    const params = new URLSearchParams({
      sessionId: session.id,
      name: name.trim(),
    });

    router.push(`/invite/${inviteToken}/${method}?${params.toString()}`);
  };

  return (
    <main className="noise-bg min-h-dvh bg-warm-gradient flex items-center justify-center px-5 py-12">
      <section className="page-enter w-full max-w-md">
        <div className="rounded-[2rem] border border-white/70 bg-white/85 px-6 py-8 text-center shadow-2xl shadow-black/5 backdrop-blur md:px-8">
          <div className="mx-auto flex justify-center">
            <Image
              src="/logo/logo.png"
              alt="Stride Buddy logo"
              width={104}
              height={104}
              priority
              className="h-24 w-24 object-contain"
            />
          </div>

          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
            Stride Buddy
          </p>

          <p className="mt-5 text-sm font-medium uppercase tracking-wide text-ink-400">
            You’ve been invited to support
          </p>

          <h1 className="mt-1 font-display text-4xl font-semibold leading-tight text-ink-900">
            {athleteName}
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-ink-500">
            Leave a voice message or typed note. They’ll hear it during their{' '}
            {activity.noun} when they need the extra push.
          </p>

          {session.description && (
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-400">
              {session.description}
            </p>
          )}

          <div className="mt-7 text-left">
            <label
              htmlFor="supporter-name"
              className="text-xs font-semibold uppercase tracking-widest text-ink-600"
            >
              Your name
            </label>

            <input
              ref={inputRef}
              id="supporter-name"
              type="text"
              placeholder="e.g. Mom, Dad, John..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              maxLength={40}
              className={[
                'mt-3 w-full rounded-2xl bg-white/90 px-4 py-4',
                'text-base text-ink-900 placeholder-ink-200',
                'border transition-colors duration-150 outline-none',
                nameError
                  ? 'border-terra-500'
                  : 'border-ink-100 focus:border-blue-500',
                'shadow-sm',
              ].join(' ')}
              onKeyDown={(e) => e.key === 'Enter' && validateAndGo('record')}
              autoComplete="given-name"
              autoCapitalize="words"
            />

            {nameError && (
              <p className="mt-2 text-xs font-medium text-terra-600">
                {nameError}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => validateAndGo('record')}
              className="group flex w-full items-center justify-between rounded-2xl bg-blue-600 px-5 py-5 text-white shadow-lg shadow-blue-600/20 transition duration-150 hover:bg-blue-700 active:scale-[0.98]"
            >
              <span className="text-left">
                <span className="block text-base font-semibold">
                  Record a Voice Message
                </span>
                <span className="mt-1 block text-xs font-normal text-white/75">
                  Use your voice, up to 60 seconds
                </span>
              </span>

              <span className="text-xl text-white/70 transition group-hover:translate-x-1 group-hover:text-white">
                →
              </span>
            </button>

            <button
              onClick={() => validateAndGo('type')}
              className="group flex w-full items-center justify-between rounded-2xl border border-ink-100 bg-white/90 px-5 py-5 text-ink-900 shadow-sm transition duration-150 hover:border-blue-200 hover:bg-white active:scale-[0.98]"
            >
              <span className="text-left">
                <span className="block text-base font-semibold">
                  Type a Message
                </span>
                <span className="mt-1 block text-xs font-normal text-ink-400">
                  We’ll convert it to speech
                </span>
              </span>

              <span className="text-xl text-ink-300 transition group-hover:translate-x-1 group-hover:text-blue-600">
                →
              </span>
            </button>
          </div>

          <p className="mt-7 text-xs text-ink-300">
            Private message · No account needed · Takes less than a minute
          </p>
        </div>
      </section>
    </main>
  );
}