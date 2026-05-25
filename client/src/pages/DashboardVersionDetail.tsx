import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import GitHubBox from '../components/github/GitHubBox';
import GitHubButton from '../components/github/GitHubButton';
import Spinner from '../components/ui/Spinner';
import { copyToClipboard } from '../utils/clipboard';
import { ghBtnClass } from '../components/github/GitHubButton';

interface VersionDetail {
  id: string;
  name: string;
  generatedTex: string;
  createdAt: string;
  shareLinks: { code: string; clickCount: number; url: string }[];
}

export default function DashboardVersionDetail() {
  const { id } = useParams<{ id: string }>();
  const [version, setVersion] = useState<VersionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/versions/${id}`, { credentials: 'include' })
      .then(async (r) => { if (!r.ok) throw new Error(); return r.json() as Promise<VersionDetail>; })
      .then(setVersion)
      .catch(() => setVersion(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!version?.generatedTex) return;
    let objectUrl: string | null = null;
    setCompiling(true);
    fetch('/api/compile', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tex: version.generatedTex }),
    })
      .then(async (res) => (res.ok ? res.blob() : null))
      .then((blob) => { if (blob) { objectUrl = URL.createObjectURL(blob); setPdfUrl(objectUrl); } })
      .finally(() => setCompiling(false));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [version?.generatedTex]);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  if (!version) {
    return (
      <div className="py-20 text-center">
        <p className="text-[var(--gh-fg-muted)]">Version not found.</p>
        <Link to="/dashboard/versions" className="gh-link mt-2 inline-block text-sm">← Back</Link>
      </div>
    );
  }

  const existingLink = version.shareLinks?.[0];
  const activeUrl = shareUrl ?? existingLink?.url ?? (existingLink ? `${window.location.origin}/post/${existingLink.code}` : null);

  return (
    <div>
      <Link to="/dashboard/versions" className="gh-link text-sm">← Saved versions</Link>
      <h2 className="mt-4 text-base font-semibold">{version.name}</h2>
      <p className="text-sm text-[var(--gh-fg-muted)]">{new Date(version.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {pdfUrl && <a href={pdfUrl} download="resume.pdf" className={ghBtnClass('primary') + ' gh-btn-sm'}>Download PDF</a>}
        <GitHubButton variant="primary" className="gh-btn-sm" disabled={sharing} onClick={async () => {
          if (!id) return;
          setSharing(true);
          try {
            const res = await fetch(`/api/versions/${id}/share`, { method: 'POST', credentials: 'include' });
            setShareUrl(((await res.json()) as { url: string }).url);
          } finally { setSharing(false); }
        }}>{sharing ? 'Creating…' : 'Share link'}</GitHubButton>
        {activeUrl && (
          <GitHubButton variant="default" className="gh-btn-sm" onClick={async () => {
            await copyToClipboard(activeUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}>{copied ? 'Copied' : 'Copy link'}</GitHubButton>
        )}
      </div>

      {activeUrl && <p className="mt-2 font-mono text-xs text-[var(--gh-fg-muted)]">{activeUrl}{existingLink && ` · ${existingLink.clickCount} clicks`}</p>}

      <GitHubBox className="relative mt-6 !p-4">
        {compiling && <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>}
        {!compiling && pdfUrl && <iframe title={version.name} src={pdfUrl} className="mx-auto h-[640px] w-full max-w-3xl rounded-md border border-[var(--gh-border-default)] bg-white" />}
        {!compiling && !pdfUrl && <p className="py-12 text-center text-sm text-[var(--gh-fg-muted)]">PDF preview unavailable.</p>}
      </GitHubBox>
    </div>
  );
}
