import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import DesignLogo from '../components/ui/DesignLogo';
import GlowButton from '../components/ui/GlowButton';
import Spinner from '../components/ui/Spinner';

export default function SharePost() {
  const { code } = useParams<{ code: string }>();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    fetch(`/api/share/${code}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json() as Promise<{ name: string }>;
      })
      .then((data) => {
        setName(data.name);
        return fetch(`/api/share/${code}/pdf`);
      })
      .then(async (res) => {
        if (!res.ok) throw new Error('PDF unavailable');
        return res.blob();
      })
      .then((blob) => setPdfUrl(URL.createObjectURL(blob)))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b border-border px-8 py-4">
          <DesignLogo />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="h-10 w-10" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b border-border px-8 py-4">
          <DesignLogo />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-muted-foreground font-mono">{error}</p>
          <Link to="/" className="mt-4 text-sm text-primary hover:underline font-mono">
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border px-8 py-4 flex items-center justify-between">
        <DesignLogo />
        {pdfUrl && (
          <a href={pdfUrl} download="resume.pdf">
            <GlowButton className="text-sm font-semibold">
              <Download size={14} />
              Download PDF
            </GlowButton>
          </a>
        )}
      </div>
      <main className="flex-1 px-4 py-6">
        <div className="max-w-4xl mx-auto mb-4 rounded border border-border bg-card p-4">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Shared resume</p>
          <h1 className="mt-1 font-sans font-bold text-lg text-foreground">{name}</h1>
        </div>
        {pdfUrl ? (
          <iframe
            title={name}
            src={pdfUrl}
            className="mx-auto max-w-4xl h-[calc(100vh-180px)] w-full rounded border border-border bg-white"
          />
        ) : (
          <p className="text-center text-muted-foreground font-mono">PDF unavailable.</p>
        )}
      </main>
    </div>
  );
}
