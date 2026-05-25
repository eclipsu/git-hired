import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, FileText, Link2, Loader2, RotateCcw } from 'lucide-react';
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

  const loadVersions = () => {
    fetch('/api/versions', { credentials: 'include' }).catch(() => {});
  };

  useEffect(() => { loadVersions(); }, []);
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

  const handleEditorChange = (value: string) => {
    setEditorTex(value);
    onTexChange(value);
  };

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
      const data = (await res.json()) as { id: string };
      setCurrentVersionId(data.id);
      loadVersions();
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
      loadVersions();
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

  const downloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'resume.pdf';
    a.click();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onRetailer} className="cursor-pointer text-sm text-gray-500 hover:text-gray-900">
          ← Re-tailor
        </button>
        <span className="rounded-full bg-purple-50 px-3 py-0.5 text-xs font-semibold text-[#7C3AED]">
          ATS match {atsMatchPercent}%
        </span>
        <Link to="/dashboard" className="btn-secondary ml-auto !rounded-lg !text-xs">Dashboard</Link>
      </div>

      <h2 className="text-xl font-semibold text-gray-900">LaTeX editor & PDF preview</h2>
      <p className="mt-1 text-sm text-gray-500">Edit the source, compile, and download. Resume targets one page.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={compiling} onClick={() => runCompile(editorTex)} className="btn-primary !rounded-lg !py-2 !text-sm">
          {compiling ? <><Loader2 className="h-4 w-4 animate-spin" /> Compiling…</> : 'Compile PDF'}
        </button>
        <button type="button" onClick={() => { onResetTex(); setEditorTex(originalTex); }} className="btn-secondary !rounded-lg !py-2 !text-sm">
          <RotateCcw className="h-4 w-4" />
          Reset LaTeX
        </button>
        <button type="button" onClick={async () => { await copyToClipboard(editorTex); markCopied('latex'); }} className="btn-secondary !rounded-lg !py-2 !text-sm">
          <Copy className="h-4 w-4" />
          {copiedId === 'latex' ? 'Copied ✓' : 'Copy LaTeX'}
        </button>
        <button type="button" disabled={!pdfUrl} onClick={downloadPdf} className="btn-accent !rounded-lg !py-2 !text-sm">
          <FileText className="h-4 w-4" />
          Download PDF
        </button>
      </div>

      <div className="mt-4 grid min-h-[70vh] gap-4 lg:grid-cols-2">
        <div className="flex min-h-[420px] flex-col rounded-xl border border-gray-200 bg-gray-900 p-2 shadow-sm lg:min-h-0">
          <p className="px-2 py-1 text-xs font-medium text-gray-400">LaTeX source</p>
          <div className="min-h-[380px] flex-1 lg:min-h-0">
            <LatexEditor value={editorTex} onChange={handleEditorChange} />
          </div>
        </div>
        <div className="relative flex min-h-[420px] flex-col rounded-xl border border-gray-200 bg-gray-900 p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium text-gray-400">PDF preview</p>
          {compiling && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-gray-900/80">
              <Spinner className="h-10 w-10 !text-white" />
            </div>
          )}
          {pdfUrl ? (
            <iframe title="PDF preview" src={pdfUrl} className="min-h-[380px] flex-1 rounded-lg bg-white" />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-500">Click Compile PDF</div>
          )}
        </div>
      </div>

      {compileError && (
        <div className="mt-4 whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {compileError}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
          <Copy className="mx-auto h-8 w-8 text-gray-700" />
          <p className="mt-3 text-sm font-semibold text-gray-900">Copy bullets</p>
          <button type="button" onClick={async () => { await copyToClipboard(plainTextResume); markCopied('bullets'); }} className="btn-secondary mt-4 w-full !text-sm">
            {copiedId === 'bullets' ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
          <Link2 className="mx-auto h-8 w-8 text-[#7C3AED]" />
          <p className="mt-3 text-sm font-semibold text-gray-900">Share link</p>
          <button type="button" disabled={sharing || saving} onClick={getShareLink} className="btn-secondary mt-4 w-full !text-sm">
            {sharing ? 'Creating…' : 'Get link'}
          </button>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Save version</p>
          <input type="text" value={versionName} onChange={(e) => setVersionName(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          <button type="button" disabled={saving || !versionName.trim()} onClick={saveVersion} className="btn-accent mt-3 w-full !rounded-lg !py-2 !text-sm">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {shareUrl && <p className="mt-4 text-center font-mono text-xs text-gray-500">{copiedId === 'share' ? 'Link copied!' : shareUrl}</p>}
    </div>
  );
}
