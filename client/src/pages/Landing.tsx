import { Link } from 'react-router-dom';
import AppHeader from '../components/ui/AppHeader';
import AppBox from '../components/ui/AppBox';
import { AppLabel } from '../components/ui/AppBox';
import { uiBtnClass } from '../components/ui/AppButton';

const STEPS = [
  { icon: '🔗', title: 'Connect', desc: 'Link your GitHub account securely with OAuth.' },
  { icon: '🔍', title: 'Analyze', desc: 'We read commits, PRs, and project structure.' },
  { icon: '📄', title: 'Generate', desc: 'Export an ATS-optimized resume as LaTeX or PDF.' },
];

function ResumeMockup() {
  return (
    <AppBox className="relative mx-auto max-w-md">
      <div className="border-b border-[var(--ui-border-muted)] pb-4">
        <div className="h-3 w-32 rounded bg-[var(--ui-fg-default)]" />
        <div className="mt-2 h-2 w-24 rounded bg-[var(--ui-neutral-muted)]" />
      </div>
      <div className="mt-4 space-y-2">
        {[100, 85, 70].map((w) => (
          <div key={w} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ui-accent-emphasis)]" />
            <div className="h-2 rounded bg-[var(--ui-canvas-subtle)]" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <AppLabel variant="accent">TypeScript</AppLabel>
        <AppLabel variant="success">Node.js</AppLabel>
      </div>
    </AppBox>
  );
}

export default function Landing() {
  return (
    <div className="ui-page">
      <AppHeader
        right={
          <>
            <a href="#how-it-works" className="hidden text-sm text-white/70 hover:text-white md:inline">How it works</a>
            <Link to="/connect" className={`${uiBtnClass('primary')} ui-btn-sm`}>
              Sign in
            </Link>
          </>
        }
      />

      <main className="ui-page-muted">
        <section className="ui-container py-16 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <AppLabel variant="accent">AI-powered</AppLabel>
              <h1 className="mt-4 text-[32px] font-semibold leading-tight text-[var(--ui-fg-default)] lg:text-[40px]">
                Turn your GitHub into a job-winning resume
              </h1>
              <p className="mt-4 max-w-lg text-[var(--ui-fg-muted)]">
                Analyze repositories, commits, and pull requests to build ATS-optimized resumes — the same way recruiters scan your profile.
              </p>
              <Link to="/connect" className={`${uiBtnClass('primary')} mt-6`}>
                Connect with GitHub
              </Link>
              <p className="mt-3 text-sm text-[var(--ui-fg-subtle)]">Free · No credit card</p>
            </div>
            <ResumeMockup />
          </div>
        </section>

        <section id="how-it-works" className="border-t border-[var(--ui-border-default)] py-16">
          <div className="ui-container grid gap-4 md:grid-cols-3">
            {STEPS.map((item) => (
              <AppBox key={item.title}>
                <span className="text-2xl">{item.icon}</span>
                <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--ui-fg-muted)]">{item.desc}</p>
              </AppBox>
            ))}
          </div>
        </section>

        <section className="py-16">
          <div className="ui-container text-center">
            <h2 className="text-xl font-semibold">Built for developers who ship</h2>
            <p className="mt-2 text-sm text-[var(--ui-fg-muted)]">
              From GitHub activity to interview-ready PDF in minutes.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
