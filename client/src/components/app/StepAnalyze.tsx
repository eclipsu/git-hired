import { useEffect, useState } from 'react';
import { AppFlash } from '../ui/AppBox';
import AppButton from '../ui/AppButton';
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
  return <div className="h-24 animate-pulse rounded-md border border-[var(--ui-border-default)] bg-[var(--ui-canvas-subtle)]" />;
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
        className="ui-input mt-1 !py-1 text-xs"
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setEditing(true)}
      className="mt-1 flex cursor-pointer items-center gap-1 text-left text-xs text-[var(--ui-fg-muted)] hover:text-[var(--ui-accent-fg)] disabled:opacity-50"
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
    <div className="ui-container-wide py-6">
      <div className="ui-page-header !border-0 !pb-4">
        <h2 className="ui-page-title !text-xl">Select repositories</h2>
        <p className="ui-page-desc">
          Choose which projects to include on your resume.
          {fromCache && !loading && <span className="ui-label ui-label-accent ml-2">Cached</span>}
        </p>
      </div>

      {cacheHint && <AppFlash variant="success">{cacheHint}</AppFlash>}

      <div className="space-y-2">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <RepoSkeleton key={i} />)
          : repos.map((repo) => (
              <label
                key={repo.name}
                className={`ui-box-row cursor-pointer ${repo.selected ? 'ui-box-row-selected' : ''} ${analyzing ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={repo.selected}
                  onChange={() => onToggle(repo.name)}
                  className="ui-checkbox mt-1"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--ui-accent-fg)]">{repo.name}</h3>
                    <span className="shrink-0 text-xs text-[var(--ui-fg-subtle)]">Updated {relativeTime()}</span>
                  </div>
                  <EditableDisplayName
                    value={repo.displayName}
                    onChange={(v) => onDisplayNameChange(repo.name, v)}
                    disabled={analyzing}
                  />
                  <p className="mt-1 line-clamp-1 text-xs text-[var(--ui-fg-muted)]">
                    {repo.description || 'No description'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--ui-fg-muted)]">
                    {repo.primaryLanguage && (
                      <span className="ui-label ui-label-default">{repo.primaryLanguage}</span>
                    )}
                    <span>{repo.commitCount} commits · ★ {repo.stars}</span>
                  </div>
                </div>
              </label>
            ))}
      </div>

      <div className="fixed bottom-6 right-6 z-30">
        <AppButton variant="primary" disabled={analyzing || selectedCount === 0 || loading} onClick={onAnalyze}>
          {analyzing ? 'Analyzing…' : `Analyze ${selectedCount} repos`}
        </AppButton>
      </div>
    </div>
  );
}
