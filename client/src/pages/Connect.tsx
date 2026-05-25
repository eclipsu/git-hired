import { Link } from 'react-router-dom';
import GitHubHeader from '../components/github/GitHubHeader';
import GitHubBox from '../components/github/GitHubBox';
import GitHubMark from '../components/github/GitHubMark';
import { ghBtnClass } from '../components/github/GitHubButton';

export default function Connect() {
  return (
    <div className="gh-page gh-page-muted">
      <GitHubHeader right={<Link to="/" className="gh-link text-sm text-white/80 hover:text-white">Home</Link>} />

      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <GitHubBox className="w-full max-w-[340px] text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gh-header-bg)] text-white">
            <GitHubMark size={28} />
          </div>
          <h1 className="mt-4 text-xl font-semibold">Sign in to GitHired</h1>
          <p className="mt-2 text-sm text-[var(--gh-fg-muted)]">
            We'll analyze your repositories to build your resume. Read-only access.
          </p>
          <a href="/auth/github" className={`${ghBtnClass('primary')} mt-6 w-full`}>
            Continue with GitHub
          </a>
          <p className="mt-4 text-xs text-[var(--gh-fg-subtle)]">
            We never post or modify your GitHub account.
          </p>
          <Link to="/" className="gh-link mt-6 inline-block text-sm">
            ← Back to home
          </Link>
        </GitHubBox>
      </div>
    </div>
  );
}
