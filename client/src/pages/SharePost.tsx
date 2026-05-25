import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import GitHubHeader from '../components/github/GitHubHeader';
import GitHubBox from '../components/github/GitHubBox';
import Spinner from '../components/ui/Spinner';
import { ghBtnClass } from '../components/github/GitHubButton';

export default function SharePost() {
  const { code } = useParams<{ code: string }>();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    fetch(`/api/share/${code}`)
      .then(async (res) => { if (!res.ok) throw new Error('Not found'); return res.json() as Promise<{ name: string }>; })
      .then((data) => { setName(data.name); return fetch(`/api/share/${code}/pdf`); })
      .then(async (res) => { if (!res.ok) throw new Error('PDF unavailable'); return res.blob(); })
      .then((blob) => setPdfUrl(URL.createObjectURL(blob)))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

  if (loading) {
    return (
      <div className="gh-page">
        <GitHubHeader />
        <div className="flex min-h-[60vh] items-center justify-center"><Spinner className="h-10 w-10" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gh-page">
        <GitHubHeader />
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <p className="text-[var(--gh-fg-muted)]">{error}</p>
          <Link to="/" className="gh-link mt-4 text-sm">Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="gh-page gh-page-muted">
      <GitHubHeader
        right={pdfUrl ? (
          <a href={pdfUrl} download="resume.pdf" className={`${ghBtnClass('primary')} gh-btn-sm`}>Download PDF</a>
        ) : null}
      />
      <main className="gh-container py-6">
        <GitHubBox className="mb-4">
          <p className="text-xs font-semibold text-[var(--gh-fg-muted)]">Shared resume</p>
          <h1 className="text-lg font-semibold">{name}</h1>
        </GitHubBox>
        {pdfUrl ? (
          <iframe title={name} src={pdfUrl} className="h-[calc(100vh-180px)] w-full rounded-md border border-[var(--gh-border-default)] bg-white shadow-sm" />
        ) : (
          <p className="text-center text-[var(--gh-fg-muted)]">PDF unavailable.</p>
        )}
      </main>
    </div>
  );
}
