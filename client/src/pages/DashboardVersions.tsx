import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Check, ChevronRight, Clock, GitCommit } from 'lucide-react';
import GlowButton from '../components/ui/GlowButton';
import Spinner from '../components/ui/Spinner';

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
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
          Your resume sessions
        </h2>
        <Link to="/app">
          <GlowButton className="text-sm font-semibold">New resume</GlowButton>
        </Link>
      </div>

      {versions.length === 0 ? (
        <div className="rounded border border-border bg-card py-12 text-center">
          <p className="text-muted-foreground font-mono text-sm">No saved versions yet.</p>
          <Link to="/app" className="mt-2 inline-block text-sm text-primary hover:underline font-mono">
            Create one →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <Link
              key={v.id}
              to={`/dashboard/versions/${v.id}`}
              className="block w-full text-left p-4 rounded border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-sans font-medium text-foreground group-hover:text-primary transition-colors">
                    {v.name}
                  </p>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                      <Clock size={11} />
                      {new Date(v.createdAt).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {v.shareLinks?.[0] && (
                      <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                        <GitCommit size={11} /> {v.shareLinks[0].clickCount} clicks
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-xs font-mono text-success">
                      <Check size={11} /> complete
                    </span>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted-foreground group-hover:text-primary transition-colors mt-1 flex-shrink-0"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
