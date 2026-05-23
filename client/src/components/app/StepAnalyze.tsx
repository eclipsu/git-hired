import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { languageColor } from '../../utils/languageColors';
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

function relativeTime(iso?: string): string {
  if (!iso) return 'recently';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 7) return `${days || 1} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

function RepoSkeleton() {
  return <div className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />;
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
        className="mt-1 w-full rounded border border-gray-200 px-2 py-1 text-xs"
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setEditing(true)}
      className="group mt-1 flex cursor-pointer items-center gap-1 text-left text-xs text-gray-500 hover:text-gray-900 disabled:cursor-not-allowed"
    >
      <span>{value}</span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100" />
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
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">Select projects</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose repositories to include on your resume.
          {fromCache && !loading && (
            <span className="ml-2 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-[#7C3AED]">
              Loaded from cache
            </span>
          )}
        </p>
      </div>

      {cacheHint && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {cacheHint}
        </div>
      )}

      <div className="space-y-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <RepoSkeleton key={i} />)
          : repos.map((repo) => (
              <label
                key={repo.name}
                className={`flex cursor-pointer items-start gap-4 rounded-xl border bg-white p-4 shadow-sm transition-all ${
                  repo.selected ? 'border-[#7C3AED] ring-1 ring-[#7C3AED]/20' : 'border-gray-200 hover:border-gray-300'
                } ${analyzing ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={repo.selected}
                  onChange={() => onToggle(repo.name)}
                  className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">{repo.name}</h3>
                    <span className="shrink-0 text-xs text-gray-400">Updated {relativeTime()}</span>
                  </div>
                  <EditableDisplayName
                    value={repo.displayName}
                    onChange={(v) => onDisplayNameChange(repo.name, v)}
                    disabled={analyzing}
                  />
                  <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                    {repo.description || 'No description available'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {repo.primaryLanguage && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                        style={{ backgroundColor: languageColor(repo.primaryLanguage) }}
                      >
                        {repo.primaryLanguage}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{repo.commitCount} commits · ★ {repo.stars}</span>
                  </div>
                </div>
              </label>
            ))}
      </div>

      <div className="fixed bottom-6 right-6 z-30">
        <button
          type="button"
          disabled={analyzing || selectedCount === 0 || loading}
          onClick={onAnalyze}
          className="btn-accent shadow-lg"
        >
          {analyzing ? 'Analyzing…' : `Generate Resume →`}
        </button>
      </div>
    </div>
  );
}
