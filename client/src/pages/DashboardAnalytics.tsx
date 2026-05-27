import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GlowButton from '../components/ui/GlowButton';
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
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total clicks', value: totalClicks },
          { label: 'Active links', value: links.length },
          { label: 'Avg per link', value: links.length ? Math.round(totalClicks / links.length) : 0 },
        ].map((c) => (
          <div key={c.label} className="rounded border border-border bg-card p-4">
            <p className="text-2xl font-semibold text-foreground font-mono">{c.value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground font-mono uppercase tracking-widest">{c.label}</p>
          </div>
        ))}
      </div>

      {links.length === 0 ? (
        <div className="rounded border border-border bg-card py-12 text-center">
          <p className="text-muted-foreground font-mono text-sm">No share links yet.</p>
          <Link to="/app" className="mt-2 inline-block text-sm text-primary hover:underline font-mono">
            Go to resume builder →
          </Link>
        </div>
      ) : (
        <div className="rounded border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-mono text-xs text-muted-foreground uppercase tracking-widest">Version</th>
                <th className="text-left px-4 py-3 font-mono text-xs text-muted-foreground uppercase tracking-widest">Link</th>
                <th className="text-left px-4 py-3 font-mono text-xs text-muted-foreground uppercase tracking-widest">Clicks</th>
                <th className="text-left px-4 py-3 font-mono text-xs text-muted-foreground uppercase tracking-widest">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{l.versionName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">/post/{l.code}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex text-xs font-mono px-2 py-0.5 rounded-sm border border-primary/30 bg-primary/5 text-primary">
                      {l.clickCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {new Date(l.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <GlowButton
                      variant="ghost"
                      className="!px-3 !py-1.5 text-xs font-mono"
                      onClick={async () => {
                        await copyToClipboard(`${window.location.origin}/post/${l.code}`);
                        setCopied(l.code);
                        setTimeout(() => setCopied(null), 2000);
                      }}
                    >
                      {copied === l.code ? 'Copied' : 'Copy'}
                    </GlowButton>
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
