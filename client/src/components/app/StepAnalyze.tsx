import { useEffect, useState } from 'react';
import { languageColor } from '../../utils/languageColors';
import type { RepoItem } from '../../hooks/useAppState';

const PROGRESS_MESSAGES = [
  'Fetching commits...',
  'Reading pull requests...',
  'Analyzing contributions...',
  'Writing bullet points...',
];

interface StepAnalyzeProps {
  repos: RepoItem[];
  loading: boolean;
  analyzing: boolean;
  onToggle: (name: string) => void;
  onDisplayNameChange: (name: string, displayName: string) => void;
  onAnalyze: () => void;
}

function RepoSkeleton() {
  return (
    <div className="app-card animate-pulse p-5">
      <div className="h-4 w-32 rounded bg-[#E8E8E4]" />
      <div className="mt-3 h-3 w-20 rounded bg-[#E8E8E4]" />
      <div className="mt-4 h-3 w-full rounded bg-[#E8E8E4]" />
    </div>
  );
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
        onBlur={() => {
          onChange(draft.trim() || value);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        className="mt-2 w-full rounded border border-[#E8E8E4] px-2 py-1 text-sm"
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setEditing(true)}
      className="group mt-2 flex items-center gap-1 text-left text-sm text-[#64748B] hover:text-[#334155]"
    >
      <span>{value}</span>
      <span className="opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true">
        ✎
      </span>
    </button>
  );
}

export default function StepAnalyze({
  repos,
  loading,
  analyzing,
  onToggle,
  onDisplayNameChange,
  onAnalyze,
}: StepAnalyzeProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const selectedCount = repos.filter((r) => r.selected).length;

  useEffect(() => {
    if (!analyzing) return undefined;
    setMsgIndex(0);
    const t = setInterval(
      () => setMsgIndex((i) => (i + 1) % PROGRESS_MESSAGES.length),
      1200,
    );
    return () => clearInterval(t);
  }, [analyzing]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
      <h2 className="text-2xl font-semibold text-[#1a1a1a]">Select repositories</h2>
      <p className="mt-1 text-sm text-[#64748B]">
        Pick projects to analyze. Rename them for your resume.
      </p>

      {analyzing && (
        <div className="app-card mt-6 flex items-center gap-3 px-4 py-3">
          <svg className="h-5 w-5 animate-spin text-[#5A7A6A]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="analysis-message text-sm font-medium">{PROGRESS_MESSAGES[msgIndex]}</span>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <RepoSkeleton key={i} />)
          : repos.map((repo) => (
              <button
                key={repo.name}
                type="button"
                disabled={analyzing}
                onClick={() => onToggle(repo.name)}
                className={`app-card relative p-5 text-left transition-all ${
                  repo.selected
                    ? 'border-[#8BA888] ring-1 ring-[#8BA888]/40'
                    : ''
                } ${analyzing ? 'opacity-60' : 'hover:shadow-md'}`}
              >
                {repo.selected && (
                  <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#8BA888] text-xs text-white">
                    ✓
                  </span>
                )}
                <h3 className="font-medium text-[#1a1a1a]">{repo.name}</h3>
                <EditableDisplayName
                  value={repo.displayName}
                  onChange={(v) => onDisplayNameChange(repo.name, v)}
                  disabled={analyzing}
                />
                {repo.primaryLanguage && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#64748B]">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: languageColor(repo.primaryLanguage) }}
                    />
                    {repo.primaryLanguage}
                  </div>
                )}
                <div className="mt-3 flex gap-3 text-xs text-[#64748B]">
                  <span>★ {repo.stars}</span>
                  <span>{repo.commitCount} commits</span>
                </div>
              </button>
            ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          disabled={analyzing || selectedCount === 0}
          onClick={onAnalyze}
          className="rounded-xl bg-[#1a1a1a] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {analyzing ? 'Analyzing...' : 'Analyze selected repos'}
        </button>
      </div>
    </div>
  );
}
