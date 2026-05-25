import { Link, NavLink } from 'react-router-dom';
import { GitHiredLogo } from './GitHubMark';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

interface GitHubHeaderProps {
  nav?: NavItem[];
  right?: React.ReactNode;
}

export default function GitHubHeader({ nav, right }: GitHubHeaderProps) {
  return (
    <header className="gh-header">
      <div className="gh-header-inner">
        <GitHiredLogo to="/dashboard" />

        {nav && nav.length > 0 && (
          <nav className="gh-header-nav">
            {nav.map((item) => (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `gh-header-nav-item${isActive ? ' gh-header-nav-item-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="gh-header-actions">
          {right}
        </div>
      </div>
    </header>
  );
}

export function GitHubSubNav({
  items,
}: {
  items: { key: string; label: string; active?: boolean; done?: boolean }[];
}) {
  return (
    <nav className="gh-subnav" aria-label="Progress">
      {items.map((item) => (
        <span
          key={item.key}
          className={`gh-subnav-item${item.active ? ' gh-subnav-item-active' : ''}${item.done ? ' gh-subnav-item-done' : ''}`}
        >
          {item.done && !item.active && <span className="gh-subnav-check">✓</span>}
          {item.label}
        </span>
      ))}
    </nav>
  );
}

export function GitHubLink({
  to,
  children,
  className = '',
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} className={`gh-link ${className}`}>
      {children}
    </Link>
  );
}
