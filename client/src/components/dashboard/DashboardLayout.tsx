import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Zap,
} from 'lucide-react';
import DesignLogo from '../ui/DesignLogo';
import GlowButton from '../ui/GlowButton';

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
        if (!res.ok) {
          navigate('/connect');
          return null;
        }
        return res.json() as Promise<UserProfile>;
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => navigate('/connect'));
  }, [navigate]);

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-8 py-4 flex items-center justify-between">
        <DesignLogo />
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono">
          ← home
        </Link>
      </div>

      <div className="flex min-h-[calc(100vh-65px)]">
        <aside className="hidden md:flex w-64 flex-shrink-0 flex-col border-r border-border p-6">
          {user && (
            <div className="flex items-center gap-3 mb-6">
              <img
                src={user.avatarUrl}
                alt=""
                className="w-10 h-10 rounded-full border-2 border-primary"
                style={{ boxShadow: '0 0 12px rgba(88,166,255,0.3)' }}
              />
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-semibold text-foreground">@{user.username}</p>
                <p className="text-xs text-muted-foreground font-mono">Your account</p>
              </div>
            </div>
          )}
          <nav className="flex flex-col gap-1">
            {SIDEBAR.map((item) => (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded font-mono text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <a
            href="/auth/logout"
            className="mt-auto flex items-center gap-2 px-3 py-2 rounded font-mono text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </a>
        </aside>

        <main className="flex-1 min-w-0 px-6 py-8 md:px-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              {user && (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-12 h-12 rounded-full border-2 border-primary md:hidden"
                  style={{ boxShadow: '0 0 12px rgba(88,166,255,0.3)' }}
                />
              )}
              <div className="flex-1">
                <h1 className="font-sans font-bold text-xl text-foreground">
                  {pageTitle === 'Overview' && user ? (
                    <>
                      Welcome back, <span className="text-primary font-mono">@{user.username}</span>
                    </>
                  ) : (
                    pageTitle
                  )}
                </h1>
                {user && pageTitle === 'Overview' && (
                  <p className="text-sm text-muted-foreground font-mono mt-0.5">Your resume dashboard</p>
                )}
              </div>
              <Link to="/app">
                <GlowButton className="font-semibold text-sm">
                  <Zap size={14} />
                  New resume
                </GlowButton>
              </Link>
            </div>
            <Outlet context={{ user } satisfies DashboardOutletContext} />
          </div>
        </main>
      </div>

      <nav className="md:hidden flex flex-wrap gap-2 px-4 py-3 border-t border-border bg-card">
        {SIDEBAR.map((item) => (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded font-mono text-xs border transition-colors ${
                isActive
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
