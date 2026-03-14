'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { TTSPage } from '@/components/TTSPage';

export default function InviteTypePage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const token =
    typeof params.token === 'string'
      ? params.token
      : Array.isArray(params.token)
      ? params.token[0]
      : '';

  const sessionId = searchParams.get('sessionId') ?? '';
  const supporterName = searchParams.get('name') ?? '';

  if (!token || !sessionId || !supporterName) {
    return (
      <main className="noise-bg min-h-dvh bg-warm-gradient flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-ink-500 text-sm leading-relaxed">
            Missing session information. Please return to the invite page and try again.
          </p>
        </div>
      </main>
    );
  }

  return (
    <TTSPage
      token={token}
      sessionId={sessionId}
      supporterName={supporterName}
    />
  );
}