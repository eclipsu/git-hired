import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Connect() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-900 text-white">
          <i className="fa-brands fa-github text-3xl" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-gray-900">Connect your GitHub account</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          We'll analyze your repositories, commits, and pull requests to build your resume.
        </p>
        <a href="/auth/github" className="btn-primary mt-8 w-full">
          <i className="fa-brands fa-github" />
          Continue with GitHub
        </a>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Lock className="h-3.5 w-3.5" />
          We never post or make changes to your GitHub.
        </p>
        <Link to="/" className="mt-6 inline-block cursor-pointer text-sm text-gray-500 hover:text-gray-900">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
