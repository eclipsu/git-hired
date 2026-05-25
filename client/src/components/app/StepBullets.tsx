import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Minus, Plus, Trash2 } from 'lucide-react';
import type { BulletItem, ProjectMeta } from '../../hooks/useAppState';

interface StepBulletsProps {
  bullets: BulletItem[];
  projectMeta: Record<string, ProjectMeta>;
  projectNotes: Record<string, string>;
  onProjectNotesChange: (repo: string, notes: string) => void;
  onChange: (bullets: BulletItem[]) => void;
  onContinue: (bullets: BulletItem[], projectNotes: Record<string, string>) => void | Promise<void>;
}

function reindexByRepo(bullets: BulletItem[]): BulletItem[] {
  const groups = new Map<string, BulletItem[]>();
  for (const b of bullets) {
    if (!groups.has(b.repo)) groups.set(b.repo, []);
    groups.get(b.repo)!.push(b);
  }

  const result: BulletItem[] = [];
  for (const [repo, items] of groups) {
    items.forEach((b, i) => {
      result.push({ ...b, id: `${repo}-${i}` });
    });
  }
  return result;
}

export default function StepBullets({
  bullets,
  projectMeta,
  projectNotes,
  onProjectNotesChange,
  onChange,
  onContinue,
}: StepBulletsProps) {
  const [expandedReadme, setExpandedReadme] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const map = new Map<string, { displayName: string; items: BulletItem[] }>();
    for (const b of bullets) {
      if (!map.has(b.repo)) {
        map.set(b.repo, { displayName: b.displayName, items: [] });
      }
      map.get(b.repo)!.items.push(b);
    }
    return [...map.entries()];
  }, [bullets]);

  const includedCount = bullets.filter((b) => b.included && b.text.trim()).length;

  const updateBullet = (id: string, patch: Partial<BulletItem>) => {
    onChange(reindexByRepo(bullets.map((b) => (b.id === id ? { ...b, ...patch } : b))));
  };

  const removeBullet = (id: string) => {
    onChange(reindexByRepo(bullets.filter((b) => b.id !== id)));
  };

  const setRepoCount = (repo: string, displayName: string, target: number) => {
    const repoBullets = bullets.filter((b) => b.repo === repo);
    const others = bullets.filter((b) => b.repo !== repo);
    const clamped = Math.max(1, Math.min(6, target));

    let next = [...repoBullets];
    while (next.length < clamped) {
      next.push({
        id: `${repo}-${next.length}`,
        text: '',
        repo,
        displayName,
        included: true,
      });
    }
    while (next.length > clamped) {
      next.pop();
    }

    onChange(reindexByRepo([...others, ...next]));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Review projects & bullets</h2>
        <p className="mt-1 text-sm text-gray-500">
          Set how many bullets per project, describe what each project does, then edit bullets before tailoring.
        </p>
      </div>

      <div className="space-y-6">
        {grouped.map(([repo, { displayName, items }]) => {
          const meta = projectMeta[repo];
          const readme = meta?.readmeExcerpt ?? '';
          const showReadme = expandedReadme[repo] ?? false;

          return (
            <section key={repo} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{displayName}</h3>
                  <p className="text-xs text-gray-400">{repo}</p>
                  {meta?.description && (
                    <p className="mt-1 text-sm text-gray-600">{meta.description}</p>
                  )}
                </div>

                <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bullets</span>
                  <button
                    type="button"
                    onClick={() => setRepoCount(repo, displayName, items.length - 1)}
                    disabled={items.length <= 1}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Fewer bullets"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={items.length}
                    onChange={(e) => setRepoCount(repo, displayName, Number(e.target.value) || 1)}
                    className="w-12 rounded-md border border-gray-200 bg-white py-1 text-center text-sm font-semibold text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setRepoCount(repo, displayName, items.length + 1)}
                    disabled={items.length >= 6}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="More bullets"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </label>
              </div>

              {readme && (
                <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <button
                    type="button"
                    onClick={() => setExpandedReadme((s) => ({ ...s, [repo]: !showReadme }))}
                    className="flex w-full cursor-pointer items-center justify-between text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    README excerpt (from GitHub)
                    {showReadme ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {showReadme && (
                    <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap font-sans text-xs text-gray-600">
                      {readme}
                    </pre>
                  )}
                </div>
              )}

              <label className="mt-4 block">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  What does this project do? (helps tailor your resume)
                </span>
                <textarea
                  value={projectNotes[repo] ?? ''}
                  onChange={(e) => onProjectNotesChange(repo, e.target.value)}
                  rows={3}
                  placeholder="e.g. Full-stack job tracker with GitHub OAuth, PostgreSQL, and AI resume tailoring…"
                  className="mt-1 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#7C3AED]/50 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </label>

              <ul className="mt-4 space-y-3">
                {items.map((b, idx) => (
                  <li key={b.id} className="flex gap-3">
                    <span className="mt-2.5 w-5 shrink-0 text-center text-xs font-medium text-gray-400">{idx + 1}</span>
                    <input
                      type="checkbox"
                      checked={b.included}
                      onChange={() => updateBullet(b.id, { included: !b.included })}
                      className="mt-2.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-[#7C3AED]"
                      title="Include in resume"
                    />
                    <textarea
                      value={b.text}
                      onChange={(e) => updateBullet(b.id, { text: e.target.value })}
                      rows={2}
                      placeholder="Edit bullet point…"
                      className="min-h-[4rem] flex-1 resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#7C3AED]/50 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeBullet(b.id)}
                      disabled={items.length <= 1}
                      className="mt-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      aria-label="Delete bullet"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          {includedCount} bullet{includedCount === 1 ? '' : 's'} included · resume targets <strong>1 page</strong>
        </p>
        <button
          type="button"
          disabled={includedCount === 0}
          onClick={() => onContinue(bullets, projectNotes)}
          className="btn-accent"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
