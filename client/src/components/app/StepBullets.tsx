import { useMemo } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { BulletItem } from '../../hooks/useAppState';

interface StepBulletsProps {
  bullets: BulletItem[];
  onChange: (bullets: BulletItem[]) => void;
  onContinue: (bullets: BulletItem[]) => void | Promise<void>;
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

export default function StepBullets({ bullets, onChange, onContinue }: StepBulletsProps) {
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

  const addBullet = (repo: string, displayName: string) => {
    const repoBullets = bullets.filter((b) => b.repo === repo);
    onChange(
      reindexByRepo([
        ...bullets,
        {
          id: `${repo}-${repoBullets.length}`,
          text: '',
          repo,
          displayName,
          included: true,
        },
      ]),
    );
  };

  const setRepoCount = (repo: string, displayName: string, target: number) => {
    const repoBullets = bullets.filter((b) => b.repo === repo);
    const others = bullets.filter((b) => b.repo !== repo);
    const clamped = Math.max(0, Math.min(6, target));

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
        <h2 className="text-2xl font-semibold text-gray-900">Review bullet points</h2>
        <p className="mt-1 text-sm text-gray-500">
          Edit, add, or remove bullets before tailoring. Focus on impact — not file counts.
        </p>
      </div>

      <div className="space-y-6">
        {grouped.map(([repo, { displayName, items }]) => (
          <section key={repo} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">{displayName}</h3>
                <p className="text-xs text-gray-400">{repo}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Bullets</span>
                <button
                  type="button"
                  onClick={() => setRepoCount(repo, displayName, items.length - 1)}
                  disabled={items.length === 0}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Remove bullet slot"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-sm font-semibold text-gray-900">{items.length}</span>
                <button
                  type="button"
                  onClick={() => setRepoCount(repo, displayName, items.length + 1)}
                  disabled={items.length >= 6}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Add bullet slot"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <ul className="mt-4 space-y-3">
              {items.map((b) => (
                <li key={b.id} className="flex gap-3">
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
                    placeholder="Write or edit a bullet point…"
                    className="min-h-[4rem] flex-1 resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#7C3AED]/50 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeBullet(b.id)}
                    className="mt-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete bullet"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            {items.length < 6 && (
              <button
                type="button"
                onClick={() => addBullet(repo, displayName)}
                className="mt-3 cursor-pointer text-sm font-medium text-[#7C3AED] hover:underline"
              >
                + Add bullet
              </button>
            )}
          </section>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {includedCount} bullet{includedCount === 1 ? '' : 's'} included
        </p>
        <button
          type="button"
          disabled={includedCount === 0}
          onClick={() => onContinue(bullets)}
          className="btn-accent"
        >
          Continue to tailor →
        </button>
      </div>
    </div>
  );
}
