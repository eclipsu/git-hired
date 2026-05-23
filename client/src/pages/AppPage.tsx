import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBackground from '../components/app/AppBackground';
import AppNav from '../components/app/AppNav';
import StepAnalyze from '../components/app/StepAnalyze';
import StepEnrich from '../components/app/StepEnrich';
import StepTailor from '../components/app/StepTailor';
import StepExport from '../components/app/StepExport';
import {
  STEP_ORDER,
  useAppState,
  type AppStep,
  type BulletItem,
  type RepoItem,
} from '../hooks/useAppState';
import { computeAtsMatch } from '../utils/atsMatch';

function stepIndex(step: AppStep): number {
  return STEP_ORDER.indexOf(step);
}

function bulletsFromResponse(
  raw: Record<string, string[]>,
  displayNames: Record<string, string>,
): BulletItem[] {
  const items: BulletItem[] = [];
  Object.entries(raw).forEach(([repo, texts]) => {
    texts.forEach((text, i) => {
      items.push({
        id: `${repo}-${i}`,
        text,
        repo,
        displayName: displayNames[repo] ?? repo,
        included: true,
      });
    });
  });
  console.log('[app] Bullets loaded:', items.length);
  return items;
}

export default function AppPage() {
  const navigate = useNavigate();
  const { state, setStep, patch } = useAppState();
  const [reposLoading, setReposLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedSteps = useMemo(() => {
    const idx = stepIndex(state.step);
    return STEP_ORDER.slice(0, idx);
  }, [state.step]);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          navigate('/');
          return null;
        }
        return res.json();
      })
      .then((user) => {
        if (user) patch({ user, step: 'analyze' });
      })
      .catch(() => navigate('/'));
  }, [navigate, patch]);

  useEffect(() => {
    if (!state.user) return;
    setReposLoading(true);
    fetch('/api/repos', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load repositories');
        return res.json() as Promise<
          {
            name: string;
            description: string | null;
            primaryLanguage: string | null;
            stars: number;
            commitCount: number;
          }[]
        >;
      })
      .then((data) => {
        const repos: RepoItem[] = data.map((r, i) => ({
          ...r,
          displayName: r.name,
          selected: i < 6,
        }));
        patch({ repos });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setReposLoading(false));
  }, [state.user, patch]);

  const toggleRepo = useCallback(
    (name: string) => {
      patch({
        repos: state.repos.map((r) =>
          r.name === name ? { ...r, selected: !r.selected } : r,
        ),
      });
    },
    [patch, state.repos],
  );

  const setDisplayName = useCallback(
    (name: string, displayName: string) => {
      patch({
        repos: state.repos.map((r) =>
          r.name === name ? { ...r, displayName } : r,
        ),
      });
    },
    [patch, state.repos],
  );

  const handleAnalyze = async () => {
    const selected = state.repos.filter((r) => r.selected);
    if (selected.length === 0) return;

    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repos: selected.map((r) => ({ name: r.name, displayName: r.displayName })),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Analysis failed');
      }

      const { bullets, displayNames } = (await res.json()) as {
        bullets: Record<string, string[]>;
        displayNames: Record<string, string>;
      };

      const items = bulletsFromResponse(bullets, displayNames);
      patch({ bullets: items });
      setStep('enrich');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleParseResume = async (file: File) => {
    setParsing(true);
    setError(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Parse failed');
      }
      const { text, filename } = (await res.json()) as { text: string; filename: string };
      patch({ parsedResume: { text, filename } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed');
    } finally {
      setParsing(false);
    }
  };

  const handleTailor = async () => {
    setGenerating(true);
    setError(null);
    const bulletText = state.bullets.filter((b) => b.included).map((b) => b.text).join(' ');
    const atsMatchPercent = computeAtsMatch(state.jobDescription, bulletText);

    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullets: state.bullets,
          notes: state.notes,
          parsedResumeText: state.parsedResume?.text,
          jobDescription: state.jobDescription,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Tailor failed');
      }

      const { generatedTex } = (await res.json()) as { generatedTex: string };
      patch({
        generatedTex,
        originalTex: generatedTex,
        atsMatchPercent,
      });
      setStep('export');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tailor failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleCompile = async (tex: string): Promise<Blob> => {
    const res = await fetch('/api/compile', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tex }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? 'Compile failed');
    }

    return res.blob();
  };

  const transitionClass = 'animate-step-in';

  return (
    <AppBackground>
      <AppNav current={state.step} completed={completedSteps} />

      {error && (
        <div className="mx-auto max-w-4xl px-4 pt-4">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      <div key={state.step} className={transitionClass}>
        {state.step === 'analyze' && (
          <StepAnalyze
            repos={state.repos}
            loading={reposLoading}
            analyzing={analyzing}
            onToggle={toggleRepo}
            onDisplayNameChange={setDisplayName}
            onAnalyze={handleAnalyze}
          />
        )}

        {state.step === 'enrich' && (
          <StepEnrich
            bullets={state.bullets}
            notes={state.notes}
            parsedResume={state.parsedResume}
            parsing={parsing}
            onToggleBullet={(id) =>
              patch({
                bullets: state.bullets.map((b) =>
                  b.id === id ? { ...b, included: !b.included } : b,
                ),
              })
            }
            onNotesChange={(notes) => patch({ notes })}
            onFileSelect={handleParseResume}
            onContinue={() => setStep('tailor')}
          />
        )}

        {state.step === 'tailor' && (
          <StepTailor
            jobDescription={state.jobDescription}
            bullets={state.bullets}
            generating={generating}
            onJobDescriptionChange={(jobDescription) => patch({ jobDescription })}
            onGenerate={handleTailor}
          />
        )}

        {state.step === 'export' && (
          <StepExport
            tex={state.generatedTex}
            originalTex={state.originalTex}
            atsMatchPercent={state.atsMatchPercent}
            bullets={state.bullets}
            onTexChange={(generatedTex) => patch({ generatedTex })}
            onRetailer={() => setStep('tailor')}
            onCompile={handleCompile}
          />
        )}
      </div>
    </AppBackground>
  );
}
