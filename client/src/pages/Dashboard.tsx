import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { GitCommit } from 'lucide-react';
import GlowButton from '../components/ui/GlowButton';
import LanguagePill from '../components/ui/LanguagePill';
import Spinner from '../components/ui/Spinner';

interface DashboardStats {
  reposAnalyzed: number;
  commitsAnalyzed: number;
  technologiesDetected: number;
  projectsSelected: number;
  topProjects: {
    name: string;
    description: string | null;
    primaryLanguage: string | null;
    updatedAt: string;
  }[];
}

function relativeTime(iso: string): string {
  const weeks = Math.floor((Date.now() - new Date(iso).getTime()) / (7 * 86400000));
  return weeks <= 1 ? '1 week ago' : `${weeks} weeks ago`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: DashboardStats) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const cards = [
    { label: 'Repositories', value: stats?.reposAnalyzed ?? 0 },
    { label: 'Commits analyzed', value: stats?.commitsAnalyzed ?? 0 },
    { label: 'Technologies', value: stats?.technologiesDetected ?? 0 },
    { label: 'Projects', value: stats?.topProjects?.length ?? 0 },
  ];

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="rounded border border-border bg-card p-4">
            <p className="text-2xl font-semibold text-foreground font-mono">{c.value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground font-mono uppercase tracking-widest">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
          Top repositories
        </h2>
        <Link to="/app" className="text-xs font-mono text-primary hover:underline">
          View all →
        </Link>
      </div>

      <div className="space-y-2">
        {(stats?.topProjects ?? []).map((p) => (
          <div
            key={p.name}
            className="flex items-start gap-4 p-4 rounded border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-sm font-semibold text-foreground">{p.name}</p>
                <span className="shrink-0 text-xs text-muted-foreground font-mono">{relativeTime(p.updatedAt)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.description || 'No description'}</p>
              {p.primaryLanguage && (
                <div className="mt-2">
                  <LanguagePill lang={p.primaryLanguage} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Link to="/app">
          <GlowButton className="font-semibold">
            <GitCommit size={14} />
            Build resume
          </GlowButton>
        </Link>
      </div>
    </div>
  );
}
