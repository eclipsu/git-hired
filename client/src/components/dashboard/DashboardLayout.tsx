import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Sparkles,
} from 'lucide-react';
import AppHeader from '../ui/AppHeader';

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
    <div className="ui-page">
      <AppHeader
        right={
          user ? (
            <img src={user.avatarUrl} alt="" className="ui-avatar" />
          ) : null
        }
      />

      <div className="ui-layout">
        <aside className="ui-sidebar hidden md:block">
          {user && (
            <div className="mb-4 flex items-center gap-3 px-3">
              <img src={user.avatarUrl} alt="" className="ui-avatar" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.username}</p>
                <p className="text-xs text-[var(--ui-fg-muted)]">Your account</p>
              </div>
            </div>
          )}
          <nav className="ui-sidebar-nav">
            {SIDEBAR.map((item) => (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `ui-sidebar-item${isActive ? ' ui-sidebar-item-active' : ''}`
                }
              >
                <item.icon className="h-4 w-4 shrink-0 text-[var(--ui-fg-muted)]" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <a href="/auth/logout" className="ui-sidebar-item mt-4 text-[var(--ui-fg-muted)]">
            <LogOut className="h-4 w-4" />
            Sign out
          </a>
        </aside>

        <main className="ui-main">
          <div className="ui-page-header">
            <h1 className="ui-page-title">{pageTitle}</h1>
            {user && (
              <p className="ui-page-desc">
                Signed in as <strong>{user.username}</strong>
              </p>
            )}
          </div>
          <Outlet context={{ user } satisfies DashboardOutletContext} />
        </main>
      </div>

      <nav className="ui-mobile-nav md:hidden">
        {SIDEBAR.map((item) => (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `ui-btn ui-btn-sm ${isActive ? 'ui-btn-default' : 'ui-btn-invisible'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
