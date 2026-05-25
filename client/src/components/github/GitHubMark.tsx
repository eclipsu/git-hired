import { Link } from 'react-router-dom';

interface GitHubMarkProps {
  className?: string;
  size?: number;
}

/** Simplified Octocat silhouette for branding */
export default function GitHubMark({ className = '', size = 32 }: GitHubMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 98 96"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.051-5.182-.079-9.747-13.59 2.934-16.465-5.851-16.465-5.851-2.22-5.635-5.517-7.134-5.517-7.134-4.692-3.192.354-3.125.354-3.125 5.187.364 7.922 5.323 7.922 5.323 4.613 7.806 12.111 5.549 15.062 4.239.465-3.295 1.805-5.549 3.286-6.821-10.725-1.221-22.003-5.361-22.003-23.827 0-5.262 1.879-9.568 4.965-12.936-.498-1.221-2.152-6.15.471-12.813 0 0 4.047-1.303 13.26 4.936a46.312 46.312 0 0 1 12.214-1.641c4.142.019 8.316.558 12.214 1.641 9.212-6.239 13.257-4.936 13.257-4.936 2.627 6.663.973 11.592.475 12.813 3.09 3.368 4.962 7.674 4.962 12.936 0 18.513-11.288 22.597-22.034 23.797 1.732 1.496 3.284 4.441 3.284 8.978 0 6.483-.059 11.703-.059 13.298 0 1.301.881 2.864 3.346 2.375C84.001 89.385 98 70.991 98 49.217 98 22 76.135 0 49.217 0h-.363z"
      />
    </svg>
  );
}

export function GitHiredLogo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="gh-logo">
      <GitHubMark size={32} />
      <span className="gh-logo-text">GitHired</span>
    </Link>
  );
}
