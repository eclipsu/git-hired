import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnalyzeLoading from '../components/ui/AnalyzeLoading';
import AppBackground from '../components/app/AppBackground';
import AppNav from '../components/app/AppNav';
import StepAnalyze from '../components/app/StepAnalyze';
import StepEnrich from '../components/app/StepEnrich';
import StepBullets from '../components/app/StepBullets';
import StepTailor from '../components/app/StepTailor';
import StepExport from '../components/app/StepExport';
import {
  STEP_ORDER,
  useAppState,
  type AppStep,
  type BulletItem,
  type RepoItem,
} from '../hooks/useAppState';
import { useContactChat } from '../hooks/useContactChat';
import { computeAtsMatch, tailoredResumeToText } from '../utils/atsMatch';
import type { ContactInfo } from '../types/contact';
import type { TailoredResume } from '../types/resume';

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
  return items;
}

interface SessionPayload {
  selectedRepos: string[];
  bullets: Record<string, string[]>;
  displayNames: Record<string, string>;
  selectedBullets?: BulletItem[] | null;
  uploadedResumeText: string | null;
  uploadedResumeFilename: string | null;
  userNotes: string;
  contactInfo: ContactInfo | null;
  generatedTex: string | null;
  tailoredResume: TailoredResume | null;
  jobDescription?: string;
}

