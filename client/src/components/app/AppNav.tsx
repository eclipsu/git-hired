import { STEP_LABELS, STEP_ORDER, type AppStep } from '../../hooks/useAppState';

interface AppNavProps {
  current: AppStep;
  completed: AppStep[];
}

export default function AppNav({ current, completed }: AppNavProps) {
  return (
    <header className="border-b border-[#E8E8E4] bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <span className="font-hero text-lg font-semibold text-[#1a1a1a]">GitHired</span>

        <nav className="hidden flex-wrap items-center justify-center gap-2 md:flex">
          {STEP_ORDER.map((step) => {
            const isActive = step === current;
            const isDone = completed.includes(step);
            return (
              <span
                key={step}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1a1a1a] text-white'
                    : isDone
                      ? 'border border-[#8BA888] text-[#5A7A6A]'
                      : 'text-[#64748B]'
                }`}
              >
                {isDone && !isActive ? '✓ ' : ''}
                {STEP_LABELS[step]}
              </span>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
