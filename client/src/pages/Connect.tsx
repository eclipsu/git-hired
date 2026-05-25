import { Link } from 'react-router-dom';
import AppHeader from '../components/ui/AppHeader';
import AppBox from '../components/ui/AppBox';
import { AppIcon } from '../components/ui/AppLogo';
import { uiBtnClass } from '../components/ui/AppButton';

export default function Connect() {
  return (
    <div className="ui-page ui-page-muted">
      <AppHeader right={<Link to="/" className="ui-link text-sm text-white/80 hover:text-white">Home</Link>} />

      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <AppBox className="w-full max-w-[340px] text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ui-header-bg)] text-white">
            <AppIcon size={28} />
          </div>
          <h1 className="mt-4 text-xl font-semibold">Sign in to GitHired</h1>
          <p className="mt-2 text-sm text-[var(--ui-fg-muted)]">
            We'll analyze your repositories to build your resume. Read-only access.
          </p>
          <a href="/auth/github" className={`${uiBtnClass('primary')} mt-6 w-full`}>
            Continue with GitHub
          </a>
          <p className="mt-4 text-xs text-[var(--ui-fg-subtle)]">
            We never post or modify your GitHub account.
          </p>
          <Link to="/" className="ui-link mt-6 inline-block text-sm">
            ← Back to home
          </Link>
        </AppBox>
      </div>
    </div>
  );
}
