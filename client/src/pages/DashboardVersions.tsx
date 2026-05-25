import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AppBox, { AppLabel } from '../components/ui/AppBox';
import Spinner from '../components/ui/Spinner';
import { uiBtnClass } from '../components/ui/AppButton';

interface ResumeVersion {
  id: string;
  name: string;
  createdAt: string;
  shareLinks?: { code: string; clickCount: number; url: string }[];
}

export default function DashboardVersions() {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/versions', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setVersions(data as ResumeVersion[]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Saved versions</h2>
        <Link to="/app" className={uiBtnClass('primary') + ' ui-btn-sm'}>New resume</Link>
      </div>

      {versions.length === 0 ? (
        <AppBox className="py-12 text-center">
          <p className="text-[var(--ui-fg-muted)]">No saved versions yet.</p>
          <Link to="/app" className="ui-link mt-2 inline-block text-sm">Create one →</Link>
        </AppBox>
      ) : (
        <ul className="space-y-2">
          {versions.map((v) => (
            <li key={v.id} className="ui-box-row items-center !py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{v.name}</p>
                <p className="text-xs text-[var(--ui-fg-muted)]">
                  {new Date(v.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {v.shareLinks?.[0] && <AppLabel>{v.shareLinks[0].clickCount} clicks</AppLabel>}
                <Link to={`/dashboard/versions/${v.id}`} className={uiBtnClass('default') + ' ui-btn-sm'}>View</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
