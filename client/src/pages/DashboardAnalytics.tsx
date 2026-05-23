import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import { copyToClipboard } from '../utils/clipboard';

interface ShareLinkRow {
  id: string;
  code: string;
  clickCount: number;
  createdAt: string;
  versionName: string;
  versionId: string;
}

export default function DashboardAnalytics() {
  const [links, setLinks] = useState<ShareLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/share', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setLinks(data as ShareLinkRow[]))
      .finally(() => setLoading(false));
  }, []);

  const totalClicks = links.reduce((sum, l) => sum + l.clickCount, 0);

  const copyLink = async (code: string) => {
    const url = `${window.location.origin}/post/${code}`;
    await copyToClipboard(url);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-bold text-[#7C3AED]">{totalClicks}</p>
          <p className="mt-1 text-sm text-gray-500">Total link clicks</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-bold text-blue-600">{links.length}</p>
          <p className="mt-1 text-sm text-gray-500">Active share links</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-3xl font-bold text-emerald-600">
            {links.length ? Math.round(totalClicks / links.length) : 0}
          </p>
          <p className="mt-1 text-sm text-gray-500">Avg clicks per link</p>
        </div>
      </div>

      {links.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No share links yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Save a resume version and click <strong>Get Link</strong> to create a short URL.
          </p>
          <Link to="/app" className="mt-3 inline-block cursor-pointer text-sm font-medium text-[#7C3AED] hover:underline">
            Go to resume builder →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Resume version</th>
                <th className="px-5 py-3 font-semibold">Short link</th>
                <th className="px-5 py-3 font-semibold">Clicks</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-5 py-4 font-medium text-gray-900">{l.versionName}</td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-500">/post/{l.code}</td>
                  <td className="px-5 py-4">
                    <span className="badge-purple">{l.clickCount}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-400">
                    {new Date(l.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => copyLink(l.code)}
                      className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-[#7C3AED] hover:underline"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied === l.code ? 'Copied ✓' : 'Copy link'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
