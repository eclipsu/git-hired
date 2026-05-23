import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  FileText,
  FolderGit2,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
} from 'lucide-react';

interface UserProfile {
  username: string;
  avatarUrl: string;
}

export interface DashboardOutletContext {
  user: UserProfile | null;
}

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app', label: 'My Resume', icon: FileText },
  { to: '/dashboard/versions', label: 'Tailored Resumes', icon: Sparkles },
  { to: '/dashboard', label: 'Projects', icon: FolderGit2, end: true },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard', label: 'Settings', icon: Settings, end: true },
];

const PAGE_SUBTITLES: Record<string, string> = {
  '/dashboard': "Here's your GitHub summary",
  '/dashboard/versions': 'All saved resume versions',
  '/dashboard/analytics': 'Track clicks on your shared resume links',
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

  const subtitle = PAGE_SUBTITLES[location.pathname] ?? "Manage your resumes";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white px-3 py-6 md:flex">
        <h1 className="px-3 text-lg font-bold text-gray-900">GitHired</h1>
        <nav className="mt-8 flex-1 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={`${item.to}-${item.label}`}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive && item.label !== 'Projects' && item.label !== 'Settings'
                    ? 'bg-purple-50 text-[#7C3AED]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <a href="/auth/logout" className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900">
          <LogOut className="h-4 w-4" />
          Log out
        </a>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Welcome back{user ? `, ${user.username}` : ''} 👋
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
          </div>
          {user && (
            <img src={user.avatarUrl} alt="" className="h-10 w-10 cursor-pointer rounded-full ring-2 ring-purple-100" />
          )}
        </header>
        <main className="flex-1 p-6">
          <Outlet context={{ user } satisfies DashboardOutletContext} />
        </main>
      </div>
    </div>
  );
}
