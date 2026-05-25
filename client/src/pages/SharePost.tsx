import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppHeader from '../components/ui/AppHeader';
import AppBox from '../components/ui/AppBox';
import Spinner from '../components/ui/Spinner';
import { uiBtnClass } from '../components/ui/AppButton';

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
      <div className="ui-page">
        <AppHeader />
        <div className="flex min-h-[60vh] items-center justify-center"><Spinner className="h-10 w-10" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ui-page">
        <AppHeader />
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <p className="text-[var(--ui-fg-muted)]">{error}</p>
          <Link to="/" className="ui-link mt-4 text-sm">Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-page ui-page-muted">
      <AppHeader
        right={pdfUrl ? (
          <a href={pdfUrl} download="resume.pdf" className={`${uiBtnClass('primary')} ui-btn-sm`}>Download PDF</a>
        ) : null}
      />
      <main className="ui-container py-6">
        <AppBox className="mb-4">
          <p className="text-xs font-semibold text-[var(--ui-fg-muted)]">Shared resume</p>
          <h1 className="text-lg font-semibold">{name}</h1>
        </AppBox>
        {pdfUrl ? (
          <iframe title={name} src={pdfUrl} className="h-[calc(100vh-180px)] w-full rounded-md border border-[var(--ui-border-default)] bg-white shadow-sm" />
        ) : (
          <p className="text-center text-[var(--ui-fg-muted)]">PDF unavailable.</p>
        )}
      </main>
    </div>
  );
}
