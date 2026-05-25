import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import GitHubBox from '../components/github/GitHubBox';
import { GitHubLabel } from '../components/github/GitHubBox';
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
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/dashboard/stats', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: DashboardStats) => {
        setStats(data);
        const init: Record<string, boolean> = {};
        data.topProjects.forEach((p, i) => { init[p.name] = i < 3; });
        setSelected(init);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  const cards = [
    { label: 'Repositories', value: stats?.reposAnalyzed ?? 0 },
    { label: 'Commits analyzed', value: stats?.commitsAnalyzed ?? 0 },
    { label: 'Technologies', value: stats?.technologiesDetected ?? 0 },
    { label: 'Selected', value: Object.values(selected).filter(Boolean).length },
  ];

  return (
    <div className="pb-16">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <GitHubBox key={c.label}>
            <p className="text-2xl font-semibold text-[var(--gh-fg-default)]">{c.value}</p>
            <p className="mt-1 text-sm text-[var(--gh-fg-muted)]">{c.label}</p>
          </GitHubBox>
        ))}
      </div>

      <GitHubBox className="mt-6">
        <div className="gh-box-header">
          <h3 className="gh-box-title">Top repositories</h3>
          <Link to="/app" className="gh-link text-sm">View all</Link>
        </div>
        <ul className="divide-y divide-[var(--gh-border-muted)]">
          {(stats?.topProjects ?? []).map((p) => (
            <li key={p.name} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <input type="checkbox" checked={selected[p.name] ?? false} onChange={() => setSelected((s) => ({ ...s, [p.name]: !s[p.name] }))} className="gh-checkbox mt-1" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--gh-accent-fg)]">{p.name}</p>
                  <span className="shrink-0 text-xs text-[var(--gh-fg-subtle)]">{relativeTime(p.updatedAt)}</span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--gh-fg-muted)]">{p.description || 'No description'}</p>
                {p.primaryLanguage && <GitHubLabel variant="success">{p.primaryLanguage}</GitHubLabel>}
              </div>
            </li>
          ))}
        </ul>
      </GitHubBox>

      <div className="fixed bottom-6 right-6">
        <Link to="/app" className="btn-primary">Build resume</Link>
      </div>
    </div>
  );
}
