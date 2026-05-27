import { useEffect, useState } from 'react';
import { Check, ChevronRight, GitCommit, Star } from 'lucide-react';
import GlowButton from '../ui/GlowButton';
import LanguagePill from '../ui/LanguagePill';
import PageTopBar from '../ui/PageTopBar';
import type { RepoItem, UserProfile } from '../../hooks/useAppState';

interface StepAnalyzeProps {
  user: UserProfile | null;
  repos: RepoItem[];
  loading: boolean;
  analyzing: boolean;
  fromCache?: boolean;
  cacheHint?: string | null;
  onToggle: (name: string) => void;
  onDisplayNameChange: (name: string, displayName: string) => void;
  onAnalyze: () => void;
}

function RepoSkeleton() {
  return (
    <div className="h-28 animate-pulse rounded border border-border bg-card" />
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
        className="mt-1 w-full rounded border border-border bg-input px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-primary/60"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className="mt-1 text-xs font-mono text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
    >
      {value} ✎
    </button>
  );
}

export default function StepAnalyze({
  user,
  repos,
  loading,
  analyzing,
  fromCache,
  cacheHint,
  onToggle,
  onDisplayNameChange,
  onAnalyze,
}: StepAnalyzeProps) {
  const selected = repos.filter((r) => r.selected);
  const languages = new Set(repos.map((r) => r.primaryLanguage).filter(Boolean));
  const totalCommits = repos.reduce((sum, r) => sum + r.commitCount, 0);

  return (
    <div className="min-h-screen bg-background">
      <PageTopBar crumb="analyze" />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {user && (
          <div className="flex items-center gap-4 p-5 rounded border border-border bg-card mb-8">
            <img
              src={user.avatarUrl}
              alt=""
              className="w-12 h-12 rounded-full border-2 border-primary"
              style={{ boxShadow: '0 0 12px rgba(88,166,255,0.3)' }}
            />
            <div>
              <p className="font-mono font-semibold text-foreground">@{user.username}</p>
              <p className="text-xs text-muted-foreground font-mono">Connected via GitHub OAuth</p>
            </div>
            <div className="ml-auto flex items-center gap-6 text-sm font-mono">
              {[
                [String(repos.length), 'repos'],
                [String(languages.size), 'languages'],
                [totalCommits.toLocaleString(), 'commits'],
              ].map(([n, l]) => (
                <div key={l} className="text-center">
                  <p className="text-foreground font-semibold text-base">{n}</p>
                  <p className="text-muted-foreground text-xs">{l}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans font-semibold text-foreground">
            Select repositories to analyze
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            {selected.length} selected
            {fromCache && !loading && (
              <span className="ml-2 text-primary">· cached</span>
            )}
          </span>
        </div>

        {cacheHint && (
          <div className="mb-4 rounded border border-success/30 bg-success/10 px-4 py-3 text-sm text-success font-mono">
            {cacheHint}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-24">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <RepoSkeleton key={i} />)
            : repos.map((repo) => (
                <button
                  key={repo.name}
                  type="button"
                  onClick={() => onToggle(repo.name)}
                  disabled={analyzing}
                  className="text-left p-4 rounded border transition-all duration-150 cursor-pointer relative group disabled:opacity-60"
                  style={{
                    borderColor: repo.selected ? '#58A6FF' : '#30363D',
                    backgroundColor: repo.selected ? 'rgba(88,166,255,0.05)' : '#161B22',
                    boxShadow: repo.selected ? '0 0 0 1px rgba(88,166,255,0.3)' : 'none',
                  }}
                >
                  {repo.selected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check size={12} className="text-primary-foreground" />
                    </div>
                  )}
                  <p className="font-mono font-semibold text-foreground text-sm mb-1 pr-6">
                    {repo.name}
                  </p>
                  <EditableDisplayName
                    value={repo.displayName}
                    onChange={(v) => onDisplayNameChange(repo.name, v)}
                    disabled={analyzing}
                  />
                  {repo.primaryLanguage && (
                    <div className="mt-2">
                      <LanguagePill lang={repo.primaryLanguage} />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star size={11} /> {repo.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitCommit size={11} /> {repo.commitCount}
                    </span>
                  </div>
                </button>
              ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur px-8 py-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-mono">
          {selected.length} repo{selected.length !== 1 ? 's' : ''} selected
        </span>
        <GlowButton
          onClick={onAnalyze}
          disabled={analyzing || selected.length === 0 || loading}
          className="font-semibold"
        >
          Analyze {selected.length} repos
          <ChevronRight size={16} />
        </GlowButton>
      </div>
    </div>
  );
}
