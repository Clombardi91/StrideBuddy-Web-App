import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="noise-bg min-h-dvh bg-warm-gradient flex flex-col items-center justify-center px-6 py-16">
      <div className="page-enter text-center max-w-sm">
        <div className="text-7xl mb-6">🏃</div>
        <h1 className="font-display text-5xl text-ink-900 mb-4 leading-tight">
          My Stride Buddy
        </h1>
        <p className="text-ink-500 text-base leading-relaxed mb-8">
          Send a voice message to a runner who invited you, and it'll play
          during their workout to keep them going.
        </p>
        <p className="text-ink-300 text-sm">
          Open the invite link from your runner to get started.
        </p>
      </div>
    </main>
  );
}
