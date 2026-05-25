import { useMemo, useState } from 'react';
import GitHubBox, { GitHubBoxHeader } from '../github/GitHubBox';
import GitHubButton from '../github/GitHubButton';
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
    items.forEach((b, i) => result.push({ ...b, id: `${repo}-${i}` }));
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
      if (!map.has(b.repo)) map.set(b.repo, { displayName: b.displayName, items: [] });
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
    while (next.length < clamped) next.push({ id: `${repo}-${next.length}`, text: '', repo, displayName, included: true });
    while (next.length > clamped) next.pop();
    onChange(reindexByRepo([...others, ...next]));
  };

  return (
    <div className="gh-container py-6">
      <div className="gh-page-header !border-0 !pb-4">
        <h2 className="gh-page-title !text-xl">Review bullets</h2>
        <p className="gh-page-desc">Edit bullets and add project context before tailoring.</p>
      </div>

      <div className="space-y-4">
        {grouped.map(([repo, { displayName, items }]) => {
          const meta = projectMeta[repo];
          const readme = meta?.readmeExcerpt ?? '';
          const showReadme = expandedReadme[repo] ?? false;

          return (
            <GitHubBox key={repo}>
              <GitHubBoxHeader
                title={displayName}
                action={
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[var(--gh-fg-muted)]">Bullets</span>
                    <GitHubButton variant="default" className="gh-btn-sm !px-2" disabled={items.length <= 1} onClick={() => setRepoCount(repo, displayName, items.length - 1)}>−</GitHubButton>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={items.length}
                      onChange={(e) => setRepoCount(repo, displayName, Number(e.target.value) || 1)}
                      className="gh-input w-12 !py-1 text-center text-sm"
                    />
                    <GitHubButton variant="default" className="gh-btn-sm !px-2" disabled={items.length >= 6} onClick={() => setRepoCount(repo, displayName, items.length + 1)}>+</GitHubButton>
                  </div>
                }
              />
              <p className="mb-3 text-xs text-[var(--gh-fg-muted)]">{repo}</p>
              {meta?.description && <p className="mb-3 text-sm">{meta.description}</p>}

              {readme && (
                <div className="mb-4 rounded-md border border-[var(--gh-border-muted)] bg-[var(--gh-canvas-subtle)] p-3">
                  <button type="button" onClick={() => setExpandedReadme((s) => ({ ...s, [repo]: !showReadme }))} className="flex w-full cursor-pointer items-center justify-between text-left text-xs font-semibold text-[var(--gh-fg-muted)]">
                    README excerpt
                    <span>{showReadme ? '▲' : '▼'}</span>
                  </button>
                  {showReadme && <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs">{readme}</pre>}
                </div>
              )}

              <label className="block">
                <span className="gh-form-label !text-xs">What does this project do?</span>
                <textarea
                  value={projectNotes[repo] ?? ''}
                  onChange={(e) => onProjectNotesChange(repo, e.target.value)}
                  rows={3}
                  placeholder="Brief description for the tailor step…"
                  className="gh-textarea mt-1"
                />
              </label>

              <ul className="mt-4 space-y-3">
                {items.map((b, idx) => (
                  <li key={b.id} className="flex gap-3">
                    <span className="mt-2.5 w-5 shrink-0 text-center text-xs text-[var(--gh-fg-subtle)]">{idx + 1}</span>
                    <input type="checkbox" checked={b.included} onChange={() => updateBullet(b.id, { included: !b.included })} className="gh-checkbox mt-2.5" />
                    <textarea
                      value={b.text}
                      onChange={(e) => updateBullet(b.id, { text: e.target.value })}
                      rows={2}
                      placeholder="Bullet point…"
                      className="gh-textarea min-h-[4rem] flex-1"
                    />
                    <GitHubButton variant="danger" className="gh-btn-sm !px-2" disabled={items.length <= 1} onClick={() => removeBullet(b.id)} aria-label="Delete">×</GitHubButton>
                  </li>
                ))}
              </ul>
            </GitHubBox>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--gh-border-muted)] pt-4">
        <p className="text-sm text-[var(--gh-fg-muted)]">{includedCount} bullets · 1 page target</p>
        <GitHubButton variant="primary" disabled={includedCount === 0} onClick={() => onContinue(bullets, projectNotes)}>
          Continue
        </GitHubButton>
      </div>
    </div>
  );
}
