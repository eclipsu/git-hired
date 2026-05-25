import { Link } from 'react-router-dom';
import GitHubHeader from '../components/github/GitHubHeader';
import GitHubBox from '../components/github/GitHubBox';
import { GitHubLabel } from '../components/github/GitHubBox';
import { ghBtnClass } from '../components/github/GitHubButton';

const STEPS = [
  { icon: '🔗', title: 'Connect', desc: 'Link your GitHub account securely with OAuth.' },
  { icon: '🔍', title: 'Analyze', desc: 'We read commits, PRs, and project structure.' },
  { icon: '📄', title: 'Generate', desc: 'Export an ATS-optimized resume as LaTeX or PDF.' },
];

function ResumeMockup() {
  return (
    <GitHubBox className="relative mx-auto max-w-md">
      <div className="border-b border-[var(--gh-border-muted)] pb-4">
        <div className="h-3 w-32 rounded bg-[var(--gh-fg-default)]" />
        <div className="mt-2 h-2 w-24 rounded bg-[var(--gh-neutral-muted)]" />
      </div>
      <div className="mt-4 space-y-2">
        {[100, 85, 70].map((w) => (
          <div key={w} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gh-accent-emphasis)]" />
            <div className="h-2 rounded bg-[var(--gh-canvas-subtle)]" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <GitHubLabel variant="accent">TypeScript</GitHubLabel>
        <GitHubLabel variant="success">Node.js</GitHubLabel>
      </div>
    </GitHubBox>
  );
}

export default function Landing() {
  return (
    <div className="gh-page">
      <GitHubHeader
        right={
          <>
            <a href="#how-it-works" className="hidden text-sm text-white/70 hover:text-white md:inline">How it works</a>
            <Link to="/connect" className={`${ghBtnClass('primary')} gh-btn-sm`}>
              Sign in
            </Link>
          </>
        }
      />

      <main className="gh-page-muted">
        <section className="gh-container py-16 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <GitHubLabel variant="accent">AI-powered</GitHubLabel>
              <h1 className="mt-4 text-[32px] font-semibold leading-tight text-[var(--gh-fg-default)] lg:text-[40px]">
                Turn your GitHub into a job-winning resume
              </h1>
              <p className="mt-4 max-w-lg text-[var(--gh-fg-muted)]">
                Analyze repositories, commits, and pull requests to build ATS-optimized resumes — the same way recruiters scan your profile.
              </p>
              <Link to="/connect" className={`${ghBtnClass('primary')} mt-6`}>
                Connect with GitHub
              </Link>
              <p className="mt-3 text-sm text-[var(--gh-fg-subtle)]">Free · No credit card</p>
            </div>
            <ResumeMockup />
          </div>
        </section>

        <section id="how-it-works" className="border-t border-[var(--gh-border-default)] py-16">
          <div className="gh-container grid gap-4 md:grid-cols-3">
            {STEPS.map((item) => (
              <GitHubBox key={item.title}>
                <span className="text-2xl">{item.icon}</span>
                <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--gh-fg-muted)]">{item.desc}</p>
              </GitHubBox>
            ))}
          </div>
        </section>

        <section className="py-16">
          <div className="gh-container text-center">
            <h2 className="text-xl font-semibold">Built for developers who ship</h2>
            <p className="mt-2 text-sm text-[var(--gh-fg-muted)]">
              From GitHub activity to interview-ready PDF in minutes.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
