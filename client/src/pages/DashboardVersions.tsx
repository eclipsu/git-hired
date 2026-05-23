import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MoreVertical } from 'lucide-react';
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
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Tailored Resumes</h3>
        <Link to="/app" className="btn-primary !rounded-lg !px-4 !py-2 !text-sm">
          New resume
        </Link>
      </div>

      {versions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No saved versions yet.</p>
          <Link to="/app" className="mt-2 inline-block cursor-pointer text-sm font-medium text-[#7C3AED] hover:underline">
            Create your first tailored resume →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {versions.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
            >
              <div>
                <p className="font-semibold text-gray-900">{v.name}</p>
                <p className="text-xs text-gray-400">
                  Saved{' '}
                  {new Date(v.createdAt).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {v.shareLinks?.[0] && (
                  <span className="badge-purple">{v.shareLinks[0].clickCount} clicks</span>
                )}
                <Link
                  to={`/dashboard/versions/${v.id}`}
                  className="btn-secondary !rounded-lg !px-3 !py-1.5 !text-sm"
                >
                  View
                </Link>
                <button type="button" className="cursor-pointer text-gray-400 hover:text-gray-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
