import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
    { label: 'Repositories Analyzed', value: stats?.reposAnalyzed ?? 0, color: 'text-[#7C3AED]' },
    { label: 'Commits Analyzed', value: stats?.commitsAnalyzed ?? 0, color: 'text-emerald-600' },
    { label: 'Technologies Detected', value: stats?.technologiesDetected ?? 0, color: 'text-[#7C3AED]' },
    { label: 'Projects Selected', value: Object.values(selected).filter(Boolean).length, color: 'text-blue-600' },
  ];

  return (
    <div className="relative pb-20">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            <p className="mt-1 text-sm text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Top Projects Detected</h3>
          <Link to="/app" className="cursor-pointer text-sm font-medium text-[#7C3AED] hover:underline">View all</Link>
        </div>
        <ul className="space-y-3">
          {(stats?.topProjects ?? []).map((p) => (
            <li key={p.name} className="flex cursor-pointer items-start gap-4 rounded-xl border border-gray-100 p-4 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selected[p.name] ?? false}
                onChange={() => setSelected((s) => ({ ...s, [p.name]: !s[p.name] }))}
                className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-[#7C3AED]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  <span className="shrink-0 text-xs text-gray-400">Updated {relativeTime(p.updatedAt)}</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">{p.description || 'No description'}</p>
                {p.primaryLanguage && (
                  <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    {p.primaryLanguage}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="fixed bottom-6 right-6">
        <Link to="/app" className="btn-accent shadow-lg">Generate Resume →</Link>
      </div>
    </div>
  );
}
