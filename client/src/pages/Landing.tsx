import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DesignLogo from '../components/ui/DesignLogo';
import GlowButton from '../components/ui/GlowButton';
import GitHubIcon from '../components/ui/GitHubIcon';

interface PublicStats {
  resumesGenerated: number;
  atsPassRate: number;
  avgTimeMinutes: number;
}

function formatResumeCount(n: number): string {
  return `${n.toLocaleString()}${n >= 100 ? '+' : ''}`;
}

function formatAvgTime(minutes: number, hasData: boolean): string {
  if (!hasData) return '—';
  if (minutes <= 0) return '<1 min';
  return `${minutes} min`;
}

export default function Landing() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    fetch('/api/stats/public')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load stats');
        return res.json() as Promise<PublicStats>;
      })
      .then(setStats)
      .catch(() => setStatsError(true));
  }, []);

  const statItems =
    stats && !statsError
      ? [
          [formatResumeCount(stats.resumesGenerated), 'resumes generated'],
          [`${stats.atsPassRate}%`, 'ATS pass rate'],
          [
            formatAvgTime(stats.avgTimeMinutes, stats.resumesGenerated > 0),
            'avg time to resume',
          ],
        ]
      : null;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(48,54,61,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(48,54,61,0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(63,185,80,0.8) 2px, rgba(63,185,80,0.8) 3px)',
        }}
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(88,166,255,0.07) 0%, transparent 70%)' }}
      />

      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-border/50">
        <DesignLogo />
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
          >
            dashboard
          </Link>
          <Link to="/connect">
            <GlowButton variant="ghost" className="text-sm font-mono">
              sign in
            </GlowButton>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-mono mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          GitHub activity → ATS-ready resume
        </div>

        <h1
          className="font-display font-bold text-foreground mb-5 leading-[1.1] tracking-tight"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
        >
          Your GitHub history.
          <br />
          <span className="text-primary">Your next job.</span>
        </h1>

        <p className="text-muted-foreground text-lg max-w-xl mb-10 leading-relaxed">
          Connect your GitHub and we&apos;ll write your resume from your actual work — commits,
          PRs, and impact, turned into polished bullets that get past ATS.
        </p>

        <Link to="/connect">
          <GlowButton className="text-base px-6 py-3 font-semibold">
            <GitHubIcon size={18} />
            Connect GitHub
          </GlowButton>
        </Link>

        <p className="mt-5 text-xs text-muted-foreground font-mono">
          No card required. <span className="text-foreground/60">Free.</span> Your data stays yours.
        </p>

        {statItems ? (
          <div className="mt-16 flex items-center gap-8 text-sm font-mono">
            {statItems.map(([n, l]) => (
              <div key={l} className="flex flex-col items-center gap-1">
                <span className="text-foreground font-semibold text-xl">{n}</span>
                <span className="text-muted-foreground text-xs">{l}</span>
              </div>
            ))}
          </div>
        ) : !statsError ? (
          <div className="mt-16 flex items-center gap-8 text-sm font-mono">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="h-7 w-16 animate-pulse rounded bg-secondary" />
                <span className="h-3 w-24 animate-pulse rounded bg-secondary/60" />
              </div>
            ))}
          </div>
        ) : null}
      </main>

      <footer className="relative z-10 flex items-center justify-between px-8 py-4 border-t border-border/50 text-xs text-muted-foreground font-mono">
        <span>© 2026 GitApply</span>
        <div className="flex gap-4">
          <a href="https://github.com" className="hover:text-foreground transition-colors">github</a>
          <a href="#" className="hover:text-foreground transition-colors">privacy</a>
        </div>
      </footer>
    </div>
  );
}
