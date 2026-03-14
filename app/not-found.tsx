export default function NotFound() {
  return (
    <main className="noise-bg min-h-dvh bg-warm-gradient flex items-center justify-center px-6">
      <div className="page-enter text-center max-w-xs flex flex-col items-center gap-5">
        <div className="text-6xl">🗺️</div>
        <div>
          <h1 className="font-display text-4xl text-ink-900 mb-2">
            Page not found
          </h1>
          <p className="text-ink-400 text-sm leading-relaxed">
            This invite link doesn't exist. Double-check with your runner that
            you have the right link!
          </p>
        </div>
        <div className="w-12 h-0.5 bg-terra-300 rounded-full" />
        <p className="text-ink-300 text-xs">My Stride Buddy</p>
      </div>
    </main>
  );
}
