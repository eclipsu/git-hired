function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function HeroNoiseOverlay() {
  return (
    <svg
      className="hero-noise h-full w-full"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="hero-noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.75"
          numOctaves="4"
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#hero-noise)" />
    </svg>
  );
}

function BeforeCard() {
  return (
    <div className="flex flex-col items-center">
      <div className="-rotate-3 rounded-2xl border border-black/[0.04] bg-white p-5 shadow-md shadow-black/[0.06]">
        <div className="h-2.5 w-16 rounded-sm bg-text-primary/70" />
        <div className="mt-4 space-y-2">
          <div className="h-1.5 w-28 rounded-full bg-text-muted/25" />
          <div className="h-1.5 w-24 rounded-full bg-text-muted/20" />
          <div className="h-1.5 w-20 rounded-full bg-text-muted/15" />
        </div>
      </div>
      <p className="mt-4 text-sm font-bold tracking-wide text-text-secondary uppercase">
        Before
      </p>
      <p className="mt-0.5 text-xs text-text-muted">Manual &amp; generic</p>
    </div>
  );
}

function AfterCard() {
  return (
    <div className="flex flex-col items-center">
      <div className="rotate-3 rounded-2xl border border-[#C5D5CB]/40 bg-[#E8EDE8] p-5 shadow-md shadow-[#5A7A6A]/10">
        <div className="h-2.5 w-full rounded-sm bg-[#5A7A6A]/80" />
        <div className="mt-4 space-y-2.5">
          {[28, 24, 20].map((width) => (
            <div key={width} className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#6B8F7A]/70" />
              <div
                className="h-1.5 rounded-full bg-[#5A7A6A]/35"
                style={{ width: `${width * 4}px` }}
              />
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm font-bold tracking-wide text-[#5A7A6A] uppercase">
        After
      </p>
      <p className="mt-0.5 text-xs text-[#6B8F7A]">Tailored &amp; impactful</p>
    </div>
  );
}

function BeforeAfterGraphic() {
  return (
    <div className="relative mx-auto w-full max-w-md select-none">
      <div
        className="before-after-shadow pointer-events-none absolute inset-x-8 bottom-0 h-10"
        aria-hidden="true"
      />

      <div className="before-after-float relative flex items-end justify-center gap-3 sm:gap-5">
        <BeforeCard />

        <svg
          className="mb-16 w-14 shrink-0 text-text-primary/50 sm:w-20"
          viewBox="0 0 80 40"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 28 C 28 8, 52 8, 76 28"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M70 22 L76 28 L70 34"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <AfterCard />
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="relative z-20 border-b border-black/[0.04] bg-white/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
          <span className="font-hero text-xl font-semibold text-text-primary">
            GitHired
          </span>

          <nav className="hidden items-center gap-8 text-sm text-text-secondary md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-text-primary">
              How it works
            </a>
            <a href="#features" className="transition-colors hover:text-text-primary">
              Features
            </a>
            <a href="#pricing" className="transition-colors hover:text-text-primary">
              Pricing
            </a>
            <a href="#blog" className="transition-colors hover:text-text-primary">
              Blog
            </a>
          </nav>

          <a
            href="/auth/github"
            className="rounded-lg bg-text-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-text-secondary"
          >
            Get Started
          </a>
        </div>
      </header>

      <main>
        <section className="hero-aurora relative overflow-hidden">
          <HeroNoiseOverlay />

          <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8EDE8] px-3 py-1 text-xs font-medium text-[#5A7A6A]">
                  <span aria-hidden="true">✨</span> AI-Powered
                </span>

                <h1 className="font-hero mt-6 text-4xl leading-[1.15] font-semibold tracking-tight text-text-primary sm:text-5xl lg:text-[3.25rem]">
                  Turn your GitHub into a{' '}
                  <em className="text-primary italic">job-winning</em> resume.
                </h1>

                <p className="mt-6 max-w-lg text-lg leading-relaxed text-text-secondary">
                  We analyze your code, commits, and projects to automatically create
                  ATS-optimized resumes that get you noticed.
                </p>

                <a
                  href="/auth/github"
                  className="mt-8 inline-flex items-center gap-2.5 rounded-xl bg-text-primary px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-text-secondary"
                >
                  <GitHubIcon className="h-5 w-5" />
                  Connect GitHub
                </a>

                <p className="mt-4 text-sm text-text-muted">No credit card required</p>
              </div>

              <div className="relative flex justify-center lg:justify-end">
                <BeforeAfterGraphic />
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-bg-card bg-bg-main py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-3 lg:px-8">
            {[
              { step: '1', title: 'Connect', desc: 'Sign in with GitHub OAuth' },
              {
                step: '2',
                title: 'Analyze',
                desc: 'Select repos and generate bullets with AI',
              },
              {
                step: '3',
                title: 'Generate',
                desc: 'Tailor, edit LaTeX, and export PDF',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-bg-card bg-bg-light p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-text-primary">{item.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
