import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, FileText, Link2, MoreVertical } from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboard';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';
import ResumePreview from '../resume/ResumePreview';
import Spinner from '../ui/Spinner';
import type { BulletItem } from '../../hooks/useAppState';
import type { ContactInfo } from '../../types/contact';
import type { TailoredResume } from '../../types/resume';

interface StepExportProps {
  tex: string;
  atsMatchPercent: number;
  bullets: BulletItem[];
  tailoredResume: TailoredResume | null;
  jobDescription: string;
  contactInfo: ContactInfo;
  onRetailer: () => void;
  onCompile: (tex: string) => Promise<Blob>;
}

interface SavedVersion {
  id: string;
  name: string;
  createdAt: string;
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
  atsMatchPercent,
  bullets,
  tailoredResume,
  jobDescription,
  contactInfo,
  onRetailer,
  onCompile,
}: StepExportProps) {
  const { copiedId, markCopied } = useCopyFeedback();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [versionName, setVersionName] = useState(() => defaultVersionName(jobDescription));
  const [saving, setSaving] = useState(false);
  const [savedVersions, setSavedVersions] = useState<SavedVersion[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const plainTextResume = useMemo(
    () => bullets.filter((b) => b.included).map((b) => `• ${b.text}`).join('\n'),
    [bullets],
  );

  const loadVersions = () => {
    fetch('/api/versions', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setSavedVersions(data as SavedVersion[]))
      .catch(() => {});
  };

  useEffect(() => { loadVersions(); }, []);

  const handleCompile = async () => {
    setCompiling(true);
    setCompileError(null);
    try {
      const blob = await onCompile(tex);
      const url = URL.createObjectURL(blob);
      setPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
    } catch (err) {
      setCompileError(err instanceof Error ? err.message : 'Compile failed');
    } finally {
      setCompiling(false);
    }
  };

  useEffect(() => { if (tex) handleCompile(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

  const saveVersion = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/versions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: versionName, generatedTex: tex, jobDescription, contactInfo }),
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
        body: JSON.stringify({ name: versionName, generatedTex: tex, jobDescription, contactInfo }),
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
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onRetailer} className="cursor-pointer text-sm text-gray-500 hover:text-gray-900">
          ← Re-tailor
        </button>
        <span className="rounded-full bg-purple-50 px-3 py-0.5 text-xs font-semibold text-[#7C3AED]">
          ATS match {atsMatchPercent}%
        </span>
        <Link to="/dashboard" className="btn-secondary ml-auto !rounded-lg !text-xs">Dashboard</Link>
      </div>

      <h2 className="text-center text-2xl font-semibold text-gray-900">Your resume is ready! 🎉</h2>

      <div className="relative mt-8 rounded-2xl bg-gray-900 p-6 lg:p-10">
        {compiling && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-gray-900/80">
            <Spinner className="h-10 w-10 !text-white" />
          </div>
        )}
        <div className="mx-auto max-w-3xl">
          {pdfUrl ? (
            <iframe title="PDF" src={pdfUrl} className="h-[520px] w-full rounded-xl bg-white shadow-2xl" />
          ) : (
            <ResumePreview
              contactInfo={contactInfo}
              bullets={bullets}
              tailoredResume={tailoredResume}
              className="shadow-2xl"
            />
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
          <FileText className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-3 text-sm font-semibold text-gray-900">Download PDF</p>
          <p className="text-xs text-gray-500">ATS-Optimized PDF</p>
          <button type="button" disabled={!pdfUrl} onClick={downloadPdf} className="btn-primary mt-4 w-full !rounded-lg !py-2 !text-sm">
            Download
          </button>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
          <Copy className="mx-auto h-8 w-8 text-gray-700" />
          <p className="mt-3 text-sm font-semibold text-gray-900">Copy to Clipboard</p>
          <p className="text-xs text-gray-500">Plain text format</p>
          <button
            type="button"
            onClick={async () => { await copyToClipboard(plainTextResume); markCopied('bullets'); }}
            className="btn-secondary mt-4 w-full !text-sm"
          >
            {copiedId === 'bullets' ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
          <Link2 className="mx-auto h-8 w-8 text-[#7C3AED]" />
          <p className="mt-3 text-sm font-semibold text-gray-900">Share Link</p>
          <p className="text-xs text-gray-500">Share with anyone</p>
          <button type="button" disabled={sharing || saving} onClick={getShareLink} className="btn-secondary mt-4 w-full !text-sm">
            {sharing ? 'Creating…' : 'Get Link'}
          </button>
        </div>
      </div>

      {shareUrl && (
        <p className="mt-4 text-center font-mono text-xs text-gray-500">
          {copiedId === 'share' ? 'Link copied to clipboard!' : shareUrl}
        </p>
      )}

      <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Save this tailored resume for future use.</p>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <button type="button" disabled={saving || !versionName.trim()} onClick={saveVersion} className="btn-accent !rounded-lg !px-5 !py-2 !text-sm">
            {saving ? 'Saving…' : 'Save Version'}
          </button>
        </div>
        <h3 className="mt-6 text-sm font-semibold text-gray-900">Your Saved Versions</h3>
        <ul className="mt-3 space-y-2">
          {savedVersions.slice(0, 5).map((v) => (
            <li key={v.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{v.name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(v.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/dashboard/versions/${v.id}`} className="cursor-pointer text-xs font-medium text-[#7C3AED] hover:underline">View</Link>
                <button type="button" className="cursor-pointer text-gray-400 hover:text-gray-600"><MoreVertical className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {compileError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {compileError}
        </div>
      )}
    </div>
  );
}
