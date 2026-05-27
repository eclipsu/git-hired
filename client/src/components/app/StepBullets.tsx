import { useMemo, useState } from 'react';
import { Check, ChevronRight, Copy } from 'lucide-react';
import GlowButton from '../ui/GlowButton';
import PageTopBar from '../ui/PageTopBar';
import { copyToClipboard } from '../../utils/clipboard';
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);
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

  const copyBullet = async (text: string, id: string) => {
    await copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAll = async () => {
    const all = bullets
      .filter((b) => b.included)
      .map((b) => `• ${b.text}`)
      .join('\n');
    await copyToClipboard(all);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageTopBar crumb="review bullets" />

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-sans font-bold text-2xl text-foreground">Your resume bullets</h1>
          <GlowButton onClick={copyAll} variant="ghost" className="text-sm font-mono">
            {allCopied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            {allCopied ? 'Copied!' : 'Copy all'}
          </GlowButton>
        </div>

        <div className="space-y-8">
          {grouped.map(([repo, { displayName, items }]) => {
            const meta = projectMeta[repo];
            const readme = meta?.readmeExcerpt ?? '';
            const showReadme = expandedReadme[repo] ?? false;

            return (
              <div key={repo}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-sm text-muted-foreground font-semibold">
                    {displayName}
                  </span>
                </div>

                {meta?.description && (
                  <p className="text-xs text-muted-foreground mb-3 font-mono">{meta.description}</p>
                )}

                {readme && (
                  <div className="mb-4 rounded border border-border bg-secondary p-3">
                    <button
                      type="button"
                      onClick={() => setExpandedReadme((s) => ({ ...s, [repo]: !showReadme }))}
                      className="flex w-full cursor-pointer items-center justify-between text-left text-xs font-mono text-muted-foreground"
                    >
                      README excerpt
                      <span>{showReadme ? '▲' : '▼'}</span>
                    </button>
                    {showReadme && (
                      <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs text-foreground/80">
                        {readme}
                      </pre>
                    )}
                  </div>
                )}

                <label className="block mb-4">
                  <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                    What does this project do?
                  </span>
                  <textarea
                    value={projectNotes[repo] ?? ''}
                    onChange={(e) => onProjectNotesChange(repo, e.target.value)}
                    rows={2}
                    placeholder="Brief description for the tailor step…"
                    className="mt-2 w-full rounded border border-border bg-card text-foreground text-sm font-sans p-3 resize-none placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                  />
                </label>

                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-4 rounded border border-border bg-card transition-opacity"
                      style={{ opacity: item.included ? 1 : 0.4 }}
                    >
                      <button
                        type="button"
                        onClick={() => updateBullet(item.id, { included: !item.included })}
                        className="mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer"
                        style={{
                          borderColor: item.included ? '#58A6FF' : '#30363D',
                          backgroundColor: item.included ? '#58A6FF' : 'transparent',
                        }}
                      >
                        {item.included && <Check size={10} className="text-primary-foreground" />}
                      </button>
                      <textarea
                        value={item.text}
                        onChange={(e) => updateBullet(item.id, { text: e.target.value })}
                        rows={2}
                        className="flex-1 bg-transparent text-sm font-sans leading-relaxed resize-none focus:outline-none"
                        style={{
                          color: item.included ? '#E6EDF3' : '#8B949E',
                          textDecoration: item.included ? 'none' : 'line-through',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => copyBullet(item.text, item.id)}
                        className="flex-shrink-0 p-1 rounded hover:bg-secondary transition-colors cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <Check size={14} className="text-success" />
                        ) : (
                          <Copy size={14} className="text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-mono">
            {includedCount} bullets selected
          </p>
          <GlowButton
            onClick={() => onContinue(bullets, projectNotes)}
            disabled={includedCount === 0}
            className="font-semibold"
          >
            Continue
            <ChevronRight size={16} />
          </GlowButton>
        </div>
      </div>
    </div>
  );
}
