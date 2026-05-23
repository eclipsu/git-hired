import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
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
        if (!res.ok) throw new Error('Resume not found');
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
      .then((blob) => {
        setPdfUrl(URL.createObjectURL(blob));
      })
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
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <Spinner className="h-10 w-10 !text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4">
        <p className="text-gray-400">{error}</p>
        <Link to="/" className="mt-4 cursor-pointer text-sm font-medium text-[#7C3AED] hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Shared resume</p>
              <h1 className="text-lg font-semibold text-white">{name}</h1>
            </div>
          </div>
          {pdfUrl && (
            <a
              href={pdfUrl}
              download="resume.pdf"
              className="btn-primary !rounded-lg !px-4 !py-2 !text-sm"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 p-6 lg:p-10">
        {pdfUrl ? (
          <iframe
            title={name}
            src={pdfUrl}
            className="h-[calc(100vh-140px)] w-full rounded-xl bg-white shadow-2xl"
          />
        ) : (
          <p className="text-center text-gray-400">PDF preview unavailable.</p>
        )}
      </main>
    </div>
  );
}
