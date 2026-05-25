import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Sparkles,
} from 'lucide-react';
import GitHubHeader from '../github/GitHubHeader';

interface UserProfile {
  username: string;
  avatarUrl: string;
}

export interface DashboardOutletContext {
  user: UserProfile | null;
}

const SIDEBAR = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app', label: 'Resume builder', icon: FileText },
  { to: '/dashboard/versions', label: 'Saved versions', icon: Sparkles },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/versions': 'Saved versions',
  '/dashboard/analytics': 'Analytics',
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) { navigate('/connect'); return null; }
        return res.json() as Promise<UserProfile>;
      })
      .then((data) => { if (data) setUser(data); })
      .catch(() => navigate('/connect'));
  }, [navigate]);

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Dashboard';

  return (
    <div className="gh-page">
      <GitHubHeader
        right={
          user ? (
            <img src={user.avatarUrl} alt="" className="gh-avatar" />
          ) : null
        }
      />

      <div className="gh-layout">
        <aside className="gh-sidebar hidden md:block">
          {user && (
            <div className="mb-4 flex items-center gap-3 px-3">
              <img src={user.avatarUrl} alt="" className="gh-avatar" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.username}</p>
                <p className="text-xs text-[var(--gh-fg-muted)]">Your account</p>
              </div>
            </div>
          )}
          <nav className="gh-sidebar-nav">
            {SIDEBAR.map((item) => (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `gh-sidebar-item${isActive ? ' gh-sidebar-item-active' : ''}`
                }
              >
                <item.icon className="h-4 w-4 shrink-0 text-[var(--gh-fg-muted)]" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <a href="/auth/logout" className="gh-sidebar-item mt-4 text-[var(--gh-fg-muted)]">
            <LogOut className="h-4 w-4" />
            Sign out
          </a>
        </aside>

        <main className="gh-main">
          <div className="gh-page-header">
            <h1 className="gh-page-title">{pageTitle}</h1>
            {user && (
              <p className="gh-page-desc">
                Signed in as <strong>{user.username}</strong>
              </p>
            )}
          </div>
          <Outlet context={{ user } satisfies DashboardOutletContext} />
        </main>
      </div>

      <nav className="gh-mobile-nav md:hidden">
        {SIDEBAR.map((item) => (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `gh-btn gh-btn-sm ${isActive ? 'gh-btn-default' : 'gh-btn-invisible'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
