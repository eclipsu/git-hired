import { useEffect, useState } from 'react';
import GitHubBox from '../github/GitHubBox';
import Spinner from '../ui/Spinner';

const STEPS = [
  'Fetching repositories',
  'Analyzing commits',
  'Identifying key contributions',
  'Extracting technologies',
  'Generating resume bullets',
  'Optimizing for impact',
];

interface AnalyzeLoadingProps {
  active?: boolean;
}

export default function AnalyzeLoading({ active = true }: AnalyzeLoadingProps) {
  const [completedStep, setCompletedStep] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    setCompletedStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setCompletedStep(i + 1), (i + 1) * 900));
    });
    return () => timers.forEach(clearTimeout);
  }, [active]);

  const activeIndex = Math.min(completedStep, STEPS.length - 1);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <GitHubBox className="w-full max-w-lg">
        <h2 className="text-base font-semibold">Analyzing your GitHub activity</h2>
        <p className="mt-1 text-sm text-[var(--gh-fg-muted)]">This usually takes 30–60 seconds.</p>

        <ul className="mt-6 space-y-3">
          {STEPS.map((label, i) => {
            const done = completedStep > i;
            const isActive = !done && activeIndex === i;
            return (
              <li key={label} className="flex items-center gap-3 text-sm">
                {done ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gh-success-subtle)] text-[var(--gh-success-fg)] text-xs">✓</span>
                ) : isActive ? (
                  <Spinner />
                ) : (
                  <span className="h-5 w-5 rounded-full border border-[var(--gh-border-default)]" />
                )}
                <span className={done || isActive ? 'text-[var(--gh-fg-default)]' : 'text-[var(--gh-fg-subtle)]'}>
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </GitHubBox>
    </div>
  );
}
