import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppBox from '../ui/AppBox';
import { AppFlash, AppLabel } from '../ui/AppBox';
import AppButton from '../ui/AppButton';
import { copyToClipboard } from '../../utils/clipboard';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';
import LatexEditor from './LatexEditor';
import Spinner from '../ui/Spinner';
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
  bullets,
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

  const plainTextResume = bullets.filter((b) => b.included).map((b) => `• ${b.text}`).join('\n');

  useEffect(() => { setEditorTex(tex); }, [tex]);

  const runCompile = useCallback(async (source: string) => {
    setCompiling(true);
    setCompileError(null);
    try {
      const blob = await onCompile(source);
      const url = URL.createObjectURL(blob);
      setPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
    } catch (err) {
      setCompileError(err instanceof Error ? err.message : 'Compile failed');
    } finally {
      setCompiling(false);
    }
  }, [onCompile]);

  useEffect(() => {
    if (tex) runCompile(tex);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

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

  return (
    <div className="ui-container-wide py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onRetailer} className="ui-link cursor-pointer text-sm">← Re-tailor</button>
        <AppLabel variant="accent">ATS {atsMatchPercent}%</AppLabel>
        {pageCount === 1 && fitIterations > 0 && (
          <AppLabel variant="success">Fitted in {fitIterations} pass{fitIterations === 1 ? '' : 'es'}</AppLabel>
        )}
        <Link to="/dashboard" className="ui-btn ui-btn-default ui-btn-sm ml-auto">Dashboard</Link>
      </div>

      {fitWarning && (
        <AppFlash variant="warn">{fitWarning}</AppFlash>
      )}

      <h2 className="text-base font-semibold">LaTeX editor & PDF</h2>
      <p className="mt-1 text-sm text-[var(--ui-fg-muted)]">Edit source, compile, and download.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <AppButton variant="primary" disabled={compiling} onClick={() => runCompile(editorTex)}>
          {compiling ? <><Spinner /> Compiling…</> : 'Compile PDF'}
        </AppButton>
        <AppButton variant="default" onClick={() => { onResetTex(); setEditorTex(originalTex); }}>Reset</AppButton>
        <AppButton variant="default" onClick={async () => { await copyToClipboard(editorTex); markCopied('latex'); }}>
          {copiedId === 'latex' ? 'Copied' : 'Copy LaTeX'}
        </AppButton>
        <AppButton variant="primary" disabled={!pdfUrl} onClick={() => { if (pdfUrl) { const a = document.createElement('a'); a.href = pdfUrl; a.download = 'resume.pdf'; a.click(); } }}>
          Download PDF
        </AppButton>
      </div>

      <div className="mt-4 grid gap-4 lg:h-[min(72vh,calc(100vh-14rem))] lg:grid-cols-2">
        <div className="flex h-[min(50vh,420px)] min-h-0 flex-col overflow-hidden rounded-md border border-[var(--ui-border-default)] bg-[var(--ui-canvas-subtle)] p-2 lg:h-auto">
          <p className="shrink-0 px-2 py-1 text-xs font-medium text-[var(--ui-fg-muted)]">LaTeX source</p>
          <div className="min-h-0 flex-1 overflow-hidden">
            <LatexEditor value={editorTex} onChange={(v) => { setEditorTex(v); onTexChange(v); }} />
          </div>
        </div>
        <div className="relative flex h-[min(60vh,520px)] min-h-0 flex-col overflow-hidden rounded-md border border-[var(--ui-border-default)] bg-[var(--ui-canvas-subtle)] p-4 lg:h-auto">
          <p className="mb-2 shrink-0 text-xs font-medium text-[var(--ui-fg-muted)]">PDF preview</p>
          {compiling && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-[var(--ui-canvas-subtle)]/90">
              <Spinner className="h-8 w-8" />
            </div>
          )}
          {pdfUrl ? (
            <iframe title="PDF preview" src={pdfUrl} className="min-h-0 flex-1 rounded-md bg-white" />
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-[var(--ui-fg-muted)]">Compile to preview</div>
          )}
        </div>
      </div>

      {compileError && <AppFlash variant="error">{compileError}</AppFlash>}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <AppBox className="text-center">
          <p className="text-sm font-semibold">Copy bullets</p>
          <AppButton variant="default" className="mt-3 w-full" onClick={async () => { await copyToClipboard(plainTextResume); markCopied('bullets'); }}>
            {copiedId === 'bullets' ? 'Copied' : 'Copy'}
          </AppButton>
        </AppBox>
        <AppBox className="text-center">
          <p className="text-sm font-semibold">Share link</p>
          <AppButton variant="default" className="mt-3 w-full" disabled={sharing || saving} onClick={getShareLink}>
            {sharing ? 'Creating…' : 'Get link'}
          </AppButton>
        </AppBox>
        <AppBox>
          <p className="text-sm font-semibold">Save version</p>
          <input type="text" value={versionName} onChange={(e) => setVersionName(e.target.value)} className="ui-input mt-2" />
          <AppButton variant="primary" className="mt-3 w-full" disabled={saving || !versionName.trim()} onClick={saveVersion}>
            {saving ? 'Saving…' : 'Save'}
          </AppButton>
        </AppBox>
      </div>

      {shareUrl && <p className="mt-4 text-center font-mono text-xs text-[var(--ui-fg-muted)]">{copiedId === 'share' ? 'Link copied!' : shareUrl}</p>}
    </div>
  );
}
