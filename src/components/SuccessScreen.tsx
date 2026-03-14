'use client';

import { useEffect, useRef } from 'react';

interface Props {
  supporterName: string;
}

/**
 * SuccessScreen
 * ─────────────
 * Shown after a message (voice or TTS) is successfully uploaded.
 * Warm, celebratory — the supporter's last impression of the product.
 *
 * Design: Full-page warm cream, confetti-like floating emoji particles,
 * a big hand-written "Thank you!" in the display font, and a short
 * encouraging note about what happens next.
 */
export function SuccessScreen({ supporterName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simple confetti-ish particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const EMOJIS = ['🏃', '💪', '⭐', '🎉', '❤️', '🔥', '✨', '🙌', '🥇'];
    const COUNT = 22;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      emoji: string;
      size: number;
      rotation: number;
      rotSpeed: number;
      opacity: number;
    }

    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      vx: (Math.random() - 0.5) * 1.2,
      vy: 0.8 + Math.random() * 1.4,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      size: 18 + Math.random() * 18,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      opacity: 0.7 + Math.random() * 0.3,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.vy += 0.012; // gravity

        // Reset when off screen
        if (p.y > canvas.height + 40) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
          p.vy = 0.8 + Math.random() * 1.4;
          p.vx = (Math.random() - 0.5) * 1.2;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <main className="noise-bg min-h-dvh bg-warm-gradient relative overflow-hidden">
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden
      />

      {/* Content */}
      <div className="page-enter relative z-10 flex flex-col items-center justify-center min-h-dvh px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-6 max-w-xs">

          {/* Big checkmark circle */}
          <div className="w-24 h-24 rounded-full bg-sage-500 flex items-center justify-center shadow-lg animate-scale-in">
            <svg
              viewBox="0 0 48 48"
              className="w-12 h-12"
              fill="none"
              aria-hidden
            >
              <path
                d="M10 26L20 36L38 14"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-[drawCheck_0.4s_0.2s_ease-out_both]"
                style={{
                  strokeDasharray: 48,
                  strokeDashoffset: 0,
                }}
              />
            </svg>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-2">
            <p className="text-ink-400 text-sm font-medium uppercase tracking-widest">
              Message sent!
            </p>
            <h1 className="font-display text-5xl text-ink-900 leading-tight">
              Thank you,<br />
              <span className="text-terra-500">{supporterName}!</span>
            </h1>
          </div>

          {/* What happens next */}
          <div className="bg-white/70 backdrop-blur-sm border border-cream-200 rounded-3xl p-5 shadow-warm text-left flex flex-col gap-3">
            <p className="text-ink-600 text-sm font-semibold">What happens next:</p>
            <div className="flex flex-col gap-2.5">
              {[
                { emoji: '📱', text: 'Your runner will see a new message waiting for them' },
                { emoji: '🏃', text: 'When they hit the right distance, it plays automatically' },
                { emoji: '💪', text: 'Your words land exactly when they need them most' },
              ].map(({ emoji, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <span className="text-base mt-0.5 shrink-0">{emoji}</span>
                  <span className="text-ink-500 text-sm leading-snug">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Closing note */}
          <p className="text-ink-300 text-xs leading-relaxed">
            You can close this tab. Your message is saved and ready to go.
          </p>

          {/* Decorative terracotta line */}
          <div className="w-16 h-0.5 bg-terra-300 rounded-full" />

          <p className="font-display text-2xl text-terra-400">
            Go get 'em! 🎉
          </p>
        </div>
      </div>
    </main>
  );
}
