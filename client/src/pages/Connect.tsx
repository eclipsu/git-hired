import { Link } from 'react-router-dom';
import DesignLogo from '../components/ui/DesignLogo';
import GlowButton from '../components/ui/GlowButton';
import GitHubIcon from '../components/ui/GitHubIcon';

export default function Connect() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(48,54,61,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(48,54,61,0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(88,166,255,0.07) 0%, transparent 70%)' }}
      />

      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-border/50">
        <DesignLogo />
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono">
          ← home
        </Link>
      </nav>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded border border-border bg-card p-8 text-center">
          <div
            className="mx-auto w-14 h-14 rounded-full border-2 border-primary flex items-center justify-center bg-secondary"
            style={{ boxShadow: '0 0 12px rgba(88,166,255,0.3)' }}
          >
            <GitHubIcon size={28} />
          </div>
          <h1 className="mt-6 font-sans font-bold text-xl text-foreground">Sign in to git-apply</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ll analyze your repositories to build your resume. Read-only access.
          </p>
          <a href="/auth/github" className="block mt-6">
            <GlowButton className="w-full justify-center font-semibold">
              <GitHubIcon size={18} />
              Continue with GitHub
            </GlowButton>
          </a>
          <p className="mt-4 text-xs text-muted-foreground font-mono">
            We never post or modify your GitHub account.
          </p>
          <Link to="/" className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground font-mono transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
