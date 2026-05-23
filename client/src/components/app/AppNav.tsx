import { Link } from 'react-router-dom';
import { STEP_LABELS, STEP_ORDER, type AppStep } from '../../hooks/useAppState';

interface AppNavProps {
  current: AppStep;
  completed: AppStep[];
}

export default function AppNav({ current, completed }: AppNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <Link to="/dashboard" className="cursor-pointer text-lg font-bold text-gray-900 cursor-pointer">
          <span className="cursor-pointer">
            GitHired
          </span>
        </Link>

        <nav className="hidden flex-wrap items-center justify-center gap-1 md:flex">
          {STEP_ORDER.filter((s) => s !== 'connect').map((step) => {
            const isActive = step === current;
            const isDone = completed.includes(step);
            return (
              <span
                key={step}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : isDone
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-400'
                }`}
              >
                {isDone && !isActive ? '✓ ' : ''}
                {STEP_LABELS[step]}
              </span>
            );
          })}
        </nav>

        <Link to="/dashboard" className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-900">
          Dashboard
        </Link>
      </div>
    </header>
  );
}
