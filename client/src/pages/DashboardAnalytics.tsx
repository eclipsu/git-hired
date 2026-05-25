import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppBox, { AppLabel } from '../components/ui/AppBox';
import AppButton from '../components/ui/AppButton';
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

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <AppBox><p className="text-2xl font-semibold">{totalClicks}</p><p className="text-sm text-[var(--ui-fg-muted)]">Total clicks</p></AppBox>
        <AppBox><p className="text-2xl font-semibold">{links.length}</p><p className="text-sm text-[var(--ui-fg-muted)]">Active links</p></AppBox>
        <AppBox><p className="text-2xl font-semibold">{links.length ? Math.round(totalClicks / links.length) : 0}</p><p className="text-sm text-[var(--ui-fg-muted)]">Avg per link</p></AppBox>
      </div>

      {links.length === 0 ? (
        <AppBox className="py-12 text-center">
          <p className="text-[var(--ui-fg-muted)]">No share links yet.</p>
          <Link to="/app" className="ui-link mt-2 inline-block text-sm">Go to resume builder →</Link>
        </AppBox>
      ) : (
        <AppBox className="!p-0 overflow-hidden">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Link</th>
                <th>Clicks</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.id}>
                  <td className="font-medium">{l.versionName}</td>
                  <td className="font-mono text-xs text-[var(--ui-fg-muted)]">/post/{l.code}</td>
                  <td><AppLabel>{l.clickCount}</AppLabel></td>
                  <td className="text-[var(--ui-fg-muted)]">{new Date(l.createdAt).toLocaleDateString()}</td>
                  <td>
                    <AppButton variant="default" className="ui-btn-sm" onClick={async () => {
                      await copyToClipboard(`${window.location.origin}/post/${l.code}`);
                      setCopied(l.code);
                      setTimeout(() => setCopied(null), 2000);
                    }}>
                      {copied === l.code ? 'Copied' : 'Copy'}
                    </AppButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AppBox>
      )}
    </div>
  );
}
