import Image from 'next/image';
import { FaApple, FaGooglePlay } from 'react-icons/fa';

export default function HomePage() {
  return (
    <main className="noise-bg min-h-dvh bg-warm-gradient flex items-center justify-center px-6 py-16">
      <section className="page-enter w-full max-w-lg">
        <div className="rounded-[2rem] border border-white/70 bg-white/85 px-8 py-10 text-center shadow-2xl shadow-black/5 backdrop-blur md:px-10">

          <div className="mx-auto flex items-center justify-center">
            <Image
              src="/logo/logo.png"
              alt="Stride Buddy logo"
              width={128}
              height={128}
              priority
              className="h-32 w-32 object-contain"
            />
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
            Stride Buddy
          </p>

          <h1 className="font-display text-4xl font-semibold leading-tight text-ink-900 md:text-5xl">
            Encouragement that finds them mid-run.
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base leading-7 text-ink-500">
            Stride Buddy lets athletes hear messages from the people who support
            them, right when they need the extra push.
          </p>

          <div className="mt-8 rounded-2xl border border-ink-100 bg-ink-50/60 px-5 py-4 text-left">
            <p className="text-sm font-medium text-ink-900">
              Ready to leave a message?
            </p>

            <p className="mt-1 text-sm leading-6 text-ink-500">
              Open the private invite link your athlete sent you. Each link
              connects your message directly to their workout.
            </p>
          </div>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-ink-100" />

            <span className="text-xs font-medium uppercase tracking-wider text-ink-300">
              Or
            </span>

            <div className="h-px flex-1 bg-ink-100" />
          </div>

          <div>
            <p className="text-base font-semibold text-ink-900">
              Are you an athlete?
            </p>

            <p className="mt-1 text-sm leading-6 text-ink-500">
              Get the Stride Buddy app and bring your supporters along for the
              run.
            </p>

            <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="#"
                aria-label="Download Stride Buddy on the App Store"
                className="flex min-h-20 flex-1 items-center justify-center gap-3 rounded-xl bg-ink-900 px-5 py-3 text-white transition hover:-translate-y-0.5 hover:opacity-90"
              >
                <FaApple
                  className="h-8 w-8 shrink-0"
                  aria-hidden="true"
                />

                <div className="text-left">
                  <span className="block text-xs font-medium leading-none">
                    Download on the
                  </span>

                  <span className="mt-1 block text-lg font-semibold leading-none">
                    App Store
                  </span>
                </div>
              </a>

              <a
                href="#"
                aria-label="Get Stride Buddy on Google Play"
                className="flex min-h-20 flex-1 items-center justify-center gap-3 rounded-xl bg-ink-900 px-5 py-3 text-white transition hover:-translate-y-0.5 hover:opacity-90"
              >
                <FaGooglePlay
                  className="h-7 w-7 shrink-0"
                  aria-hidden="true"
                />

                <div className="text-left">
                  <span className="block text-xs font-medium uppercase leading-none">
                    Get it on
                  </span>

                  <span className="mt-1 block whitespace-nowrap text-lg font-semibold leading-none">
                    Google Play
                  </span>
                </div>
              </a>
            </div>
          </div>

          <p className="mt-7 text-xs text-ink-300">
            Private supporter message portal · Powered by Stride Buddy
          </p>

        </div>
      </section>
    </main>
  );
}