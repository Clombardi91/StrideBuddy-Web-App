'use client';

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

  const validateAndGo = (method: 'record' | 'type') => {
    if (!name.trim()) {
      setNameError('Please enter your name first 👆');
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
    <main className="noise-bg min-h-dvh bg-warm-gradient">
      <div className="page-enter relative z-10 flex flex-col items-center justify-center min-h-dvh px-5 py-12">
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[140vw] h-48 rounded-b-[50%] bg-terra-500/5 pointer-events-none"
        />

        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          <div className="text-center flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-cream-200 border-4 border-cream-300 flex items-center justify-center shadow-warm">
                <span className="text-5xl" role="img" aria-label={activity.verb}>
                  {activity.emoji}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-terra-500 flex items-center justify-center shadow-md">
                <span className="text-base">🎙️</span>
              </div>
            </div>

            <div>
              <p className="text-ink-400 text-sm font-medium tracking-wide uppercase mb-1">
                You've been invited to cheer on
              </p>
              <h1 className="font-display text-4xl text-ink-900 leading-tight px-2">
                {session.name}
              </h1>
            </div>

            {session.description && (
              <p className="text-ink-500 text-sm leading-relaxed max-w-[280px]">
                {session.description}
              </p>
            )}

            <div className="flex items-center gap-2 bg-cream-200 rounded-2xl px-4 py-2.5 mt-1">
              <span className="text-lg">💬</span>
              <p className="text-ink-600 text-xs font-medium leading-tight">
                Your message will play during their {activity.noun} to keep them going
              </p>
            </div>
          </div>

          <div className="w-full flex flex-col gap-2">
            <label
              htmlFor="supporter-name"
              className="text-ink-600 text-xs font-semibold tracking-widest uppercase"
            >
              Your name
            </label>
            <input
              ref={inputRef}
              id="supporter-name"
              type="text"
              placeholder="e.g. Mom, Coach Dave, Sarah..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              maxLength={40}
              className={[
                'w-full bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-4',
                'text-ink-900 text-base font-body placeholder-ink-200',
                'border-2 transition-colors duration-150',
                nameError
                  ? 'border-terra-500'
                  : 'border-cream-200 focus:border-terra-400',
                'shadow-inner-warm',
              ].join(' ')}
              onKeyDown={(e) => e.key === 'Enter' && validateAndGo('record')}
              autoComplete="given-name"
              autoCapitalize="words"
            />
            {nameError && (
              <p className="text-terra-600 text-xs font-medium animate-fade-up">
                {nameError}
              </p>
            )}
          </div>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => validateAndGo('record')}
              className="group w-full bg-terra-500 hover:bg-terra-600 active:scale-[0.98] text-white font-semibold rounded-3xl py-5 px-6 transition-all duration-150 shadow-warm-lg flex items-center justify-between"
            >
              <span className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-xl shrink-0">
                  🎙️
                </span>
                <span className="text-left">
                  <span className="block text-base font-semibold">Record a Voice Message</span>
                  <span className="block text-xs text-white/70 font-normal">Up to 60 seconds</span>
                </span>
              </span>
              <span className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-150 text-xl">
                →
              </span>
            </button>

            <button
              onClick={() => validateAndGo('type')}
              className="group w-full bg-white/80 backdrop-blur-sm hover:bg-white active:scale-[0.98] text-ink-700 font-semibold rounded-3xl py-5 px-6 border-2 border-cream-200 hover:border-terra-300 transition-all duration-150 shadow-warm flex items-center justify-between"
            >
              <span className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-cream-100 flex items-center justify-center text-xl shrink-0">
                  ✍️
                </span>
                <span className="text-left">
                  <span className="block text-base font-semibold">Type a Message</span>
                  <span className="block text-xs text-ink-400 font-normal">AI converts it to speech</span>
                </span>
              </span>
              <span className="text-ink-300 group-hover:text-terra-500 group-hover:translate-x-1 transition-all duration-150 text-xl">
                →
              </span>
            </button>
          </div>

          <p className="text-ink-200 text-xs text-center">
            No account needed · Takes 30 seconds
          </p>
        </div>
      </div>
    </main>
  );
}