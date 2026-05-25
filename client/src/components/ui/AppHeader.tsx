import { Link, NavLink } from 'react-router-dom';
import { GitHiredLogo } from './AppLogo';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

interface AppHeaderProps {
  nav?: NavItem[];
  right?: React.ReactNode;
}

export default function AppHeader({ nav, right }: AppHeaderProps) {
  return (
    <header className="ui-header">
      <div className="ui-header-inner">
        <GitHiredLogo to="/dashboard" />

        {nav && nav.length > 0 && (
          <nav className="ui-header-nav">
            {nav.map((item) => (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `ui-header-nav-item${isActive ? ' ui-header-nav-item-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="ui-header-actions">{right}</div>
      </div>
    </header>
  );
}

export function AppSubNav({
  items,
}: {
  items: { key: string; label: string; active?: boolean; done?: boolean }[];
}) {
  return (
    <nav className="ui-subnav" aria-label="Progress">
      {items.map((item) => (
        <span
          key={item.key}
          className={`ui-subnav-item${item.active ? ' ui-subnav-item-active' : ''}${item.done ? ' ui-subnav-item-done' : ''}`}
        >
          {item.done && !item.active && <span className="ui-subnav-check">✓</span>}
          {item.label}
        </span>
      ))}
    </nav>
  );
}

export function AppLink({
  to,
  children,
  className = '',
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} className={`ui-link ${className}`}>
      {children}
    </Link>
  );
}
