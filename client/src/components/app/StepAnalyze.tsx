import { useEffect, useState } from 'react';
import { GitHubFlash } from '../github/GitHubBox';
import GitHubButton from '../github/GitHubButton';
import type { RepoItem } from '../../hooks/useAppState';

interface StepAnalyzeProps {
  repos: RepoItem[];
  loading: boolean;
  analyzing: boolean;
  fromCache?: boolean;
  cacheHint?: string | null;
  onToggle: (name: string) => void;
  onDisplayNameChange: (name: string, displayName: string) => void;
  onAnalyze: () => void;
}

function relativeTime(): string {
  return 'recently';
}

function RepoSkeleton() {
  return <div className="h-24 animate-pulse rounded-md border border-[var(--gh-border-default)] bg-[var(--gh-canvas-subtle)]" />;
}

function EditableDisplayName({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  if (editing && !disabled) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft.trim() || value); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        className="gh-input mt-1 !py-1 text-xs"
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setEditing(true)}
      className="mt-1 flex cursor-pointer items-center gap-1 text-left text-xs text-[var(--gh-fg-muted)] hover:text-[var(--gh-accent-fg)] disabled:opacity-50"
    >
      {value} <span className="opacity-60">✎</span>
    </button>
  );
}

export default function StepAnalyze({
  repos,
  loading,
  analyzing,
  fromCache,
  cacheHint,
  onToggle,
  onDisplayNameChange,
  onAnalyze,
}: StepAnalyzeProps) {
  const selectedCount = repos.filter((r) => r.selected).length;

  return (
    <div className="gh-container-wide py-6">
      <div className="gh-page-header !border-0 !pb-4">
        <h2 className="gh-page-title !text-xl">Select repositories</h2>
        <p className="gh-page-desc">
          Choose which projects to include on your resume.
          {fromCache && !loading && <span className="gh-label gh-label-accent ml-2">Cached</span>}
        </p>
      </div>

      {cacheHint && <GitHubFlash variant="success">{cacheHint}</GitHubFlash>}

      <div className="space-y-2">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <RepoSkeleton key={i} />)
          : repos.map((repo) => (
              <label
                key={repo.name}
                className={`gh-box-row cursor-pointer ${repo.selected ? 'gh-box-row-selected' : ''} ${analyzing ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={repo.selected}
                  onChange={() => onToggle(repo.name)}
                  className="gh-checkbox mt-1"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--gh-accent-fg)]">{repo.name}</h3>
                    <span className="shrink-0 text-xs text-[var(--gh-fg-subtle)]">Updated {relativeTime()}</span>
                  </div>
                  <EditableDisplayName
                    value={repo.displayName}
                    onChange={(v) => onDisplayNameChange(repo.name, v)}
                    disabled={analyzing}
                  />
                  <p className="mt-1 line-clamp-1 text-xs text-[var(--gh-fg-muted)]">
                    {repo.description || 'No description'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--gh-fg-muted)]">
                    {repo.primaryLanguage && (
                      <span className="gh-label gh-label-default">{repo.primaryLanguage}</span>
                    )}
                    <span>{repo.commitCount} commits · ★ {repo.stars}</span>
                  </div>
                </div>
              </label>
            ))}
      </div>

      <div className="fixed bottom-6 right-6 z-30">
        <GitHubButton variant="primary" disabled={analyzing || selectedCount === 0 || loading} onClick={onAnalyze}>
          {analyzing ? 'Analyzing…' : `Analyze ${selectedCount} repos`}
        </GitHubButton>
      </div>
    </div>
  );
}
