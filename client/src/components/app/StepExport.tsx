import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Loader2,
  Play,
  RefreshCw,
  X,
} from 'lucide-react';
import GlowButton from '../ui/GlowButton';
import PageTopBar from '../ui/PageTopBar';
import LatexEditor from './LatexEditor';
import { copyToClipboard } from '../../utils/clipboard';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';
import type { BulletItem } from '../../hooks/useAppState';
import type { ContactInfo } from '../../types/contact';

interface StepExportProps {
  tex: string;
  originalTex: string;
  atsMatchPercent: number;
  pageCount: number;
  fitIterations: number;
  fitWarning: string | null;
  bullets: BulletItem[];
  jobDescription: string;
  contactInfo: ContactInfo;
  onRetailer: () => void;
  onCompile: (tex: string) => Promise<Blob>;
  onTexChange: (tex: string) => void;
  onResetTex: () => void;
}

function defaultVersionName(jobDescription: string): string {
  const month = new Date().toLocaleString(undefined, { month: 'long' });
  const year = new Date().getFullYear();
  if (jobDescription.trim()) {
    return `${jobDescription.trim().split('\n')[0].slice(0, 40)} – ${month} ${year}`;
  }
  return `Resume – ${month} ${year}`;
}

export default function StepExport({
  tex,
  originalTex,
  atsMatchPercent,
  pageCount,
  fitIterations,
  fitWarning,
  jobDescription,
  contactInfo,
  onRetailer,
  onCompile,
  onTexChange,
  onResetTex,
}: StepExportProps) {
  const { copiedId, markCopied } = useCopyFeedback();
  const [editorTex, setEditorTex] = useState(tex);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [versionName, setVersionName] = useState(() => defaultVersionName(jobDescription));
  const [saving, setSaving] = useState(false);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [dividerPct, setDividerPct] = useState(50);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditorTex(tex);
  }, [tex]);

  const runCompile = useCallback(
    async (source: string) => {
      setCompiling(true);
      setCompileError(null);
      try {
        const blob = await onCompile(source);
        const url = URL.createObjectURL(blob);
        setPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err) {
        setCompileError(err instanceof Error ? err.message : 'Compile failed');
      } finally {
        setCompiling(false);
      }
    },
    [onCompile],
  );

  useEffect(() => {
    if (tex) runCompile(tex);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl],
  );

  const saveVersion = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/versions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: versionName, generatedTex: editorTex, jobDescription, contactInfo }),
      });
      if (!res.ok) throw new Error('Save failed');
      setCurrentVersionId(((await res.json()) as { id: string }).id);
    } catch (err) {
      setCompileError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const getShareLink = async () => {
    let versionId = currentVersionId;
    if (!versionId) {
      setSaving(true);
      const res = await fetch('/api/versions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: versionName, generatedTex: editorTex, jobDescription, contactInfo }),
      });
      setSaving(false);
      if (!res.ok) return;
      versionId = ((await res.json()) as { id: string }).id;
      setCurrentVersionId(versionId);
    }
    setSharing(true);
    try {
      const res = await fetch(`/api/versions/${versionId}/share`, { method: 'POST', credentials: 'include' });
      const data = (await res.json()) as { url: string };
      setShareUrl(data.url);
      await copyToClipboard(data.url);
      markCopied('share');
    } finally {
      setSharing(false);
    }
  };

  function handleMouseDown() {
    dragging.current = true;
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setDividerPct(Math.max(25, Math.min(75, pct)));
  }

  function handleMouseUp() {
    dragging.current = false;
  }

  const copyLatex = async () => {
    await copyToClipboard(editorTex);
    markCopied('latex');
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <PageTopBar
        centered
        back={{ label: 're-tailor', onClick: onRetailer }}
        right={
          <>
            <GlowButton onClick={copyLatex} variant="ghost" className="text-sm font-mono !px-3 !py-2">
              {copiedId === 'latex' ? <Check size={13} className="text-success" /> : <Copy size={13} />}
              {copiedId === 'latex' ? 'Copied!' : 'Copy LaTeX'}
            </GlowButton>
            <GlowButton
              onClick={() => {
                if (pdfUrl) {
                  const a = document.createElement('a');
                  a.href = pdfUrl;
                  a.download = 'resume.pdf';
                  a.click();
                }
              }}
              disabled={!pdfUrl}
              className="text-sm font-semibold !px-3 !py-2"
            >
              <Download size={13} />
              Download PDF
            </GlowButton>
          </>
        }
      />

      {(fitWarning || atsMatchPercent > 0) && (
        <div className="px-6 py-2 border-b border-border flex flex-wrap items-center gap-3 text-xs font-mono">
          {atsMatchPercent > 0 && (
            <span className="text-primary">ATS {atsMatchPercent}%</span>
          )}
          {pageCount === 1 && fitIterations > 0 && (
            <span className="text-success">Fitted in {fitIterations} pass{fitIterations === 1 ? '' : 'es'}</span>
          )}
          {fitWarning && <span className="text-destructive">{fitWarning}</span>}
          <Link to="/dashboard" className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
            Dashboard →
          </Link>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex flex-1 overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ userSelect: dragging.current ? 'none' : 'auto' }}
      >
        <div
          className="flex flex-col border-r border-border overflow-hidden flex-shrink-0"
          style={{ width: `${dividerPct}%` }}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card flex-shrink-0">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
              LaTeX Source
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => runCompile(editorTex)}
                disabled={compiling}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-secondary hover:bg-muted text-foreground text-xs font-mono transition-colors cursor-pointer disabled:opacity-50"
              >
                <Play size={11} className="text-success" /> Compile
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetTex();
                  setEditorTex(originalTex);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-secondary hover:bg-muted text-muted-foreground text-xs font-mono transition-colors cursor-pointer"
              >
                <RefreshCw size={11} /> Reset
              </button>
              <button
                type="button"
                onClick={copyLatex}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-secondary hover:bg-muted text-muted-foreground text-xs font-mono transition-colors cursor-pointer"
              >
                <Copy size={11} /> Copy
              </button>
            </div>
          </div>
          <div className="relative flex-1 overflow-hidden min-h-0 p-2">
            <LatexEditor
              value={editorTex}
              onChange={(v) => {
                setEditorTex(v);
                onTexChange(v);
              }}
            />
          </div>
        </div>

        <div
          className="w-1 cursor-col-resize flex-shrink-0 relative group"
          style={{ backgroundColor: '#30363D' }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-primary/20 transition-colors" />
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center px-4 py-2 border-b border-border bg-card flex-shrink-0">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
              Preview
            </span>
            {compiling && (
              <span className="ml-auto flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <Loader2 size={12} className="animate-spin" /> Compiling...
              </span>
            )}
          </div>
          <div className="flex-1 relative bg-[#F6F8FA] overflow-auto">
            {compiling && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            )}
            {pdfUrl ? (
              <iframe title="PDF preview" src={pdfUrl} className="w-full h-full min-h-[600px] bg-white" />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground font-mono">
                Compile to preview
              </div>
            )}
          </div>
          {(compileError || shareUrl) && (
            <div className="border-t border-border px-4 py-3 space-y-2">
              {compileError && (
                <div className="flex items-center gap-3 bg-destructive/10 rounded px-3 py-2">
                  <AlertCircle size={14} className="text-destructive flex-shrink-0" />
                  <span className="text-destructive text-xs font-mono flex-1">{compileError}</span>
                  <button type="button" onClick={() => setCompileError(null)} className="text-destructive hover:text-foreground cursor-pointer">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-card px-6 py-3 flex flex-wrap items-center gap-4 flex-shrink-0">
        <input
          type="text"
          value={versionName}
          onChange={(e) => setVersionName(e.target.value)}
          className="rounded border border-border bg-input px-3 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary/60 flex-1 min-w-[200px] max-w-xs"
          placeholder="Version name"
        />
        <GlowButton onClick={saveVersion} disabled={saving || !versionName.trim()} variant="ghost" className="text-sm font-mono">
          {saving ? 'Saving…' : 'Save version'}
        </GlowButton>
        <GlowButton onClick={getShareLink} disabled={sharing || saving} variant="ghost" className="text-sm font-mono">
          {sharing ? 'Creating…' : copiedId === 'share' ? 'Link copied!' : 'Share link'}
        </GlowButton>
      </div>
    </div>
  );
}