export default function AppPage() {
  const navigate = useNavigate();
  const { state, setStep, patch } = useAppState();
  const [reposLoading, setReposLoading] = useState(true);
  const [reposFromCache, setReposFromCache] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeCacheHint, setAnalyzeCacheHint] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionLoaded = useRef(false);
  const savedContactRef = useRef<ContactInfo | null>(null);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const {
    contactInfo,
    messages: chatMessages,
    pendingField: pendingChatField,
    extracting: extractingProfile,
    complete: contactComplete,
    initContactFromResume,
    resetContactInit,
    applyParsedContact,
    sendMessage: onChatSend,
    updateField: onContactFieldChange,
  } = useContactChat(state.user?.username);

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
    if (!state.user || sessionLoaded.current) return;

    fetch('/api/session', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<SessionPayload>;
      })
      .then((session) => {
        if (!session) return;

        if (session.bullets && Object.keys(session.bullets).length > 0) {
          const displayNames = session.displayNames ?? {};
          if (session.selectedBullets?.length) {
            patch({ bullets: session.selectedBullets });
          } else {
            patch({
              bullets: bulletsFromResponse(session.bullets, displayNames),
            });
          }
        }

        savedContactRef.current = session.contactInfo;

        if (session.uploadedResumeText) {
          patch({
            parsedResume: {
              text: session.uploadedResumeText,
              filename: session.uploadedResumeFilename ?? 'resume.pdf',
            },
          });
          initContactFromResume(
            session.contactInfo,
            session.uploadedResumeText,
            true,
          );
        }

        if (session.userNotes) {
          patch({ notes: session.userNotes });
        }

        if (session.generatedTex) {
          patch({
            generatedTex: session.generatedTex,
            originalTex: session.generatedTex,
          });
        }

        if (session.tailoredResume) {
          patch({ tailoredResume: session.tailoredResume });
        }

        if (session.jobDescription) {
          patch({ jobDescription: session.jobDescription });
        }

        sessionLoaded.current = true;
      })
      .catch(() => {});
  }, [state.user, patch, initContactFromResume]);

  useEffect(() => {
    if (state.step !== 'enrich' || !state.parsedResume?.text) return;
    initContactFromResume(savedContactRef.current, state.parsedResume.text);
  }, [state.step, state.parsedResume?.text, initContactFromResume]);

  useEffect(() => {
    if (!state.user) return;
    setReposLoading(true);

    fetch('/api/repos', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load repositories');
        return res.json() as Promise<{
          repos: {
            name: string;
            description: string | null;
            primaryLanguage: string | null;
            stars: number;
            commitCount: number;
          }[];
          fromCache: boolean;
        }>;
      })
      .then(async (data) => {
        setReposFromCache(data.fromCache);

        let selectedNames: string[] = [];
        try {
          const sessionRes = await fetch('/api/session', { credentials: 'include' });
          if (sessionRes.ok) {
            const session = (await sessionRes.json()) as SessionPayload;
            selectedNames = session.selectedRepos ?? [];
          }
        } catch {
          selectedNames = [];
        }

        const repos: RepoItem[] = data.repos.map((r, i) => ({
          ...r,
          displayName: r.name,
          selected: selectedNames.length > 0 ? selectedNames.includes(r.name) : i < 6,
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

  const handleNotesChange = useCallback(
    (notes: string) => {
      patch({ notes });
      clearTimeout(notesTimer.current);
      notesTimer.current = setTimeout(() => {
        fetch('/api/session/notes', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        }).catch(() => {});
      }, 500);
    },
    [patch],
  );

  const handleAnalyze = async () => {
    const selected = state.repos.filter((r) => r.selected);
    if (selected.length === 0) return;

    setAnalyzing(true);
    setError(null);
    setAnalyzeCacheHint(null);

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

      const { bullets, displayNames, cachedRepos, analyzedRepos } = (await res.json()) as {
        bullets: Record<string, string[]>;
        displayNames: Record<string, string>;
        cachedRepos?: string[];
        analyzedRepos?: string[];
      };

      if (cachedRepos?.length && !analyzedRepos?.length) {
        setAnalyzeCacheHint('Loaded bullets from cache — no GitHub or AI calls needed.');
      } else if (cachedRepos?.length && analyzedRepos?.length) {
        setAnalyzeCacheHint(
          `Used cache for ${cachedRepos.length} repo(s), analyzed ${analyzedRepos.length} changed repo(s).`,
        );
      }

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
      const { text, filename, contactInfo: extractedContact } = (await res.json()) as {
        text: string;
        filename: string;
        contactInfo?: ContactInfo | null;
      };
      resetContactInit();
      patch({ parsedResume: { text, filename } });
      savedContactRef.current = extractedContact ?? null;
      applyParsedContact(extractedContact, text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed');
    } finally {
      setParsing(false);
    }
  };

  const saveBullets = async (bullets: BulletItem[]) => {
    await fetch('/api/session/bullets', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bullets }),
    });
  };

  const handleTailor = async () => {
    setGenerating(true);
    setError(null);

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
          contactInfo,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Tailor failed');
      }

      const { generatedTex, tailoredResume } = (await res.json()) as {
        generatedTex: string;
        tailoredResume: TailoredResume;
      };
      const atsMatchPercent = computeAtsMatch(
        state.jobDescription,
        tailoredResumeToText(tailoredResume),
      );
      patch({
        generatedTex,
        originalTex: generatedTex,
        tailoredResume,
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

      <div key={analyzing ? 'loading' : state.step} className={transitionClass}>
        {state.step === 'analyze' && analyzing ? (
          <AnalyzeLoading active={analyzing} />
        ) : state.step === 'analyze' ? (
          <StepAnalyze
            repos={state.repos}
            loading={reposLoading}
            analyzing={analyzing}
            fromCache={reposFromCache}
            cacheHint={analyzeCacheHint}
            onToggle={toggleRepo}
            onDisplayNameChange={setDisplayName}
            onAnalyze={handleAnalyze}
          />
        ) : null}

        {state.step === 'enrich' && (
          <StepEnrich
            bullets={state.bullets}
            notes={state.notes}
            parsedResume={state.parsedResume}
            parsing={parsing}
            contactInfo={contactInfo}
            chatMessages={chatMessages}
            pendingChatField={pendingChatField}
            extractingProfile={extractingProfile}
            contactComplete={contactComplete}
            onNotesChange={handleNotesChange}
            onFileSelect={handleParseResume}
            onContactFieldChange={onContactFieldChange}
            onChatSend={onChatSend}
            onContinue={() => setStep('bullets')}
          />
        )}

        {state.step === 'bullets' && (
          <StepBullets
            bullets={state.bullets}
            onChange={(bullets) => patch({ bullets })}
            onContinue={async (bullets) => {
              patch({ bullets });
              await saveBullets(bullets);
              setStep('tailor');
            }}
          />
        )}

        {state.step === 'tailor' && (
          <StepTailor
            jobDescription={state.jobDescription}
            bullets={state.bullets}
            contactInfo={contactInfo}
            generating={generating}
            onJobDescriptionChange={(jobDescription) => patch({ jobDescription })}
            onGenerate={handleTailor}
          />
        )}

        {state.step === 'export' && (
          <StepExport
            tex={state.generatedTex}
            atsMatchPercent={state.atsMatchPercent}
            bullets={state.bullets}
            tailoredResume={state.tailoredResume}
            jobDescription={state.jobDescription}
            contactInfo={contactInfo}
            onRetailer={() => setStep('tailor')}
            onCompile={handleCompile}
          />
        )}
      </div>
    </AppBackground>
  );
}
