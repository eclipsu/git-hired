import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Copy, Download, Link2 } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import { copyToClipboard } from '../utils/clipboard';

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
      .then(async (r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json() as Promise<VersionDetail>;
      })
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
      .then(async (res) => {
        if (!res.ok) return null;
        return res.blob();
      })
      .then((blob) => {
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setPdfUrl(objectUrl);
        }
      })
      .finally(() => setCompiling(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [version?.generatedTex]);

  const getShareLink = async () => {
    if (!id) return;
    setSharing(true);
    try {
      const res = await fetch(`/api/versions/${id}/share`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = (await res.json()) as { url: string };
      setShareUrl(data.url);
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!version) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Version not found.</p>
        <Link to="/dashboard/versions" className="mt-2 inline-block cursor-pointer text-sm font-medium text-[#7C3AED] hover:underline">
          ← Back to tailored resumes
        </Link>
      </div>
    );
  }

  const existingLink = version.shareLinks?.[0];
  const activeUrl = shareUrl ?? existingLink?.url ?? (existingLink ? `${window.location.origin}/post/${existingLink.code}` : null);

  return (
    <div>
      <Link to="/dashboard/versions" className="cursor-pointer text-sm text-gray-500 hover:text-gray-900">
        ← Tailored resumes
      </Link>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{version.name}</h3>
      <p className="text-sm text-gray-400">
        Saved {new Date(version.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {pdfUrl && (
          <a href={pdfUrl} download="resume.pdf" className="btn-primary !rounded-lg !px-4 !py-2 !text-sm">
            <Download className="h-4 w-4" />
            Download PDF
          </a>
        )}
        <button
          type="button"
          onClick={getShareLink}
          disabled={sharing}
          className="btn-primary !rounded-lg !px-4 !py-2 !text-sm"
        >
          <Link2 className="h-4 w-4" />
          {sharing ? 'Creating…' : existingLink || shareUrl ? 'Get link' : 'Create share link'}
        </button>
        {activeUrl && (
          <button
            type="button"
            onClick={async () => {
              await copyToClipboard(activeUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="btn-secondary !text-sm"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied ✓' : 'Copy link'}
          </button>
        )}
      </div>

      {activeUrl && (
        <p className="mt-3 font-mono text-sm text-gray-500">
          {activeUrl}
          {existingLink && ` · ${existingLink.clickCount} clicks`}
        </p>
      )}

      <div className="relative mt-8 rounded-2xl bg-gray-900 p-6 lg:p-8">
        {compiling && (
          <div className="flex justify-center py-20">
            <Spinner className="h-10 w-10 !text-white" />
          </div>
        )}
        {!compiling && pdfUrl && (
          <iframe title={version.name} src={pdfUrl} className="mx-auto h-[640px] w-full max-w-3xl rounded-xl bg-white shadow-2xl" />
        )}
        {!compiling && !pdfUrl && (
          <p className="py-12 text-center text-sm text-gray-400">PDF preview unavailable. Install pdflatex to compile resumes.</p>
        )}
      </div>
    </div>
  );
}
